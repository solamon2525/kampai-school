-- ============================================================================
-- Migration 042: Rewards ownership + term-scoped points + balance snapshot
-- ============================================================================
-- เพิ่ม:
-- (A) owner_staff_id / owner_administrator_id ใน rewards (NULL = รางวัลกลาง)
-- (B) academic_year / semester / balance_after / approved_by_* ใน reward_claims
-- (C) academic_year / semester ใน waste_transactions (backfill current term)
-- (D) school_settings keys: active_academic_year, active_semester
-- (E) Rebuild waste_student_summary — filter ตาม active term
-- (F) Update claim_reward RPC — tag term + snapshot balance_after
-- (G) New RPC: get_student_history (public, by student code)
-- (H) RLS: can_approve_reward → owner-only หรือ central หรือ admin
-- ============================================================================

-- ─── (A) Rewards ownership ─────────────────────────────────────────────────
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS owner_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rewards_owner_xor'
  ) THEN
    ALTER TABLE public.rewards ADD CONSTRAINT rewards_owner_xor CHECK (
      NOT (owner_staff_id IS NOT NULL AND owner_administrator_id IS NOT NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rewards_owner_staff
  ON public.rewards(owner_staff_id) WHERE owner_staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_owner_admin
  ON public.rewards(owner_administrator_id) WHERE owner_administrator_id IS NOT NULL;

-- ─── (B) Reward claims: term + balance snapshot + approver ─────────────────
ALTER TABLE public.reward_claims
  ADD COLUMN IF NOT EXISTS academic_year TEXT,
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS balance_after INT,
  ADD COLUMN IF NOT EXISTS approved_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reward_claims_term
  ON public.reward_claims(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_reward_claims_student_date
  ON public.reward_claims(student_id, claimed_at DESC);

-- ─── (C) Waste transactions: term tagging ──────────────────────────────────
ALTER TABLE public.waste_transactions
  ADD COLUMN IF NOT EXISTS academic_year TEXT,
  ADD COLUMN IF NOT EXISTS semester TEXT;

CREATE INDEX IF NOT EXISTS idx_waste_txn_term
  ON public.waste_transactions(academic_year, semester);

-- Backfill: existing rows → ปัจจุบัน (เทอม 1/2569) เพื่อให้ balance เดิมยังคงนับ
UPDATE public.waste_transactions
   SET academic_year = '2569', semester = '1'
 WHERE academic_year IS NULL;

UPDATE public.reward_claims
   SET academic_year = '2569', semester = '1'
 WHERE academic_year IS NULL;

-- ─── (D) Active term ใน school_settings ────────────────────────────────────
INSERT INTO public.school_settings (key, value, category, description) VALUES
  ('active_academic_year', '2569', 'academic', 'ปีการศึกษาปัจจุบัน (ใช้ filter แต้ม/คะแนน)'),
  ('active_semester',      '1',    'academic', 'เทอมปัจจุบัน (1 หรือ 2)')
ON CONFLICT (key) DO NOTHING;

-- helper function: ดึงเทอมปัจจุบัน
CREATE OR REPLACE FUNCTION public.active_term()
RETURNS TABLE (year TEXT, sem TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT value FROM school_settings WHERE key='active_academic_year' LIMIT 1) AS year,
    (SELECT value FROM school_settings WHERE key='active_semester'      LIMIT 1) AS sem
$$;
REVOKE ALL ON FUNCTION public.active_term() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_term() TO anon, authenticated;

-- ─── (E) Rebuild waste_student_summary — filter ตาม active term ────────────
DROP VIEW IF EXISTS public.waste_student_summary;
CREATE VIEW public.waste_student_summary AS
WITH term AS (SELECT year, sem FROM active_term())
SELECT
  s.id            AS student_id,
  s.name          AS full_name,
  s.class         AS class_name,
  s.photo_url,
  s.student_code,
  COALESCE(SUM(wt.quantity)
    FILTER (WHERE wt.academic_year = term.year AND wt.semester = term.sem), 0)::int AS total_items,
  COALESCE(SUM(wt.points_earned)
    FILTER (WHERE wt.academic_year = term.year AND wt.semester = term.sem), 0)::int AS total_points_earned,
  COALESCE((
    SELECT SUM(rc.points_used)
      FROM reward_claims rc, term t
     WHERE rc.student_id = s.id
       AND rc.status = 'approved'::reward_claim_status
       AND rc.academic_year = t.year AND rc.semester = t.sem
  ), 0)::int AS total_points_spent,
  (
    COALESCE(SUM(wt.points_earned)
      FILTER (WHERE wt.academic_year = term.year AND wt.semester = term.sem), 0)
    - COALESCE((
        SELECT SUM(rc.points_used)
          FROM reward_claims rc, term t
         WHERE rc.student_id = s.id
           AND rc.status = ANY (ARRAY['pending'::reward_claim_status, 'approved'::reward_claim_status])
           AND rc.academic_year = t.year AND rc.semester = t.sem
      ), 0)
  )::int AS available_points,
  COUNT(DISTINCT wt.id)
    FILTER (WHERE wt.academic_year = term.year AND wt.semester = term.sem)::int AS total_transactions
FROM students s
CROSS JOIN term
LEFT JOIN waste_transactions wt ON wt.student_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code, term.year, term.sem;

-- ─── (F) Updated claim_reward — tag term + snapshot balance_after ──────────
CREATE OR REPLACE FUNCTION public.claim_reward(p_code TEXT, p_reward_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_balance    INT;
  v_reward     RECORD;
  v_claim_id   UUID;
  v_year       TEXT;
  v_sem        TEXT;
BEGIN
  SELECT year, sem INTO v_year, v_sem FROM active_term();

  -- 1. lookup student + balance ใน term ปัจจุบัน
  SELECT s.student_id, s.available_points
    INTO v_student_id, v_balance
    FROM public.waste_student_summary s
   WHERE s.student_code = p_code
   LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 2. lock + read reward
  SELECT r.id, r.name, r.points_cost, r.stock, r.is_active
    INTO v_reward
    FROM public.rewards r
   WHERE r.id = p_reward_id
     FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  -- 3. balance check
  IF v_balance < v_reward.points_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  -- 4. stock check (NULL = unlimited)
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  -- 5. insert claim พร้อม term + balance_after
  INSERT INTO public.reward_claims
    (student_id, reward_id, reward_name, points_used, status,
     academic_year, semester, balance_after)
  VALUES
    (v_student_id, v_reward.id, v_reward.name, v_reward.points_cost, 'pending',
     v_year, v_sem, v_balance - v_reward.points_cost)
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_reward(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reward(TEXT, UUID) TO anon, authenticated;

-- ─── (G) get_student_history — public RPC ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_student_history(p_code TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  claim_id      UUID,
  reward_name   TEXT,
  reward_image  TEXT,
  points_used   INT,
  balance_after INT,
  status        reward_claim_status,
  claimed_at    TIMESTAMPTZ,
  academic_year TEXT,
  semester      TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    rc.id,
    rc.reward_name,
    r.image_url,
    rc.points_used,
    rc.balance_after,
    rc.status,
    rc.claimed_at,
    rc.academic_year,
    rc.semester
  FROM reward_claims rc
  JOIN students s ON s.id = rc.student_id
  LEFT JOIN rewards r ON r.id = rc.reward_id
  WHERE s.student_code = p_code
  ORDER BY rc.claimed_at DESC
  LIMIT p_limit
$$;
REVOKE ALL ON FUNCTION public.get_student_history(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_history(TEXT, INT) TO anon, authenticated;

-- ─── (H) RLS scoping: approver = owner OR central OR admin ─────────────────
CREATE OR REPLACE FUNCTION public.can_approve_reward(p_reward_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM rewards r
       WHERE r.id = p_reward_id AND (
         -- รางวัลกลาง: ทุกคนที่มี role อนุมัติได้
         (r.owner_staff_id IS NULL AND r.owner_administrator_id IS NULL AND public.is_teacher())
         -- เจ้าของจริงๆ (staff)
         OR r.owner_staff_id IN (
            SELECT staff_id FROM user_roles WHERE user_id = auth.uid()
         )
         -- เจ้าของจริงๆ (administrator)
         OR r.owner_administrator_id IN (
            SELECT administrator_id FROM user_roles WHERE user_id = auth.uid()
         )
       )
    )
$$;
REVOKE ALL ON FUNCTION public.can_approve_reward(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_approve_reward(UUID) TO authenticated;

-- reward_claims policies
DROP POLICY IF EXISTS "Approvers update reward_claims" ON public.reward_claims;
CREATE POLICY "Approvers update reward_claims" ON public.reward_claims
  FOR UPDATE
  USING (public.can_approve_reward(reward_id))
  WITH CHECK (public.can_approve_reward(reward_id));

DROP POLICY IF EXISTS "Read reward_claims by scope" ON public.reward_claims;
CREATE POLICY "Read reward_claims by scope" ON public.reward_claims
  FOR SELECT
  USING (public.is_admin() OR public.can_approve_reward(reward_id));

-- rewards policies: ทุกคน login สร้างได้, แก้/ลบเฉพาะ owner หรือ admin
DROP POLICY IF EXISTS "Login create rewards" ON public.rewards;
CREATE POLICY "Login create rewards" ON public.rewards
  FOR INSERT WITH CHECK (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Owner update rewards" ON public.rewards;
CREATE POLICY "Owner update rewards" ON public.rewards
  FOR UPDATE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    OR owner_administrator_id IN (SELECT administrator_id FROM user_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner delete rewards" ON public.rewards;
CREATE POLICY "Owner delete rewards" ON public.rewards
  FOR DELETE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    OR owner_administrator_id IN (SELECT administrator_id FROM user_roles WHERE user_id = auth.uid())
  );
-- Rewards SELECT ยังเป็น public (catalog หน้าเปิดดูได้ทุกคน) — policy เดิมยังอยู่

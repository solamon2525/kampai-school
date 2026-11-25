-- ============================================================================
-- Migration 590: Conduct Term 2 Backfill, Auto-Term Trigger, get_top_heroes Pending Fix,
--                classroom_goals Schema Sync & Privilege Redemption Security
-- ============================================================================

-- 1. Backfill misfiled Nov 2026 rows (created >= Term 2 opening day 2026-11-02) & trim recorder whitespace
UPDATE public.conduct_scores
SET semester = '2'
WHERE academic_year = '2569'
  AND semester = '1'
  AND created_at >= '2026-11-02T00:00:00+07';

UPDATE public.conduct_scores
SET recorded_by = regexp_replace(recorded_by, '^[\s\t]+|[\s\t]+$', '', 'g')
WHERE recorded_by ~ '^[\s\t]|[\s\t]$';

-- 2. Drop stale DEFAULT '1' on semester & auto-fill active term on INSERT when academic_year or semester omitted
ALTER TABLE public.conduct_scores ALTER COLUMN semester DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.conduct_scores_set_active_term()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_term RECORD;
BEGIN
  IF NULLIF(trim(NEW.academic_year), '') IS NULL OR NULLIF(trim(NEW.semester), '') IS NULL THEN
    SELECT year, sem INTO v_term FROM public.active_term();
    NEW.academic_year := COALESCE(NULLIF(trim(NEW.academic_year), ''), v_term.year, (EXTRACT(YEAR FROM NOW()) + 543)::text);
    NEW.semester := COALESCE(NULLIF(trim(NEW.semester), ''), v_term.sem, '1');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS conduct_scores_set_active_term_trg ON public.conduct_scores;
CREATE TRIGGER conduct_scores_set_active_term_trg
BEFORE INSERT ON public.conduct_scores
FOR EACH ROW EXECUTE FUNCTION public.conduct_scores_set_active_term();

-- 3. Align get_top_heroes available_points with lookup_student_balance (subtract pending reward_claims)
CREATE OR REPLACE FUNCTION public.get_top_heroes(
  limit_val integer DEFAULT 10,
  p_academic_year text DEFAULT NULL::text,
  p_semester text DEFAULT NULL::text
)
RETURNS TABLE(
  student_id uuid,
  name text,
  class text,
  photo_url text,
  total_xp bigint,
  deeds_count bigint,
  available_points bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT := NULLIF(trim(p_academic_year), '');
  v_sem TEXT := NULLIF(trim(p_semester), '');
BEGIN
  IF v_year IS NULL THEN
    SELECT year INTO v_year FROM public.active_term();
    v_year := COALESCE(v_year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
  END IF;

  RETURN QUERY
  WITH conduct_agg AS (
    SELECT
      s.id AS student_id,
      s.name,
      s.class,
      s.photo_url,
      COALESCE(SUM(
        CASE
          WHEN cs.type = 'add' THEN cs.score
          WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score
          ELSE 0
        END
      ), 0)::BIGINT AS total_xp,
      COALESCE(COUNT(cs.id) FILTER (WHERE cs.type = 'add'), 0)::BIGINT AS deeds_count,
      COALESCE(SUM(
        CASE
          WHEN cs.type = 'add' THEN cs.score
          ELSE -cs.score
        END
      ), 0)::BIGINT AS net_after_conduct
    FROM public.students s
    LEFT JOIN public.conduct_scores cs ON s.id = cs.student_id
      AND cs.academic_year = v_year
      AND (v_sem IS NULL OR cs.semester = v_sem)
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.class, s.photo_url
  ),
  pending_claims AS (
    SELECT
      rc.student_id,
      COALESCE(SUM(rc.virtue_points_used), 0)::BIGINT AS pending_virtue
    FROM public.reward_claims rc
    WHERE rc.academic_year = v_year
      AND (v_sem IS NULL OR rc.semester = v_sem)
      AND rc.status = 'pending'::public.reward_claim_status
    GROUP BY rc.student_id
  )
  SELECT
    c.student_id,
    c.name,
    c.class,
    c.photo_url,
    c.total_xp,
    c.deeds_count,
    GREATEST(0, c.net_after_conduct - COALESCE(p.pending_virtue, 0))::BIGINT AS available_points
  FROM conduct_agg c
  LEFT JOIN pending_claims p ON p.student_id = c.student_id
  WHERE c.total_xp > 0
  ORDER BY c.total_xp DESC, c.deeds_count DESC
  LIMIT limit_val;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_top_heroes(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_heroes(integer, text, text) TO anon, authenticated, service_role;

-- 4. Deploy classroom_goals (matching conduct.service.ts & 068 schema) & get_classroom_xp_sum (matching 078 signature)
CREATE TABLE IF NOT EXISTS public.classroom_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class text NOT NULL,
  room text NOT NULL DEFAULT '1',
  target_xp integer NOT NULL DEFAULT 5000,
  reward text NOT NULL DEFAULT 'วันดูหนังร่วมกัน (Movie Day) 🍿',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class, room)
);

ALTER TABLE public.classroom_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read classroom_goals" ON public.classroom_goals;
CREATE POLICY "Allow public read classroom_goals"
  ON public.classroom_goals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow staff manage classroom_goals" ON public.classroom_goals;
CREATE POLICY "Allow staff manage classroom_goals"
  ON public.classroom_goals FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

REVOKE ALL ON public.classroom_goals FROM PUBLIC;
GRANT SELECT ON public.classroom_goals TO anon;
GRANT ALL ON public.classroom_goals TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_classroom_goals_lookup ON public.classroom_goals(class, room);

INSERT INTO public.classroom_goals (class, room, target_xp, reward)
VALUES
  ('อ.1', '1', 2000, 'วันเล่านิทานแสนสนุกและขนมอร่อย 🧸'),
  ('อ.2', '1', 2000, 'วันระบายสีและของเล่นแสนสนุก 🎨'),
  ('อ.3', '1', 2500, 'วันฉายการ์ตูนและไอศกรีมแสนอร่อย 🍦'),
  ('ป.1', '1', 3000, 'วันฉายการ์ตูนและขนมแสนอร่อย 🍭'),
  ('ป.2', '1', 3500, 'วันปิกนิกใต้ต้นไม้ใหญ่ 🌳'),
  ('ป.3', '1', 4000, 'กิจกรรมศิลปะสร้างสรรค์และไอศกรีม 🎨'),
  ('ป.4', '1', 4500, 'วันนำบอร์ดเกมมาเล่นร่วมกัน 🎲'),
  ('ป.5', '1', 5000, 'วันดูภาพยนตร์ (Movie Day) และป๊อปคอร์น 🍿'),
  ('ป.6', '1', 5000, 'ปาร์ตี้หมูกระทะฉลองปีการศึกษา 🍜')
ON CONFLICT (class, room) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_classroom_xp_sum(
  class_name text,
  room_name text DEFAULT '1'::text,
  sem text DEFAULT NULL::text,
  year text DEFAULT NULL::text
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sem TEXT := NULLIF(trim(sem), '');
  v_year TEXT := NULLIF(trim(year), '');
  v_term RECORD;
  v_total BIGINT;
BEGIN
  IF v_sem IS NULL OR v_year IS NULL THEN
    SELECT t.year, t.sem INTO v_term FROM public.active_term() t;
    v_year := COALESCE(v_year, v_term.year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
    v_sem := COALESCE(v_sem, v_term.sem, '1');
  END IF;

  SELECT COALESCE(SUM(sub.student_net_xp), 0)::BIGINT
  INTO v_total
  FROM (
    SELECT
      s.id,
      GREATEST(0, COALESCE(SUM(
        CASE
          WHEN cs.type = 'add' THEN cs.score
          WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score
          ELSE 0
        END
      ), 0))::BIGINT AS student_net_xp
    FROM public.students s
    LEFT JOIN public.conduct_scores cs
      ON cs.student_id = s.id
      AND cs.academic_year = v_year
      AND cs.semester = v_sem
    WHERE s.is_active = true
      AND s.class = class_name
      AND (
        room_name IS NULL
        OR trim(room_name) = ''
        OR COALESCE(NULLIF(trim(s.room), ''), '1') = trim(room_name)
      )
    GROUP BY s.id
  ) sub;

  RETURN COALESCE(v_total, 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_classroom_xp_sum(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_classroom_xp_sum(text, text, text, text) TO anon, authenticated, service_role;

-- 5. Harden privilege_redemptions RLS & redeem_classroom_privilege verification
DROP POLICY IF EXISTS "Student redeem privileges" ON public.privilege_redemptions;

DROP FUNCTION IF EXISTS public.redeem_classroom_privilege(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION public.redeem_classroom_privilege(
  p_privilege_id uuid,
  p_student_id uuid,
  p_academic_year text DEFAULT NULL::text,
  p_semester text DEFAULT NULL::text,
  p_student_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_privilege RECORD;
  v_term RECORD;
  v_year TEXT := NULLIF(trim(p_academic_year), '');
  v_sem TEXT := NULLIF(trim(p_semester), '');
  v_virtue_earned INTEGER;
  v_virtue_spent INTEGER;
  v_virtue_balance INTEGER;
  v_conduct_id UUID;
  v_redemption_id UUID;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    IF NULLIF(trim(p_student_code), '') IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = p_student_id AND s.is_active = true AND s.student_code = trim(p_student_code)
    ) THEN
      RAISE EXCEPTION 'STUDENT_CODE_VERIFICATION_REQUIRED' USING ERRCODE = '42501';
    END IF;
  END IF;

  PERFORM 1
  FROM public.students s
  WHERE s.id = p_student_id AND s.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_year IS NULL OR v_sem IS NULL THEN
    SELECT t.year, t.sem INTO v_term FROM public.active_term() t;
    v_year := COALESCE(v_year, v_term.year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
    v_sem := COALESCE(v_sem, v_term.sem, '1');
  END IF;

  SELECT * INTO v_privilege
  FROM public.classroom_privileges
  WHERE id = p_privilege_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRIVILEGE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF NOT v_privilege.is_active THEN
    RAISE EXCEPTION 'PRIVILEGE_INACTIVE' USING ERRCODE = 'P0001';
  END IF;
  IF v_privilege.stock IS NOT NULL AND v_privilege.stock <= 0 THEN
    RAISE EXCEPTION 'PRIVILEGE_OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  SELECT GREATEST(0, COALESCE(SUM(
    CASE
      WHEN cs.type = 'add' THEN cs.score
      WHEN cs.type = 'deduct' AND cs.reward_claim_id IS NULL AND cs.category != 'reward' THEN -cs.score
      ELSE 0
    END
  ), 0))::INTEGER
  INTO v_virtue_earned
  FROM public.conduct_scores cs
  WHERE cs.student_id = p_student_id AND cs.academic_year = v_year;

  SELECT (
    COALESCE((
      SELECT SUM(cs.score)
      FROM public.conduct_scores cs
      WHERE cs.student_id = p_student_id
        AND cs.academic_year = v_year
        AND (cs.reward_claim_id IS NOT NULL OR cs.category = 'reward')
    ), 0) +
    COALESCE((
      SELECT SUM(rc.virtue_points_used)
      FROM public.reward_claims rc
      WHERE rc.student_id = p_student_id
        AND rc.academic_year = v_year
        AND rc.status = 'pending'::public.reward_claim_status
    ), 0)
  )::INTEGER
  INTO v_virtue_spent;

  v_virtue_balance := GREATEST(0, v_virtue_earned - v_virtue_spent);
  IF v_virtue_balance < v_privilege.virtue_points_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_VIRTUE_POINTS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.conduct_scores (
    student_id, type, score, category, reason, recorded_by, academic_year, semester
  ) VALUES (
    p_student_id, 'deduct', v_privilege.virtue_points_cost, 'reward',
    'แลกคูปองห้องเรียน: ' || v_privilege.title,
    'ระบบคูปองสิทธิ์พิเศษ', v_year, v_sem
  ) RETURNING id INTO v_conduct_id;

  INSERT INTO public.privilege_redemptions (
    privilege_id, student_id, points_used, status, conduct_score_id, academic_year, semester
  ) VALUES (
    p_privilege_id, p_student_id, v_privilege.virtue_points_cost, 'active', v_conduct_id, v_year, v_sem
  ) RETURNING id INTO v_redemption_id;

  IF v_privilege.stock IS NOT NULL THEN
    UPDATE public.classroom_privileges
    SET stock = stock - 1, updated_at = now()
    WHERE id = p_privilege_id;
  END IF;

  RETURN v_redemption_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_classroom_privilege(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_classroom_privilege(uuid, uuid, text, text, text) TO anon, authenticated, service_role;

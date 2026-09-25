-- ===============================================================
-- Migration 539: Reconcile Conduct and Waste Bank Virtue Points
-- Single Source of Truth: Links reward_claims with conduct_scores
-- ===============================================================

-- 1. เพิ่มคอลัมน์ reward_claim_id เพื่อผูกรายการหักคะแนนความดีเข้ากับคำขอแลกรางวัล
ALTER TABLE public.conduct_scores 
ADD COLUMN IF NOT EXISTS reward_claim_id UUID REFERENCES public.reward_claims(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conduct_scores_reward_claim_id 
ON public.conduct_scores(reward_claim_id);

-- 2. ปรับปรุง RPC approve_reward_claim ให้บันทึกการหักคะแนนความดีลง conduct_scores อัตโนมัติ
CREATE OR REPLACE FUNCTION public.approve_reward_claim(p_claim_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_claim RECORD;
  v_staff UUID;
  v_admin UUID;
  v_recorder_name TEXT;
BEGIN
  SELECT id, reward_id, student_id, reward_name, quantity, virtue_points_used, academic_year, semester, status
    INTO v_claim
    FROM public.reward_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF v_claim.status = 'approved' THEN RETURN; END IF;
  IF NOT public.can_approve_reward(v_claim.reward_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE='42501';
  END IF;
  SELECT staff_id, administrator_id INTO v_staff, v_admin
    FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;

  UPDATE public.reward_claims
     SET status='approved', reviewed_at=NOW(), reviewed_by=auth.uid(),
         approved_by_staff_id=v_staff, approved_by_administrator_id=v_admin
   WHERE id = p_claim_id;

  -- ซิงค์หักคะแนนความดีลง conduct_scores อัตโนมัติเมื่อมีการใช้คะแนนความดี
  IF COALESCE(v_claim.virtue_points_used, 0) > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.conduct_scores WHERE reward_claim_id = p_claim_id) THEN
      SELECT name INTO v_recorder_name FROM public.staff WHERE id = v_staff;
      IF v_recorder_name IS NULL AND v_admin IS NOT NULL THEN
        SELECT name INTO v_recorder_name FROM public.administrators WHERE id = v_admin;
      END IF;
      v_recorder_name := COALESCE(v_recorder_name, 'ระบบธนาคารขยะ');

      INSERT INTO public.conduct_scores (
        student_id,
        type,
        score,
        category,
        reason,
        recorded_by,
        recorded_by_staff_id,
        recorded_by_administrator_id,
        academic_year,
        semester,
        reward_claim_id
      ) VALUES (
        v_claim.student_id,
        'deduct',
        v_claim.virtue_points_used,
        'discipline',
        'แลกของรางวัล: ' || v_claim.reward_name || ' (' || COALESCE(v_claim.quantity, 1) || ' ชิ้น)',
        v_recorder_name,
        v_staff,
        v_admin,
        v_claim.academic_year,
        v_claim.semester,
        v_claim.id
      );
    END IF;
  END IF;
END;
$function$;

-- 3. ปรับปรุง RPC reject_reward_claim ให้ลบรายการหักคะแนนใน conduct_scores เมื่อปฏิเสธ
CREATE OR REPLACE FUNCTION public.reject_reward_claim(p_claim_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_claim RECORD;
  v_staff UUID;
  v_admin UUID;
BEGIN
  SELECT id, reward_id, status, quantity, virtue_points_used INTO v_claim
    FROM public.reward_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE='P0001'; END IF;
  IF v_claim.status = 'rejected' THEN RETURN; END IF;
  IF NOT public.can_approve_reward(v_claim.reward_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE='42501';
  END IF;
  SELECT staff_id, administrator_id INTO v_staff, v_admin
    FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  UPDATE public.reward_claims
     SET status='rejected', reviewed_at=NOW(), reviewed_by=auth.uid(),
         rejection_reason=p_reason,
         approved_by_staff_id=v_staff, approved_by_administrator_id=v_admin
   WHERE id = p_claim_id;
  IF v_claim.status IN ('pending','approved') THEN
    UPDATE public.rewards
       SET stock = CASE WHEN stock IS NOT NULL THEN stock + COALESCE(v_claim.quantity, 1) ELSE NULL END
     WHERE id = v_claim.reward_id;
  END IF;

  -- คืนคะแนนความดีหากเคยถูกหักไว้
  DELETE FROM public.conduct_scores WHERE reward_claim_id = p_claim_id;
END;
$function$;

-- 4. สร้าง RPC สำหรับครู/แอดมิน เพื่อทำรายการแลกของรางวัลและอนุมัติตัดแต้มทันที (Direct Redeem & Instant Approve)
CREATE OR REPLACE FUNCTION public.admin_claim_and_approve_reward(
  p_code text, 
  p_reward_id uuid, 
  p_quantity integer DEFAULT 1
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_claim_id uuid;
BEGIN
  -- ต้องเป็นครูหรือแอดมิน
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  -- สร้างคำขอแลกรางวัล (หักสต็อกและตรวจเช็กคะแนนคงเหลือ)
  v_claim_id := public.claim_reward(p_code, p_reward_id, p_quantity);

  -- อนุมัติคำขอทันที (หักคะแนนความดีและบันทึกประวัติ)
  PERFORM public.approve_reward_claim(v_claim_id);

  RETURN v_claim_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_claim_and_approve_reward(text, uuid, integer) TO authenticated;

-- 5. ปรับปรุง RPC claim_reward และ lookup_student_balance ไม่ให้นับแต้มที่ approved แล้วซ้ำซ้อน
CREATE OR REPLACE FUNCTION public.claim_reward(p_code text, p_reward_id uuid, p_quantity integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id uuid;
  v_reward record;
  v_claim_id uuid;
  v_year text;
  v_sem text;
  v_waste_balance integer;
  v_virtue_earned integer;
  v_virtue_spent integer;
  v_virtue_balance integer;
  v_waste_total integer;
  v_virtue_total integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
  END IF;

  SELECT year, sem INTO v_year, v_sem FROM public.active_term();

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = p_code AND s.is_active = true
  FOR UPDATE;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT r.id, r.name, r.waste_points_cost, r.virtue_points_cost, r.stock, r.is_active
  INTO v_reward
  FROM public.rewards r
  WHERE r.id = p_reward_id
  FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT GREATEST(0, COALESCE(w.available_points, 0))::integer
  INTO v_waste_balance
  FROM public.waste_student_summary w
  WHERE w.student_id = v_student_id;

  -- คะแนนความดีสุทธิจาก conduct_scores (รวมรายการ approved ในอดีตแล้ว)
  SELECT GREATEST(0, COALESCE(SUM(
    CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END
  ), 0))::integer
  INTO v_virtue_earned
  FROM public.conduct_scores cs
  WHERE cs.student_id = v_student_id AND cs.academic_year = v_year;

  -- กันแต้มไว้เฉพาะคำขอที่กำลังรออนุมัติ (pending) เท่านั้น
  SELECT COALESCE(SUM(rc.virtue_points_used), 0)::integer
  INTO v_virtue_spent
  FROM public.reward_claims rc
  WHERE rc.student_id = v_student_id
    AND rc.academic_year = v_year
    AND rc.status = 'pending'::public.reward_claim_status;

  v_waste_balance := COALESCE(v_waste_balance, 0);
  v_virtue_balance := GREATEST(0, v_virtue_earned - v_virtue_spent);
  v_waste_total := v_reward.waste_points_cost * p_quantity;
  v_virtue_total := v_reward.virtue_points_cost * p_quantity;

  IF v_waste_balance < v_waste_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_WASTE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_virtue_balance < v_virtue_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_VIRTUE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_reward.stock IS NOT NULL AND v_reward.stock < p_quantity THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reward_claims (
    student_id, reward_id, reward_name, points_used, quantity, status,
    academic_year, semester, balance_after,
    waste_points_used, virtue_points_used, waste_balance_after, virtue_balance_after
  ) VALUES (
    v_student_id, v_reward.id, v_reward.name, v_waste_total, p_quantity, 'pending',
    v_year, v_sem, v_waste_balance - v_waste_total,
    v_waste_total, v_virtue_total, v_waste_balance - v_waste_total,
    v_virtue_balance - v_virtue_total
  ) RETURNING id INTO v_claim_id;

  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards
    SET stock = v_reward.stock - p_quantity, updated_at = now()
    WHERE id = p_reward_id;
  END IF;

  RETURN v_claim_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lookup_student_balance(p_code text)
 RETURNS TABLE(student_id uuid, full_name text, class_name text, photo_url text, waste_points_earned integer, waste_points_available integer, virtue_points_earned integer, virtue_points_spent integer, virtue_points_available integer, virtue_academic_year text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH term AS (SELECT year FROM public.active_term()),
  virtue AS (
    SELECT
      s.id AS student_id,
      GREATEST(0, COALESCE(SUM(
        CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END
      ), 0))::integer AS earned
    FROM public.students s
    CROSS JOIN term t
    LEFT JOIN public.conduct_scores cs
      ON cs.student_id = s.id AND cs.academic_year = t.year
    WHERE s.student_code = p_code AND s.is_active = true
    GROUP BY s.id
  ), pending_spent AS (
    SELECT COALESCE(SUM(rc.virtue_points_used), 0)::integer AS amount
    FROM public.reward_claims rc
    JOIN public.students s ON s.id = rc.student_id
    CROSS JOIN term t
    WHERE s.student_code = p_code
      AND rc.academic_year = t.year
      AND rc.status = 'pending'::public.reward_claim_status
  )
  SELECT
    w.student_id,
    w.full_name,
    w.class_name,
    w.photo_url,
    COALESCE(w.total_points_earned, 0)::integer,
    GREATEST(0, COALESCE(w.available_points, 0))::integer,
    v.earned,
    ps.amount,
    GREATEST(0, v.earned - ps.amount)::integer,
    t.year
  FROM public.waste_student_summary w
  JOIN virtue v ON v.student_id = w.student_id
  CROSS JOIN pending_spent ps
  CROSS JOIN term t
  WHERE w.student_code = p_code
  LIMIT 1
$function$;

-- 6. ปรับปรุง RPC get_top_heroes ให้กรองเฉพาะปีการศึกษาปัจจุบัน และคิดคะแนนสุทธิ (net score > 0)
CREATE OR REPLACE FUNCTION public.get_top_heroes(
  limit_val int DEFAULT 10,
  p_academic_year text DEFAULT NULL,
  p_semester text DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  name TEXT,
  class TEXT,
  photo_url TEXT,
  total_xp BIGINT,
  deeds_count BIGINT
) SECURITY DEFINER AS $
DECLARE
  v_year TEXT := p_academic_year;
BEGIN
  IF v_year IS NULL THEN
    SELECT year INTO v_year FROM public.active_term();
    v_year := COALESCE(v_year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
  END IF;

  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name,
    s.class,
    s.photo_url,
    COALESCE(SUM(CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END), 0)::BIGINT as total_xp,
    COALESCE(COUNT(cs.id) FILTER (WHERE cs.type = 'add'), 0)::BIGINT as deeds_count
  FROM public.students s
  LEFT JOIN public.conduct_scores cs ON s.id = cs.student_id 
    AND cs.academic_year = v_year
    AND (p_semester IS NULL OR cs.semester = p_semester)
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.class, s.photo_url
  HAVING COALESCE(SUM(CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END), 0) > 0
  ORDER BY total_xp DESC, deeds_count DESC
  LIMIT limit_val;
END;
$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_top_heroes(int, text, text) TO anon, authenticated;

-- 7. สมานข้อมูลประวัติเดิม (Data Reconciliation):
-- 7.1 ลบ 2 รายการหักคะแนนด้วยมือที่ซ้ำซ้อน 10 แต้ม ของด.ญ.สรารัตน์ และ ด.ญ.อัญมณี
DELETE FROM public.conduct_scores
WHERE id IN (
  '864b68d8-f3ed-4be3-99ca-ada6c86d7382', -- 1323 สรารัตน์
  'd2c06528-abf3-4f70-98b7-140ba98e5698'  -- 1324 อัญมณี
);

-- 7.2 บันทึกรายการหักคะแนนความดีที่ถูกต้องให้คำขอที่ได้รับการอนุมัติแล้วในอดีต (1327, 1323, 1324)
INSERT INTO public.conduct_scores (
  student_id,
  type,
  score,
  category,
  reason,
  recorded_by,
  academic_year,
  semester,
  reward_claim_id,
  created_at
)
SELECT
  rc.student_id,
  'deduct',
  rc.virtue_points_used,
  'discipline',
  'แลกของรางวัล: ' || rc.reward_name || ' (' || COALESCE(rc.quantity, 1) || ' ชิ้น)',
  'ระบบธนาคารขยะ (บันทึกย้อนหลัง)',
  rc.academic_year,
  rc.semester,
  rc.id,
  rc.claimed_at
FROM public.reward_claims rc
WHERE rc.status = 'approved'
  AND rc.virtue_points_used > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.conduct_scores cs WHERE cs.reward_claim_id = rc.id
  );

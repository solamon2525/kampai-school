-- ===============================================================
-- Migration 548: Classroom Privilege Tokens (คูปองสิทธิ์พิเศษในห้องเรียน)
-- 1. Create tables: classroom_privileges & privilege_redemptions
-- 2. Create atomic RPC: redeem_classroom_privilege
-- 3. Setup RLS policies & permissions
-- ===============================================================

-- 1. ตารางคูปองสิทธิ์พิเศษประจำห้องเรียน
CREATE TABLE IF NOT EXISTS public.classroom_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  room TEXT DEFAULT '',
  created_by UUID REFERENCES public.staff(id),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎟️',
  virtue_points_cost INTEGER NOT NULL DEFAULT 5,
  stock INTEGER, -- NULL = ไม่จำกัดจำนวน
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ตารางประวัติการแลกและใช้สิทธิ์คูปอง
CREATE TABLE IF NOT EXISTS public.privilege_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privilege_id UUID NOT NULL REFERENCES public.classroom_privileges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  conduct_score_id UUID REFERENCES public.conduct_scores(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.staff(id),
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL
);

-- Index เพื่อประสิทธิภาพในการคิวรี
CREATE INDEX IF NOT EXISTS idx_classroom_privileges_class_room ON public.classroom_privileges(class, room);
CREATE INDEX IF NOT EXISTS idx_privilege_redemptions_student ON public.privilege_redemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_privilege_redemptions_privilege ON public.privilege_redemptions(privilege_id);
CREATE INDEX IF NOT EXISTS idx_privilege_redemptions_status ON public.privilege_redemptions(status);

-- 3. RPC แลกคูปองสิทธิ์พิเศษอย่างปลอดภัย (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.redeem_classroom_privilege(
  p_privilege_id UUID,
  p_student_id UUID,
  p_academic_year TEXT DEFAULT NULL,
  p_semester TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_privilege RECORD;
  v_year TEXT := p_academic_year;
  v_sem TEXT := p_semester;
  v_virtue_earned INTEGER;
  v_virtue_spent INTEGER;
  v_virtue_balance INTEGER;
  v_conduct_id UUID;
  v_redemption_id UUID;
BEGIN
  -- กำหนดปีการศึกษาและภาคเรียนหากไม่ได้ระบุ
  IF v_year IS NULL OR v_sem IS NULL THEN
    SELECT year, sem INTO v_year, v_sem FROM public.active_term();
    v_year := COALESCE(v_year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);
    v_sem := COALESCE(v_sem, '1');
  END IF;

  -- 1. ดึงและล็อกคูปอง
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

  -- 2. คำนวณคะแนนความดีพร้อมแลกของนักเรียน (Dual-Metric Formula)
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

  -- 3. หักคะแนนความดีลงสมุดบัญชี conduct_scores (category = 'reward' ไม่หักคะแนนเกียรติยศ)
  INSERT INTO public.conduct_scores (
    student_id,
    type,
    score,
    category,
    reason,
    recorded_by,
    academic_year,
    semester
  ) VALUES (
    p_student_id,
    'deduct',
    v_privilege.virtue_points_cost,
    'reward',
    'แลกคูปองห้องเรียน: ' || v_privilege.title,
    'ระบบคูปองสิทธิ์พิเศษ',
    v_year,
    v_sem
  ) RETURNING id INTO v_conduct_id;

  -- 4. บันทึกรายการแลกคูปอง privilege_redemptions
  INSERT INTO public.privilege_redemptions (
    privilege_id,
    student_id,
    points_used,
    status,
    conduct_score_id,
    academic_year,
    semester
  ) VALUES (
    p_privilege_id,
    p_student_id,
    v_privilege.virtue_points_cost,
    'active',
    v_conduct_id,
    v_year,
    v_sem
  ) RETURNING id INTO v_redemption_id;

  -- 5. ตัดสต็อกหากมีการกำหนดสต็อก
  IF v_privilege.stock IS NOT NULL THEN
    UPDATE public.classroom_privileges
    SET stock = stock - 1, updated_at = now()
    WHERE id = p_privilege_id;
  END IF;

  RETURN v_redemption_id;
END;
$function$;

-- 4. ตั้งค่าสิทธิ์และ RLS
ALTER TABLE public.classroom_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privilege_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read privileges" ON public.classroom_privileges;
CREATE POLICY "Public read privileges" ON public.classroom_privileges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teacher manage privileges" ON public.classroom_privileges;
CREATE POLICY "Teacher manage privileges" ON public.classroom_privileges FOR ALL USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Public read redemptions" ON public.privilege_redemptions;
CREATE POLICY "Public read redemptions" ON public.privilege_redemptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teacher manage redemptions" ON public.privilege_redemptions;
CREATE POLICY "Teacher manage redemptions" ON public.privilege_redemptions FOR ALL USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Student redeem privileges" ON public.privilege_redemptions;
CREATE POLICY "Student redeem privileges" ON public.privilege_redemptions FOR INSERT WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.redeem_classroom_privilege(UUID, UUID, TEXT, TEXT) TO anon, authenticated;

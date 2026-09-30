-- ============================================================================
-- Migration 550: ระบบกระปุกออมเป้าหมายและบันทึกฝากเงินไวประจำชั้น (ธนาคารพอเพียง)
-- ============================================================================

-- ─── 1. ตาราง savings_goals (กระปุกออมเป้าหมาย "ฝันที่เป็นจริง") ──────────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(10,2) NOT NULL CHECK (target_amount > 0 AND target_amount < 100000000),
  icon TEXT NOT NULL DEFAULT 'piggy-bank',
  category TEXT DEFAULT 'education',
  notes TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'cancelled')),
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_student ON public.savings_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON public.savings_goals(status);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Staff/Admin can view all goals
CREATE POLICY "savings_goals_select_staff_admin" ON public.savings_goals
  FOR SELECT TO authenticated
  USING (public.is_teacher() OR public.is_admin());

-- Staff/Admin can insert/update/delete goals
CREATE POLICY "savings_goals_all_staff_admin" ON public.savings_goals
  FOR ALL TO authenticated
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

-- ─── 2. RPC: ดึงเป้าหมายการออมด้วย student_code (Public / Student View) ───────
CREATE OR REPLACE FUNCTION public.get_student_savings_goals_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  title text,
  target_amount numeric,
  icon text,
  category text,
  notes text,
  target_date date,
  status text,
  achieved_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = trim(p_code) AND s.is_active = true;

  IF v_student_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT g.id, g.student_id, g.title, g.target_amount, g.icon, g.category, g.notes, g.target_date, g.status, g.achieved_at, g.created_at
  FROM public.savings_goals g
  WHERE g.student_id = v_student_id
  ORDER BY (g.status = 'in_progress') DESC, g.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_savings_goals_by_code(text) TO anon, authenticated;

-- ─── 3. RPC: ดึงเป้าหมายการออมด้วย student_id (Teacher / Admin / Parent) ──────
CREATE OR REPLACE FUNCTION public.get_student_savings_goals(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  title text,
  target_amount numeric,
  icon text,
  category text,
  notes text,
  target_date date,
  status text,
  achieved_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.student_id, g.title, g.target_amount, g.icon, g.category, g.notes, g.target_date, g.status, g.achieved_at, g.created_at
  FROM public.savings_goals g
  WHERE g.student_id = p_student_id
  ORDER BY (g.status = 'in_progress') DESC, g.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_savings_goals(uuid) TO anon, authenticated;

-- ─── 4. RPC: สร้างเป้าหมายการออมด้วย student_code (Student / Self Goal) ────────
CREATE OR REPLACE FUNCTION public.create_savings_goal_by_code(
  p_code text,
  p_title text,
  p_target_amount numeric,
  p_icon text DEFAULT 'piggy-bank',
  p_category text DEFAULT 'general',
  p_target_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_new_id uuid;
BEGIN
  IF p_target_amount IS NULL OR p_target_amount <= 0 OR p_target_amount >= 100000000 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;
  IF trim(p_title) IS NULL OR length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'INVALID_TITLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = trim(p_code) AND s.is_active = true;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.savings_goals (
    student_id, title, target_amount, icon, category, target_date
  ) VALUES (
    v_student_id, trim(p_title), trunc(p_target_amount), COALESCE(p_icon, 'piggy-bank'), COALESCE(p_category, 'general'), p_target_date
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_savings_goal_by_code(text, text, numeric, text, text, date) TO anon, authenticated;

-- ─── 5. RPC: สร้างเป้าหมายการออมด้วย student_id (Teacher / Admin / Parent) ──────
CREATE OR REPLACE FUNCTION public.create_savings_goal(
  p_student_id uuid,
  p_title text,
  p_target_amount numeric,
  p_icon text DEFAULT 'piggy-bank',
  p_category text DEFAULT 'general',
  p_target_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  IF p_target_amount IS NULL OR p_target_amount <= 0 OR p_target_amount >= 100000000 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;
  IF trim(p_title) IS NULL OR length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'INVALID_TITLE' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.savings_goals (
    student_id, title, target_amount, icon, category, target_date
  ) VALUES (
    p_student_id, trim(p_title), trunc(p_target_amount), COALESCE(p_icon, 'piggy-bank'), COALESCE(p_category, 'general'), p_target_date
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_savings_goal(uuid, text, numeric, text, text, date) TO authenticated;

-- ─── 6. RPC: อัปเดตสถานะเป้าหมาย (achieved / cancelled / in_progress) ─────────
CREATE OR REPLACE FUNCTION public.update_savings_goal_status(
  p_goal_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('in_progress', 'achieved', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.savings_goals
  SET
    status = p_status,
    achieved_at = CASE WHEN p_status = 'achieved' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_goal_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_savings_goal_status(uuid, text) TO anon, authenticated;

-- ─── 7. RPC: ลบเป้าหมายการออม ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_savings_goal(p_goal_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.savings_goals WHERE id = p_goal_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_savings_goal(uuid) TO authenticated;

-- ─── 8. RPC: บันทึกฝากเงินไวแบบทั้งห้อง (Classroom Batch Deposit) ─────────────
CREATE OR REPLACE FUNCTION public.record_batch_savings_deposits(
  p_deposits jsonb,
  p_transaction_date date DEFAULT current_date,
  p_recorded_by text DEFAULT NULL,
  p_recorded_by_staff_id uuid DEFAULT NULL,
  p_recorded_by_administrator_id uuid DEFAULT NULL,
  p_academic_year text DEFAULT NULL,
  p_semester text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  success_count int,
  total_amount numeric,
  failed_count int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_student_id uuid;
  v_amount numeric;
  v_custom_notes text;
  v_success int := 0;
  v_total numeric := 0;
  v_failed int := 0;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF p_deposits IS NULL OR jsonb_array_length(p_deposits) = 0 THEN
    RETURN QUERY SELECT 0, 0::numeric, 0;
    RETURN;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_deposits)
  LOOP
    BEGIN
      v_student_id := (v_item->>'student_id')::uuid;
      v_amount := (v_item->>'amount')::numeric;
      v_custom_notes := COALESCE(NULLIF(trim(v_item->>'notes'), ''), p_notes);

      IF v_student_id IS NOT NULL AND v_amount IS NOT NULL AND v_amount > 0 AND v_amount = trunc(v_amount) THEN
        PERFORM public.record_savings_transaction(
          v_student_id,
          'deposit',
          v_amount,
          COALESCE(p_transaction_date, current_date),
          v_custom_notes,
          p_recorded_by,
          p_recorded_by_staff_id,
          p_recorded_by_administrator_id,
          p_academic_year,
          p_semester
        );
        v_success := v_success + 1;
        v_total := v_total + v_amount;
      ELSE
        v_failed := v_failed + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_success, v_total, v_failed;
END;
$$;

REVOKE ALL ON FUNCTION public.record_batch_savings_deposits(jsonb, date, text, uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_batch_savings_deposits(jsonb, date, text, uuid, uuid, text, text, text) TO authenticated;

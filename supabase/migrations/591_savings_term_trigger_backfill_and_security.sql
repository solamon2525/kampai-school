-- ============================================================================
-- Migration 591: Savings Bank Null Term Backfill, Auto-Term Trigger & Goal Security
-- ============================================================================

-- 1. Backfill 2026-11-12 NULL term transaction and any post-switch Term 2 rows
UPDATE public.savings_transactions
SET
  academic_year = '2569',
  semester = '2'
WHERE id = '4de3537d-8916-4acf-9b51-f8ff82f89902'
   OR (created_at >= '2026-11-02T04:44:01Z' AND (academic_year IS NULL OR semester IS NULL OR semester = '1'));

-- 2. Auto-fill active term on INSERT when academic_year or semester omitted
CREATE OR REPLACE FUNCTION public.savings_txn_set_active_term()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year text;
  v_sem text;
BEGIN
  IF NULLIF(trim(NEW.academic_year), '') IS NULL OR NULLIF(trim(NEW.semester), '') IS NULL THEN
    SELECT t.year, t.sem INTO v_year, v_sem FROM public.active_term() t LIMIT 1;
    NEW.academic_year := COALESCE(NULLIF(trim(NEW.academic_year), ''), v_year, (EXTRACT(YEAR FROM NOW()) + 543)::text);
    NEW.semester := COALESCE(NULLIF(trim(NEW.semester), ''), v_sem, '1');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS savings_txn_set_active_term_trg ON public.savings_transactions;
CREATE TRIGGER savings_txn_set_active_term_trg
BEFORE INSERT ON public.savings_transactions
FOR EACH ROW EXECUTE FUNCTION public.savings_txn_set_active_term();

-- 3. Harden savings goal RPCs against anonymous UUID mutations
CREATE OR REPLACE FUNCTION public.delete_savings_goal(p_goal_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id uuid;
BEGIN
  SELECT student_id INTO v_student_id FROM public.savings_goals WHERE id = p_goal_id;
  IF NOT FOUND THEN
    IF NOT (
      COALESCE(public.is_teacher(), false)
      OR COALESCE(public.is_admin(), false)
      OR EXISTS (
        SELECT 1 FROM public.parent_student_links l
        WHERE l.user_id = auth.uid()
      )
    ) THEN
      RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
    END IF;
    RETURN false;
  END IF;

  IF NOT (
    COALESCE(public.is_teacher(), false)
    OR COALESCE(public.is_admin(), false)
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links l
      WHERE l.user_id = auth.uid() AND l.student_id = v_student_id
    )
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.savings_goals WHERE id = p_goal_id;
  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_savings_goal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_savings_goal(uuid) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.create_savings_goal(uuid, text, numeric, text, text, date);

CREATE OR REPLACE FUNCTION public.create_savings_goal(
  p_student_id uuid,
  p_title text,
  p_target_amount numeric,
  p_icon text DEFAULT 'piggy-bank'::text,
  p_category text DEFAULT 'general'::text,
  p_target_date date DEFAULT NULL::date,
  p_student_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_id uuid;
BEGIN
  IF NOT (
    COALESCE(public.is_teacher(), false)
    OR COALESCE(public.is_admin(), false)
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links l
      WHERE l.user_id = auth.uid() AND l.student_id = p_student_id
    )
    OR (
      NULLIF(trim(p_student_code), '') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = p_student_id AND s.is_active = true AND s.student_code = trim(p_student_code)
      )
    )
  ) THEN
    RAISE EXCEPTION 'STUDENT_CODE_VERIFICATION_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF p_target_amount IS NULL OR p_target_amount <= 0 OR p_target_amount >= 100000000 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;
  IF trim(p_title) IS NULL OR length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'INVALID_TITLE' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.savings_goals (
    student_id, title, target_amount, icon, category, target_date
  ) VALUES (
    p_student_id, trim(p_title), trunc(p_target_amount),
    COALESCE(p_icon, 'piggy-bank'), COALESCE(p_category, 'general'), p_target_date
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_savings_goal(uuid, text, numeric, text, text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_savings_goal(uuid, text, numeric, text, text, date, text) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.update_savings_goal_status(uuid, text);

CREATE OR REPLACE FUNCTION public.update_savings_goal_status(
  p_goal_id uuid,
  p_status text,
  p_student_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id uuid;
BEGIN
  IF p_status NOT IN ('in_progress', 'achieved', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;

  SELECT student_id INTO v_student_id FROM public.savings_goals WHERE id = p_goal_id;
  IF NOT FOUND THEN
    IF NOT (
      COALESCE(public.is_teacher(), false)
      OR COALESCE(public.is_admin(), false)
      OR EXISTS (
        SELECT 1 FROM public.parent_student_links l
        WHERE l.user_id = auth.uid()
      )
      OR (
        NULLIF(trim(p_student_code), '') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.is_active = true AND s.student_code = trim(p_student_code)
        )
      )
    ) THEN
      RAISE EXCEPTION 'STUDENT_CODE_VERIFICATION_REQUIRED' USING ERRCODE = '42501';
    END IF;
    RETURN false;
  END IF;

  IF NOT (
    COALESCE(public.is_teacher(), false)
    OR COALESCE(public.is_admin(), false)
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links l
      WHERE l.user_id = auth.uid() AND l.student_id = v_student_id
    )
    OR (
      NULLIF(trim(p_student_code), '') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = v_student_id AND s.is_active = true AND s.student_code = trim(p_student_code)
      )
    )
  ) THEN
    RAISE EXCEPTION 'STUDENT_CODE_VERIFICATION_REQUIRED' USING ERRCODE = '42501';
  END IF;

  UPDATE public.savings_goals
  SET
    status = p_status,
    achieved_at = CASE WHEN p_status = 'achieved' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_goal_id;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_savings_goal_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_savings_goal_status(uuid, text, text) TO anon, authenticated, service_role;

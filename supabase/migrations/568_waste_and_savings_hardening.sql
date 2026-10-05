-- 568_waste_and_savings_hardening.sql
-- Fix Eco Lucky Wheel phantom points: credit bonus points to waste_transactions so student balance increases
-- Fix Savings Bank lookup: trim whitespace from student_code queries

-- 1. RPC to record lucky spin AND grant actual waste points
CREATE OR REPLACE FUNCTION public.record_waste_lucky_spin(
  p_student_id UUID,
  p_student_name TEXT,
  p_student_class TEXT,
  p_transaction_id UUID,
  p_spin_result TEXT,
  p_bonus_points INT,
  p_recorded_by TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spin_id UUID;
  v_cat_id UUID;
  v_term RECORD;
BEGIN
  -- Insert lucky spin audit record
  INSERT INTO public.waste_lucky_spins (
    student_id,
    student_name,
    student_class,
    transaction_id,
    spin_result,
    bonus_points_awarded,
    recorded_by,
    spun_at
  )
  VALUES (
    p_student_id,
    p_student_name,
    p_student_class,
    p_transaction_id,
    p_spin_result,
    COALESCE(p_bonus_points, 0),
    p_recorded_by,
    NOW()
  )
  RETURNING id INTO v_spin_id;

  -- If bonus points > 0, insert a real transaction into waste_transactions
  -- so that waste_student_summary view actually reflects the new points!
  IF COALESCE(p_bonus_points, 0) > 0 THEN
    SELECT id INTO v_cat_id
    FROM public.waste_categories
    WHERE is_active = true
    ORDER BY order_position ASC
    LIMIT 1;

    SELECT year, sem INTO v_term FROM public.active_term();

    INSERT INTO public.waste_transactions (
      student_id,
      student_name,
      student_class,
      category_id,
      quantity,
      points_earned,
      transaction_date,
      notes,
      recorded_by,
      academic_year,
      semester
    )
    VALUES (
      p_student_id,
      p_student_name,
      p_student_class,
      v_cat_id,
      0,
      p_bonus_points,
      CURRENT_DATE,
      'โบนัสวงล้อเสี่ยงโชค: ' || p_spin_result,
      COALESCE(p_recorded_by, 'วงล้อเสี่ยงโชค Eco Wheel'),
      v_term.year,
      v_term.sem
    );
  END IF;

  RETURN v_spin_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_waste_lucky_spin(UUID, TEXT, TEXT, UUID, TEXT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_waste_lucky_spin(UUID, TEXT, TEXT, UUID, TEXT, INT, TEXT) TO anon, authenticated;

-- 2. Upgrade lookup_savings_balance to handle leading/trailing whitespace safely
CREATE OR REPLACE FUNCTION public.lookup_savings_balance(p_code TEXT)
RETURNS TABLE (
  student_id      UUID,
  full_name       TEXT,
  class_name      TEXT,
  photo_url       TEXT,
  current_balance NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.student_id,
    s.full_name,
    s.class_name,
    s.photo_url,
    s.current_balance
  FROM public.savings_student_summary s
  WHERE btrim(s.student_code) = btrim(p_code)
  LIMIT 1
$$;

-- 3. Upgrade get_savings_history to handle leading/trailing whitespace safely
CREATE OR REPLACE FUNCTION public.get_savings_history(p_code TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  txn_id            UUID,
  transaction_type  TEXT,
  amount            NUMERIC,
  balance_after     NUMERIC,
  transaction_date  DATE,
  notes             TEXT,
  recorded_by       TEXT,
  academic_year     TEXT,
  semester          TEXT,
  created_at        TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    t.id,
    t.transaction_type,
    t.amount,
    t.balance_after,
    t.transaction_date,
    t.notes,
    t.recorded_by,
    t.academic_year,
    t.semester,
    t.created_at
  FROM public.savings_transactions t
  JOIN public.students s ON s.id = t.student_id
  WHERE btrim(s.student_code) = btrim(p_code)
  ORDER BY t.transaction_date DESC, t.created_at DESC
  LIMIT p_limit
$$;

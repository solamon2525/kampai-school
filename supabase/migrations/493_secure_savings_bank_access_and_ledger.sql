-- Secure the savings ledger and centralize balance calculations.
-- Generated with Supabase CLI; numbered to follow this repository's convention.

-- Additive rollout: activate restricted access with migration 494 only after
-- the RPC-backed frontend has been deployed. No existing ledger rows are changed.

CREATE OR REPLACE FUNCTION public.record_savings_transaction(
  p_student_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_transaction_date date DEFAULT current_date,
  p_notes text DEFAULT NULL,
  p_recorded_by text DEFAULT NULL,
  p_recorded_by_staff_id uuid DEFAULT NULL,
  p_recorded_by_administrator_id uuid DEFAULT NULL,
  p_academic_year text DEFAULT NULL,
  p_semester text DEFAULT NULL
) RETURNS TABLE (transaction_id uuid, balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_min_balance numeric;
  v_id uuid;
  v_name text;
  v_class text;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;
  IF p_transaction_type IS NULL OR p_transaction_type NOT IN ('deposit', 'withdraw') OR p_amount IS NULL
     OR p_amount <= 0 OR p_amount >= 100000000 OR p_amount <> trunc(p_amount) THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));
  SELECT name, class INTO v_name, v_class FROM public.students
    WHERE id = p_student_id AND is_active = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END), 0)
    INTO v_balance FROM public.savings_transactions WHERE student_id = p_student_id;
  IF p_transaction_type = 'withdraw' AND v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0001';
  END IF;
  v_balance := v_balance + CASE WHEN p_transaction_type = 'deposit' THEN p_amount ELSE -p_amount END;

  INSERT INTO public.savings_transactions (
    student_id, student_name, student_class, transaction_type, amount, balance_after,
    transaction_date, notes, recorded_by, recorded_by_staff_id,
    recorded_by_administrator_id, academic_year, semester, created_at
  ) VALUES (
    p_student_id, v_name, v_class, p_transaction_type, p_amount, v_balance,
    COALESCE(p_transaction_date, current_date), NULLIF(trim(p_notes), ''), p_recorded_by,
    p_recorded_by_staff_id, p_recorded_by_administrator_id, p_academic_year, p_semester, clock_timestamp()
  ) RETURNING id INTO v_id;
  WITH rebuilt AS (
    SELECT id,
      SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END)
        OVER (ORDER BY transaction_date, created_at, id) AS balance
    FROM public.savings_transactions WHERE student_id = p_student_id
  )
  UPDATE public.savings_transactions t
  SET balance_after = rebuilt.balance
  FROM rebuilt WHERE t.id = rebuilt.id;
  SELECT MIN(t.balance_after) INTO v_min_balance
    FROM public.savings_transactions t WHERE t.student_id = p_student_id;
  IF v_min_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0001';
  END IF;
  -- Return the committed account balance, including backdated entries.
  RETURN QUERY SELECT v_id, v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.record_savings_transaction(uuid, text, numeric, date, text, text, uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_savings_transaction(uuid, text, numeric, date, text, text, uuid, uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_savings_transaction(p_transaction_id uuid)
RETURNS TABLE (transaction_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_min_balance numeric;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;
  SELECT student_id INTO v_student_id FROM public.savings_transactions
    WHERE id = p_transaction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSACTION_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_student_id::text, 0));
  PERFORM 1 FROM public.savings_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSACTION_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  DELETE FROM public.savings_transactions WHERE id = p_transaction_id;
  WITH rebuilt AS (
    SELECT id,
      SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END)
        OVER (ORDER BY transaction_date, created_at, id) AS balance
    FROM public.savings_transactions WHERE student_id = v_student_id
  )
  UPDATE public.savings_transactions t
  SET balance_after = rebuilt.balance
  FROM rebuilt WHERE t.id = rebuilt.id;
  SELECT MIN(t.balance_after) INTO v_min_balance
    FROM public.savings_transactions t WHERE t.student_id = v_student_id;
  IF v_min_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY SELECT p_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_savings_transaction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_savings_transaction(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_savings_transaction(
  p_transaction_id uuid,
  p_transaction_type text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_transaction_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS TABLE (transaction_id uuid, balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_balance numeric;
  v_min_balance numeric;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;
  SELECT student_id INTO v_student_id FROM public.savings_transactions
    WHERE id = p_transaction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSACTION_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF p_transaction_type IS NOT NULL AND p_transaction_type NOT IN ('deposit', 'withdraw') THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;
  IF p_amount IS NOT NULL AND (p_amount <= 0 OR p_amount >= 100000000 OR p_amount <> trunc(p_amount)) THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_student_id::text, 0));
  PERFORM 1 FROM public.savings_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSACTION_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.savings_transactions
  SET transaction_type = COALESCE(p_transaction_type, transaction_type),
      amount = COALESCE(p_amount, amount),
      transaction_date = COALESCE(p_transaction_date, transaction_date),
      notes = CASE WHEN p_notes IS NULL THEN notes ELSE NULLIF(trim(p_notes), '') END
  WHERE id = p_transaction_id;
  WITH rebuilt AS (
    SELECT id,
      SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END)
        OVER (ORDER BY transaction_date, created_at, id) AS balance
    FROM public.savings_transactions WHERE student_id = v_student_id
  )
  UPDATE public.savings_transactions t
  SET balance_after = rebuilt.balance
  FROM rebuilt WHERE t.id = rebuilt.id;
  SELECT MIN(t.balance_after) INTO v_min_balance
    FROM public.savings_transactions t WHERE t.student_id = v_student_id;
  IF v_min_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0001';
  END IF;
  SELECT SUM(CASE WHEN t.transaction_type = 'deposit' THEN t.amount ELSE -t.amount END)
    INTO v_balance FROM public.savings_transactions t WHERE t.student_id = v_student_id;
  RETURN QUERY SELECT p_transaction_id, v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.update_savings_transaction(uuid, text, numeric, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_savings_transaction(uuid, text, numeric, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_savings_overview(p_limit integer DEFAULT 10)
RETURNS TABLE (
  transaction_id uuid, student_name text, student_class text, photo_url text,
  transaction_type text, transaction_date date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.student_name, t.student_class, s.photo_url, t.transaction_type, t.transaction_date
  FROM public.savings_transactions
  t LEFT JOIN public.students s ON s.id = t.student_id
  ORDER BY t.transaction_date DESC, t.created_at DESC, t.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 20)
$$;

CREATE OR REPLACE FUNCTION public.get_public_savings_leaderboard(p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
RETURNS TABLE (
  student_id uuid, full_name text, class_name text, photo_url text,
  deposit_count integer, withdraw_count integer, total_transactions integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT student_id, full_name, class_name, photo_url,
    deposit_count, withdraw_count, total_transactions
  FROM public.savings_student_summary
  WHERE COALESCE(deposit_count, 0) > 0
  ORDER BY deposit_count DESC, total_transactions DESC, full_name, student_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0)
$$;

CREATE OR REPLACE FUNCTION public.get_savings_deposit_count(p_student_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.savings_transactions
  WHERE student_id = p_student_id AND transaction_type = 'deposit'
$$;

CREATE OR REPLACE FUNCTION public.get_parent_savings_summary(p_student_id uuid)
RETURNS SETOF public.savings_student_summary
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.* FROM public.savings_student_summary s
  WHERE s.student_id = p_student_id
    AND (public.is_admin() OR public.is_teacher() OR EXISTS (
      SELECT 1 FROM public.parent_student_links l
      WHERE l.user_id = auth.uid() AND l.student_id = p_student_id
    ))
$$;

CREATE OR REPLACE FUNCTION public.get_parent_savings_history(p_student_id uuid, p_limit integer DEFAULT 100)
RETURNS TABLE (
  txn_id uuid, transaction_type text, amount numeric, balance_after numeric,
  transaction_date date, notes text, recorded_by text, academic_year text,
  semester text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.transaction_type, t.amount, t.balance_after, t.transaction_date,
    t.notes, t.recorded_by, t.academic_year, t.semester, t.created_at
  FROM public.savings_transactions t
  WHERE t.student_id = p_student_id
    AND (public.is_admin() OR public.is_teacher() OR EXISTS (
      SELECT 1 FROM public.parent_student_links l
      WHERE l.user_id = auth.uid() AND l.student_id = p_student_id
    ))
  ORDER BY t.transaction_date DESC, t.created_at DESC, t.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100)
$$;

REVOKE ALL ON FUNCTION public.get_public_savings_overview(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_savings_deposit_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_savings_leaderboard(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_savings_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_parent_savings_history(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_savings_overview(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_savings_leaderboard(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_savings_deposit_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_savings_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_savings_history(uuid, integer) TO authenticated;

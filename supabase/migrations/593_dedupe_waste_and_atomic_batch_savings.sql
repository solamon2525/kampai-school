-- ============================================================================
-- Migration 593: Dedupe Pa.1 Waste Rows, Clean Conduct 22ms Dupe, Move Nov 2 Morning
--                Savings to Term 2, Trim recorded_by & Make Batch Savings Atomic
-- ============================================================================

-- 1. Remove verified millisecond duplicate waste_transactions rows (Pa.1 Term 2 & Term 1)
--    plus approved removal of Pa.1 Pichaihop Nov 18 14:56:43 second-entry rows.
DO $$
DECLARE
  v_deleted integer;
  v_neg_students integer;
BEGIN
  DELETE FROM public.waste_transactions
  WHERE id IN (
    -- Term 2 Pa.1 Nontawat 2026-11-18T14:52:15 (6 excess of 7 identical rows in 41ms -> -264 items / -264 pts)
    'ba82f044-c0a3-4a0c-b39d-9631a106f30e',
    '19a1376b-fa3a-4829-9142-600e3f91efe8',
    'b9cb0cf1-2bc8-444c-8f3d-60ce4cbb47e6',
    'a3719ee3-4acf-42e1-85d5-c18ab2f7a890',
    '937f126a-c055-43b4-8928-79f428fa02a1',
    '5cceeb89-c490-4fb7-8db4-f5eedb3df2e3',
    -- Term 2 Pa.1 Ronnachai 2026-11-18T14:56:18 (1 excess of 2 rows in 93ms -> -44 items / -44 pts)
    'ce762f37-d68e-438b-bdcc-2cb1d9b5250a',
    -- Term 2 Pa.1 Porntiwa 2026-11-18T14:51:07 (1 excess of 2 rows in 33ms -> -28 items / -28 pts)
    'bcfd118e-2207-4314-8729-6c8b574a40fe',
    -- Term 2 Pa.1 Pichaipop 2026-11-11T14:04:04 (1 excess of 2 rows in 95ms -> -1 item / -1 pt)
    '70155f73-b28a-4202-a52d-ccf28577fd2e',
    -- Term 1 Pa.1 Nontawat 2026-09-29T14:52:18 (1 excess of 2 rows in 45ms -> -1 item / -1 pt)
    'b34e20ab-8e1f-4f9a-9dca-a24975d39f31',
    -- Term 1 Pa.1 Pichaipop 2026-09-29T14:56:56 (2 excess of 3 glass-bottle rows in 286ms -> -4 items / -8 pts)
    '027511bd-9b63-4773-a489-3c2a28bf6e33',
    'c3b8f838-6ba0-41c1-940b-450c2f0ff942',
    -- Term 2 Pa.1 Pichaipop 2026-11-18T14:56:43 (3 cross-teacher re-entry rows -> -42 items / -84 pts)
    '1b6bd5eb-cf77-48b5-befe-1dbd1119e281',
    'c71fe47a-cac6-472d-819c-c77ff37ab01b',
    'e6d49442-2cdd-482e-8b06-9da006fb42e5'
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 15 THEN
    RAISE EXCEPTION 'ABORT_593_WASTE_DELETE: expected 15 rows deleted, got %', v_deleted;
  END IF;

  -- Safety check: ensure no active student has negative waste points committed
  SELECT COUNT(*) INTO v_neg_students
  FROM public.waste_student_summary
  WHERE (total_points_earned - total_points_spent) < 0;

  IF v_neg_students > 0 THEN
    RAISE EXCEPTION 'ABORT_593_NEGATIVE_WASTE_BALANCE: % student(s) dropped below 0', v_neg_students;
  END IF;
END $$;

-- 2. Remove verified 22ms duplicate deduct row in Term 1 conduct_scores (2026-09-14)
DO $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.conduct_scores
  WHERE id = 'ab68e37d-4c95-44a9-b6c9-75cdf0aa8cd7';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'ABORT_593_CONDUCT_DELETE: expected 1 row deleted, got %', v_deleted;
  END IF;
END $$;

-- 3. Move 2 Nov 2 morning Term-2 opening-day savings deposits (before manual switch) to semester '2'
DO $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.savings_transactions
  SET semester = '2'
  WHERE id IN (
    '0af20720-dcc8-467a-9f74-47a8d5db7213',
    '0a0e4512-8951-4a68-882a-b8825668faf7'
  )
    AND academic_year = '2569'
    AND semester = '1';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 2 THEN
    RAISE EXCEPTION 'ABORT_593_SAVINGS_TERM: expected 2 rows updated, got %', v_updated;
  END IF;
END $$;

-- 4. Trim leading/trailing tabs & whitespace in recorded_by across waste & savings ledgers
UPDATE public.savings_transactions
SET recorded_by = regexp_replace(recorded_by, '^[\s\t]+|[\s\t]+$', '', 'g')
WHERE recorded_by ~ '^[\s\t]|[\s\t]$';

UPDATE public.waste_transactions
SET recorded_by = regexp_replace(recorded_by, '^[\s\t]+|[\s\t]+$', '', 'g')
WHERE recorded_by ~ '^[\s\t]|[\s\t]$';

-- 5. Make record_batch_savings_deposits atomic (never swallow per-row exceptions silently)
CREATE OR REPLACE FUNCTION public.record_batch_savings_deposits(
  p_deposits jsonb,
  p_transaction_date date DEFAULT CURRENT_DATE,
  p_recorded_by text DEFAULT NULL::text,
  p_recorded_by_staff_id uuid DEFAULT NULL::uuid,
  p_recorded_by_administrator_id uuid DEFAULT NULL::uuid,
  p_academic_year text DEFAULT NULL::text,
  p_semester text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text
)
RETURNS TABLE(success_count integer, total_amount numeric, failed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item jsonb;
  v_student_id uuid;
  v_amount numeric;
  v_custom_notes text;
  v_success int := 0;
  v_total numeric := 0;
BEGIN
  IF NOT (COALESCE(public.is_teacher(), false) OR COALESCE(public.is_admin(), false)) THEN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
    END;

    v_custom_notes := COALESCE(NULLIF(trim(v_item->>'notes'), ''), p_notes);

    IF v_student_id IS NULL OR v_amount IS NULL OR v_amount <= 0 OR v_amount >= 100000000 OR v_amount <> trunc(v_amount) THEN
      RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
    END IF;

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
  END LOOP;

  RETURN QUERY SELECT v_success, v_total, 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_batch_savings_deposits(jsonb, date, text, uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_batch_savings_deposits(jsonb, date, text, uuid, uuid, text, text, text) TO authenticated, service_role;

-- ============================================================================
-- Migration 589: Waste Bank Promo Scoping, Reward Catalog Dedupe & Lucky Spin Auth
-- ============================================================================

-- 1. Ensure Milk Carton waste category exists and scope Milk Carton Week promo strictly to it
DO $$
DECLARE
  v_milk_cat_id uuid;
  v_negative_count integer;
BEGIN
  SELECT id INTO v_milk_cat_id
  FROM public.waste_categories
  WHERE name = 'กล่องนม (พับแบน)'
  LIMIT 1;

  IF v_milk_cat_id IS NULL THEN
    INSERT INTO public.waste_categories (
      name, points_per_item, icon, color, is_active, order_position
    ) VALUES (
      'กล่องนม (พับแบน)', 1, '🥛', '#0ea5e9', true, 5
    ) RETURNING id INTO v_milk_cat_id;
  END IF;

  -- Scope promo 8533fc21-... exclusively to milk cartons & pause until teacher sets dates
  UPDATE public.waste_promotions
  SET
    category_ids = ARRAY[v_milk_cat_id],
    is_active = false,
    updated_at = now()
  WHERE id = '8533fc21-4bd8-45a6-bbd7-1a764a4e1c1c';

  -- Normalize mis-applied Term 2 (semester = '2') 3x rows on non-milk categories only if zero students drop below 0.
  -- Closed Term 1 (semester = '1') rows are intentionally preserved because points were already redeemed.
  WITH nov18_delta AS (
    SELECT
      wt.student_id,
      SUM(wt.points_earned - (wt.quantity * wc.points_per_item)) AS delta
    FROM public.waste_transactions wt
    JOIN public.waste_categories wc ON wc.id = wt.category_id
    WHERE wt.notes LIKE '%กล่องนมพับแบนแต้ม x3%'
      AND wc.id <> v_milk_cat_id
      AND wt.semester = '2'
    GROUP BY wt.student_id
  )
  SELECT COUNT(*) INTO v_negative_count
  FROM nov18_delta d
  JOIN public.waste_student_summary w ON w.student_id = d.student_id
  WHERE (w.available_points - d.delta) < 0;

  IF v_negative_count = 0 THEN
    UPDATE public.waste_transactions wt
    SET
      points_earned = wt.quantity * wc.points_per_item,
      notes = TRIM(BOTH ' ' FROM COALESCE(wt.notes, '') || ' [ปรับแก้: ยกเลิก x3 กล่องนมที่ไม่ตรงประเภท]')
    FROM public.waste_categories wc
    WHERE wt.category_id = wc.id
      AND wt.notes LIKE '%กล่องนมพับแบนแต้ม x3%'
      AND wc.id <> v_milk_cat_id
      AND wt.semester = '2'
      AND wt.points_earned <> wt.quantity * wc.points_per_item;
  ELSE
    RAISE EXCEPTION 'ABORT_NOV18_NORMALIZE: % student(s) would drop below committed claims; reconcile manually first', v_negative_count;
  END IF;
END $$;

-- Prevent unconstrained boosted promotions from activating accidentally
ALTER TABLE public.waste_promotions
  DROP CONSTRAINT IF EXISTS waste_promotions_require_scope_when_boosted;

ALTER TABLE public.waste_promotions
  ADD CONSTRAINT waste_promotions_require_scope_when_boosted
  CHECK (
    NOT is_active
    OR (COALESCE(multiplier, 1) <= 1 AND COALESCE(bonus_points, 0) <= 0)
    OR COALESCE(array_length(category_ids, 1), 0) > 0
    OR COALESCE(array_length(days_of_week, 1), 0) > 0
    OR start_date IS NOT NULL
    OR end_date IS NOT NULL
    OR start_time IS NOT NULL
  );

-- 2. Clean up duplicate rewards & backfill missing categories cleanly
-- 2a. กระต่าย ใส่ถ่านเดินได้ (0 claims on both -> merge stock 1+1=2 onto survivor)
UPDATE public.rewards
SET stock = 2, updated_at = now()
WHERE id = '319dd023-d0ed-4ade-9fb1-19507962d47f'
  AND EXISTS (SELECT 1 FROM public.rewards WHERE id = 'ba01b6ef-85a0-4397-b0d5-e1dc07b8f5f8');

DELETE FROM public.rewards
WHERE id = 'ba01b6ef-85a0-4397-b0d5-e1dc07b8f5f8'
  AND NOT EXISTS (SELECT 1 FROM public.reward_claims WHERE reward_id = 'ba01b6ef-85a0-4397-b0d5-e1dc07b8f5f8');

-- 2b. ดินสอกด (merge 1 orphan stock into claimed row with category 'เครื่องเขียน')
UPDATE public.rewards
SET stock = COALESCE(stock, 0) + 1, updated_at = now()
WHERE id = '52a00989-6408-42c0-8a0b-26580a3a0309'
  AND EXISTS (SELECT 1 FROM public.rewards WHERE id = '2b423709-08a7-416d-9c02-924b860420ed');

DELETE FROM public.rewards
WHERE id = '2b423709-08a7-416d-9c02-924b860420ed'
  AND NOT EXISTS (SELECT 1 FROM public.reward_claims WHERE reward_id = '2b423709-08a7-416d-9c02-924b860420ed');

-- 2c. ที่ลบคำผิด (archive out-of-stock 60-pt legacy item while preserving its 1 historical claim)
UPDATE public.rewards
SET is_active = false, updated_at = now()
WHERE id = 'e8fbd28e-a51d-40ff-8ac5-67c01459eebd';

-- 2d. ปากกา (consolidate 3 identical 30-pt rows onto central 'เครื่องเขียน' row 16dc63ed)
UPDATE public.reward_claims
SET reward_id = '16dc63ed-7d54-433e-9e71-3419d5798820'
WHERE reward_id IN ('0cedb37f-7d29-4277-b3f8-69cac089c41d', '6439def8-297c-4c89-9707-771bcc3c9b26')
  AND EXISTS (SELECT 1 FROM public.rewards WHERE id = '16dc63ed-7d54-433e-9e71-3419d5798820');

DELETE FROM public.rewards
WHERE id IN ('0cedb37f-7d29-4277-b3f8-69cac089c41d', '6439def8-297c-4c89-9707-771bcc3c9b26')
  AND NOT EXISTS (SELECT 1 FROM public.reward_claims WHERE reward_id IN ('0cedb37f-7d29-4277-b3f8-69cac089c41d', '6439def8-297c-4c89-9707-771bcc3c9b26'));

-- 2e. สกุชชี่ (consolidate identical owner+price rows -> stock 8 onto a98b48c6)
UPDATE public.reward_claims
SET reward_id = 'a98b48c6-dfd3-4525-bdf7-69cbb637b98e'
WHERE reward_id = 'f4551840-280e-4f6a-bc33-0d977169241f'
  AND EXISTS (SELECT 1 FROM public.rewards WHERE id = 'a98b48c6-dfd3-4525-bdf7-69cbb637b98e');

UPDATE public.rewards
SET stock = 8, updated_at = now()
WHERE id = 'a98b48c6-dfd3-4525-bdf7-69cbb637b98e'
  AND EXISTS (SELECT 1 FROM public.rewards WHERE id = 'f4551840-280e-4f6a-bc33-0d977169241f');

DELETE FROM public.rewards
WHERE id = 'f4551840-280e-4f6a-bc33-0d977169241f'
  AND NOT EXISTS (SELECT 1 FROM public.reward_claims WHERE reward_id = 'f4551840-280e-4f6a-bc33-0d977169241f');

-- 2f. Fix Thai spelling typo & backfill missing categories
UPDATE public.rewards
SET name = 'ไม้บรรทัด (10 แต้ม)', category = COALESCE(category, 'เครื่องเขียน'), updated_at = now()
WHERE id = 'c4e42d2c-1039-4717-9f68-0a7297a944df';

UPDATE public.rewards SET category = 'เครื่องเขียน', updated_at = now()
WHERE id = '286b40eb-bd94-46fc-9288-619e0ebfd9a0' AND category IS NULL;

UPDATE public.rewards SET category = 'ของเล่น', updated_at = now()
WHERE id IN ('b785d35e-5109-4a0c-ab0b-be56f13c17dc', '64038eaa-96d8-4924-bf33-5dfe210d033a', 'f869d89d-f0f3-46c3-98ff-379d7a7c2094')
  AND category IS NULL;

-- 3. Harden waste_lucky_spins RLS & record_waste_lucky_spin RPC
DROP POLICY IF EXISTS "Staff insert waste lucky spins" ON public.waste_lucky_spins;

CREATE OR REPLACE FUNCTION public.record_waste_lucky_spin(
  p_student_id uuid,
  p_student_name text,
  p_student_class text,
  p_transaction_id uuid,
  p_spin_result text,
  p_bonus_points integer,
  p_recorded_by text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_spin_id UUID;
  v_cat_id UUID;
  v_term RECORD;
BEGIN
  IF NOT (public.is_teacher() OR public.is_admin()) THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_bonus_points, 0) < 0 OR COALESCE(p_bonus_points, 0) > 100 THEN
    RAISE EXCEPTION 'INVALID_BONUS_POINTS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.waste_lucky_spins (
    student_id, student_name, student_class, transaction_id,
    spin_result, bonus_points_awarded, recorded_by, spun_at
  )
  VALUES (
    p_student_id, p_student_name, p_student_class, p_transaction_id,
    p_spin_result, COALESCE(p_bonus_points, 0), p_recorded_by, NOW()
  )
  RETURNING id INTO v_spin_id;

  IF COALESCE(p_bonus_points, 0) > 0 THEN
    SELECT id INTO v_cat_id
    FROM public.waste_categories
    WHERE is_active = true
    ORDER BY order_position ASC
    LIMIT 1;

    SELECT year, sem INTO v_term FROM public.active_term();

    INSERT INTO public.waste_transactions (
      student_id, student_name, student_class, category_id,
      quantity, points_earned, transaction_date, notes,
      recorded_by, academic_year, semester
    )
    VALUES (
      p_student_id, p_student_name, p_student_class, v_cat_id,
      0, p_bonus_points, CURRENT_DATE,
      'โบนัสวงล้อเสี่ยงโชค: ' || p_spin_result,
      COALESCE(p_recorded_by, 'วงล้อเสี่ยงโชค Eco Wheel'),
      v_term.year, v_term.sem
    );
  END IF;

  RETURN v_spin_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_waste_lucky_spin(uuid, text, text, uuid, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_waste_lucky_spin(uuid, text, text, uuid, text, integer, text) TO authenticated, service_role;

-- ============================================================================
-- Migration 318: Seed "เศษส่วนวงกลม / แท่ง" → คลังสื่อการสอน (media)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/math/fraction-pieces.html
-- Category: media (คลังสื่อการสอน) — NOT a tracked game
-- คู่กับเกม Pizza เศษส่วน (pizza)
-- Idempotent: NOT EXISTS guard on external_url
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/math/fraction-pieces.html';
  v_thumb     TEXT := '/games/math/fraction-pieces-cover.png';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  SELECT id INTO v_cat_media
  FROM public.educational_hub_categories WHERE category_key = 'media';

  IF v_cat_media IS NULL THEN
    RAISE EXCEPTION 'category "media" not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT
    v_staff_id,
    v_cat_media,
    'link',
    '🍕 สื่อเศษส่วนวงกลม / แท่ง',
    'สื่อการสอนคณิตศาสตร์ ป.3-5 — โมเดลเศษส่วนแบบวงกลมและแท่ง ลาก/แตะชิ้นส่วนเทียบสมมูล (เช่น 1/2 = 2/4) คู่กับเกม Pizza เศษส่วน',
    v_url,
    v_thumb,
    'คณิตศาสตร์',
    ARRAY['ป.3','ป.4','ป.5'],
    ARRAY['เศษส่วน','สมมูล','วงกลม','แท่ง','พิซซ่า','คณิตศาสตร์'],
    20,
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- sync thumbnail / metadata ถ้ามีแถวอยู่แล้ว
  UPDATE public.educational_hub_items
  SET
    title = '🍕 สื่อเศษส่วนวงกลม / แท่ง',
    description = 'สื่อการสอนคณิตศาสตร์ ป.3-5 — โมเดลเศษส่วนแบบวงกลมและแท่ง ลาก/แตะชิ้นส่วนเทียบสมมูล (เช่น 1/2 = 2/4) คู่กับเกม Pizza เศษส่วน',
    thumbnail_url = v_thumb,
    subject = 'คณิตศาสตร์',
    grade_levels = ARRAY['ป.3','ป.4','ป.5'],
    tags = ARRAY['เศษส่วน','สมมูล','วงกลม','แท่ง','พิซซ่า','คณิตศาสตร์'],
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  RAISE NOTICE 'Seeded fraction-pieces media for staff_id=%', v_staff_id;
END $$;

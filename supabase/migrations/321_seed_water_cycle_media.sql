-- ============================================================================
-- Migration 321: Seed "วัฏจักรน้ำ" → คลังสื่อการสอน (media)
-- ============================================================================
-- Path: public/games/science/water-cycle.html
-- Idempotent
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/science/water-cycle.html';
  v_thumb     TEXT := '/games/science/water-cycle-cover.png';
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
    '💧 วัฏจักรน้ำ',
    'สื่อการสอนวิทยาศาสตร์ ป.3-5 — แผนภาพวัฏจักรน้ำ 4 ขั้น (ระเหย ควบแน่น หยาดน้ำฟ้า รวมตัว) เล่นวนอัตโนมัติ + โหมดเรียงลำดับ',
    v_url,
    v_thumb,
    'วิทยาศาสตร์',
    ARRAY['ป.3','ป.4','ป.5'],
    ARRAY['วัฏจักรน้ำ','วิทยาศาสตร์','ระเหย','ฝน','เมฆ'],
    50,
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET
    title = '💧 วัฏจักรน้ำ',
    description = 'สื่อการสอนวิทยาศาสตร์ ป.3-5 — แผนภาพวัฏจักรน้ำ 4 ขั้น (ระเหย ควบแน่น หยาดน้ำฟ้า รวมตัว) เล่นวนอัตโนมัติ + โหมดเรียงลำดับ',
    thumbnail_url = v_thumb,
    subject = 'วิทยาศาสตร์',
    grade_levels = ARRAY['ป.3','ป.4','ป.5'],
    tags = ARRAY['วัฏจักรน้ำ','วิทยาศาสตร์','ระเหย','ฝน','เมฆ'],
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

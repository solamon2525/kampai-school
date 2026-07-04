-- ============================================================================
-- Migration 323: Seed "มาตราตัวสะกด" → คลังสื่อการสอน (media)
-- ============================================================================
-- Path: public/games/thai/thai-matra-chart.html
-- คู่กับเกม fishing (ตกปลามาตราตัวสะกด)
-- Idempotent
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/thai/thai-matra-chart.html';
  v_thumb     TEXT := '/games/thai/thai-matra-chart-cover.png';
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
    '🎣 มาตราตัวสะกด',
    'สื่อการสอนภาษาไทย ป.1-3 — แม่มาตราตัวสะกด 8 แม่ (กก กง กด กน กบ กม เกย เกอว) แตะดูตัวสะกด + คำตัวอย่าง · โหมดฝึก · คู่เกมตกปลา',
    v_url,
    v_thumb,
    'ภาษาไทย',
    ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['มาตราตัวสะกด','แม่กก','ภาษาไทย','ตัวสะกด'],
    70,
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET
    title = '🎣 มาตราตัวสะกด',
    description = 'สื่อการสอนภาษาไทย ป.1-3 — แม่มาตราตัวสะกด 8 แม่ (กก กง กด กน กบ กม เกย เกอว) แตะดูตัวสะกด + คำตัวอย่าง · โหมดฝึก · คู่เกมตกปลา',
    thumbnail_url = v_thumb,
    subject = 'ภาษาไทย',
    grade_levels = ARRAY['ป.1','ป.2','ป.3'],
    tags = ARRAY['มาตราตัวสะกด','แม่กก','ภาษาไทย','ตัวสะกด'],
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

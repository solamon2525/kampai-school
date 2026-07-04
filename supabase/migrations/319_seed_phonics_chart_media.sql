-- ============================================================================
-- Migration 319: Seed "Phonics Chart" → คลังสื่อการสอน (media)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/english/phonics-chart.html
-- Category: media — NOT a tracked game
-- Idempotent: NOT EXISTS guard on external_url
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/english/phonics-chart.html';
  v_thumb     TEXT := '/games/english/phonics-chart-cover.png';
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
    '🔤 Phonics Chart — เสียงตัวอักษรอังกฤษ',
    'สื่อการสอนภาษาอังกฤษ ป.1-3 — แผนภูมิ phonics: A–Z, blends, digraphs แตะฟังเสียง + คำตัวอย่าง (TTS)',
    v_url,
    v_thumb,
    'ภาษาอังกฤษ',
    ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['phonics','ตัวอักษร','เสียง','blends','digraphs','ภาษาอังกฤษ'],
    30,
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET
    title = '🔤 Phonics Chart — เสียงตัวอักษรอังกฤษ',
    description = 'สื่อการสอนภาษาอังกฤษ ป.1-3 — แผนภูมิ phonics: A–Z, blends, digraphs แตะฟังเสียง + คำตัวอย่าง (TTS)',
    thumbnail_url = v_thumb,
    subject = 'ภาษาอังกฤษ',
    grade_levels = ARRAY['ป.1','ป.2','ป.3'],
    tags = ARRAY['phonics','ตัวอักษร','เสียง','blends','digraphs','ภาษาอังกฤษ'],
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  RAISE NOTICE 'Seeded phonics-chart media for staff_id=%', v_staff_id;
END $$;

-- 345: Seed Thai Reading Hub — อ่านจับใจความ ป.4-5 (media)

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/thai/thai-reading-hub/index.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_media
  FROM public.educational_hub_categories WHERE category_key = 'media';
  IF v_cat_media IS NULL THEN RAISE EXCEPTION 'category media not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📚 คลังอ่านจับใจความ — เรื่องสั้น · ข่าว · วิทย์',
    'สื่อการสอนภาษาไทย ป.4-5: อ่านย่อหน้าแล้วตอบคำถาม ใจความ เหตุผล คาดการณ์ — คู่ fact-opinion',
    v_url,
    '/games/thai/thai-reading-hub/cover.png',
    'ภาษาไทย',
    ARRAY['ป.4','ป.5'],
    ARRAY['การอ่าน','จับใจความ','เรื่องสั้น','ข่าวเด็ก','ป.5'],
    91, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET title = '📚 คลังอ่านจับใจความ — เรื่องสั้น · ข่าว · วิทย์',
      description = 'สื่อการสอนภาษาไทย ป.4-5: อ่านย่อหน้าแล้วตอบคำถาม ใจความ เหตุผล คาดการณ์ — คู่ fact-opinion',
      thumbnail_url = '/games/thai/thai-reading-hub/cover.png',
      subject = 'ภาษาไทย', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['การอ่าน','จับใจความ','เรื่องสั้น','ข่าวเด็ก','ป.5'],
      sort_order = 91, tracked_game = false, is_published = true,
      category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'คลังอ่านจับใจความ ป.4-5',
    ARRAY['5 หมวด 18 บทอ่าน — เรื่องสั้น ข่าว วิทย์ จับใจความ', 'โหมดอ่านแล้วตอบ 4 ตัวเลือก', 'ท 1.1 ป.5/2–3'],
    'v1.0.0', 'Thai Reading Hub — TEACHING-MEDIA-IDEAS #5'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
      version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

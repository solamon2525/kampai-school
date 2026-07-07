-- 371: สื่อเกม 24 — วิธีคิดทีละขั้น + ตัวชี้วัด ป.4

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/math-24-thinking-media.html';
  v_thumb     TEXT := '/games/math/math-24-thinking-media-cover.png';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_media FROM public.educational_hub_categories
  WHERE category_key = 'media';
  IF v_cat_media IS NULL THEN RAISE EXCEPTION 'category media not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧠 เกม 24 — วิธีคิดทีละขั้น',
    'สื่อการสอนคณิตศาสตร์ ป.4: กรอกตัวเลข 4 ตัว แสดงวิธีคิดจนได้ 24 · ฟังอธิบาย · คู่เกม math-24',
    v_url, v_thumb, 'คณิตศาสตร์',
    ARRAY['ป.4', 'ป.5'],
    ARRAY['เกม24', 'วิธีคิด', 'สี่เหตุการณ์', 'คณิตศาสตร์'],
    95, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items SET
    title = '🧠 เกม 24 — วิธีคิดทีละขั้น',
    description = 'สื่อการสอนคณิตศาสตร์ ป.4: กรอกตัวเลข 4 ตัว แสดงวิธีคิดจนได้ 24 · ฟังอธิบาย · คู่เกม math-24',
    thumbnail_url = v_thumb,
    sort_order = 95,
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media,
    grade_levels = ARRAY['ป.4', 'ป.5'],
    tags = ARRAY['เกม24', 'วิธีคิด', 'สี่เหตุการณ์', 'คณิตศาสตร์'],
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'เกม 24 วิธีคิด (สื่อ)',
    ARRAY[
      'กรอกตัวเลข 4 ตัว (1–13)',
      'แสดงวิธีคิดทีละขั้น 3 ครั้งคำนวณ',
      'สุ่มชุดที่ทำได้',
      'ฟังอธิบาย TTS',
      'ลิงก์ไปเล่นเกม math-24'
    ],
    'v1.0.0',
    'คู่เกม /games/math/24.html (math-24)'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features    = EXCLUDED.features,
    version     = EXCLUDED.version,
    notes       = EXCLUDED.notes,
    updated_at  = now();
END $$;

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/math-24-thinking-media.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-24-thinking-media.html', 'ค 1.1 ป.4/12')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url
 AND ehi.is_published = true
 AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

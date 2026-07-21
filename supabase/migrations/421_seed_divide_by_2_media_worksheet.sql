-- Migration 421: สื่อการสอนหาร 2 ในใจ + ใบงานพิมพ์ + อัปเดต game_docs
-- สื่อ: public/games/math/divide-by-2-thinking-media.html
-- ใบงาน: public/games/math/divide-by-2-worksheet.html
-- เกมคู่: public/games/math/divide-by-2/index.html

DO $$
DECLARE
  v_staff_id    UUID;
  v_cat_media   UUID;
  v_cat_ws      UUID;
  v_media_id    UUID;
  v_game_id     UUID;
  v_url_media   TEXT := '/games/math/divide-by-2-thinking-media.html';
  v_url_ws      TEXT := '/games/math/divide-by-2-worksheet.html';
  v_url_game    TEXT := '/games/math/divide-by-2/index.html';
  v_thumb       TEXT := '/games/math/divide-by-2-thinking-media-cover.png';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'teaching staff not found'; END IF;

  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media';
  IF v_cat_media IS NULL THEN RAISE EXCEPTION 'category media not found'; END IF;

  SELECT id INTO v_cat_ws FROM public.educational_hub_categories WHERE category_key = 'worksheets' AND is_active = true;
  IF v_cat_ws IS NULL THEN RAISE EXCEPTION 'category worksheets not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- ── สื่อการสอน ──
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, corner_badge)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧠 สอนหาร 2 ในใจทีละขั้น',
    'สื่อการสอนหาร 2 ในใจ ป.2–4: แบ่งครึ่ง · คิด ? + ? · แยกหลัก · ตรวจด้วย ×2 พร้อมแผนภาพและเสียงอธิบาย',
    v_url_media, v_thumb, 'คณิตศาสตร์',
    ARRAY['ป.2', 'ป.3', 'ป.4'],
    ARRAY['การหาร', 'หาร 2', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    421, false, true, 'NEW'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url_media
  );

  UPDATE public.educational_hub_items SET
    title = '🧠 สอนหาร 2 ในใจทีละขั้น',
    description = 'สื่อการสอนหาร 2 ในใจ ป.2–4: แบ่งครึ่ง · คิด ? + ? · แยกหลัก · ตรวจด้วย ×2 พร้อมแผนภาพและเสียงอธิบาย',
    thumbnail_url = v_thumb,
    category_id = v_cat_media,
    grade_levels = ARRAY['ป.2', 'ป.3', 'ป.4'],
    tags = ARRAY['การหาร', 'หาร 2', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    sort_order = 421,
    tracked_game = false,
    is_published = true,
    corner_badge = 'NEW',
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_media;

  SELECT id INTO v_media_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_media LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id, v_staff_id,
    'สื่อสอนหาร 2 ในใจ (แผนภาพ + ขั้นตอน)',
    ARRAY[
      'แผนภาพแบ่งครึ่ง 2 กองเท่ากัน (จุด/visual)',
      'ขั้นตอน: แบ่งครึ่ง → ? + ? = N → แยกหลัก (เสริม) → ตรวจ ×2',
      'สุ่มตัวเลขคู่ 3 ระดับ ป.2–4 · TTS อ่านอธิบาย',
      'ลิงก์ไปเกม divide-by-2 และใบงานพิมพ์'
    ],
    'v1.0.0',
    'สื่อคู่เกม /games/math/divide-by-2/ · ใบงาน divide-by-2-worksheet'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features    = EXCLUDED.features,
    version     = EXCLUDED.version,
    notes       = EXCLUDED.notes,
    updated_at  = now();

  -- ── ใบงานพิมพ์ ──
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานหาร 2 ในใจ ป.2–4',
    'ฝึกหาร 2 ในใจ 10/5 ข้อต่อหน้า พร้อมช่องแบ่งครึ่ง วิธีคิด และตรวจ ×2 · QR สื่อคู่',
    v_url_ws, v_thumb, 'คณิตศาสตร์',
    ARRAY['ป.2', 'ป.3', 'ป.4'],
    ARRAY['ใบงาน', 'พิมพ์ได้', 'PDF', 'หาร 2'],
    422, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url_ws
  );

  UPDATE public.educational_hub_items SET
    title = '📝 ใบงานหาร 2 ในใจ ป.2–4',
    description = 'ฝึกหาร 2 ในใจ 10/5 ข้อต่อหน้า พร้อมช่องแบ่งครึ่ง วิธีคิด และตรวจ ×2 · QR สื่อคู่',
    thumbnail_url = v_thumb,
    category_id = v_cat_ws,
    grade_levels = ARRAY['ป.2', 'ป.3', 'ป.4'],
    tags = ARRAY['ใบงาน', 'พิมพ์ได้', 'PDF', 'หาร 2'],
    sort_order = 422,
    tracked_game = false,
    is_published = true,
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_ws;

  -- ── อัปเดต game_docs เกม divide-by-2 ──
  SELECT id INTO v_game_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_game LIMIT 1;

  IF v_game_id IS NOT NULL THEN
    UPDATE public.game_docs SET
      features = ARRAY[
        'โจทย์ตัวเลขคู่หาร 2 ลงตัว — 3 ระดับ: ง่าย (ป.2) / กลาง (ป.3) / ยาก (ป.4+)',
        'โหมดแข่ง 60 วินาที + โหมดฝึก 20 ข้อ · แถบเวลาต่อข้อ',
        'คอมโบตอบถูกติดกัน x2/x3 · ตอบเร็วได้โบนัส ⚡',
        'KampaiVersus: เดี่ยว + 2 คนเครื่องนี้ + ออนไลน์ · KAMPAI SDK score/leaderboard/TTS',
        'คู่สื่อ /games/math/divide-by-2-thinking-media.html',
        'คู่ใบงาน /games/math/divide-by-2-worksheet.html'
      ],
      version = 'v1.1.0',
      notes = 'เกม+สื่อ+ใบงาน ชุดหาร 2 ในใจ (migration 421)',
      updated_at = now()
    WHERE item_id = v_game_id;
  END IF;
END $$;

-- ตัวชี้วัดสื่อ
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/divide-by-2-thinking-media.html', 'ค 1.1 ป.2/5'),
    ('/games/math/divide-by-2-thinking-media.html', 'ค 1.1 ป.3/6'),
    ('/games/math/divide-by-2-thinking-media.html', 'ค 1.1 ป.4/9')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url AND ehi.is_published = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- ตัวชี้วัดเกม
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/divide-by-2/index.html', 'ค 1.1 ป.2/5'),
    ('/games/math/divide-by-2/index.html', 'ค 1.1 ป.3/6'),
    ('/games/math/divide-by-2/index.html', 'ค 1.1 ป.4/9')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url AND ehi.is_published = true AND ehi.tracked_game = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

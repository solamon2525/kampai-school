-- 385: สื่อการสอนการหารยาวและการหารสั้นทีละขั้น + ตัวชี้วัด ป.4 - ป.6
-- ไฟล์สื่อ: public/games/math/long-division-thinking-media.html
-- ไฟล์สื่อ: public/games/math/short-division-thinking-media.html

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id_long  UUID;
  v_item_id_short UUID;
  v_url_long  TEXT := '/games/math/long-division-thinking-media.html';
  v_thumb_long TEXT := '/games/math/long-division-thinking-media-cover.png';
  v_url_short TEXT := '/games/math/short-division-thinking-media.html';
  v_thumb_short TEXT := '/games/math/short-division-thinking-media-cover.png';
BEGIN
  -- หาเจ้าหน้าที่สอนวิชาคณิตศาสตร์ (ใช้คนเดียวกับสื่อการคูณ)
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  -- ถ้าไม่เจอ หาครูคนใดก็ได้ที่เป็น teaching
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching'
    ORDER BY created_at LIMIT 1;
  END IF;
  
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'teaching staff not found'; END IF;

  SELECT id INTO v_cat_media FROM public.educational_hub_categories
  WHERE category_key = 'media';
  IF v_cat_media IS NULL THEN RAISE EXCEPTION 'category media not found'; END IF;

  -- 1. ลงทะเบียนสื่อหารยาว
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, corner_badge)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧠 สอนหารยาวทีละขั้น',
    'สื่อการสอนการหารยาว ป.4: สุ่มโจทย์หรือตั้งตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก แสดงวิธีหารยาวทีละสเตปอย่างละเอียดพร้อมเสียงอ่านอธิบายขั้นตอน',
    v_url_long, v_thumb_long, 'คณิตศาสตร์',
    ARRAY['ป.4', 'ป.5', 'ป.6'],
    ARRAY['การหาร', 'หารยาว', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    97, false, true, 'NEW'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url_long
  );

  UPDATE public.educational_hub_items SET
    title = '🧠 สอนหารยาวทีละขั้น',
    description = 'สื่อการสอนการหารยาว ป.4: สุ่มโจทย์หรือตั้งตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก แสดงวิธีหารยาวทีละสเตปอย่างละเอียดพร้อมเสียงอ่านอธิบายขั้นตอน',
    thumbnail_url = v_thumb_long,
    sort_order = 97,
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media,
    grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6'],
    tags = ARRAY['การหาร', 'หารยาว', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    corner_badge = 'NEW',
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_long;

  SELECT id INTO v_item_id_long FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_long LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id_long, v_staff_id,
    'สอนตั้งหารยาว (สื่อ)',
    ARRAY[
      'สุ่มโจทย์หรือกรอกตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก',
      'แสดงวิธีทำทีละขั้นในตารางกระดานดำจำลองแนวตั้ง',
      'แสดงการดึงหลักเลขถัดมา การลบหักล้าง และการหาเศษย่อย',
      'ขีดเส้นใต้ตามหลักคณิตศาสตร์อย่างถูกต้อง',
      'ฟังคำอธิบายแต่ละขั้นตอนด้วยระบบเสียงพูดภาษาไทย'
    ],
    'v1.0.0',
    'สื่อคู่เกม /games/math/mth.html'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features    = EXCLUDED.features,
    version     = EXCLUDED.version,
    notes       = EXCLUDED.notes,
    updated_at  = now();

  -- 2. ลงทะเบียนสื่อหารสั้น
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, corner_badge)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧠 สอนหารสั้นทีละขั้น',
    'สื่อการสอนการหารสั้น ป.4: สุ่มโจทย์หรือตั้งตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก แสดงวิธีหารสั้นทีละขั้นตอนพร้อมสัญลักษณ์ตัวทดตัวเล็กและเสียงอ่านอธิบายอย่างละเอียด',
    v_url_short, v_thumb_short, 'คณิตศาสตร์',
    ARRAY['ป.4', 'ป.5', 'ป.6'],
    ARRAY['การหาร', 'หารสั้น', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    98, false, true, 'NEW'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url_short
  );

  UPDATE public.educational_hub_items SET
    title = '🧠 สอนหารสั้นทีละขั้น',
    description = 'สื่อการสอนการหารสั้น ป.4: สุ่มโจทย์หรือตั้งตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก แสดงวิธีหารสั้นทีละขั้นตอนพร้อมสัญลักษณ์ตัวทดตัวเล็กและเสียงอ่านอธิบายอย่างละเอียด',
    thumbnail_url = v_thumb_short,
    sort_order = 98,
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media,
    grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6'],
    tags = ARRAY['การหาร', 'หารสั้น', 'วิธีคิด', 'คณิตศาสตร์', 'สื่อการสอน'],
    corner_badge = 'NEW',
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_short;

  SELECT id INTO v_item_id_short FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url_short LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id_short, v_staff_id,
    'สอนตั้งหารสั้น (สื่อ)',
    ARRAY[
      'สุ่มโจทย์หรือกรอกตัวเลขเองได้ ตัวตั้ง 2-4 หลัก ตัวหาร 1-2 หลัก',
      'แสดงการหารสั้นพร้อมสลักเลขตัวทดสีแดงบนตัวตั้งเลียนแบบของจริง',
      'แสดงขั้นตอนการหารย่อยในใจทีละหลักละเอียดยิบ',
      'เขียนคำตอบบรรทัดล่างพร้อมเศษด้านหลัง',
      'ฟังคำอธิบายขั้นตอนต่างๆ ด้วยระบบเสียงพูดภาษาไทย'
    ],
    'v1.0.0',
    'สื่อคู่เกม /games/math/mth.html'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features    = EXCLUDED.features,
    version     = EXCLUDED.version,
    notes       = EXCLUDED.notes,
    updated_at  = now();

END $$;

-- 3. ผูกตัวชี้วัด ค 1.1 ป.4/9, 10, 11
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/long-division-thinking-media.html', 'ค 1.1 ป.4/9'),
    ('/games/math/long-division-thinking-media.html', 'ค 1.1 ป.4/10'),
    ('/games/math/long-division-thinking-media.html', 'ค 1.1 ป.4/11'),
    ('/games/math/short-division-thinking-media.html', 'ค 1.1 ป.4/9'),
    ('/games/math/short-division-thinking-media.html', 'ค 1.1 ป.4/10'),
    ('/games/math/short-division-thinking-media.html', 'ค 1.1 ป.4/11')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url
 AND ehi.is_published = true
 AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

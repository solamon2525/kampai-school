-- 383: สื่อการสอนการคูณทีละขั้น + ตัวชี้วัด ป.4
-- ไฟล์สื่อ: public/games/math/multiplication-thinking-media.html

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/multiplication-thinking-media.html';
  v_thumb     TEXT := '/games/math/multiplication-thinking-media-cover.png';
BEGIN
  -- หาเจ้าหน้าที่สอนวิชาคณิตศาสตร์ (ใช้คนเดียวกับสื่อ 24 เพื่อความสม่ำเสมอ)
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

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, corner_badge)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧠 สอนคูณแนวตั้งทีละขั้น',
    'สื่อการสอนการคูณ ป.4: สุ่มโจทย์การคูณหรือตั้งตัวเลขเองได้ตั้งแต่ 2-4 หลัก แสดงวิธีคูณแนวตั้งทีละขั้นตอนอย่างละเอียดพร้อมเสียงอ่านอธิบาย',
    v_url, v_thumb, 'คณิตศาสตร์',
    ARRAY['ป.4', 'ป.5'],
    ARRAY['การคูณ', 'วิธีคิด', 'เลขแนวตั้ง', 'คณิตศาสตร์', 'สื่อการสอน'],
    96, false, true, 'NEW'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items SET
    title = '🧠 สอนคูณแนวตั้งทีละขั้น',
    description = 'สื่อการสอนการคูณ ป.4: สุ่มโจทย์การคูณหรือตั้งตัวเลขเองได้ตั้งแต่ 2-4 หลัก แสดงวิธีคูณแนวตั้งทีละขั้นตอนอย่างละเอียดพร้อมเสียงอ่านอธิบาย',
    thumbnail_url = v_thumb,
    sort_order = 96,
    tracked_game = false,
    is_published = true,
    category_id = v_cat_media,
    grade_levels = ARRAY['ป.4', 'ป.5'],
    tags = ARRAY['การคูณ', 'วิธีคิด', 'เลขแนวตั้ง', 'คณิตศาสตร์', 'สื่อการสอน'],
    corner_badge = 'NEW',
    updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url LIMIT 1;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'สอนตั้งคูณแนวตั้ง (สื่อ)',
    ARRAY[
      'สุ่มโจทย์หรือกรอกตัวเลขเองได้ 2-4 หลัก',
      'แสดงวิธีทำทีละขั้นแบบอนิเมชันทีละหลัก',
      'จำลองการคูณเลข ตัวทด และผลคูณย่อยแต่ละแถว',
      'บวกผลคูณย่อยเป็นคำตอบสุดท้ายแบบแนวตั้ง',
      'ฟังอธิบายขั้นตอนด้วยระบบเสียง TTS ภาษาไทย'
    ],
    'v1.0.0',
    'สื่อคู่เกม /games/math/multiply-burst/index.html'
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
    ('/games/math/multiplication-thinking-media.html', 'ค 1.1 ป.4/9'),
    ('/games/math/multiplication-thinking-media.html', 'ค 1.1 ป.4/10'),
    ('/games/math/multiplication-thinking-media.html', 'ค 1.1 ป.4/11')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url
 AND ehi.is_published = true
 AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

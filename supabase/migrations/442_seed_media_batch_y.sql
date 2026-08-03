-- 442: Seed Media Batch Y (Sight Words ป.1–3 · นาฬิกา · เงินไทย · แปรงฟัน · สมบัติของแสง)
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
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

  -- E2 Sight Words ป.1–3
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '👁️ Sight Words ป.1–3',
    'สื่อการสอนภาษาอังกฤษ ป.1–3 — คำอ่านจำแยกชั้น · แฟลชการ์ด · ฝึกเลือกความหมาย · คนละชุดจาก Sight Words ป.4 · ไม่เก็บคะแนน',
    '/games/english/sight-words-p123-media.html',
    '/games/english/sight-words-p123-media-cover.png',
    'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['sight words','คำอ่านจำ','ภาษาอังกฤษ','แฟลชการ์ด'],
    176, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/sight-words-p123-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '👁️ Sight Words ป.1–3',
    description = 'สื่อการสอนภาษาอังกฤษ ป.1–3 — คำอ่านจำแยกชั้น · แฟลชการ์ด · ฝึกเลือกความหมาย · คนละชุดจาก Sight Words ป.4 · ไม่เก็บคะแนน',
    thumbnail_url = '/games/english/sight-words-p123-media-cover.png',
    subject = 'ภาษาอังกฤษ', grade_levels = ARRAY['ป.1','ป.2','ป.3'],
    tags = ARRAY['sight words','คำอ่านจำ','ภาษาอังกฤษ','แฟลชการ์ด'],
    sort_order = 176, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/sight-words-p123-media.html';

  -- M4 Clock
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🕐 นาฬิกาบอกเวลา',
    'สื่อการสอนคณิตศาสตร์ ป.1–4 — เลื่อนเข็มสั้น–ยาว · อ่านเวลา · ฝึกเลือกคำตอบ · ไม่เก็บคะแนน',
    '/games/math/clock-media.html',
    '/games/math/clock-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3','ป.4'],
    ARRAY['นาฬิกา','เวลา','คณิตศาสตร์'],
    177, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/clock-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🕐 นาฬิกาบอกเวลา',
    description = 'สื่อการสอนคณิตศาสตร์ ป.1–4 — เลื่อนเข็มสั้น–ยาว · อ่านเวลา · ฝึกเลือกคำตอบ · ไม่เก็บคะแนน',
    thumbnail_url = '/games/math/clock-media-cover.png',
    subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4'],
    tags = ARRAY['นาฬิกา','เวลา','คณิตศาสตร์'],
    sort_order = 177, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/clock-media.html';

  -- M5 Money
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🪙 เงินไทย — บาทและสตางค์',
    'สื่อการสอนคณิตศาสตร์ ป.1–3 — เหรียญ/ธนบัตร · บวกยอด · ฝึกจ่ายเงิน · คู่แนว cashier · ไม่เก็บคะแนน',
    '/games/math/thai-money-media.html',
    '/games/math/thai-money-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['เงิน','บาท','สตางค์','คณิตศาสตร์'],
    178, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/thai-money-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🪙 เงินไทย — บาทและสตางค์',
    description = 'สื่อการสอนคณิตศาสตร์ ป.1–3 — เหรียญ/ธนบัตร · บวกยอด · ฝึกจ่ายเงิน · คู่แนว cashier · ไม่เก็บคะแนน',
    thumbnail_url = '/games/math/thai-money-media-cover.png',
    subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.1','ป.2','ป.3'],
    tags = ARRAY['เงิน','บาท','สตางค์','คณิตศาสตร์'],
    sort_order = 178, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/thai-money-media.html';

  -- H2 Brush teeth
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🪥 แปรงฟันถูกวิธี',
    'สื่อการสอนสุขศึกษา ป.3 — 6 ขั้นตอนแปรงฟัน · เล่นวน · เรียงลำดับ · ไม่เก็บคะแนน',
    '/games/health/brush-teeth-media.html',
    '/games/health/brush-teeth-media-cover.png',
    'สุขศึกษา', ARRAY['ป.3'],
    ARRAY['แปรงฟัน','สุขศึกษา','อนามัยช่องปาก'],
    179, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/brush-teeth-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🪥 แปรงฟันถูกวิธี',
    description = 'สื่อการสอนสุขศึกษา ป.3 — 6 ขั้นตอนแปรงฟัน · เล่นวน · เรียงลำดับ · ไม่เก็บคะแนน',
    thumbnail_url = '/games/health/brush-teeth-media-cover.png',
    subject = 'สุขศึกษา', grade_levels = ARRAY['ป.3'],
    tags = ARRAY['แปรงฟัน','สุขศึกษา','อนามัยช่องปาก'],
    sort_order = 179, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/brush-teeth-media.html';

  -- Light
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '💡 สมบัติของแสง',
    'สื่อการสอนวิทยาศาสตร์ ป.4 — ทึบแสง · ผ่านแสงบางส่วน · โปร่งใส · จัดกลุ่มวัตถุ · ฝึกจำแนก · ไม่เก็บคะแนน',
    '/games/science/light-properties-media.html',
    '/games/science/light-properties-media-cover.png',
    'วิทยาศาสตร์', ARRAY['ป.4'],
    ARRAY['แสง','ทึบแสง','โปร่งใส','วิทยาศาสตร์'],
    180, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/light-properties-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '💡 สมบัติของแสง',
    description = 'สื่อการสอนวิทยาศาสตร์ ป.4 — ทึบแสง · ผ่านแสงบางส่วน · โปร่งใส · จัดกลุ่มวัตถุ · ฝึกจำแนก · ไม่เก็บคะแนน',
    thumbnail_url = '/games/science/light-properties-media-cover.png',
    subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.4'],
    tags = ARRAY['แสง','ทึบแสง','โปร่งใส','วิทยาศาสตร์'],
    sort_order = 180, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/light-properties-media.html';
END $$;

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/english/sight-words-p123-media.html', 'ต 1.1 ป.1/2'),
    ('/games/english/sight-words-p123-media.html', 'ต 1.1 ป.2/2'),
    ('/games/math/clock-media.html', 'ค 2.1 ป.2/1'),
    ('/games/math/clock-media.html', 'ค 2.1 ป.3/2'),
    ('/games/math/clock-media.html', 'ค 2.1 ป.4/1'),
    ('/games/math/thai-money-media.html', 'ค 2.1 ป.3/1'),
    ('/games/health/brush-teeth-media.html', 'พ 4.1 ป.3/4'),
    ('/games/science/light-properties-media.html', 'ว 2.3 ป.4/1')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/english/sight-words-p123-media.html',
     'Sight Words ป.1–3',
     ARRAY['แยกชั้น ป.1–3','แฟลชการ์ด','TTS','ฝึกเลือกความหมาย'],
     'v1.0.0', 'E2 · Media Batch Y · คนละชุดจาก sight-words-p4'),
    ('/games/math/clock-media.html',
     'นาฬิกาบอกเวลา',
     ARRAY['เลื่อนเข็ม','อธิบายเวลา','ฝึกเลือกคำตอบ','เต็มจอ'],
     'v1.0.0', 'M4 · Media Batch Y'),
    ('/games/math/thai-money-media.html',
     'เงินไทย',
     ARRAY['เหรียญ/ธนบัตร','บวกยอด','ฝึกจ่ายเงิน','คู่แนว cashier'],
     'v1.0.0', 'M5 · Media Batch Y'),
    ('/games/health/brush-teeth-media.html',
     'แปรงฟัน 6 ขั้น',
     ARRAY['เรียนรู้ทีละขั้น','เล่นวน','เรียงลำดับ'],
     'v1.0.0', 'H2 · Media Batch Y · คล้าย handwash'),
    ('/games/science/light-properties-media.html',
     'สมบัติของแสง',
     ARRAY['ทึบ/ผ่านบางส่วน/โปร่งใส','จัดกลุ่มวัตถุ','ฝึกจำแนก'],
     'v1.0.0', 'Light · Media Batch Y · ว 2.3 ป.4/1')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url AND ehi.is_published = true AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

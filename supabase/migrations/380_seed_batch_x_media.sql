-- 380: Seed Batch X media (food-groups · color-wheel · synonym · plant · moon · rect-area · bone · jobs · sufficiency · dictionary)

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

  -- helper pattern: INSERT IF NOT EXISTS + UPDATE (idempotent)

  -- H1 อาหาร 5 หมู่
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🥗 อาหารหลัก 5 หมู่',
    'สื่อการสอนสุขศึกษา ป.3–4 — เรียนรู้หมู่ الطعام · สำรวจอาหาร · จัดจานครบ 5 หมู่ · คู่เกม plate-builder · ไม่เก็บคะแนน',
    '/games/health/food-groups-media.html',
    '/games/health/food-groups-media-cover.png',
    'สุขศึกษา', ARRAY['ป.3','ป.4'],
    ARRAY['อาหาร5หมู่','โภชนาการ','สุขศึกษา','จัดจาน'],
    92, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/food-groups-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🥗 อาหารหลัก 5 หมู่',
    description = 'สื่อการสอนสุขศึกษา ป.3–4 — เรียนรู้หมู่ الطعام · สำรวจอาหาร · จัดจานครบ 5 หมู่ · คู่เกม plate-builder · ไม่เก็บคะแนน',
    thumbnail_url = '/games/health/food-groups-media-cover.png',
    subject = 'สุขศึกษา', grade_levels = ARRAY['ป.3','ป.4'],
    tags = ARRAY['อาหาร5หมู่','โภชนาการ','สุขศึกษา','จัดจาน'],
    sort_order = 92, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/food-groups-media.html';

  -- A1 วงล้อสี
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🎨 วงล้อสี — วรรณะอุ่น–เย็น',
    'สื่อการสอนศิลปะ ป.1–4 — สำรวจวงล้อสี · วรรณะอุ่น/เย็น · จัดฉาก · ผสมแม่สี · คู่เกม color-wheel · ไม่เก็บคะแนน',
    '/games/arts/color-wheel-media.html',
    '/games/arts/color-wheel-media-cover.png',
    'ศิลปะ', ARRAY['ป.1','ป.2','ป.3','ป.4'],
    ARRAY['วงล้อสี','วรรณะ','ศิลปะ','สี'],
    93, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/arts/color-wheel-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🎨 วงล้อสี — วรรณะอุ่น–เย็น',
    description = 'สื่อการสอนศิลปะ ป.1–4 — สำรวจวงล้อสี · วรรณะอุ่น/เย็น · จัดฉาก · ผสมแม่สี · คู่เกม color-wheel · ไม่เก็บคะแนน',
    thumbnail_url = '/games/arts/color-wheel-media-cover.png',
    subject = 'ศิลปะ', grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4'],
    tags = ARRAY['วงล้อสี','วรรณะ','ศิลปะ','สี'],
    sort_order = 93, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/arts/color-wheel-media.html';

  -- T4 ไวพจน์
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📝 ไวพจน์ — คำพ้องความหมาย',
    'สื่อการสอนภาษาไทย ป.4–6 — กลุ่มไวพจน์คัดสรร · โทนใช้ · แฟลชการ์ด · ฝึกเลือก · คู่เกม waipot · ไม่ซ้ำคลังคำทั้งก้อน',
    '/games/thai/synonym-media.html',
    '/games/thai/synonym-media-cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['ไวพจน์','คำพ้อง','ภาษาไทย','ความหมาย'],
    94, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/synonym-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '📝 ไวพจน์ — คำพ้องความหมาย',
    description = 'สื่อการสอนภาษาไทย ป.4–6 — กลุ่มไวพจน์คัดสรร · โทนใช้ · แฟลชการ์ด · ฝึกเลือก · คู่เกม waipot · ไม่ซ้ำคลังคำทั้งก้อน',
    thumbnail_url = '/games/thai/synonym-media-cover.png',
    subject = 'ภาษาไทย', grade_levels = ARRAY['ป.4','ป.5','ป.6'],
    tags = ARRAY['ไวพจน์','คำพ้อง','ภาษาไทย','ความหมาย'],
    sort_order = 94, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/synonym-media.html';

  -- S-plant
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🌱 ส่วนของพืชดอก',
    'สื่อการสอนวิทยาศาสตร์ ป.4 — คลิกส่วนพืช · จับคู่หน้าที่ · กินส่วนไหน · คู่เกม veggie-garden · ไม่เก็บคะแนน',
    '/games/science/plant-parts-media.html',
    '/games/science/plant-parts-media-cover.png',
    'วิทยาศาสตร์', ARRAY['ป.4'],
    ARRAY['ส่วนพืช','รากลำต้นใบดอก','วิทยาศาสตร์'],
    95, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/plant-parts-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🌱 ส่วนของพืชดอก',
    description = 'สื่อการสอนวิทยาศาสตร์ ป.4 — คลิกส่วนพืช · จับคู่หน้าที่ · กินส่วนไหน · คู่เกม veggie-garden · ไม่เก็บคะแนน',
    thumbnail_url = '/games/science/plant-parts-media-cover.png',
    subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.4'],
    tags = ARRAY['ส่วนพืช','รากลำต้นใบดอก','วิทยาศาสตร์'],
    sort_order = 95, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/plant-parts-media.html';

  -- S-moon
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🌙 ดวงจันทร์ 8 ข้าง',
    'สื่อการสอนวิทยาศาสตร์ ป.4 — วงโคจร · ไทม์ไลน์ 8 ข้าง · เรียงลำดับ · ทายข้าง · พยากรณ์ · ไม่เก็บคะแนน',
    '/games/science/moon-phases-media.html',
    '/games/science/moon-phases-media-cover.png',
    'วิทยาศาสตร์', ARRAY['ป.4'],
    ARRAY['ดวงจันทร์','ข้างขึ้นข้างแรม','วิทยาศาสตร์','ดาราศาสตร์'],
    96, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/moon-phases-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🌙 ดวงจันทร์ 8 ข้าง',
    description = 'สื่อการสอนวิทยาศาสตร์ ป.4 — วงโคจร · ไทม์ไลน์ 8 ข้าง · เรียงลำดับ · ทายข้าง · พยากรณ์ · ไม่เก็บคะแนน',
    thumbnail_url = '/games/science/moon-phases-media-cover.png',
    subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.4'],
    tags = ARRAY['ดวงจันทร์','ข้างขึ้นข้างแรม','วิทยาศาสตร์','ดาราศาสตร์'],
    sort_order = 96, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/moon-phases-media.html';

  -- M-area
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    'สื่อการสอนคณิตศาสตร์ ป.4 — กริดนับช่อง · สูตร ก×ย · โจทย์เรื่อง · แยกพื้นที่กับเส้นรอบรูป · คู่เกม mini-farm-island',
    '/games/math/rect-area-media.html',
    '/games/math/rect-area-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.4'],
    ARRAY['พื้นที่','สี่เหลี่ยม','คณิตศาสตร์','กริด'],
    97, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/rect-area-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    description = 'สื่อการสอนคณิตศาสตร์ ป.4 — กริดนับช่อง · สูตร ก×ย · โจทย์เรื่อง · แยกพื้นที่กับเส้นรอบรูป · คู่เกม mini-farm-island',
    thumbnail_url = '/games/math/rect-area-media-cover.png',
    subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.4'],
    tags = ARRAY['พื้นที่','สี่เหลี่ยม','คณิตศาสตร์','กริด'],
    sort_order = 97, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/rect-area-media.html';

  -- H-body
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🦴 กระดูก กล้ามเนื้อ ข้อ',
    'สื่อการสอนสุขศึกษา ป.4–5 — แผนภาพคลิก · แยกประเภท · นิสัยดูแลร่างกาย · ไม่เก็บคะแนน',
    '/games/health/bone-muscle-media.html',
    '/games/health/bone-muscle-media-cover.png',
    'สุขศึกษา', ARRAY['ป.4','ป.5'],
    ARRAY['กระดูก','กล้ามเนื้อ','ข้อ','สุขศึกษา','ร่างกาย'],
    98, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/bone-muscle-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🦴 กระดูก กล้ามเนื้อ ข้อ',
    description = 'สื่อการสอนสุขศึกษา ป.4–5 — แผนภาพคลิก · แยกประเภท · นิสัยดูแลร่างกาย · ไม่เก็บคะแนน',
    thumbnail_url = '/games/health/bone-muscle-media-cover.png',
    subject = 'สุขศึกษา', grade_levels = ARRAY['ป.4','ป.5'],
    tags = ARRAY['กระดูก','กล้ามเนื้อ','ข้อ','สุขศึกษา','ร่างกาย'],
    sort_order = 98, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/bone-muscle-media.html';

  -- C1 jobs
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '👷 อาชีพในชุมชน',
    'สื่อการสอนการงานอาชีพ ป.1–4 — การ์ดอาชีพไทยชุมชน · จัดกลุ่มภาค · สำคัญต่อชุมชน · คู่เกม veggie-garden',
    '/games/career/community-jobs-media.html',
    '/games/career/community-jobs-media-cover.png',
    'การงานอาชีพ', ARRAY['ป.1','ป.2','ป.3','ป.4'],
    ARRAY['อาชีพ','ชุมชน','การงานอาชีพ'],
    99, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/career/community-jobs-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '👷 อาชีพในชุมชน',
    description = 'สื่อการสอนการงานอาชีพ ป.1–4 — การ์ดอาชีพไทยชุมชน · จัดกลุ่มภาค · สำคัญต่อชุมชน · คู่เกม veggie-garden',
    thumbnail_url = '/games/career/community-jobs-media-cover.png',
    subject = 'การงานอาชีพ', grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4'],
    tags = ARRAY['อาชีพ','ชุมชน','การงานอาชีพ'],
    sort_order = 99, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/career/community-jobs-media.html';

  -- O-suff
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🌾 เศรษฐกิจพอเพียง',
    'สื่อการสอนสังคมศึกษา ป.4–6 — 3 ห่วง 2 เงื่อนไข · สถานการณ์เด็ก · แผนพอเพียงของฉัน · ไม่เก็บคะแนน',
    '/games/social/sufficiency-media.html',
    '/games/social/sufficiency-media-cover.png',
    'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['เศรษฐกิจพอเพียง','สังคมศึกษา','3ห่วง'],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/sufficiency-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '🌾 เศรษฐกิจพอเพียง',
    description = 'สื่อการสอนสังคมศึกษา ป.4–6 — 3 ห่วง 2 เงื่อนไข · สถานการณ์เด็ก · แผนพอเพียงของฉัน · ไม่เก็บคะแนน',
    thumbnail_url = '/games/social/sufficiency-media-cover.png',
    subject = 'สังคมศึกษา', grade_levels = ARRAY['ป.4','ป.5','ป.6'],
    tags = ARRAY['เศรษฐกิจพอเพียง','สังคมศึกษา','3ห่วง'],
    sort_order = 100, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/sufficiency-media.html';

  -- T-dict
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📖 พจนานุกรมดิจิทัล',
    'สื่อการสอนภาษาไทย ป.3–4 — สอนวิธีเปิดพจนานุกรม · ค้นหา · ฝึกเปิด · จัดเรียงตัวอักษร · ไม่เก็บคะแนน',
    '/games/thai/dictionary-media.html',
    '/games/thai/dictionary-media-cover.png',
    'ภาษาไทย', ARRAY['ป.3','ป.4'],
    ARRAY['พจนานุกรม','ภาษาไทย','ค้นหาคำ'],
    101, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/dictionary-media.html'
  );
  UPDATE public.educational_hub_items SET
    title = '📖 พจนานุกรมดิจิทัล',
    description = 'สื่อการสอนภาษาไทย ป.3–4 — สอนวิธีเปิดพจนานุกรม · ค้นหา · ฝึกเปิด · จัดเรียงตัวอักษร · ไม่เก็บคะแนน',
    thumbnail_url = '/games/thai/dictionary-media-cover.png',
    subject = 'ภาษาไทย', grade_levels = ARRAY['ป.3','ป.4'],
    tags = ARRAY['พจนานุกรม','ภาษาไทย','ค้นหาคำ'],
    sort_order = 101, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/dictionary-media.html';
END $$;

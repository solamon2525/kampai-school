-- 337: Seed ป.4 media batch 2 — ข้อเท็จจริง · แผนภูมิแท่ง · พลเมืองดี · จำแนกสัตว์

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

  -- ข้อเท็จจริง vs ความคิดเห็น (ท 1.1 ป.4/4)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📰 ข้อเท็จจริง vs ความคิดเห็น',
    'สื่อการสอนภาษาไทย ป.4 — เรียนรู้แยกข้อเท็จจริงกับความคิดเห็น · โหมดฝึกจำแนก · คู่เกม reading-game',
    '/games/thai/fact-opinion.html',
    '/games/thai/fact-opinion-cover.png',
    'ภาษาไทย',
    ARRAY['ป.4'],
    ARRAY['ข้อเท็จจริง','ความคิดเห็น','การอ่าน','ภาษาไทย'],
    78, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/fact-opinion.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📰 ข้อเท็จจริง vs ความคิดเห็น',
      description = 'สื่อการสอนภาษาไทย ป.4 — เรียนรู้แยกข้อเท็จจริงกับความคิดเห็น · โหมดฝึกจำแนก · คู่เกม reading-game',
      thumbnail_url = '/games/thai/fact-opinion-cover.png',
      subject = 'ภาษาไทย', grade_levels = ARRAY['ป.4'],
      tags = ARRAY['ข้อเท็จจริง','ความคิดเห็น','การอ่าน','ภาษาไทย'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/fact-opinion.html';

  -- แผนภูมิแท่ง (ค 3.1 ป.4/1)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📊 แผนภูมิแท่ง — อ่านและเปรียบเทียบ',
    'สื่อการสอนคณิตศาสตร์ ป.4 — กรอกข้อมูลวาดกราฟแท่ง · อ่านค่าสูงสุด/ต่ำสุด · โหมดฝึกอ่านกราฟ',
    '/games/math/bar-chart-media.html',
    '/games/math/bar-chart-media-cover.png',
    'คณิตศาสตร์',
    ARRAY['ป.4','ป.5'],
    ARRAY['แผนภูมิ','กราฟ','สถิติ','คณิตศาสตร์'],
    79, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/bar-chart-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📊 แผนภูมิแท่ง — อ่านและเปรียบเทียบ',
      description = 'สื่อการสอนคณิตศาสตร์ ป.4 — กรอกข้อมูลวาดกราฟแท่ง · อ่านค่าสูงสุด/ต่ำสุด · โหมดฝึกอ่านกราฟ',
      thumbnail_url = '/games/math/bar-chart-media-cover.png',
      subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['แผนภูมิ','กราฟ','สถิติ','คณิตศาสตร์'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/bar-chart-media.html';

  -- พลเมืองดี (ส 2.1 ป.4/1–5)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🤝 พลเมืองดี — หน้าที่และจริยธรรม',
    'สื่อการสอนสังคมศึกษา ป.4 — คุณลักษณะพลเมืองดี · สถานการณ์เลือกพฤติกรรม · คู่เกม good-citizen',
    '/games/social/good-citizen-media.html',
    '/games/social/good-citizen-media-cover.png',
    'สังคมศึกษา',
    ARRAY['ป.4','ป.5'],
    ARRAY['พลเมืองดี','จริยธรรม','สังคมศึกษา','หน้าที่'],
    80, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/good-citizen-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🤝 พลเมืองดี — หน้าที่และจริยธรรม',
      description = 'สื่อการสอนสังคมศึกษา ป.4 — คุณลักษณะพลเมืองดี · สถานการณ์เลือกพฤติกรรม · คู่เกม good-citizen',
      thumbnail_url = '/games/social/good-citizen-media-cover.png',
      subject = 'สังคมศึกษา', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['พลเมืองดี','จริยธรรม','สังคมศึกษา','หน้าที่'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/good-citizen-media.html';

  -- จำแนกสัตว์ (ว 1.3 ป.4/3–4)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🦴 สัตว์มี/ไม่มีกระดูกสันหลัง',
    'สื่อการสอนวิทยาศาสตร์ ป.4 — เรียนรู้สัตว์มีกระดูกสันหลัง vs ไม่มี · โหมดจัดกลุ่ม · ทดสอบ · คู่เกม blocky-safari',
    '/games/science/vertebrate-sort.html',
    '/games/science/vertebrate-sort-cover.png',
    'วิทยาศาสตร์',
    ARRAY['ป.3','ป.4'],
    ARRAY['สัตว์','กระดูกสันหลัง','ชีววิทยา','วิทยาศาสตร์'],
    81, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/vertebrate-sort.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🦴 สัตว์มี/ไม่มีกระดูกสันหลัง',
      description = 'สื่อการสอนวิทยาศาสตร์ ป.4 — เรียนรู้สัตว์มีกระดูกสันหลัง vs ไม่มี · โหมดจัดกลุ่ม · ทดสอบ · คู่เกม blocky-safari',
      thumbnail_url = '/games/science/vertebrate-sort-cover.png',
      subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.3','ป.4'],
      tags = ARRAY['สัตว์','กระดูกสันหลัง','ชีววิทยา','วิทยาศาสตร์'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/vertebrate-sort.html';
END $$;

-- 336: Seed ป.4 media batch — ทศนิยม · สสาร 3 สถานะ · แผนที่ไทย · Sight Words ป.4

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

  -- ทศนิยมสาธิต (ค 1.1 ป.4/5–6, /15–16)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🔢 ทศนิยม — อ่าน · เปรียบเทียบ · บวกลบ',
    'สื่อการสอนคณิตศาสตร์ ป.4 — แผ่นหลักสิบ อ่านทศนิยม เปรียบเทียบ บวกลบทศนิยม · โหมดฝึก · คู่เกม rounding',
    '/games/math/decimal-media.html',
    '/games/math/decimal-media-cover.png',
    'คณิตศาสตร์',
    ARRAY['ป.4','ป.5'],
    ARRAY['ทศนิยม','หลักสิบ','คณิตศาสตร์','เปรียบเทียบ'],
    74, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/decimal-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🔢 ทศนิยม — อ่าน · เปรียบเทียบ · บวกลบ',
      description = 'สื่อการสอนคณิตศาสตร์ ป.4 — แผ่นหลักสิบ อ่านทศนิยม เปรียบเทียบ บวกลบทศนิยม · โหมดฝึก · คู่เกม rounding',
      thumbnail_url = '/games/math/decimal-media-cover.png',
      subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['ทศนิยม','หลักสิบ','คณิตศาสตร์','เปรียบเทียบ'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/decimal-media.html';

  -- สสาร 3 สถานะ (ว 2.1 ป.4/3–4)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧊 สสาร 3 สถานะ — แข็ง · ของเหลว · ก๊าซ',
    'สื่อการสอนวิทยาศาสตร์ ป.4 — สไลเดอร์อุณหภูมิ น้ำแข็ง↔น้ำ↔ไอ · โหมดทดสอบ · คู่เกม sci-sort',
    '/games/science/states-of-matter.html',
    '/games/science/states-of-matter-cover.png',
    'วิทยาศาสตร์',
    ARRAY['ป.3','ป.4'],
    ARRAY['สสาร','สถานะของสสาร','อุณหภูมิ','วิทยาศาสตร์'],
    75, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/states-of-matter.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🧊 สสาร 3 สถานะ — แข็ง · ของเหลว · ก๊าซ',
      description = 'สื่อการสอนวิทยาศาสตร์ ป.4 — สไลเดอร์อุณหภูมิ น้ำแข็ง↔น้ำ↔ไอ · โหมดทดสอบ · คู่เกม sci-sort',
      thumbnail_url = '/games/science/states-of-matter-cover.png',
      subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.3','ป.4'],
      tags = ARRAY['สสาร','สถานะของสสาร','อุณหภูมิ','วิทยาศาสตร์'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/states-of-matter.html';

  -- แผนที่จังหวัด (ส 5.1 ป.4/1–2)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🗺️ แผนที่ประเทศไทย — ภาคและจังหวัด',
    'สื่อการสอนสังคมศึกษา ป.4 — แตะภาคดูจังหวัดตัวอย่าง ลักษณะทางกายภาพ · ฝึกทายภาค · คู่เกม globe-3d',
    '/games/social/thailand-map.html',
    '/games/social/thailand-map-cover.png',
    'สังคมศึกษา',
    ARRAY['ป.4'],
    ARRAY['แผนที่','จังหวัด','ภาค','สังคมศึกษา','ประเทศไทย'],
    76, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/thailand-map.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🗺️ แผนที่ประเทศไทย — ภาคและจังหวัด',
      description = 'สื่อการสอนสังคมศึกษา ป.4 — แตะภาคดูจังหวัดตัวอย่าง ลักษณะทางกายภาพ · ฝึกทายภาค · คู่เกม globe-3d',
      thumbnail_url = '/games/social/thailand-map-cover.png',
      subject = 'สังคมศึกษา', grade_levels = ARRAY['ป.4'],
      tags = ARRAY['แผนที่','จังหวัด','ภาค','สังคมศึกษา','ประเทศไทย'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/thailand-map.html';

  -- Sight Words ป.4 (ต 1.1 ป.4/2)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '👁️ Sight Words — คำอ่านจำ ป.4',
    'สื่อการสอนภาษาอังกฤษ ป.4 — การ์ดพลิกคำอ่านจำ 24 คำ พร้อมประโยคตัวอย่าง · โหมดฝึกความหมาย · คู่เกม reading-quest',
    '/games/english/sight-words-p4.html',
    '/games/english/sight-words-p4-cover.png',
    'ภาษาอังกฤษ',
    ARRAY['ป.4'],
    ARRAY['sight words','คำอ่านจำ','ภาษาอังกฤษ','อ่าน'],
    77, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/sight-words-p4.html'
  );

  UPDATE public.educational_hub_items
  SET title = '👁️ Sight Words — คำอ่านจำ ป.4',
      description = 'สื่อการสอนภาษาอังกฤษ ป.4 — การ์ดพลิกคำอ่านจำ 24 คำ พร้อมประโยคตัวอย่าง · โหมดฝึกความหมาย · คู่เกม reading-quest',
      thumbnail_url = '/games/english/sight-words-p4-cover.png',
      subject = 'ภาษาอังกฤษ', grade_levels = ARRAY['ป.4'],
      tags = ARRAY['sight words','คำอ่านจำ','ภาษาอังกฤษ','อ่าน'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/sight-words-p4.html';
END $$;

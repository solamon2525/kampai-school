-- 338: Seed ป.4 media batch 3 — มุม · สุโขทัย · ฉลากอาหาร · Follow Instructions

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

  -- มุมและโพรแทรกเตอร์ (ค 2.2 ป.4/1–2)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📐 มุม — แหลม · ฉาก · ป้าน',
    'สื่อการสอนคณิตศาสตร์ ป.4 — จำแนกชนิดมุม · โพรแทรกเตอร์ · โหมดฝึก · สร้างมุม',
    '/games/math/angle-media.html',
    '/games/math/angle-media-cover.png',
    'คณิตศาสตร์',
    ARRAY['ป.4','ป.5'],
    ARRAY['มุม','โพรแทรกเตอร์','เรขาคณิต','คณิตศาสตร์'],
    82, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/angle-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📐 มุม — แหลม · ฉาก · ป้าน',
      description = 'สื่อการสอนคณิตศาสตร์ ป.4 — จำแนกชนิดมุม · โพรแทรกเตอร์ · โหมดฝึก · สร้างมุม',
      thumbnail_url = '/games/math/angle-media-cover.png',
      subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['มุม','โพรแทรกเตอร์','เรขาคณิต','คณิตศาสตร์'],
      sort_order = 82, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/angle-media.html';

  -- สมัยสุโขทัย (ส 4.3 ป.4/1–3)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🏛️ สมัยสุโขทัย — ไทม์ไลน์',
    'สื่อการสอนสังคมศึกษา ป.4 — ไทม์ไลน์เหตุการณ์สำคัญ · บุคคลสำคัญ · โหมดทดสอบ · คู่เกม social-quiz',
    '/games/social/sukhothai-timeline.html',
    '/games/social/sukhothai-timeline-cover.png',
    'สังคมศึกษา',
    ARRAY['ป.4','ป.5'],
    ARRAY['สุโขทัย','ประวัติศาสตร์','ไทม์ไลน์','สังคมศึกษา'],
    83, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/sukhothai-timeline.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🏛️ สมัยสุโขทัย — ไทม์ไลน์',
      description = 'สื่อการสอนสังคมศึกษา ป.4 — ไทม์ไลน์เหตุการณ์สำคัญ · บุคคลสำคัญ · โหมดทดสอบ · คู่เกม social-quiz',
      thumbnail_url = '/games/social/sukhothai-timeline-cover.png',
      subject = 'สังคมศึกษา', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['สุโขทัย','ประวัติศาสตร์','ไทม์ไลน์','สังคมศึกษา'],
      sort_order = 83, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/social/sukhothai-timeline.html';

  -- อ่านฉลากอาหาร (พ 4.1 ป.4/3)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🥫 อ่านฉลากอาหาร',
    'สื่อการสอนสุขศึกษา ป.4 — สารอาหาร · วันหมดอายุ · โหมดฝึกอ่านฉลาก',
    '/games/health/food-label-media.html',
    '/games/health/food-label-media-cover.png',
    'สุขศึกษา',
    ARRAY['ป.4','ป.5'],
    ARRAY['ฉลากอาหาร','สารอาหาร','สุขศึกษา','โภชนาการ'],
    84, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/food-label-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🥫 อ่านฉลากอาหาร',
      description = 'สื่อการสอนสุขศึกษา ป.4 — สารอาหาร · วันหมดอายุ · โหมดฝึกอ่านฉลาก',
      thumbnail_url = '/games/health/food-label-media-cover.png',
      subject = 'สุขศึกษา', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['ฉลากอาหาร','สารอาหาร','สุขศึกษา','โภชนาการ'],
      sort_order = 84, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/food-label-media.html';

  -- Follow Instructions (ต 1.1 ป.4/1, /3)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '👂 Follow Instructions',
    'สื่อการสอนภาษาอังกฤษ ป.4 — ฟัง/อ่านคำสั่งแล้วเลือกภาพ · โหมดฝึก · คู่เกม sentence-builder',
    '/games/english/follow-instructions.html',
    '/games/english/follow-instructions-cover.png',
    'ภาษาอังกฤษ',
    ARRAY['ป.4'],
    ARRAY['คำสั่ง','ฟัง','อ่าน','ภาษาอังกฤษ'],
    85, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/follow-instructions.html'
  );

  UPDATE public.educational_hub_items
  SET title = '👂 Follow Instructions',
      description = 'สื่อการสอนภาษาอังกฤษ ป.4 — ฟัง/อ่านคำสั่งแล้วเลือกภาพ · โหมดฝึก · คู่เกม sentence-builder',
      thumbnail_url = '/games/english/follow-instructions-cover.png',
      subject = 'ภาษาอังกฤษ', grade_levels = ARRAY['ป.4'],
      tags = ARRAY['คำสั่ง','ฟัง','อ่าน','ภาษาอังกฤษ'],
      sort_order = 85, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/follow-instructions.html';
END $$;

-- 339: Seed M1 เส้นจำนวน · S2 ระบบย่อยอาหาร · O3 ล้างมือ

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

  -- M1 เส้นจำนวน (ค 1.1 ป.1/2–3 · ค 1.1 ป.2/1)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📏 เส้นจำนวน — เปรียบเทียบ · เรียงลำดับ',
    'สื่อการสอนคณิตศาสตร์ ป.1–3 — ลากจุดบนเส้นจำนวน · เปรียบเทียบ · เรียงลำดับ · ไม่เก็บคะแนน (fork จาก number-line)',
    '/games/math/number-line-media.html',
    '/games/math/number-line-media-cover.png',
    'คณิตศาสตร์',
    ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['เส้นจำนวน','เปรียบเทียบ','เรียงลำดับ','คณิตศาสตร์'],
    86, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/number-line-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📏 เส้นจำนวน — เปรียบเทียบ · เรียงลำดับ',
      description = 'สื่อการสอนคณิตศาสตร์ ป.1–3 — ลากจุดบนเส้นจำนวน · เปรียบเทียบ · เรียงลำดับ · ไม่เก็บคะแนน (fork จาก number-line)',
      thumbnail_url = '/games/math/number-line-media-cover.png',
      subject = 'คณิตศาสตร์', grade_levels = ARRAY['ป.1','ป.2','ป.3'],
      tags = ARRAY['เส้นจำนวน','เปรียบเทียบ','เรียงลำดับ','คณิตศาสตร์'],
      sort_order = 86, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/number-line-media.html';

  -- S2 ระบบย่อยอาหาร (ว 1.2 ป.6/4–5 · พ 1.1 ป.5/1)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🫁 ระบบย่อยอาหาร — แผนภาพคลิกได้',
    'สื่อการสอนวิทยาศาสตร์ ป.4–6 — แตะอวัยวะระบบย่อย · เรียงลำดับการย่อย · คู่เกม digestive-ar',
    '/games/science/digestive-system-media.html',
    '/games/science/digestive-system-media-cover.png',
    'วิทยาศาสตร์',
    ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['ระบบย่อยอาหาร','ร่างกายมนุษย์','ชีววิทยา','วิทยาศาสตร์'],
    87, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/digestive-system-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🫁 ระบบย่อยอาหาร — แผนภาพคลิกได้',
      description = 'สื่อการสอนวิทยาศาสตร์ ป.4–6 — แตะอวัยวะระบบย่อย · เรียงลำดับการย่อย · คู่เกม digestive-ar',
      thumbnail_url = '/games/science/digestive-system-media-cover.png',
      subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.4','ป.5','ป.6'],
      tags = ARRAY['ระบบย่อยอาหาร','ร่างกายมนุษย์','ชีววิทยา','วิทยาศาสตร์'],
      sort_order = 87, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/digestive-system-media.html';

  -- O3 ล้างมือ 7 ขั้น (พ 4.1 ป.1/1 · ว 1.2 ป.1/2)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🧼 ล้างมือ 7 ขั้นตอน',
    'สื่อการสอนสุขศึกษา ป.1–3 — เรียงขั้นตอนล้างมือถูกวิธี · สุขบัญญัติ · คู่เกม handwash-order',
    '/games/health/handwash-media.html',
    '/games/health/handwash-media-cover.png',
    'สุขศึกษา',
    ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['ล้างมือ','สุขบัญญัติ','สุขศึกษา','สุขอนามัย'],
    88, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/handwash-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🧼 ล้างมือ 7 ขั้นตอน',
      description = 'สื่อการสอนสุขศึกษา ป.1–3 — เรียงขั้นตอนล้างมือถูกวิธี · สุขบัญญัติ · คู่เกม handwash-order',
      thumbnail_url = '/games/health/handwash-media-cover.png',
      subject = 'สุขศึกษา', grade_levels = ARRAY['ป.1','ป.2','ป.3'],
      tags = ARRAY['ล้างมือ','สุขบัญญัติ','สุขศึกษา','สุขอนามัย'],
      sort_order = 88, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/health/handwash-media.html';
END $$;

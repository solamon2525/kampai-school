-- 335: Seed T3 ชนิดของคำ + E3 Grammar mini → คลังสื่อการสอน (media)

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

  -- T3: ชนิดของคำ
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📚 ชนิดของคำ — นาม · กริยา · คุณศัพท์',
    'สื่อการสอนภาษาไทย ป.3-4 — เรียนรู้คำนาม คำกริยา คำคุณศัพท์ · โหมดฝึก · จัดคำใส่กล่อง · คู่เกม Attack on Noun',
    '/games/thai/thai-word-types.html',
    '/games/thai/thai-word-types-cover.png',
    'ภาษาไทย',
    ARRAY['ป.3','ป.4'],
    ARRAY['ชนิดของคำ','คำนาม','คำกริยา','คำคุณศัพท์','ไวยากรณ์'],
    72, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/thai-word-types.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📚 ชนิดของคำ — นาม · กริยา · คุณศัพท์',
      description = 'สื่อการสอนภาษาไทย ป.3-4 — เรียนรู้คำนาม คำกริยา คำคุณศัพท์ · โหมดฝึก · จัดคำใส่กล่อง · คู่เกม Attack on Noun',
      thumbnail_url = '/games/thai/thai-word-types-cover.png',
      subject = 'ภาษาไทย', grade_levels = ARRAY['ป.3','ป.4'],
      tags = ARRAY['ชนิดของคำ','คำนาม','คำกริยา','คำคุณศัพท์','ไวยากรณ์'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/thai-word-types.html';

  -- E3: Grammar mini
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📝 Grammar Mini — is/are · a/an',
    'สื่อการสอนภาษาอังกฤษ ป.3-4 — กฎ is/are และ a/an พร้อมตัวอย่าง · โหมดฝึกเลือกคำตอบ (ไม่จับเวลา)',
    '/games/english/grammar-mini.html',
    '/games/english/grammar-mini-cover.png',
    'ภาษาอังกฤษ',
    ARRAY['ป.3','ป.4'],
    ARRAY['grammar','is are','a an','ภาษาอังกฤษ','ไวยากรณ์'],
    73, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/grammar-mini.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📝 Grammar Mini — is/are · a/an',
      description = 'สื่อการสอนภาษาอังกฤษ ป.3-4 — กฎ is/are และ a/an พร้อมตัวอย่าง · โหมดฝึกเลือกคำตอบ (ไม่จับเวลา)',
      thumbnail_url = '/games/english/grammar-mini-cover.png',
      subject = 'ภาษาอังกฤษ', grade_levels = ARRAY['ป.3','ป.4'],
      tags = ARRAY['grammar','is are','a an','ภาษาอังกฤษ','ไวยากรณ์'],
      tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/english/grammar-mini.html';
END $$;

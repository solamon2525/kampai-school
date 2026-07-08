-- 376: Seed T5 โครงสร้างประโยค · S4 ห่วงโซ่อาหาร · O4 คัดแยกขยะ (สื่อคู่เกม)

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

  -- T5 โครงสร้างประโยค (ท 4.1 ป.3/4 · ท 4.1 ป.5/2) — คู่ sentence-craft · ไม่ทับ thai-sentence-hub
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '📝 โครงสร้างประโยค — ประธาน กริยา กรรม',
    'สื่อการสอนภาษาไทย ป.3–5 — เรียนรู้โครงสร้างประโยค · เรียงคำให้ถูก · คู่เกม sentence-craft · ไม่เก็บคะแนน',
    '/games/thai/sentence-structure.html',
    '/games/thai/sentence-structure-cover.png',
    'ภาษาไทย',
    ARRAY['ป.3','ป.4','ป.5'],
    ARRAY['โครงสร้างประโยค','ประธาน','กริยา','กรรม','ภาษาไทย'],
    89, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/sentence-structure.html'
  );

  UPDATE public.educational_hub_items
  SET title = '📝 โครงสร้างประโยค — ประธาน กริยา กรรม',
      description = 'สื่อการสอนภาษาไทย ป.3–5 — เรียนรู้โครงสร้างประโยค · เรียงคำให้ถูก · คู่เกม sentence-craft · ไม่เก็บคะแนน',
      thumbnail_url = '/games/thai/sentence-structure-cover.png',
      subject = 'ภาษาไทย', grade_levels = ARRAY['ป.3','ป.4','ป.5'],
      tags = ARRAY['โครงสร้างประโยค','ประธาน','กริยา','กรรม','ภาษาไทย'],
      sort_order = 89, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/sentence-structure.html';

  -- S4 ห่วงโซ่อาหาร (ว 1.1 ป.5/3) — คู่ food-chain
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '🌿 ห่วงโซ่อาหาร — ผู้ผลิตถึงผู้ล่า',
    'สื่อการสอนวิทยาศาสตร์ ป.4–5 — เรียนรู้บทบาทในโซ่อาหาร · เรียงตามการไหลของพลังงาน · คู่เกม food-chain',
    '/games/science/food-chain-media.html',
    '/games/science/food-chain-media-cover.png',
    'วิทยาศาสตร์',
    ARRAY['ป.4','ป.5'],
    ARRAY['ห่วงโซ่อาหาร','ผู้ผลิต','ผู้บริโภค','วิทยาศาสตร์'],
    90, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/food-chain-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '🌿 ห่วงโซ่อาหาร — ผู้ผลิตถึงผู้ล่า',
      description = 'สื่อการสอนวิทยาศาสตร์ ป.4–5 — เรียนรู้บทบาทในโซ่อาหาร · เรียงตามการไหลของพลังงาน · คู่เกม food-chain',
      thumbnail_url = '/games/science/food-chain-media-cover.png',
      subject = 'วิทยาศาสตร์', grade_levels = ARRAY['ป.4','ป.5'],
      tags = ARRAY['ห่วงโซ่อาหาร','ผู้ผลิต','ผู้บริโภค','วิทยาศาสตร์'],
      sort_order = 90, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/science/food-chain-media.html';

  -- O4 คัดแยกขยะ (ง 1.1 ป.3/3 · ง 1.1 ป.4/4) — คู่ waste-sort
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link',
    '♻️ คัดแยกขยะ 4 ถัง',
    'สื่อการสอนการงานอาชีพ ป.1–4 — เรียนรู้ถังขยะมาตรฐานไทย · ฝึกแยกขยะ · คู่เกม waste-sort · ไม่เก็บคะแนน',
    '/games/career/waste-sort-media.html',
    '/games/career/waste-sort-media-cover.png',
    'การงานอาชีพ',
    ARRAY['ป.1','ป.2','ป.3','ป.4'],
    ARRAY['คัดแยกขยะ','รีไซเคิล','สิ่งแวดล้อม','การงานอาชีพ'],
    91, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/games/career/waste-sort-media.html'
  );

  UPDATE public.educational_hub_items
  SET title = '♻️ คัดแยกขยะ 4 ถัง',
      description = 'สื่อการสอนการงานอาชีพ ป.1–4 — เรียนรู้ถังขยะมาตรฐานไทย · ฝึกแยกขยะ · คู่เกม waste-sort · ไม่เก็บคะแนน',
      thumbnail_url = '/games/career/waste-sort-media-cover.png',
      subject = 'การงานอาชีพ', grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4'],
      tags = ARRAY['คัดแยกขยะ','รีไซเคิล','สิ่งแวดล้อม','การงานอาชีพ'],
      sort_order = 91, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/games/career/waste-sort-media.html';
END $$;

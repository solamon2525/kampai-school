-- 351: Seed Thai Literature Hub (media)

DO $$
DECLARE v_staff_id UUID; v_cat_media UUID; v_item_id UUID;
  v_url TEXT := '/games/thai/thai-literature-hub/index.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;
  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media';
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active) VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;
  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, description, external_url, thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT v_staff_id, v_cat_media, 'link', '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    'สื่อการสอนภาษาไทย ป.4-5: นิทานพื้นบ้าน สุภาษิต คำพังเพย ข้อคิด ตัวละคร — อ่าน+ตอบคำถาม',
    v_url, '/games/thai/thai-literature-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5'], ARRAY['วรรณคดี','นิทาน','สุภาษิต','ข้อคิด'], 95, false, true
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = v_url);
  UPDATE public.educational_hub_items SET title = '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    description = 'สื่อการสอนภาษาไทย ป.4-5: นิทานพื้นบ้าน สุภาษิต คำพังเพย ข้อคิด ตัวละคร', thumbnail_url = '/games/thai/thai-literature-hub/cover.png',
    sort_order = 95, tracked_game = false, is_published = true, category_id = v_cat_media, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  SELECT id INTO v_item_id FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = v_url LIMIT 1;
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (v_item_id, v_staff_id, 'คลังวรรณคดีวรรณกรรม ป.4-5',
    ARRAY['6 หมวด 26 รายการ','นิทาน สุภาษิต คำพังเพย ข้อคิด ตัวละคร','ท 5.1 ป.4'], 'v1.0.0', 'TEACHING-MEDIA-IDEAS #6')
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();
END $$;

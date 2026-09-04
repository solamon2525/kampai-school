-- 495_seed_neural_bot_game.sql
-- Seed Neural Bot: AI Space Trainer game & game_docs
DO $$
DECLARE
  v_staff_id UUID;
  v_cat_games UUID;
  v_url TEXT := '/games/tech/neural-bot/index.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Neural Bot: สมองกลกู้จักรวาล', v_url, 'tech', 999
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'neural-bot', tracked_game = true, is_published = true,
      thumbnail_url = '/games/tech/neural-bot/cover.png', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมโฟลเดอร์มาตรฐาน',
         ARRAY[
           'ระบบจำลอง Machine Learning & Decision Boundary เรียลไทม์',
           'โหมดฝึกสอน AI ปรับ Feature และ Weights พร้อมกราฟ 2D',
           'โหมดทดสอบในสนามจริง (Inference Run) วัดผลด้วย Confidence %',
           'แข่ง 2 คน KampaiVersus (เดี่ยว / Local Hot-seat / Online)',
           'KAMPAI SDK + ระบบเสียง SFX/BGM รวม',
           'รองรับจอมือถือ 360px และ Reduced-motion / Focus styles'
         ],
         'v1.0.0',
         'เกมสื่อการสอนวิทยาการคำนวณและเทคโนโลยี จำลองการฝึกสอนโมเดลปัญญาประดิษฐ์ (AI/ML) เพื่อจำแนกวัตถุในอวกาศ'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

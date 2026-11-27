-- 595_seed_thai_mario_vocab_game.sql
DO $$
DECLARE
  v_staff_id UUID;
  v_cat_games UUID;
  v_url TEXT := '/games/thai/thai-mario-vocab/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'มาริโอตะลุยคำไทย', v_url, 'thai', 999
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'thai-mario-vocab',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/thai/thai-mario-vocab/cover.png',
      bgm_preset = 'playful',
      game_play_style = 'platformer-2d',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         '2D Platformer ผจญภัยคำศัพท์ภาษาไทย (Phaser 4)',
         ARRAY[
           'Phaser 4.2.1 Arcade Platformer แนวมาริโอ (3 ด่าน: วิสรรชนีย์ / สมาส-ตัวสะกด / การันต์)',
           'ระบบหัวใจ 5 ดวง เก็บคำถูก +100 (คอมโบ) เก็บคำผิด/ชนศัตรู/ตกเหวเสีย 1 ดวงพร้อมเฉลยหลักภาษา',
           'กราฟิก Pixel Art และเสียง 8-bit NES Chiptune + อ่านออกเสียงคำศัพท์ภาษาไทย (TTS)',
           'รองรับ 3 โหมดผ่าน KampaiVersus (เดี่ยว · 2 คนเครื่องเดียว · ออนไลน์)',
           'KAMPAI SDK + KampaiOrient + ปุ่มสัมผัสสำหรับมือถือ'
         ],
         'v1.0.0',
         'สร้างครั้งแรกด้วย Phaser 4.2.1; คำถูก +100 (+คอมโบสูงสุด +100), เหยียบศัตรู +50, เหรียญ ? +20, โบนัสผ่านด่าน +250 (+30 ต่อหัวใจที่เหลือ)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

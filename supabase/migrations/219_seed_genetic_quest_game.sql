-- 219_seed_genetic_quest_game.sql
-- เกม "Genetic Treasure Quest" — วิทยาศาสตร์ ป.6/ม.ต้น พันธุศาสตร์และการถ่ายทอดลักษณะ
-- ไฟล์: public/games/science/genetic-quest/ (โฟลเดอร์ 5 ไฟล์ + Phaser 3)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/genetic-quest/index.html';
END $$;

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/genetic-quest/index.html';
BEGIN
  -- ดึงข้อมูลครูผู้สอน ณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found'; END IF;

  -- ดึง category id สำหรับเกม
  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category "games" not found (migration 061)'; END IF;

  -- บันทึก educational_hub_profile หากยังไม่มี
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- เพิ่มตัวไอเท็มเกมหากยังไม่มี
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '🧬 Genetic Treasure Quest เกมล่าสมบัติพันธุศาสตร์', v_url, 'วิทยาศาสตร์', 219
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'genetic-quest', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/genetic-quest/cover.svg', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมผจญภัยแนว RPG สำรวจพื้นที่ 2D ด้วย Phaser 3 และตอบคำถามสะสมชิ้นส่วน DNA',
         ARRAY[
           'วิชาวิทยาศาสตร์ ป.6 และ ม.ต้น เรื่องการถ่ายทอดลักษณะทางพันธุกรรม โครโมโซม และดีเอ็นเอ',
           'แผนที่สำรวจขนาดใหญ่ 4000x4000 พิกเซล แยกเป็น 7 กลุ่มชีวนิเวศ (Biomes) อัจฉริยะ',
           'ระบบหีบสมบัติพันธุศาสตร์ (Genetic Chests) 50 แห่ง กระจายสุ่มทั่วเกาะ',
           'ระบบมอนสเตอร์ยีนกลายพันธุ์ (Mutated Genes) ที่คอยไล่ล่าและเข้าทำร้ายผู้เล่นบนแผนที่',
           'ระบบกระเป๋าเก็บชิ้นส่วน DNA (A, T, C, G, Sugars, Phosphates) เพื่อนำมาถอดรหัสจีโนม',
           'ระบุรางวัลความสำเร็จ (Achievements) ปลดล็อกตามความก้าวหน้าและการเลเวลอัป',
           'เชื่อมต่อบันทึกความคืบหน้าถาวรลงฐานข้อมูลผ่านระบบ KAMPAI SDK และ Leaderboard'
         ],
         'v1.0.0',
         'นำเข้าเกมใหม่ — Genetic Treasure Quest ล่าสมบัติพันธุศาสตร์ ป.6/ม.ต้น'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

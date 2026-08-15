-- 464_seed_animal_feast_game.sql
-- เกม "Animal Feast (ยอดนักป้อนอาหารสัตว์)" (animal-feast)
-- เกมวิทยาศาสตร์ชีวภาพ (อาหารและการดำรงชีวิตของสัตว์: สัตว์กินพืช, สัตว์กินเนื้อ, สัตว์กินทั้งสองอย่าง) ป.1-4
-- ไฟล์: public/games/science/animal-feast/ · KAMPAI SDK + KampaiVersus
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/animal-feast/index.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category "games" not found (migration 061)'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '🐾 Animal Feast (ยอดนักป้อนอาหารสัตว์)', v_url, 'วิทยาศาสตร์', 464
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'animal-feast', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/animal-feast/cover.png', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Casual Diet Sorting & Matching — จำแนกอาหารสัตว์กินพืช (Herbivore), สัตว์กินเนื้อ (Carnivore), สัตว์กินทั้งสองอย่าง (Omnivore)',
         ARRAY[
           'คลังสัตว์น่ารัก 16+ ชนิด พร้อมภาพจำลอง แอนิเมชันเคี้ยวอาหาร และเสียงร้องน่ารัก',
           'ระบบป้อนอาหาร 2 ถาดใหญ่: 🌿 พืช/ผัก/ผลไม้ vs 🥩 เนื้อสัตว์/ปลา เล่นง่าย เข้าใจทันที',
           'รองรับสัตว์กินทั้งพืชและสัตว์ (Omnivore) ที่รับอาหารได้ทั้ง 2 ชนิดพร้อมโบนัสคอมโบพิเศษ',
           'ระบบ Frenzy Combo เมื่อป้อนอาหารถูกต้องต่อเนื่อง 5 ครั้งขึ้นไป',
           'รองรับการแข่งขันดวล 2 คน (Versus Mode) และบันทึกคะแนนขึ้นระบบลีดเดอร์บอร์ดโรงเรียน'
         ],
         'v1.0.0',
         'เกมวิทยาศาสตร์ชีวภาพเรื่องอาหารของสัตว์ สำหรับนักเรียนระดับประถมศึกษา (ป.1 - ป.4)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

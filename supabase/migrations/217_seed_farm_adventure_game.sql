-- 217_seed_farm_adventure_game.sql
-- เกม "Farm Adventure: ภารกิจวัดความยาวในฟาร์มมหาสนุก" — คณิตศาสตร์ ป.4 วัดความยาว
-- ไฟล์: public/games/math/farm-adventure/ (โฟลเดอร์ 5 ไฟล์)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/farm-adventure/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🌾 Farm Adventure ภารกิจวัดความยาวในฟาร์มมหาสนุก', v_url, 'คณิตศาสตร์', 217
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'farm-adventure', tracked_game = true, is_published = true,
      thumbnail_url = '/games/math/farm-adventure/cover.svg', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ตอบคำถาม/quiz + ผจญภัยฟาร์ม 5 ด่าน',
         ARRAY[
           '5 ด่าน: วัดความยาว, เปรียบเทียบ, แปลงหน่วย mm/cm/m/km, บวก-ลบความยาว, โจทย์ปัญหาประยุกต์',
           'โจทย์สุ่มใหม่ทุกรอบ 10 ข้อ/ด่าน ไม่ซ้ำ',
           'ระบบหัวใจ 5 ดวง + ระบบ streak combo + เหรียญทอง',
           'ปลดล็อกสัตว์เลี้ยง Chibi (หมู วัว กระต่าย ไก่ ม้า)',
           'เลือกชาวนาน้อยชาย/หญิง',
           'หน้าคำแนะนำ + เลือกด่าน + สรุปคะแนน + confetti',
           'responsive มือถือ/แท็บเล็ต/เดสก์ท็อป',
           'leaderboard + stats ในเกม + บันทึกคะแนนสูงสุด localStorage'
         ],
         'v1.0.0',
         'สร้างครั้งแรก — เกมคณิตศาสตร์ ป.4 เรื่องการวัดความยาว ธีมฟาร์ม Chibi'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

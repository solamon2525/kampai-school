-- 246_seed_animal_habitat_3d_game.sql
-- เกม "เกาะหรรษา คัดแยกสัตว์ 3 มิติ" — วิทยาศาสตร์ เรื่องสิ่งมีชีวิตและสิ่งแวดล้อม
-- ไฟล์: public/games/science/animal-habitat-3d/ (โครงสร้าง 5 ไฟล์ + Three.js)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/animal-habitat-3d/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🏝️ เกาะหรรษา คัดแยกสัตว์ 3 มิติ', v_url, 'วิทยาศาสตร์', 246
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'animal-habitat-3d', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/animal-habitat-3d/cover.png', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดเกมลงใน game_docs เพื่อให้โชว์ในระบบหลังบ้านครูและนักเรียน
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมจัดหมวดหมู่สัตว์และถิ่นที่อยู่ 3 มิติ (Voxel 3D Classifier) ด้วย Three.js',
         ARRAY[
           'วิชาวิทยาศาสตร์ เรื่องสิ่งมีชีวิตกับสิ่งแวดล้อม การคัดแยกประเภทสัตว์และถิ่นที่อยู่หลัก 4 โซน (ป่าไม้, ทะเลทราย, ขั้วโลก, มหาสมุทร)',
           'โมเดลสัตว์ 3D สไตล์บล็อกพิกเซล (Voxel) ดีไซน์น่ารักเหมาะสมกับเด็กวัยประถมถึง 12 สายพันธุ์',
           'แอนิเมชันเคลื่อนไหวสมจริงแบบสามมิติ การปะทุของเอฟเฟกต์คะแนนและดาว ณ ตำแหน่งวัตถุในจอ',
           'คำใบ้ความรู้ทางวิทยาศาสตร์สอดแทรกข้อมูลเกี่ยวกับประเภทอาหาร พฤติกรรม และการดำรงชีวิตของสัตว์',
           'ระบบรองรับการเล่นท้าดวลแข่งความไว 2 ผู้เล่น ทั้งแบบสลับตาเล่นบนเครื่องเดียวกัน (Versus Hot-seat) และแข่งสดแบบออนไลน์'
         ],
         'v1.0.0',
         'สร้างเกมจัดหมวดหมู่ถิ่นที่อยู่สัตว์ 3 มิติครั้งแรก รองรับ Versus และ Online'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

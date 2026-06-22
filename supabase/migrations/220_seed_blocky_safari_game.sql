-- 220_seed_blocky_safari_game.sql
-- เกม "Blocky Safari" — วิทยาศาสตร์ ป.4 การจำแนกประเภทกลุ่มสัตว์
-- ไฟล์: public/games/science/blocky-safari/ (โฟลเดอร์ 5 ไฟล์ + Three.js)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/blocky-safari/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🏕️ Blocky Safari สุดยอดนักสำรวจพิทักษ์สัตว์โลก', v_url, 'วิทยาศาสตร์', 220
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'blocky-safari', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/blocky-safari/cover.svg', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมสำรวจป่า 3D ด้วย Three.js และตอบคำถามจำแนกประเภทกลุ่มสัตว์ ป.4 (มีทั้งหมด 3 ด่านสะสมสถิติ)',
         ARRAY[
           'วิชาวิทยาศาสตร์ ป.4 เรื่องการจำแนกกลุ่มสัตว์ (สัตว์เลี้ยงลูกด้วยนม สัตว์ปีก สัตว์เลื้อยคลาน สัตว์สะเทินน้ำสะเทินบก และปลา)',
           'สภาพแวดล้อม 3D แบบเรียลไทม์ ใช้กล้องวิ่งตามตัวละครทรงลูกบาศก์สุดน่ารัก',
           'ขยายระบบเกมให้มีทั้งหมด 3 ด่านสะสมความก้าวหน้า พร้อมสัตว์ป่า 15 ชนิดที่ท้าทายมากขึ้นในแต่ละด่าน',
           'ระบบตอบคำถามแยกประเภทสัตว์พร้อมระบบใบ้คำถามและประเมินผลการเรียนรู้แบบมีคำแนะนำ',
           'การเชื่อมโยงระบบบันทึกคะแนนส่วนตัว (Personal Best) และประวัติการเล่น (Plays) ลงโปรไฟล์ผ่าน KAMPAI SDK',
           'ระบบจัดอันดับนักเรียน (Leaderboard) แบบเรียลไทม์เพื่อเพิ่มความตื่นเต้นและสร้างแรงจูงใจในการเรียนรู้'
         ],
         'v1.0.0',
         'นำเข้าเกมใหม่ — Blocky Safari สุดยอดนักสำรวจพิทักษ์สัตว์โลก ป.4 (3 ด่าน 15 สัตว์)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

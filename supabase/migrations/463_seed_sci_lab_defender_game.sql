-- 463_seed_sci_lab_defender_game.sql
-- เกม "Sci-Lab Defender (AR วันวิทย์)" — วิทยาศาสตร์ ป.1-6 กิจกรรมวันวิทยาศาสตร์ 3 ฐาน
-- ไฟล์: public/games/science/sci-lab-defender/ (โฟลเดอร์ 5 ไฟล์ + cover.png 16:9)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/sci-lab-defender/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🧪 Sci-Lab Defender (AR วันวิทย์)', v_url, 'วิทยาศาสตร์', 463
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'sci-lab-defender', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/sci-lab-defender/cover.png', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR/กล้อง (MediaPipe Hands) — ผสาน 3 ฐานกิจกรรมวันวิทยาศาสตร์',
         ARRAY[
           'ฐานที่ 1: เคมีและสสาร — เลื่อนมือถือบีกเกอร์รับสสาร (ของแข็ง/ของเหลว/แก๊ส) ตามโจทย์ภารกิจ',
           'ฐานที่ 2: แสงและพลังงาน — ใช้มือ 2 ข้างเป็นกระจกเงาสะท้อนแสงเลเซอร์เข้าสู่แท่นชาร์จโซลาร์เซลล์',
           'ฐานที่ 3: อวกาศและดาราศาสตร์ — ใช้นิ้วชี้จิ้มระเบิดอุกกาบาตและขยะอวกาศในโหมด Fever Time',
           'ตรวจจับการเคลื่อนไหวมือ 2 ข้างด้วย KampaiHands Engine พร้อม One Euro Filter ลดการสั่นไหว',
           'ระบบ Tap & Mouse Fallback สำหรับอุปกรณ์ที่ไม่มีกล้องเว็บแคม',
           'รองรับการแข่งขันดวล 2 คน (Versus Mode) และบันทึกคะแนนขึ้นระบบลีดเดอร์บอร์ดโรงเรียน'
         ],
         'v1.0.0',
         'เกม AR กิจกรรมวันวิทยาศาสตร์แห่งชาติ สำหรับนักเรียนระดับประถมศึกษา (ป.1 - ป.6)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

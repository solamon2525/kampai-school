-- 465_seed_maglev_rush_game.sql
-- เกม "🧲 Maglev Rush (รถไฟแม่เหล็ก)" — วิทยาศาสตร์ ป.1-6 เรื่องแรงและแม่เหล็ก (ว 2.2)
-- ไฟล์: public/games/science/maglev-rush/ (โฟลเดอร์ 5 ไฟล์ + cover.png 16:9 1280x720)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/maglev-rush/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🧲 Maglev Rush (รถไฟแม่เหล็ก)', v_url, 'วิทยาศาสตร์', 465
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND (external_url = v_url OR game_slug = 'maglev-rush')
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'maglev-rush', tracked_game = true, is_published = true,
      title = '🧲 Maglev Rush (รถไฟแม่เหล็ก)',
      external_url = v_url,
      thumbnail_url = '/games/science/maglev-rush/cover.png',
      bgm_preset = 'racer',
      build_version = 'v1.0.0',
      build_updated_at = now(),
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND (external_url = v_url OR game_slug = 'maglev-rush');

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'High-Speed Physics Runner — ซิ่งรถไฟแม่เหล็ก สลับขั้ว N-S สร้างแรงผลักเทอร์โบ และดูดเก็บสารแม่เหล็ก',
         ARRAY[
           'ควบคุมรถไฟ Maglev วิ่งบนรางแม่เหล็ก 3 เลนความเร็วสูง 180 - 480 KM/H พร้อมการลอยตัวไร้แรงเสียดทาน',
           'ระบบสลับขั้วแม่เหล็ก N/S: ขั้วเหมือนกัน (N-N, S-S) เกิดแรงผลักเทอร์โบเร่งสปีด / ขั้วต่างกันเกิดแรงดูดฉุดความเร็ว',
           'จำแนกสารแม่เหล็ก (ตะปูเหล็ก, คลิปหนีบ, ลูกปืน, เหรียญนิกเกิล, แท่งโคบอลต์) vs สิ่งกีดขวางที่ไม่ใช่แม่เหล็ก',
           'ระบบเทียบชานชาลาสถานีด้วยเบรกแม่เหล็กไฟฟ้า (Eddy Current Brake) พร้อมควิซเกร็ดความรู้วิทยาศาสตร์กายภาพ',
           'รองรับการแข่งขันประลองความเร็ว 2 คน (Versus Mode: เดี่ยว, 2 คนเครื่องเดียวกัน, ออนไลน์) และบันทึกคะแนนขึ้นระบบลีดเดอร์บอร์ด'
         ],
         'v1.0.0',
         'เกมวิทยาศาสตร์กายภาพเรื่องแรงและแม่เหล็ก (ว 2.2) สำหรับนักเรียนระดับประถมศึกษา (ป.1 - ป.6)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND (i.external_url = v_url OR i.game_slug = 'maglev-rush')
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

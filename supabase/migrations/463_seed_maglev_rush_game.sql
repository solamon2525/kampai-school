-- 463_seed_maglev_rush_game.sql
-- เกม "Maglev Rush (รถไฟแม่เหล็กและแรงมหัศจรรย์)" (maglev-rush)
-- เกมการศึกษาวิทยาศาสตร์กายภาพ (แรงแม่เหล็ก, แรงดูด-แรงผลัก, สารแม่เหล็ก, แรงเสียดทาน) ป.1-6
-- ไฟล์: public/games/science/maglev-rush/ · KAMPAI SDK + KampaiVersus
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/maglev-rush/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🧲 Maglev Rush (รถไฟแม่เหล็ก)', v_url, 'วิทยาศาสตร์', 463
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'maglev-rush', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/maglev-rush/cover.png', bgm_preset = 'racer', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'High-Speed Physics Runner — ซิ่งรถไฟแม่เหล็ก สลับขั้ว N-S สร้างแรงผลักเทอร์โบ และดูดเก็บสารแม่เหล็ก',
         ARRAY[
           'ควบคุมรถไฟ Maglev วิ่งบนรางแม่เหล็ก 3 เลนความเร็วสูง 140 - 350 KM/H',
           'ระบบสลับขั้วแม่เหล็ก N/S: ขั้วเหมือนกัน (N-N, S-S) เกิดแรงผลักเทอร์โบ / ขั้วต่างกันเกิดแรงดูด',
           'จำแนกสารแม่เหล็ก (ตะปูเหล็ก, คลิปหนีบ, ลูกปืน, เหรียญนิกเกิล, แท่งโคบอลต์) vs สิ่งกีดขวางที่ไม่ใช่แม่เหล็ก',
           'ระบบเทียบชานชาลาสถานีด้วยเบรกแม่เหล็กไฟฟ้า (Eddy Current Brake) พร้อมเกร็ดความรู้วิทยาศาสตร์',
           'รองรับการแข่งขันประลองความเร็ว 2 คน (Versus Mode) และบันทึกคะแนนขึ้นระบบลีดเดอร์บอร์ดโรงเรียน'
         ],
         'v1.0.0',
         'เกมวิทยาศาสตร์กายภาพเรื่องแรงและแม่เหล็ก สำหรับนักเรียนระดับประถมศึกษา (ป.1 - ป.6)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

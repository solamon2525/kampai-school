-- 109_seed_multiply_race_game.sql
-- เกม "แข่งสูตรคูณ" (multiply-race) — Quiz Race สูตรคูณ 2–12 เน้นเร็ว/คล่อง
-- ฝัง KAMPAI SDK (เก็บคะแนน + leaderboard) ที่ public/games/math/multiply-race.html
-- Idempotent: re-run แล้วจำนวนไม่เพิ่ม (NOT EXISTS guard on external_url) + sync flags ทุกครั้ง
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/multiply-race.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found — seed staff first';
  END IF;

  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found — migration 061 must run first';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- สร้าง item ถ้ายังไม่มี
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'แข่งสูตรคูณ', v_url, 'คณิตศาสตร์', 35
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- เปิดระบบเก็บคะแนน (game_slug ต้องตรงกับ GAME_SLUG ในไฟล์เกม)
  UPDATE public.educational_hub_items
  SET game_slug = 'multiply-race', tracked_game = true, is_published = true, updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

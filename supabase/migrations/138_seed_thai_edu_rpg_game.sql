-- 138_seed_thai_edu_rpg_game.sql
-- เกม RPG "ภารกิจกอบกู้อาณาจักร" (thai-edu-rpg) — บูรณาการ ไทย+คณิต ป.4-5
-- ตอบคำถามคณิต/ไทยเพื่อโจมตีบอส · 15 บอส 5 โซน · อาชีพ/เลเวล/การ์ด/achievements/lore
-- port จากไฟล์เดี่ยว: ตัด Firebase PvP/Live Class/Teacher Mode + ใส่ KAMPAI SDK + ขยายคลังคำถาม 40+40
-- public/games/thai/thai-edu-rpg.html
-- Idempotent: re-run แล้วจำนวนไม่เพิ่ม (NOT EXISTS guard) + sync flags/thumbnail ทุกครั้ง
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/thai/thai-edu-rpg.html';
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

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ภารกิจกอบกู้อาณาจักร', v_url, 'บูรณาการ (ไทย+คณิต)', 28
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'thai-edu-rpg', tracked_game = true, is_published = true,
      thumbnail_url = '/games/thai/thai-edu-rpg-cover.png', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

-- 247_seed_weight_adventure_game.sql
-- เกม "ผจญภัยชั่งน้ำหนัก" (weight-adventure) — platformer อ่านเข็มเครื่องชั่งสปริง 1–10 กก.
-- ไฟล์: public/games/math/weight-adventure.html · KAMPAI SDK + KampaiVersus
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/weight-adventure.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '⚖️ ผจญภัยชั่งน้ำหนัก (Platformer)', v_url, 'คณิตศาสตร์', 247
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'weight-adventure', tracked_game = true, is_published = true,
      thumbnail_url = '/games/math/weight-adventure-cover.svg', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Platformer canvas — อ่านเข็มเครื่องชั่งสปริง 1–10 กก. แล้วกระโดดชน bubble คำตอบ',
         ARRAY[
           'กระโดดเก็บดาว + ตอบน้ำหนักจากเข็มชั่งกลางจอ (1–10 กก.)',
           'timer 60s · ชีวิต 3 · ตอบถูก +เวลา · มือถือ D-pad + คีย์บอร์ด',
           'KampaiVersus: เดี่ยว / 2 คนเครื่องนี้ / ออนไลน์ (แข่งคะแนน)',
           'KAMPAI SDK: สถิติ + leaderboard + submitScore + XP จอจบ'
         ],
         'v1.0.0',
         'Weight Adventure — platformer ฝึกอ่านเครื่องชั่ง (migration 247)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

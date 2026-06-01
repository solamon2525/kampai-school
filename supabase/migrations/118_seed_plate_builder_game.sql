-- 118_seed_plate_builder_game.sql
-- เกม "จัดจานสุขภาพ" (plate-builder) — วิชาสุขศึกษา ป.4–6 (เกมแรกของกลุ่มสาระสุขศึกษาฯ)
-- public/games/health/plate-builder.html (KAMPAI SDK + kampai-match online)
-- Idempotent (NOT EXISTS guard) + sync flags/thumbnail/bgm
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/health/plate-builder.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'จัดจานสุขภาพ', v_url, 'สุขศึกษาและพลศึกษา', 15
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = v_url);

  UPDATE public.educational_hub_items
  SET game_slug = 'plate-builder', tracked_game = true, is_published = true,
      thumbnail_url = '/games/health/plate-builder-cover.svg', bgm_preset = 'warm', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

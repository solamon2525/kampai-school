-- 395_seed_pixel_forest_explorer_game.sql
-- Seed the top-down pixel forest game using the current educational hub schema.

DO $$
DECLARE
  v_staff_id uuid;
  v_category_id uuid;
  v_item_id uuid;
  v_url text := '/games/general/pixel-forest-explorer/index.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'teaching staff not found'; END IF;

  SELECT id INTO v_category_id FROM public.educational_hub_categories
  WHERE category_key = 'games' LIMIT 1;
  IF v_category_id IS NULL THEN RAISE EXCEPTION 'games category not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE game_slug = 'pixel-forest-explorer' LIMIT 1;

  IF v_item_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description,
      external_url, thumbnail_url, subject, grade_levels, tags,
      tracked_game, is_published, game_slug, bgm_preset, corner_badge,
      game_play_style, build_version, build_updated_at
    ) VALUES (
      v_staff_id, v_category_id, 'link', 'ฮีโร่จิ๋วผจญป่า',
      'เกม RPG พิกเซลอาร์ตมุมมองบนลงล่าง สำรวจป่า ต่อสู้มอนสเตอร์และพัฒนาฮีโร่',
      v_url, '/games/general/pixel-forest-explorer/cover.svg', 'ทั่วไป',
      ARRAY['ทุกระดับ'], ARRAY['RPG', 'ผจญภัย', 'พิกเซลอาร์ต'],
      true, true, 'pixel-forest-explorer', 'calm', 'NEW',
      'top-down', '1.0.0', now()
    ) RETURNING id INTO v_item_id;
  ELSE
    UPDATE public.educational_hub_items SET
      title = 'ฮีโร่จิ๋วผจญป่า',
      description = 'เกม RPG พิกเซลอาร์ตมุมมองบนลงล่าง สำรวจป่า ต่อสู้มอนสเตอร์และพัฒนาฮีโร่',
      category_id = v_category_id,
      external_url = v_url,
      thumbnail_url = '/games/general/pixel-forest-explorer/cover.svg',
      tracked_game = true,
      is_published = true,
      bgm_preset = 'calm',
      updated_at = now()
    WHERE id = v_item_id;
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id, 'Canvas 2D top-down pixel-art exploration',
    ARRAY[
      'แผนที่ป่าขนาดใหญ่แบบ procedural',
      'ฮีโร่เดิน 4 ทิศพร้อม walk cycle และกล้องติดตาม',
      'WASD ลูกศร และ touch D-pad',
      'KampaiVersus local และ online พร้อม leaderboard'
    ],
    '1.0.0', 'กราฟิก Canvas และ SVG ต้นฉบับภายในโครงการ ไม่พึ่ง asset ภายนอก'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    owner_staff_id = EXCLUDED.owner_staff_id,
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

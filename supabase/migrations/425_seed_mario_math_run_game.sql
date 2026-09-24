-- 425_seed_mario_math_run_game.sql
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/mario-math-run/index.html';
  v_item_id   UUID;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO UPDATE SET is_hub_active = true;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  IF v_item_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, external_url,
      subject, sort_order, game_slug, tracked_game, is_published,
      thumbnail_url, bgm_preset, game_play_style
    ) VALUES (
      v_staff_id, v_cat_games, 'link', '🍄 Mario Math Run — มาริโอ้ลุยโจทย์คณิต', v_url,
      'คณิตศาสตร์', 36, 'mario-math-run', true, true,
      '/games/math/mario-math-run/cover.png', 'cheerful', 'platformer-2d'
    ) RETURNING id INTO v_item_id;
  ELSE
    UPDATE public.educational_hub_items SET
      title = '🍄 Mario Math Run — มาริโอ้ลุยโจทย์คณิต',
      sort_order = 36,
      game_slug = 'mario-math-run',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/mario-math-run/cover.png',
      bgm_preset = 'cheerful',
      game_play_style = 'platformer-2d',
      updated_at = now()
    WHERE id = v_item_id;
  END IF;

  INSERT INTO public.game_docs (
    item_id, owner_staff_id, game_format, features, version, notes, updated_at
  ) VALUES (
    v_item_id,
    v_staff_id,
    '2D Auto-Scrolling Platformer (Mario style) — ฉากไหลอัตโนมัติ 5 หัวใจ กระโดดข้ามหลุม/หลบมอนสเตอร์ โหม่งบล็อกคำตอบเปลี่ยนเป็นก้อนหินเหยียบได้',
    ARRAY[
      'ระบบหัวใจ 5 ดวง (5 Lives) เพิ่มโอกาสแก้ตัวในการลุยด่าน',
      'หากชุดบล็อกคำตอบไหลหลุดขอบจอโดยไม่ได้ตอบ ระบบจะสุ่มโจทย์ใหม่ให้อัตโนมัติทันที',
      'บล็อกคำตอบเมื่อถูกโหม่งแล้วจะเปลี่ยนเป็นก้อนหิน/อิฐเปล่า แข็งแข็งที่ผู้เล่นสามารถกระโดดขึ้นไปเหยียบ/ยืนต่อได้',
      'ฉากไหลอัตโนมัติจากขวาไปซ้าย มีหลุมข้าม (Pits) มอนสเตอร์ (Goombas) และบล็อกลอยโหม่งเลือกตอบ',
      'โหมดเล่น 1 คน (Solo) และโหมดแข่ง 2 คนในหน้าจอเดียว (Same-Screen Race P1 vs P2)',
      'เชื่อมต่อระบบ KampaiVersus รองรับทั้งแข่ง local hot-seat และแข่งออนไลน์ต่างเครื่อง'
    ],
    'v1.2.0',
    'เพิ่มระบบหัวใจ 5 ดวง สุ่มโจทย์ใหม่อัตโนมัติเมื่อบล็อกพ้นจอ และเปลี่ยนบล็อกที่โหม่งแล้วเป็นก้อนหินเหยียบยืนได้',
    now()
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

-- 217_seed_catch_numbers_game.sql
-- เกม "รับเลขให้ถูก" (catch-numbers) — AR overlay arcade: ของหล่นบนภาพกล้อง ขยับตัวรับให้ตรงกติกา
-- ไฟล์: public/games/math/catch-numbers/ · KampaiAR v1.1.0 (ใช้ ar.x) + KAMPAI SDK
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/catch-numbers/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🧺 รับเลขให้ถูก (AR)', v_url, 'คณิตศาสตร์', 217
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'catch-numbers', tracked_game = true, is_published = true,
      thumbnail_url = '/games/math/catch-numbers/cover.png', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR overlay (arcade) — ของหล่นบนภาพกล้อง ขยับตัว/ลากตะกร้าไปรับเลขให้ตรงกติกา',
         ARRAY[
           'ตะกร้าตามตำแหน่งตัวผู้เล่น (ar.x จาก framediff) — ไม่พึ่ง CDN · engine kampai-ar.js v1.1.0',
           'แต่ละรอบมีกติกา (รับเลขคู่/พหุคูณ/มากกว่า) → รับถูก +คะแนน · รับผิด -ชีวิต (ฝึกจำแนกประเภท)',
           'fallback ลาก/แตะบนจอเลื่อนตะกร้า (เครื่องไม่มีกล้องเล่นได้)',
           'แก้กติกา/เลขที่ data.js · จูน SPAWN_MS/FALL_SPEED/CATCH_RADIUS ที่ config.js (AR-GAME.md)'
         ],
         'v1.0.0',
         'รับเลขให้ถูก — เกม AR overlay (ของหล่น-รับ) ตัวอย่างใช้ ar.x (kampai-ar.js v1.1.0, migration 217)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

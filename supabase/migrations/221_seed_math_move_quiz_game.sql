-- 221_seed_math_move_quiz_game.sql
-- เกม "ขยับตอบเลข" (math-move-quiz) — AR เลือกคำตอบ: เอียงตัวซ้าย/ขวา (หรือแตะ) เลือก A/B
-- ไฟล์: public/games/math/math-move-quiz/ · KampaiAR engine + KAMPAI SDK
-- จุดเด่น layout: จอเกมเต็มจอ + กล่องกล้องแทร็คเล็กมุมล่างขวา (ต่างจากเกม AR เดิมที่กล้องเต็มจอ)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/math-move-quiz/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🔢 ขยับตอบเลข (AR)', v_url, 'คณิตศาสตร์', 221
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'math-move-quiz', tracked_game = true, is_published = true,
      thumbnail_url = '/games/math/math-move-quiz/cover.svg', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR เลือกคำตอบซ้าย/ขวา — เอียงตัว (กล้องจับตำแหน่ง) ค้างจนแถบเต็ม เลือก A/B · จอเกมเต็มจอ + กล้องแทร็คมุมล่างขวา',
         ARRAY[
           'เอียงตัวซ้าย=A / ขวา=B ค้างจนแถบเต็ม → ตอบ (framediff ไม่พึ่ง CDN) — engine kampai-ar.js',
           'Layout ใหม่: จอเกมเต็มจอ + กล่องกล้องเล็กมุมล่างขวา (เกม AR เดิมกล้องเต็มจอ)',
           'fallback แตะแผงคำตอบ — เครื่องไม่มีกล้อง/ปฏิเสธสิทธิ์ ก็เล่นได้',
           'โจทย์คณิต ป.4–6 แบบ 2 ตัวเลือก A/B (12 ข้อ สุ่ม 10/รอบ) — แก้ที่ data.js · จูนที่ config.js'
         ],
         'v1.0.0',
         'ขยับตอบเลข — เกม AR คณิต A/B, layout กล้องมุมจอ + เกมเต็มจอ (kampai-ar.js, migration 221)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

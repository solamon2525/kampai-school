-- 214_seed_hands_up_quiz_game.sql
-- เกม "ยกมือตอบ" (hands-up-quiz) — AR ยกมือ ซ้าย/ขวา/สองมือ เลือกคำตอบ (โหมด hands)
-- ไฟล์: public/games/english/hands-up-quiz/ · KampaiAR v1.1.0 (Tier 2: hands) + KAMPAI SDK
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/english/hands-up-quiz/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🙌 ยกมือตอบ (AR)', v_url, 'ภาษาอังกฤษ', 214
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'hands-up-quiz', tracked_game = true, is_published = true,
      thumbnail_url = '/games/english/hands-up-quiz/cover.svg', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR/กล้อง (โหมด hands) — ยกมือ ซ้าย/ขวา/สองมือ ค้างไว้เพื่อเลือกคำตอบ',
         ARRAY[
           'ตรวจจับการยกมือด้วย MediaPipe Pose (ข้อมือเทียบไหล่) — engine kampai-ar.js v1.1.0',
           'ยกมือซ้าย=ตอบ ก · ยกสองมือ=ตอบ ข · ยกมือขวา=ตอบ ค · hold-to-select',
           'fallback แตะ 3 คอลัมน์ (เครื่องไม่มีกล้อง/ปฏิเสธสิทธิ์เล่นได้)',
           'คำศัพท์อังกฤษ ป.4-6 (10 ข้อ สุ่ม 8 ข้อ/รอบ) — แก้โจทย์ที่ data.js · จูนที่ config.js (AR-GAME.md)'
         ],
         'v1.0.0',
         'ยกมือตอบ — เกม AR ตัวอย่างของ engine Tier 2 (kampai-ar.js v1.1.0, migration 214)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

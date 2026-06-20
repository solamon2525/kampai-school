-- 212_seed_english_ar_quiz_game.sql
-- เกม "English AR Quiz" (english-ar-quiz) — ภาษาอังกฤษ ป.4 AR เลือกตอบ (ยืน/แตะ 3 โซน)
-- ไฟล์: public/games/english/english-ar-quiz/ · KampaiAR + KAMPAI SDK
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/english/english-ar-quiz/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🔤 English AR Quiz (ป.4)', v_url, 'ภาษาอังกฤษ', 212
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'english-ar-quiz', tracked_game = true, is_published = true,
      thumbnail_url = '/games/english/english-ar-quiz/cover.svg', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR/กล้อง — ยืนหรือแตะ 3 โซน (ซ้าย/กลาง/ขวา) เลือกคำตอบภาษาอังกฤษ',
         ARRAY[
           'เนื้อหาคำศัพท์และไวยากรณ์พื้นฐาน ป.4 (12 ข้อ สุ่ม 10 ข้อ/รอบ)',
           'อ่านเสียงคำศัพท์อังกฤษ (TTS) ต่อข้อเมื่อมี speak ใน data.js',
           'ตรวจจับการเคลื่อนไหว framediff + hold-to-select + fallback แตะโซน',
           'แก้โจทย์ที่ data.js · จูน AR ที่ config.js (AR-GAME.md)'
         ],
         'v1.0.0',
         'English AR Quiz ป.4 (kampai-ar.js v1.0.0, migration 212)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

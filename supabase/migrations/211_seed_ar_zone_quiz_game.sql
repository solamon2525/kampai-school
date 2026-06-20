-- 211_seed_ar_zone_quiz_game.sql
-- เกมตัวอย่าง AR "AR Zone Quiz" (ar-zone-quiz) — ยืน/แตะ 3 โซน เลือกคำตอบ
-- สร้างจากโครงร่าง AR (kampai-ar.js + _template-ar) เป็น reference เกม AR
-- ไฟล์: public/games/demo/ar-zone-quiz/ (folder game) · ฝัง KAMPAI SDK + KampaiAR
-- Idempotent: re-run ไม่เพิ่มซ้ำ (NOT EXISTS guard) + sync flags + game_docs ทุกครั้ง
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/demo/ar-zone-quiz/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'AR Zone Quiz (ยืนเลือกคำตอบ)', v_url, 'คณิตศาสตร์', 211
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'ar-zone-quiz', tracked_game = true, is_published = true,
      thumbnail_url = '/games/demo/ar-zone-quiz/cover.svg', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 🔖 บังคับ: game_docs (รูปแบบ/ฟีเจอร์/เวอร์ชัน) — เห็นเฉพาะเจ้าของ+admin
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR/กล้อง — ยืนหรือแตะ 3 โซน (ซ้าย/กลาง/ขวา) เลือกคำตอบ',
         ARRAY[
           'ตัวอย่างอ้างอิงของโครงร่าง AR (kampai-ar.js engine + _template-ar)',
           'ตรวจจับการเคลื่อนไหวแบบ frame-differencing (ไม่พึ่ง lib) — สลับเป็น MediaPipe pose ได้ใน config',
           'ค้างท่าในโซนเพื่อยืนยัน (hold-to-select) + fallback แตะโซนเมื่อไม่มีกล้อง',
           'เนื้อหา/โจทย์แก้ที่ data.js · จูนประสิทธิภาพที่ config.js'
         ],
         'v1.0.0',
         'เกมตัวอย่าง AR scaffold (kampai-ar.js v1.0.0, migration 211) — ดู AR-GAME.md'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

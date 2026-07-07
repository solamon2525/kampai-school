-- 375_seed_word_ninja_noun_game.sql
-- เกม "ตัดคำนามนินจา" (word-ninja-noun) — AR ยกมือ/เหวี่ยงมือตัดคำนาม (โหมด hand/fingertip slice)
-- ไฟล์: public/games/thai/word-ninja-noun/ · MediaPipe Hands + KAMPAI SDK
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/thai/word-ninja-noun/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '⚔️ ตัดคำนามนินจา (AR)', v_url, 'ภาษาไทย', 375
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'word-ninja-noun', tracked_game = true, is_published = true,
      thumbnail_url = '/games/thai/word-ninja-noun/cover.png', bgm_preset = 'cheerful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'AR/กล้อง (โหมด hand slice) — เหวี่ยงนิ้วชี้ตัดคำนามที่ลอยขึ้นมาเหมือนนินจา',
         ARRAY[
           'ตรวจจับนิ้วชี้ด้วย MediaPipe Hands (Index Fingertip) ลากผ่านอุกกาบาตคำคำนาม',
           'เหวี่ยงมือผ่านคำนามเพื่อตัดคำตอบที่ถูก (+คะแนนตามจำนวนคอมโบ)',
           'ระวังห้ามตัดคำที่ไม่ใช่คำนาม (คำกริยา คำสรรพนาม หรือคำวิเศษณ์) ไม่เช่นนั้นจะเสียหัวใจ',
           'ระบบ fallback แตะ/คลิกตัดคำนามได้ (สำหรับเครื่องที่ไม่มีกล้องเว็บแคม)',
           'เชื่อมต่อระบบดวลแข่ง 2 คน (KampaiVersus) ทั้งในเครื่องและท้าดวลออนไลน์ผ่าน Seeded RNG'
         ],
         'v1.0.0',
         'ตัดคำนามนินจา — พัฒนาจากโค้ดตั้งต้น HTML Ninja Slice ภาษาไทย ป.4-6'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

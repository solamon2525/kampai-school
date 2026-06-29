-- ============================================================================
-- Migration 251: Seed "เกมภาษาไทย: ตะลุยด่านสระพาสนุก ป.1-6" (thai-sara-run)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/thai/thai-sara-run.html
-- Cover: public/games/thai/thai-sara-run-cover.png
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/thai/thai-sara-run.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';

  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'เกมภาษาไทย: ตะลุยด่านสระพาสนุก ป.1-6', v_url, 'ภาษาไทย', 251
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'thai-sara-run',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/thai/thai-sara-run-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'HTML5 Canvas Platformer — กระโดดชนลูกโป่งสระภาษาไทย ป.1-6 (single-file)',
         ARRAY[
           'กระต่ายน่ารัก · กระโดด 2 ชั้น · ฟิสิกส์ลอยนุ่ม · ด่านปลอดภัยสำหรับเด็ก',
           'สถานีคำถามทุก 3 แพลตฟอร์ม · ลูกโป่งเจลลี่ wobble · คอมโบ + ข้อความลอย + screen shake',
           'Web Audio synth 8-bit · ปุ่มสัมผัส ◀▲▶ · KampaiVersus 90s · KAMPAI SDK score/leaderboard',
           'วาดทั้งหมดด้วย Canvas 2D (ไม่มีรูปภายนอก) · 19 ข้อสระไทย'
         ],
         'v1.0.0',
         'เกมภาษาไทย: ตะลุยด่านสระพาสนุก — premium pastel platformer (migration 251)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

-- ============================================================================
-- Migration 202: Seed "มอไซต์จอมลุยมาตรา" (thai-spelling-moto)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/thai/spelling-moto.html
-- Cover: public/games/thai/spelling-moto-cover.png
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/thai/spelling-moto.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve games category
  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found';
  END IF;

  -- 3. Ensure profile is active
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- 4. Seed item
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'มอไซต์จอมลุยมาตรา (Spelling Moto Master)', v_url, 'ภาษาไทย', 170
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET game_slug = 'thai-spelling-moto',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/thai/spelling-moto-cover.png',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ขับมอเตอร์ไซค์หลบสิ่งกีดขวาง/เก็บคำศัพท์ตามมาตราสะกด',
         ARRAY['ขับมอเตอร์ไซค์หลบสิ่งกีดขวาง', 'เลือกเก็บเฉพาะคำที่สะกดตรงตามมาตราภารกิจ', 'ระบบคะแนนและคอมโบ', 'ภารกิจเปลี่ยนมาตราตัวสะกดแบบสุ่มระหว่างเล่น'],
         'v1.0.0',
         'สร้างเกมครั้งแรก'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

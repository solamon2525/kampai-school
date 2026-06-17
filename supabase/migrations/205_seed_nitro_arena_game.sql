-- ============================================================================
-- Migration 205: Seed "Nitro Arena" (nitro-arena)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/thai/nitro-arena.html
-- Cover: public/games/thai/nitro-arena-cover.svg
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/thai/nitro-arena.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'Nitro Arena - งูล่ามาตราตัวสะกด', v_url, 'ภาษาไทย', 195
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET game_slug = 'nitro-arena',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/thai/nitro-arena-cover.svg',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมงูแข่งกันเก็บคำตามมาตราตัวสะกด เล่นได้ทั้ง 1 ผู้เล่น vs AI และ 2 ผู้เล่น PVP',
         ARRAY['เลือกโหมด Single vs AI หรือ Duo PVP', 'บังคับงูเก็บคำที่ตรงกับมาตราตัวสะกดเป้าหมาย', 'มาตราตัวสะกด 6 หมวด: กง กด กน กม กก กบ', 'ไอเทมสายฟ้าชอตคู่ต่อสู้ให้หยุดนิ่ง 5 วินาที', 'หมวดคำเปลี่ยนอัตโนมัติทุก 20 วินาที', 'งูยาวพอสามารถชนฝ่ายตรงข้ามให้ตายได้', 'นกล่าเหยื่อสุ่มไล่ล่าผู้เล่น', 'ระบบ respawn กลับมาเล่นต่อเมื่อเหลือชีวิต'],
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

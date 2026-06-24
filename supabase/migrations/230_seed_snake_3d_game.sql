-- ============================================================================
-- Migration 230: Seed "งูกินคำศัพท์ 3 มิติ (Spelling Snake 3D)" (snake-3d)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/english/snake-3d/index.html
-- Cover: public/games/english/snake-3d/cover.svg
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/english/snake-3d/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', '🐍 งูกินคำศัพท์ 3 มิติ (Spelling Snake 3D)', v_url, 'ภาษาอังกฤษ', 170
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET game_slug = 'snake-3d',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/english/snake-3d/cover.svg',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Upsert game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกม 3 มิติ (Three.js) — บังคับงูสไตล์ Minecraft สะกดคำภาษาอังกฤษตามลำดับอักษร',
         ARRAY[
           'ดีไซน์ Voxel 3 มิติสไตล์ Minecraft (Three.js UMD) พร้อมเงาตกกระทบและหมอกมีมิติ',
           'การควบคุมรองรับทั้ง Keyboard (WASD) และ D-pad ใสสวยงามสำหรับมือถือ/ทัชสกรีน',
           'สะกดคำศัพท์ตามประเภทการเรียนรู้ 5 หมวด (สัตว์, สี, ผลไม้, ยานพาหนะ, อุปกรณ์เรียน)',
           'ระบบพลังชีวิต (หัวใจ 3 ดวง) และงูยาวขึ้นเรื่อยๆ เมื่อเก็บอักษรถูก และสั่นระเบิดเมื่อชนขอบหรือหางตัวเอง'
         ],
         'v1.0.0',
         'Spelling Snake 3D voxel game (migration 230) — ใช้ Three.js UMD Global style'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

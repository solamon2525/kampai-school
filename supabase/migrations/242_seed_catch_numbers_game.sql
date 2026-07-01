-- Migration 242: Seed "Catch Numbers" AR Catcher game (catch-numbers)
-- วิชาคณิต — รับตัวเลขที่ตกลงมาตามกติกา (เลขคู่/คี่/พหุคูณ)
-- Path:  public/games/math/catch-numbers/index.html
-- Slug:  catch-numbers
-- Idempotent: re-run safe (NOT EXISTS + ON CONFLICT)

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/catch-numbers/index.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff not found';
  END IF;

  -- 2. Resolve category
  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category games not found';
  END IF;

  -- 3. Ensure hub profile
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- 4. Seed item (idempotent)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link',
    '🧺 Catch Numbers — รับตัวเลข AR', v_url, 'คณิตศาสตร์', 35
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Sync settings
  UPDATE public.educational_hub_items
  SET game_slug     = 'catch-numbers',
      tracked_game  = true,
      is_published  = true,
      thumbnail_url = '/games/math/catch-numbers/cover.png',
      bgm_preset    = 'cheerful',
      updated_at    = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Resolve item_id
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item catch-numbers not found after seed';
  END IF;

  -- 7. Upsert game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'AR Catcher — รับตัวเลขที่ตกลงมาตามกติกา ด้วยการเคลื่อนตัวจริงผ่านกล้อง',
    ARRAY[
      'ตะกร้าตามตำแหน่งตัวผู้เล่น (ar.x จาก framediff) — ไม่พึ่ง CDN · engine kampai-ar.js v1.1.0',
      'แต่ละรอบมีกติกา (รับเลขคู่/พหุคูณ/มากกว่า) → รับถูก +คะแนน · รับผิด -ชีวิต (ฝึกจำแนกประเภท)',
      'รองรับระบบเล่นแบบดวลสองคนเครื่องเดียวกันและออนไลน์ (KampaiVersus) โดยใช้โจทย์ซิงค์ตรงกัน',
      'fallback ลาก/แตะบนจอเลื่อนตะกร้า (เครื่องไม่มีกล้องเล่นได้)',
      'แก้กติกา/เลขที่ data.js · จูน SPAWN_MS/FALL_SPEED/CATCH_RADIUS ที่ config.js (AR-GAME.md)'
    ],
    'v1.1.0',
    'เพิ่มระบบผู้เล่น 2 คน (KampaiVersus) และแก้บั๊ก transition timeout leak'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

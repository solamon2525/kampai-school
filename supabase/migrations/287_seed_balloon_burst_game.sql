-- Migration 287: Seed "Balloon Burst" AR Game (balloon-burst)
-- วิชาภาษาไทย — เจาะลูกโป่งคำประวิสรรชนีย์ผ่านกล้องหรือแตะ
-- Path:  public/games/thai/balloon-burst/index.html
-- Slug:  balloon-burst
-- Idempotent: re-run safe

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/thai/balloon-burst/index.html';
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
    '🎈 Balloon Burst — คำประวิสรรชนีย์', v_url, 'ภาษาไทย', 62
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Sync settings
  UPDATE public.educational_hub_items
  SET game_slug     = 'balloon-burst',
      tracked_game  = true,
      is_published  = true,
      thumbnail_url = '/games/thai/balloon-burst/cover.png',
      bgm_preset    = 'cheerful',
      updated_at    = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Resolve item_id
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item balloon-burst not found after seed';
  END IF;

  -- 7. Upsert game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'AR Catcher/Popper — โบกมือเจาะลูกโป่งคำประวิสรรชนีย์ผ่านกล้อง หรือกดแตะสัมผัส',
    ARRAY[
      'ตัวชี้พิกัดตามตำแหน่งตัวผู้เล่น (ar.x, ar.y จาก framediff/pose) — ปลอดภัย 100% · engine kampai-ar.js v1.1.1',
      'เป้าหมายการจำแนกคำประวิสรรชนีย์ (มีรูป ะ) ได้คะแนน +10 · เจาะคำไม่ประวิสรรชนีย์โดนหัก -5 คะแนน (กติกาเวลา 60 วินาที)',
      'ระบบเสียงสังเคราะห์เสียงสูง/ต่ำด้วย Web Audio API ในตัว ไม่พึ่งพาไฟล์เสียงภายนอกลดปัญหาความช้าในการโหลด',
      'รองรับการจัดอันดับคะแนนส่วนบุคคลและตารางคะแนนพอร์ทัลหลักของ Kampai School เมื่อสิ้นสุดเกม',
      'fallback แตะ/คลิกเพื่อเจาะลูกโป่งได้โดยตรง (เครื่องเรียนไม่มีกล้องหรือปิดสิทธิ์กล้องสามารถเล่นได้ปกติ)'
    ],
    'v1.0.0',
    'เวอร์ชันเริ่มต้น: พัฒนาสำเร็จตามสถาปัตยกรรม 5-File และ KampaiAR engine'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

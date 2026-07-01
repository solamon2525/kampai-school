-- Migration 312: Seed "AR Calibration" Tool (ar-calibration)
-- หมวดเทคโนโลยี/ทั่วไป — ปรับแต่งและตั้งค่าความตึงการประมวลผลกล้อง AR
-- Path:  public/games/ar-calibration/index.html
-- Slug:  ar-calibration

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/ar-calibration/index.html';
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
    '⚙️ AR Calibration — ตรวจสอบและตั้งค่ากล้อง', v_url, 'เทคโนโลยี', 99
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Sync settings
  UPDATE public.educational_hub_items
  SET game_slug     = 'ar-calibration',
      tracked_game  = false,  -- calibration is a utility, no score tracking
      is_published  = true,
      thumbnail_url = '/games/ar-calibration/cover.png',
      bgm_preset    = 'ambient',
      updated_at    = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Resolve item_id
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 7. Upsert game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'AR Calibration Utility — หน้าเว็บปรับแต่งความราบรื่นเรียลไทม์',
    ARRAY[
      'แผงควบคุมระดับค่าความราบรื่น (Alpha / Cutoff Frequency / Beta) แบบเรียลไทม์',
      'แสดงผลเปรียบเทียบระหว่างค่าพิกัดดิบ (Raw Coords) vs พิกัดกรองฟิลเตอร์ (Smoothed Coords)',
      'ตัววัดความหน่วงของบราว์เซอร์และจำนวนเฟรมต่อวินาที (Latency & FPS Counter)',
      'ระบบจำลองฟิลเตอร์ One Euro Filter และ Exponential Moving Average (EMA)',
      'ปุ่มทดสอบฟังก์ชันกล้อง และพิมพ์ชุดการตั้งค่า Tuning JSON ออกไปปรับแต่ง in config.js'
    ],
    'v1.0.0',
    'เวอร์ชันเริ่มต้น: เครื่องมือปรับจูนกล้องและทดสอบ JSDOM Headless'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

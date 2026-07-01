-- 315_seed_mini_farm_island_game.sql
-- ลงทะเบียนเกม Mini Farm Island 🌴 เข้าคลังเกม (educational_hub_items + game_docs)

DO $$
DECLARE
  v_staff_id   uuid;
  v_cat_id     uuid;
  v_item_id    uuid;
BEGIN
  -- 1. Resolve staff
  SELECT id INTO v_staff_id
    FROM staff
   WHERE name ILIKE '%ณัฐพงศ์%สิงห์ชมภู%'
     AND staff_type = 'teaching'
   ORDER BY created_at
   LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE NOTICE 'staff not found – skipping seed';
    RETURN;
  END IF;

  -- 2. Resolve category
  SELECT id INTO v_cat_id
    FROM educational_hub_categories
   WHERE category_key = 'games'
   LIMIT 1;

  IF v_cat_id IS NULL THEN
    RAISE NOTICE 'category "games" not found – skipping seed';
    RETURN;
  END IF;

  -- 3. Ensure hub profile active
  INSERT INTO educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO UPDATE SET is_hub_active = true;

  -- 4. Upsert item
  INSERT INTO educational_hub_items (
    owner_staff_id, category_id, item_type, title,
    external_url, subject, sort_order,
    game_slug, tracked_game, is_published,
    thumbnail_url, bgm_preset
  ) VALUES (
    v_staff_id, v_cat_id, 'link',
    '🌴 มินิฟาร์มไอส์แลนด์ (Mini Farm Island)',
    '/games/math/mini-farm-island/index.html',
    'คณิตศาสตร์', 10,
    'mini-farm-island', true, true,
    '/games/math/mini-farm-island/cover.png', 'chill'
  )
  ON CONFLICT (game_slug) WHERE game_slug IS NOT NULL
  DO UPDATE SET
    title         = EXCLUDED.title,
    external_url  = EXCLUDED.external_url,
    subject       = EXCLUDED.subject,
    tracked_game  = EXCLUDED.tracked_game,
    is_published  = EXCLUDED.is_published,
    thumbnail_url = EXCLUDED.thumbnail_url,
    bgm_preset    = EXCLUDED.bgm_preset
  RETURNING id INTO v_item_id;

  -- 5. Upsert game_docs
  INSERT INTO game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'เกมจำลองฟาร์ม 3 มิติ (Three.js) ฝึกทักษะคิดเรื่องต้นทุน-กำไร-การบริหารเงิน สำหรับนักเรียนประถมศึกษา',
    ARRAY[
      'ระบบ 3D แบบ Isometric Island สวยงามด้วย Three.js พร้อมน้ำทะเลเคลื่อนไหว ต้นไม้ไหว และควันปล่องไฟ',
      'จำลองระบบเศรษฐกิจพื้นฐาน: ปลูก (ลงทุน 10 เหรียญ) → รอเติบโต → เก็บเกี่ยว → ขาย (ได้ 25 เหรียญ/ชิ้น)',
      'เอฟเฟกต์ Particle อลังการตอนปลูก/เก็บเกี่ยว/ขาย พร้อม Toast แจ้งเตือนสวยงาม',
      'ระบบ Progress Bar แบบ Billboard ลอยเหนือแปลงดิน แสดงความก้าวหน้าการเติบโต',
      'รองรับ KampaiVersus สำหรับแข่ง 2 คน — ใครปลูกขายได้มากกว่าในเวลาจำกัดชนะ!'
    ],
    'v1.0.0',
    'เปิดตัวเกมฟาร์ม 3D วิชาคณิตศาสตร์ เรื่องต้นทุน-กำไร ป.4 — เป็นมิตรต่อเด็ก ดีไซน์ Glassmorphism'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features    = EXCLUDED.features,
    version     = EXCLUDED.version,
    notes       = EXCLUDED.notes;

  RAISE NOTICE 'Seeded mini-farm-island (item_id=%)', v_item_id;
END $$;

-- Migration 313: Seed "Multiplication RPG" Educational Game (multiplication-rpg)
-- หมวดวิชาคณิตศาสตร์ ป.4 — ฝึกคิดเลขเร็วและการคูณเลขแบบสวมบทบาท RPG
-- Path:  public/games/math/multiplication-rpg/index.html
-- Slug:  multiplication-rpg

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/multiplication-rpg/index.html';
BEGIN
  -- 1. Resolve staff_id (คุณครูวิชาการ)
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff not found';
  END IF;

  -- 2. Resolve category 'games'
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
    '⚔️ คูณผู้พิทักษ์ (Multiplication RPG Adventure)', v_url, 'คณิตศาสตร์', 10
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Sync settings
  UPDATE public.educational_hub_items
  SET game_slug     = 'multiplication-rpg',
      tracked_game  = true, -- บันทึกสถิติลงตารางสถิติผู้เรียน
      is_published  = true,
      thumbnail_url = '/games/math/multiplication-rpg/cover.png',
      bgm_preset    = 'playful',
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
    'เกมการศึกษาแนว RPG สวมบทบาทปราบมอนสเตอร์ด้วยความรู้การคูณ ป.4',
    ARRAY[
      'ระบบเลือกอาชีพผู้พิทักษ์ 4 คลาสสถิติเฉพาะตัว ได้แก่ จอมเวทตัวเลข, อัศวินเรขาคณิต, นักธนูสถิติ, นักดาบสมการ',
      'มินิเกมฝึกคิดเลขเร็ว 3 รูปแบบสลับเปลี่ยนกันในด่านต่างๆ (Quiz 4 ตัวเลือก, Drag & Match จับคู่ และ Fill in the Blank เติมคำตอบ)',
      'การต่อสู้รูปแบบ RPG ตอบสนองความถูกต้องด้วยท่าแอนิเมชันโจมตีและเอฟเฟกต์ Critical Hit สุดเร้าใจ',
      'ระบบดนตรีสังเคราะห์ 8-bit และ SFX ด้วย Web Audio API วนลูปสดในเบราว์เซอร์',
      'ศึกบอสประจำบทเรียนยักษ์ใหญ่ ขนาดตัวใหญ่ขึ้น 30% พร้อมเกราะออร่าเรืองแสงสีแดงสุดตระการตา'
    ],
    'v1.0.0',
    'เปิดตัวเกม RPG วิชาคณิตศาสตร์ เรื่องการคูณ ป.4 - เป็นมิตรต่อเด็ก ไร้ความรุนแรงจริง'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

-- ============================================================================
-- Migration 211: Seed "Math Hand Raising Game" (math-hand-raising)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/math/math-hand-raising.html
-- Cover: public/games/math/math-hand-raising-cover.png
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/math-hand-raising.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'เกมคณิตคิดไว ยกมือทายถูกผิด!', v_url, 'คณิตศาสตร์', 78
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET title = 'เกมคณิตคิดไว ยกมือทายถูกผิด!',
      game_slug = 'math-hand-raising',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/math-hand-raising-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมฝึกทักษะคณิตศาสตร์ระดับประถมศึกษา โดยการตรวจจับและวิเคราะห์ท่าทางเปิด/ปิดมือผ่านกล้องเว็บแคม',
         ARRAY[
           'ควบคุมการเลือกคำตอบด้วยการยกมือ (แบมือ 5 นิ้ว) ในฝั่งที่ต้องการเลือกคำตอบ',
           'ระบบนาฬิกาจับเวลาต่อข้อ ปรับเวลาตามระดับชั้น ป.4 (15s), ป.5 (12s), ป.6 (10s)',
           'หมวดหมู่คณิตศาสตร์หลากหลาย: บวก, ลบ, คูณ, หาร และโหมดสุ่มผสม',
           'ระบบโบนัสสำหรับการคิดเลขเร็วเมื่อตอบได้ถูกต้องภายในครึ่งเวลา',
           'ระบบช่วยเหลือแบบครบวงจร รองรับการแตะสัมผัสหน้าจอหรือคลิกเมาส์เป็นทางเลือกสำรอง (Fallback Mode)',
           'รองรับการเซฟประวัติคะแนนส่วนตัว บอร์ดคะแนนห้องเรียน (Leaderboard) และเล่นคู่แบบดวลสองคน/ออนไลน์ (KampaiVersus)'
         ],
         'v1.1.0',
         'อัปเกรดเป็นระบบ 5-File Architecture พร้อมระบบเลือกหมวดหมู่และระดับชั้น ป.4-ป.6 และระบบจับเวลา'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

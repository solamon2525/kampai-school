-- ============================================================================
-- Migration 191: Seed "Angle Castle" (angle-castle)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/math/angle-castle/index.html
-- Cover: public/games/math/angle-castle/cover.svg
-- Subject: คณิตศาสตร์ (Mathematics)
-- Indicators: ค 2.2 ป.4/1, ค 2.1 ป.4/2
-- Idempotent: re-run keeps counts stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/angle-castle/index.html';
BEGIN
  -- 1. Resolve staff_id (ครูณัฐพงศ์ สิงห์ชมภู)
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
  SELECT v_staff_id, v_cat_games, 'link', 'Angle Castle (ศึกปราสาทมุมองศา)', v_url, 'คณิตศาสตร์', 29
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings and grab item_id
  UPDATE public.educational_hub_items
  SET game_slug = 'angle-castle',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/angle-castle/cover.svg',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Link curriculum indicators (ค 2.2 ป.4/1, ค 2.1 ป.4/2)
  INSERT INTO public.indicator_games (indicator_id, edu_hub_item_id)
  SELECT id, v_item_id
  FROM public.curriculum_indicators
  WHERE indicator_code IN ('ค 2.2 ป.4/1', 'ค 2.1 ป.4/2')
  ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

  -- 7. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'วัดมุมและเล็งยิงสะท้อน — คัดแยกประเภทรวมถึงหาองศามุมของอัศวินและศัตรู',
    ARRAY[
      'ระบบควบคุมตัวละครเคลื่อนที่อัศวิน หลบอุปสรรคและเล็งทิศทางยิงสะท้อนด้วยพลังเวทมนตร์',
      'โหมดชาร์จเล็งปืนวาดไม้โพรแทรกเตอร์เรืองแสงนีออนวัดมุมรอบตัว 0-360 องศาแบบเรียลไทม์',
      'ลูปการสะท้อนของเลเซอร์ (Reflection path solver) คำนวณเส้นตกกระทบเท่ากับเส้นสะท้อน',
      'อาวุธคทาสามแบบ: คทาสะท้อนดวงดาว, คทาสามแฉก และคทาเลเซอร์นำทาง',
      'ออกเสียงชื่อมุมวิชาการภาษาไทย (Thai TTS Assistant) เช่น มุมแหลม, มุมฉาก, มุมป้าน, มุมตรง, มุมกลับ พร้อมคำอ่านองศา',
      'ประลองด่านคริสตัลหมุนได้, ด่านเกราะสะท้อนศัตรู และด่านสู้บอสใหญ่แองเกิลมัส',
      'เชื่อมต่อแข่งขันออนไลน์เรียลไทม์ (KampaiMatch) เควสต์และตารางบอร์ดผู้เล่น Top 5'
    ],
    'v1.0.0',
    'ปล่อยตัวเกม Angle Castle: ศึกปราสาทมุมองศา สำหรับตัวชี้วัด ป.4 คณิตศาสตร์'
  )
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

-- ============================================================================
-- Migration 217: Refactor "Super Math-Blaster" to 5-file architecture
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/math/math-blaster/index.html
-- Cover: public/games/math/math-blaster/cover.svg
-- Version: v1.1.0 (Bumps version, updates urls, registers 5-file structure)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_item_id   UUID;
  v_old_url   TEXT := '/games/math/math-blaster.html';
  v_new_url   TEXT := '/games/math/math-blaster/index.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Update external_url and thumbnail_url in educational_hub_items
  UPDATE public.educational_hub_items
  SET external_url = v_new_url,
      thumbnail_url = '/games/math/math-blaster/cover.svg',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND (external_url = v_old_url OR game_slug = 'math-blaster')
  RETURNING id INTO v_item_id;

  -- 3. Upsert game_docs bumping version to v1.1.0 and noting the refactor
  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'เกมยิงอวกาศ เลือกทำลายอุกกาบาตเพื่อตอบโจทย์คณิตศาสตร์ (โครงสร้างโฟลเดอร์ 5 ไฟล์)',
      ARRAY['ยิงทำลายอุกกาบาตเพื่อตอบโจทย์คณิตศาสตร์', 'ระบบการเล่นแบบคลื่นศัตรู ตัวสุ่มโจทย์ และบอสท้ายด่าน', 'ไอเทมพิเศษ บัฟเกราะ ปืนกระจาย และปืนนำวิถี', 'รองรับการเล่น 2 คน (Co-op) บนหน้าจอเดียวกัน', 'บูรณาการ SDK Leaderboard & LocalStorage fallback'],
      'v1.1.0',
      'ปรับโครงสร้างโฟลเดอร์เป็น 5 ไฟล์ตามมาตรฐาน และแก้ไขบั๊กปุ่ม Leaderboard'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END IF;
END $$;

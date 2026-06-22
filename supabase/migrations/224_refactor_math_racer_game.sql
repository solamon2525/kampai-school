-- ============================================================================
-- Migration 224: Refactor "Math Racer" to 5-File Architecture
-- ============================================================================
-- Update external_url, thumbnail_url, and update game_docs version to v1.1.0
-- ============================================================================

DO $$
DECLARE
  v_staff_id      UUID;
  v_old_url       TEXT := '/games/math/math-racer.html';
  v_new_url       TEXT := '/games/math/math-racer/index.html';
  v_item_id       UUID;
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Check if the old url item exists
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND (external_url = v_old_url OR external_url = v_new_url)
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    -- Update item details
    UPDATE public.educational_hub_items
    SET external_url = v_new_url,
        thumbnail_url = '/games/math/math-racer/cover.svg',
        updated_at = now()
    WHERE id = v_item_id;

    -- Upsert game docs
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id, 
      v_staff_id,
      'เกมแข่งรถทางตรงเปลี่ยนเลนเก็บคำตอบโจทย์คณิตศาสตร์คูณและหาร',
      ARRAY['ซิ่งรถเก็บคำตอบที่ถูกต้องเพื่อเพิ่มคะแนน', 'หลบหลีกคำตอบที่ผิดและรถอุปสรรคคันอื่น', 'โหมดการสุ่มโจทย์เลขคูณและเลขหารฟิสิกส์คลื่นความถี่เสียงพร้อมเสียงพากย์ภาษาไทย (TTS)', 'รถบรรทุกยักษ์สุ่มบุกบดขยี้ทางวิ่งแบบกะทันหัน', 'รองรับโหมดผู้เล่นเดี่ยว หรือผู้เล่นคู่ดวลความเร็วร่วมจอ พร้อมระบบพลังชีวิตและโล่ป้องกันภัย'],
      'v1.1.0',
      'ปรับโครงสร้างแบบ 5-file architecture และระบบไอเทมพร้อมระบบ HP 3 ดวง'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END IF;
END $$;

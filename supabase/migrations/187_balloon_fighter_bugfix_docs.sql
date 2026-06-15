-- ============================================================================
-- Migration 187: บอลลูนไฟเตอร์ (balloon-fighter) — bugfix v1.1.0 + game_docs
-- ============================================================================
-- แก้บั๊กจาก /hunt-game-bugs:
--   #1 game loop ค้างถาวร + คะแนนหาย (playerTakeDamage ใช้ window.parent.window.KAMPAI ผิด)
--   #2 onlineRng ค้าง → เกมออฟไลน์หลังเล่นออนไลน์ออกคำถามซ้ำเดิม
--   #3 รวม playerHit/playerTakeDamage (duplicate) เป็นฟังก์ชันเดียว
--   #4 TTS อ่านคำหมวด eng ด้วยสำเนียงไทย → เลือก lang ตามหมวด
--   #5 บอลลูนตัวเลือกบอสเด้งตำแหน่งตอน spawn (240 vs 300)
--   #6 start() ไม่ reset itemTimer/screenFlashA
-- game_docs: migration 167 ไม่ได้ลง (predate mig 168) → upsert + bump version
-- Idempotent
-- ============================================================================

DO $$
DECLARE
  v_staff_id UUID;
  v_item_id  UUID;
  v_url      TEXT := '/games/thai/balloon-fighter/index.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'game item for balloon-fighter not found (run migration 167 first)';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'แอ็กชัน/platformer — กระโดดเหยียบบอลลูนคำตอบที่ถูก (สะกดคำ/แปลศัพท์)',
    ARRAY[
      '3 หมวด: ราชาศัพท์/สำนวนไทย/ศัพท์อังกฤษ',
      'โหมด 1P / 2P co-op / 2P versus / ออนไลน์ (KampaiMatch)',
      'ด่านบอสทุก 5 เลเวล + ไอเทมบัฟ/ดีบัฟ + ร้านค้าสกิน',
      'TTS อ่านคำ (ไทย/อังกฤษตามหมวด) + เสียงสังเคราะห์ + BGM',
      'leaderboard + ส่งคะแนนผ่าน KAMPAI SDK'
    ],
    'v1.1.0',
    'แก้บั๊ก hunt: #1 game loop ค้าง (submitScore reference ผิด), #2 onlineRng ค้าง, #3 รวม playerHit, #4 TTS lang ตามหมวด, #5 boss width, #6 reset state'
  )
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

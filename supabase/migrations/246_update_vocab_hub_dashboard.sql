-- Migration 246: vocab-hub — แยกแดชบอด (โปรไฟล์/สถิติ/อันดับ) ออกจากตัวเกม
-- ตัวเกมเหลือแค่ "เล่น + ส่งคะแนน" (submitScore ทุกโหมดเหมือนเดิม)
-- แดชบอดย้ายไปหน้าใหม่ /play/vocab-hub/dashboard (student-facing, ระบุตัวด้วยรหัสนักเรียน)
-- Idempotent: re-run safe (อัปเดต game_docs เท่านั้น)

DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE game_slug = 'vocab-hub'
  ORDER BY updated_at DESC LIMIT 1;
  IF v_item_id IS NULL THEN RAISE EXCEPTION 'item vocab-hub not found'; END IF;

  UPDATE public.game_docs
  SET game_format = 'คลังคำศัพท์ภาษาอังกฤษ 25 หมวดหมู่ ~280 คำ',
      features = ARRAY[
        '25 หมวดคำศัพท์: ตัวเลข สี วัน เดือน ตัวอักษร สัตว์ ผลไม้ ร่างกาย รูปทรง ครอบครัว อาหาร อาชีพ อากาศ กริยา เสื้อผ้า ห้องเรียน บ้าน ของเล่น ยานพาหนะ กีฬา สถานที่ ดนตรี ผัก',
        'โหมดฝึก: Auto Flash Choice Match Listen Spell Timed TypeIn TrueFalse FlipRace WordSearch Online',
        'เสียงอ่าน EN+TH ผ่าน Web Speech API + Selective Mute per-word',
        'Starred Words deck พิเศษ บันทึก localStorage',
        'submitScore ทุก mode + XP Win Screen (เก็บคะแนนด้วยรหัสนักเรียน)',
        'แดชบอดแยกหน้า /play/vocab-hub/dashboard: สถิติของฉัน + อันดับ (ปุ่ม "📊 แดชบอด/อันดับ" ในจอ hub)',
        'โหมดออนไลน์ Live ผ่าน KampaiMatch'
      ],
      version = 'v2.1.0',
      notes = 'v2.1.0: แยกแดชบอด (student banner + leaderboard) ออกจากจอ hub ไปหน้า /play/vocab-hub/dashboard — เกมเหลือแค่เล่น+ส่งคะแนน',
      updated_at = now()
  WHERE item_id = v_item_id;
END $$;

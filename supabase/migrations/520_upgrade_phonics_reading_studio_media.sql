-- Migration 520: Upgrade Phonics Media to Phonics Reading Studio v2.0.0
DO $$
DECLARE
  v_item_id uuid;
BEGIN
  -- Update educational_hub_items
  UPDATE public.educational_hub_items
  SET title = '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
      description = 'สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ ป.1–4 — 6 หมวดเสียงหลัก 66 คำพร้อมภาพประกอบแท้ ถอดรหัส IPA คำอ่านไทย ระบบเลือกเสียง US/UK และ 3 โหมดการเรียนรู้',
      updated_at = now()
  WHERE external_url = '/games/english/phonics-media.html'
  RETURNING id INTO v_item_id;

  -- Update or insert game_docs
  IF v_item_id IS NOT NULL THEN
    UPDATE public.game_docs
    SET game_format = 'Phonics Reading Studio',
        features = ARRAY[
          '6 หมวดเสียงหลัก (Short A, E, I, O, U & Blends)',
          '66 คำศัพท์พร้อมภาพประกอบ WebP แท้',
          'ถอดรหัสเสียง IPA และคำอ่านภาษาไทยครบทุกคำ',
          'ระบบสังเคราะห์เสียงเลือกเสียง US/UK และปรับความเร็ว',
          'สตูดิโอฝึกอ่านทีละคำ (Sound Blending)',
          'แกลเลอรีภาพรวมทั้งหมวด',
          'แบบทดสอบทายเสียงคำศัพท์ (Listening Practice)'
        ],
        version = 'v2.0.0',
        notes = 'Phase 12 upgrade → Phonics Reading Studio with 66 illustrated words and multi-voice selection',
        updated_at = now()
    WHERE item_id = v_item_id;
  END IF;
END $$;

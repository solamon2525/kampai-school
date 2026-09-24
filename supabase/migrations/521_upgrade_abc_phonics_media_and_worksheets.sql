-- Migration 521: Upgrade ABC Phonics Media and Worksheets Suite
DO $$
DECLARE
  v_abc_id uuid;
  v_ws_abc_id uuid;
  v_ws_phonics_id uuid;
BEGIN
  -- 1. Update alphabet-phonics-media
  UPDATE public.educational_hub_items
  SET title = '🔤 ABC & Phonics Reading Studio — สื่อฝึกอ่านและเรียนรู้ตัวอักษร A–Z',
      description = 'สื่อการสอนตัวอักษร ABC และเสียงโฟนิกส์ ป.1–2 — ครบทั้ง 26 ตัวอักษร A ถึง Z พร้อมภาพวาดประกอบแท้ 26 คำ เสียงคำอ่านเลือกเสียง US/UK ได้ และ 3 โหมดการเรียนรู้',
      updated_at = now()
  WHERE external_url = '/games/english/alphabet-phonics-media.html'
  RETURNING id INTO v_abc_id;

  IF v_abc_id IS NOT NULL THEN
    UPDATE public.game_docs
    SET game_format = 'ABC Phonics Reading Studio',
        features = ARRAY[
          'ครบทั้ง 26 ตัวอักษร A ถึง Z ทั้งตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก',
          '26 คำศัพท์พร้อมภาพวาดประกอบ WebP แท้คมชัด',
          'เสียงโฟนิกส์ต้นคำ คำอ่านไทย และคำแปลไทยครบทุกตัว',
          'ระบบเสียงเลือกเสียงได้ US Female / US Male / UK Accent',
          '3 โหมดการเรียนรู้: บัตรคำ A-Z, ตารางรวม 26 ตัวอักษร, และแบบทดสอบทายเสียง'
        ],
        version = 'v2.0.0',
        notes = 'Upgraded to full 26-letter ABC Phonics Reading Studio with WebP assets and multi-voice TTS',
        updated_at = now()
    WHERE item_id = v_abc_id;
  END IF;

  -- 2. Update alphabet-phonics-worksheet
  UPDATE public.educational_hub_items
  SET title = '📝 ใบงาน ABC Phonics A–Z',
      description = 'ใบงานฝึกทักษะตัวอักษร A–Z เสียงต้นคำ และฝึกคัดลายมือตัวพิมพ์ใหญ่-เล็ก ป.1–2 พร้อมเฉลยครูและพิมพ์ A4',
      updated_at = now()
  WHERE external_url = '/games/english/alphabet-phonics-worksheet.html'
  RETURNING id INTO v_ws_abc_id;

  -- 3. Update phonics-worksheet
  UPDATE public.educational_hub_items
  SET title = '📝 Phonics Reading Worksheet — เสียงและคำศัพท์โฟนิกส์',
      description = 'ใบงานโฟนิกส์ ป.1–4 ครอบคลุม 66 คำศัพท์ 6 หมวดเสียง สระเสียงสั้นและพยัญชนะผสม พร้อมสแกน QR ฟังเสียงจากสื่อจริง',
      updated_at = now()
  WHERE external_url = '/games/english/phonics-worksheet.html'
  RETURNING id INTO v_ws_phonics_id;
END $$;

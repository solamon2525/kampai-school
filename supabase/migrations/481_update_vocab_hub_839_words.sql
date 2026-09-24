-- Migration 481: expand vocab-hub to 839 words with basic/all scope
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/vocab-hub.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item vocab-hub not found';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT
    i.id,
    i.owner_staff_id,
    'คลังคำศัพท์ภาษาอังกฤษ 28 หมวด พร้อมเกมฝึกอ่าน ฟัง สะกด จับคู่ และตอบคำถามหลายรูปแบบ',
    ARRAY[
      'คำศัพท์รวม 839 คำ: คำพื้นฐาน 372 คำ และคำต่อยอดระดับ ป.4-6 จำนวน 467 คำ',
      '23 หมวดคำศัพท์ขยายเป็นหมวดละ 30 คำ',
      'ชุดปิดคงจำนวนจริง: Numbers 100, Days 7, Months 12, Alphabet 26, Seasons 4',
      'ตัวกรอง พื้นฐาน / ทั้งหมด จำค่ารวมทุกหมวดใน localStorage',
      'จำนวนบนฮับและ progress คำนวณตามชุดคำที่กำลังเลือก',
      'รายการโปรดเก็บ level และ phonics พร้อมแสดงข้ามตัวกรอง',
      'โหมดรูปภาพใช้เฉพาะคำที่มี emoji หรือสี โดย Mixed ข้าม visual สำหรับคำที่ไม่มีภาพ',
      'fruits มี phonics ครบทั้ง 30 คำสำหรับฝึกผสมเสียง',
      'เลือกเสียงอ่านรายหมวด EN / ไทย / EN+ไทย และไม่อ่านอัตโนมัติเมื่อเปลี่ยนคำ',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False และ Word Search',
      'Math Question รองรับตัวเลข 1-100 เครื่องหมายบวก ลบ คูณ หาร และเสียงชาย/หญิง'
    ],
    'v2.4.0',
    'ขยายคลังคำศัพท์เป็น 839 คำ เพิ่มชุดคำพื้นฐาน/ทั้งหมด แยกข้อมูลคำต่อยอด และเพิ่ม data verifier ครบทุกหมวด'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  UPDATE public.educational_hub_items
  SET updated_at = now()
  WHERE id = v_item_id;
END $$;

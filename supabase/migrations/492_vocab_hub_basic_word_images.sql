-- Migration 492: document basic-word illustrations for English Vocab Hub
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
    'คลังคำศัพท์ภาษาอังกฤษ 28 หมวด พร้อมการ์ดภาพขนาดใหญ่และเกมฝึกอ่าน ฟัง สะกด จับคู่ และตอบคำถามหลายรูปแบบ',
    ARRAY[
      'คำศัพท์รวม 839 คำ พร้อมชุดคำพื้นฐานและคำต่อยอด',
      'คำพื้นฐาน 205 คำใน 22 หมวดมีภาพการ์ตูน 512x512 ที่สื่อความหมายตรงคำ',
      'Fruits มีภาพเดิมครบ 30 คำ ส่วน Numbers, Colors, Days, Months และ Alphabet คงรูปแบบข้อความเดิม',
      'ภาพแสดงก่อน emoji และย้อนกลับไปใช้ emoji อัตโนมัติหากโหลดภาพไม่ได้',
      'เลือกคำจากการ์ดและกดลำโพงข้างคำใหญ่เพื่ออ่าน โดยไม่มีเสียงอ่านอัตโนมัติ',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False และ Word Search'
    ],
    'v2.6.0',
    'เพิ่มภาพ WebP 512x512 สำหรับคำพื้นฐาน 205 คำใน 22 หมวด พร้อมตัวตรวจจำนวน mapping ขนาดไฟล์ ภาพเสีย และ path ซ้ำ โดยไม่เพิ่มภาพให้คำต่อยอด'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

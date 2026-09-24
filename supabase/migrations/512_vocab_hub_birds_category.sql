-- Migration 512: document birds category for English Vocab Hub
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
    'คลังคำศัพท์ภาษาอังกฤษ 29 หมวด พร้อมการ์ดภาพขนาดใหญ่และเกมฝึกอ่าน ฟัง สะกด จับคู่ และตอบคำถามหลายรูปแบบ',
    ARRAY[
      'คำศัพท์รวม 849 คำ พร้อมชุดคำพื้นฐานและคำต่อยอด',
      'เพิ่มหมวดหมู่นก (Birds) 10 คำ พร้อมภาพประกอบ WebP 512x512 คมชัดระดับสตอรี่บุ๊ก',
      'คำพื้นฐาน 215 คำใน 23 หมวดมีภาพ 512x512 ที่สื่อความหมายตรงคำ',
      'Fruits มีภาพครบ 30 คำ ส่วน Numbers, Colors, Days, Months และ Alphabet คงรูปแบบข้อความเดิม',
      'ภาพแสดงก่อน emoji และย้อนกลับไปใช้ emoji อัตโนมัติหากโหลดภาพไม่ได้',
      'เลือกคำจากการ์ดและกดลำโพงข้างคำใหญ่เพื่ออ่าน โดยไม่มีเสียงอ่านอัตโนมัติ',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False, Word Search และ 2-Player Versus'
    ],
    'v2.7.0',
    'เพิ่มหมวดหมู่คำศัพท์ นก (Birds) 10 คำ (Eagle, Pigeon, Crow, Sparrow, Parrot, Peacock, Hen, Duck, Kingfisher, Woodpecker) พร้อมภาพประกอบ 512x512 WebP และเสียงอ่านคำอ่านไทย'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

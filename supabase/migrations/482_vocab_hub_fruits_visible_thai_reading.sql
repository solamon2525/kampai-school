-- Migration 482: show Thai pronunciation visibly on vocab-hub fruits cards
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
      'คำศัพท์รวม 839 คำ พร้อมชุดคำพื้นฐานและคำต่อยอด',
      'หมวด Fruits แสดงคำอ่านภาษาไทยใต้คำอังกฤษทั้งการ์ดหลักและการ์ดคำในกริด',
      'หมวด Fruits มี phonics ครบทั้ง 30 คำสำหรับฝึกผสมเสียง',
      'เลือกเสียงอ่านรายหมวด EN / ไทย / EN+ไทย โดยคำอ่านบนจอไม่ขึ้นกับโหมดเสียง',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False และ Word Search'
    ],
    'v2.4.1',
    'ทำให้คำอ่านภาษาไทยของ fruits มองเห็นได้ทันที ไม่ต้องพลิกการ์ดหรือเปิดโหมดเสียงก่อน'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

-- Migration 491: simplify English Vocab Hub to one manual speech control
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
      'หมวดที่มีภาพใช้การ์ดจัตุรัส 3x2 บนเดสก์ท็อปและ 2x2 บนมือถือ',
      'เลือกคำจากการ์ดและกดลำโพงข้างคำใหญ่เพื่ออ่าน โดยไม่มีเสียงอ่านอัตโนมัติ',
      'Fruits รองรับเสียง EN ไทย และ EN+ไทย พร้อมตัวช่วยฝึกผสมเสียง',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False และ Word Search',
      'โหมดแข่งขันรองรับทั้ง 2 คนบนเครื่องเดียวและออนไลน์ผ่าน KampaiVersus'
    ],
    'v2.5.3',
    'รวมการอ่านคำศัพท์ไว้ที่ปุ่มด้านบนเพียงจุดเดียว ลบ mute รายคำ/รายหมวด/ทั้งหน้า และไม่อ่านเมื่อเปิดหมวด เลื่อนคำ คลิกการ์ด หรือเปลี่ยนภาษาเสียง'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

-- Migration 484: improve Thai-reading contrast on highlighted vocab cards
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
      'Fruits มีภาพวาดการ์ตูน WebP ครบ 30 คำ พร้อม emoji fallback',
      'คำอ่านภาษาไทยเปิดหรือปิดได้ และใช้สีกรมท่าที่อ่านชัดเมื่อการ์ดถูกไฮไลต์',
      'รองรับ Auto, Flash, Choice, Listen, Match, Spell, Time Attack, Type-in, True/False และ Word Search'
    ],
    'v2.5.1',
    'แก้ contrast คำอ่านภาษาไทยบนการ์ดพื้นเหลืองที่ถูกเลือกให้มองเห็นชัดเจน'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

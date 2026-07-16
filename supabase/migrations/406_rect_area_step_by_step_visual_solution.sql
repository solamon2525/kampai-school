-- Migration 406: Area Lab step-by-step illustrated solution (v2.1.0)
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/rect-area-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN RAISE EXCEPTION 'item rect-area-media not found'; END IF;

  UPDATE public.game_docs
  SET version = 'v2.1.0',
      features = array_append(features, 'เฉลยภาพ SVG ทีละ 3 ขั้น พร้อมย้อนกลับและเดินหน้า'),
      notes = 'v2.1.0: อ่านข้อมูลจากรูป เลือกสูตรและแทนค่า แล้วคำนวณคำตอบในขั้นสุดท้าย',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;

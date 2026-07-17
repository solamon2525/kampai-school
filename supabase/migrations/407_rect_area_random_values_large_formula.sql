-- Migration 407: Area Lab random values for same formula + large formula display (v2.2.0)
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
  SET version = 'v2.2.0',
      features = array_append(features, 'สุ่มขนาดใหม่โดยคงรูปร่างและสูตรเดิม พร้อมสูตรตัวใหญ่สำหรับโปรเจกเตอร์'),
      notes = 'v2.2.0: แยกสุ่มค่าในสูตรเดิมจากสุ่มรูปใหม่ และขยายสูตรหลักสูงสุด 2.5rem',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;

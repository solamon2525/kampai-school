-- Migration 408: Area Lab vector-style formulas with stacked fractions (v2.2.1)
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
  SET version = 'v2.2.1',
      features = array_append(features, 'สูตรเวกเตอร์ตัวใหญ่พร้อมเศษส่วนแนวตั้ง 1/2 และ 1/4'),
      notes = 'v2.2.1: สูตรคมชัดทุกการซูม เศษส่วนมีเส้นคั่น และเลขยกกำลังวงกลมอ่านชัด',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;

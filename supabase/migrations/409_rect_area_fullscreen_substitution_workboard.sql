-- Migration 409: Area Lab fullscreen substitution workboard (v2.3.0)
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
  SET version = 'v2.3.0',
      features = array_append(features, 'กระดานเฉลยเต็มจอ แทนค่าทีละตัวและแยกทุกช่วงคำนวณ 5–9 ขั้น'),
      notes = 'v2.3.0: ภาพประกอบและสมการตัวใหญ่ แยกอ่านค่า เขียนสูตร แทนค่าทีละตัว วงเล็บ คูณ หาร/ลบ และตอบพร้อมหน่วย',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;

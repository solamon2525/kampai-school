-- 462: Upgrade the existing fraction-pieces worksheet for differentiated P.4-P.5 visual practice.
DO $$
DECLARE
  v_item_id uuid;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/fraction-pieces-worksheet.html'
    AND tracked_game = false
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'fraction-pieces worksheet not found';
  END IF;

  UPDATE public.educational_hub_items
  SET title = '📝 ใบงานเศษส่วนแบบภาพ ป.4–5',
      description = 'ใบงาน A4 แบบสุ่ม แยกระดับ ป.4–5: อ่านและเขียนเศษส่วน โยงคำ ระบายสี วาดภาพ เปรียบเทียบ เศษส่วนเท่ากัน เส้นจำนวน จำนวนคละ คำนวณ และตรวจเหตุผล',
      grade_levels = ARRAY['ป.4','ป.5']::text[],
      tags = ARRAY['ใบงาน','เศษส่วน','ภาพ','ระบายสี','เปรียบเทียบ','จำนวนคละ','ป.4','ป.5','พิมพ์ได้']::text[],
      updated_at = now()
  WHERE id = v_item_id;

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_item_id, indicator.id
  FROM public.curriculum_indicators indicator
  WHERE indicator.indicator_code = ANY (ARRAY[
    'ค 1.1 ป.4/3','ค 1.1 ป.4/4','ค 1.1 ป.4/13','ค 1.1 ป.4/14',
    'ค 1.1 ป.5/3','ค 1.1 ป.5/4','ค 1.1 ป.5/5'
  ]::text[])
    AND indicator.is_active = true
  ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;
END $$;

-- เพิ่มหัวข้อแปลงเศษเกินเป็นจำนวนคละให้ใบงานคลังเศษส่วนเดิม
DO $$
DECLARE
  v_item_id uuid;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE title = '📝 ใบงานคลังเศษส่วน ป.4'
    AND external_url IN (
      '/games/math/math-fraction-hub-worksheet.html',
      '/games/math/fraction-hub-worksheet.html'
    )
  ORDER BY created_at
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'fraction hub worksheet item not found';
  END IF;

  UPDATE public.educational_hub_items
  SET external_url = '/games/math/math-fraction-hub-worksheet.html',
      description = 'ฝึกระบาย อ่านภาพ เปรียบเทียบ แปลงเศษเกินเป็นจำนวนคละ และคำนวณเศษส่วน พร้อมวิธีทำทีละขั้น',
      updated_at = now()
  WHERE id = v_item_id;

  INSERT INTO public.indicator_games (indicator_id, edu_hub_item_id)
  SELECT ci.id, v_item_id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = 'ค 1.1 ป.4/3'
  ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;
END $$;

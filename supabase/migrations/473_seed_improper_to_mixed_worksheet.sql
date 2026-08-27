-- 473: Seed improper-to-mixed worksheet (ใบงานแปลงเศษเกินเป็นจำนวนคละ ป.4–ป.5)
DO $$
DECLARE
  v_owner_id uuid;
  v_category_id uuid;
  v_item_id uuid;
  v_url text := '/games/math/improper-to-mixed-worksheet.html';
BEGIN
  SELECT id INTO v_owner_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type='teaching'
  ORDER BY created_at LIMIT 1;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'teaching owner not found'; END IF;

  SELECT id INTO v_category_id FROM public.educational_hub_categories
  WHERE category_key='worksheets' AND is_active=true LIMIT 1;
  IF v_category_id IS NULL THEN RAISE EXCEPTION 'worksheets category not found'; END IF;

  INSERT INTO public.educational_hub_items
    (owner_staff_id,category_id,item_type,title,description,external_url,thumbnail_url,subject,grade_levels,tags,sort_order,tracked_game,is_published)
  VALUES
    (v_owner_id,v_category_id,'link','📝 ใบงานแปลงเศษเกินเป็นจำนวนคละ ป.4–5',
     'ใบงานพิมพ์ A4 ฝึกแปลงเศษเกินเป็นจำนวนคละ พร้อมวิธีทำตั้งหาร เหตุผล และรูปอย่างต่ำ หน้าละ 10 ข้อ หรือ 5 ข้อพร้อมรูปแท่งเศษส่วน',
     v_url,'/games/math/mixed-number-media-cover.svg','คณิตศาสตร์',ARRAY['ป.4','ป.5']::text[],
     ARRAY['ใบงาน','เศษเกิน','จำนวนคละ','เศษส่วน','คณิตศาสตร์','ป.4','ป.5','พิมพ์ได้']::text[],172,false,true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id=v_owner_id AND external_url=v_url ORDER BY created_at LIMIT 1;
  IF v_item_id IS NULL THEN RAISE EXCEPTION 'improper-to-mixed worksheet item not found'; END IF;

  INSERT INTO public.game_docs(item_id,owner_staff_id,game_format,features,version,notes)
  VALUES(v_item_id,v_owner_id,'ใบงานพิมพ์ A4 แปลงเศษเกินเป็นจำนวนคละ',
    ARRAY['หน้าละ 10 ข้อ (2 คอลัมน์ x 5 แถว) หรือ 5 ข้อ (พร้อมรูปภาพ SVG)','สร้างชุดได้ 1, 2, 3, 5, 10 หน้า พร้อมบันทึกและแชร์ ?set=','ระดับความยาก 5 ระดับ: ผสม, พื้นฐาน, มาตรฐาน, ตัดทอนรูปอย่างต่ำ, ท้าทาย','ขั้นตอนแสดงวิธีทำ: ตั้งหาร ตรวจสอบเหตุผล และเขียนจำนวนคละ','ระบบเฉลยครูทีละข้อ (◀/▶) และเปิดเฉลยทั้งหมด (👁)'],
    'v1.0.0','ใบงานคู่สื่อการสอนจำนวนคละ (mixed-number-media)')
  ON CONFLICT(item_id) DO UPDATE SET game_format=EXCLUDED.game_format,features=EXCLUDED.features,version=EXCLUDED.version,notes=EXCLUDED.notes,updated_at=now();

  INSERT INTO public.indicator_games(indicator_id,edu_hub_item_id)
  SELECT ci.id,v_item_id FROM public.curriculum_indicators ci
  WHERE ci.indicator_code IN ('ค 1.1 ป.4/3','ค 1.1 ป.4/4','ค 1.1 ป.4/13','ค 1.1 ป.4/14','ค 1.1 ป.5/3')
  ON CONFLICT DO NOTHING;
END $$;

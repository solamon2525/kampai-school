-- สื่อจำนวนคละ ป.4–ป.5: ความหมาย ภาพ การแปลง เปรียบเทียบ บวกลบ และตรวจคำตอบ
DO $$
DECLARE
  v_owner_id uuid;
  v_category_id uuid;
  v_item_id uuid;
  v_url text := '/games/math/mixed-number-media.html';
BEGIN
  SELECT id INTO v_owner_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type='teaching'
  ORDER BY created_at LIMIT 1;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'teaching owner not found'; END IF;

  SELECT id INTO v_category_id FROM public.educational_hub_categories
  WHERE category_key='media' AND is_active=true LIMIT 1;
  IF v_category_id IS NULL THEN RAISE EXCEPTION 'media category not found'; END IF;

  INSERT INTO public.educational_hub_items
    (owner_staff_id,category_id,item_type,title,description,external_url,thumbnail_url,subject,grade_levels,tags,sort_order,tracked_game,is_published)
  VALUES
    (v_owner_id,v_category_id,'link','🧩 สื่อการสอนจำนวนคละ ป.4–ป.5',
     'เรียนรู้จำนวนคละจากภาพ แปลงจำนวนคละกับเศษเกิน เปรียบเทียบ บวก–ลบทีละขั้น และตรวจคำตอบด้วยเส้นจำนวน',
     v_url,'/games/math/mixed-number-media-cover.svg','คณิตศาสตร์',ARRAY['ป.4','ป.5'],
     ARRAY['สื่อการสอน','จำนวนคละ','เศษเกิน','เศษส่วน','เส้นจำนวน','คณิตศาสตร์','ป.4','ป.5'],171,false,true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id=v_owner_id AND external_url=v_url ORDER BY created_at LIMIT 1;
  IF v_item_id IS NULL THEN RAISE EXCEPTION 'mixed-number media item not found'; END IF;

  INSERT INTO public.game_docs(item_id,owner_staff_id,game_format,features,version,notes)
  VALUES(v_item_id,v_owner_id,'สื่อจำนวนคละแบบสอนทีละขั้น + ฝึกสั้น',
    ARRAY['6 บท: ความหมาย · ภาพ · แปลง · เปรียบเทียบ · บวกลบ · ตรวจคำตอบ','ระดับ ป.4–ป.5','แท่งเศษส่วน วงกลม และเส้นจำนวน inline SVG','ฝึกสั้น 5 ข้อ ไม่มีคะแนนแข่งขัน','deterministic seed และ keyboard navigation'],
    'v1.0.0','Standalone mixed-number teaching media; CTA uses the existing fraction-hub worksheet temporarily')
  ON CONFLICT(item_id) DO UPDATE SET game_format=EXCLUDED.game_format,features=EXCLUDED.features,version=EXCLUDED.version,notes=EXCLUDED.notes,updated_at=now();

  INSERT INTO public.indicator_games(indicator_id,edu_hub_item_id)
  SELECT ci.id,v_item_id FROM public.curriculum_indicators ci
  WHERE ci.indicator_code IN ('ค 1.1 ป.4/3','ค 1.1 ป.4/4','ค 1.1 ป.4/13','ค 1.1 ป.4/14','ค 1.1 ป.5/3')
  ON CONFLICT DO NOTHING;
END $$;

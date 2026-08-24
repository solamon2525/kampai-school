-- 470: ชุดนำร่องสื่อ + ใบงานเติมคำและระบายสี ป.4–5 จำนวน 4 หน่วย
DO $$
DECLARE
  v_media_category uuid;
  v_ws_category uuid;
  v_owner uuid;
  v record;
  v_item_id uuid;
BEGIN
  SELECT id INTO v_media_category FROM public.educational_hub_categories WHERE category_key='media' AND is_active=true LIMIT 1;
  SELECT id INTO v_ws_category FROM public.educational_hub_categories WHERE category_key='worksheets' AND is_active=true LIMIT 1;
  SELECT id INTO v_owner FROM public.staff WHERE staff_type='teaching' ORDER BY created_at LIMIT 1;
  IF v_media_category IS NULL OR v_ws_category IS NULL OR v_owner IS NULL THEN RAISE EXCEPTION 'required category or teaching staff not found'; END IF;

  FOR v IN SELECT * FROM (VALUES
    ('/games/science/force-motion-media.html','/games/science/force-motion-worksheet.html','🛒 แรงและการเคลื่อนที่','วิทยาศาสตร์',ARRAY['ป.5']::text[],'ว 2.2 ป.5/1','force-motion-color-fill'),
    ('/games/social/map-directions-media.html','/games/social/map-directions-worksheet.html','🧭 ทิศ แผนที่ และสัญลักษณ์','สังคมศึกษา',ARRAY['ป.4']::text[],'ส 5.1 ป.4/1','map-directions-color-fill'),
    ('/games/english/weather-seasons-media.html','/games/english/weather-seasons-worksheet.html','🌦️ Weather and Seasons','ภาษาอังกฤษ',ARRAY['ป.4']::text[],'ต 1.1 ป.4/3','weather-seasons-color-fill'),
    ('/games/thai/homophone-context-media.html','/games/thai/homophone-context-worksheet.html','💬 คำพ้องเสียงและการเลือกใช้คำ','ภาษาไทย',ARRAY['ป.5']::text[],'ท 4.1 ป.5/1','homophone-context-color-fill')
  ) AS x(media_url,ws_url,title,subject,grades,indicator_code,worksheet_key)
  LOOP
    INSERT INTO public.educational_hub_profiles(staff_id,is_hub_active) VALUES(v_owner,true) ON CONFLICT(staff_id) DO NOTHING;
    INSERT INTO public.educational_hub_items(owner_staff_id,category_id,item_type,title,description,external_url,subject,grade_levels,tags,sort_order,tracked_game,is_published,build_version,build_updated_at)
    VALUES(v_owner,v_media_category,'link',v.title||' — สื่อสรุปความรู้','สื่อสอนบนจอพร้อมสรุปความรู้และแบบฝึกสั้น คู่ใบงานเติมคำและระบายสี 3 หน้า',v.media_url,v.subject,v.grades,ARRAY['สื่อการสอน','เติมคำ','ระบายสี','color-fill'],470,false,true,'v1.0.0',now())
    ON CONFLICT DO NOTHING;
    UPDATE public.educational_hub_items SET category_id=v_media_category,title=v.title||' — สื่อสรุปความรู้',description='สื่อสอนบนจอพร้อมสรุปความรู้และแบบฝึกสั้น คู่ใบงานเติมคำและระบายสี 3 หน้า',subject=v.subject,grade_levels=v.grades,tags=ARRAY['สื่อการสอน','เติมคำ','ระบายสี','color-fill'],is_published=true,build_version='v1.0.0',build_updated_at=now(),updated_at=now() WHERE owner_staff_id=v_owner AND external_url=v.media_url;
    SELECT id INTO v_item_id FROM public.educational_hub_items WHERE owner_staff_id=v_owner AND external_url=v.media_url LIMIT 1;
    INSERT INTO public.game_docs(item_id,owner_staff_id,game_format,features,version,notes) VALUES(v_item_id,v_owner,'Dual-track teaching media + printable color-fill worksheet',ARRAY['หน้าสรุปความรู้','ฝึกสั้นแบบเลือกตอบ','คู่ใบงาน A4 3 หน้า','ภาพ SVG ต้นฉบับ'],'v1.0.0','ชุดนำร่อง ป.4–5 · worksheet_key='||v.worksheet_key) ON CONFLICT(item_id) DO UPDATE SET game_format=EXCLUDED.game_format,features=EXCLUDED.features,version=EXCLUDED.version,notes=EXCLUDED.notes,updated_at=now();

    INSERT INTO public.educational_hub_items(owner_staff_id,category_id,item_type,title,description,external_url,subject,grade_levels,tags,sort_order,tracked_game,is_published,build_version,build_updated_at)
    VALUES(v_owner,v_ws_category,'link','📝 ใบงาน '||v.title,'ใบงาน A4 3 หน้า: สรุปความรู้สี เติมคำและระบายสี และประยุกต์ทบทวนพร้อมเฉลยครู',v.ws_url,v.subject,v.grades,ARRAY['ใบงาน','เติมคำ','ระบายสี','พิมพ์ได้'],470,false,true,'v1.0.0',now())
    ON CONFLICT DO NOTHING;
    UPDATE public.educational_hub_items SET category_id=v_ws_category,title='📝 ใบงาน '||v.title,description='ใบงาน A4 3 หน้า: สรุปความรู้สี เติมคำและระบายสี และประยุกต์ทบทวนพร้อมเฉลยครู',subject=v.subject,grade_levels=v.grades,tags=ARRAY['ใบงาน','เติมคำ','ระบายสี','พิมพ์ได้'],is_published=true,build_version='v1.0.0',build_updated_at=now(),updated_at=now() WHERE owner_staff_id=v_owner AND external_url=v.ws_url;
  END LOOP;
END $$;

INSERT INTO public.indicator_games(edu_hub_item_id,indicator_id)
SELECT item.id,indicator.id FROM (VALUES
('/games/science/force-motion-media.html','ว 2.2 ป.5/1'),('/games/science/force-motion-worksheet.html','ว 2.2 ป.5/1'),
('/games/social/map-directions-media.html','ส 5.1 ป.4/1'),('/games/social/map-directions-worksheet.html','ส 5.1 ป.4/1'),
('/games/english/weather-seasons-media.html','ต 1.1 ป.4/3'),('/games/english/weather-seasons-worksheet.html','ต 1.1 ป.4/3'),
('/games/english/weather-seasons-media.html','ต 1.3 ป.4/1'),('/games/english/weather-seasons-worksheet.html','ต 1.3 ป.4/1'),
('/games/thai/homophone-context-media.html','ท 4.1 ป.5/1'),('/games/thai/homophone-context-worksheet.html','ท 4.1 ป.5/1')
) AS m(url,code) JOIN public.educational_hub_items item ON item.external_url=m.url JOIN public.curriculum_indicators indicator ON indicator.indicator_code=m.code ON CONFLICT DO NOTHING;

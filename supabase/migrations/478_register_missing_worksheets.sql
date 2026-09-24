-- Register seven existing worksheet/media pairs that were missing from the worksheet catalog.
BEGIN;

DO $$
DECLARE
  v_owner_id uuid;
  v_category_id uuid;
  v_item_id uuid;
  v_item record;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'teaching owner not found'; END IF;

  SELECT id INTO v_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;
  IF v_category_id IS NULL THEN RAISE EXCEPTION 'worksheets category not found'; END IF;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('/games/arts/music-rhythm-worksheet.html', '📝 ใบงานจังหวะดนตรี ป.3–4', 'ฝึกอ่านและจำแนกค่าตัวโน้ต จังหวะ และรูปแบบจังหวะพื้นฐาน', 'ศิลปะ', ARRAY['ป.3','ป.4']::text[], ARRAY['ใบงาน','ดนตรี','จังหวะ','ศิลปะ']::text[], ARRAY['ศ 2.1 ป.3/2','ศ 2.1 ป.4/3','ศ 2.1 ป.4/4']::text[], 180),
      ('/games/arts/thai-dance-worksheet.html', '📝 ใบงานนาฏศิลป์ไทย ป.3–5', 'ฝึกสังเกตท่ารำ ภาษาท่า และองค์ประกอบนาฏศิลป์ไทย', 'ศิลปะ', ARRAY['ป.3','ป.4','ป.5']::text[], ARRAY['ใบงาน','นาฏศิลป์','ท่ารำ','ศิลปะ']::text[], ARRAY['ศ 3.1 ป.3/2','ศ 3.1 ป.4/2','ศ 3.1 ป.5/3']::text[], 181),
      ('/games/career/agriculture-basics-worksheet.html', '📝 ใบงานเกษตรพื้นฐาน ป.4–6', 'ฝึกวางแผนงานเกษตร การดูแลพืช และใช้ทรัพยากรอย่างรับผิดชอบ', 'การงานอาชีพ', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','เกษตร','พืช','การงานอาชีพ']::text[], ARRAY['ง 1.1 ป.4/2','ง 1.1 ป.5/1','ง 1.1 ป.6/1']::text[], 182),
      ('/games/career/cooking-basics-worksheet.html', '📝 ใบงานทำอาหารพื้นฐาน ป.4–6', 'ฝึกเตรียมวัตถุดิบ ใช้อุปกรณ์ และทำงานครัวอย่างปลอดภัย', 'การงานอาชีพ', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','ทำอาหาร','ความปลอดภัย','การงานอาชีพ']::text[], ARRAY['ง 1.1 ป.4/1','ง 1.1 ป.5/2','ง 1.1 ป.6/2']::text[], 183),
      ('/games/career/housework-craft-worksheet.html', '📝 ใบงานงานบ้านและงานประดิษฐ์ ป.1–3', 'ฝึกจัดลำดับงานบ้าน เลือกอุปกรณ์ และทำงานประดิษฐ์ง่าย ๆ', 'การงานอาชีพ', ARRAY['ป.1','ป.2','ป.3']::text[], ARRAY['ใบงาน','งานบ้าน','งานประดิษฐ์','การงานอาชีพ']::text[], ARRAY['ง 1.1 ป.1/2','ง 1.1 ป.2/3','ง 1.1 ป.3/3']::text[], 184),
      ('/games/social/civic-duty-worksheet.html', '📝 ใบงานหน้าที่พลเมือง ป.1–2', 'ฝึกจำแนกหน้าที่ กติกา สิทธิ และการอยู่ร่วมกันในโรงเรียน', 'สังคมศึกษา', ARRAY['ป.1','ป.2']::text[], ARRAY['ใบงาน','หน้าที่พลเมือง','กติกา','สังคมศึกษา']::text[], ARRAY['ส 2.1 ป.2/1','ส 2.1 ป.2/4','ส 2.2 ป.1/3']::text[], 185),
      ('/games/social/thai-regions-worksheet.html', '📝 ใบงานภูมิภาคของไทย ป.5–6', 'ฝึกเชื่อมโยงภูมิประเทศ ทรัพยากร และวิถีชีวิตของภูมิภาคไทย', 'สังคมศึกษา', ARRAY['ป.5','ป.6']::text[], ARRAY['ใบงาน','ภูมิภาคไทย','ภูมิศาสตร์','สังคมศึกษา']::text[], ARRAY['ส 5.1 ป.5/1','ส 5.2 ป.5/2','ส 5.1 ป.6/1']::text[], 186)
    ) AS items(external_url, title, description, subject, grade_levels, tags, indicators, sort_order)
  LOOP
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    ) VALUES (
      v_owner_id, v_category_id, 'link', v_item.title, v_item.description, v_item.external_url,
      v_item.subject, v_item.grade_levels, v_item.tags, v_item.sort_order, false, true
    )
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_item_id
    FROM public.educational_hub_items
    WHERE owner_staff_id = v_owner_id AND external_url = v_item.external_url
    ORDER BY created_at
    LIMIT 1;
    IF v_item_id IS NULL THEN RAISE EXCEPTION 'worksheet item not found: %', v_item.external_url; END IF;

    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id, v_owner_id, 'ใบงานพิมพ์ A4 พร้อมสื่อคู่',
      ARRAY['สร้างชุดโจทย์แบบ seeded','บันทึก โหลด และแชร์ชุดเดิม','เฉลยทีละข้อและเปิดทั้งหมด','พิมพ์ A4 และเลือกจำนวนหน้า'],
      'v1.0.0', 'ลงทะเบียน catalog และ indicator mapping ให้ใบงานที่มีอยู่เดิม'
    )
    ON CONFLICT (item_id) DO UPDATE SET
      game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();

    INSERT INTO public.indicator_games (indicator_id, edu_hub_item_id)
    SELECT ci.id, v_item_id
    FROM public.curriculum_indicators ci
    WHERE ci.indicator_code = ANY(v_item.indicators)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;

-- 425: ลงทะเบียนใบงานคู่ hub ชุดที่ 11 (อ่าน · เขียน · ร้อยกรอง · วรรณคดี · สังคมไทย)
DO $$
DECLARE
  v_worksheet_category_id uuid;
  v_spec record;
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_worksheet_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_worksheet_category_id IS NULL THEN
    RAISE EXCEPTION 'category worksheets not found';
  END IF;

  FOR v_spec IN
    SELECT * FROM (VALUES
      ('/games/thai/thai-reading-hub/index.html', '/games/thai/thai-reading-hub-worksheet.html',
       '📝 ใบงานคลังอ่านจับใจความ ป.4–ป.5',
       'ใบงาน A4 คู่คลังอ่านจับใจความ ฝึกใจความ รายละเอียด อนุมาน และข้อเท็จจริง',
       '/games/thai/thai-reading-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','อ่าน','พิมพ์ได้']::text[], 166),
      ('/games/thai/thai-writing-hub/index.html', '/games/thai/thai-writing-hub-worksheet.html',
       '📝 ใบงานคลังแต่งข้อความ ป.4–ป.5',
       'ใบงาน A4 คู่คลังแต่งข้อความ ฝึกประโยค ย่อหน้า จดหมายสั้น และตรวจแก้',
       '/games/thai/thai-writing-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','เขียน','พิมพ์ได้']::text[], 167),
      ('/games/thai/thai-poetry-hub/index.html', '/games/thai/thai-poetry-hub-worksheet.html',
       '📝 ใบงานคลังบทร้อยกรอง ป.4–ป.5',
       'ใบงาน A4 คู่คลังบทร้อยกรอง ฝึกสัมผัส คำขวัญ และจำแนกร้อยแก้ว/ร้อยกรอง',
       '/games/thai/thai-poetry-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ร้อยกรอง','พิมพ์ได้']::text[], 168),
      ('/games/thai/thai-literature-hub/index.html', '/games/thai/thai-literature-hub-worksheet.html',
       '📝 ใบงานคลังวรรณคดีวรรณกรรม ป.4–ป.5',
       'ใบงาน A4 คู่คลังวรรณคดี ฝึกนิทาน สุภาษิต ตัวละคร และข้อคิด',
       '/games/thai/thai-literature-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','วรรณคดี','พิมพ์ได้']::text[], 169),
      ('/games/social/social-thailand-hub/index.html', '/games/social/social-thailand-hub-worksheet.html',
       '📝 ใบงานคลังสังคมศึกษาไทย ป.4–ป.5',
       'ใบงาน A4 คู่คลังสังคมไทย ฝึกแผนที่ ประวัติศาสตร์อย่างง่าย และพลเมืองดี',
       '/games/social/social-thailand-hub/cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','สังคม','พิมพ์ได้']::text[], 170)
    ) AS specs(source_url, worksheet_url, title, description, thumbnail_url, subject, grade_levels, tags, sort_order)
  LOOP
    SELECT owner_staff_id INTO v_owner_id
    FROM public.educational_hub_items
    WHERE external_url = v_spec.source_url AND is_published = true
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_owner_id IS NULL THEN
      RAISE EXCEPTION 'source media not found: %', v_spec.source_url;
    END IF;

    INSERT INTO public.educational_hub_items
      (owner_staff_id, category_id, item_type, title, description, external_url,
       thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
    SELECT v_owner_id, v_worksheet_category_id, 'link', v_spec.title, v_spec.description,
           v_spec.worksheet_url, v_spec.thumbnail_url, v_spec.subject, v_spec.grade_levels,
           v_spec.tags, v_spec.sort_order, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE owner_staff_id = v_owner_id AND external_url = v_spec.worksheet_url
    );

    UPDATE public.educational_hub_items
    SET category_id = v_worksheet_category_id,
        title = v_spec.title,
        description = v_spec.description,
        thumbnail_url = v_spec.thumbnail_url,
        subject = v_spec.subject,
        grade_levels = v_spec.grade_levels,
        tags = v_spec.tags,
        sort_order = v_spec.sort_order,
        tracked_game = false,
        is_published = true,
        updated_at = now()
    WHERE owner_staff_id = v_owner_id AND external_url = v_spec.worksheet_url;
  END LOOP;
END $$;

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT worksheet.id, indicator.id
FROM (VALUES
  ('/games/thai/thai-reading-hub-worksheet.html', 'ท 1.1 ป.5/2'),
  ('/games/thai/thai-reading-hub-worksheet.html', 'ท 1.1 ป.5/3'),
  ('/games/thai/thai-writing-hub-worksheet.html', 'ท 2.1 ป.4/1'),
  ('/games/thai/thai-writing-hub-worksheet.html', 'ท 4.1 ป.5/3'),
  ('/games/thai/thai-poetry-hub-worksheet.html', 'ท 5.1 ป.4/4'),
  ('/games/thai/thai-poetry-hub-worksheet.html', 'ท 4.1 ป.4/5'),
  ('/games/thai/thai-literature-hub-worksheet.html', 'ท 5.1 ป.4/1'),
  ('/games/thai/thai-literature-hub-worksheet.html', 'ท 5.1 ป.4/2'),
  ('/games/social/social-thailand-hub-worksheet.html', 'ส 5.1 ป.4/1'),
  ('/games/social/social-thailand-hub-worksheet.html', 'ส 4.3 ป.4/1'),
  ('/games/social/social-thailand-hub-worksheet.html', 'ส 2.1 ป.4/1')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

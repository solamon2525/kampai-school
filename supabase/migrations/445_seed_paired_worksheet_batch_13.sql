-- 445: ลงทะเบียนใบงานคู่ Batch 13 (Media Y/Z/AA)
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
      ('/games/math/clock-media.html', '/games/math/clock-media-worksheet.html',
       '📝 ใบงานนาฬิกาบอกเวลา', 'ใบงาน A4 คู่สื่อนาฬิกา — อ่านเวลา วาดเข็ม โจทย์สถานการณ์',
       '/games/math/clock-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
       ARRAY['ใบงาน','นาฬิกา','พิมพ์ได้']::text[], 186),
      ('/games/math/thai-money-media.html', '/games/math/thai-money-media-worksheet.html',
       '📝 ใบงานเงินไทย', 'ใบงาน A4 คู่สื่อเงินไทย — นับยอด ทอนเงิน เลือกจ่าย',
       '/games/math/thai-money-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3']::text[],
       ARRAY['ใบงาน','เงิน','พิมพ์ได้']::text[], 187),
      ('/games/math/geometry-3d-media.html', '/games/math/geometry-3d-media-worksheet.html',
       '📝 ใบงานเรขาคณิต 2D/3D', 'ใบงาน A4 คู่สื่อเรขา — นับหน้า/ขอบ/จุดยอด รูปคลี่',
       '/games/math/geometry-3d-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','เรขาคณิต','พิมพ์ได้']::text[], 188),
      ('/games/health/brush-teeth-media.html', '/games/health/brush-teeth-media-worksheet.html',
       '📝 ใบงานแปรงฟันถูกวิธี', 'ใบงาน A4 คู่สื่อแปรงฟัน — ลำดับขั้นตอนและอนามัยช่องปาก',
       '/games/health/brush-teeth-media-cover.png', 'สุขศึกษา', ARRAY['ป.3']::text[],
       ARRAY['ใบงาน','แปรงฟัน','พิมพ์ได้']::text[], 189),
      ('/games/science/light-properties-media.html', '/games/science/light-properties-media-worksheet.html',
       '📝 ใบงานสมบัติของแสง', 'ใบงาน A4 คู่สื่อแสง — ทึบแสง ผ่านบางส่วน โปร่งใส',
       '/games/science/light-properties-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','แสง','พิมพ์ได้']::text[], 190),
      ('/games/english/sight-words-p123-media.html', '/games/english/sight-words-p123-media-worksheet.html',
       '📝 ใบงาน Sight Words ป.1–3', 'ใบงาน A4 คู่สื่อ Sight Words ป.1–3',
       '/games/english/sight-words-p123-media-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3']::text[],
       ARRAY['ใบงาน','sight words','พิมพ์ได้']::text[], 191),
      ('/games/english/classroom-english-media.html', '/games/english/classroom-english-media-worksheet.html',
       '📝 ใบงาน Classroom English', 'ใบงาน A4 คู่สื่อวลีในห้องเรียน',
       '/games/english/classroom-english-media-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','classroom english','พิมพ์ได้']::text[], 192),
      ('/games/thai/literature-short-media.html', '/games/thai/literature-short-media-worksheet.html',
       '📝 ใบงานวรรณคดีสั้น', 'ใบงาน A4 คู่สื่อวรรณคดีสั้น — ตัวละคร ข้อคิด',
       '/games/thai/literature-short-media-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','วรรณคดี','พิมพ์ได้']::text[], 193),
      ('/games/social/thai-calendar-media.html', '/games/social/thai-calendar-media-worksheet.html',
       '📝 ใบงานปฏิทินวันสำคัญไทย', 'ใบงาน A4 คู่สื่อปฏิทินวันสำคัญ',
       '/games/social/thai-calendar-media-cover.png', 'สังคมศึกษา', ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','วันสำคัญ','พิมพ์ได้']::text[], 194),
      ('/games/science/human-organs-media.html', '/games/science/human-organs-media-worksheet.html',
       '📝 ใบงานอวัยวะสำคัญ', 'ใบงาน A4 คู่สื่ออวัยวะ — หน้าที่และการดูแล',
       '/games/science/human-organs-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','อวัยวะ','พิมพ์ได้']::text[], 195)
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
  ('/games/math/clock-media-worksheet.html', 'ค 2.1 ป.2/1'),
  ('/games/math/clock-media-worksheet.html', 'ค 2.1 ป.3/2'),
  ('/games/math/clock-media-worksheet.html', 'ค 2.1 ป.4/1'),
  ('/games/math/thai-money-media-worksheet.html', 'ค 2.1 ป.3/1'),
  ('/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.5/4'),
  ('/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.6/3'),
  ('/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.6/4'),
  ('/games/health/brush-teeth-media-worksheet.html', 'พ 4.1 ป.3/4'),
  ('/games/science/light-properties-media-worksheet.html', 'ว 2.3 ป.4/1'),
  ('/games/english/sight-words-p123-media-worksheet.html', 'ต 1.1 ป.1/2'),
  ('/games/english/sight-words-p123-media-worksheet.html', 'ต 1.1 ป.2/2'),
  ('/games/english/classroom-english-media-worksheet.html', 'ต 1.1 ป.1/1'),
  ('/games/english/classroom-english-media-worksheet.html', 'ต 1.1 ป.2/1'),
  ('/games/english/classroom-english-media-worksheet.html', 'ต 1.2 ป.3/1'),
  ('/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.4/5'),
  ('/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.5/5'),
  ('/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.6/4'),
  ('/games/social/thai-calendar-media-worksheet.html', 'ส 4.3 ป.4/1'),
  ('/games/social/thai-calendar-media-worksheet.html', 'ส 4.3 ป.5/1'),
  ('/games/social/thai-calendar-media-worksheet.html', 'ส 2.1 ป.3/1'),
  ('/games/science/human-organs-media-worksheet.html', 'ว 1.2 ป.4/1'),
  ('/games/science/human-organs-media-worksheet.html', 'ว 1.2 ป.6/1')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

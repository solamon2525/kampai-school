-- 418: ลงทะเบียนใบงานคู่สื่อที่เหลือ (21 เรื่อง) — sort_order 150+
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
      ('/games/english/follow-instructions.html', '/games/english/follow-instructions-worksheet.html',
       '📝 ใบงาน Follow Instructions ป.4–6',
       'ใบงาน A4 คู่สื่อ Follow Instructions ฝึกอ่านคำสั่ง Circle/Underline/Tick ลงวิธีคิด 3 ขั้น',
       '/games/english/follow-instructions-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','คำสั่ง','ภาษาอังกฤษ','พิมพ์ได้']::text[], 150),
      ('/games/english/grammar-mini.html', '/games/english/grammar-mini-worksheet.html',
       '📝 ใบงาน Grammar Mini ป.4–6',
       'ใบงาน A4 คู่สื่อ Grammar Mini ฝึก is/are · a/an · this/that/these/those',
       '/games/english/grammar-mini-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ไวยากรณ์','ภาษาอังกฤษ','พิมพ์ได้']::text[], 151),
      ('/games/english/sight-words-p4.html', '/games/english/sight-words-worksheet.html',
       '📝 ใบงาน Sight Words ป.4–6',
       'ใบงาน A4 คู่สื่อ Sight Words ฝึกอ่านจำ because, before, between, important ใช้ในประโยค',
       '/games/english/sight-words-p4-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','sight words','ภาษาอังกฤษ','พิมพ์ได้']::text[], 152),
      ('/games/health/handwash-media.html', '/games/health/handwash-worksheet.html',
       '📝 ใบงานล้างมือ 7 ขั้น ป.1–4',
       'ใบงาน A4 คู่สื่อล้างมือ 7 ขั้น เรียงลำดับ อธิบายวิธีทำ และเชื่อมสุขภาพ',
       '/games/health/handwash-media-cover.png', 'สุขศึกษา', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
       ARRAY['ใบงาน','ล้างมือ','สุขภาพ','พิมพ์ได้']::text[], 153),
      ('/games/math/bar-chart-media.html', '/games/math/bar-chart-worksheet.html',
       '📝 ใบงานแผนภูมิแท่ง ป.4–6',
       'ใบงาน A4 คู่สื่อแผนภูมิแท่ง อ่านตาราง เปรียบเทียบ หาผลรวม และกำหนดสเกล',
       '/games/math/bar-chart-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','แผนภูมิ','ข้อมูล','พิมพ์ได้']::text[], 154),
      ('/games/math/number-line-media.html', '/games/math/number-line-worksheet.html',
       '📝 ใบงานเส้นจำนวน ป.1–4',
       'ใบงาน A4 คู่สื่อเส้นจำนวน ระบุตำแหน่ง เปรียบเทียบ เรียงลำดับ และกระโดดบวกลบ',
       '/games/math/number-line-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
       ARRAY['ใบงาน','เส้นจำนวน','คณิตศาสตร์','พิมพ์ได้']::text[], 155),
      ('/games/math/short-division-thinking-media.html', '/games/math/short-division-worksheet.html',
       '📝 ใบงานหารสั้นวิธีคิด ป.4–6',
       'ใบงาน A4 คู่สื่อหารสั้น คำนวณทีละขั้น ตรวจด้วยคูณย้อน และแก้โจทย์ปัญหา',
       '/games/math/short-division-thinking-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','หาร','คิดเลข','พิมพ์ได้']::text[], 156),
      ('/games/math/math-decimal-hub/index.html', '/games/math/decimal-hub-worksheet.html',
       '📝 ใบงานทศนิยม Hub ป.4–6',
       'ใบงาน A4 คู่สื่อทศนิยม Hub อ่านค่า เปรียบเทียบ ค่าประจำหลัก และบวกลบ',
       '/games/math/math-decimal-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ทศนิยม','hub','พิมพ์ได้']::text[], 157),
      ('/games/math/math-fraction-hub/index.html', '/games/math/fraction-hub-worksheet.html',
       '📝 ใบงานเศษส่วน Hub ป.4–6',
       'ใบงาน A4 คู่สื่อเศษส่วน Hub ความหมาย เปรียบเทียบ เศษส่วนเท่ากัน และบวกลบ',
       '/games/math/math-fraction-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','เศษส่วน','hub','พิมพ์ได้']::text[], 158),
      ('/games/math/math-geometry-hub/index.html', '/games/math/geometry-hub-worksheet.html',
       '📝 ใบงานเรขาคณิต Hub ป.4–6',
       'ใบงาน A4 คู่สื่อเรขาคณิต Hub รูปทรง มุม เส้นรอบ และพื้นที่',
       '/games/math/math-geometry-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','เรขาคณิต','hub','พิมพ์ได้']::text[], 159),
      ('/games/math/math-word-problem-hub/index.html', '/games/math/word-problem-hub-worksheet.html',
       '📝 ใบงานโจทย์ปัญหา Hub ป.4–6',
       'ใบงาน A4 คู่สื่อโจทย์ปัญหา Hub อ่านโจทย์ วางแผน คำนวณ และตรวจคำตอบ',
       '/games/math/math-word-problem-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','โจทย์ปัญหา','hub','พิมพ์ได้']::text[], 160),
      ('/games/social/social-thailand-hub/index.html', '/games/social/thailand-hub-worksheet.html',
       '📝 ใบงานประเทศไทย Hub ป.4–6',
       'ใบงาน A4 คู่สื่อประเทศไทย Hub ภูมิภาค วัฒนธรรม ประวัติศาสตร์ และพลเมือง',
       '/games/social/social-thailand-hub/cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ประเทศไทย','hub','พิมพ์ได้']::text[], 161),
      ('/games/thai/thai-grammar-hub/index.html', '/games/thai/grammar-hub-worksheet.html',
       '📝 ใบงานไวยากรณ์ไทย Hub ป.4–6',
       'ใบงาน A4 คู่สื่อไวยากรณ์ Hub ชนิดคำ ประโยค ลักษณนาม และแก้ประโยค',
       '/games/thai/thai-grammar-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ไวยากรณ์','hub','พิมพ์ได้']::text[], 162),
      ('/games/thai/thai-idiom-hub/index.html', '/games/thai/idiom-hub-worksheet.html',
       '📝 ใบงานสำนวนไทย Hub ป.4–6',
       'ใบงาน A4 คู่สื่อสำนวน Hub ความหมาย ใช้ในประโยค จับคู่ และสร้างประโยค',
       '/games/thai/thai-idiom-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','สำนวน','hub','พิมพ์ได้']::text[], 163),
      ('/games/thai/thai-literature-hub/index.html', '/games/thai/literature-hub-worksheet.html',
       '📝 ใบงานวรรณคดี Hub ป.4–6',
       'ใบงาน A4 คู่สื่อวรรณคดี Hub ประเภท องค์ประกอบ วิเคราะห์ และสะท้อนข้อคิด',
       '/games/thai/thai-literature-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','วรรณคดี','hub','พิมพ์ได้']::text[], 164),
      ('/games/thai/thai-poetry-hub/index.html', '/games/thai/poetry-hub-worksheet.html',
       '📝 ใบงานบทกวี Hub ป.4–6',
       'ใบงาน A4 คู่สื่อบทกวี Hub รูปแบบกลอน สัมผัส ความหมาย และแต่งกลอนสั้น',
       '/games/thai/thai-poetry-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','บทกวี','hub','พิมพ์ได้']::text[], 165),
      ('/games/thai/thai-punctuation-hub/index.html', '/games/thai/punctuation-hub-worksheet.html',
       '📝 ใบงานเครื่องหมายวรรคตอน Hub ป.4–6',
       'ใบงาน A4 คู่สื่อวรรคตอน Hub เครื่องหมาย แก้ไข ใช้ถูกต้อง และอ่านจังหวะ',
       '/games/thai/thai-punctuation-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','วรรคตอน','hub','พิมพ์ได้']::text[], 166),
      ('/games/thai/thai-reading-hub/index.html', '/games/thai/reading-hub-worksheet.html',
       '📝 ใบงานการอ่าน Hub ป.4–6',
       'ใบงาน A4 คู่สื่อการอ่าน Hub ใจความสำคัญ รายละเอียด อนุมาน และคำศัพท์',
       '/games/thai/thai-reading-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','การอ่าน','hub','พิมพ์ได้']::text[], 167),
      ('/games/thai/thai-script-hub/index.html', '/games/thai/script-hub-worksheet.html',
       '📝 ใบงานอักษรไทย Hub ป.1–4',
       'ใบงาน A4 คู่สื่ออักษรไทย Hub พยัญชนะ สระ วรรณยุกต์ และการสะกดคำ',
       '/games/thai/thai-script-hub/cover.png', 'ภาษาไทย', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
       ARRAY['ใบงาน','อักษรไทย','hub','พิมพ์ได้']::text[], 168),
      ('/games/thai/thai-sentence-hub/index.html', '/games/thai/sentence-hub-worksheet.html',
       '📝 ใบงานประโยคไทย Hub ป.4–6',
       'ใบงาน A4 คู่สื่อประโยค Hub ชนิดประโยค ส่วนประโยค ขยาย และรวมประโยค',
       '/games/thai/thai-sentence-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ประโยค','hub','พิมพ์ได้']::text[], 169),
      ('/games/thai/thai-writing-hub/index.html', '/games/thai/writing-hub-worksheet.html',
       '📝 ใบงานการเขียน Hub ป.4–6',
       'ใบงาน A4 คู่สื่อการเขียน Hub วางแผน ย่อหน้า แก้ไข และสำนวน',
       '/games/thai/thai-writing-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','การเขียน','hub','พิมพ์ได้']::text[], 170)
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
  ('/games/english/follow-instructions-worksheet.html', 'ต 1.1 ป.4/1'),
  ('/games/english/follow-instructions-worksheet.html', 'ต 1.1 ป.4/3'),
  ('/games/english/grammar-mini-worksheet.html', 'ต 2.1 ป.4/1'),
  ('/games/english/sight-words-worksheet.html', 'ต 1.1 ป.4/2'),
  ('/games/health/handwash-worksheet.html', 'พ 4.1 ป.1/1'),
  ('/games/health/handwash-worksheet.html', 'ว 1.2 ป.1/2'),
  ('/games/math/bar-chart-worksheet.html', 'ค 3.1 ป.4/1'),
  ('/games/math/number-line-worksheet.html', 'ค 1.1 ป.1/2'),
  ('/games/math/number-line-worksheet.html', 'ค 1.1 ป.2/1'),
  ('/games/math/number-line-worksheet.html', 'ค 1.1 ป.3/1'),
  ('/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/9'),
  ('/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/10'),
  ('/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/11'),
  ('/games/math/decimal-hub-worksheet.html', 'ค 1.1 ป.4/5'),
  ('/games/math/decimal-hub-worksheet.html', 'ค 1.1 ป.4/6'),
  ('/games/math/fraction-hub-worksheet.html', 'ค 1.1 ป.4/13'),
  ('/games/math/fraction-hub-worksheet.html', 'ค 1.1 ป.4/14'),
  ('/games/math/geometry-hub-worksheet.html', 'ค 2.2 ป.4/1'),
  ('/games/math/geometry-hub-worksheet.html', 'ค 2.2 ป.4/2'),
  ('/games/math/word-problem-hub-worksheet.html', 'ค 1.2 ป.4/1'),
  ('/games/math/word-problem-hub-worksheet.html', 'ค 1.2 ป.5/1'),
  ('/games/social/thailand-hub-worksheet.html', 'ส 5.1 ป.4/1'),
  ('/games/social/thailand-hub-worksheet.html', 'ส 4.3 ป.4/1'),
  ('/games/social/thailand-hub-worksheet.html', 'ส 2.1 ป.4/1'),
  ('/games/thai/grammar-hub-worksheet.html', 'ท 4.1 ป.4/2'),
  ('/games/thai/grammar-hub-worksheet.html', 'ท 4.1 ป.5/1'),
  ('/games/thai/idiom-hub-worksheet.html', 'ท 4.1 ป.4/1'),
  ('/games/thai/idiom-hub-worksheet.html', 'ท 4.1 ป.5/1'),
  ('/games/thai/literature-hub-worksheet.html', 'ท 5.1 ป.5/2'),
  ('/games/thai/poetry-hub-worksheet.html', 'ท 5.1 ป.4/4'),
  ('/games/thai/poetry-hub-worksheet.html', 'ท 4.1 ป.4/5'),
  ('/games/thai/punctuation-hub-worksheet.html', 'ท 4.1 ป.4/3'),
  ('/games/thai/punctuation-hub-worksheet.html', 'ท 4.1 ป.4/4'),
  ('/games/thai/reading-hub-worksheet.html', 'ท 1.1 ป.5/2'),
  ('/games/thai/reading-hub-worksheet.html', 'ท 1.1 ป.5/3'),
  ('/games/thai/script-hub-worksheet.html', 'ท 4.1 ป.1/1'),
  ('/games/thai/script-hub-worksheet.html', 'ท 4.1 ป.2/1'),
  ('/games/thai/sentence-hub-worksheet.html', 'ท 4.1 ป.5/2'),
  ('/games/thai/writing-hub-worksheet.html', 'ท 2.1 ป.4/1'),
  ('/games/thai/writing-hub-worksheet.html', 'ท 4.1 ป.5/3')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
  AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

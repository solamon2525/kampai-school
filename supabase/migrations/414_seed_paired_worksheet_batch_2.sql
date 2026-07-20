-- 414: ลงทะเบียนใบงานคู่สื่อ ชุดที่ 2 (10 สื่อ ป.4–6) และเชื่อมตัวชี้วัด
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
      ('/games/math/decimal-media.html', '/games/math/decimal-worksheet.html',
       '📝 ใบงานทศนิยม ป.4–6',
       'ใบงาน A4 คู่สื่อทศนิยม ฝึกอ่านค่า เปรียบเทียบ บวกลบ และใช้ในชีวิตจริง พร้อมเฉลยครูแบบลงวิธี',
       '/games/math/decimal-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ทศนิยม','คำนวณ','พิมพ์ได้']::text[], 120),
      ('/games/math/angle-media.html', '/games/math/angle-worksheet.html',
       '📝 ใบงานมุม ป.4–6',
       'ใบงาน A4 คู่สื่อมุม ฝึกจำแนกมุมแหลม ฉาก ป้าน อ่านค่า และใช้เหตุผล',
       '/games/math/angle-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','มุม','เรขาคณิต','พิมพ์ได้']::text[], 121),
      ('/games/math/fraction-pieces.html', '/games/math/fraction-pieces-worksheet.html',
       '📝 ใบงานเศษส่วน ป.4–6',
       'ใบงาน A4 คู่สื่อเศษส่วนชิ้น ฝึกแทนค่า เปรียบเทียบ หาเท่ากัน และบวกเศษส่วน',
       '/games/math/fraction-pieces-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','เศษส่วน','เปรียบเทียบ','พิมพ์ได้']::text[], 122),
      ('/games/science/states-of-matter.html', '/games/science/states-of-matter-worksheet.html',
       '📝 ใบงานสสารสามสถานะ ป.4–6',
       'ใบงาน A4 คู่สื่อสสารสามสถานะ ฝึกจำแนกของแข็ง ของเหลว ของแก๊ส และอธิบายการเปลี่ยนสถานะ',
       '/games/science/states-of-matter-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','สสาร','สถานะ','พิมพ์ได้']::text[], 123),
      ('/games/science/vertebrate-sort.html', '/games/science/vertebrate-sort-worksheet.html',
       '📝 ใบงานสัตว์มี/ไม่มีกระดูกสันหลัง ป.4–6',
       'ใบงาน A4 คู่สื่อจำแนกสัตว์ ฝึกจัดกลุ่ม อธิบายลักษณะ และยกตัวอย่าง',
       '/games/science/vertebrate-sort-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','สัตว์','จำแนก','พิมพ์ได้']::text[], 124),
      ('/games/thai/thai-word-types.html', '/games/thai/thai-word-types-worksheet.html',
       '📝 ใบงานชนิดของคำ ป.4–6',
       'ใบงาน A4 คู่สื่อชนิดของคำ ฝึกจำแนกคำนาม คำกริยา คำคุณศัพท์ และวิเคราะห์ในประโยค',
       '/games/thai/thai-word-types-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ชนิดของคำ','ไวยากรณ์','พิมพ์ได้']::text[], 125),
      ('/games/thai/synonym-media.html', '/games/thai/synonym-worksheet.html',
       '📝 ใบงานคำพ้องความหมาย ป.4–6',
       'ใบงาน A4 คู่สื่อคำพ้อง ฝึกหาคำใกล้ความหมาย ใช้ในประโยค และอธิบายความสัมพันธ์ของคำ',
       '/games/thai/synonym-media-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','คำพ้อง','คำศัพท์','พิมพ์ได้']::text[], 126),
      ('/games/science/moon-phases-media.html', '/games/science/moon-phases-worksheet.html',
       '📝 ใบงานดวงจันทร์และข้างขึ้น ป.4–6',
       'ใบงาน A4 คู่สื่อดวงจันทร์ ฝึกเรียงลำดับข้างขึ้น เรียกชื่อ และอธิบายเหตุผลทางดาราศาสตร์',
       '/games/science/moon-phases-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ดวงจันทร์','จักรวาล','พิมพ์ได้']::text[], 127),
      ('/games/social/sukhothai-timeline.html', '/games/social/sukhothai-timeline-worksheet.html',
       '📝 ใบงานไทยสุโขทัย ป.4–6',
       'ใบงาน A4 คู่สื่อไทยสุโขทัย ฝึกเรียงเหตุการณ์ ระบุบุคคลสำคัญ และอธิบายความสำคัญทางประวัติศาสตร์',
       '/games/social/sukhothai-timeline-cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','สุโขทัย','ประวัติศาสตร์','พิมพ์ได้']::text[], 128),
      ('/games/health/bone-muscle-media.html', '/games/health/bone-muscle-worksheet.html',
       '📝 ใบงานกระดูกและกล้ามเนื้อ ป.4–6',
       'ใบงาน A4 คู่สื่อกระดูก–กล้ามเนื้อ ฝึกระบุส่วน อธิบายหน้าที่ และวิธีดูแลสุขภาพ',
       '/games/health/bone-muscle-media-cover.png', 'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','กระดูก','กล้ามเนื้อ','พิมพ์ได้']::text[], 129)
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
  ('/games/math/decimal-worksheet.html', 'ค 1.1 ป.4/5'),
  ('/games/math/decimal-worksheet.html', 'ค 1.1 ป.4/6'),
  ('/games/math/angle-worksheet.html', 'ค 2.2 ป.4/1'),
  ('/games/math/angle-worksheet.html', 'ค 2.2 ป.4/2'),
  ('/games/math/fraction-pieces-worksheet.html', 'ค 1.1 ป.4/3'),
  ('/games/math/fraction-pieces-worksheet.html', 'ค 1.1 ป.4/4'),
  ('/games/science/states-of-matter-worksheet.html', 'ว 2.1 ป.4/3'),
  ('/games/science/states-of-matter-worksheet.html', 'ว 2.1 ป.4/4'),
  ('/games/science/vertebrate-sort-worksheet.html', 'ว 1.3 ป.4/3'),
  ('/games/science/vertebrate-sort-worksheet.html', 'ว 1.3 ป.4/4'),
  ('/games/thai/thai-word-types-worksheet.html', 'ท 4.1 ป.4/2'),
  ('/games/thai/thai-word-types-worksheet.html', 'ท 4.1 ป.4/6'),
  ('/games/thai/synonym-worksheet.html', 'ท 1.1 ป.4/2'),
  ('/games/science/moon-phases-worksheet.html', 'ว 3.1 ป.4/1'),
  ('/games/science/moon-phases-worksheet.html', 'ว 3.1 ป.4/2'),
  ('/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/1'),
  ('/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/2'),
  ('/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/3'),
  ('/games/health/bone-muscle-worksheet.html', 'พ 1.1 ป.4/2'),
  ('/games/health/bone-muscle-worksheet.html', 'พ 1.1 ป.4/3')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
  AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

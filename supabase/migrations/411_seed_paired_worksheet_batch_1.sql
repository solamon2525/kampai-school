-- 411: ลงทะเบียนใบงานคู่สื่อ ชุดที่ 1 (5 วิชา) และเชื่อมตัวชี้วัด
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
      ('/games/math/math-data-hub/index.html', '/games/math/data-chart-worksheet.html',
       '📝 ใบงานข้อมูลและแผนภูมิ ป.4',
       'ใบงาน A4 คู่คลังข้อมูลและกราฟ ฝึกอ่านตาราง กำหนดสเกล สร้างแผนภูมิ และสรุปจากข้อมูล',
       '/games/math/math-data-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','ข้อมูล','แผนภูมิ','ตาราง','พิมพ์ได้']::text[], 110),
      ('/games/thai/fact-opinion.html', '/games/thai/fact-opinion-worksheet.html',
       '📝 ใบงานข้อเท็จจริง–ความคิดเห็น ป.4',
       'ใบงาน A4 คู่สื่อข้อเท็จจริงและความคิดเห็น ฝึกหาคำบอกเหตุ จำแนก และยกหลักฐานประกอบเหตุผล',
       '/games/thai/fact-opinion-cover.png', 'ภาษาไทย', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','ข้อเท็จจริง','ความคิดเห็น','เหตุผล','พิมพ์ได้']::text[], 111),
      ('/games/english/phonics-chart.html', '/games/english/phonics-worksheet.html',
       '📝 Phonics Worksheet — Sounds & Words',
       'ใบงาน A4 คู่ Phonics Chart ฝึกเชื่อมตัวอักษรกับเสียง เสียงต้น/ท้าย blends และ digraphs',
       '/games/english/phonics-chart-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3']::text[],
       ARRAY['ใบงาน','phonics','blends','digraphs','พิมพ์ได้']::text[], 112),
      ('/games/science/water-cycle.html', '/games/science/water-cycle-worksheet.html',
       '📝 ใบงานวัฏจักรน้ำ ป.5',
       'ใบงาน A4 คู่สื่อวัฏจักรน้ำ ฝึกเรียงลำดับ ระเหย ควบแน่น หยาดน้ำฟ้า รวมตัว และอธิบายเหตุผล',
       '/games/science/water-cycle-cover.png', 'วิทยาศาสตร์', ARRAY['ป.5']::text[],
       ARRAY['ใบงาน','วัฏจักรน้ำ','เรียงลำดับ','เหตุผล','พิมพ์ได้']::text[], 113),
      ('/games/health/food-label-media.html', '/games/health/food-label-worksheet.html',
       '📝 ใบงานอ่านฉลากโภชนาการ ป.4',
       'ใบงาน A4 คู่สื่ออ่านฉลาก ฝึกอ่านหน่วยบริโภค คำนวณสารอาหาร และตัดสินใจโดยอ้างข้อมูล',
       '/games/health/food-label-media-cover.png', 'สุขศึกษา', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','ฉลากโภชนาการ','สุขภาพ','ตัดสินใจ','พิมพ์ได้']::text[], 114)
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
  ('/games/math/data-chart-worksheet.html', 'ค 3.1 ป.4/1'),
  ('/games/math/data-chart-worksheet.html', 'ค 3.1 ป.4/2'),
  ('/games/thai/fact-opinion-worksheet.html', 'ท 1.1 ป.4/4'),
  ('/games/thai/fact-opinion-worksheet.html', 'ท 3.1 ป.4/1'),
  ('/games/english/phonics-worksheet.html', 'ต 1.1 ป.1/2'),
  ('/games/english/phonics-worksheet.html', 'ต 2.2 ป.1/1'),
  ('/games/science/water-cycle-worksheet.html', 'ว 3.2 ป.5/3'),
  ('/games/health/food-label-worksheet.html', 'พ 4.1 ป.4/3')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
  AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

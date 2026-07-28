-- 426: ลงทะเบียนใบงานคู่ Batch 12 (grammar-mini + data/english/science/vocab hubs)
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
      ('/games/english/grammar-mini.html', '/games/english/grammar-mini-worksheet.html',
       '📝 ใบงาน Grammar Mini ป.4',
       'ใบงาน A4 คู่ Grammar Mini ฝึก is/are · a/an · demonstratives',
       '/games/english/grammar-mini-cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','grammar','อังกฤษ','พิมพ์ได้']::text[], 171),
      ('/games/math/math-data-hub/index.html', '/games/math/math-data-hub-worksheet.html',
       '📝 ใบงานคลังข้อมูลและกราฟ ป.4–ป.5',
       'ใบงาน A4 คู่คลังข้อมูล ฝึกตาราง แผนภูมิแท่ง และแผนภาพรูปภาพ',
       '/games/math/math-data-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ข้อมูล','พิมพ์ได้']::text[], 172),
      ('/games/english/english-grammar-p45-hub/index.html', '/games/english/english-grammar-p45-hub-worksheet.html',
       '📝 ใบงานคลัง English ป.4–ป.5',
       'ใบงาน A4 คู่ English Hub ฝึก Grammar · Sight Words · Follow Instructions',
       '/games/english/english-grammar-p45-hub/cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','อังกฤษ','พิมพ์ได้']::text[], 173),
      ('/games/science/science-p45-hub/index.html', '/games/science/science-p45-hub-worksheet.html',
       '📝 ใบงานคลังวิทย์ ป.4–ป.5',
       'ใบงาน A4 คู่ Science Hub ฝึกสสาร วัฏจักรน้ำ สัตว์ และร่างกาย',
       '/games/science/science-p45-hub/cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','วิทย์','พิมพ์ได้']::text[], 174),
      ('/games/thai/thai-vocab-hub/index.html', '/games/thai/thai-vocab-hub-worksheet.html',
       '📝 ใบงานคลังคำศัพท์ไทย ป.4–ป.6',
       'ใบงาน A4 คู่คลังคำศัพท์ ฝึกความหมาย คำพ้อง/ตรงข้าม และแต่งประโยค',
       '/games/thai/thai-vocab-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','hub','คำศัพท์','พิมพ์ได้']::text[], 175)
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
  ('/games/english/grammar-mini-worksheet.html', 'ต 2.1 ป.4/1'),
  ('/games/math/math-data-hub-worksheet.html', 'ค 3.1 ป.4/1'),
  ('/games/english/english-grammar-p45-hub-worksheet.html', 'ต 2.1 ป.4/1'),
  ('/games/english/english-grammar-p45-hub-worksheet.html', 'ต 1.1 ป.4/1'),
  ('/games/english/english-grammar-p45-hub-worksheet.html', 'ต 1.1 ป.4/2'),
  ('/games/science/science-p45-hub-worksheet.html', 'ว 2.1 ป.4/3'),
  ('/games/science/science-p45-hub-worksheet.html', 'ว 3.2 ป.5/3'),
  ('/games/science/science-p45-hub-worksheet.html', 'ว 1.3 ป.4/3'),
  ('/games/thai/thai-vocab-hub-worksheet.html', 'ท 4.1 ป.4/1'),
  ('/games/thai/thai-vocab-hub-worksheet.html', 'ท 4.1 ป.4/6')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

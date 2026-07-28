-- 424: ลงทะเบียนใบงานคู่ hub คณิต ชุดที่ 10 (ทศนิยม · เศษส่วน · เรขาคณิต)
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
      ('/games/math/math-decimal-hub/index.html', '/games/math/math-decimal-hub-worksheet.html',
       '📝 ใบงานคลังทศนิยม ป.4–ป.5',
       'ใบงาน A4 คู่คลังทศนิยม อ่านค่า เปรียบเทียบ บวกลบ และเงินบาท/สตางค์',
       '/games/math/math-decimal-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ทศนิยม','พิมพ์ได้']::text[], 163),
      ('/games/math/math-fraction-hub/index.html', '/games/math/math-fraction-hub-worksheet.html',
       '📝 ใบงานคลังเศษส่วน ป.4',
       'ใบงาน A4 คู่คลังเศษส่วน แท่งเทียบ บวกลบตัวส่วนเท่า และจำนวนคละ',
       '/games/math/math-fraction-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4']::text[],
       ARRAY['ใบงาน','hub','เศษส่วน','พิมพ์ได้']::text[], 164),
      ('/games/math/math-geometry-hub/index.html', '/games/math/math-geometry-hub-worksheet.html',
       '📝 ใบงานคลังเรขาคณิต ป.4–ป.5',
       'ใบงาน A4 คู่คลังเรขาคณิต มุม เส้นรอบรูป พื้นที่ และรูปเรขา 2D',
       '/games/math/math-geometry-hub/cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','เรขาคณิต','พิมพ์ได้']::text[], 165)
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
  ('/games/math/math-decimal-hub-worksheet.html', 'ค 1.1 ป.4/5'),
  ('/games/math/math-decimal-hub-worksheet.html', 'ค 1.1 ป.4/6'),
  ('/games/math/math-fraction-hub-worksheet.html', 'ค 1.1 ป.4/13'),
  ('/games/math/math-fraction-hub-worksheet.html', 'ค 1.1 ป.4/14'),
  ('/games/math/math-geometry-hub-worksheet.html', 'ค 2.2 ป.4/1'),
  ('/games/math/math-geometry-hub-worksheet.html', 'ค 2.2 ป.4/2')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

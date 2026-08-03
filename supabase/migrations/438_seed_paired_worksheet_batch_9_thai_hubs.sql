-- 423: ลงทะเบียนใบงานคู่ hub ไทย ชุดที่ 9 (5 hub) และเชื่อมตัวชี้วัด
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
      ('/games/thai/thai-script-hub/index.html', '/games/thai/thai-script-hub-worksheet.html',
       '📝 ใบงานคลังอักษรไทย ป.1–ป.4',
       'ใบงาน A4 คู่คลังอักษรไทย ฝึกตามตัวชี้วัดพร้อม scaffold การคิด',
       '/games/thai/thai-script-hub/cover.png', 'ภาษาไทย', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
       ARRAY['ใบงาน','hub','ภาษาไทย','พิมพ์ได้']::text[], 158),
      ('/games/thai/thai-grammar-hub/index.html', '/games/thai/thai-grammar-hub-worksheet.html',
       '📝 ใบงานคลังไวยากรณ์ไทย ป.4–ป.5',
       'ใบงาน A4 คู่คลังไวยากรณ์ไทย ฝึกตามตัวชี้วัดพร้อม scaffold การคิด',
       '/games/thai/thai-grammar-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ภาษาไทย','พิมพ์ได้']::text[], 159),
      ('/games/thai/thai-idiom-hub/index.html', '/games/thai/thai-idiom-hub-worksheet.html',
       '📝 ใบงานคลังสำนวนไทย ป.4–ป.6',
       'ใบงาน A4 คู่คลังสำนวนไทย ฝึกตามตัวชี้วัดพร้อม scaffold การคิด',
       '/games/thai/thai-idiom-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','hub','ภาษาไทย','พิมพ์ได้']::text[], 160),
      ('/games/thai/thai-punctuation-hub/index.html', '/games/thai/thai-punctuation-hub-worksheet.html',
       '📝 ใบงานเครื่องหมายวรรคตอน ป.3–ป.5',
       'ใบงาน A4 คู่เครื่องหมายวรรคตอน ฝึกตามตัวชี้วัดพร้อม scaffold การคิด',
       '/games/thai/thai-punctuation-hub/cover.png', 'ภาษาไทย', ARRAY['ป.3','ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ภาษาไทย','พิมพ์ได้']::text[], 161),
      ('/games/thai/thai-sentence-hub/index.html', '/games/thai/thai-sentence-hub-worksheet.html',
       '📝 ใบงานคลังประโยคไทย ป.3–ป.5',
       'ใบงาน A4 คู่คลังประโยคไทย ฝึกตามตัวชี้วัดพร้อม scaffold การคิด',
       '/games/thai/thai-sentence-hub/cover.png', 'ภาษาไทย', ARRAY['ป.3','ป.4','ป.5']::text[],
       ARRAY['ใบงาน','hub','ภาษาไทย','พิมพ์ได้']::text[], 162)
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
  ('/games/thai/thai-script-hub-worksheet.html', 'ท 4.1 ป.1/1'),
  ('/games/thai/thai-script-hub-worksheet.html', 'ท 4.1 ป.2/1'),
  ('/games/thai/thai-script-hub-worksheet.html', 'ท 4.1 ป.4/1'),
  ('/games/thai/thai-grammar-hub-worksheet.html', 'ท 4.1 ป.4/2'),
  ('/games/thai/thai-grammar-hub-worksheet.html', 'ท 4.1 ป.4/6'),
  ('/games/thai/thai-grammar-hub-worksheet.html', 'ท 4.1 ป.5/2'),
  ('/games/thai/thai-idiom-hub-worksheet.html', 'ท 1.1 ป.4/2'),
  ('/games/thai/thai-idiom-hub-worksheet.html', 'ท 1.1 ป.5/2'),
  ('/games/thai/thai-punctuation-hub-worksheet.html', 'ท 2.1 ป.3/1'),
  ('/games/thai/thai-punctuation-hub-worksheet.html', 'ท 2.1 ป.4/1'),
  ('/games/thai/thai-sentence-hub-worksheet.html', 'ท 4.1 ป.3/4'),
  ('/games/thai/thai-sentence-hub-worksheet.html', 'ท 4.1 ป.5/2')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

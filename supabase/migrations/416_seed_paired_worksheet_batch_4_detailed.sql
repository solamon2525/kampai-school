-- 416: ลงทะเบียนใบงานคู่สื่อชุดละเอียด batch 4 (5 เรื่อง ตาม WORKSHEET.md §8)
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
      ('/games/social/good-citizen-media.html', '/games/social/good-citizen-worksheet.html',
       '📝 ใบงานพลเมืองดี ป.4–6',
       'ใบงาน A4 คู่สื่อพลเมืองดี สถานการณ์จริงจากสื่อ ฝึกเลือกพฤติกรรม ลงเหตุผล 3 ขั้น และเชื่อมคุณลักษณะพลเมืองดี',
       '/games/social/good-citizen-media-cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','พลเมืองดี','จริยธรรม','พิมพ์ได้']::text[], 140),
      ('/games/science/digestive-system-media.html', '/games/science/digestive-worksheet.html',
       '📝 ใบงานระบบย่อยอาหาร ป.4–6',
       'ใบงาน A4 คู่สื่อระบบย่อยอาหาร เรียงทางเดินอาหาร อธิบายหน้าที่ เปรียบเทียบอวัยวะ และดูแลสุขภาพ',
       '/games/science/digestive-system-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ระบบย่อย','วิทยาศาสตร์','พิมพ์ได้']::text[], 141),
      ('/games/thai/thai-implied-meaning-media.html', '/games/thai/implied-meaning-worksheet.html',
       '📝 ใบงานความหมายตรงตัวและโดยนัย ป.4–6',
       'ใบงาน A4 คู่สื่อความหมายโดยนัย จำแนก ตีความสำนวน หาหลักฐานจากบริบท และสร้างประโยค',
       '/games/thai/thai-implied-meaning-media-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','โดยนัย','การอ่าน','พิมพ์ได้']::text[], 142),
      ('/games/thai/thai-narration-style-media.html', '/games/thai/narration-style-worksheet.html',
       '📝 ใบงานการบรรยายและการพรรณนา ป.4–6',
       'ใบงาน A4 คู่สื่อบรรยาย–พรรณนา จำแนกข้อความ หาคำสัญญาณ เขียนใหม่ และแต่งข้อความสั้น',
       '/games/thai/thai-narration-style-media-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','บรรยาย','พรรณนา','พิมพ์ได้']::text[], 143),
      ('/games/math/math-24-thinking-media.html', '/games/math/math-24-worksheet.html',
       '📝 ใบงานเกม 24 วิธีคิดทีละขั้น ป.4–6',
       'ใบงาน A4 คู่สื่อเกม 24 วางแผน คำนวณทีละขั้น ตรวจเงื่อนไขใช้เลข 4 ตัวครบ และกลยุทธ์หา 24',
       '/games/math/math-24-thinking-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','เกม24','คิดเลข','พิมพ์ได้']::text[], 144)
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
  ('/games/social/good-citizen-worksheet.html', 'ส 2.1 ป.4/1'),
  ('/games/social/good-citizen-worksheet.html', 'ส 2.1 ป.4/2'),
  ('/games/science/digestive-worksheet.html', 'ว 1.2 ป.6/4'),
  ('/games/science/digestive-worksheet.html', 'ว 1.2 ป.6/5'),
  ('/games/science/digestive-worksheet.html', 'พ 1.1 ป.5/1'),
  ('/games/thai/implied-meaning-worksheet.html', 'ท 1.1 ป.5/5'),
  ('/games/thai/narration-style-worksheet.html', 'ท 1.1 ป.5/4'),
  ('/games/math/math-24-worksheet.html', 'ค 1.1 ป.4/10'),
  ('/games/math/math-24-worksheet.html', 'ค 1.1 ป.4/12')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
  AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

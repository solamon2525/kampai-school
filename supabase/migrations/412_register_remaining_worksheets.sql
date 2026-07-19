-- 412: ลงทะเบียนใบงานที่มีไฟล์แต่ยังไม่ปรากฏในคลัง และซ่อมตัวชี้วัดใบงานพื้นที่
DO $$
DECLARE
  v_category_id uuid;
  v_spec record;
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'category worksheets not found';
  END IF;

  FOR v_spec IN
    SELECT * FROM (VALUES
      ('/games/math/multiplication-thinking-media.html', '/games/math/multiplication-worksheet.html',
       '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6', 'ฝึกตั้งคูณให้ตรงหลัก พร้อมช่องทด ผลคูณย่อย และเฉลยครู',
       '/games/math/multiplication-thinking-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[], 115),
      ('/games/math/long-division-thinking-media.html', '/games/math/division-worksheet.html',
       '📝 ใบงานการหารยาว ป.4–ป.6', 'ฝึกหารยาว 5 ข้อต่อหน้า วางผลหาร ผลคูณ ผลลบ และเลขดึงลงตามค่าประจำหลักจริง',
       '/games/math/long-division-thinking-media-cover.png', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[], 116),
      ('/games/thai/thai-vocab-hub/index.html', '/games/thai/vocab-grammar-worksheet.html',
       '📝 ใบงานหลักภาษาและคำศัพท์ไทย', 'ฝึกมาตราตัวสะกด ลักษณนาม และคำพ้อง พร้อมเฉลยครู',
       '/games/thai/thai-vocab-hub/cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[], 117),
      ('/games/english/english-grammar-p45-hub/index.html', '/games/english/grammar-vocab-worksheet.html',
       '📝 English Grammar & Vocabulary Worksheet', 'ฝึกคำกริยา คำศัพท์ และคำตรงข้าม พร้อมเฉลยครู',
       '/games/english/english-grammar-p45-hub/cover.png', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[], 118),
      ('/games/science/science-p45-hub/index.html', '/games/science/science-explorer-worksheet.html',
       '📝 ใบงานวิทยาศาสตร์สำรวจธรรมชาติ', 'ฝึกหน้าที่ส่วนต่าง ๆ ของพืช สถานะของสสาร และระบบสุริยะ พร้อมเฉลยครู',
       '/games/science/science-p45-hub/cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5']::text[], 119),
      ('/games/tech/code-craft/index.html', '/games/tech/coding-social-worksheet.html',
       '📝 ใบงานวิทยาการคำนวณและพลเมืองดิจิทัล', 'ฝึกอัลกอริทึม เหตุผลเชิงตรรกะ และการใช้เทคโนโลยีอย่างปลอดภัย',
       '/games/tech/code-craft/cover.png', 'เทคโนโลยี', ARRAY['ป.4','ป.5','ป.6']::text[], 120)
    ) AS specs(source_url, worksheet_url, title, description, thumbnail_url, subject, grade_levels, sort_order)
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
    SELECT
      v_owner_id, v_category_id, 'link', v_spec.title, v_spec.description, v_spec.worksheet_url,
      v_spec.thumbnail_url, v_spec.subject, v_spec.grade_levels,
      ARRAY['ใบงาน','พิมพ์ได้','PDF'], v_spec.sort_order, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE owner_staff_id = v_owner_id AND external_url = v_spec.worksheet_url
    );

    UPDATE public.educational_hub_items
    SET category_id = v_category_id,
        title = v_spec.title,
        description = v_spec.description,
        thumbnail_url = v_spec.thumbnail_url,
        subject = v_spec.subject,
        grade_levels = v_spec.grade_levels,
        tags = ARRAY['ใบงาน','พิมพ์ได้','PDF'],
        sort_order = v_spec.sort_order,
        tracked_game = false,
        is_published = true,
        updated_at = now()
    WHERE owner_staff_id = v_owner_id AND external_url = v_spec.worksheet_url;
  END LOOP;
END $$;

DELETE FROM public.indicator_games ig
USING public.educational_hub_items item
WHERE ig.edu_hub_item_id = item.id
  AND item.external_url IN (
    '/games/math/multiplication-worksheet.html',
    '/games/math/division-worksheet.html',
    '/games/math/rect-area-worksheet.html',
    '/games/thai/vocab-grammar-worksheet.html',
    '/games/english/grammar-vocab-worksheet.html',
    '/games/science/science-explorer-worksheet.html',
    '/games/tech/coding-social-worksheet.html'
  );

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT item.id, indicator.id
FROM (VALUES
  ('/games/math/multiplication-worksheet.html', 'ค 1.1 ป.4/9'),
  ('/games/math/multiplication-worksheet.html', 'ค 1.1 ป.5/6'),
  ('/games/math/division-worksheet.html', 'ค 1.1 ป.4/9'),
  ('/games/math/rect-area-worksheet.html', 'ค 2.1 ป.4/3'),
  ('/games/math/rect-area-worksheet.html', 'ค 2.1 ป.5/4'),
  ('/games/thai/vocab-grammar-worksheet.html', 'ท 4.1 ป.4/1'),
  ('/games/english/grammar-vocab-worksheet.html', 'ต 2.2 ป.5/1'),
  ('/games/english/grammar-vocab-worksheet.html', 'ต 3.1 ป.5/1'),
  ('/games/science/science-explorer-worksheet.html', 'ว 1.2 ป.4/1'),
  ('/games/science/science-explorer-worksheet.html', 'ว 2.1 ป.4/3'),
  ('/games/science/science-explorer-worksheet.html', 'ว 3.1 ป.4/3'),
  ('/games/tech/coding-social-worksheet.html', 'ว 4.2 ป.4/1'),
  ('/games/tech/coding-social-worksheet.html', 'ว 4.2 ป.4/2'),
  ('/games/tech/coding-social-worksheet.html', 'ว 4.2 ป.4/5')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items item
  ON item.external_url = mapping.worksheet_url
 AND item.is_published = true
 AND item.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
 AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

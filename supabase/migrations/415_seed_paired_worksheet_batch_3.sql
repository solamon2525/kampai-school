-- 415: ลงทะเบียนใบงานคู่สื่อ ชุดที่ 3 (10 สื่อ ป.4–6) และเชื่อมตัวชี้วัด
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
      ('/games/science/plant-parts-media.html', '/games/science/plant-parts-worksheet.html',
       '📝 ใบงานส่วนต่าง ๆ ของพืช ป.4–6',
       'ใบงาน A4 คู่สื่อส่วนพืชดอก ฝึกระบุส่วน อธิบายหน้าที่ และเชื่อมกับชีวิตประจำวัน',
       '/games/science/plant-parts-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','พืช','วิทยาศาสตร์','พิมพ์ได้']::text[], 130),
      ('/games/science/food-chain-media.html', '/games/science/food-chain-worksheet.html',
       '📝 ใบงานห่วงโซ่อาหาร ป.4–6',
       'ใบงาน A4 คู่สื่อห่วงโซ่อาหาร ฝึกเรียงลำดับ ระบุบทบาท และวิเคราะห์ผลกระทบ',
       '/games/science/food-chain-media-cover.png', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ห่วงโซ่อาหาร','ระบบนิเวศ','พิมพ์ได้']::text[], 131),
      ('/games/health/food-groups-media.html', '/games/health/food-groups-worksheet.html',
       '📝 ใบงานอาหารหลัก 5 หมู่ ป.4–6',
       'ใบงาน A4 คู่สื่ออาหาร 5 หมู่ ฝึกจัดหมู่ อธิบายประโยชน์ และจัดจานสมดุล',
       '/games/health/food-groups-media-cover.png', 'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','อาหาร','สุขภาพ','พิมพ์ได้']::text[], 132),
      ('/games/arts/color-wheel-media.html', '/games/arts/color-wheel-worksheet.html',
       '📝 ใบงานวงล้อสี ป.4–6',
       'ใบงาน A4 คู่สื่อวงล้อสี ฝึกแม่สี ผสมสี และเลือกวรรณะให้เหมาะกับอารมณ์ภาพ',
       '/games/arts/color-wheel-media-cover.png', 'ศิลปะ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','สี','ศิลปะ','พิมพ์ได้']::text[], 133),
      ('/games/career/community-jobs-media.html', '/games/career/community-jobs-worksheet.html',
       '📝 ใบงานอาชีพในชุมชน ป.4–6',
       'ใบงาน A4 คู่สื่ออาชีพในชุมชน ฝึกระบุอาชีพ อธิบายบทบาท และสำรวจความสนใจ',
       '/games/career/community-jobs-media-cover.png', 'การงานอาชีพ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','อาชีพ','ชุมชน','พิมพ์ได้']::text[], 134),
      ('/games/social/sufficiency-media.html', '/games/social/sufficiency-worksheet.html',
       '📝 ใบงานเศรษฐกิจพอเพียง ป.4–6',
       'ใบงาน A4 คู่สื่อเศรษฐกิจพอเพียง ฝึกอธิบาย 3 ห่วง 2 เงื่อนไข และใช้ในชีวิต',
       '/games/social/sufficiency-media-cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','พอเพียง','สังคม','พิมพ์ได้']::text[], 135),
      ('/games/thai/dictionary-media.html', '/games/thai/dictionary-worksheet.html',
       '📝 ใบงานใช้พจนานุกรม ป.4–6',
       'ใบงาน A4 คู่สื่อพจนานุกรม ฝึกเรียงคำ หาความหมาย และใช้ในประโยค',
       '/games/thai/dictionary-media-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','พจนานุกรม','คำศัพท์','พิมพ์ได้']::text[], 136),
      ('/games/thai/sentence-structure.html', '/games/thai/sentence-structure-worksheet.html',
       '📝 ใบงานโครงสร้างประโยค ป.4–6',
       'ใบงาน A4 คู่สื่อโครงสร้างประโยค ฝึกแยกประธาน–กริยา–กรรม ขยายและแก้ประโยค',
       '/games/thai/sentence-structure-cover.png', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ประโยค','ไวยากรณ์','พิมพ์ได้']::text[], 137),
      ('/games/career/waste-sort-media.html', '/games/career/waste-sort-worksheet.html',
       '📝 ใบงานแยกขยะ ป.4–6',
       'ใบงาน A4 คู่สื่อแยกขยะ ฝึกจำแนกประเภท อธิบายเหตุผล และแนวปฏิบัติในโรงเรียน',
       '/games/career/waste-sort-media-cover.png', 'การงานอาชีพ', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','แยกขยะ','สิ่งแวดล้อม','พิมพ์ได้']::text[], 138),
      ('/games/social/thailand-map.html', '/games/social/thailand-map-worksheet.html',
       '📝 ใบงานแผนที่ประเทศไทย ป.4–6',
       'ใบงาน A4 คู่สื่อแผนที่ไทย ฝึกระบุภาค อ่านทิศ และใช้สัญลักษณ์แผนที่',
       '/games/social/thailand-map-cover.png', 'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','แผนที่','ภูมิศาสตร์','พิมพ์ได้']::text[], 139)
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
  ('/games/science/plant-parts-worksheet.html', 'ว 1.2 ป.4/1'),
  ('/games/science/food-chain-worksheet.html', 'ว 1.1 ป.5/2'),
  ('/games/science/food-chain-worksheet.html', 'ว 1.1 ป.5/3'),
  ('/games/health/food-groups-worksheet.html', 'พ 4.1 ป.3/2'),
  ('/games/health/food-groups-worksheet.html', 'พ 4.1 ป.3/3'),
  ('/games/arts/color-wheel-worksheet.html', 'ศ 1.1 ป.4/2'),
  ('/games/arts/color-wheel-worksheet.html', 'ศ 1.1 ป.4/7'),
  ('/games/career/community-jobs-worksheet.html', 'ง 2.1 ป.4/1'),
  ('/games/social/sufficiency-worksheet.html', 'ส 3.1 ป.4/3'),
  ('/games/thai/dictionary-worksheet.html', 'ท 4.1 ป.3/3'),
  ('/games/thai/dictionary-worksheet.html', 'ท 4.1 ป.4/3'),
  ('/games/thai/sentence-structure-worksheet.html', 'ท 4.1 ป.3/4'),
  ('/games/thai/sentence-structure-worksheet.html', 'ท 4.1 ป.5/2'),
  ('/games/career/waste-sort-worksheet.html', 'ง 1.1 ป.3/3'),
  ('/games/career/waste-sort-worksheet.html', 'ง 1.1 ป.4/4'),
  ('/games/social/thailand-map-worksheet.html', 'ส 5.1 ป.4/1'),
  ('/games/social/thailand-map-worksheet.html', 'ส 5.1 ป.4/2')
) AS mapping(worksheet_url, indicator_code)
JOIN public.educational_hub_items worksheet
  ON worksheet.external_url = mapping.worksheet_url
  AND worksheet.is_published = true
  AND worksheet.tracked_game = false
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
  AND indicator.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

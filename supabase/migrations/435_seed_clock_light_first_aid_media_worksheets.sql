-- 435: dual-track media + worksheet for clock / light-sort / first-aid (curriculum-gap games)

DO $$
DECLARE
  v_staff_id uuid;
  v_cat_media uuid;
  v_cat_ws uuid;
BEGIN
  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media' LIMIT 1;
  SELECT id INTO v_cat_ws FROM public.educational_hub_categories WHERE category_key = 'worksheets' LIMIT 1;

  SELECT owner_staff_id INTO v_staff_id
  FROM public.educational_hub_items
  WHERE external_url LIKE '/games/%' AND is_published = true
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE NOTICE '435: skip seeds (no staff)';
    RETURN;
  END IF;

  IF v_cat_media IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'อ่านนาฬิกาเข็ม — สอนและฝึกสั้น',
      'เข็มสั้น/ยาว · ครึ่งชั่วโมง · เศษสี่ + MCQ',
      '/games/math/clock-media.html',
      'คณิตศาสตร์', ARRAY['ป.2','ป.3','ป.4']::text[],
      ARRAY['math','clock','media','practice']::text[],
      80, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/math/clock-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'แสงผ่านวัสดุ — สอนและฝึกสั้น',
      'ทึบแสง · โปร่งแสง · โปร่งใส + MCQ',
      '/games/science/light-sort-media.html',
      'วิทยาศาสตร์', ARRAY['ป.4','ป.5']::text[],
      ARRAY['science','light','media','practice']::text[],
      81, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/science/light-sort-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'ปฐมพยาบาลเบื้องต้น — สอนและฝึกสั้น',
      'RICE · กดห้ามเลือด · น้ำเย็นแผลไหม้ · เรียกผู้ใหญ่ + MCQ',
      '/games/health/first-aid-media.html',
      'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['health','first-aid','media','practice']::text[],
      82, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/health/first-aid-media.html'
    );
  END IF;

  IF v_cat_ws IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานอ่านนาฬิกาเข็ม',
      'คู่สื่อ clock-media · อ่านเวลาและเวลาผ่านไป',
      '/games/math/clock-worksheet.html',
      'คณิตศาสตร์', ARRAY['ป.2','ป.3','ป.4']::text[],
      ARRAY['math','worksheet','clock']::text[],
      83, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/math/clock-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานแสงผ่านวัสดุ',
      'คู่สื่อ light-sort-media · ทึบแสง โปร่งแสง โปร่งใส',
      '/games/science/light-sort-worksheet.html',
      'วิทยาศาสตร์', ARRAY['ป.4','ป.5']::text[],
      ARRAY['science','worksheet','light-sort']::text[],
      84, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/science/light-sort-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานปฐมพยาบาลเบื้องต้น',
      'คู่สื่อ first-aid-media · RICE และปฐมพยาบาลเบื้องต้น',
      '/games/health/first-aid-worksheet.html',
      'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['health','worksheet','first-aid']::text[],
      85, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/health/first-aid-worksheet.html'
    );
  END IF;
END $$;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/math/clock-media.html',
     'อ่านนาฬิกาเข็ม',
     ARRAY['เข็มสั้นชั่วโมง','เข็มยาวนาที','ครึ่งชั่วโมง','เศษสี่','ฝึกสั้น MCQ','คู่ clock-worksheet'],
     'v1.0.0',
     'Dual-track teaching media for clock-quest'),
    ('/games/science/light-sort-media.html',
     'แสงผ่านวัสดุ',
     ARRAY['ทึบแสง','โปร่งแสง','โปร่งใส','ตัวอย่างวัสดุ','ฝึกสั้น MCQ','คู่ light-sort-worksheet'],
     'v1.0.0',
     'Dual-track teaching media for light-sort'),
    ('/games/health/first-aid-media.html',
     'ปฐมพยาบาลเบื้องต้น',
     ARRAY['RICE','กดห้ามเลือด','น้ำเย็นแผลไหม้','เรียกผู้ใหญ่','ฝึกสั้น MCQ','คู่ first-aid-worksheet'],
     'v1.0.0',
     'Dual-track teaching media for first-aid-rush'),
    ('/games/math/clock-worksheet.html',
     'ใบงานอ่านนาฬิกาเข็ม',
     ARRAY['worksheet','scaffold','คู่ clock-media'],
     'v1.0.0',
     'Dual-track worksheet'),
    ('/games/science/light-sort-worksheet.html',
     'ใบงานแสงผ่านวัสดุ',
     ARRAY['worksheet','scaffold','คู่ light-sort-media'],
     'v1.0.0',
     'Dual-track worksheet'),
    ('/games/health/first-aid-worksheet.html',
     'ใบงานปฐมพยาบาลเบื้องต้น',
     ARRAY['worksheet','scaffold','คู่ first-aid-media'],
     'v1.0.0',
     'Dual-track worksheet')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

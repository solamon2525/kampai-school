-- 429: Phase 7C — thin subjects media normalize + seed coding-social / color-mix

UPDATE public.educational_hub_items AS ehi
SET external_url = m.new_url,
    updated_at = now()
FROM (
  VALUES
    ('/games/social/thailand-map.html', '/games/social/thailand-map-media.html'),
    ('/games/social/sukhothai-timeline.html', '/games/social/sukhothai-timeline-media.html'),
    ('/games/science/water-cycle.html', '/games/science/water-cycle-media.html')
) AS m(old_url, new_url)
WHERE ehi.external_url = m.old_url;

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
    RAISE NOTICE '429: skip seeds (no staff)';
    RETURN;
  END IF;

  IF v_cat_media IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'วิทยาการคำนวณ & สังคมออนไลน์',
      'สื่อสอนขั้นตอน สัญลักษณ์ ความปลอดภัย + ฝึกสั้น MCQ',
      '/games/tech/coding-social-media.html',
      'เทคโนโลยี', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['tech','coding','media','practice']::text[],
      60, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/tech/coding-social-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'ผสมสีแม่สี — สอนและฝึกสั้น',
      'แม่สี / สีทุติยภูมิ / วรรณะ + MCQ (ไม่ใช่เกมแข่งคะแนน)',
      '/games/arts/color-mix-media.html',
      'ศิลปะ', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['arts','color','media','practice']::text[],
      61, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/arts/color-mix-media.html'
    );
  END IF;

  IF v_cat_ws IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานผสมสีแม่สี',
      'คู่สื่อ color-mix-media · แม่สีและสูตรผสม',
      '/games/arts/color-mix-worksheet.html',
      'ศิลปะ', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['arts','worksheet','color-mix']::text[],
      62, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/arts/color-mix-worksheet.html'
    );
  END IF;
END $$;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/tech/coding-social-media.html',
     'วิทยาการคำนวณ & สังคมออนไลน์',
     ARRAY['สอนขั้นตอน','สัญลักษณ์ผังงาน','ความปลอดภัย','มารยาทออนไลน์','ฝึกสั้น MCQ'],
     'v1.0.0',
     'Phase 7C dual-track media for coding-social worksheet'),
    ('/games/social/thailand-map-media.html',
     'แผนที่ประเทศไทย',
     ARRAY['อ่านแผนที่','ภูมิภาค','normalize *-media','คู่ thailand-map-worksheet'],
     'v1.2.0',
     'Phase 7C dual-track rename'),
    ('/games/social/sukhothai-timeline-media.html',
     'เส้นเวลาสุโขทัย',
     ARRAY['เส้นเวลา','เหตุการณ์','normalize *-media','คู่ sukhothai-timeline-worksheet'],
     'v1.2.0',
     'Phase 7C dual-track rename'),
    ('/games/science/water-cycle-media.html',
     'วัฏจักรน้ำ',
     ARRAY['ขั้นตอนวัฏจักร','normalize *-media','คู่ water-cycle-worksheet'],
     'v1.2.0',
     'Phase 7C dual-track rename'),
    ('/games/arts/color-mix-media.html',
     'ผสมสีแม่สี',
     ARRAY['แม่สี','สีทุติยภูมิ','วรรณะ','ฝึกสั้น MCQ','คู่ color-mix-worksheet'],
     'v1.0.0',
     'Phase 7C teaching media (separate from scored color-mix game)')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

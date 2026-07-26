-- 432: Phase 8C — content fill: 5 dual-track media + worksheet pairs

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
    RAISE NOTICE '432: skip seeds (no staff)';
    RETURN;
  END IF;

  IF v_cat_media IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'ความปลอดภัยออนไลน์ — สอนและฝึกสั้น',
      'รหัสผ่าน · ไม่แชร์ข้อมูล · ระวังลิงก์ · ขออนุญาตผู้ใหญ่ + MCQ',
      '/games/tech/online-safety-media.html',
      'เทคโนโลยี', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['tech','online-safety','media','practice']::text[],
      70, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/tech/online-safety-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'ความสมมาตร — สอนและฝึกสั้น',
      'แกนสมมาตร · รูปสมมาตร + MCQ (ไม่ใช่เกมแข่งคะแนน)',
      '/games/arts/symmetry-media.html',
      'ศิลปะ', ARRAY['ป.1','ป.2','ป.3']::text[],
      ARRAY['arts','symmetry','media','practice']::text[],
      71, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/arts/symmetry-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'ออกกำลังกายและดูแลบาดเจ็บ — สอนและฝึกสั้น',
      'อบอุ่นร่างกาย · พักผ่อน · RICE เบื้องต้น + MCQ',
      '/games/health/exercise-care-media.html',
      'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['health','exercise','rice','media','practice']::text[],
      72, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/health/exercise-care-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'Past Tense Mini — สอนและฝึกสั้น',
      'was/were · regular -ed · went/saw/ate + MCQ',
      '/games/english/past-tense-mini-media.html',
      'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['english','past-tense','media','practice']::text[],
      73, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/english/past-tense-mini-media.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_media, 'link',
      'เงินทอน — สอนและฝึกสั้น',
      'บาท · สูตรเงินทอน · โจทย์ซื้อของ + MCQ',
      '/games/math/money-change-media.html',
      'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3']::text[],
      ARRAY['math','money','media','practice']::text[],
      74, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/math/money-change-media.html'
    );
  END IF;

  IF v_cat_ws IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานความปลอดภัยออนไลน์',
      'คู่สื่อ online-safety-media · รหัสผ่านและมารยาทออนไลน์',
      '/games/tech/online-safety-worksheet.html',
      'เทคโนโลยี', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['tech','worksheet','online-safety']::text[],
      75, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/tech/online-safety-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานความสมมาตร',
      'คู่สื่อ symmetry-media · แกนสมมาตรและรูปสมมาตร',
      '/games/arts/symmetry-worksheet.html',
      'ศิลปะ', ARRAY['ป.1','ป.2','ป.3']::text[],
      ARRAY['arts','worksheet','symmetry']::text[],
      76, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/arts/symmetry-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานออกกำลังกายและดูแลบาดเจ็บ',
      'คู่สื่อ exercise-care-media · อบอุ่นร่างกายและ RICE',
      '/games/health/exercise-care-worksheet.html',
      'สุขศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['health','worksheet','exercise-care']::text[],
      77, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/health/exercise-care-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงาน Past Tense Mini',
      'คู่สื่อ past-tense-mini-media · was/were · -ed · irregular',
      '/games/english/past-tense-mini-worksheet.html',
      'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
      ARRAY['english','worksheet','past-tense-mini']::text[],
      78, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/english/past-tense-mini-worksheet.html'
    );

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT v_staff_id, v_cat_ws, 'link',
      'ใบงานเงินทอน',
      'คู่สื่อ money-change-media · บาทและการทอนเงิน',
      '/games/math/money-change-worksheet.html',
      'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3']::text[],
      ARRAY['math','worksheet','money-change']::text[],
      79, false, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = '/games/math/money-change-worksheet.html'
    );
  END IF;
END $$;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/tech/online-safety-media.html',
     'ความปลอดภัยออนไลน์',
     ARRAY['สอนรหัสผ่าน','ไม่แชร์ข้อมูล','ระวังลิงก์','ขออนุญาตผู้ใหญ่','ฝึกสั้น MCQ','คู่ online-safety-worksheet'],
     'v1.0.0',
     'Phase 8C teaching media (separate from scored online-safety game)'),
    ('/games/arts/symmetry-media.html',
     'ความสมมาตร',
     ARRAY['แกนสมมาตร','รูปสมมาตร','ฝึกสั้น MCQ','คู่ symmetry-worksheet'],
     'v1.0.0',
     'Phase 8C teaching media (separate from symmetry-art)'),
    ('/games/health/exercise-care-media.html',
     'ออกกำลังกายและดูแลบาดเจ็บ',
     ARRAY['อบอุ่นร่างกาย','พักผ่อน','RICE เบื้องต้น','ฝึกสั้น MCQ','คู่ exercise-care-worksheet'],
     'v1.0.0',
     'Phase 8C dual-track health media'),
    ('/games/english/past-tense-mini-media.html',
     'Past Tense Mini',
     ARRAY['was/were','regular -ed','went/saw/ate','ฝึกสั้น MCQ','คู่ past-tense-mini-worksheet'],
     'v1.0.0',
     'Phase 8C dual-track English media'),
    ('/games/math/money-change-media.html',
     'เงินทอน',
     ARRAY['บาท','สูตรเงินทอน','โจทย์ซื้อของ','ฝึกสั้น MCQ','คู่ money-change-worksheet'],
     'v1.0.0',
     'Phase 8C dual-track math media'),
    ('/games/tech/online-safety-worksheet.html',
     'ใบงานความปลอดภัยออนไลน์',
     ARRAY['worksheet','scaffold','คู่ online-safety-media'],
     'v1.0.0',
     'Phase 8C worksheet'),
    ('/games/arts/symmetry-worksheet.html',
     'ใบงานความสมมาตร',
     ARRAY['worksheet','scaffold','คู่ symmetry-media'],
     'v1.0.0',
     'Phase 8C worksheet'),
    ('/games/health/exercise-care-worksheet.html',
     'ใบงานออกกำลังกายและดูแลบาดเจ็บ',
     ARRAY['worksheet','scaffold','คู่ exercise-care-media'],
     'v1.0.0',
     'Phase 8C worksheet'),
    ('/games/english/past-tense-mini-worksheet.html',
     'ใบงาน Past Tense Mini',
     ARRAY['worksheet','scaffold','คู่ past-tense-mini-media'],
     'v1.0.0',
     'Phase 8C worksheet'),
    ('/games/math/money-change-worksheet.html',
     'ใบงานเงินทอน',
     ARRAY['worksheet','scaffold','คู่ money-change-media'],
     'v1.0.0',
     'Phase 8C worksheet')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

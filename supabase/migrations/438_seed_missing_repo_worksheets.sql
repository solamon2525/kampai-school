-- 438: seed repo worksheet URLs missing from production hub (Phase 10 parity)
-- Idempotent: INSERT ... WHERE NOT EXISTS on external_url.
-- Extra old production rows (renamed paths) are left in place.

DO $$
DECLARE
  v_staff_id uuid;
  v_cat_ws uuid;
BEGIN
  SELECT id INTO v_cat_ws
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets'
  LIMIT 1;

  SELECT owner_staff_id INTO v_staff_id
  FROM public.educational_hub_items
  WHERE external_url LIKE '/games/%' AND is_published = true
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE NOTICE '438: skip seeds (no staff)';
    RETURN;
  END IF;

  IF v_cat_ws IS NULL THEN
    RAISE NOTICE '438: skip seeds (no worksheets category)';
    RETURN;
  END IF;

  -- english
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงาน Sight Words ป.4–6',
    'ใบงาน A4 คู่สื่อ Sight Words ฝึกอ่านจำ because, before, between, important ใช้ในประโยค',
    '/games/english/sight-words-worksheet.html',
    '/games/english/sight-words-p4-cover.png',
    'ภาษาอังกฤษ', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','sight words','ภาษาอังกฤษ','พิมพ์ได้']::text[],
    200, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/english/sight-words-worksheet.html'
  );

  -- math hubs + math-24
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานทศนิยม Hub ป.4–6',
    'ใบงาน A4 คู่สื่อทศนิยม Hub อ่านค่า เปรียบเทียบ ค่าประจำหลัก และบวกลบ',
    '/games/math/decimal-hub-worksheet.html',
    '/games/math/math-decimal-hub/cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ทศนิยม','hub','พิมพ์ได้']::text[],
    201, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/decimal-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานเศษส่วน Hub ป.4–6',
    'ใบงาน A4 คู่สื่อเศษส่วน Hub ความหมาย เปรียบเทียบ เศษส่วนเท่ากัน และบวกลบ',
    '/games/math/fraction-hub-worksheet.html',
    '/games/math/math-fraction-hub/cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','เศษส่วน','hub','พิมพ์ได้']::text[],
    202, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/fraction-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานเรขาคณิต Hub ป.4–6',
    'ใบงาน A4 คู่สื่อเรขาคณิต Hub รูปทรง มุม เส้นรอบ และพื้นที่',
    '/games/math/geometry-hub-worksheet.html',
    '/games/math/math-geometry-hub/cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','เรขาคณิต','hub','พิมพ์ได้']::text[],
    203, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/geometry-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานโจทย์ปัญหา Hub ป.4–6',
    'ใบงาน A4 คู่สื่อโจทย์ปัญหา Hub อ่านโจทย์ วางแผน คำนวณ และตรวจคำตอบ',
    '/games/math/word-problem-hub-worksheet.html',
    '/games/math/math-word-problem-hub/cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','โจทย์ปัญหา','hub','พิมพ์ได้']::text[],
    204, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/word-problem-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานเกม 24 วิธีคิดทีละขั้น ป.4–6',
    'ใบงาน A4 คู่สื่อเกม 24 วางแผน คำนวณทีละขั้น ตรวจเงื่อนไขใช้เลข 4 ตัวครบ และกลยุทธ์หา 24',
    '/games/math/math-24-worksheet.html',
    '/games/math/math-24-thinking-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','เกม24','คิดเลข','พิมพ์ได้']::text[],
    205, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/math/math-24-worksheet.html'
  );

  -- science
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานระบบย่อยอาหาร ป.4–6',
    'ใบงาน A4 คู่สื่อระบบย่อยอาหาร เรียงทางเดินอาหาร อธิบายหน้าที่ เปรียบเทียบอวัยวะ และดูแลสุขภาพ',
    '/games/science/digestive-worksheet.html',
    '/games/science/digestive-system-media-cover.png',
    'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ระบบย่อย','วิทยาศาสตร์','พิมพ์ได้']::text[],
    206, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/science/digestive-worksheet.html'
  );

  -- social
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานประเทศไทย Hub ป.4–6',
    'ใบงาน A4 คู่สื่อประเทศไทย Hub ภูมิภาค วัฒนธรรม ประวัติศาสตร์ และพลเมือง',
    '/games/social/thailand-hub-worksheet.html',
    '/games/social/social-thailand-hub/cover.png',
    'สังคมศึกษา', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ประเทศไทย','hub','พิมพ์ได้']::text[],
    207, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/social/thailand-hub-worksheet.html'
  );

  -- thai hubs + detailed
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานไวยากรณ์ไทย Hub ป.4–6',
    'ใบงาน A4 คู่สื่อไวยากรณ์ Hub ชนิดคำ ประโยค ลักษณนาม และแก้ประโยค',
    '/games/thai/grammar-hub-worksheet.html',
    '/games/thai/thai-grammar-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ไวยากรณ์','hub','พิมพ์ได้']::text[],
    208, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/grammar-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานสำนวนไทย Hub ป.4–6',
    'ใบงาน A4 คู่สื่อสำนวน Hub ความหมาย ใช้ในประโยค จับคู่ และสร้างประโยค',
    '/games/thai/idiom-hub-worksheet.html',
    '/games/thai/thai-idiom-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','สำนวน','hub','พิมพ์ได้']::text[],
    209, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/idiom-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานความหมายตรงตัวและโดยนัย ป.4–6',
    'ใบงาน A4 คู่สื่อความหมายโดยนัย จำแนก ตีความสำนวน หาหลักฐานจากบริบท และสร้างประโยค',
    '/games/thai/implied-meaning-worksheet.html',
    '/games/thai/thai-implied-meaning-media-cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','โดยนัย','การอ่าน','พิมพ์ได้']::text[],
    210, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/implied-meaning-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานวรรณคดี Hub ป.4–6',
    'ใบงาน A4 คู่สื่อวรรณคดี Hub ประเภท องค์ประกอบ วิเคราะห์ และสะท้อนข้อคิด',
    '/games/thai/literature-hub-worksheet.html',
    '/games/thai/thai-literature-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','วรรณคดี','hub','พิมพ์ได้']::text[],
    211, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/literature-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานการบรรยายและการพรรณนา ป.4–6',
    'ใบงาน A4 คู่สื่อบรรยาย–พรรณนา จำแนกข้อความ หาคำสัญญาณ เขียนใหม่ และแต่งข้อความสั้น',
    '/games/thai/narration-style-worksheet.html',
    '/games/thai/thai-narration-style-media-cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','บรรยาย','พรรณนา','พิมพ์ได้']::text[],
    212, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/narration-style-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานบทกวี Hub ป.4–6',
    'ใบงาน A4 คู่สื่อบทกวี Hub รูปแบบกลอน สัมผัส ความหมาย และแต่งกลอนสั้น',
    '/games/thai/poetry-hub-worksheet.html',
    '/games/thai/thai-poetry-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','บทกวี','hub','พิมพ์ได้']::text[],
    213, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/poetry-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานเครื่องหมายวรรคตอน Hub ป.4–6',
    'ใบงาน A4 คู่สื่อวรรคตอน Hub เครื่องหมาย แก้ไข ใช้ถูกต้อง และอ่านจังหวะ',
    '/games/thai/punctuation-hub-worksheet.html',
    '/games/thai/thai-punctuation-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','วรรคตอน','hub','พิมพ์ได้']::text[],
    214, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/punctuation-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานการอ่าน Hub ป.4–6',
    'ใบงาน A4 คู่สื่อการอ่าน Hub ใจความสำคัญ รายละเอียด อนุมาน และคำศัพท์',
    '/games/thai/reading-hub-worksheet.html',
    '/games/thai/thai-reading-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','การอ่าน','hub','พิมพ์ได้']::text[],
    215, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/reading-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานอักษรไทย Hub ป.1–4',
    'ใบงาน A4 คู่สื่ออักษรไทย Hub พยัญชนะ สระ วรรณยุกต์ และการสะกดคำ',
    '/games/thai/script-hub-worksheet.html',
    '/games/thai/thai-script-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],
    ARRAY['ใบงาน','อักษรไทย','hub','พิมพ์ได้']::text[],
    216, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/script-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานประโยคไทย Hub ป.4–6',
    'ใบงาน A4 คู่สื่อประโยค Hub ชนิดประโยค ส่วนประโยค ขยาย และรวมประโยค',
    '/games/thai/sentence-hub-worksheet.html',
    '/games/thai/thai-sentence-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ประโยค','hub','พิมพ์ได้']::text[],
    217, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/sentence-hub-worksheet.html'
  );

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT v_staff_id, v_cat_ws, 'link',
    '📝 ใบงานการเขียน Hub ป.4–6',
    'ใบงาน A4 คู่สื่อการเขียน Hub วางแผน ย่อหน้า แก้ไข และสำนวน',
    '/games/thai/writing-hub-worksheet.html',
    '/games/thai/thai-writing-hub/cover.png',
    'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','การเขียน','hub','พิมพ์ได้']::text[],
    218, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/thai/writing-hub-worksheet.html'
  );
END $$;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/english/sight-words-worksheet.html', 'ใบงาน Sight Words', ARRAY['worksheet','scaffold']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/math/decimal-hub-worksheet.html', 'ใบงานทศนิยม Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/math/fraction-hub-worksheet.html', 'ใบงานเศษส่วน Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/math/geometry-hub-worksheet.html', 'ใบงานเรขาคณิต Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/math/word-problem-hub-worksheet.html', 'ใบงานโจทย์ปัญหา Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/math/math-24-worksheet.html', 'ใบงานเกม 24', ARRAY['worksheet','scaffold']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/science/digestive-worksheet.html', 'ใบงานระบบย่อยอาหาร', ARRAY['worksheet','scaffold']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/social/thailand-hub-worksheet.html', 'ใบงานประเทศไทย Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/grammar-hub-worksheet.html', 'ใบงานไวยากรณ์ไทย Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/idiom-hub-worksheet.html', 'ใบงานสำนวนไทย Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/implied-meaning-worksheet.html', 'ใบงานความหมายโดยนัย', ARRAY['worksheet','scaffold']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/literature-hub-worksheet.html', 'ใบงานวรรณคดี Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/narration-style-worksheet.html', 'ใบงานบรรยาย–พรรณนา', ARRAY['worksheet','scaffold']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/poetry-hub-worksheet.html', 'ใบงานบทกวี Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/punctuation-hub-worksheet.html', 'ใบงานวรรคตอน Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/reading-hub-worksheet.html', 'ใบงานการอ่าน Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/script-hub-worksheet.html', 'ใบงานอักษรไทย Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/sentence-hub-worksheet.html', 'ใบงานประโยคไทย Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL'),
    ('/games/thai/writing-hub-worksheet.html', 'ใบงานการเขียน Hub', ARRAY['worksheet','scaffold','hub']::text[], 'v1.0.0', 'Phase 10: seed missing repo URL')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

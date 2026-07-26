-- 427: Phase 7A — English dual-track normalize URLs + seed grammar-vocab-media + game_docs

-- Remap hub item external_url from legacy English media paths to *-media.html
UPDATE public.educational_hub_items AS ehi
SET external_url = m.new_url,
    updated_at = now()
FROM (
  VALUES
    ('/games/english/phonics-chart.html', '/games/english/phonics-media.html'),
    ('/games/english/sight-words-p4.html', '/games/english/sight-words-media.html'),
    ('/games/english/grammar-mini.html', '/games/english/grammar-mini-media.html'),
    ('/games/english/follow-instructions.html', '/games/english/follow-instructions-media.html')
) AS m(old_url, new_url)
WHERE ehi.external_url = m.old_url;

-- Seed grammar-vocab-media if missing (owner = existing English worksheet owner when possible)
DO $$
DECLARE
  v_staff_id uuid;
  v_cat_id uuid;
BEGIN
  SELECT id INTO v_cat_id
  FROM public.educational_hub_categories
  WHERE key = 'media'
  LIMIT 1;

  SELECT owner_staff_id INTO v_staff_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/grammar-vocab-worksheet.html'
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT owner_staff_id INTO v_staff_id
    FROM public.educational_hub_items
    WHERE external_url LIKE '/games/english/%'
      AND is_published = true
    LIMIT 1;
  END IF;

  IF v_staff_id IS NULL OR v_cat_id IS NULL THEN
    RAISE NOTICE '427: skip seed grammar-vocab-media (staff/cat missing)';
    RETURN;
  END IF;

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_id, 'link',
    'Grammar & Vocab — สอนและฝึกสั้น',
    'สื่อคู่ใบงาน grammar-vocab · is/are · a/an · this/that + MCQ',
    '/games/english/grammar-vocab-media.html',
    'ภาษาอังกฤษ', ARRAY['ป.4','ป.5']::text[],
    ARRAY['english','grammar','media','practice']::text[],
    50, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE external_url = '/games/english/grammar-vocab-media.html'
  );
END $$;

-- game_docs for remapped + new English media
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/english/phonics-media.html',
     'Phonics Chart',
     ARRAY['ตารางเสียง A–Z', 'โหมดเรียนรู้', 'โหมดฝึกเลือกคำ', 'คู่ phonics-worksheet'],
     'v1.2.0',
     'Phase 7A dual-track rename → phonics-media'),
    ('/games/english/sight-words-media.html',
     'Sight Words ป.4',
     ARRAY['การ์ดคำ', 'โหมดเรียนรู้', 'โหมดฝึกอ่าน', 'คู่ sight-words-worksheet'],
     'v1.2.0',
     'Phase 7A dual-track rename → sight-words-media'),
    ('/games/english/grammar-mini-media.html',
     'Grammar Mini',
     ARRAY['is/are a/an this/that', 'โหมดเรียนรู้', 'โหมดฝึก MCQ', 'คู่ grammar-mini-worksheet'],
     'v1.2.0',
     'Phase 7A dual-track rename → grammar-mini-media'),
    ('/games/english/follow-instructions-media.html',
     'Follow Instructions',
     ARRAY['คำสั่งภาษาอังกฤษ', 'โหมดเรียนรู้', 'โหมดฝึกทำ', 'คู่ follow-instructions-worksheet'],
     'v1.2.0',
     'Phase 7A dual-track rename → follow-instructions-media'),
    ('/games/english/grammar-vocab-media.html',
     'Grammar & Vocab',
     ARRAY['สอนกฎสั้น', 'ฝึกสั้น MCQ', 'คู่ grammar-vocab-worksheet', 'ลิงก์ hub'],
     'v1.0.0',
     'Phase 7A dual-track media for grammar-vocab worksheet')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

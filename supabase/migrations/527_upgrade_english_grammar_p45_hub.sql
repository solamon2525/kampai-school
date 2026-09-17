-- Migration 527: Upgrade English Grammar & Sight Words Studio and Companion Worksheet (ป.4–ป.5)
-- Updates /games/english/english-grammar-p45-hub/index.html and /games/english/english-grammar-p45-hub-worksheet.html
-- Upgrades to 4 interactive modes (Grammar Studio, Sight Words Flashcards, Instructions Lab, Practice Quiz & Sentence Builder)
-- Connects real WebP educational illustrations, Multi-accent TTS, Classroom Echo, Smartboard shortcuts, and 42-item A4 worksheet

DO $$
DECLARE
  v_staff_id uuid;
  v_media_cat_id uuid;
  v_worksheet_cat_id uuid;
  v_media_id uuid;
  v_worksheet_id uuid;
BEGIN
  -- 1. Find teaching staff owner (Teacher Nattapong)
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  END IF;

  -- 2. Find categories
  SELECT id INTO v_media_cat_id
  FROM public.educational_hub_categories
  WHERE category_key = 'media' AND is_active = true
  LIMIT 1;

  SELECT id INTO v_worksheet_cat_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  -- 3. Register or Update Media Item: English Grammar & Sight Words Studio
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/english-grammar-p45-hub/index.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_media_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published,
      build_version, build_updated_at, updated_at
    ) VALUES (
      v_staff_id,
      v_media_cat_id,
      'link',
      '🇬🇧 English Grammar & Sight Words Studio — สื่อเรียนรู้ไวยากรณ์และคำอ่านจำ ป.4–ป.5',
      'สตูดิโอเรียนรู้ภาษาอังกฤษ ป.4–ป.5 ครอบคลุม 6 กฎไวยากรณ์พื้นฐาน (Verb to Be, Articles, Demonstratives, Pronouns, Prepositions, Wh-Questions), บัตรคำจำ 32 คำ (Sight Words), ห้องปฏิบัติการทำตามคำสั่ง 10 ภารกิจ, แบบทดสอบ และตัวต่อประโยค พร้อมระบบเสียง TTS 3 สำเนียง และฟีเจอร์ Classroom Echo',
      '/games/english/english-grammar-p45-hub/index.html',
      '/games/english/english-grammar-p45-hub/cover.png',
      'ภาษาอังกฤษ',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['grammar', 'sight words', 'instructions', 'learning studio', 'ป.4', 'ป.5', 'ภาษาอังกฤษ']::text[],
      101,
      false,
      true,
      'v1.229.78',
      NOW(),
      NOW()
    ) RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '🇬🇧 English Grammar & Sight Words Studio — สื่อเรียนรู้ไวยากรณ์และคำอ่านจำ ป.4–ป.5',
      description = 'สตูดิโอเรียนรู้ภาษาอังกฤษ ป.4–ป.5 ครอบคลุม 6 กฎไวยากรณ์พื้นฐาน (Verb to Be, Articles, Demonstratives, Pronouns, Prepositions, Wh-Questions), บัตรคำจำ 32 คำ (Sight Words), ห้องปฏิบัติการทำตามคำสั่ง 10 ภารกิจ, แบบทดสอบ และตัวต่อประโยค พร้อมระบบเสียง TTS 3 สำเนียง และฟีเจอร์ Classroom Echo',
      thumbnail_url = '/games/english/english-grammar-p45-hub/cover.png',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['grammar', 'sight words', 'instructions', 'learning studio', 'ป.4', 'ป.5', 'ภาษาอังกฤษ']::text[],
      sort_order = 101,
      tracked_game = false,
      is_published = true,
      category_id = v_media_cat_id,
      build_version = 'v1.229.78',
      build_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_media_id;
  END IF;

  -- 4. Register or Update Companion Worksheet Item
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/english-grammar-p45-hub-worksheet.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_worksheet_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published,
      build_version, build_updated_at, updated_at
    ) VALUES (
      v_staff_id,
      v_worksheet_cat_id,
      'link',
      '🇬🇧 ใบงานคลัง English ป.4–5 — Grammar · Sight Words · Follow Instructions',
      'ใบงานคลังทักษะภาษาอังกฤษ ป.4–ป.5 คลังคำถาม 42 ข้อ ครอบคลุมไวยากรณ์ คำอ่านจำ และการปฏิบัติตามคำสั่ง พร้อมเฉลยครูและพิมพ์ A4',
      '/games/english/english-grammar-p45-hub-worksheet.html',
      '/games/english/english-grammar-p45-hub/cover.png',
      'ภาษาอังกฤษ',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['worksheet', 'grammar', 'sight words', 'instructions', 'ป.4', 'ป.5', 'A4 print']::text[],
      102,
      false,
      true,
      'v1.229.78',
      NOW(),
      NOW()
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '🇬🇧 ใบงานคลัง English ป.4–5 — Grammar · Sight Words · Follow Instructions',
      description = 'ใบงานคลังทักษะภาษาอังกฤษ ป.4–ป.5 คลังคำถาม 42 ข้อ ครอบคลุมไวยากรณ์ คำอ่านจำ และการปฏิบัติตามคำสั่ง พร้อมเฉลยครูและพิมพ์ A4',
      thumbnail_url = '/games/english/english-grammar-p45-hub/cover.png',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['worksheet', 'grammar', 'sight words', 'instructions', 'ป.4', 'ป.5', 'A4 print']::text[],
      sort_order = 102,
      tracked_game = false,
      is_published = true,
      category_id = v_worksheet_cat_id,
      build_version = 'v1.229.78',
      build_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_worksheet_id;
  END IF;

  -- 5. Insert or Update game_docs metadata for Media Studio
  INSERT INTO public.game_docs (
    item_id,
    owner_staff_id,
    game_format,
    features,
    version,
    notes,
    updated_at
  ) VALUES (
    v_media_id,
    v_staff_id,
    'English Grammar & Sight Words Learning Studio',
    ARRAY[
      '6 Grammar Modules (Verb to Be, Articles, Demonstratives, Pronouns, Prepositions, Wh-Questions)',
      '32 Graded Sight Words Flashcards with IPA phonetics, Thai meanings, context sentences, and WebP art',
      '10 Interactive Follow Instructions Lab tasks with illustrated target options and audio guidance',
      '18 Graded Practice Quiz questions with instant feedback and streaks',
      '8 Sentence Builder assembly challenges with audio readback',
      'Multi-Accent Web Speech TTS (US Female, US Male, UK British)',
      'Classroom Echo repeat-after-me with 3-second animated pulse countdown',
      'Smartboard Teacher Shortcuts (Space, 1-4, M, F, Arrow keys)',
      'Touch-Target Verified >= 44x44px and zero horizontal overflow on all viewports',
      'Synchronized 42-item A4 companion worksheet with teacher answer keys and QR linking'
    ]::text[],
    'v1.229.78',
    'Upgraded from basic prototype to production-grade interactive Studio aligning with Basic Education Core Curriculum (ต 1.1 ป.4/1-2, ต 1.2 ป.4/1, ต 2.1 ป.4/1)',
    NOW()
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = NOW();

END $$;

-- Migration 526: Upgrade English Tenses Media and Companion Worksheet to Learning Studio (ป.4–ป.6)
-- Registers / updates /games/english/english-tenses-p6-media.html and /games/english/english-tenses-p6-worksheet.html
-- Expands grade levels to Grades 4–6 (ป.4–ป.6), registers rich game_docs, and maps curriculum indicators (ต 1.1, ต 1.2, ต 2.2)

DO $$
DECLARE
  v_staff_id uuid;
  v_media_cat_id uuid;
  v_worksheet_cat_id uuid;
  v_media_id uuid;
  v_worksheet_id uuid;
BEGIN
  -- 1. Find teaching staff owner
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

  -- 3. Register or Update Media Item: English Tenses Learning Studio
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/english-tenses-p6-media.html'
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
      '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
      'สตูดิโอเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6 ครอบคลุม 4 กาลหลัก (Present Simple, Present Continuous, Past Simple, Future Simple) พร้อมไทม์ไลน์ภาพประกอบ เสียงอ่าน 3 สำเนียง ฟีเจอร์ Classroom Echo และ 4 โหมดการเรียนรู้',
      '/games/english/english-tenses-p6-media.html',
      '/games/english/english-tenses-p6-media-cover.png',
      'ภาษาอังกฤษ',
      ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
      ARRAY['tenses', 'grammar', 'learning studio', 'timeline', 'ป.4', 'ป.5', 'ป.6', 'ภาษาอังกฤษ']::text[],
      245,
      false,
      true,
      'v2.0.0',
      now(),
      now()
    ) RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET title = '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
        description = 'สตูดิโอเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6 ครอบคลุม 4 กาลหลัก (Present Simple, Present Continuous, Past Simple, Future Simple) พร้อมไทม์ไลน์ภาพประกอบ เสียงอ่าน 3 สำเนียง ฟีเจอร์ Classroom Echo และ 4 โหมดการเรียนรู้',
        thumbnail_url = '/games/english/english-tenses-p6-media-cover.png',
        subject = 'ภาษาอังกฤษ',
        grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
        tags = ARRAY['tenses', 'grammar', 'learning studio', 'timeline', 'ป.4', 'ป.5', 'ป.6', 'ภาษาอังกฤษ']::text[],
        tracked_game = false,
        is_published = true,
        build_version = 'v2.0.0',
        build_updated_at = now(),
        updated_at = now()
    WHERE id = v_media_id;
  END IF;

  -- 4. Upsert Media game_docs
  IF v_media_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_media_id,
      v_staff_id,
      'English Tenses Learning Studio (ป.4–ป.6)',
      ARRAY[
        'หลักสูตร 3 ระดับขั้น: ป.4 (กาลปัจจุบัน 2 กาล), ป.5 (อดีตและอนาคต), ป.6 (เปรียบเทียบ 4 กาลและการแปลงประโยค)',
        'ครอบคลุม 4 กาลหลัก: Present Simple, Present Continuous, Past Simple, Future Simple',
        'Visual Time Machine & Timeline แสดงตำแหน่งกาล จุดเหตุการณ์ และการกระทำต่อเนื่อง',
        'ภาพประกอบการศึกษา WebP แท้คมชัด 12 กริยาแอ็กชันและบริบทสถานการณ์ ไร้ Emoji',
        'ระบบเสียงสังเคราะห์ Web Speech API 3 สำเนียง (US Female, US Male, UK British) ปรับความเร็ว 0.75x/1.0x',
        'Classroom Echo (🎤 ฝึกพูดตาม) พร้อมตัวนับถอยหลัง 3 วินาทีแบบ Pulse animation',
        '4 โหมดการเรียนรู้: 1. Tense Studio 2. Comparison Matrix 3. Practice Quiz 4. Tense Sentence Builder',
        'คีย์ลัด Smartboard สำหรับครูผู้สอน (Spacebar, ลูกศรซ้าย-ขวา, ตัวเลข 1-4, ปุ่ม M, ปุ่ม F)',
        'เชื่อมโยงใบงานคู่สื่อ A4 48 ข้อ พร้อมเฉลยสำหรับครูผู้สอน'
      ]::text[],
      'v2.0.0',
      'ยกระดับเป็น English Tenses Learning Studio ป.4–ป.6 เชื่อมโยงตัวชี้วัด ต 1.1, ต 1.2, ต 2.2'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

    -- Map Curriculum Indicators to Media (ต 1.1, ต 1.2, ต 2.2 for P.4, P.5, P.6)
    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_media_id, ci.id
    FROM public.curriculum_indicators ci
    WHERE ci.indicator_code = ANY (ARRAY[
      'ต 1.1 ป.4/2',
      'ต 1.1 ป.4/3',
      'ต 1.1 ป.4/4',
      'ต 1.2 ป.4/1',
      'ต 1.2 ป.4/4',
      'ต 2.2 ป.4/1',
      'ต 1.1 ป.5/2',
      'ต 1.1 ป.5/3',
      'ต 1.2 ป.5/1',
      'ต 1.2 ป.5/4',
      'ต 2.2 ป.5/1',
      'ต 1.1 ป.6/2',
      'ต 1.1 ป.6/3',
      'ต 1.2 ป.6/1',
      'ต 1.2 ป.6/4',
      'ต 2.2 ป.6/1'
    ]::text[])
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Register or Update Worksheet Item
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/english-tenses-p6-worksheet.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_worksheet_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published,
      updated_at
    ) VALUES (
      v_staff_id,
      v_worksheet_cat_id,
      'link',
      '📝 ใบงาน English Tenses Learning Studio ป.4–ป.6',
      'ใบงานคู่สื่อกาลภาษาอังกฤษ ป.4–ป.6 ครอบคลุม 4 กาลหลัก เลือกระดับชั้น ป.4, ป.5, ป.6 หรือรวมได้ คลังโจทย์ 48 ข้อ พร้อมพิมพ์ A4 สแกน QR และเฉลยครู',
      '/games/english/english-tenses-p6-worksheet.html',
      '/games/english/english-tenses-p6-media-cover.png',
      'ภาษาอังกฤษ',
      ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
      ARRAY['ใบงาน', 'tenses', 'grammar', 'ป.4', 'ป.5', 'ป.6', 'A4', 'พิมพ์ได้']::text[],
      253,
      false,
      true,
      now()
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET title = '📝 ใบงาน English Tenses Learning Studio ป.4–ป.6',
        description = 'ใบงานคู่สื่อกาลภาษาอังกฤษ ป.4–ป.6 ครอบคลุม 4 กาลหลัก เลือกระดับชั้น ป.4, ป.5, ป.6 หรือรวมได้ คลังโจทย์ 48 ข้อ พร้อมพิมพ์ A4 สแกน QR และเฉลยครู',
        thumbnail_url = '/games/english/english-tenses-p6-media-cover.png',
        subject = 'ภาษาอังกฤษ',
        grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
        tags = ARRAY['ใบงาน', 'tenses', 'grammar', 'ป.4', 'ป.5', 'ป.6', 'A4', 'พิมพ์ได้']::text[],
        tracked_game = false,
        is_published = true,
        updated_at = now()
    WHERE id = v_worksheet_id;
  END IF;

  -- 6. Upsert Worksheet game_docs
  IF v_worksheet_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_worksheet_id,
      v_staff_id,
      'ใบงาน English Tenses Learning Studio ป.4–ป.6',
      ARRAY[
        'พิมพ์ A4 สัดส่วนมาตรฐาน ไร้การเลื่อนบรรทัด',
        'เลือกระดับชั้นได้: ป.4 (พื้นฐาน), ป.5 (ปานกลาง), ป.6 (ท้าทาย), หรือ รวม ป.4–ป.6',
        'คลังโจทย์ 48 ข้อ (16 ข้อต่อระดับ) ครอบคลุมรูปกาล คำบอกเวลา และการแต่งประโยค',
        'QR Code สแกนตรงสู่สื่อการสอน English Tenses Learning Studio',
        'เฉลยคำตอบสำหรับครูผู้สอนแบบ Zero-shift'
      ]::text[],
      'v2.0.0',
      'ใบงานคู่สื่อ English Tenses Learning Studio ป.4–ป.6'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

    -- Map Indicators to Worksheet (ต 1.1, ต 1.2, ต 2.2 for P.4, P.5, P.6)
    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_worksheet_id, ci.id
    FROM public.curriculum_indicators ci
    WHERE ci.indicator_code = ANY (ARRAY[
      'ต 1.1 ป.4/2',
      'ต 1.1 ป.4/3',
      'ต 1.2 ป.4/1',
      'ต 2.2 ป.4/1',
      'ต 1.1 ป.5/2',
      'ต 1.1 ป.5/3',
      'ต 1.2 ป.5/1',
      'ต 2.2 ป.5/1',
      'ต 1.1 ป.6/2',
      'ต 1.1 ป.6/3',
      'ต 1.2 ป.6/1',
      'ต 1.2 ป.6/4',
      'ต 2.2 ป.6/1'
    ]::text[])
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

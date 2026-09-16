-- Migration 524: Everyday Conversation Guided Speaking and Companion Worksheet
-- Registers /games/english/everyday-conversation-p4-worksheet.html and upgrades media item to v1.6.0

DO $$
DECLARE
  v_staff_id uuid;
  v_worksheet_cat_id uuid;
  v_media_id uuid;
  v_worksheet_id uuid;
BEGIN
  -- 1. Find teacher owner
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  END IF;

  -- 2. Find worksheets category
  SELECT id INTO v_worksheet_cat_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_worksheet_cat_id IS NULL THEN
    RAISE EXCEPTION 'Active worksheets category not found';
  END IF;

  -- 3. Register or update everyday-conversation-p4-worksheet.html
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/everyday-conversation-p4-worksheet.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_worksheet_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
    ) VALUES (
      v_staff_id,
      v_worksheet_cat_id,
      'link',
      '🗣️ ใบงาน Everyday Conversation ป.4',
      'ใบงานคู่สื่อบทสนทนาภาษาอังกฤษ ป.4 ครอบคลุม 6 สถานการณ์ พร้อมเฉลยสำหรับครู พิมพ์ A4',
      '/games/english/everyday-conversation-p4-worksheet.html',
      '/games/media-lab-assets/learning-scene.svg',
      'ภาษาอังกฤษ',
      ARRAY['ป.4']::text[],
      ARRAY['ใบงาน', 'บทสนทนา', 'ภาษาอังกฤษ', 'everyday conversation', 'speaking', 'A4']::text[],
      COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = v_worksheet_cat_id), 1),
      false,
      true
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET title = '🗣️ ใบงาน Everyday Conversation ป.4',
        description = 'ใบงานคู่สื่อบทสนทนาภาษาอังกฤษ ป.4 ครอบคลุม 6 สถานการณ์ พร้อมเฉลยสำหรับครู พิมพ์ A4',
        category_id = v_worksheet_cat_id,
        thumbnail_url = '/games/media-lab-assets/learning-scene.svg',
        subject = 'ภาษาอังกฤษ',
        grade_levels = ARRAY['ป.4']::text[],
        tags = ARRAY['ใบงาน', 'บทสนทนา', 'ภาษาอังกฤษ', 'everyday conversation', 'speaking', 'A4']::text[],
        tracked_game = false,
        is_published = true,
        updated_at = now()
    WHERE id = v_worksheet_id;
  END IF;

  -- 4. Map indicators to worksheet
  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_worksheet_id, ci.id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = ANY (ARRAY[
    'ต 1.1 ป.4/1',
    'ต 1.1 ป.4/4',
    'ต 1.2 ป.4/1',
    'ต 1.2 ป.4/2',
    'ต 1.2 ป.4/3',
    'ต 1.2 ป.4/4',
    'ต 1.2 ป.4/5',
    'ต 4.1 ป.4/1'
  ]::text[])
  ON CONFLICT DO NOTHING;

  -- 5. Upgrade media item and game_docs
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/everyday-conversation-p4-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_media_id IS NOT NULL THEN
    UPDATE public.educational_hub_items
    SET build_version = 'v1.6.0',
        build_updated_at = now(),
        updated_at = now()
    WHERE id = v_media_id;

    UPDATE public.game_docs
    SET features = ARRAY(
          SELECT DISTINCT f FROM unnest(coalesce(features, ARRAY[]::text[]) || ARRAY[
            'ฝึกพูดเอง 5 บทนำร่อง: ชื่อ อายุ ที่อยู่ ขอยืมดินสอ และความชอบฟุตบอล',
            'ตัวช่วยประโยคเต็ม / คำใบ้ / พูดเอง ใช้ร่วมกันในจับคู่ A/B และฉากพูดได้',
            'ระบบรอเด็กตอบโดยไม่จำกัดเวลา ครูกดพูดแล้วไปต่อ ฟังตัวอย่างแล้วกลับมารอประโยคเดิม',
            'จบบทมีลองอีกครั้ง สลับบท และเกณฑ์ครูสังเกต โดยไม่มีไมโครโฟนหรือคะแนนอัตโนมัติ',
            'ปุ่มเปิดใบงาน A4 Everyday Conversation เชื่อมโยง 6 สถานการณ์และเฉลยครู'
          ]) AS entries(f)
        ),
        version = 'v1.6.0',
        notes = '5 บทนำร่องตรวจ source_indicator_id จาก Integrated Plan: ต 1.2 ป.4/1, /3, /4, /5; ซ่อนคำอ่าน/คำแปลในระดับลดตัวช่วย; เพิ่มใบงานคู่สื่อ 6 สถานการณ์ พิมพ์ A4',
        updated_at = now()
    WHERE item_id = v_media_id;

    -- Also map indicators to media
    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_media_id, ci.id
    FROM public.curriculum_indicators ci
    WHERE ci.indicator_code = ANY (ARRAY[
      'ต 1.1 ป.4/1',
      'ต 1.1 ป.4/4',
      'ต 1.2 ป.4/1',
      'ต 1.2 ป.4/2',
      'ต 1.2 ป.4/3',
      'ต 1.2 ป.4/4',
      'ต 1.2 ป.4/5',
      'ต 4.1 ป.4/1'
    ]::text[])
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

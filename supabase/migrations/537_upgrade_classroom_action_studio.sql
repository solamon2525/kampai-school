-- 537_upgrade_classroom_action_studio.sql
-- ยกระดับสื่อและใบงาน "Classroom Action & TPR Commands Studio" ภาษาอังกฤษ (ต 1.1 ป.1–3, ต 1.2 ป.3)
-- สื่อการสอน: public/games/english/classroom-action-media.html
-- ใบงานคู่สื่อ A4: public/games/english/classroom-action-worksheet.html
-- ภาพปก 16:9: public/games/english/classroom-action-media-cover.png
-- Idempotent: re-run ได้อย่างปลอดภัย ไม่ซ้ำซ้อน

DO $$
DECLARE
  v_staff_id     UUID;
  v_cat_media    UUID;
  v_cat_ws       UUID;
  v_media_url    TEXT := '/games/english/classroom-action-media.html';
  v_ws_url       TEXT := '/games/english/classroom-action-worksheet.html';
  v_cover_url    TEXT := '/games/english/classroom-action-media-cover.png';
  v_media_id     UUID;
  v_ws_id        UUID;
BEGIN
  -- 1. ค้นหาครูผู้สอน ณัฐพงศ์ สิงห์ชมภู หรือครูสายการสอน
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching'
    ORDER BY created_at LIMIT 1;
  END IF;

  -- 2. ดึง Category IDs
  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media' LIMIT 1;
  SELECT id INTO v_cat_ws FROM public.educational_hub_categories WHERE category_key = 'worksheets' LIMIT 1;

  -- 3. ลงทะเบียน / อัปเดต สื่อการสอน (Media) ใน educational_hub_items
  SELECT id INTO v_media_id FROM public.educational_hub_items WHERE external_url = v_media_url LIMIT 1;

  IF v_media_id IS NULL THEN
    INSERT INTO public.educational_hub_items
      (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
    VALUES
      (v_staff_id, v_cat_media, 'link',
       'Classroom Action & TPR Commands Studio',
       'สื่อการสอนอินเทอร์แอ็กทีฟภาษาอังกฤษ-ภาษาไทยสำหรับใช้บนจอ Smartboard ในห้องเรียน รวบรวม 24+ คำสั่งและการเคลื่อนไหวร่างกาย 4 หมวดหมู่ พร้อม 4 โหมดกิจกรรม: Blind Reveal, Simon Says, Speed Randomizer และ Command Builder',
       v_media_url,
       'ภาษาอังกฤษ',
       ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
       ARRAY['english','tpr','actions','commands','simon-says','primary','smartboard','classroom','media']::text[],
       470, false, true,
       v_cover_url,
       'v1.229.89', now())
    RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET title = 'Classroom Action & TPR Commands Studio',
        description = 'สื่อการสอนอินเทอร์แอ็กทีฟภาษาอังกฤษ-ภาษาไทยสำหรับใช้บนจอ Smartboard ในห้องเรียน รวบรวม 24+ คำสั่งและการเคลื่อนไหวร่างกาย 4 หมวดหมู่ พร้อม 4 โหมดกิจกรรม: Blind Reveal, Simon Says, Speed Randomizer และ Command Builder',
        external_url = v_media_url,
        subject = 'ภาษาอังกฤษ',
        grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
        tags = ARRAY['english','tpr','actions','commands','simon-says','primary','smartboard','classroom','media']::text[],
        thumbnail_url = v_cover_url,
        tracked_game = false,
        is_published = true,
        build_version = 'v1.229.89',
        build_updated_at = now(),
        updated_at = now()
    WHERE id = v_media_id;
  END IF;

  -- 4. ลงทะเบียน / อัปเดต ใบงาน A4 (Worksheet) ใน educational_hub_items
  SELECT id INTO v_ws_id FROM public.educational_hub_items WHERE external_url = v_ws_url LIMIT 1;

  IF v_ws_id IS NULL THEN
    INSERT INTO public.educational_hub_items
      (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
    VALUES
      (v_staff_id, v_cat_ws, 'link',
       'ใบงานคำสั่งและการเคลื่อนไหวในห้องเรียน (TPR Commands A4)',
       'ใบงาน A4 สอดคล้องสื่อคำสั่งและการเคลื่อนไหวร่างกาย TPR 40-50 ข้อ 4 หมวดหมู่ พร้อมเฉลยครูแบบ Zero-shift และระบบสุ่มข้อสอบ',
       v_ws_url,
       'ภาษาอังกฤษ',
       ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
       ARRAY['ใบงาน','ภาษาอังกฤษ','tpr','คำสั่ง','การเคลื่อนไหว','พิมพ์ได้','a4']::text[],
       471, false, true,
       v_cover_url,
       'v1.229.89', now())
    RETURNING id INTO v_ws_id;
  ELSE
    UPDATE public.educational_hub_items
    SET title = 'ใบงานคำสั่งและการเคลื่อนไหวในห้องเรียน (TPR Commands A4)',
        description = 'ใบงาน A4 สอดคล้องสื่อคำสั่งและการเคลื่อนไหวร่างกาย TPR 40-50 ข้อ 4 หมวดหมู่ พร้อมเฉลยครูแบบ Zero-shift และระบบสุ่มข้อสอบ',
        external_url = v_ws_url,
        subject = 'ภาษาอังกฤษ',
        grade_levels = ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
        tags = ARRAY['ใบงาน','ภาษาอังกฤษ','tpr','คำสั่ง','การเคลื่อนไหว','พิมพ์ได้','a4']::text[],
        thumbnail_url = v_cover_url,
        tracked_game = false,
        is_published = true,
        build_version = 'v1.229.89',
        build_updated_at = now(),
        updated_at = now()
    WHERE id = v_ws_id;
  END IF;

  -- 5. ลงทะเบียน / อัปเดต game_docs สำหรับ classroom-action-media (10 key features)
  IF v_media_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_media_id,
      v_staff_id,
      'Interactive Classroom Action & TPR Studio — 4 โหมดการเรียนรู้บน Smartboard (Blind Reveal, Simon Says, Speed Randomizer, Command Builder) รวบรวม 24+ ท่าทาง 4 หมวดหมู่ พร้อมเสียงสองสำเนียง US/UK',
      ARRAY[
        '24+ Bilingual Classroom Action & TPR Commands across 4 pedagogical categories (Movements, Directions, Face/Gestures, Emotions)',
        'Blind Listen & Reveal Mode with animated sliding curtain veil for auditory comprehension testing',
        'Simon Says Challenge Mode with randomized prefix and teacher judgment referee',
        'Speed Randomizer Mode with 3 warm-up pace intervals (3.5s slow, 2.5s medium, 1.5s fast)',
        'Command Sentence Builder Mode with tap/click word slots [Verb] + [Target]',
        'Web Speech API multi-accent audio (US English, UK English, and Thai pronunciation)',
        'Classroom Smartboard keyboard shortcuts (1-4, Space, Enter/R, Arrows, F)',
        'Automated inspection hook window.__getState() for E2E verification',
        'Classroom-first responsive layout (360x800 & 1280x720, zero horizontal overflow, touch targets >= 44px)',
        'Companion printable A4 worksheet with zero-shift teacher answer key and randomizer'
      ],
      'v1.229.89',
      'สื่อการสอนอินเทอร์แอ็กทีฟภาษาอังกฤษ TPR Commands (ต 1.1 ป.1/1, ต 1.1 ป.2/1, ต 1.1 ป.3/1, ต 1.2 ป.3/1) โรงเรียนบ้านคำไผ่'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();

    RAISE NOTICE '537: Successfully registered Classroom Action Studio and game_docs (v1.229.89)';
  END IF;
END $$;

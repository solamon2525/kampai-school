-- Migration 529: Upgrade Thai Reading Hub to Learning Studio (ป.4–ป.5) and Synchronize Companion Worksheet
-- Updates /games/thai/thai-reading-hub/index.html and /games/thai/thai-reading-hub-worksheet.html
-- Replaces placeholder thumbnail '/games/media-lab-assets/learning-scene.svg' with '/games/thai/thai-reading-hub/cover.png'
-- Upgrades to 4 interactive studio modes: 5W1H reading, fact vs opinion lab, story sequencer, and comprehension quiz
-- Connects curriculum indicators ท 1.1 ป.4/3, ป.4/4, ป.4/6, ท 1.1 ป.5/3, ป.5/4, ป.5/5, ป.5/7

DO $$
DECLARE
  v_staff_id uuid;
  v_media_cat_id uuid;
  v_worksheet_cat_id uuid;
  v_media_id uuid;
  v_worksheet_id uuid;
BEGIN
  -- 1. Find teaching staff owner (Maliwan or default teaching staff)
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE (name LIKE '%มะลิวัลย์%' OR name LIKE '%ณัฐพงศ์%') AND staff_type = 'teaching'
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

  -- 3. Register or Update Media Item: Thai Reading Comprehension Studio
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-reading-hub/index.html'
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
      '📖 คลังอ่านจับใจความ ป.4–ป.5 — Thai Reading Comprehension Studio',
      'สตูดิโอเรียนรู้การอ่านจับใจความ ป.4–ป.5 ครอบคลุมการวิเคราะห์โครงสร้าง 5W1H, ห้องแล็บแยกแยะข้อเท็จจริง vs ข้อคิดเห็น, กิจกรรมจัดลำดับเหตุการณ์ และแบบทดสอบจับใจความ พร้อมเสียงอ่านสังเคราะห์ภาษาไทย',
      '/games/thai/thai-reading-hub/index.html',
      '/games/thai/thai-reading-hub/cover.png',
      'ภาษาไทย',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['ภาษาไทย', 'อ่านจับใจความ', '5W1H', 'ข้อเท็จจริง', 'ข้อคิดเห็น', 'ป.4', 'ป.5', 'learning studio']::text[],
      112,
      false,
      true,
      'v1.229.81',
      NOW(),
      NOW()
    ) RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '📖 คลังอ่านจับใจความ ป.4–ป.5 — Thai Reading Comprehension Studio',
      description = 'สตูดิโอเรียนรู้การอ่านจับใจความ ป.4–ป.5 ครอบคลุมการวิเคราะห์โครงสร้าง 5W1H, ห้องแล็บแยกแยะข้อเท็จจริง vs ข้อคิดเห็น, กิจกรรมจัดลำดับเหตุการณ์ และแบบทดสอบจับใจความ พร้อมเสียงอ่านสังเคราะห์ภาษาไทย',
      thumbnail_url = '/games/thai/thai-reading-hub/cover.png',
      subject = 'ภาษาไทย',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['ภาษาไทย', 'อ่านจับใจความ', '5W1H', 'ข้อเท็จจริง', 'ข้อคิดเห็น', 'ป.4', 'ป.5', 'learning studio']::text[],
      sort_order = 112,
      tracked_game = false,
      is_published = true,
      category_id = v_media_cat_id,
      build_version = 'v1.229.81',
      build_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_media_id;
  END IF;

  -- 4. Register or Update Companion Worksheet Item (Syncing cover thumbnail)
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-reading-hub-worksheet.html'
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
      '📝 ใบงานคลังอ่านจับใจความ ป.4–ป.5 — Thai Reading Studio',
      'ใบงานคลังอ่านจับใจความ ป.4–ป.5 คลังโจทย์ 50 ข้อ ครอบคลุมใจความสำคัญ รายละเอียด 5W1H ข้อเท็จจริง/ข้อคิดเห็น อนุมาน และข้อคิด พร้อมเฉลยครูและพิมพ์ A4',
      '/games/thai/thai-reading-hub-worksheet.html',
      '/games/thai/thai-reading-hub/cover.png',
      'ภาษาไทย',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['ใบงาน', 'ภาษาไทย', 'อ่านจับใจความ', 'ป.4', 'ป.5', 'A4 print']::text[],
      178,
      false,
      true,
      'v1.229.81',
      NOW(),
      NOW()
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '📝 ใบงานคลังอ่านจับใจความ ป.4–ป.5 — Thai Reading Studio',
      description = 'ใบงานคลังอ่านจับใจความ ป.4–ป.5 คลังโจทย์ 50 ข้อ ครอบคลุมใจความสำคัญ รายละเอียด 5W1H ข้อเท็จจริง/ข้อคิดเห็น อนุมาน และข้อคิด พร้อมเฉลยครูและพิมพ์ A4',
      thumbnail_url = '/games/thai/thai-reading-hub/cover.png',
      subject = 'ภาษาไทย',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['ใบงาน', 'ภาษาไทย', 'อ่านจับใจความ', 'ป.4', 'ป.5', 'A4 print']::text[],
      sort_order = 178,
      tracked_game = false,
      is_published = true,
      category_id = v_worksheet_cat_id,
      build_version = 'v1.229.81',
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
    'Thai Reading Comprehension Studio (ป.4–ป.5)',
    ARRAY[
      'Mode 1: Reading Studio & 5W1H Navigator — บทอ่านคุณภาพ 11 เรื่อง 5 หมวดหมู่ พร้อมผังวิเคราะห์ 5W1H (ใคร ทำอะไร ที่ไหน เมื่อไหร่ ทำไม อย่างไร) และระบบอ่านออกเสียงภาษาไทย',
      'Mode 2: Fact vs Opinion Detective Lab — ห้องแล็บนักสืบแยกแยะข้อเท็จจริง vs ข้อคิดเห็น พร้อมคำกุญแจสังเกต (Clue Words) และคำอธิบายเฉลย',
      'Mode 3: Story Sequencer Lab — กิจกรรมจัดเรียงลำดับเหตุการณ์ในเรื่องอย่างเป็นขั้นตอน พร้อมระบบตรวจผลทันที',
      'Mode 4: Practice Quiz Challenge — แบบทดสอบท้าทาย 4 ตัวเลือก สตรีคสะสมต่อเนื่อง และคำอธิบายเฉลยละเอียด',
      'Classroom-First UI & Smartboard Shortcuts (Space, 1-4, Arrow keys, KeyF) ไร้แนวนอนล้นบนทุกขนาดจอ',
      'Touch-Target Verified >= 44x44px รองรับสมาร์ตบอร์ดและแท็บเล็ตนักเรียน',
      'Custom 16:9 Cover Art 1280x720 ธีมห้องสมุดและการอ่านภาษาไทยแสนอบอุ่น',
      'Synchronized 50-item A4 companion worksheet with zero-shift keys and QR linking'
    ]::text[],
    'v1.229.81',
    'Upgraded from basic flashcard prototype to production-grade interactive Studio aligning with Basic Education Core Curriculum (ท 1.1 ป.4/3, ท 1.1 ป.4/4, ท 1.1 ป.4/6, ท 1.1 ป.5/3, ท 1.1 ป.5/4, ท 1.1 ป.5/5, ท 1.1 ป.5/7)',
    NOW()
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = NOW();

  -- 6. Insert or Update game_docs metadata for Worksheet
  INSERT INTO public.game_docs (
    item_id,
    owner_staff_id,
    game_format,
    features,
    version,
    notes,
    updated_at
  ) VALUES (
    v_worksheet_id,
    v_staff_id,
    'ใบงาน Thai Reading Comprehension Studio ป.4–ป.5',
    ARRAY[
      'พิมพ์ A4 สัดส่วนมาตรฐาน ไร้การเลื่อนบรรทัด (Zero-shift)',
      'คลังโจทย์ 50 ข้อ ครอบคลุม 5 ทักษะการอ่านจับใจความ',
      'ตัวกรองหัวข้อโจทย์เพื่อปรับใช้ตามระดับชั้นและเนื้อหาในห้องเรียน',
      'QR Code สแกนตรงสู่สื่อการสอน Thai Reading Comprehension Studio',
      'เฉลยคำตอบสำหรับครูผู้สอนแบบ Zero-shift'
    ]::text[],
    'v1.229.81',
    'ใบงานคู่สื่อ Thai Reading Comprehension Studio ป.4–ป.5',
    NOW()
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = NOW();

  -- 7. Map Curriculum Indicators to Media & Worksheet
  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_media_id, ci.id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = ANY (ARRAY[
    'ท 1.1 ป.4/3',
    'ท 1.1 ป.4/4',
    'ท 1.1 ป.4/6',
    'ท 1.1 ป.5/3',
    'ท 1.1 ป.5/4',
    'ท 1.1 ป.5/5',
    'ท 1.1 ป.5/7'
  ]::text[])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_worksheet_id, ci.id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = ANY (ARRAY[
    'ท 1.1 ป.4/3',
    'ท 1.1 ป.4/4',
    'ท 1.1 ป.4/6',
    'ท 1.1 ป.5/3',
    'ท 1.1 ป.5/4',
    'ท 1.1 ป.5/5',
    'ท 1.1 ป.5/7'
  ]::text[])
  ON CONFLICT DO NOTHING;

END $$;

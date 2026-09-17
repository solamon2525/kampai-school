-- Migration 528: Upgrade Math Decimal Hub to Learning Studio (ป.4–ป.5) and Synchronize Companion Worksheet
-- Updates /games/math/math-decimal-hub/index.html and /games/math/math-decimal-hub-worksheet.html
-- Replaces placeholder thumbnail '/games/media-lab-assets/learning-scene.svg' with '/games/math/math-decimal-hub/cover.png'
-- Upgrades to 4 interactive studio modes, place value tables, 10/100 grid models, Thai money simulator, and 40+ item A4 worksheet
-- Connects curriculum indicators ค 1.1 ป.4/5, ค 1.1 ป.4/6, ค 1.1 ป.5/1, ค 1.1 ป.5/8

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

  -- 3. Register or Update Media Item: Math Decimal Learning Studio
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-decimal-hub/index.html'
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
      '🔢 Math Decimal Learning Studio — สตูดิโอเรียนรู้ทศนิยม ป.4–ป.5',
      'สตูดิโอเรียนรู้ทศนิยม ป.4–ป.5 ครอบคลุมการอ่านค่าประจำหลัก, โมเดลกริด 10 และ 100 ช่อง, การเปรียบเทียบบนเส้นจำนวน, การบวกลบตั้งจุดตรงกัน, ห้องแล็บเงินบาท/สตางค์ และเกมจับคู่เศษส่วน-ทศนิยม พร้อมเสียงอ่านไทย',
      '/games/math/math-decimal-hub/index.html',
      '/games/math/math-decimal-hub/cover.png',
      'คณิตศาสตร์',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['ทศนิยม', 'เงิน', 'คณิตศาสตร์', 'learning studio', 'ป.4', 'ป.5', 'place value']::text[],
      96,
      false,
      true,
      'v1.229.79',
      NOW(),
      NOW()
    ) RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '🔢 Math Decimal Learning Studio — สตูดิโอเรียนรู้ทศนิยม ป.4–ป.5',
      description = 'สตูดิโอเรียนรู้ทศนิยม ป.4–ป.5 ครอบคลุมการอ่านค่าประจำหลัก, โมเดลกริด 10 และ 100 ช่อง, การเปรียบเทียบบนเส้นจำนวน, การบวกลบตั้งจุดตรงกัน, ห้องแล็บเงินบาท/สตางค์ และเกมจับคู่เศษส่วน-ทศนิยม พร้อมเสียงอ่านไทย',
      thumbnail_url = '/games/math/math-decimal-hub/cover.png',
      subject = 'คณิตศาสตร์',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['ทศนิยม', 'เงิน', 'คณิตศาสตร์', 'learning studio', 'ป.4', 'ป.5', 'place value']::text[],
      sort_order = 96,
      tracked_game = false,
      is_published = true,
      category_id = v_media_cat_id,
      build_version = 'v1.229.79',
      build_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_media_id;
  END IF;

  -- 4. Register or Update Companion Worksheet Item
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-decimal-hub-worksheet.html'
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
      '📝 ใบงานคลังทศนิยม ป.4–ป.5 — Math Decimal Studio',
      'ใบงานคลังทศนิยม ป.4–ป.5 คลังโจทย์ 40+ ข้อ ครอบคลุมการอ่านค่าประจำหลัก เปรียบเทียบ บวกลบ และเงินบาท/สตางค์ พร้อมเฉลยครูและพิมพ์ A4',
      '/games/math/math-decimal-hub-worksheet.html',
      '/games/math/math-decimal-hub/cover.png',
      'คณิตศาสตร์',
      ARRAY['ป.4', 'ป.5']::text[],
      ARRAY['ใบงาน', 'คณิตศาสตร์', 'ทศนิยม', 'เงิน', 'ป.4', 'ป.5', 'A4 print']::text[],
      163,
      false,
      true,
      'v1.229.79',
      NOW(),
      NOW()
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '📝 ใบงานคลังทศนิยม ป.4–ป.5 — Math Decimal Studio',
      description = 'ใบงานคลังทศนิยม ป.4–ป.5 คลังโจทย์ 40+ ข้อ ครอบคลุมการอ่านค่าประจำหลัก เปรียบเทียบ บวกลบ และเงินบาท/สตางค์ พร้อมเฉลยครูและพิมพ์ A4',
      thumbnail_url = '/games/math/math-decimal-hub/cover.png',
      subject = 'คณิตศาสตร์',
      grade_levels = ARRAY['ป.4', 'ป.5']::text[],
      tags = ARRAY['ใบงาน', 'คณิตศาสตร์', 'ทศนิยม', 'เงิน', 'ป.4', 'ป.5', 'A4 print']::text[],
      sort_order = 163,
      tracked_game = false,
      is_published = true,
      category_id = v_worksheet_cat_id,
      build_version = 'v1.229.79',
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
    'Math Decimal Learning Studio (ป.4–ป.5)',
    ARRAY[
      'Mode 1: Place Value & Reading Studio — ตารางค่าประจำหลัก (หลักสิบ, หน่วย, ส่วนสิบ, ส่วนร้อย, ส่วนพัน) พร้อมโมเดลกริด 10 และ 100 ช่องระบายสีและเสียงอ่านไทย',
      'Mode 2: Decimal Comparison & Number Line — เปรียบเทียบทศนิยมด้วยโมเดลพื้นที่และเส้นจำนวนซูมได้ พร้อมแจกแจงค่าตามหลักทีละหลัก',
      'Mode 3: Operations & Thai Money Lab — การบวกลบตั้งจุดตรงกัน พร้อมห้องแล็บจำลองธนบัตรและเหรียญบาท/สตางค์',
      'Mode 4: Practice Quiz & Fraction-Decimal Match — แบบทดสอบทศนิยมเก็บสตรีค และมินิเกมจับคู่เศษส่วนกับทศนิยม',
      'Classroom-First UI & Smartboard Shortcuts (Space, 1-4, Arrow keys, KeyF) ไร้แนวนอนล้นบนทุกขนาดจอ',
      'Touch-Target Verified >= 44x44px รองรับจอสัมผัสแท็บเล็ตและสมาร์ตบอร์ด',
      'Custom 16:9 Cover Art 1280x720 ธีม Chibi วิทย์-คณิต ปลอดภัยไร้ความรุนแรง',
      'Synchronized 40+ item A4 companion worksheet with teacher answer keys and QR linking'
    ]::text[],
    'v1.229.79',
    'Upgraded from basic prototype to production-grade interactive Studio aligning with Basic Education Core Curriculum (ค 1.1 ป.4/5, ค 1.1 ป.4/6, ค 1.1 ป.5/1, ค 1.1 ป.5/8)',
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
    'ใบงาน Math Decimal Learning Studio ป.4–ป.5',
    ARRAY[
      'พิมพ์ A4 สัดส่วนมาตรฐาน ไร้การเลื่อนบรรทัด (Zero-shift)',
      'คลังโจทย์ 40+ ข้อ ครอบคลุมการอ่านค่าประจำหลัก เปรียบเทียบ บวกลบ และเงินบาท/สตางค์',
      'ตัวกรองหัวข้อโจทย์เพื่อปรับใช้ตามบทเรียนในห้องเรียน',
      'QR Code สแกนตรงสู่สื่อการสอน Math Decimal Learning Studio',
      'เฉลยคำตอบสำหรับครูผู้สอนแบบ Zero-shift'
    ]::text[],
    'v1.229.79',
    'ใบงานคู่สื่อ Math Decimal Learning Studio ป.4–ป.5',
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
    'ค 1.1 ป.4/5',
    'ค 1.1 ป.4/6',
    'ค 1.1 ป.5/1',
    'ค 1.1 ป.5/8'
  ]::text[])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_worksheet_id, ci.id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = ANY (ARRAY[
    'ค 1.1 ป.4/5',
    'ค 1.1 ป.4/6',
    'ค 1.1 ป.5/1',
    'ค 1.1 ป.5/8'
  ]::text[])
  ON CONFLICT DO NOTHING;

END $$;

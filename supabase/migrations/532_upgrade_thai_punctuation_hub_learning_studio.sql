-- Migration 532: Upgrade Thai Punctuation Hub to Learning Studio (ป.3–ป.5) and Synchronize Companion Worksheet
-- Updates /games/thai/thai-punctuation-hub/index.html and /games/thai/thai-punctuation-hub-worksheet.html
-- Replaces placeholder thumbnail '/games/media-lab-assets/learning-scene.svg' with '/games/thai/thai-punctuation-hub/cover.png'
-- Upgrades to 4 interactive studio modes: Punctuation Explorer, Sentence Inspector, Fixer Lab, and Practice Quiz
-- Connects curriculum indicators ท 4.1 ป.3/6, ท 4.1 ป.4/2, ท 2.1 ป.3/1, ท 2.1 ป.4/1, ท 2.1 ป.5/1

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

  -- 3. Register or Update Media Item: Thai Punctuation Learning Studio
  SELECT id INTO v_media_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-punctuation-hub/index.html'
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
      '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
      'สตูดิโอเรียนรู้เครื่องหมายวรรคตอนไทย 10 ชนิด (ไม้ยมก, ไปยาลน้อย, ไปยาลใหญ่, อัศเจรีย์, ปรัศนี, อัญประกาศ, นขลิขิต, ยัติภังค์, มหัพภาค, ทับ) พร้อมสแกนเนอร์ในประโยค, ห้องแล็บซ่อมประโยค และแบบทดสอบท้าทาย พร้อมเสียงอ่านสังเคราะห์ภาษาไทย',
      '/games/thai/thai-punctuation-hub/index.html',
      '/games/thai/thai-punctuation-hub/cover.png',
      'ภาษาไทย',
      ARRAY['ป.3', 'ป.4', 'ป.5']::text[],
      ARRAY['ภาษาไทย', 'เครื่องหมายวรรคตอน', 'วรรคตอนไทย', 'ป.3', 'ป.4', 'ป.5', 'learning studio']::text[],
      116,
      false,
      true,
      'v1.229.84',
      NOW(),
      NOW()
    ) RETURNING id INTO v_media_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
      description = 'สตูดิโอเรียนรู้เครื่องหมายวรรคตอนไทย 10 ชนิด (ไม้ยมก, ไปยาลน้อย, ไปยาลใหญ่, อัศเจรีย์, ปรัศนี, อัญประกาศ, นขลิขิต, ยัติภังค์, มหัพภาค, ทับ) พร้อมสแกนเนอร์ในประโยค, ห้องแล็บซ่อมประโยค และแบบทดสอบท้าทาย พร้อมเสียงอ่านสังเคราะห์ภาษาไทย',
      thumbnail_url = '/games/thai/thai-punctuation-hub/cover.png',
      subject = 'ภาษาไทย',
      grade_levels = ARRAY['ป.3', 'ป.4', 'ป.5']::text[],
      tags = ARRAY['ภาษาไทย', 'เครื่องหมายวรรคตอน', 'วรรคตอนไทย', 'ป.3', 'ป.4', 'ป.5', 'learning studio']::text[],
      sort_order = 116,
      tracked_game = false,
      is_published = true,
      category_id = v_media_cat_id,
      build_version = 'v1.229.84',
      build_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_media_id;
  END IF;

  -- 4. Register or Update Companion Worksheet Item
  SELECT id INTO v_worksheet_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-punctuation-hub-worksheet.html'
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
      '✒️ ใบงานเครื่องหมายวรรคตอน ป.3–ป.5 — Thai Punctuation Studio',
      'ใบงานคลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 คลังโจทย์ 50 ข้อ ครอบคลุม 10 เครื่องหมายวรรคตอนไทย การแก้ประโยคและอธิบายหน้าที่ พร้อมเฉลยครูและพิมพ์ A4',
      '/games/thai/thai-punctuation-hub-worksheet.html',
      '/games/thai/thai-punctuation-hub/cover.png',
      'ภาษาไทย',
      ARRAY['ป.3', 'ป.4', 'ป.5']::text[],
      ARRAY['ใบงาน', 'ภาษาไทย', 'เครื่องหมายวรรคตอน', 'ป.3', 'ป.4', 'ป.5', 'A4 print']::text[],
      181,
      false,
      true,
      'v1.229.84',
      NOW(),
      NOW()
    ) RETURNING id INTO v_worksheet_id;
  ELSE
    UPDATE public.educational_hub_items
    SET
      title = '✒️ ใบงานเครื่องหมายวรรคตอน ป.3–ป.5 — Thai Punctuation Studio',
      description = 'ใบงานคลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 คลังโจทย์ 50 ข้อ ครอบคลุม 10 เครื่องหมายวรรคตอนไทย การแก้ประโยคและอธิบายหน้าที่ พร้อมเฉลยครูและพิมพ์ A4',
      thumbnail_url = '/games/thai/thai-punctuation-hub/cover.png',
      subject = 'ภาษาไทย',
      grade_levels = ARRAY['ป.3', 'ป.4', 'ป.5']::text[],
      tags = ARRAY['ใบงาน', 'ภาษาไทย', 'เครื่องหมายวรรคตอน', 'ป.3', 'ป.4', 'ป.5', 'A4 print']::text[],
      sort_order = 181,
      tracked_game = false,
      is_published = true,
      category_id = v_worksheet_cat_id,
      build_version = 'v1.229.84',
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
    'Thai Punctuation Learning Studio (ป.3–ป.5)',
    ARRAY[
      'Mode 1: Punctuation Studio & Explorer — คลังเรียนรู้เครื่องหมายวรรคตอนไทย 10 ชนิด (ไม้ยมก, ไปยาลน้อย, ไปยาลใหญ่, อัศเจรีย์, ปรัศนี, อัญประกาศ, นขลิขิต, ยัติภังค์, มหัพภาค, ทับ) พร้อมการ์ดอธิบายหน้าที่ วิธีอ่าน และข้อควรระวัง',
      'Mode 2: Sentence Inspector — สแกนเนอร์ตรวจจับเครื่องหมายในประโยคแบบ Interactive แสดงวิธีอ่านออกเสียงที่ถูกต้องตามหลักราชบัณฑิตยสภา',
      'Mode 3: Punctuation Fixer Lab — ห้องปฏิบัติการซ่อมประโยคและเติมเครื่องหมายวรรคตอนที่หายไป พร้อมระบบตรวจคำตอบทันที',
      'Mode 4: Practice Quiz Challenge — แบบทดสอบท้าทาย 4 ตัวเลือก ตรงตามตัวชี้วัด ท 4.1 ป.3/6 และ ท 4.1 ป.4/2 พร้อมคำอธิบายเฉลยละเอียด',
      'Classroom-First UI & Smartboard Shortcuts (Space, 1-4, Arrow keys, KeyF) ไร้แนวนอนล้นบนทุกขนาดจอ',
      'Touch-Target Verified >= 44x44px รองรับสมาร์ตบอร์ดและแท็บเล็ตนักเรียน',
      'Custom 16:9 Cover Art 1280x720 ธีมเครื่องหมายวรรคตอนไทยสีสันสดใสคมชัดสูง',
      'Synchronized 50-item A4 companion worksheet with zero-shift keys and QR linking'
    ]::text[],
    'v1.229.84',
    'Upgraded from basic flashcard prototype to production-grade interactive Studio aligning with Basic Education Core Curriculum (ท 4.1 ป.3/6, ท 4.1 ป.4/2, ท 2.1 ป.3/1, ท 2.1 ป.4/1, ท 2.1 ป.5/1)',
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
    'ใบงาน Thai Punctuation Studio ป.3–ป.5',
    ARRAY[
      'พิมพ์ A4 สัดส่วนมาตรฐาน ไร้การเลื่อนบรรทัด (Zero-shift)',
      'คลังโจทย์ 50 ข้อ ครอบคลุม 5 ทักษะวรรคตอนหลัก (ไม้ยมก/ไปยาล, อัศเจรีย์/ปรัศนี, อัญประกาศ/นขลิขิต, ยัติภังค์/มหัพภาค/ทับ, ซ่อมประโยคและเลือกใช้)',
      'ตัวกรองหัวข้อโจทย์เพื่อปรับใช้ตามระดับชั้นและเนื้อหาในห้องเรียน (ป.3, ป.4, ป.5, รวม)',
      'QR Code สแกนตรงสู่สื่อการสอน Thai Punctuation Learning Studio',
      'เฉลยคำตอบสำหรับครูผู้สอนแบบ Zero-shift'
    ]::text[],
    'v1.229.84',
    'ใบงานคู่สื่อ Thai Punctuation Studio ป.3–ป.5',
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
    'ท 4.1 ป.3/6',
    'ท 4.1 ป.4/2',
    'ท 2.1 ป.3/1',
    'ท 2.1 ป.4/1',
    'ท 2.1 ป.5/1'
  ]::text[])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_worksheet_id, ci.id
  FROM public.curriculum_indicators ci
  WHERE ci.indicator_code = ANY (ARRAY[
    'ท 4.1 ป.3/6',
    'ท 4.1 ป.4/2',
    'ท 2.1 ป.3/1',
    'ท 2.1 ป.4/1',
    'ท 2.1 ป.5/1'
  ]::text[])
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- Migration 317: Seed Math Fraction Hub — เศษส่วน ป.4 (media)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/math-fraction-hub/index.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  SELECT id INTO v_cat_media
  FROM public.educational_hub_categories WHERE category_key = 'media';

  IF v_cat_media IS NULL THEN
    RAISE EXCEPTION 'category "media" not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, thumbnail_url, sort_order)
  SELECT
    v_staff_id,
    v_cat_media,
    'link',
    '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    'สื่อคณิตศาสตร์ ป.4: แท่งเศษส่วน เทียบเศษส่วน บวกลบตัวสะดาด จำนวนเต็ม+เศษส่วน — สุ่มโจทย์และแสดงเฉลยพร้อมคำอธิบาย',
    v_url,
    'คณิตศาสตร์',
    ARRAY['ป.4','ป.5'],
    ARRAY['เศษส่วน','แท่งเศษส่วน','บวกเศษส่วน','ลบเศษส่วน','จำนวนคละ','คณิตศาสตร์','ป.4'],
    '/games/math/math-fraction-hub/cover.png',
    13
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url
  ORDER BY created_at LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item math-fraction-hub not found after insert';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'สื่อเศษส่วน ป.4 — แท่งภาพ + โจทย์สุ่ม',
    ARRAY[
      '5 เรื่อง: แท่งเศษส่วน · เทียบเศษส่วน · บวกตัวสะดาด · ลบตัวสะดาด · จำนวนเต็ม+เศษส่วน',
      'แท่งภาพ CSS แบ่งส่วนเท่า ๆ · คำอธิบายภาษาไทยทีละขั้น',
      'ระดับสุ่ม ง่าย/ป.4/ท้าทาย · กำหนดตัวเศษ-ตัวส่วนเอง (โหมดแท่ง)',
      'แนวเดียวกับสื่อค่าประมาณ (rounding.html) · KAMPAI SDK'
    ],
    'v1.0.0',
    'Math Fraction Hub initial release — teaching media ป.4'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

-- ============================================================================
-- Migration 201: Seed "ค่าประมาณเต็มสิบ/ร้อย/พัน" → คลังสื่อการสอน (media)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/math/rounding.html
-- Category: media (คลังสื่อการสอน) — NOT a tracked game
-- Idempotent: re-run keeps count stable (NOT EXISTS guard)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/math/rounding.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve media (คลังสื่อการสอน) category
  SELECT id INTO v_cat_media
  FROM public.educational_hub_categories WHERE category_key = 'media';

  IF v_cat_media IS NULL THEN
    RAISE EXCEPTION 'category "media" not found';
  END IF;

  -- 3. Ensure profile is active
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- 4. Seed item (idempotent)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order)
  SELECT
    v_staff_id,
    v_cat_media,
    'link',
    '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    'สื่อการสอนคณิตศาสตร์ เรื่องค่าประมาณเป็นจำนวนเต็มสิบ เต็มร้อย เต็มพัน พร้อมระบบสุ่มโจทย์และแสดงเฉลยอัตโนมัติ',
    v_url,
    'คณิตศาสตร์',
    ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['ค่าประมาณ','ปัดเศษ','เต็มสิบ','เต็มร้อย','เต็มพัน','คณิตศาสตร์'],
    10
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  RAISE NOTICE 'Seeded rounding media for staff_id=%, media items=%',
    v_staff_id,
    (SELECT COUNT(*) FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND category_id = v_cat_media);
END $$;

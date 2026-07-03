-- ============================================================================
-- Migration 290: Seed Thai Script Hub — ไตรยางศ์ & อักษร 3 หมู่ (media)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/thai/thai-script-hub/index.html';
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
    '🔤 คลังอักษรไทย — ไตรยางศ์ & อักษร 3 หมู่',
    'สื่อการสอนภาษาไทย ป.1-4: พยัญชนะสูง/กลาง/ต่ำ สระ วรรณยุกต์ ไตรยางศ์ อักษรนำ มาตราสะกด — 7 โหมดฝึก',
    v_url,
    'ภาษาไทย',
    ARRAY['ป.1','ป.2','ป.3','ป.4'],
    ARRAY['พยัญชนะ','สระ','วรรณยุกต์','อักษรกลาง สูง ต่ำ','ไตรยางศ์','อักษรนำ','มาตราตัวสะกด'],
    '/games/thai/thai-script-hub/cover.svg',
    11
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url
  ORDER BY created_at LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item thai-script-hub not found after insert';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'คลังอักษรไทย ป.1-4 — ไตรยางศ์ พยัญชนะ 3 หมู่ สระ วรรณยุกต์',
    ARRAY[
      '12 หมวด 188 รายการ — พยัญชนะ 44 สระ วรรณยุกต์ ไตรยางศ์',
      'ป.4: อักษรนำ หลักออกเสียง 3 หมู่ มาตราสะกด ไตรยางศ์ขั้นสูง',
      'โหมด: ภาพรวม สุ่มการ์ด ทายหมู่/กฎ ฟังทาย เขียนตามบอก ทายความหมาย จับคู่',
      'TTS อ่านชื่ออักษร + อ่านอัตโนมัติ + Flash deck progress',
      'ตัวกรองชั้น ป.1-ป.4 · badge สีหมู่อักษร'
    ],
    'v1.0.0',
    'Thai Script Hub initial release — triyang + 3 consonant classes ป.1-4'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

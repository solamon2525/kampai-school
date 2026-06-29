-- ============================================================================
-- Migration 276: Thai Vocab Hub — 1,500 คำ (100/หมวด × 15 หมวด) + โครงสร้าง data/
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_item_id   UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id
    AND external_url = '/games/thai/thai-vocab-hub/index.html';

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item "thai-vocab-hub" not found';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'การ์ดคำศัพท์ภาษาไทย ป.4-6 ทบทวนสะกดคำ ความหมาย และหลักภาษา',
    ARRAY[
      'คลังคำศัพท์ 15 หมวด 1,500 คำ (100 คำ/หมวด ป.4-6)',
      'โหมดดูภาพรวม: กริดเต็มจอ การ์ดพลิก + เลือกขนาดกริด 3×3–7×7',
      'เขียนตามคำบอก + ทายความหมาย + จับคู่คำอ่าน',
      'ข้อมูลแยกไฟล์ data/words/*.json + build script',
      'สังเคราะห์เสียงพูดภาษาไทยผ่าน Web Speech API'
    ],
    'v1.3.0',
    'ขยายฐานข้อมูลเป็น 1,500 คำ (100/หมวด) — โครงสร้าง data/ + validate/build scripts'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

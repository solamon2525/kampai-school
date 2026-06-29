-- ============================================================================
-- Migration 275: Update game_docs — Thai Vocab Hub selectable grid size (3×3–7×7)
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
      'คลังคำศัพท์ 15 หมวด ~596 คำ (ป.4-6)',
      'โหมดดูภาพรวม: กริดเต็มจอ การ์ดพลิกดูคำอ่าน+ความหมาย',
      'เลือกขนาดกริดได้ (อัตโนมัติ, 3×3–7×7) ตัวอักษรขยายตามการ์ด',
      'เขียนตามคำบอก + ทายความหมาย + จับคู่คำอ่าน',
      'สังเคราะห์เสียงพูดภาษาไทยผ่าน Web Speech API'
    ],
    'v1.2.1',
    'เพิ่มตัวเลือกขนาดกริด 3×3–7×7 — การ์ดใหญ่ตัวอักษรใหญ่เต็มการ์ด (จำค่าในเครื่อง)'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

-- ============================================================================
-- Migration 284: Thai Vocab Hub v1.6.1 — กริดคำยาว + ตัวใหญ่ 3×3 + อ่านอัตโนมัติ
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
      'คลังคำศัพท์ 15 หมวด 1,500 คำ (100 คำ/หมวด)',
      'กริดทบทวน: คำยาวขยายแนวนอน span 2–3 คอลัมน์ ไม่ตัดกลางพยางค์',
      'กริด 3×3/4×4: ตัวอักษรขยายตามความสูงการ์ด (cqh) มองระยะไกลได้',
      'อ่านอัตโนมัติแบบ vocab-hub อังกฤษ: รอเสียงจบ → หน่วง → คำถัดไป',
      'โหมดอ่าน: คำ / คำ+คำอ่าน / คำ+ความหมาย / ครบ · พลิกการ์ด · หยุดชั่วคราว',
      'ไฮไลต์การ์ดปัจจุบัน + ความคืบหน้า · จำค่าหน่วง/โหมดใน localStorage'
    ],
    'v1.6.1',
    'กริดคำยาว span + ตัวใหญ่ 3×3 + อ่านอัตโนมัติ (ประยุกต์จาก vocab-hub EN)'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

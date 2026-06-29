-- ============================================================================
-- Migration 277: Thai Vocab Hub v1.4.0 — ฟิลเตอร์ชั้น + โหมดสุ่ม 20 คำ
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
      'กริดทบทวน: เลือกชั้น ป.4/5/6 + สุ่ม 20 คำ + ขนาดกริด 3×3–7×7',
      'ทุกคำมีระดับชั้น (grade) สำหรับกรอง',
      'เขียนตามคำบอก + ทายความหมาย + จับคู่คำอ่าน',
      'ข้อมูลแยก data/words/*.json + build/validate/tag scripts'
    ],
    'v1.4.0',
    'เฟส C: ฟิลเตอร์ชั้นเรียน + โหมดสุ่ม 20 คำ — tag grade ครบ 1,500 คำ'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

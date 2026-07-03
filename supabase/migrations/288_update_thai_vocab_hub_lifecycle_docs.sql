-- ============================================================================
-- Migration 288: Thai Vocab Hub v1.7.2 — TTS/autoplay lifecycle + perf
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
      'โหมดสุ่มการ์ด (Flash): รู้แล้ว/ทบทวน จำ localStorage + แถบความคืบหน้าหมวด',
      'โหมดฟังทายคำ: ฟังเสียงเลือกคำ — คำพ้องเสียงใช้ decoy กลุ่ม reading',
      'กรองคำที่พลาด: แบนเนอร์คลิกฝึก + ตัวกรองกริด/โหมดฝึก',
      'แดชบอร์ดนักเรียน /play/thai-vocab-hub/dashboard',
      'Quiz ตามหมวด: คำตรงข้ามจับคู่ pair_id · ลักษณนามโจทย์เติมคำ · ไวพจน์ synonym_group',
      'กริดทบทวน: พลิกหลังความหมายยาวขยายความสูงชั่วคราว แทน scrollbar',
      'lifecycle: หยุด TTS/autoplay เมื่อออกเกม ซ่อนแท็บ หรือ navigate — ลดกระตุก ResizeObserver'
    ],
    'v1.7.2',
    'disposeGameSession + speechGen cancel + debounced grid resize (fix background TTS/jank)'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

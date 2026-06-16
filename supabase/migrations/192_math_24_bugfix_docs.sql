-- ============================================================================
-- Migration 192: เกม 24 แต้ม (math-24) — bugfix + game_docs
-- ============================================================================
-- แก้บั๊กจาก /hunt-game-bugs (เกม legacy ก่อนยุค SDK):
--   #1 wrap inline gameEnd → function sendGameEnd() + GAME_SLUG (ผ่าน verify gate)
--   #2 การ์ดเศษส่วนโชว์ "≈" (engine คิดค่าเต็ม — กันเด็กงง)
--   #3 sendGameEnd กัน STUDENT_CODE ว่าง + จอจบบอกผลบันทึกตามจริง
--   #4 newId ใช้ counter แทน Date.now() (กัน id ชน)
--   #5 ล็อก input ระหว่างหน่วงเปลี่ยนข้อ (victory/fail transition)
--   #6 generateSolvableSet มี cap 500 รอบ + fallback
--   #7 ลบ navigation interceptor ที่ดักซ้ำใน Section A
-- game_docs: ไม่เคยมี (เกม legacy migration 062) → insert + ตั้งเวอร์ชัน
-- Idempotent
-- ============================================================================

DO $$
DECLARE
  v_staff_id UUID;
  v_item_id  UUID;
  v_url      TEXT := '/games/math/24.html';
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
  WHERE external_url = v_url
  ORDER BY (owner_staff_id = v_staff_id) DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'game item for math-24 not found (run migration 062 first)';
  END IF;

  -- ยืนยัน slug/flags (idempotent — กันหลุด)
  UPDATE public.educational_hub_items
  SET game_slug = 'math-24', tracked_game = true, is_published = true, updated_at = now()
  WHERE id = v_item_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT v_item_id, owner_staff_id,
    'ปริศนาคณิต — ยุบรวมการ์ด 4 ใบด้วย +−×÷ ให้ได้ 24',
    ARRAY[
      'สุ่มโจทย์ที่แก้ได้ 100% + ปุ่มดูคำใบ้/เฉลย',
      'ยุบรวมการ์ดทีละคู่ (รองรับเศษส่วน, ตรวจด้วย EPS)',
      'จับเวลา 90 วิ + คะแนน +100/ข้อ, ข้ามข้อ −20',
      'เสียง Web Audio เอง (tap/combine/correct/wrong/hint) + คอนเฟตติ',
      'leaderboard drop-in + ส่งคะแนน gameEnd เข้าระบบ'
    ],
    'v1.1.0',
    'แก้บั๊ก hunt: #1 sendGameEnd+GAME_SLUG (ผ่าน verify), #2 โชว์ ≈ เศษส่วน, #3 กัน STUDENT_CODE ว่าง, #4 counter id, #5 ล็อก input transition, #6 cap solver, #7 ลบ interceptor ซ้ำ'
  FROM public.educational_hub_items WHERE id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

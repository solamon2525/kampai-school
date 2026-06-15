-- ============================================================================
-- Migration 188: ตกปลามาตราตัวสะกด (fishing) — bugfix + game_docs
-- ============================================================================
-- แก้บั๊กจาก /hunt-game-bugs:
--   #1 การ์ดโปรไฟล์โชว์สถิติจาก localStorage → ใช้ KAMPAI.stats (PB/plays/XP จริง)
--   #2 ปลาผิดคลิกซ้ำได้ → เสียชีวิตรัวจากตัวเดียว → ลบปลาผิดหลังเอฟเฟกต์
--   #3 ลบ dead UI #combo-display / ui.combo
--   #4 ใช้ config.STAR_THRESHOLDS (เลิก hardcode 140/220)
--   #5 max_combo ส่งค่าสูงสุดจริง (เดิมส่ง combo ปัจจุบันที่รีเซ็ตตอนผิด)
--   #7 กัน scoring ปลาที่ auto-despawn ระหว่างสายเบ็ดกำลังลง
-- game_docs: migration 166 ไม่ได้ลง → insert ครั้งแรก + ตั้งเวอร์ชัน
-- Idempotent
-- ============================================================================

DO $$
DECLARE
  v_staff_id UUID;
  v_item_id  UUID;
  v_url      TEXT := '/games/thai/fishing/index.html';
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
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'game item for fishing not found (run migration 166 first)';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'ตกปลา/เล็งคลิก — เลือกปลาที่มีตัวสะกดตรงมาตราเป้าหมาย',
    ARRAY[
      '5 ด่านมาตราตัวสะกด (กก/กน/กม/กด/กบ)',
      'ระบบคอมโบ + ชีวิต 3 + โปรเกรสบาร์ผ่านด่าน',
      'TTS อ่านมาตรา/คำที่ถูก + เสียงสังเคราะห์ + BGM (calm)',
      'จอสรุปดาว 1-3 + EXP + leaderboard ผ่าน KAMPAI SDK',
      'รองรับ standalone (ตั้งชื่อเอง) + embed (ดึงชื่อ/สถิติจากระบบ)'
    ],
    'v1.1.0',
    'แก้บั๊ก hunt: #1 การ์ดใช้ KAMPAI.stats, #2 ปลาผิดลบหลังเอฟเฟกต์, #3 ลบ dead combo UI, #4 ใช้ STAR_THRESHOLDS, #5 max_combo จริง, #7 กัน score ปลา despawn'
  )
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

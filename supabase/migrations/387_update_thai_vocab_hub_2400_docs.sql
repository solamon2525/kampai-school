-- ============================================================================
-- Migration 387: Thai Vocab Hub v1.8.0 — expand all categories to 150 words
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
      'คลังคำศัพท์ 16 หมวด 2,400 คำ (150 คำ/หมวด)',
      'ขยายทุกหมวดหลัก +50 คำ: เขียนผิด พ้องเสียง ลักษณนาม ราชาศัพท์ สำนวน ควบกล้ำ อักษรนำ ภาษาพาที ป.5 คำยาก คำยืม มาตราตัวสะกด ไวพจน์ คำตรงข้าม คำเป็น-คำตาย คำซ้ำ-คำซ้อน',
      'เพิ่ม metadata difficulty ในคำชุดใหม่เพื่อรองรับตัวกรอง/แผน adaptive review ระยะยาว',
      'ปรับ tooling เป้าหมาย 150 คำ/หมวด + validator ให้ warning คำซ้ำข้ามหมวดไม่ทำให้ strict fail',
      'คง pipeline เดิม: แก้ source JSON → enrich metadata → build data.js → sync DB ด้วย seed:thai-vocab',
      'แดชบอร์ดนักเรียน /play/thai-vocab-hub/dashboard และรายงานคำพลาดครู/ผู้ปกครองยังใช้ชุดข้อมูลเดิม'
    ],
    'v1.8.0',
    'ขยายคลังคำศัพท์ทุกหมวดเป็น 150 คำต่อหมวด รวม 2,400 คำ และปรับ validator/build target สำหรับ roadmap ระยะยาว'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;

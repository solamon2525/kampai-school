-- Migration 403: Math 24 thinking media — larger numbers, fresh random set, integer-only division (v1.1.0)
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-24-thinking-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item math-24-thinking-media not found';
  END IF;

  UPDATE public.game_docs
  SET version = 'v1.1.0',
      features = ARRAY[
        'กรอกตัวเลข 4 ตัว (1–13) พร้อมการ์ดตัวเลขขนาดใหญ่',
        'สุ่มโจทย์ที่ทำได้อัตโนมัติเมื่อเปิดและสุ่มใหม่ด้วยปุ่มลูกเต๋า',
        'หลีกเลี่ยงชุดโจทย์ล่าสุดด้วย localStorage',
        'แสดงวิธีคิดทีละขั้นโดยการหารต้องลงตัวทุกขั้น',
        'ฟังอธิบาย TTS',
        'ลิงก์ไปเล่นเกม math-24'
      ],
      notes = 'v1.1.0: ตัวเลขใหญ่ขึ้น สุ่มโจทย์ใหม่เมื่อเปิด และไม่ใช้ผลหารทศนิยมในเฉลย',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs math-24-thinking-media not found';
  END IF;
END $$;

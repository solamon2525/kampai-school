-- 476: Upgrade the existing mixed-number worksheet to bidirectional 8-question practice.
DO $$
DECLARE
  v_item_id uuid;
  v_owner_id uuid;
BEGIN
  SELECT id, owner_staff_id INTO v_item_id, v_owner_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/improper-to-mixed-worksheet.html'
  ORDER BY created_at
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'improper-to-mixed worksheet item not found';
  END IF;

  UPDATE public.educational_hub_items
  SET title = '📝 ใบงานแปลงเศษเกินและจำนวนคละ ป.4–5',
      description = 'ใบงานพิมพ์ A4 ฝึกแปลงเศษเกินเป็นจำนวนคละและจำนวนคละเป็นเศษเกิน พร้อมวิธีทำทีละขั้น ฟอนต์ใหญ่ หน้าละ 8 ข้อ หรือ 5 ข้อพร้อมภาพ',
      tags = ARRAY['ใบงาน','เศษเกิน','จำนวนคละ','แปลงเศษส่วน','คณิตศาสตร์','ป.4','ป.5','พิมพ์ได้']::text[],
      updated_at = now()
  WHERE id = v_item_id;

  INSERT INTO public.game_docs(item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_owner_id,
    'ใบงานพิมพ์ A4 แปลงเศษเกินและจำนวนคละสองทิศทาง',
    ARRAY[
      'หน้าละ 8 ข้อ (2 คอลัมน์ x 4 แถว) หรือ 5 ข้อพร้อมภาพ SVG',
      'เลือกเศษเกินเป็นจำนวนคละ จำนวนคละเป็นเศษเกิน หรือผสมสองทิศทาง',
      'ขั้นตอนเติมคำตอบทุกค่า: ตั้งหาร/ตรวจสอบ/ย่อ หรือคูณ/บวกตัวเศษ/คงตัวส่วน',
      'สร้างชุดได้ 1, 2, 3, 5, 10 หน้า พร้อม deterministic seed และ saved set',
      'เฉลยครูทีละข้อ ก่อนหน้า/ถัดไป/ทั้งหมด และคีย์บอร์ด'
    ],
    'v1.1.0',
    'อัปเกรดรายการเดิม ไม่สร้าง catalog URL ซ้ำ; paired media = mixed-number-media'
  )
  ON CONFLICT(item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

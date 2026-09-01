-- Migration 488: document four varied short-division practice question types
DO $$
DECLARE
  v_media_id uuid;
  v_media_owner uuid;
BEGIN
  SELECT id, owner_staff_id INTO v_media_id, v_media_owner
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/short-division-thinking-media.html'
  ORDER BY created_at
  LIMIT 1;

  IF v_media_id IS NULL THEN
    RAISE EXCEPTION 'short-division paired media not found';
  END IF;

  UPDATE public.educational_hub_items
  SET description = 'สื่อสอนหารสั้นทีละหลักพร้อมตัวทด เสียงอธิบาย โหมดจอใหญ่ และฝึกโจทย์หารจริง 4 รูปแบบ รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก',
      tags = ARRAY['การหาร','หารสั้น','วิธีคิด','ตัวทด','ฝึกสั้น','จอใหญ่','คณิตศาสตร์','ป.4','ป.5','ป.6','สื่อการสอน']::text[],
      updated_at = now()
  WHERE id = v_media_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนการหารสั้นแบบโต้ตอบทีละขั้น พร้อมโหมดฝึกโจทย์จริงและโหมดนำเสนอ',
    ARRAY[
      'สาธิตการหารจากซ้ายไปขวาและเขียนผลหารตรงหลัก',
      'แสดงเศษเป็นตัวทดขนาดเล็กหน้าหลักถัดไป',
      'รองรับตัวตั้ง 2–6 หลักและตัวหาร 1–2 หลัก พร้อม preset 2x1 ถึง 6x2',
      'ฝึก 4 รูปแบบ: คำตอบเต็ม เศษสุดท้าย เลขผลหารรายหลัก และเศษที่นำไปทด',
      'ถุงสุ่มหมุนครบทั้ง 4 รูปแบบก่อนเริ่มรอบใหม่ และกระจายโจทย์ลงตัว/มีเศษเท่ากัน',
      'โจทย์ฝึกซิงก์กับช่องตัวตั้งและตัวหาร เพื่อเปิดดูขั้นตอนของข้อเดิมในโหมดสอน',
      'ตัวเลือกไม่ซ้ำ อยู่ในช่วงที่เป็นไปได้ และมีคำอธิบายเหตุผลหลังตอบ',
      'โหมดจอใหญ่ซ่อนแผงตั้งค่าและปรับขนาดอัตโนมัติได้สูงสุด 300%'
    ],
    'v1.3.0',
    'แทนโจทย์ตรวจด้วยการคูณในโหมดฝึกสั้นด้วยโจทย์หารจริงหลายรูปแบบตาม preset ของครู'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

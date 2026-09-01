-- Migration 490: document adaptive large typography for short-division practice
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
  SET description = 'สื่อสอนหารสั้นทีละหลักพร้อมตัวทด เสียงอธิบาย โหมดจอใหญ่ และโหมดฝึกฟอนต์ขนาดใหญ่สำหรับจอห้องเรียน รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก',
      tags = ARRAY['การหาร','หารสั้น','วิธีคิด','ตัวทด','ฝึกคำตอบ','ฟอนต์ใหญ่','จอใหญ่','คณิตศาสตร์','ป.4','ป.5','ป.6','สื่อการสอน']::text[],
      updated_at = now()
  WHERE id = v_media_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนการหารสั้นแบบโต้ตอบทีละขั้น พร้อมโหมดฝึกคำตอบเต็มตัวอักษรขนาดใหญ่และโหมดนำเสนอ',
    ARRAY[
      'สาธิตการหารจากซ้ายไปขวาและเขียนผลหารตรงหลัก',
      'รองรับตัวตั้ง 2–6 หลักและตัวหาร 1–2 หลัก พร้อม preset 2x1 ถึง 6x2',
      'โหมดฝึกใช้คำถามหาคำตอบเต็มรูปแบบเดียว ทั้งโจทย์ลงตัวและมีเศษ',
      'คำถามและคำตอบโหมดฝึกขยายแบบ responsive สูงสุดประมาณ 5–7 เท่าสำหรับจอห้องเรียน',
      'แผงฝึกใช้พื้นที่ viewport และลดฟอนต์เฉพาะคำตอบยาวที่มีเศษเพื่อป้องกันข้อความแตก',
      'มี mobile typography override และไม่ล้นแนวนอนที่ความกว้าง 360px',
      'โจทย์ฝึกซิงก์กับช่องตัวตั้งและตัวหาร เพื่อเปิดดูขั้นตอนของข้อเดิมในโหมดสอน',
      'โหมดจอใหญ่สำหรับกระดานสอนปรับขนาดอัตโนมัติได้สูงสุด 300%'
    ],
    'v1.3.2',
    'ขยาย typography ของโหมดฝึกให้ใช้พื้นที่จอห้องเรียนและโปรเจกเตอร์ได้ชัดเจนขึ้น'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

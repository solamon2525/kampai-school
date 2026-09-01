-- Migration 489: simplify short-division practice to full-answer questions only
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
  SET description = 'สื่อสอนหารสั้นทีละหลักพร้อมตัวทด เสียงอธิบาย โหมดจอใหญ่ และฝึกหาคำตอบเต็ม รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก',
      tags = ARRAY['การหาร','หารสั้น','วิธีคิด','ตัวทด','ฝึกคำตอบ','จอใหญ่','คณิตศาสตร์','ป.4','ป.5','ป.6','สื่อการสอน']::text[],
      updated_at = now()
  WHERE id = v_media_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนการหารสั้นแบบโต้ตอบทีละขั้น พร้อมโหมดฝึกหาคำตอบเต็มและโหมดนำเสนอ',
    ARRAY[
      'สาธิตการหารจากซ้ายไปขวาและเขียนผลหารตรงหลัก',
      'แสดงเศษเป็นตัวทดขนาดเล็กหน้าหลักถัดไป',
      'รองรับตัวตั้ง 2–6 หลักและตัวหาร 1–2 หลัก พร้อม preset 2x1 ถึง 6x2',
      'โหมดฝึกใช้คำถามหาคำตอบเต็มรูปแบบเดียว ทั้งโจทย์ลงตัวและมีเศษ',
      'กระจายโจทย์ลงตัวและมีเศษใกล้เคียงครึ่งต่อครึ่ง',
      'โจทย์ฝึกซิงก์กับช่องตัวตั้งและตัวหาร เพื่อเปิดดูขั้นตอนของข้อเดิมในโหมดสอน',
      'ตัวเลือก 4 ข้อไม่ซ้ำ เศษน้อยกว่าตัวหาร และมีคำอธิบายหลังตอบ',
      'โหมดจอใหญ่ซ่อนแผงตั้งค่าและปรับขนาดอัตโนมัติได้สูงสุด 300%'
    ],
    'v1.3.1',
    'ลดความซับซ้อนของโหมดฝึกให้เหลือคำถามหาคำตอบเต็มชนิดเดียวตามการใช้งานในชั้นเรียน'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

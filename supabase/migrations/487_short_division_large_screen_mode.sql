-- Migration 487: document the adaptive 300% presentation mode for short-division media
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
  SET description = 'สื่อสอนหารสั้นทีละหลักพร้อมตัวทดและเสียงอธิบาย รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก และโหมดจอใหญ่ปรับขนาดได้ถึง 300%',
      tags = ARRAY['การหาร','หารสั้น','วิธีคิด','ตัวทด','จอใหญ่','คณิตศาสตร์','ป.4','ป.5','ป.6','สื่อการสอน']::text[],
      updated_at = now()
  WHERE id = v_media_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนการหารสั้นแบบโต้ตอบทีละขั้นพร้อมเสียงอ่านและโหมดนำเสนอ',
    ARRAY[
      'สาธิตการหารจากซ้ายไปขวาและเขียนผลหารตรงหลัก',
      'แสดงเศษเป็นตัวทดขนาดเล็กหน้าหลักถัดไป',
      'รองรับตัวตั้ง 2–6 หลักและตัวหาร 1–2 หลัก',
      'มี preset 2x1 ถึง 6x2 และกรอกโจทย์เองได้',
      'โหมดจอใหญ่ซ่อนแผงตั้งค่าและขยายกระดาน คำอธิบาย และปุ่มได้สูงสุด 300%',
      'ปรับ scale อัตโนมัติตาม viewport และรองรับ Fullscreen API, resize และ Esc'
    ],
    'v1.2.0',
    'เพิ่มโหมดนำเสนอสำหรับทีวี โปรเจกเตอร์ และจอ 2K/4K โดยไม่ตัดเนื้อหา'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

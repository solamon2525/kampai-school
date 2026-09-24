-- 499: ปรับสื่อหารยาวให้สอนเป็นลำดับและฝึกจากโจทย์เดียวกับกระดาน
DO $$
DECLARE
  v_media_id uuid;
  v_media_owner uuid;
BEGIN
  SELECT id, owner_staff_id INTO v_media_id, v_media_owner
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/long-division-thinking-media.html'
  ORDER BY created_at
  LIMIT 1;

  IF v_media_id IS NULL THEN
    RAISE EXCEPTION 'long-division thinking media not found';
  END IF;

  UPDATE public.educational_hub_items
  SET description = 'สื่อสอนการหารยาวทีละขั้นแบบเห็นเหตุผล: เลือกหลัก หาผลหาร คูณกลับ ลบหาเศษ และดึงหลักถัดไป รองรับโหมดฝึกจากโจทย์เดียวกับกระดานและการนำเสนอจอใหญ่',
      updated_at = now()
  WHERE id = v_media_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนตั้งหารยาวแบบโต้ตอบ พร้อม trace การคิดและแบบฝึกเชื่อมโจทย์',
    ARRAY[
      'กระดานจัดวางชิดด้านบนและปรับขนาดตามมือถือ โปรเจกเตอร์ และจอใหญ่',
      'สอนเป็นลำดับ เลือกหลัก → หาผลหาร → คูณกลับ → ลบหาเศษ → ดึงหลักถัดไป',
      'ไฮไลต์ตำแหน่งที่กำลังเรียนและจัดหลักผลหารตรงกับค่าประจำหลัก',
      'รองรับตัวตั้ง 2–4 หลัก ตัวหาร 1–2 หลัก โจทย์หารลงตัวและมีเศษ',
      'โหมดฝึกถามผลหารย่อย ผลคูณ เศษ และคำตอบสุดท้ายจากโจทย์เดียวกับกระดาน',
      'มีปุ่มย้อนกลับ ถัดไป เล่นอัตโนมัติ และฟังคำอธิบายภาษาไทย'
    ],
    'v1.1.0',
    'ปรับปรุง UX การสอนและแก้ปัญหากระดานลอยสูงเกินไป'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

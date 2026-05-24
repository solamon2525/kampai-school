-- Migration 080: Seed Natthapong Coaching Training Certificate
-- Add training record for ครูณัฐพงศ์ สิงห์ชมภู using public/coaching-cert-natthapong.jpg

DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- Resolve staff_id for ครูณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%'
    AND staff_type = 'teaching'
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE WARNING 'Teacher ครูณัฐพงศ์ สิงห์ชมภู not found — cannot seed training record';
    RETURN;
  END IF;

  -- Insert training record if it doesn't already exist
  INSERT INTO public.training_records (
    staff_id,
    course_name,
    provider,
    training_type,
    start_date,
    end_date,
    hours,
    location,
    budget,
    certificate_url,
    status,
    notes
  )
  SELECT
    v_staff_id,
    'การพัฒนาครูแนะแนวแกนนำ ระบบแนะแนวการชี้แนะ (Coaching) และการดูแลสุขภาพกายและสุขภาพจิตของผู้เรียน',
    'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 2',
    'ประชุมวิชาการ',
    '2025-08-26',
    '2025-08-26',
    3.0,
    'ออนไลน์',
    0.00,
    '/coaching-cert-natthapong.jpg',
    'ผ่านการอบรม',
    'เกียรติบัตรเลขที่ 10154/2568'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.training_records 
    WHERE staff_id = v_staff_id 
      AND course_name = 'การพัฒนาครูแนะแนวแกนนำ ระบบแนะแนวการชี้แนะ (Coaching) และการดูแลสุขภาพกายและสุขภาพจิตของผู้เรียน'
  );

END $$;

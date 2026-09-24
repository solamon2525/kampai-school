-- Migration 486: upgrade short division to an authentic step-by-step worksheet and extend its paired media
DO $$
DECLARE
  v_worksheet_id uuid;
  v_worksheet_owner uuid;
  v_media_id uuid;
  v_media_owner uuid;
BEGIN
  SELECT id, owner_staff_id INTO v_worksheet_id, v_worksheet_owner
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/short-division-worksheet.html'
  ORDER BY created_at
  LIMIT 1;

  SELECT id, owner_staff_id INTO v_media_id, v_media_owner
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/short-division-thinking-media.html'
  ORDER BY created_at
  LIMIT 1;

  IF v_worksheet_id IS NULL OR v_media_id IS NULL THEN
    RAISE EXCEPTION 'short-division worksheet or paired media not found';
  END IF;

  UPDATE public.educational_hub_items
  SET title = '📝 ใบงานการหารสั้นทีละหลัก ป.4–6',
      description = 'ใบงาน A4 ฝึกตั้งหารสั้นจริง มีช่องผลหาร ตัวทด เศษ และตรวจด้วยตัวหาร × ผลหาร + เศษ รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก',
      tags = ARRAY['ใบงาน','หารสั้น','ตั้งหาร','ตัวทด','คณิตศาสตร์','ป.4','ป.5','ป.6','พิมพ์ได้']::text[],
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      updated_at = now()
  WHERE id = v_worksheet_id;

  UPDATE public.educational_hub_items
  SET description = 'สื่อสอนหารสั้นทีละหลักพร้อมตัวทดและเสียงอธิบาย รองรับตัวตั้ง 2–6 หลัก ตัวหาร 1–2 หลัก สำหรับ ป.4–ป.6',
      tags = ARRAY['การหาร','หารสั้น','วิธีคิด','ตัวทด','คณิตศาสตร์','ป.4','ป.5','ป.6','สื่อการสอน']::text[],
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      updated_at = now()
  WHERE id = v_media_id;

  DELETE FROM public.indicator_games
  WHERE edu_hub_item_id IN (v_worksheet_id, v_media_id);

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT item_id, indicator.id
  FROM (VALUES
    (v_worksheet_id, 'ค 1.1 ป.4/9'),
    (v_worksheet_id, 'ค 1.1 ป.5/7'),
    (v_worksheet_id, 'ค 1.1 ป.6/7'),
    (v_media_id, 'ค 1.1 ป.4/9'),
    (v_media_id, 'ค 1.1 ป.5/7'),
    (v_media_id, 'ค 1.1 ป.6/7')
  ) AS mapping(item_id, indicator_code)
  JOIN public.curriculum_indicators indicator
    ON indicator.indicator_code = mapping.indicator_code
   AND indicator.is_active = true
  ON CONFLICT DO NOTHING;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_worksheet_id,
    v_worksheet_owner,
    'ใบงานพิมพ์ A4 การหารสั้นแบบกระดานตรงตามค่าประจำหลัก',
    ARRAY[
      'กระดานหารสั้นมีตัวหาร ตัวตั้ง ช่องผลหาร ตัวทด 1–2 หลัก และเศษสุดท้าย',
      'เลือก ป.4–ป.6 กำหนดเอง และคำตอบลงตัว มีเศษ หรือผสม',
      'จำนวนอัตโนมัติ 8 ข้อพื้นฐาน 6 ข้อโจทย์หลายหลัก และ 5 ข้อในโหมดพิเศษ',
      'ตรวจคำตอบด้วยตัวหาร × ผลหาร + เศษ = ตัวตั้ง',
      'deterministic seed, saved set, เฉลยก่อนหน้า/ถัดไป/ทั้งหมด และ A4 ไม่ขยับ'
    ],
    'v2.0.0',
    'แทนใบงานข้อความทั่วไปด้วย specialized short-division scaffold ที่นักเรียนเขียนทำได้จริง'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_media_id,
    v_media_owner,
    'สื่อสอนการหารสั้นแบบโต้ตอบทีละขั้นพร้อมเสียงอ่าน',
    ARRAY[
      'สาธิตการหารจากซ้ายไปขวาและเขียนผลหารตรงหลัก',
      'แสดงเศษเป็นตัวทดขนาดเล็กหน้าหลักถัดไป',
      'รองรับตัวตั้ง 2–6 หลักและตัวหาร 1–2 หลัก',
      'มี preset 2x1 ถึง 6x2 และกรอกโจทย์เองได้',
      'กริดปรับขนาดตามจำนวนหลักเพื่อไม่ให้ล้นหน้าจอ'
    ],
    'v1.1.0',
    'ขยายช่วงตัวตั้งจาก 4 เป็น 6 หลักให้ตรงกับใบงาน ป.6'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
END $$;

-- Migration 197: vocab-hub autoplay off by default + fruits Thai reading mode
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/vocab-hub.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item vocab-hub not found';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT
    i.id,
    i.owner_staff_id,
    'คลังคำศัพท์และเกมฝึกภาษาอังกฤษหลายโหมด พร้อม Math Question',
    ARRAY[
      'Math Question: What is ...? / The answer is ...',
      'ช่วงตัวเลขง่าย 1-20 / กลาง 1-100',
      'เลือกเครื่องหมายแยกปุ่ม + − × ÷ (เลือกได้หลายอัน)',
      'เลือกเสียงอ่านอังกฤษ ผู้หญิง หรือ ผู้ชาย (จำค่าในเครื่อง)',
      'เลือกเสียงอ่านต่อหมวด EN / ไทย / EN+ไทย และจำค่าแยก topic',
      'หมวด fruits สลับคำอ่านภาษาไทยได้สำหรับช่วยถอด phonics',
      'ปิดการอ่านอัตโนมัติจากการเปิดการ์ด/เปลี่ยนคำ',
      'ฝึกคิดแล้วเปิดเฉลย หรือเลือกตอบภาษาอังกฤษ 4 ตัวเลือก',
      'คะแนน streak และ metadata correct/total/difficulty/ops/voice/timeMs',
      'คลัง Numbers 1-100 และโหมดคำศัพท์เดิม'
    ],
    'v2.3.3',
    'ปิด auto-read จากการเลื่อนคำ/เปิดการ์ด และเพิ่มโหมดเสียงแยกหมวดให้ fruits สลับ EN/ไทย/EN+ไทย ได้'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();

  UPDATE public.educational_hub_items
  SET updated_at = now()
  WHERE id = v_item_id;
END $$;

DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-vocab-hub/index.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item thai-vocab-hub not found';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT
    i.id,
    i.owner_staff_id,
    'คลังคำศัพท์ภาษาไทย ป.4-6',
    ARRAY[
      'อ่านอัตโนมัติปิดเป็นค่าเริ่มต้น',
      'เลือกโหมดอ่านเองได้: ปิด / คำศัพท์ / คำ + คำอ่าน / คำ + ความหมาย / ครบ',
      'จำค่าต่อเครื่องผ่าน localStorage',
      'โหมดทบทวนยังคงสลับ card / grid / visual / dictation / match / listen ได้ครบ',
      'รักษา TTS ช่วยอ่านเมื่อผู้ใช้ตั้งใจเปิดเอง'
    ],
    'v1.9.1',
    'ปิด autoplay read mode เป็น off โดยค่าเริ่มต้น และให้ผู้ใช้เลือกโหมดอ่านเองก่อนเริ่มฟังยาว'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();

  UPDATE public.educational_hub_items
  SET updated_at = now()
  WHERE id = v_item_id;
END $$;

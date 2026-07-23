-- Migration 423: vocab-hub Math Question — male/female English voice picker
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
      'ฝึกคิดแล้วเปิดเฉลย หรือเลือกตอบภาษาอังกฤษ 4 ตัวเลือก',
      'เสียงอ่านคำถามและเฉลยภาษาอังกฤษตามเพศที่เลือก',
      'คะแนน streak และ metadata correct/total/difficulty/ops/voice/timeMs',
      'คลัง Numbers 1-100 และโหมดคำศัพท์เดิม'
    ],
    'v2.3.1',
    'เพิ่มปุ่มเลือกเสียงชาย/หญิงใน Math Question (หมวด Numbers) พร้อมจำค่า localStorage'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  UPDATE public.educational_hub_items
  SET updated_at = now()
  WHERE id = v_item_id;
END $$;

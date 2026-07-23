-- Migration 422: vocab-hub Math Question — separate + − × ÷ op buttons
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
      'ฝึกคิดแล้วเปิดเฉลย หรือเลือกตอบภาษาอังกฤษ 4 ตัวเลือก',
      'เสียงอ่านคำถามและเฉลยภาษาอังกฤษ en-US',
      'คะแนน streak และ metadata correct/total/difficulty/ops/timeMs',
      'คลัง Numbers 1-100 และโหมดคำศัพท์เดิม'
    ],
    'v2.3.0',
    'แยกปุ่มเครื่องหมาย + ลบ คูณ หาร ใน Math Question (หมวด Numbers) ให้เลือกฝึกทีละชนิดหรือผสมได้'
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

-- Migration 480: vocab-hub fruits phonics practice hints
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
      'เลือกเสียงอ่านต่อหมวด EN / ไทย / EN+ไทย และจำค่าแยก topic',
      'หมวด fruits แสดงคำอ่านภาษาไทยและตัวช่วยฝึกผสมเสียงเป็นช่วง ๆ',
      'กดฟังช่วงเสียงแต่ละส่วนได้เองเพื่อเชื่อมเสียงกับคำเต็ม',
      'ปิดการอ่านอัตโนมัติจากการเปิดการ์ด/เปลี่ยนคำ'
    ],
    'v2.3.4',
    'เพิ่มตัวช่วย phonics ใน fruits: แบ่งคำเป็นช่วงเสียง เช่น ap + ple และกดฟังทีละช่วงได้เมื่อเลือกโหมดไทยหรือ EN+ไทย'
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

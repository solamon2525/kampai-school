-- Migration 402: Thai Vocab Hub P.4 expansion — 16 categories x 200 (v2.0.0)
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

  UPDATE public.game_docs
  SET version = 'v2.0.0',
      features = array_append(
        array_remove(features, 'คลังคำศัพท์ 16 หมวด หมวดละ 150 คำ รวม 2,400 คำ'),
        'คลังคำศัพท์ 16 หมวด หมวดละ 200 คำ รวม 3,200 คำ เน้นชุดเสริมระดับ ป.4'
      ),
      notes = 'v2.0.0: เพิ่มชุดทบทวน ป.4 อีก 800 รายการ ครบทุกหมวด เปลี่ยนชื่อหมวดคำศัพท์ตามหน่วยการเรียน และคงกริด 3x3 ถึง 10x10',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs thai-vocab-hub not found';
  END IF;
END $$;

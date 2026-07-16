-- Migration 401: Thai Vocab Hub dense grid sizes through 10x10 (v1.9.0)
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
  SET version = 'v1.9.0',
      features = array_append(
        array_remove(features, 'กริดทบทวนเลือกขนาดอัตโนมัติ หรือ 3x3 ถึง 7x7'),
        'กริดทบทวนเลือกขนาดอัตโนมัติ หรือ 3x3 ถึง 10x10 พร้อม fit ตัวอักษรไม่ล้น'
      ),
      notes = 'v1.9.0: ขยายกริดทบทวนจากสูงสุด 7x7 เป็น 10x10 ลด gap/padding ตามความหนาแน่น และให้คำยาว span ได้ถึง 4 ช่อง',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs thai-vocab-hub not found';
  END IF;
END $$;

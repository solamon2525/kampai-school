-- Migration 400: begin build-metadata discipline for English Vocab Hub
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

  UPDATE public.game_docs
  SET version = 'v2.2.1',
      notes = 'v2.2.1: เริ่มใช้กฎ Build metadata บนปกหน้ารวมเกม หลังเพิ่มโหมด Math Question',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs vocab-hub not found';
  END IF;
END $$;

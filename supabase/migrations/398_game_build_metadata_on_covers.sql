-- Migration 398: public build metadata for game cover cards
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS build_version TEXT,
  ADD COLUMN IF NOT EXISTS build_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.educational_hub_items.build_version IS
  'เวอร์ชันบิลด์ล่าสุดของเกม sync จาก game_docs.version';
COMMENT ON COLUMN public.educational_hub_items.build_updated_at IS
  'วันเวลาที่บิลด์เกมล่าสุด sync เมื่อ game_docs ถูกสร้างหรืออัปเดต';

CREATE OR REPLACE FUNCTION public.sync_game_build_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.educational_hub_items
  SET build_version = NEW.version,
      build_updated_at = NEW.updated_at
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_game_build_metadata ON public.game_docs;
CREATE TRIGGER trg_sync_game_build_metadata
AFTER INSERT OR UPDATE OF version, updated_at ON public.game_docs
FOR EACH ROW
EXECUTE FUNCTION public.sync_game_build_metadata();

UPDATE public.educational_hub_items AS i
SET build_version = d.version,
    build_updated_at = d.updated_at
FROM public.game_docs AS d
WHERE d.item_id = i.id;


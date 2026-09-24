-- Migration 515: Upgrade AI & Data Literacy Media thumbnail to dedicated 16:9 illustration
DO $\$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/tech/ai-data-literacy-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/tech/ai-data-literacy-media.html';
END $\$;

-- Migration 514: Upgrade Thai Instruments Media thumbnail to dedicated 16:9 illustration
DO $\$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/arts/thai-instruments-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/arts/thai-instruments-media.html';
END $\$;

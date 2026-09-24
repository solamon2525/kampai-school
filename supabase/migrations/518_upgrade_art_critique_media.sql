-- Migration 518: Upgrade Art Critique Media thumbnail to dedicated 16:9 illustration
DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/arts/art-critique-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/arts/art-critique-media.html';
END $$;

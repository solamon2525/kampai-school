-- Migration 517: Upgrade Workplace Safety Media thumbnail to dedicated 16:9 illustration
DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/career/workplace-safety-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/career/workplace-safety-media.html';
END $$;

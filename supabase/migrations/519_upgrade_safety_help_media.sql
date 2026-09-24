-- Migration 519: Upgrade Safety & Help Media thumbnail to dedicated 16:9 illustration
DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/health/safety-help-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/health/safety-help-media.html';
END $$;

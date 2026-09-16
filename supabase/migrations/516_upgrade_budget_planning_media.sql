-- Migration 516: Upgrade Budget Planning Media thumbnail to dedicated 16:9 illustration
DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/career/budget-planning-media-cover.png',
      updated_at = now()
  WHERE external_url = '/games/career/budget-planning-media.html';
END $$;

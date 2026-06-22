-- ============================================================================
-- Migration 227: Update Missing Game Cover Thumbnails
-- ============================================================================
-- Seeding thumbnails for english-quest, tug-of-war, and wipod
-- ============================================================================

DO $$
BEGIN
  -- 1. Update english-quest cover
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/english-quest-cover.svg',
      updated_at = now()
  WHERE game_slug = 'english-quest';

  -- 2. Update tug-of-war cover
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/thai/tug-of-war-cover.svg',
      updated_at = now()
  WHERE game_slug = 'tug-of-war';

  -- 3. Update wipod cover
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/thai/wipod-cover.svg',
      updated_at = now()
  WHERE game_slug = 'wipod';
END $$;

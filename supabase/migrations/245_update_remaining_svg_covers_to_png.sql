-- ============================================================================
-- Migration 245: Update All Remaining Game Cover Extensions to PNG
-- ============================================================================
-- Replaces all remaining .svg cover image extensions with .png in the database
-- ============================================================================

DO $$
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = replace(thumbnail_url, '.svg', '.png'),
      updated_at = now()
  WHERE thumbnail_url LIKE '%.svg';
END $$;

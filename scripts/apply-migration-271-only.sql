-- apply-migration-271-only.sql
-- รันใน Supabase SQL Editor

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS game_play_style text;

COMMENT ON COLUMN public.educational_hub_items.game_play_style IS
  'แนวเกม: platformer-2d | top-down | jump | racing | shooter | puzzle | sandbox-3d';

CREATE INDEX IF NOT EXISTS idx_ehi_game_play_style
  ON public.educational_hub_items (game_play_style)
  WHERE game_play_style IS NOT NULL;

UPDATE public.educational_hub_items
SET game_play_style = 'platformer-2d'
WHERE game_slug = 'thai-sara-run';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'educational_hub_items'
  AND column_name = 'game_play_style';

-- 265_character_animation_config.sql
-- animation mapping สำหรับ sprite sheet (idle/walk/run/jump) + denormalize ลงเกม

ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS animation_config jsonb;

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_animation_config jsonb;

COMMENT ON COLUMN public.game_character_sheets.animation_config IS
  'Frame mapping: {preset, idle[], walk[], run[], jump:{up,peak,fall}, hurt, happy}';

COMMENT ON COLUMN public.educational_hub_items.character_animation_config IS
  'Denormalized animation_config จากคลัง — anon อ่านผ่าน published item';

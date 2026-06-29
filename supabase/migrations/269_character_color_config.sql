-- 269_character_color_config.sql
-- ระบบใส่สีตัวละคร (palette slots) + denormalize ลงเกม

ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS color_config jsonb;

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_color_config jsonb;

COMMENT ON COLUMN public.game_character_sheets.color_config IS
  'Palette recolor: {version, mode, slots[], slotsP2?, preset}';

COMMENT ON COLUMN public.educational_hub_items.character_color_config IS
  'Denormalized color_config จากคลัง — ส่งเข้า KAMPAI.character.color';

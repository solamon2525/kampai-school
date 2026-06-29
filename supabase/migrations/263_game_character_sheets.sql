-- 263_game_character_sheets.sql
-- คลัง sprite sheet ตัวละครกลาง + เลือกใช้รายเกม (denormalize URL บน educational_hub_items)
-- แพทเทิร์นเดียวกับ game_bgm_tracks (114)

-- 1) คลังตัวละคร
CREATE TABLE IF NOT EXISTS public.game_character_sheets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE,
  sheet_url       text NOT NULL,
  sheet_url_p2    text,
  storage_path    text NOT NULL,
  storage_path_p2 text,
  frame_width     int NOT NULL DEFAULT 128,
  frame_height    int NOT NULL DEFAULT 128,
  frame_count     int NOT NULL DEFAULT 12,
  preview_url     text,
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_character_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_sheets_select_auth" ON public.game_character_sheets;
CREATE POLICY "char_sheets_select_auth" ON public.game_character_sheets
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "char_sheets_insert_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_insert_admin" ON public.game_character_sheets
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "char_sheets_delete_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_delete_admin" ON public.game_character_sheets
  FOR DELETE USING (public.is_admin());

-- 2) คอลัมน์ per-game (denormalize เพื่อ anon อ่านผ่าน published item)
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_sheet_id uuid REFERENCES public.game_character_sheets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS character_sheet_url text,
  ADD COLUMN IF NOT EXISTS character_sheet_url_p2 text,
  ADD COLUMN IF NOT EXISTS character_frame_w int,
  ADD COLUMN IF NOT EXISTS character_frame_h int,
  ADD COLUMN IF NOT EXISTS character_frame_count int;

CREATE INDEX IF NOT EXISTS idx_ehi_character_sheet_id
  ON public.educational_hub_items (character_sheet_id)
  WHERE character_sheet_id IS NOT NULL;

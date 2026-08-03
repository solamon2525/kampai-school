-- 455_lpc_character_importer.sql
-- Universal LPC importer metadata + public attribution on assigned games.

ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_json jsonb,
  ADD COLUMN IF NOT EXISTS source_json_filename text,
  ADD COLUMN IF NOT EXISTS credits_text text,
  ADD COLUMN IF NOT EXISTS credits_filename text,
  ADD COLUMN IF NOT EXISTS license_summary text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS attribution_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

ALTER TABLE public.game_character_sheets
  DROP CONSTRAINT IF EXISTS game_character_sheets_source_kind_check;

ALTER TABLE public.game_character_sheets
  ADD CONSTRAINT game_character_sheets_source_kind_check
  CHECK (source_kind IN ('upload', 'template', 'universal-lpc'));

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_source_url text,
  ADD COLUMN IF NOT EXISTS character_credits_text text,
  ADD COLUMN IF NOT EXISTS character_license_summary text[],
  ADD COLUMN IF NOT EXISTS character_attribution_required boolean NOT NULL DEFAULT false;

-- Harden the existing admin-only policies while adding WITH CHECK to UPDATE.
DROP POLICY IF EXISTS "char_sheets_insert_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_insert_admin" ON public.game_character_sheets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "char_sheets_update_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_update_admin" ON public.game_character_sheets
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "char_sheets_delete_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_delete_admin" ON public.game_character_sheets
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

COMMENT ON COLUMN public.game_character_sheets.source_json IS
  'Original Universal LPC generator JSON retained for reproducibility.';
COMMENT ON COLUMN public.game_character_sheets.credits_text IS
  'Attribution text exported by the character generator.';
COMMENT ON COLUMN public.educational_hub_items.character_credits_text IS
  'Public denormalized character attribution displayed before gameplay.';

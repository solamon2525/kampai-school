-- Avoid evaluating auth.role() for every character sheet row.

DROP POLICY IF EXISTS "char_sheets_select_auth" ON public.game_character_sheets;

CREATE POLICY "char_sheets_select_auth" ON public.game_character_sheets
  FOR SELECT TO authenticated
  USING (true);

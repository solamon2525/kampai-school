BEGIN;

DROP POLICY IF EXISTS classroom_competitions_owner_write
  ON public.classroom_competitions;

CREATE POLICY classroom_competitions_owner_insert
  ON public.classroom_competitions
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY classroom_competitions_owner_update
  ON public.classroom_competitions
  FOR UPDATE TO authenticated
  USING (owner_user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (owner_user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY classroom_competitions_owner_delete
  ON public.classroom_competitions
  FOR DELETE TO authenticated
  USING (owner_user_id = (SELECT auth.uid()) OR public.is_admin());

COMMIT;

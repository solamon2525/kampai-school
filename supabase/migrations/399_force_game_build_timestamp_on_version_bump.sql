-- Migration 399: server-owned build timestamp whenever a game version changes
CREATE OR REPLACE FUNCTION public.stamp_game_build_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.version IS DISTINCT FROM OLD.version THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_game_build_updated_at ON public.game_docs;
CREATE TRIGGER trg_stamp_game_build_updated_at
BEFORE INSERT OR UPDATE OF version ON public.game_docs
FOR EACH ROW
EXECUTE FUNCTION public.stamp_game_build_updated_at();

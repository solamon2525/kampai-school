-- Admin-only RPC: reset game sessions (all students or specific student)
-- Used by admin UI: GamesTab (all-student reset) + GamePlayDashboard (per-student reset)
CREATE OR REPLACE FUNCTION public.admin_reset_game_sessions(
  p_game_slug   TEXT,
  p_student_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_del     INT;
  v_achievements_del INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0401';
  END IF;

  -- 1) Delete achievements linked to this game for affected students
  DELETE FROM public.game_student_achievements gsa
  WHERE gsa.achievement_id IN (
    SELECT id FROM public.game_achievements_catalog WHERE game_slug = p_game_slug
  )
  AND (p_student_id IS NULL OR gsa.student_id = p_student_id);
  GET DIAGNOSTICS v_achievements_del = ROW_COUNT;

  -- 2) Delete sessions
  DELETE FROM public.game_sessions
  WHERE game_slug = p_game_slug
    AND (p_student_id IS NULL OR student_id = p_student_id);
  GET DIAGNOSTICS v_sessions_del = ROW_COUNT;

  RETURN jsonb_build_object(
    'sessions_deleted',     v_sessions_del,
    'achievements_deleted', v_achievements_del
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_game_sessions(TEXT, UUID) TO authenticated;

-- 392_reset_research_student_scores.sql
-- รีเซ็ตคะแนนสอบรายบุคคลในงานวิจัยเกม โดยจำกัดสิทธิ์เฉพาะเจ้าของโครงการหรือแอดมิน

CREATE OR REPLACE FUNCTION public.reset_research_student_scores(
  p_study_id   UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_study public.game_research_studies%ROWTYPE;
  v_sessions_deleted INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0401';
  END IF;

  SELECT * INTO v_study
  FROM public.game_research_studies
  WHERE id = p_study_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'study_not_found');
  END IF;

  IF NOT (
    public.is_admin()
    OR v_study.owner_staff_id IN (
      SELECT staff_id
      FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0401';
  END IF;

  DELETE FROM public.game_sessions
  WHERE research_study_id = p_study_id
    AND student_id = p_student_id;
  GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'student_id', p_student_id,
    'sessions_deleted', v_sessions_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_research_student_scores(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_research_student_scores(UUID, UUID) TO authenticated;

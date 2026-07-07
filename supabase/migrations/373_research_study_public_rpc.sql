-- ============================================================================
-- Migration 373: RPC สาธารณะสำหรับหน้า /research/:studyId (นักเรียนกรอกรหัสเอง)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_research_study_public(p_study_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT
    s.id,
    s.title,
    s.game_slug,
    COALESCE(e.title, s.game_slug) AS game_title,
    s.game_mode,
    s.class_name,
    s.max_rounds_per_day,
    s.pretest_start,
    s.pretest_end,
    s.posttest_start,
    s.posttest_end,
    s.is_active
  INTO v_row
  FROM public.game_research_studies s
  LEFT JOIN public.educational_hub_items e ON e.id = s.edu_hub_item_id
  WHERE s.id = p_study_id;

  IF NOT FOUND OR v_row.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'study_not_found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'title', v_row.title,
    'game_slug', v_row.game_slug,
    'game_title', v_row.game_title,
    'game_mode', v_row.game_mode,
    'class_name', v_row.class_name,
    'max_rounds_per_day', v_row.max_rounds_per_day,
    'pretest_start', v_row.pretest_start,
    'pretest_end', v_row.pretest_end,
    'posttest_start', v_row.posttest_start,
    'posttest_end', v_row.posttest_end
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_research_study_public(UUID) TO anon, authenticated;

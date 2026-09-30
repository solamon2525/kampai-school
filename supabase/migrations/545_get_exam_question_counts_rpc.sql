-- Migration 545: RPC for fast server-side aggregation of exam question counts by subject
-- Solves PostgREST 1,000-row default limit when querying subject counts.

CREATE OR REPLACE FUNCTION public.get_exam_question_counts(p_grade text DEFAULT NULL)
RETURNS TABLE (subject text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subject, count(*)::bigint AS count
  FROM public.exam_questions
  WHERE (p_grade IS NULL OR p_grade = 'all' OR grade = p_grade)
  GROUP BY subject;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_question_counts(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_exam_question_counts(text) IS 'Returns aggregated question counts per subject, optionally filtered by grade.';

-- 449: Accurate indicator coverage KPI (avoid PostgREST 1000-row truncation)
CREATE OR REPLACE FUNCTION public.indicator_coverage_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'totalIndicators', (
      SELECT COUNT(*)::int FROM public.curriculum_indicators WHERE is_active = true
    ),
    'covered', (
      SELECT COUNT(DISTINCT ig.indicator_id)::int
      FROM public.indicator_games ig
      JOIN public.curriculum_indicators ci ON ci.id = ig.indicator_id
      WHERE ci.is_active = true
    ),
    'linkedItems', (
      SELECT COUNT(DISTINCT ig.edu_hub_item_id)::int
      FROM public.indicator_games ig
    ),
    'pctCovered', (
      SELECT CASE
        WHEN total = 0 THEN 0
        ELSE ROUND((covered::numeric / total) * 1000) / 10
      END
      FROM (
        SELECT
          (SELECT COUNT(*) FROM public.curriculum_indicators WHERE is_active = true) AS total,
          (SELECT COUNT(DISTINCT ig.indicator_id)
           FROM public.indicator_games ig
           JOIN public.curriculum_indicators ci ON ci.id = ig.indicator_id
           WHERE ci.is_active = true) AS covered
      ) s
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.indicator_coverage_summary() TO anon, authenticated;

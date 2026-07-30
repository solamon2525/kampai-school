-- 451: School-wide soft-gap counts for Phase 16 ops (IndicatorCoverageDialog parity)
CREATE OR REPLACE FUNCTION public.indicator_soft_gap_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_indicator AS (
    SELECT
      ci.id,
      COUNT(ig.edu_hub_item_id) > 0 AS mapped,
      BOOL_OR(
        ehi.tracked_game = true
        OR ehi.external_url LIKE '%/games/%'
        OR ehi.external_url LIKE '%/edu-hub-games/%'
      ) FILTER (WHERE ehi.id IS NOT NULL) AS has_game,
      BOOL_OR(ehi.external_url LIKE '%-media.html') FILTER (WHERE ehi.id IS NOT NULL) AS has_media,
      BOOL_OR(ehi.external_url LIKE '%-worksheet.html') FILTER (WHERE ehi.id IS NOT NULL) AS has_worksheet
    FROM public.curriculum_indicators ci
    LEFT JOIN public.indicator_games ig ON ig.indicator_id = ci.id
    LEFT JOIN public.educational_hub_items ehi ON ehi.id = ig.edu_hub_item_id
    WHERE ci.is_active = true
    GROUP BY ci.id
  )
  SELECT jsonb_build_object(
    'totalIndicators', (SELECT COUNT(*)::int FROM per_indicator),
    'unmapped', (SELECT COUNT(*)::int FROM per_indicator WHERE NOT mapped),
    'noGame', (SELECT COUNT(*)::int FROM per_indicator WHERE NOT COALESCE(has_game, false)),
    'noMedia', (SELECT COUNT(*)::int FROM per_indicator WHERE NOT COALESCE(has_media, false)),
    'noWorksheet', (SELECT COUNT(*)::int FROM per_indicator WHERE NOT COALESCE(has_worksheet, false))
  );
$$;

GRANT EXECUTE ON FUNCTION public.indicator_soft_gap_summary() TO anon, authenticated;

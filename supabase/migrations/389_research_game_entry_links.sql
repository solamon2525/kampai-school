-- ============================================================================
-- Migration 389: Game page entry links for active classroom research studies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.list_research_studies_for_game(
  p_game_slug  TEXT,
  p_class_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'game_slug', s.game_slug,
        'game_title', COALESCE(e.title, s.game_slug),
        'game_mode', s.game_mode,
        'class_name', s.class_name,
        'max_rounds_per_day', s.max_rounds_per_day,
        'pretest_start', s.pretest_start,
        'pretest_end', s.pretest_end,
        'posttest_start', s.posttest_start,
        'posttest_end', s.posttest_end
      )
      ORDER BY s.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.game_research_studies s
  LEFT JOIN public.educational_hub_items e ON e.id = s.edu_hub_item_id
  WHERE s.is_active = true
    AND s.game_slug = p_game_slug
    AND (p_class_name IS NULL OR s.class_name = p_class_name);
$$;

GRANT EXECUTE ON FUNCTION public.list_research_studies_for_game(TEXT, TEXT)
  TO anon, authenticated;

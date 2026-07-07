-- ============================================================================
-- Migration 374: หน้าแรก + รายการงานวิจัยสาธารณะ
-- ============================================================================

ALTER TABLE public.game_research_studies
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.list_research_studies_public()
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
        'max_rounds_per_day', s.max_rounds_per_day
      )
      ORDER BY s.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.game_research_studies s
  LEFT JOIN public.educational_hub_items e ON e.id = s.edu_hub_item_id
  WHERE s.is_active = true
    AND s.show_on_homepage = true;
$$;

GRANT EXECUTE ON FUNCTION public.list_research_studies_public() TO anon, authenticated;

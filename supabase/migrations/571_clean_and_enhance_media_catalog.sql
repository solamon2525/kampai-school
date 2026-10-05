-- =============================================================================
-- Migration 571: Clean and enhance teaching media catalog in educational_hub_items
-- Deduplicates media items, enriches grade levels, and provides RPC for media explorer
-- =============================================================================

-- 1. Safely unpublish duplicate rows in educational_hub_items
UPDATE public.educational_hub_items
SET is_published = false,
    updated_at = NOW()
WHERE id IN (
  '1c16a943-fbf1-488f-b11d-740a65ccb595'::uuid, -- Duplicate 2D/3D geometry
  '58ca7383-8b28-4628-a73e-f3d326f10868'::uuid  -- Duplicate English Vocab Hub
);

-- 2. Enrich grade levels for vocab hubs
UPDATE public.educational_hub_items
SET grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6'],
    updated_at = NOW()
WHERE id = '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid
  AND (grade_levels IS NULL OR cardinality(grade_levels) = 0);

UPDATE public.educational_hub_items
SET grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6'],
    updated_at = NOW()
WHERE id = '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid
  AND (grade_levels IS NULL OR cardinality(grade_levels) = 0);

-- 3. Create public RPC to fetch curated media catalog
CREATE OR REPLACE FUNCTION public.get_public_media_catalog(p_subject text default null)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  thumbnail_url text,
  external_url text,
  subject text,
  grade_levels text[],
  view_count integer,
  sort_order integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.title,
    i.description,
    i.thumbnail_url,
    i.external_url,
    i.subject,
    i.grade_levels,
    i.view_count,
    i.sort_order,
    i.created_at
  FROM public.educational_hub_items i
  WHERE i.is_published = true
    AND (
      i.external_url ILIKE '%-media.html'
      OR i.external_url ILIKE '%media%'
      OR i.category_id IN (SELECT id FROM public.educational_hub_categories WHERE category_key = 'media')
    )
    AND (p_subject IS NULL OR p_subject = 'all' OR i.subject = p_subject)
  ORDER BY
    CASE
      WHEN i.subject = 'ภาษาอังกฤษ' THEN 1
      WHEN i.subject = 'คณิตศาสตร์' THEN 2
      WHEN i.subject = 'ภาษาไทย' THEN 3
      ELSE 4
    END,
    i.sort_order ASC,
    i.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_media_catalog(text) TO anon, authenticated;

-- 065_fix_edu_hub_view_total_items.sql
-- Bug fix: v_educational_hub_teachers.total_items was computed as
-- COUNT(*) of per-category rows (i.e. "number of categories with ≥1 item")
-- instead of the actual total item count. For a teacher with 17 items all
-- in one category, the view returned total_items=1.
--
-- Fix: SUM(cnt) instead of COUNT(*) so total_items = true item count.
-- Column ordering preserved from migration 064 (append-only).

CREATE OR REPLACE VIEW public.v_educational_hub_teachers AS
SELECT
  s.id                                  AS staff_id,
  s.name,
  s.position,
  s.subject,
  s.department,
  s.photo_url,
  s.order_position,
  p.banner_url,
  p.hub_bio,
  p.accent_color,
  p.external_url,
  COALESCE(p.is_hub_active, true)       AS is_hub_active,
  COALESCE(counts.total_items, 0)::int  AS total_items,
  COALESCE(counts.counts_by_category, '{}'::jsonb) AS counts_by_category,
  p.username
FROM public.staff s
LEFT JOIN public.educational_hub_profiles p ON p.staff_id = s.id
LEFT JOIN LATERAL (
  SELECT
    SUM(cnt)::int                     AS total_items,  -- ← was COUNT(*)
    jsonb_object_agg(category_id, cnt) AS counts_by_category
  FROM (
    SELECT category_id, COUNT(*)::int AS cnt
    FROM public.educational_hub_items
    WHERE owner_staff_id = s.id AND is_published = true
    GROUP BY category_id
  ) per_cat
) counts ON true
WHERE s.staff_type = 'teaching'
ORDER BY s.order_position ASC, s.name ASC;

GRANT SELECT ON public.v_educational_hub_teachers TO anon, authenticated;

-- 066_edu_hub_view_last_item_at.sql
-- Add `last_item_at` (timestamptz) to v_educational_hub_teachers so the
-- public hub list page can sort teachers by "ล่าสุด" (most recent activity).
-- Appended at end of view per CREATE OR REPLACE VIEW column-order rule.

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
  p.username,
  counts.last_item_at                   -- ← new (nullable)
FROM public.staff s
LEFT JOIN public.educational_hub_profiles p ON p.staff_id = s.id
LEFT JOIN LATERAL (
  SELECT
    SUM(cnt)::int                     AS total_items,
    jsonb_object_agg(category_id, cnt) AS counts_by_category,
    MAX(latest)                        AS last_item_at
  FROM (
    SELECT category_id,
           COUNT(*)::int AS cnt,
           MAX(created_at) AS latest
    FROM public.educational_hub_items
    WHERE owner_staff_id = s.id AND is_published = true
    GROUP BY category_id
  ) per_cat
) counts ON true
WHERE s.staff_type = 'teaching'
ORDER BY s.order_position ASC, s.name ASC;

GRANT SELECT ON public.v_educational_hub_teachers TO anon, authenticated;

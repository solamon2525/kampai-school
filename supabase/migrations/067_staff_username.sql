-- 067_staff_username.sql
-- Move `username` from educational_hub_profiles → staff table so that:
-- - /staff/<username> short URL works (not just hub teachers)
-- - One username per person, shared between /staff/ and /h/ routes
--
-- Steps (order matters):
--   1. Add staff.username + constraints (CHECK regex + UNIQUE)
--   2. Migrate existing data from educational_hub_profiles → staff
--   3. Recreate v_educational_hub_teachers reading s.username
--   4. Drop educational_hub_profiles.username (no longer source of truth)

-- ─── 1. Add column + constraints ───────────────────────────────────────────
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS username TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_username_format'
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_-]{2,32}$');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_username_unique'
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_username_unique UNIQUE (username);
  END IF;
END $$;

-- ─── 2. Migrate existing username data ─────────────────────────────────────
UPDATE public.staff s
   SET username = p.username
  FROM public.educational_hub_profiles p
 WHERE p.staff_id = s.id
   AND p.username IS NOT NULL
   AND s.username IS NULL;

-- ─── 3. Recreate view to read from staff.username ──────────────────────────
-- Column order preserved from migration 066 (append-only required by Postgres
-- CREATE OR REPLACE VIEW). Only the source of `username` changes (p→s).
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
  s.username,                           -- ← was p.username (now from staff)
  counts.last_item_at
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

-- ─── 4. Drop old column (no longer source of truth) ────────────────────────
ALTER TABLE public.educational_hub_profiles DROP COLUMN IF EXISTS username;

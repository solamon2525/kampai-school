-- 064_edu_hub_profile_username.sql
-- Add `username` to educational_hub_profiles for short URLs (/h/<username>).
-- - Validated: lowercase letters, digits, hyphen, underscore (2-32 chars)
-- - UNIQUE constraint → fast lookup + prevents collisions
-- - View v_educational_hub_teachers exposes username for client URL generation
-- - Seed `natthapong` for ครูณัฐพงศ์ (staff_id a5f53911-b9cb-465a-b963-7202bcb907b1)

-- ─── 1. Add column + constraints ───────────────────────────────────────────
ALTER TABLE public.educational_hub_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Regex validation: a-z, 0-9, -, _ ; length 2-32
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'educational_hub_profiles_username_format'
  ) THEN
    ALTER TABLE public.educational_hub_profiles
      ADD CONSTRAINT educational_hub_profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_-]{2,32}$');
  END IF;
END $$;

-- Unique constraint (allows NULLs — many profiles can have no username)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'educational_hub_profiles_username_unique'
  ) THEN
    ALTER TABLE public.educational_hub_profiles
      ADD CONSTRAINT educational_hub_profiles_username_unique UNIQUE (username);
  END IF;
END $$;

-- ─── 2. Refresh teacher view to expose username ────────────────────────────
-- View: must append new columns at the END (Postgres CREATE OR REPLACE VIEW
-- forbids reordering existing columns)
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
    COUNT(*)                          AS total_items,
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

-- ─── 3. Seed: ครูณัฐพงศ์ → username 'natthapong' ────────────────────────────
-- Idempotent: upsert profile row + set username only if not already set
INSERT INTO public.educational_hub_profiles (staff_id, username)
VALUES ('a5f53911-b9cb-465a-b963-7202bcb907b1', 'natthapong')
ON CONFLICT (staff_id) DO UPDATE
  SET username = COALESCE(public.educational_hub_profiles.username, EXCLUDED.username);

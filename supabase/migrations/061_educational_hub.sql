-- =============================================================================
-- Migration 061: Educational Hub (คลังสื่อและเกมการศึกษา)
-- =============================================================================
-- Public-facing hub where each teacher gathers teaching media, games,
-- worksheets, videos, and other resources. Visitors browse anonymously;
-- teachers manage their own items via the Teacher Portal (owner-based RLS);
-- admins manage everything.
--
-- Tables:
--   1) educational_hub_categories  — global catalog (admin-managed)
--   2) educational_hub_profiles    — per-teacher hub metadata (banner, bio)
--   3) educational_hub_items       — polymorphic items (file/link/youtube/text)
-- View:
--   v_educational_hub_teachers     — hub home rows with per-category counts
-- RPCs:
--   increment_ehi_view(uuid), increment_ehi_download(uuid)
-- Storage:
--   bucket 'educational-hub' (public, 50MB, broad media allowlist)
-- =============================================================================


-- ─── 1. Categories ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.educational_hub_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key  TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  icon_name     TEXT NOT NULL DEFAULT 'Folder',
  color_class   TEXT NOT NULL DEFAULT 'primary',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ehc_sort   ON public.educational_hub_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_ehc_active ON public.educational_hub_categories(is_active);

ALTER TABLE public.educational_hub_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ehc"  ON public.educational_hub_categories;
DROP POLICY IF EXISTS "admin_write_ehc"  ON public.educational_hub_categories;

CREATE POLICY "public_read_ehc" ON public.educational_hub_categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "admin_write_ehc" ON public.educational_hub_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default launch categories
INSERT INTO public.educational_hub_categories
  (category_key, name, description, icon_name, color_class, sort_order)
VALUES
  ('media',      'คลังสื่อการสอน',  'สื่อประกอบการเรียนการสอน',       'Presentation',    'primary', 10),
  ('games',      'คลังเกมการศึกษา', 'เกมและกิจกรรมการเรียนรู้',       'Gamepad2',        'accent',  20),
  ('worksheets', 'คลังใบงาน',       'ใบงานและแบบฝึกหัด',              'FileSpreadsheet', 'info',    30),
  ('videos',     'วิดีโอการสอน',    'คลิปสอน / บรรยาย / สาธิต',       'PlayCircle',      'success', 40)
ON CONFLICT (category_key) DO NOTHING;


-- ─── 2. Per-teacher hub profile (lazy-created 1-to-1 with staff) ────────────
CREATE TABLE IF NOT EXISTS public.educational_hub_profiles (
  staff_id       UUID PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
  banner_url     TEXT,
  hub_bio        TEXT,
  accent_color   TEXT,
  external_url   TEXT,
  is_hub_active  BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.educational_hub_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ehp"           ON public.educational_hub_profiles;
DROP POLICY IF EXISTS "owner_or_admin_write_ehp"  ON public.educational_hub_profiles;

CREATE POLICY "public_read_ehp" ON public.educational_hub_profiles
  FOR SELECT USING (is_hub_active = true OR public.is_admin());

CREATE POLICY "owner_or_admin_write_ehp" ON public.educational_hub_profiles
  FOR ALL
  USING (
    public.is_admin()
    OR staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );


-- ─── 3. Items (polymorphic) ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edu_hub_item_type') THEN
    CREATE TYPE public.edu_hub_item_type AS ENUM ('file', 'link', 'youtube', 'text');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.educational_hub_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id  UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.educational_hub_categories(id) ON DELETE RESTRICT,
  item_type       public.edu_hub_item_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  thumbnail_url   TEXT,
  -- type-specific (CHECK ensures the right column is filled)
  file_url        TEXT,
  file_name       TEXT,
  file_size       BIGINT,
  file_mime       TEXT,
  external_url    TEXT,
  youtube_id      TEXT,
  body_html       TEXT,
  -- shared metadata
  tags            TEXT[] NOT NULL DEFAULT '{}',
  grade_levels    TEXT[] NOT NULL DEFAULT '{}',
  subject         TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  view_count      INTEGER NOT NULL DEFAULT 0,
  download_count  INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ehi_type_payload_check CHECK (
       (item_type = 'file'    AND file_url     IS NOT NULL)
    OR (item_type = 'link'    AND external_url IS NOT NULL)
    OR (item_type = 'youtube' AND youtube_id   IS NOT NULL)
    OR (item_type = 'text'    AND body_html    IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_ehi_owner            ON public.educational_hub_items(owner_staff_id);
CREATE INDEX IF NOT EXISTS idx_ehi_category         ON public.educational_hub_items(category_id);
CREATE INDEX IF NOT EXISTS idx_ehi_pub_sort         ON public.educational_hub_items(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_ehi_owner_cat_sort   ON public.educational_hub_items(owner_staff_id, category_id, sort_order);

ALTER TABLE public.educational_hub_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ehi"   ON public.educational_hub_items;
DROP POLICY IF EXISTS "owner_insert_ehi"  ON public.educational_hub_items;
DROP POLICY IF EXISTS "owner_update_ehi"  ON public.educational_hub_items;
DROP POLICY IF EXISTS "owner_delete_ehi"  ON public.educational_hub_items;

CREATE POLICY "public_read_ehi" ON public.educational_hub_items
  FOR SELECT USING (
    is_published = true
    OR public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_insert_ehi" ON public.educational_hub_items
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_update_ehi" ON public.educational_hub_items
  FOR UPDATE
  USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_delete_ehi" ON public.educational_hub_items
  FOR DELETE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );


-- ─── 4. updated_at trigger (shared helper) ─────────────────────────────────
-- Reuse update_updated_at_column() if it exists (it does, from migration 001).
DROP TRIGGER IF EXISTS trg_ehi_updated_at ON public.educational_hub_items;
CREATE TRIGGER trg_ehi_updated_at BEFORE UPDATE ON public.educational_hub_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ehp_updated_at ON public.educational_hub_profiles;
CREATE TRIGGER trg_ehp_updated_at BEFORE UPDATE ON public.educational_hub_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ehc_updated_at ON public.educational_hub_categories;
CREATE TRIGGER trg_ehc_updated_at BEFORE UPDATE ON public.educational_hub_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─── 5. Hub home VIEW (one row per active teacher with counts JSONB) ───────
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
  COALESCE(counts.counts_by_category, '{}'::jsonb) AS counts_by_category
FROM public.staff s
LEFT JOIN public.educational_hub_profiles p ON p.staff_id = s.id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                          AS total_items,
    jsonb_object_agg(c.category_key, sub.cnt) AS counts_by_category
  FROM (
    SELECT category_id, COUNT(*) AS cnt
    FROM public.educational_hub_items
    WHERE owner_staff_id = s.id
      AND is_published   = true
    GROUP BY category_id
  ) sub
  JOIN public.educational_hub_categories c ON c.id = sub.category_id
) counts ON true
WHERE s.staff_type = 'teaching'
  AND COALESCE(p.is_hub_active, true) = true;

GRANT SELECT ON public.v_educational_hub_teachers TO anon, authenticated;


-- ─── 6. Counter RPCs (anon-safe) ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_ehi_view(p_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.educational_hub_items
     SET view_count = view_count + 1
   WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.increment_ehi_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ehi_view(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_ehi_download(p_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.educational_hub_items
     SET download_count = download_count + 1
   WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.increment_ehi_download(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ehi_download(UUID) TO anon, authenticated;


-- ─── 7. Storage bucket: educational-hub ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'educational-hub',
  'educational-hub',
  true,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip','application/x-zip-compressed',
    'video/mp4','video/webm',
    'audio/mpeg','audio/mp3','audio/wav',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object policies (table-level RLS on educational_hub_items enforces ownership)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public read educational-hub'
  ) THEN
    CREATE POLICY "Public read educational-hub" ON storage.objects
      FOR SELECT USING (bucket_id = 'educational-hub');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth upload educational-hub'
  ) THEN
    CREATE POLICY "Auth upload educational-hub" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'educational-hub' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth update educational-hub'
  ) THEN
    CREATE POLICY "Auth update educational-hub" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'educational-hub' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth delete educational-hub'
  ) THEN
    CREATE POLICY "Auth delete educational-hub" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'educational-hub' AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- 063_edu_hub_games_bucket.sql
-- New Supabase Storage bucket for admin-managed HTML game files.
-- Path scheme: edu-hub-games/{subject}/{slug}.html
-- Public read; INSERT/UPDATE/DELETE restricted to admins via is_admin() helper.
-- Cache-busting is handled in app layer (external_url appends ?v=<timestamp>).

-- ─── 1. Bucket ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edu-hub-games',
  'edu-hub-games',
  true,
  5242880,  -- 5 MB per HTML game
  ARRAY[
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'image/png','image/jpeg','image/gif','image/svg+xml','image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 2. RLS policies on storage.objects ───────────────────────────────────
-- Public read so games are reachable from anonymous browser tabs.
-- Writes (insert/update/delete) gated by is_admin() — admins only.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public read edu-hub-games'
  ) THEN
    CREATE POLICY "Public read edu-hub-games" ON storage.objects
      FOR SELECT USING (bucket_id = 'edu-hub-games');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin insert edu-hub-games'
  ) THEN
    CREATE POLICY "Admin insert edu-hub-games" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'edu-hub-games' AND public.is_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin update edu-hub-games'
  ) THEN
    CREATE POLICY "Admin update edu-hub-games" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'edu-hub-games' AND public.is_admin()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Admin delete edu-hub-games'
  ) THEN
    CREATE POLICY "Admin delete edu-hub-games" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'edu-hub-games' AND public.is_admin()
      );
  END IF;
END $$;

-- Migration 036: Create school-images storage bucket + policies
-- Bucket was commented out in migration 001 and never created.
-- This migration ensures it exists with correct public access and RLS policies.

-- Create bucket (safe to run even if bucket was created manually in Studio)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-images',
  'school-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Public read (anyone can view uploaded images)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public read school-images'
  ) THEN
    CREATE POLICY "Public read school-images" ON storage.objects
      FOR SELECT USING (bucket_id = 'school-images');
  END IF;
END $$;

-- Authenticated users can upload
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated upload school-images'
  ) THEN
    CREATE POLICY "Authenticated upload school-images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'school-images'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Authenticated users can update (overwrite files)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated update school-images'
  ) THEN
    CREATE POLICY "Authenticated update school-images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'school-images'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Authenticated users can delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated delete school-images'
  ) THEN
    CREATE POLICY "Authenticated delete school-images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'school-images'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

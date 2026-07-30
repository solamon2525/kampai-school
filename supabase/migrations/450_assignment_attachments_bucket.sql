-- 450: Parent homework submission attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  false,
  15728640, -- 15 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = 15728640,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth read assignment-attachments'
  ) THEN
    CREATE POLICY "Auth read assignment-attachments" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'assignment-attachments' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth upload assignment-attachments'
  ) THEN
    CREATE POLICY "Auth upload assignment-attachments" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'assignment-attachments'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth delete own assignment-attachments'
  ) THEN
    CREATE POLICY "Auth delete own assignment-attachments" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'assignment-attachments'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

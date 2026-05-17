-- ============================================================================
-- Migration 052: signatures storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signatures', 'signatures', true, 2097152, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg'];

CREATE POLICY "public_read_signatures_bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures');

CREATE POLICY "authenticated_upload_signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'signatures' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_delete_signatures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'signatures' AND public.is_admin());

-- 446_roadmap_360_chat_attachments_lesson_plan_pack.sql
-- Phase 360 roadmap foundations:
--   1) chat-attachments storage bucket (DESIGN 14.25 Phase 2)
--   2) lesson_plans.pack_id → lesson_packs (เชื่อมแผนสอนกับชุดเรียน)

-- ─── 1. Chat attachments bucket ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'audio/mpeg','audio/mp3','audio/wav',
    'video/mp4','video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth read own chat-attachments'
  ) THEN
    CREATE POLICY "Auth read own chat-attachments" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth upload chat-attachments'
  ) THEN
    CREATE POLICY "Auth upload chat-attachments" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Auth delete own chat-attachments'
  ) THEN
    CREATE POLICY "Auth delete own chat-attachments" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

COMMENT ON TABLE public.chat_messages IS
  'Messages within a thread. Attachments use storage bucket chat-attachments (migration 446).';

-- ─── 2. Lesson plans ↔ lesson packs ─────────────────────────────────────────
ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES public.lesson_packs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_plans_pack_id ON public.lesson_plans(pack_id);

COMMENT ON COLUMN public.lesson_plans.pack_id IS
  'Optional link to a published lesson pack (media+worksheet+game unit).';

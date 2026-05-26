-- ===============================================================
-- Migration 089: Realtime Chat (Parent ↔ Teacher)
-- ===============================================================
-- 1 thread per (parent, teacher, student) tuple. Read receipt via read_at.
-- Attachments would use storage bucket chat-attachments (Phase 2).
-- Realtime publication enabled for live message streams.

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  subject text,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, teacher_user_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_parent ON public.chat_threads(parent_user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_threads_teacher ON public.chat_threads(teacher_user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  attachment_url text,
  attachment_type text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (body IS NOT NULL OR attachment_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thread_participants_read" ON public.chat_threads;
CREATE POLICY "thread_participants_read" ON public.chat_threads
  FOR SELECT USING (
    auth.uid() = parent_user_id OR auth.uid() = teacher_user_id OR public.is_admin()
  );

DROP POLICY IF EXISTS "thread_create_by_participant" ON public.chat_threads;
CREATE POLICY "thread_create_by_participant" ON public.chat_threads
  FOR INSERT WITH CHECK (
    (auth.uid() = parent_user_id AND (
      student_id IS NULL OR EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = chat_threads.student_id)
    ))
    OR (auth.uid() = teacher_user_id AND (public.is_teacher() OR public.is_admin()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "thread_update_participant" ON public.chat_threads;
CREATE POLICY "thread_update_participant" ON public.chat_threads
  FOR UPDATE USING (auth.uid() = parent_user_id OR auth.uid() = teacher_user_id OR public.is_admin());

DROP POLICY IF EXISTS "message_participant_read" ON public.chat_messages;
CREATE POLICY "message_participant_read" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = chat_messages.thread_id
            AND (auth.uid() = t.parent_user_id OR auth.uid() = t.teacher_user_id OR public.is_admin()))
  );

DROP POLICY IF EXISTS "message_send" ON public.chat_messages;
CREATE POLICY "message_send" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = chat_messages.thread_id
            AND (auth.uid() = t.parent_user_id OR auth.uid() = t.teacher_user_id))
  );

DROP POLICY IF EXISTS "message_mark_read" ON public.chat_messages;
CREATE POLICY "message_mark_read" ON public.chat_messages
  FOR UPDATE USING (
    auth.uid() != sender_user_id
    AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = chat_messages.thread_id
            AND (auth.uid() = t.parent_user_id OR auth.uid() = t.teacher_user_id))
  );

CREATE OR REPLACE FUNCTION public.update_thread_on_new_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_threads SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.body, '[ไฟล์แนบ]'), 100)
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_chat_message ON public.chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_on_new_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;

COMMENT ON TABLE public.chat_threads IS '1 thread per (parent, teacher, student) tuple — see Rule 14.25';
COMMENT ON TABLE public.chat_messages IS 'Messages within a thread. Read receipt via read_at. Attachment via storage bucket chat-attachments (separate setup).';

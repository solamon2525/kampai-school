-- ============================================================================
-- Migration 023: Notification Center + Realtime triggers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL CHECK (type IN ('admission','message','leave','general')),
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_notifications"   ON public.notifications FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_notifications" ON public.notifications FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_notifications" ON public.notifications FOR DELETE USING (public.is_admin());
CREATE POLICY "admin_insert_notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- ---------- Triggers ----------
CREATE OR REPLACE FUNCTION public.notify_new_admission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(type, title, body, link)
  VALUES ('admission', 'ใบสมัครใหม่',
    COALESCE(NEW.student_name, 'นักเรียน') || ' สมัครเข้าเรียน',
    '/admin/dashboard/admissions');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_admission_notify ON public.admissions;
CREATE TRIGGER trg_admission_notify AFTER INSERT ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_admission();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(type, title, body, link)
  VALUES ('message', 'ข้อความติดต่อใหม่',
    COALESCE(NEW.name, 'ผู้ติดต่อ') || ': ' || LEFT(COALESCE(NEW.subject, NEW.message, ''), 80),
    '/admin/dashboard/messages');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_message_notify ON public.contact_messages;
CREATE TRIGGER trg_message_notify AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE OR REPLACE FUNCTION public.notify_new_leave()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(type, title, body, link)
  VALUES ('leave', 'คำขอลาใหม่', 'มีคำขอลางานใหม่รอพิจารณา', '/admin/dashboard/hr');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_leave_notify ON public.leave_requests;
CREATE TRIGGER trg_leave_notify AFTER INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_leave();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

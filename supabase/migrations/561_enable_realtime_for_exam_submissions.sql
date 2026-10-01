-- ─── 561_enable_realtime_for_exam_submissions.sql ───────────────────────────
-- เปิดใช้งาน Supabase Realtime สำหรับตาราง exam_submissions เพื่อให้อัปเดตผลสอบทันที 0ms
ALTER TABLE public.exam_submissions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'exam_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_submissions;
  END IF;
END $$;

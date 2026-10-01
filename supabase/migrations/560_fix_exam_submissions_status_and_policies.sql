-- ─── 560_fix_exam_submissions_status_and_policies.sql ───────────────────────
-- ปรับปรุงตาราง exam_submissions เพื่อรองรับการบันทึกคะแนนสอบทั้งแบบออนไลน์และตรวจ OMR อย่างสมบูรณ์
-- 1) ปลดล็อกและอัปเดต check constraint ของ review_status ให้ครอบคลุม 'completed', 'pending_review', 'reviewed'
-- 2) ตั้งค่า default ของ review_status เป็น 'completed'
-- 3) ยืนยัน RLS Policy สำหรับนักเรียนและสาธารณะในการส่งผลสอบ

ALTER TABLE public.exam_submissions
  DROP CONSTRAINT IF EXISTS exam_submissions_review_status_check;

ALTER TABLE public.exam_submissions
  ADD CONSTRAINT exam_submissions_review_status_check
  CHECK (review_status IN ('completed', 'pending_review', 'reviewed'));

ALTER TABLE public.exam_submissions
  ALTER COLUMN review_status SET DEFAULT 'completed';

-- ยืนยัน RLS Policy ให้สาธารณะ/นักเรียนสามารถส่งผลสอบได้
DROP POLICY IF EXISTS "Public submit exam_submissions" ON public.exam_submissions;
CREATE POLICY "Public submit exam_submissions"
  ON public.exam_submissions FOR INSERT
  WITH CHECK (true);

-- ยืนยัน Policy สำหรับครูและแอดมินในการอ่านและจัดการ
DROP POLICY IF EXISTS "Teacher and Admin read exam_submissions" ON public.exam_submissions;
CREATE POLICY "Teacher and Admin read exam_submissions"
  ON public.exam_submissions FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Teacher and Admin manage exam_submissions" ON public.exam_submissions;
CREATE POLICY "Teacher and Admin manage exam_submissions"
  ON public.exam_submissions FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

-- ============================================================================
-- Migration 033: เพิ่ม email column ใน staff
-- ใช้สำหรับระบบ login ครูในอนาคต (Teacher Portal)
-- ============================================================================

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.staff.email IS 'อีเมลสำหรับเข้าสู่ระบบครู (Teacher Portal)';

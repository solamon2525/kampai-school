-- ============================================================================
-- Migration 029: ขยายฟิลด์ของ staff
--   academic_rank (วิทยฐานะ), degree (วุฒิ), major (วิชาเอก),
--   phone (เบอร์ติดต่อ), extra_info (JSONB array ของ {label, value} สำหรับด้านหลังการ์ด)
-- ============================================================================

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS academic_rank TEXT,
  ADD COLUMN IF NOT EXISTS degree        TEXT,
  ADD COLUMN IF NOT EXISTS major         TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS extra_info    JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.staff.academic_rank IS 'วิทยฐานะ เช่น ชำนาญการพิเศษ';
COMMENT ON COLUMN public.staff.degree        IS 'วุฒิการศึกษา เช่น ค.บ., ศษ.ม.';
COMMENT ON COLUMN public.staff.major         IS 'วิชาเอก/สาขา';
COMMENT ON COLUMN public.staff.phone         IS 'เบอร์โทรติดต่อ';
COMMENT ON COLUMN public.staff.extra_info    IS 'ข้อมูลเพิ่มเติม array ของ {label, value} แสดงด้านหลังการ์ด';

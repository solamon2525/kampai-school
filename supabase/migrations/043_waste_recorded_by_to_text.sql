-- ============================================================================
-- Migration 043: waste_transactions.recorded_by drift — UUID FK → TEXT
-- ============================================================================
-- ปัญหา: waste_transactions.recorded_by เป็น UUID FK ไป auth.users ซึ่ง drift
-- จาก migration 011 (TEXT) และไม่ตรงกับ attendance_records, conduct_scores,
-- score_records ที่เป็น TEXT — code ทุกที่ส่ง recorder.name (display) เข้าฟิลด์
-- นี้ → batch insert fail ด้วย "invalid input syntax for type uuid"
--
-- คอลัมน์นี้เก็บ cached display name ของผู้บันทึก (จาก RecorderSelect).
-- FK ที่ถูกต้องคือ recorded_by_staff_id / recorded_by_administrator_id ที่
-- migration 039 เพิ่มไว้แล้ว.
--
-- Safe: existing rows ทั้งหมด recorded_by = NULL ก่อน alter
-- ============================================================================

ALTER TABLE public.waste_transactions
  DROP CONSTRAINT IF EXISTS waste_transactions_recorded_by_fkey;

ALTER TABLE public.waste_transactions
  ALTER COLUMN recorded_by TYPE TEXT USING NULL;

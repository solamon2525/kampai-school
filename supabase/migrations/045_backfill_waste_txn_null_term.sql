-- ============================================================================
-- Migration 045: Backfill waste_transactions ที่มี academic_year/semester = NULL
-- ============================================================================
-- สาเหตุ: rows บางส่วนถูก INSERT ในช่วงระหว่าง migration 042 (backfill) กับ
-- migration 044 (BEFORE INSERT trigger) จึงได้ค่า NULL ทั้งสองฟิลด์
-- → VIEW waste_student_summary filter เฉพาะ active term → ไม่นับ rows เหล่านี้
-- → leaderboard ไม่ตรงกับ activity log
--
-- Fix: ตั้งค่า academic_year + semester ของ NULL rows ให้ตรงกับ active_term()
-- ============================================================================

UPDATE public.waste_transactions
   SET academic_year = t.year,
       semester      = t.sem
  FROM public.active_term() t
 WHERE waste_transactions.academic_year IS NULL
    OR waste_transactions.semester IS NULL;

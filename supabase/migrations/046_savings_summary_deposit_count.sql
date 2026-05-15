-- ============================================================================
-- Migration 046: เพิ่ม deposit_count + withdraw_count ใน savings_student_summary
-- ============================================================================
-- ใช้สำหรับ leaderboard หน้าสาธารณะ — จัดอันดับโดย "จำนวนครั้งฝาก"
-- (ไม่ใช่จำนวนเงิน เพื่อ privacy — รางวัลวินัย ไม่ใช่ความรวย)
--
-- VIEW change: drop + recreate (รักษา data ใน savings_transactions เดิมไว้)
-- Backward compatible — เพิ่ม 2 columns ไม่ลบ/ไม่เปลี่ยน column เดิม
-- ============================================================================

DROP VIEW IF EXISTS public.savings_student_summary;
CREATE VIEW public.savings_student_summary AS
SELECT
  s.id           AS student_id,
  s.name         AS full_name,
  s.class        AS class_name,
  s.photo_url,
  s.student_code,
  COUNT(t.id)::int AS total_transactions,
  COUNT(t.id) FILTER (WHERE t.transaction_type='deposit')::int  AS deposit_count,
  COUNT(t.id) FILTER (WHERE t.transaction_type='withdraw')::int AS withdraw_count,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'deposit'  THEN t.amount ELSE 0 END), 0)::numeric(10,2) AS total_deposits,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'withdraw' THEN t.amount ELSE 0 END), 0)::numeric(10,2) AS total_withdrawals,
  COALESCE(
    SUM(CASE WHEN t.transaction_type = 'deposit'  THEN  t.amount
             WHEN t.transaction_type = 'withdraw' THEN -t.amount
             ELSE 0 END), 0
  )::numeric(10,2) AS current_balance
FROM public.students s
LEFT JOIN public.savings_transactions t ON t.student_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code;

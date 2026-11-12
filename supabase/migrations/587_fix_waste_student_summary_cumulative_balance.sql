-- ============================================================================
-- Migration 587: Fix waste_student_summary cumulative balance & cross-term persistence
-- 1. Rebuild public.waste_student_summary to support brought-forward (carried-over)
--    points from previous semesters, so students' unspent waste bank balance
--    is preserved across term switches (e.g. Term 1 -> Term 2).
-- 2. Expose carried_over_points, current_term_points_earned, and current_term_points_spent.
-- 3. Set security_invoker = false so public visitors & students can view the
--    summary leaderboard without hitting permission errors on subqueries.
-- ============================================================================

-- 1. Rebuild waste_student_summary view
CREATE OR REPLACE VIEW public.waste_student_summary AS
WITH active AS (
  SELECT year, sem FROM public.active_term()
),
student_terms AS (
  SELECT
    s.id AS student_id,
    s.name AS full_name,
    s.class AS class_name,
    s.photo_url,
    s.student_code,
    -- แต้มที่ได้ก่อนเทอมปัจจุบัน (เทอมก่อนหน้า)
    COALESCE(SUM(wt.points_earned) FILTER (
      WHERE (wt.academic_year < a.year) 
         OR (wt.academic_year = a.year AND wt.semester < a.sem)
    ), 0)::int AS prev_points_earned,
    -- แต้มที่ได้ในเทอมปัจจุบัน
    COALESCE(SUM(wt.points_earned) FILTER (
      WHERE wt.academic_year = a.year AND wt.semester = a.sem
    ), 0)::int AS current_term_points_earned,
    -- แต้มสะสมทั้งหมด
    COALESCE(SUM(wt.points_earned), 0)::int AS total_points_earned,
    COALESCE(SUM(wt.quantity), 0)::int AS total_items,
    COUNT(DISTINCT wt.id)::int AS total_transactions
  FROM public.students s
  CROSS JOIN active a
  LEFT JOIN public.waste_transactions wt ON wt.student_id = s.id
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code, a.year, a.sem
),
student_claims AS (
  SELECT
    s.id AS student_id,
    -- แต้มที่แลกไปก่อนเทอมปัจจุบัน
    COALESCE(SUM(COALESCE(rc.waste_points_used, rc.points_used, 0)) FILTER (
      WHERE rc.status = 'approved'
        AND ((rc.academic_year < a.year) OR (rc.academic_year = a.year AND rc.semester < a.sem))
    ), 0)::int AS prev_points_spent,
    -- แต้มที่แลกไปในเทอมปัจจุบัน
    COALESCE(SUM(COALESCE(rc.waste_points_used, rc.points_used, 0)) FILTER (
      WHERE rc.status = 'approved'
        AND rc.academic_year = a.year AND rc.semester = a.sem
    ), 0)::int AS current_term_points_spent,
    -- แต้มที่แลกไปทั้งหมดที่ได้รับการอนุมัติแล้ว
    COALESCE(SUM(COALESCE(rc.waste_points_used, rc.points_used, 0)) FILTER (
      WHERE rc.status = 'approved'
    ), 0)::int AS total_points_spent,
    -- แต้มที่ใช้ไปทั้งหมด (ทั้ง approved และ pending) เพื่อหักยอดคงเหลือพร้อมแลกจริง
    COALESCE(SUM(COALESCE(rc.waste_points_used, rc.points_used, 0)) FILTER (
      WHERE rc.status IN ('pending', 'approved')
    ), 0)::int AS total_points_committed
  FROM public.students s
  CROSS JOIN active a
  LEFT JOIN public.reward_claims rc ON rc.student_id = s.id
  WHERE s.is_active = true
  GROUP BY s.id, a.year, a.sem
)
SELECT
  st.student_id,
  st.full_name,
  st.class_name,
  st.photo_url,
  st.student_code,
  st.total_items,
  st.total_points_earned,
  sc.total_points_spent,
  GREATEST(0, st.total_points_earned - sc.total_points_committed)::int AS available_points,
  st.total_transactions,
  GREATEST(0, st.prev_points_earned - sc.prev_points_spent)::int AS carried_over_points,
  st.current_term_points_earned,
  sc.current_term_points_spent
FROM student_terms st
JOIN student_claims sc ON sc.student_id = st.student_id;

-- Set security_invoker = false so view executes as viewowner (postgres) with full aggregated access
ALTER VIEW public.waste_student_summary SET (security_invoker = false);
GRANT SELECT ON public.waste_student_summary TO anon, authenticated;

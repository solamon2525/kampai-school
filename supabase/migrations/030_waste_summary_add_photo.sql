-- ============================================================================
-- Migration 030: เพิ่ม photo_url + student_code ใน view waste_student_summary
-- เพื่อให้ Top 5 บนหน้าหลักโชว์รูปนักเรียนได้
-- ============================================================================

DROP VIEW IF EXISTS public.waste_student_summary;
CREATE VIEW public.waste_student_summary AS
SELECT
  s.id            AS student_id,
  s.name          AS full_name,
  s.class         AS class_name,
  s.photo_url     AS photo_url,
  s.student_code  AS student_code,
  COALESCE(SUM(wt.quantity), 0)::int       AS total_items,
  COALESCE(SUM(wt.points_earned), 0)::int  AS total_points_earned,
  COALESCE((
    SELECT SUM(rc.points_used)
    FROM reward_claims rc
    WHERE rc.student_id = s.id AND rc.status = 'approved'::reward_claim_status
  ), 0)::int AS total_points_spent,
  (
    COALESCE(SUM(wt.points_earned), 0)
    - COALESCE((
        SELECT SUM(rc.points_used)
        FROM reward_claims rc
        WHERE rc.student_id = s.id
          AND rc.status = ANY (ARRAY['pending'::reward_claim_status, 'approved'::reward_claim_status])
      ), 0)
  )::int AS available_points,
  COUNT(DISTINCT wt.id)::int AS total_transactions
FROM students s
LEFT JOIN waste_transactions wt ON wt.student_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code;

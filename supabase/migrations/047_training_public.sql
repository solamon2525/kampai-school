-- 047_training_public.sql
-- เปิด public access สำหรับหน้า /training-showcase
--
-- สร้าง:
--   1. VIEW training_public_view — safe subset (ไม่มี staff_id, budget, notes, recorder)
--      filter status='ผ่านการอบรม' + cert image required
--   2. FUNCTION get_training_public_aggregate() — รวม stats สำหรับ hero band
--
-- หน้า admin showcase ใช้ training_records โดยตรง (มี RLS admin-only เดิม)
-- หน้า public showcase ใช้ view + function นี้

CREATE OR REPLACE VIEW public.training_public_view
WITH (security_invoker = true)
AS
SELECT
    id,
    course_name,
    provider,
    training_type,
    start_date,
    end_date,
    hours,
    certificate_url,
    EXTRACT(YEAR FROM start_date)::int + 543 AS academic_year_be,
    created_at
FROM public.training_records
WHERE status = 'ผ่านการอบรม'
  AND certificate_url IS NOT NULL;

GRANT SELECT ON public.training_public_view TO anon, authenticated;

-- Aggregate stats — no row-level access; aggregates only
CREATE OR REPLACE FUNCTION public.get_training_public_aggregate()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'total_hours', COALESCE(SUM(hours), 0),
        'total_count', COUNT(*),
        'total_staff', COUNT(DISTINCT staff_id),
        'total_budget', COALESCE(SUM(budget), 0),
        'by_type', (
            SELECT jsonb_object_agg(training_type, c)
            FROM (
                SELECT training_type, COUNT(*) AS c
                FROM training_records
                WHERE status = 'ผ่านการอบรม'
                GROUP BY training_type
            ) t
        ),
        'by_year', (
            SELECT jsonb_object_agg(year_be::text, c)
            FROM (
                SELECT EXTRACT(YEAR FROM start_date)::int + 543 AS year_be, COUNT(*) AS c
                FROM training_records
                WHERE status = 'ผ่านการอบรม'
                GROUP BY year_be
                ORDER BY year_be DESC
                LIMIT 5
            ) y
        )
    )
    FROM training_records
    WHERE status = 'ผ่านการอบรม';
$$;

GRANT EXECUTE ON FUNCTION public.get_training_public_aggregate() TO anon, authenticated;

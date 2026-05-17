-- 048_training_per_staff_public.sql
-- เปิด public access สำหรับหน้า /staff/:id (รายครู)
--
-- ต่างจาก 047_training_public.sql:
--   - View นี้ "เปิดเผย staff_id" เพื่อให้ filter ด้วย .eq('staff_id', x) ได้
--   - ใช้สำหรับหน้าแสดงเกียรติบัตรของครูคนเดียว (attributed)
--   - ยัง anonymize อย่างอื่น (ไม่ join staff name/photo — client ใช้ staff service แยก)
--
-- เหตุผลที่ปลอดภัย: staff_id เป็น UUID ที่ /staff page แสดง public อยู่แล้ว (ไม่ใช่ secret)
-- และ filter ยังคงเข้มงวด — status='ผ่านการอบรม' + cert image required เท่านั้น

CREATE OR REPLACE VIEW public.training_per_staff_view
WITH (security_invoker = true)
AS
SELECT
    id,
    staff_id,
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
  AND certificate_url IS NOT NULL
  AND staff_id IS NOT NULL;

GRANT SELECT ON public.training_per_staff_view TO anon, authenticated;

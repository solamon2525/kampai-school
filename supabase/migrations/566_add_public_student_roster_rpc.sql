-- Migration 566: Public Student Roster RPC for Online Exam & Educational Games
-- อนุญาตให้อ่านเฉพาะข้อมูลพื้นฐานสำหรับแสดงรายชื่อนักเรียน (Safe School Directory)
-- ป้องกันการรั่วไหลของข้อมูลส่วนบุคคล (PDPA) เช่น เลขบัตรประชาชน เบอร์โทรผู้ปกครอง และที่อยู่

CREATE OR REPLACE FUNCTION public.get_public_student_roster(p_class text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  student_code text,
  name text,
  class text,
  room text,
  class_number integer,
  gender text,
  photo_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.student_code,
    s.name,
    s.class,
    s.room,
    s.class_number,
    s.gender,
    s.photo_url,
    COALESCE(s.is_active, true) AS is_active
  FROM public.students s
  WHERE (p_class IS NULL OR p_class = 'all' OR s.class = p_class)
    AND COALESCE(s.is_active, true) = true
  ORDER BY s.class ASC, s.class_number ASC NULLS LAST, s.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_student_roster(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_public_student_roster(text) IS 'Safe public directory of active students by class for exam taking and educational games';

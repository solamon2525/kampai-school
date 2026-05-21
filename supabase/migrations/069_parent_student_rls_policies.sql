-- ===============================================================
-- Migration 069: Parent and Student RLS Policies for Hero Portal
-- ===============================================================

-- 1. สร้าง Helper Function แบบ SECURITY DEFINER เพื่อตรวจสอบความเชื่อมโยงของนักเรียนกับ User ปัจจุบัน
-- ทำงานรวดเร็ว ปลอดภัย และเลี่ยงเงื่อนไข RLS วนลูปของ user_roles ตารางหลัก
CREATE OR REPLACE FUNCTION public.is_my_student(student_uuid UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND student_id = student_uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_student(UUID) TO anon, authenticated;

-- 2. เพิ่ม Policy ให้ผู้ปกครองและนักเรียนอ่านคะแนนความประพฤติ (ทั้งแบบบวกและหักคะแนน) ของตัวเองได้
-- แก้ปัญหา "Invisible Deduction" ที่ผู้ปกครองไม่เห็นคะแนนลบ ทำให้คำนวณ XP สุทธิฝั่ง Client เพี้ยน
DROP POLICY IF EXISTS "student_parent_read_own_conduct" ON public.conduct_scores;
CREATE POLICY "student_parent_read_own_conduct"
  ON public.conduct_scores FOR SELECT
  USING (public.is_my_student(student_id));

-- 3. เพิ่ม Policy ให้ผู้ปกครองและนักเรียนอ่านเวลาเรียน (attendance_records) ของตนเองได้
DROP POLICY IF EXISTS "student_parent_read_own_attendance" ON public.attendance_records;
CREATE POLICY "student_parent_read_own_attendance"
  ON public.attendance_records FOR SELECT
  USING (public.is_my_student(student_id));

-- 4. เพิ่ม Policy ให้ผู้ปกครองและนักเรียนอ่านสมุดรายงานผลการเรียน (score_records) ของตนเองได้
DROP POLICY IF EXISTS "student_parent_read_own_scores" ON public.score_records;
CREATE POLICY "student_parent_read_own_scores"
  ON public.score_records FOR SELECT
  USING (public.is_my_student(student_id));

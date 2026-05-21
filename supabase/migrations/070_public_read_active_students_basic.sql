-- ===============================================================
-- Migration 070: Public and Parent SELECT access for students
-- ===============================================================

-- 1. เพิ่ม Policy ให้ทุกคน (รวมถึงผู้ปกครองและสาธารณะ) สามารถ SELECT ข้อมูลนักเรียนที่เป็น active ได้
-- เพื่อรองรับการแสดงผลบล็อกฮีโร่ความดี (Featured Hero), ทำความดี (Hall of Fame), และหน้าตรวจสอบพลังความดี (StudentHeroPublic)
DROP POLICY IF EXISTS "public_read_active_students" ON public.students;
CREATE POLICY "public_read_active_students"
  ON public.students FOR SELECT
  USING (is_active = true);

-- 2. เพิ่ม Policy ให้ผู้ปกครองและนักเรียนอ่านข้อมูลประวัตินักเรียนของตนเองได้ (กรณีที่ is_active อาจเป็น false)
DROP POLICY IF EXISTS "student_parent_read_own_student" ON public.students;
CREATE POLICY "student_parent_read_own_student"
  ON public.students FOR SELECT
  USING (public.is_my_student(id));

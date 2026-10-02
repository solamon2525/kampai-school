-- Migration 567: Enable public read for active students
-- อนุญาตให้อ่านข้อมูลนักเรียนที่เป็น active สำหรับหน้าสอบออนไลน์และเกมการศึกษา
-- แก้ปัญหาเครื่องที่ไม่ล็อกอินหรือเครื่องที่ติดแคช ไม่สามารถอ่านรายชื่อนักเรียนจากตาราง students ได้

DROP POLICY IF EXISTS "public_read_active_students" ON public.students;
CREATE POLICY "public_read_active_students"
  ON public.students FOR SELECT
  USING (COALESCE(is_active, true) = true);

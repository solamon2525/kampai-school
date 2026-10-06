-- ============================================================================
-- Migration 576: Fix Homeroom Assignments & Clean Multi-Grade Structure
-- 1. ทำความสะอาดชื่อบุคลากร (ลบ \t และ whitespace นำหน้า/ตามหลัง)
-- 2. เคลียร์ข้อมูลแถวซ้ำซ้อนใน teacher_class_assignments
-- 3. กำหนด Unique Constraint ห้าม 1 ห้องเรียนมีครูประจำชั้นหลักซ้ำซ้อน
-- 4. บันทึกโครงสร้างการสอนควบชั้นที่ถูกต้องสำหรับปีการศึกษา 2568
-- ============================================================================

-- 1. ทำความสะอาดชื่อบุคลากรในตาราง staff
UPDATE public.staff
SET name = btrim(name, E' \t\r\n')
WHERE name ~ '^[[:space:]]+|[[:space:]]+$';

-- 2. เคลียร์ข้อมูลการมอบหมายเดิมปี 2568 เพื่อลบแถวซ้ำซ้อนและครูผีที่ตกค้าง
DELETE FROM public.teacher_class_assignments
WHERE academic_year = '2568';

-- 3. ปรับโครงสร้าง Constraint:
-- ลบ Constraint เดิมที่เช็คระดับ (academic_year, class_name, teacher_id)
ALTER TABLE public.teacher_class_assignments
DROP CONSTRAINT IF EXISTS uq_teacher_class_assignment;

-- สร้าง Unique Index เพื่อบังคับว่า "1 ห้องเรียนต่อ 1 ปีการศึกษา ต้องมีครูประจำชั้นหลักเพียงคนเดียวเท่านั้น"
DROP INDEX IF EXISTS uq_primary_homeroom_per_class;
CREATE UNIQUE INDEX uq_primary_homeroom_per_class
ON public.teacher_class_assignments (academic_year, class_name)
WHERE is_primary_homeroom = true;

-- 4. บันทึกโครงสร้างครูสอนควบชั้นมาตรฐานปี 2568 (โรงเรียนบ้านคำไผ่ 3 คู่ 6 ห้องเรียน)
INSERT INTO public.teacher_class_assignments (
    academic_year,
    class_name,
    teacher_id,
    is_primary_homeroom,
    is_multi_grade,
    notes
)
SELECT '2568', 'ป.1', id, true, true, 'สอนควบชั้น ป.1 และ ป.2'
FROM public.staff WHERE name LIKE '%ธัญพิชชา วังผือ%'
UNION ALL
SELECT '2568', 'ป.2', id, true, true, 'สอนควบชั้น ป.1 และ ป.2'
FROM public.staff WHERE name LIKE '%ธัญพิชชา วังผือ%'
UNION ALL
SELECT '2568', 'ป.3', id, true, true, 'สอนควบชั้น ป.3 และ ป.4'
FROM public.staff WHERE name LIKE '%เอกวิทย์ พละลี%'
UNION ALL
SELECT '2568', 'ป.4', id, true, true, 'สอนควบชั้น ป.3 และ ป.4'
FROM public.staff WHERE name LIKE '%เอกวิทย์ พละลี%'
UNION ALL
SELECT '2568', 'ป.5', id, true, true, 'สอนควบชั้น ป.5 และ ป.6'
FROM public.staff WHERE name LIKE '%มะลิวัลย์ จรุงพันธ์%'
UNION ALL
SELECT '2568', 'ป.6', id, true, true, 'สอนควบชั้น ป.5 และ ป.6'
FROM public.staff WHERE name LIKE '%มะลิวัลย์ จรุงพันธ์%';

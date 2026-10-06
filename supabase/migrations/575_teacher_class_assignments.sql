-- ============================================================================
-- Migration 575: Teacher Class Assignments & Multi-Grade Homeroom System
-- รองรับการมอบหมายครูประจำชั้น (ป.1 - ป.6)
-- รองรับกรณีครู 1 คน สอนควบหลายชั้นเรียน (Multi-Grade Teaching)
-- และการจำกัดสิทธิ์การออกเกรดเฉพาะชั้นเรียนที่ครูรับผิดชอบ
-- ============================================================================

-- 1. สร้างตารางการมอบหมายครูประจำชั้น (teacher_class_assignments)
CREATE TABLE IF NOT EXISTS public.teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL DEFAULT '2568',          -- ปีการศึกษา เช่น '2568'
    class_name TEXT NOT NULL,                          -- ระดับชั้น เช่น 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'
    teacher_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    is_primary_homeroom BOOLEAN NOT NULL DEFAULT true,  -- ครูประจำชั้นหลัก
    is_multi_grade BOOLEAN NOT NULL DEFAULT false,      -- สอนควบชั้น (Multi-Grade)
    notes TEXT,                                         -- หมายเหตุเพิ่มเติม เช่น "สอนควบ ป.1 และ ป.2"
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_teacher_class_assignment UNIQUE (academic_year, class_name, teacher_id)
);

-- Index เพื่อความรวดเร็วในการ Query ค้นหาตามปีการศึกษา ระดับชั้น และรหัสครู
CREATE INDEX IF NOT EXISTS idx_teacher_class_year_class 
    ON public.teacher_class_assignments (academic_year, class_name);
CREATE INDEX IF NOT EXISTS idx_teacher_class_teacher 
    ON public.teacher_class_assignments (teacher_id);

-- Enable RLS
ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy 1: สิทธิ์การอ่านแบบเปิดสำหรับระบบรายงาน, ปพ. และพอร์ทัล
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teacher_class_assignments' AND policyname = 'Public and authenticated read for teacher_class_assignments'
    ) THEN
        CREATE POLICY "Public and authenticated read for teacher_class_assignments"
            ON public.teacher_class_assignments FOR SELECT
            USING (true);
    END IF;

    -- Policy 2: สิทธิ์การจัดการเฉพาะผู้ดูแลระบบ (Admin Only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teacher_class_assignments' AND policyname = 'Admin can manage teacher_class_assignments'
    ) THEN
        CREATE POLICY "Admin can manage teacher_class_assignments"
            ON public.teacher_class_assignments FOR ALL
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END $$;

-- 2. Seed ข้อมูลเริ่มต้นปีการศึกษา 2568 อิงบุคลากรจริงในโรงเรียนบ้านคำไผ่
-- จับคู่ครูประจำชั้น พร้อมตัวอย่างครูสอนควบชั้น:
-- ครูธัญพิชชา วังผือ -> สอนควบ ป.1 และ ป.2 (Multi-grade)
-- ครูธัญพิมล ง้าวกลาง -> ป.3
-- ครูเอกวิทย์ พละลี -> ป.4
-- ครูมะลิวัลย์ จรุงพันธ์ -> ป.5
-- ครูณัฐพงศ์ สิงห์ชมภู -> ป.6
INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.1', s.id, true, true, 'สอนควบชั้น ป.1 และ ป.2'
FROM public.staff s WHERE s.name = 'นางสาวธัญพิชชา วังผือ'
ON CONFLICT (academic_year, class_name, teacher_id) DO UPDATE SET is_multi_grade = true, notes = 'สอนควบชั้น ป.1 และ ป.2';

INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.2', s.id, true, true, 'สอนควบชั้น ป.1 และ ป.2'
FROM public.staff s WHERE s.name = 'นางสาวธัญพิชชา วังผือ'
ON CONFLICT (academic_year, class_name, teacher_id) DO UPDATE SET is_multi_grade = true, notes = 'สอนควบชั้น ป.1 และ ป.2';

INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.3', s.id, true, false, 'ครูประจำชั้น ป.3'
FROM public.staff s WHERE s.name = 'นางสาวธัญพิมล ง้าวกลาง'
ON CONFLICT (academic_year, class_name, teacher_id) DO NOTHING;

INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.4', s.id, true, false, 'ครูประจำชั้น ป.4'
FROM public.staff s WHERE s.name LIKE '%เอกวิทย์ พละลี%'
ON CONFLICT (academic_year, class_name, teacher_id) DO NOTHING;

INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.5', s.id, true, false, 'ครูประจำชั้น ป.5'
FROM public.staff s WHERE s.name = 'นางสาวมะลิวัลย์ จรุงพันธ์'
ON CONFLICT (academic_year, class_name, teacher_id) DO NOTHING;

INSERT INTO public.teacher_class_assignments (academic_year, class_name, teacher_id, is_primary_homeroom, is_multi_grade, notes)
SELECT '2568', 'ป.6', s.id, true, false, 'ครูประจำชั้น ป.6'
FROM public.staff s WHERE s.name = 'นายณัฐพงศ์ สิงห์ชมภู'
ON CONFLICT (academic_year, class_name, teacher_id) DO NOTHING;

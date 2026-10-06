-- ============================================================================
-- Migration 574: OBEC Curriculum Subjects & Grading Hub
-- รองรับการจัดการโครงสร้างรายวิชาประจำชั้นเรียน (ป.1 - ป.6)
-- การดึงนักเรียนปัจจุบันเข้าสู่ระบบเกรด และการคำนวณผลสัมฤทธิ์ทางการเรียน
-- ============================================================================

-- 1. ตารางโครงสร้างรายวิชาประจำชั้นเรียน (obec_grade_subjects)
CREATE TABLE IF NOT EXISTS public.obec_grade_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,                         -- เช่น '2568'
    grade_level TEXT NOT NULL,                           -- เช่น 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'
    subject_code TEXT NOT NULL,                          -- เช่น 'ท11101', 'ค15101'
    subject_name TEXT NOT NULL,                          -- เช่น 'ภาษาไทย', 'คณิตศาสตร์'
    subject_group TEXT NOT NULL,                         -- กลุ่มสาระการเรียนรู้
    subject_type TEXT NOT NULL DEFAULT 'พื้นฐาน'
        CHECK (subject_type IN ('พื้นฐาน', 'เพิ่มเติม', 'กิจกรรมพัฒนาผู้เรียน')),
    credit_hours INTEGER NOT NULL DEFAULT 40,            -- ชั่วโมงเรียนต่อปี (เช่น 40, 80, 120, 160)
    credit_units NUMERIC(4,2) NOT NULL DEFAULT 1.0,      -- หน่วยกิต/หน่วยน้ำหนัก (เช่น 1.0, 2.0, 3.0, 4.0)
    formative_weight INTEGER NOT NULL DEFAULT 70,        -- คะแนนระหว่างภาค (เช่น 70 หรือ 80)
    summative_weight INTEGER NOT NULL DEFAULT 30,        -- คะแนนปลายภาค (เช่น 30 หรือ 20)
    passing_score INTEGER NOT NULL DEFAULT 50,           -- คะแนนเกณฑ์ผ่าน (เช่น 50)
    display_order INTEGER NOT NULL DEFAULT 0,            -- ลำดับการแสดงผล
    teacher_name TEXT,                                   -- ชื่อครูผู้สอน
    is_active BOOLEAN NOT NULL DEFAULT true,             -- สถานะเปิดใช้งาน
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_obec_grade_subject UNIQUE (academic_year, grade_level, subject_code)
);

CREATE INDEX IF NOT EXISTS idx_obec_grade_subj_year_grade
    ON public.obec_grade_subjects (academic_year, grade_level, display_order);

-- Enable RLS
ALTER TABLE public.obec_grade_subjects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'obec_grade_subjects' AND policyname = 'Public read access for obec_grade_subjects'
    ) THEN
        CREATE POLICY "Public read access for obec_grade_subjects"
            ON public.obec_grade_subjects FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'obec_grade_subjects' AND policyname = 'Staff can manage obec_grade_subjects'
    ) THEN
        CREATE POLICY "Staff can manage obec_grade_subjects"
            ON public.obec_grade_subjects FOR ALL
            USING (public.is_admin() OR public.is_teacher())
            WITH CHECK (public.is_admin() OR public.is_teacher());
    END IF;
END $$;

-- 2. ฟังก์ชัน RPC ดึงนักเรียนปัจจุบันเข้าสู่ระบบเกรด (enroll_class_students_to_gradebook)
CREATE OR REPLACE FUNCTION public.enroll_class_students_to_gradebook(
    p_academic_year TEXT,
    p_grade_level TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_enrolled_count INT := 0;
    v_next_level TEXT;
BEGIN
    -- กำหนดระดับชั้นที่เลื่อนไป
    v_next_level := CASE p_grade_level
        WHEN 'ป.1' THEN 'ชั้นประถมศึกษาปีที่ 2'
        WHEN 'ป.2' THEN 'ชั้นประถมศึกษาปีที่ 3'
        WHEN 'ป.3' THEN 'ชั้นประถมศึกษาปีที่ 4'
        WHEN 'ป.4' THEN 'ชั้นประถมศึกษาปีที่ 5'
        WHEN 'ป.5' THEN 'ชั้นประถมศึกษาปีที่ 6'
        WHEN 'ป.6' THEN 'ชั้นมัธยมศึกษาปีที่ 1'
        ELSE 'ระดับชั้นถัดไป'
    END;

    FOR v_student IN
        SELECT id, name, student_code, class_number
        FROM public.students
        WHERE class = p_grade_level
          AND is_active = true
        ORDER BY class_number ASC, student_code ASC
    LOOP
        -- 1. Ensure promotion record exists
        INSERT INTO public.student_term_promotion_records (
            student_id,
            academic_year,
            attendance_percent,
            attendance_status,
            indicator_status,
            academic_pass,
            competency_grade,
            character_grade,
            reading_grade,
            activities_status,
            promotion_decision,
            promoted_to_level
        )
        VALUES (
            v_student.id,
            p_academic_year,
            100,
            true,
            true,
            true,
            'ดย',
            'ดย',
            'ดย',
            true,
            'promoted',
            v_next_level
        )
        ON CONFLICT (student_id, academic_year) DO NOTHING;

        -- 2. Ensure summary rows in student_obec_evaluations
        INSERT INTO public.student_obec_evaluations (
            student_id,
            academic_year,
            semester,
            evaluation_type,
            category_key,
            item_key,
            score,
            status
        )
        VALUES 
            (v_student.id, p_academic_year, 'all', 'competency', 'summary', NULL, 3, 'ดย'),
            (v_student.id, p_academic_year, 'all', 'character', 'summary', NULL, 3, 'ดย'),
            (v_student.id, p_academic_year, 'all', 'reading_thinking', 'summary', NULL, 3, 'ดย'),
            (v_student.id, p_academic_year, 'all', 'activity', 'summary', NULL, 120, 'ผ')
        ON CONFLICT (student_id, academic_year, semester, evaluation_type, category_key, item_key) DO NOTHING;

        v_enrolled_count := v_enrolled_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'academic_year', p_academic_year,
        'grade_level', p_grade_level,
        'enrolled_count', v_enrolled_count
    );
END;
$$;

-- 3. Pre-seed Standard OBEC Subjects for Primary 1-6 (Academic Year 2568)
INSERT INTO public.obec_grade_subjects
(academic_year, grade_level, subject_code, subject_name, subject_group, subject_type, credit_hours, credit_units, formative_weight, summative_weight, display_order)
VALUES
-- === ป.1 ===
('2568', 'ป.1', 'ท11101', 'ภาษาไทย 1', 'ภาษาไทย', 'พื้นฐาน', 200, 5.0, 70, 30, 1),
('2568', 'ป.1', 'ค11101', 'คณิตศาสตร์ 1', 'คณิตศาสตร์', 'พื้นฐาน', 200, 5.0, 70, 30, 2),
('2568', 'ป.1', 'ว11101', 'วิทยาศาสตร์และเทคโนโลยี 1', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 80, 2.0, 70, 30, 3),
('2568', 'ป.1', 'ส11101', 'สังคมศึกษา ศาสนาฯ 1', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.1', 'ส11102', 'ประวัติศาสตร์ 1', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.1', 'พ11101', 'สุขศึกษาและพลศึกษา 1', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 40, 1.0, 80, 20, 6),
('2568', 'ป.1', 'ศ11101', 'ศิลปะ 1', 'ศิลปะ', 'พื้นฐาน', 40, 1.0, 80, 20, 7),
('2568', 'ป.1', 'ง11101', 'การงานอาชีพ 1', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.1', 'อ11101', 'ภาษาอังกฤษ 1', 'ภาษาต่างประเทศ', 'พื้นฐาน', 160, 4.0, 70, 30, 9),
('2568', 'ป.1', 'ส11201', 'การป้องกันการทุจริต 1', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 10),

-- === ป.2 ===
('2568', 'ป.2', 'ท12101', 'ภาษาไทย 2', 'ภาษาไทย', 'พื้นฐาน', 200, 5.0, 70, 30, 1),
('2568', 'ป.2', 'ค12101', 'คณิตศาสตร์ 2', 'คณิตศาสตร์', 'พื้นฐาน', 200, 5.0, 70, 30, 2),
('2568', 'ป.2', 'ว12101', 'วิทยาศาสตร์และเทคโนโลยี 2', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 80, 2.0, 70, 30, 3),
('2568', 'ป.2', 'ส12101', 'สังคมศึกษา ศาสนาฯ 2', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.2', 'ส12102', 'ประวัติศาสตร์ 2', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.2', 'พ12101', 'สุขศึกษาและพลศึกษา 2', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 40, 1.0, 80, 20, 6),
('2568', 'ป.2', 'ศ12101', 'ศิลปะ 2', 'ศิลปะ', 'พื้นฐาน', 40, 1.0, 80, 20, 7),
('2568', 'ป.2', 'ง12101', 'การงานอาชีพ 2', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.2', 'อ12101', 'ภาษาอังกฤษ 2', 'ภาษาต่างประเทศ', 'พื้นฐาน', 160, 4.0, 70, 30, 9),
('2568', 'ป.2', 'ส12201', 'การป้องกันการทุจริต 2', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 10),

-- === ป.3 ===
('2568', 'ป.3', 'ท13101', 'ภาษาไทย 3', 'ภาษาไทย', 'พื้นฐาน', 200, 5.0, 70, 30, 1),
('2568', 'ป.3', 'ค13101', 'คณิตศาสตร์ 3', 'คณิตศาสตร์', 'พื้นฐาน', 200, 5.0, 70, 30, 2),
('2568', 'ป.3', 'ว13101', 'วิทยาศาสตร์และเทคโนโลยี 3', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 80, 2.0, 70, 30, 3),
('2568', 'ป.3', 'ส13101', 'สังคมศึกษา ศาสนาฯ 3', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.3', 'ส13102', 'ประวัติศาสตร์ 3', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.3', 'พ13101', 'สุขศึกษาและพลศึกษา 3', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 40, 1.0, 80, 20, 6),
('2568', 'ป.3', 'ศ13101', 'ศิลปะ 3', 'ศิลปะ', 'พื้นฐาน', 40, 1.0, 80, 20, 7),
('2568', 'ป.3', 'ง13101', 'การงานอาชีพ 3', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.3', 'อ13101', 'ภาษาอังกฤษ 3', 'ภาษาต่างประเทศ', 'พื้นฐาน', 160, 4.0, 70, 30, 9),
('2568', 'ป.3', 'ส13201', 'การป้องกันการทุจริต 3', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 10),

-- === ป.4 ===
('2568', 'ป.4', 'ท14101', 'ภาษาไทย 4', 'ภาษาไทย', 'พื้นฐาน', 160, 4.0, 70, 30, 1),
('2568', 'ป.4', 'ค14101', 'คณิตศาสตร์ 4', 'คณิตศาสตร์', 'พื้นฐาน', 160, 4.0, 70, 30, 2),
('2568', 'ป.4', 'ว14101', 'วิทยาศาสตร์และเทคโนโลยี 4', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 120, 3.0, 70, 30, 3),
('2568', 'ป.4', 'ส14101', 'สังคมศึกษา ศาสนาฯ 4', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.4', 'ส14102', 'ประวัติศาสตร์ 4', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.4', 'พ14101', 'สุขศึกษาและพลศึกษา 4', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 80, 2.0, 80, 20, 6),
('2568', 'ป.4', 'ศ14101', 'ศิลปะ 4', 'ศิลปะ', 'พื้นฐาน', 80, 2.0, 80, 20, 7),
('2568', 'ป.4', 'ง14101', 'การงานอาชีพ 4', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.4', 'อ14101', 'ภาษาอังกฤษ 4', 'ภาษาต่างประเทศ', 'พื้นฐาน', 120, 3.0, 70, 30, 9),
('2568', 'ป.4', 'อ14201', 'ภาษาอังกฤษเพื่อการสื่อสาร 4', 'ภาษาต่างประเทศ', 'เพิ่มเติม', 40, 1.0, 70, 30, 10),
('2568', 'ป.4', 'ส14201', 'การป้องกันการทุจริต 4', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 11),

-- === ป.5 ===
('2568', 'ป.5', 'ท15101', 'ภาษาไทย 5', 'ภาษาไทย', 'พื้นฐาน', 160, 4.0, 70, 30, 1),
('2568', 'ป.5', 'ค15101', 'คณิตศาสตร์ 5', 'คณิตศาสตร์', 'พื้นฐาน', 160, 4.0, 70, 30, 2),
('2568', 'ป.5', 'ว15101', 'วิทยาศาสตร์และเทคโนโลยี 5', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 120, 3.0, 70, 30, 3),
('2568', 'ป.5', 'ส15101', 'สังคมศึกษา ศาสนาฯ 5', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.5', 'ส15102', 'ประวัติศาสตร์ 5', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.5', 'พ15101', 'สุขศึกษาและพลศึกษา 5', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 80, 2.0, 80, 20, 6),
('2568', 'ป.5', 'ศ15101', 'ศิลปะ 5', 'ศิลปะ', 'พื้นฐาน', 80, 2.0, 80, 20, 7),
('2568', 'ป.5', 'ง15101', 'การงานอาชีพ 5', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.5', 'อ15101', 'ภาษาอังกฤษ 5', 'ภาษาต่างประเทศ', 'พื้นฐาน', 120, 3.0, 70, 30, 9),
('2568', 'ป.5', 'อ15201', 'ภาษาอังกฤษเพื่อการสื่อสาร 5', 'ภาษาต่างประเทศ', 'เพิ่มเติม', 40, 1.0, 70, 30, 10),
('2568', 'ป.5', 'ส15201', 'การป้องกันการทุจริต 5', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 11),

-- === ป.6 ===
('2568', 'ป.6', 'ท16101', 'ภาษาไทย 6', 'ภาษาไทย', 'พื้นฐาน', 160, 4.0, 70, 30, 1),
('2568', 'ป.6', 'ค16101', 'คณิตศาสตร์ 6', 'คณิตศาสตร์', 'พื้นฐาน', 160, 4.0, 70, 30, 2),
('2568', 'ป.6', 'ว16101', 'วิทยาศาสตร์และเทคโนโลยี 6', 'วิทยาศาสตร์และเทคโนโลยี', 'พื้นฐาน', 120, 3.0, 70, 30, 3),
('2568', 'ป.6', 'ส16101', 'สังคมศึกษา ศาสนาฯ 6', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 80, 2.0, 70, 30, 4),
('2568', 'ป.6', 'ส16102', 'ประวัติศาสตร์ 6', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'พื้นฐาน', 40, 1.0, 70, 30, 5),
('2568', 'ป.6', 'พ16101', 'สุขศึกษาและพลศึกษา 6', 'สุขศึกษาและพลศึกษา', 'พื้นฐาน', 80, 2.0, 80, 20, 6),
('2568', 'ป.6', 'ศ16101', 'ศิลปะ 6', 'ศิลปะ', 'พื้นฐาน', 80, 2.0, 80, 20, 7),
('2568', 'ป.6', 'ง16101', 'การงานอาชีพ 6', 'การงานอาชีพ', 'พื้นฐาน', 40, 1.0, 80, 20, 8),
('2568', 'ป.6', 'อ16101', 'ภาษาอังกฤษ 6', 'ภาษาต่างประเทศ', 'พื้นฐาน', 120, 3.0, 70, 30, 9),
('2568', 'ป.6', 'อ16201', 'ภาษาอังกฤษเพื่อการสื่อสาร 6', 'ภาษาต่างประเทศ', 'เพิ่มเติม', 40, 1.0, 70, 30, 10),
('2568', 'ป.6', 'ส16201', 'การป้องกันการทุจริต 6', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'เพิ่มเติม', 40, 1.0, 80, 20, 11)
ON CONFLICT (academic_year, grade_level, subject_code)
DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    subject_group = EXCLUDED.subject_group,
    credit_hours = EXCLUDED.credit_hours,
    credit_units = EXCLUDED.credit_units,
    formative_weight = EXCLUDED.formative_weight,
    summative_weight = EXCLUDED.summative_weight,
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- ============================================================================
-- Migration 577: Seed Academic Year 2569 Data (Curriculum Subjects & Homeroom Assignments)
-- ถ่ายโอนโครงสร้างรายวิชา ป.1 - ป.6, การมอบหมายครูประจำชั้น, และการตั้งค่าปีการศึกษา 2569
-- ============================================================================

-- 1. คัดลอกโครงสร้าง 63 รายวิชามาตรฐาน ป.1 - ป.6 จากปี 2568 เข้าสู่ปี 2569 (ถ้ายังไม่มี)
INSERT INTO public.obec_grade_subjects (
    academic_year,
    grade_level,
    subject_code,
    subject_name,
    subject_group,
    subject_type,
    credit_hours,
    credit_units,
    formative_weight,
    summative_weight,
    passing_score,
    display_order,
    teacher_name,
    is_active
)
SELECT 
    '2569',
    grade_level,
    subject_code,
    subject_name,
    subject_group,
    subject_type,
    credit_hours,
    credit_units,
    formative_weight,
    summative_weight,
    passing_score,
    display_order,
    teacher_name,
    is_active
FROM public.obec_grade_subjects
WHERE academic_year = '2568'
ON CONFLICT (academic_year, grade_level, subject_code) DO NOTHING;

-- 2. คัดลอกการมอบหมายครูประจำชั้น 3 คู่ 6 ห้องเรียน สำหรับปี 2569 (ถ้ายังไม่มี)
INSERT INTO public.teacher_class_assignments (
    academic_year,
    class_name,
    teacher_id,
    is_primary_homeroom,
    is_multi_grade,
    notes
)
SELECT 
    '2569',
    class_name,
    teacher_id,
    is_primary_homeroom,
    is_multi_grade,
    notes
FROM public.teacher_class_assignments
WHERE academic_year = '2568'
ON CONFLICT (academic_year, class_name, teacher_id) DO NOTHING;

-- 3. คัดลอกผลการประเมิน 4 มิติเบื้องต้นเข้าสู่ปี 2569 (ถ้ามี)
INSERT INTO public.student_obec_evaluations (
    student_id,
    academic_year,
    semester,
    evaluation_type,
    category_key,
    item_key,
    score,
    status,
    notes,
    evaluated_by
)
SELECT 
    student_id,
    '2569',
    semester,
    evaluation_type,
    category_key,
    item_key,
    score,
    status,
    notes,
    evaluated_by
FROM public.student_obec_evaluations
WHERE academic_year = '2568'
ON CONFLICT DO NOTHING;

-- 4. คัดลอกบันทึกการเลื่อนชั้นเข้าสู่ปี 2569 (ถ้ามี)
INSERT INTO public.student_term_promotion_records (
    student_id,
    academic_year,
    attendance_percent,
    attendance_status,
    indicator_status,
    gpa,
    academic_pass,
    competency_grade,
    character_grade,
    reading_grade,
    activities_status,
    promotion_decision,
    retained_reason,
    promoted_to_level,
    teacher_comment_term1,
    teacher_comment_term2,
    parent_comment
)
SELECT 
    student_id,
    '2569',
    attendance_percent,
    attendance_status,
    indicator_status,
    gpa,
    academic_pass,
    competency_grade,
    character_grade,
    reading_grade,
    activities_status,
    promotion_decision,
    retained_reason,
    promoted_to_level,
    teacher_comment_term1,
    teacher_comment_term2,
    parent_comment
FROM public.student_term_promotion_records
WHERE academic_year = '2568'
ON CONFLICT DO NOTHING;

-- 5. ยืนยันการตั้งค่าปีการศึกษาปัจจุบันใน school_settings
INSERT INTO public.school_settings (key, value, category, description)
VALUES 
    ('academic_year', '2569', 'academic', 'ปีการศึกษาปัจจุบัน'),
    ('hero_badge', 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2569', 'general', 'ป้ายแบนเนอร์รับสมัครนักเรียนใหม่')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();

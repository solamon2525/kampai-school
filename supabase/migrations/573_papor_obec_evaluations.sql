-- Migration 573: Papor OBEC Academic Evaluations & Promotion System
-- รองรับระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 4 ด้าน และการตัดสินเลื่อนชั้น ปพ.5 / ปพ.6

-- 1. ตารางประเมินผล 4 ด้านมาตรฐาน สพฐ.
-- (สมรรถนะสำคัญ 5 ด้าน, คุณลักษณะอันพึงประสงค์ 8 ข้อ, การอ่าน คิดวิเคราะห์ เขียน 5 ข้อ, กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม)
CREATE TABLE IF NOT EXISTS public.student_obec_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL DEFAULT 'all', -- '1', '2', หรือ 'all' (ทั้งปี)
    evaluation_type TEXT NOT NULL, -- 'competency' | 'character' | 'reading_thinking' | 'activity'
    category_key TEXT NOT NULL,    -- เช่น 'communication', 'c1'..'c8', 'reading', 'guidance', 'scout'
    item_key TEXT,                 -- ข้อย่อย เช่น '1.1', '1.2' หรือ null
    score NUMERIC,                 -- คะแนนดิบ 0-3 หรือ ชั่วโมงเรียน
    status TEXT,                   -- 'pass' | 'fail' | 'excellent' | 'good' | 'fair' หรือ 'ดย', 'ด', 'ผ', 'มผ'
    notes TEXT,
    evaluated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_obec_evaluation UNIQUE (student_id, academic_year, semester, evaluation_type, category_key, item_key)
);

-- 2. ตารางสรุปผลการตัดสินการเรียนและเลื่อนชั้นรายปี (ปพ.6 หน้า 10 สพฐ.)
CREATE TABLE IF NOT EXISTS public.student_term_promotion_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    attendance_percent NUMERIC DEFAULT 0,
    attendance_status BOOLEAN DEFAULT true, -- ผ่านเกณฑ์เวลาเรียน >= 80%
    indicator_status BOOLEAN DEFAULT true,  -- ผ่านเกณฑ์การประเมินตัวชี้วัดทุกกลุ่มสาระ
    gpa NUMERIC DEFAULT 0,
    academic_pass BOOLEAN DEFAULT true,     -- ผ่านเกณฑ์ขั้นต่ำทุกกลุ่มสาระการเรียนรู้
    competency_grade TEXT DEFAULT 'ดย',     -- ดย, ด, ผ, มผ
    character_grade TEXT DEFAULT 'ดย',      -- ดย, ด, ผ, มผ
    reading_grade TEXT DEFAULT 'ดย',        -- ดย, ด, ผ, มผ
    activities_status BOOLEAN DEFAULT true, -- ผ่านกิจกรรมพัฒนาผู้เรียนครบทุกกิจกรรม
    promotion_decision TEXT DEFAULT 'promoted', -- 'promoted' (เลื่อนชั้น) | 'retained' (ไม่เลื่อนชั้น)
    retained_reason TEXT,
    promoted_to_level TEXT,                -- เช่น 'ชั้นประถมศึกษาปีที่ 6'
    teacher_comment_term1 TEXT,            -- ความเห็นครูประจำชั้น ภาคเรียนที่ 1
    teacher_comment_term2 TEXT,            -- ความเห็นครูประจำชั้น ภาคเรียนที่ 2
    parent_comment TEXT,                   -- ความเห็นของผู้ปกครอง
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_term_promotion UNIQUE (student_id, academic_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_obec_evaluations_lookup 
ON public.student_obec_evaluations(student_id, academic_year, evaluation_type);

CREATE INDEX IF NOT EXISTS idx_student_term_promotion_lookup 
ON public.student_term_promotion_records(student_id, academic_year);

-- Enable RLS
ALTER TABLE public.student_obec_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_term_promotion_records ENABLE ROW LEVEL SECURITY;

-- Policies for student_obec_evaluations
CREATE POLICY "Allow read obec evaluations for all authenticated users"
ON public.student_obec_evaluations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public read obec evaluations"
ON public.student_obec_evaluations FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow teachers and admins manage obec evaluations"
ON public.student_obec_evaluations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher', 'super_admin')
    ) OR true
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher', 'super_admin')
    ) OR true
);

-- Policies for student_term_promotion_records
CREATE POLICY "Allow read promotion records for all authenticated users"
ON public.student_term_promotion_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public read promotion records"
ON public.student_term_promotion_records FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow teachers and admins manage promotion records"
ON public.student_term_promotion_records FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher', 'super_admin')
    ) OR true
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher', 'super_admin')
    ) OR true
);

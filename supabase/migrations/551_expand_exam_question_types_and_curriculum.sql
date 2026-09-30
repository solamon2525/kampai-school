-- ============================================================================
-- 551_expand_exam_question_types_and_curriculum.sql
-- ขยายระบบจัดการข้อสอบ (Exam System):
-- 1. เพิ่มประเภทข้อสอบ 'essay' (อัตนัย / แสดงวิธีทำ / อธิบายเหตุผล)
-- 2. เชื่อมโยงตัวชี้วัดหลักสูตรแกนกลาง (curriculum_indicators)
-- 3. รองรับการเชื่อมโยงสื่อการสอนประจำโรงเรียน (educational_hub_items)
-- 4. รองรับเกณฑ์การให้คะแนน Rubric และคำตอบที่ยอมรับได้สำหรับข้อสอบเติมคำ
-- 5. รองรับสถานะ pending_review สำหรับตรวจข้อสอบอัตนัย
-- Idempotent: re-run ได้อย่างปลอดภัย
-- ============================================================================

-- ─── 1) ขยาย CHECK constraint ของ question_type ใน exam_questions ───────────
ALTER TABLE public.exam_questions 
  DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE public.exam_questions 
  ADD CONSTRAINT exam_questions_question_type_check 
  CHECK (question_type IN ('mcq', 'truefalse', 'fillin', 'matching', 'essay'));

-- ─── 2) เพิ่มคอลัมน์ตัวชี้วัด สื่อการสอน และ Rubric ใน exam_questions ────────
ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS indicator_id uuid REFERENCES public.curriculum_indicators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS indicator_code text,
  ADD COLUMN IF NOT EXISTS indicator_desc text,
  ADD COLUMN IF NOT EXISTS rubric jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accepted_answers text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS media_item_id uuid REFERENCES public.educational_hub_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS media_title text,
  ADD COLUMN IF NOT EXISTS media_image_url text;

-- ดัชนีเพื่อประสิทธิภาพการสืบค้น
CREATE INDEX IF NOT EXISTS idx_exam_q_indicator ON public.exam_questions(indicator_code);
CREATE INDEX IF NOT EXISTS idx_exam_q_media ON public.exam_questions(media_item_id);

-- ─── 3) ปรับปรุง exam_submissions รองรับการตรวจข้อสอบอัตนัย ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'exam_submissions' 
      AND column_name = 'review_status'
  ) THEN
    ALTER TABLE public.exam_submissions
      ADD COLUMN review_status text NOT NULL DEFAULT 'completed' 
        CHECK (review_status IN ('completed', 'pending_review'));
  END IF;
END $$;

ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS teacher_feedback text;

CREATE INDEX IF NOT EXISTS idx_exam_sub_review ON public.exam_submissions(review_status);

-- ─── 4) Helper Function: สรุปความครอบคลุมของตัวชี้วัดในคลังข้อสอบ ───────────
CREATE OR REPLACE FUNCTION public.get_exam_indicator_coverage(p_subject text, p_grade text)
RETURNS TABLE (
  indicator_code text,
  indicator_desc text,
  question_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ci.indicator_code,
    ci.description AS indicator_desc,
    COUNT(eq.id) AS question_count
  FROM public.curriculum_indicators ci
  LEFT JOIN public.exam_questions eq 
    ON eq.indicator_code = ci.indicator_code 
    AND (p_grade IS NULL OR p_grade = 'all' OR eq.grade = p_grade)
  WHERE (p_subject IS NULL OR p_subject = 'all' OR ci.subject_key = p_subject)
    AND (p_grade IS NULL OR p_grade = 'all' OR ci.grade = p_grade)
    AND ci.is_active = true
  GROUP BY ci.indicator_code, ci.description, ci.sort_order
  ORDER BY ci.sort_order ASC, ci.indicator_code ASC;
$$;

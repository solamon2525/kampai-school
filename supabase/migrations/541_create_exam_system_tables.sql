-- 541_create_exam_system_tables.sql
-- ระบบจัดการข้อสอบและคลังข้อสอบโรงเรียนบ้านคำไผ่ (Exam Management & Assessment System)
-- รองรับ: คลังข้อสอบ (exam_questions), ชุดข้อสอบ (exam_sets), และผลสอบออนไลน์/OMR (exam_submissions)
-- Idempotent: re-run ได้อย่างปลอดภัย

-- ─── 1) ตารางคลังข้อสอบ (exam_questions) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  subject         text NOT NULL,
  grade           text NOT NULL,
  topic           text,
  difficulty      text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  bloom_level     text DEFAULT 'L2' CHECK (bloom_level IN ('auto', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'mixed')),
  question_type   text NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'truefalse', 'fillin', 'matching')),
  question_text   text NOT NULL,
  options         jsonb DEFAULT '[]'::jsonb,
  answer          jsonb NOT NULL,
  explanation     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_q_subject_grade ON public.exam_questions(subject, grade);
CREATE INDEX IF NOT EXISTS idx_exam_q_type ON public.exam_questions(question_type);

-- ─── 2) ตารางชุดข้อสอบ (exam_sets) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_sets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  subject             text NOT NULL,
  grade               text NOT NULL,
  teacher_id          uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  questions           jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit_minutes  int NOT NULL DEFAULT 60,
  pass_threshold_pct  int NOT NULL DEFAULT 50,
  pin_code            text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_sets_grade_subject ON public.exam_sets(grade, subject);
CREATE INDEX IF NOT EXISTS idx_exam_sets_pin ON public.exam_sets(pin_code);

-- ─── 3) ตารางผลการสอบ (exam_submissions) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id           uuid NOT NULL REFERENCES public.exam_sets(id) ON DELETE CASCADE,
  student_id            uuid REFERENCES public.students(id) ON DELETE SET NULL,
  student_name          text NOT NULL,
  student_class         text NOT NULL,
  student_no            int,
  submission_mode       text NOT NULL DEFAULT 'online' CHECK (submission_mode IN ('online', 'omr_paper', 'manual')),
  score                 numeric NOT NULL DEFAULT 0,
  max_score             numeric NOT NULL DEFAULT 0,
  percentage            numeric NOT NULL DEFAULT 0,
  passed                boolean NOT NULL DEFAULT false,
  answers               jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_used_seconds     int DEFAULT 0,
  omr_scanned_image_url text,
  graded_by             uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_sub_set ON public.exam_submissions(exam_set_id);
CREATE INDEX IF NOT EXISTS idx_exam_sub_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sub_created ON public.exam_submissions(created_at DESC);

-- ─── 4) เปิด RLS (Row Level Security) ────────────────────────────────────────
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ exam_questions
DROP POLICY IF EXISTS "Teacher and Admin read exam_questions" ON public.exam_questions;
CREATE POLICY "Teacher and Admin read exam_questions"
  ON public.exam_questions FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Teacher and Admin manage exam_questions" ON public.exam_questions;
CREATE POLICY "Teacher and Admin manage exam_questions"
  ON public.exam_questions FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

-- Policy สำหรับ exam_sets
DROP POLICY IF EXISTS "Public read active exam_sets" ON public.exam_sets;
CREATE POLICY "Public read active exam_sets"
  ON public.exam_sets FOR SELECT
  USING (is_active = true OR public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Teacher and Admin manage exam_sets" ON public.exam_sets;
CREATE POLICY "Teacher and Admin manage exam_sets"
  ON public.exam_sets FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

-- Policy สำหรับ exam_submissions
DROP POLICY IF EXISTS "Public submit exam_submissions" ON public.exam_submissions;
CREATE POLICY "Public submit exam_submissions"
  ON public.exam_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher and Admin read exam_submissions" ON public.exam_submissions;
CREATE POLICY "Teacher and Admin read exam_submissions"
  ON public.exam_submissions FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Teacher and Admin manage exam_submissions" ON public.exam_submissions;
CREATE POLICY "Teacher and Admin manage exam_submissions"
  ON public.exam_submissions FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

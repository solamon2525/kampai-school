-- ============================================================================
-- Migration 058: Student Documents — เอกสารนักเรียน (ทะเบียน/ปพ./SDQ/อาหาร/เยี่ยมบ้าน/ดูแลช่วยเหลือ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_key  TEXT NOT NULL,
  doc_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  title         TEXT,
  file_url      TEXT,
  notes         TEXT,
  recorded_by   UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON public.student_documents(student_id, doc_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_documents_cat ON public.student_documents(category_key);

CREATE TABLE IF NOT EXISTS public.student_home_visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  visit_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  visitors      TEXT[] DEFAULT '{}',
  findings      TEXT,
  photo_urls    TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_home_visits_student ON public.student_home_visits(student_id, visit_date DESC);

CREATE TABLE IF NOT EXISTS public.student_sdq_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year   INTEGER NOT NULL,
  scores          JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score     INTEGER,
  interpretation  TEXT,
  assessor_name   TEXT,
  assessed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, academic_year)
);
CREATE INDEX IF NOT EXISTS idx_sdq_student ON public.student_sdq_responses(student_id);

ALTER TABLE public.student_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_home_visits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sdq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_student_documents" ON public.student_documents FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());
CREATE POLICY "teacher_manage_home_visits"       ON public.student_home_visits FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());
CREATE POLICY "teacher_manage_sdq"               ON public.student_sdq_responses FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('student-docs', 'student-docs', false, 10485760, ARRAY['image/png','image/jpeg','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

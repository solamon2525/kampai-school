-- ============================================================================
-- Migration 054: SAR (Self-Assessment Report) — 3 มาตรฐาน + indicators + assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sar_standards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sar_indicators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id  UUID NOT NULL REFERENCES public.sar_standards(id) ON DELETE CASCADE,
  code         TEXT,
  name         TEXT NOT NULL,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sar_indicators_std ON public.sar_indicators(standard_id, sort_order);

CREATE TABLE IF NOT EXISTS public.sar_assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year     INTEGER NOT NULL,
  indicator_id      UUID NOT NULL REFERENCES public.sar_indicators(id) ON DELETE CASCADE,
  level             INTEGER CHECK (level BETWEEN 1 AND 5),
  evidence_summary  TEXT,
  assessor_name     TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (academic_year, indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_sar_assessments_year ON public.sar_assessments(academic_year);

CREATE TABLE IF NOT EXISTS public.sar_evidence_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.sar_assessments(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  uploaded_by   UUID,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sar_evidence_assessment ON public.sar_evidence_files(assessment_id);

ALTER TABLE public.sar_standards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sar_indicators      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sar_assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sar_evidence_files  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sar_standards" ON public.sar_standards FOR SELECT USING (true);
CREATE POLICY "admin_write_sar_standards" ON public.sar_standards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "public_read_sar_indicators" ON public.sar_indicators FOR SELECT USING (true);
CREATE POLICY "admin_write_sar_indicators" ON public.sar_indicators FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_sar_assessments" ON public.sar_assessments FOR SELECT USING (public.is_teacher());
CREATE POLICY "admin_write_sar_assessments" ON public.sar_assessments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_sar_evidence" ON public.sar_evidence_files FOR SELECT USING (public.is_teacher());
CREATE POLICY "admin_write_sar_evidence" ON public.sar_evidence_files FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed 3 มาตรฐาน + indicators
INSERT INTO public.sar_standards (code, name, description, sort_order) VALUES
  ('1', 'มาตรฐานที่ 1: คุณภาพของผู้เรียน', 'ผลสัมฤทธิ์ทางวิชาการ + คุณลักษณะที่พึงประสงค์', 1),
  ('2', 'มาตรฐานที่ 2: กระบวนการบริหารและการจัดการ', 'แผน/ระบบประกัน/ภาวะผู้นำ/พัฒนาวิชาการ', 2),
  ('3', 'มาตรฐานที่ 3: กระบวนการจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ', 'ออกแบบการเรียนรู้/สื่อ/วัดผล/PLC', 3)
ON CONFLICT (code) DO NOTHING;

-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sar-evidence', 'sar-evidence', false, 10485760, ARRAY['image/png','image/jpeg','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

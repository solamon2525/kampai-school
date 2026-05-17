-- ============================================================================
-- Migration 055: ICS — ระบบควบคุมภายใน (ปย.1/ปย.2/ปย.3)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ics_forms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type     TEXT NOT NULL CHECK (form_type IN ('ปย.1','ปย.2','ปย.3')),
  fiscal_year   INTEGER NOT NULL,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ร่าง'
                CHECK (status IN ('ร่าง','ส่ง','อนุมัติ')),
  content       JSONB NOT NULL DEFAULT '{}'::jsonb,
  prepared_by   TEXT,
  prepared_at   TIMESTAMPTZ DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ics_forms_year ON public.ics_forms(fiscal_year, form_type);

ALTER TABLE public.ics_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_ics_forms"
  ON public.ics_forms FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "teacher_read_ics_forms"
  ON public.ics_forms FOR SELECT USING (public.is_teacher());

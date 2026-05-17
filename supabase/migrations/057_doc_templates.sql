-- ============================================================================
-- Migration 057: Doc Templates — 12 แบบฟอร์มสำเร็จรูป
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.doc_template_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  emoji         TEXT,
  fields        JSONB NOT NULL DEFAULT '[]'::jsonb,
  body_template TEXT NOT NULL,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_template_def_sort ON public.doc_template_definitions(sort_order);

CREATE TABLE IF NOT EXISTS public.doc_template_generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES public.doc_template_definitions(id) ON DELETE CASCADE,
  generated_by  UUID,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendered_html TEXT,
  generated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_template_gen_def ON public.doc_template_generations(definition_id, generated_at DESC);

ALTER TABLE public.doc_template_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_template_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_doc_template_definitions" ON public.doc_template_definitions FOR SELECT USING (true);
CREATE POLICY "admin_write_doc_template_definitions" ON public.doc_template_definitions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "auth_manage_doc_template_generations" ON public.doc_template_generations FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- (Seed อยู่ใน Supabase แล้ว — ดู migration version `057_doc_templates` ที่ apply ผ่าน MCP)

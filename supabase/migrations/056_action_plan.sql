-- ============================================================================
-- Migration 056: Action Plan — แผนปฏิบัติการ + milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_plan_projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year           INTEGER NOT NULL,
  code                  TEXT,
  name                  TEXT NOT NULL,
  strategy              TEXT,
  responsible_staff_id  UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  budget                NUMERIC(14,2) DEFAULT 0,
  start_date            DATE,
  end_date              DATE,
  kpi                   TEXT,
  status                TEXT NOT NULL DEFAULT 'ยังไม่เริ่ม'
                        CHECK (status IN ('ยังไม่เริ่ม','กำลังดำเนินการ','เสร็จสิ้น','ยกเลิก')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_plan_year ON public.action_plan_projects(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_action_plan_staff ON public.action_plan_projects(responsible_staff_id);

CREATE TABLE IF NOT EXISTS public.action_plan_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.action_plan_projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  due_date      DATE,
  progress_pct  INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  status        TEXT NOT NULL DEFAULT 'รอ' CHECK (status IN ('รอ','กำลังทำ','เสร็จ')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_plan_milestones_project ON public.action_plan_milestones(project_id);

ALTER TABLE public.action_plan_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_milestones  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_action_plan_projects"
  ON public.action_plan_projects FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_action_plan_projects"
  ON public.action_plan_projects FOR SELECT USING (public.is_teacher());

CREATE POLICY "admin_manage_action_plan_milestones"
  ON public.action_plan_milestones FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_action_plan_milestones"
  ON public.action_plan_milestones FOR SELECT USING (public.is_teacher());

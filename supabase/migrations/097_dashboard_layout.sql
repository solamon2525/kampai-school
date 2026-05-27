-- ===============================================================
-- Migration 097: Customizable Dashboard Layout (per user)
-- ===============================================================
-- Each user can hide/reorder widgets on their admin home dashboard.
-- widgets stored as JSONB: [{ id: string, hidden?: boolean }] in display order.

CREATE TABLE IF NOT EXISTS public.user_dashboard_layout (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_dashboard_layout ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_manage_own_layout" ON public.user_dashboard_layout;
CREATE POLICY "user_manage_own_layout" ON public.user_dashboard_layout
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_dashboard_layout IS 'Per-user dashboard widget configuration. widgets = [{ id, hidden }] in display order';

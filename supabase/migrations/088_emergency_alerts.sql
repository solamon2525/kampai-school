-- ===============================================================
-- Migration 088: Emergency Alert System
-- ===============================================================
-- Admin-issued one-click broadcasts via Push + LINE (existing infra).
-- Audit-trailed for life-safety compliance.

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  target_audience text NOT NULL DEFAULT 'all_parents' CHECK (target_audience IN ('all_parents', 'all_staff', 'all_users', 'class_specific')),
  target_class text,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  push_sent_count integer DEFAULT 0,
  line_sent_count integer DEFAULT 0,
  total_targets integer
);

CREATE INDEX IF NOT EXISTS idx_emergency_sent_at ON public.emergency_alerts(sent_at DESC);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_emergency" ON public.emergency_alerts;
CREATE POLICY "admin_manage_emergency" ON public.emergency_alerts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "parents_read_emergency" ON public.emergency_alerts;
CREATE POLICY "parents_read_emergency" ON public.emergency_alerts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (target_audience IN ('all_parents', 'all_users', 'class_specific'))
  );

COMMENT ON TABLE public.emergency_alerts IS 'Admin-issued emergency broadcasts — audit trail for safety';

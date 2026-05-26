-- ===============================================================
-- Migration 087: PDPA Compliance — consents + access logs + erasure requests
-- ===============================================================
-- พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล 2562 บังคับใช้

CREATE TABLE IF NOT EXISTS public.pdpa_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  scope text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  source text,
  notes text,
  CHECK (user_id IS NOT NULL OR student_id IS NOT NULL),
  CHECK (scope IN ('photo_public', 'photo_news', 'line_msg', 'push_notify', 'data_sharing_moe', 'data_sharing_thirdparty'))
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON public.pdpa_consents(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_student ON public.pdpa_consents(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_scope ON public.pdpa_consents(scope);

ALTER TABLE public.pdpa_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_consents" ON public.pdpa_consents;
CREATE POLICY "user_read_own_consents" ON public.pdpa_consents
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = pdpa_consents.student_id)
  );

DROP POLICY IF EXISTS "user_set_own_consent" ON public.pdpa_consents;
CREATE POLICY "user_set_own_consent" ON public.pdpa_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_revoke_own_consent" ON public.pdpa_consents;
CREATE POLICY "user_revoke_own_consent" ON public.pdpa_consents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_consents" ON public.pdpa_consents;
CREATE POLICY "admin_manage_consents" ON public.pdpa_consents
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  subject_user_id uuid,
  subject_student_id uuid,
  details jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dal_actor ON public.data_access_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dal_subject_student ON public.data_access_logs(subject_student_id) WHERE subject_student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dal_resource ON public.data_access_logs(resource_type, created_at DESC);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_dal" ON public.data_access_logs;
CREATE POLICY "admin_read_dal" ON public.data_access_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "parent_read_own_child_dal" ON public.data_access_logs;
CREATE POLICY "parent_read_own_child_dal" ON public.data_access_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = data_access_logs.subject_student_id)
  );

DROP POLICY IF EXISTS "user_read_own_dal" ON public.data_access_logs;
CREATE POLICY "user_read_own_dal" ON public.data_access_logs
  FOR SELECT USING (auth.uid() = subject_user_id);

CREATE TABLE IF NOT EXISTS public.pdpa_erasure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  scope text NOT NULL CHECK (scope IN ('photos', 'attendance', 'scores', 'all')),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erasure_status ON public.pdpa_erasure_requests(status, created_at DESC);

ALTER TABLE public.pdpa_erasure_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_create_own_erasure" ON public.pdpa_erasure_requests;
CREATE POLICY "user_create_own_erasure" ON public.pdpa_erasure_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "user_read_own_erasure" ON public.pdpa_erasure_requests;
CREATE POLICY "user_read_own_erasure" ON public.pdpa_erasure_requests
  FOR SELECT USING (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "admin_manage_erasure" ON public.pdpa_erasure_requests;
CREATE POLICY "admin_manage_erasure" ON public.pdpa_erasure_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_data_access(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_subject_user_id uuid DEFAULT NULL,
  p_subject_student_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  log_id uuid;
  role_val text;
BEGIN
  SELECT role INTO role_val FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.data_access_logs (
    actor_user_id, actor_role, action, resource_type, resource_id,
    subject_user_id, subject_student_id, details
  ) VALUES (
    auth.uid(), role_val, p_action, p_resource_type, p_resource_id,
    p_subject_user_id, p_subject_student_id, p_details
  ) RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_data_access(text, text, text, uuid, uuid, jsonb) TO authenticated;

COMMENT ON TABLE public.pdpa_consents IS 'User/parent consents per data-use scope (Rule 14.24)';
COMMENT ON TABLE public.data_access_logs IS 'Append-only audit trail for sensitive data reads/writes';
COMMENT ON TABLE public.pdpa_erasure_requests IS 'Parent-submitted right-to-erasure requests; admin reviews';

-- ============================================================================
-- Migration 051: Generic e-Signature
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.signatures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  role            TEXT NOT NULL DEFAULT 'signer'
                  CHECK (role IN ('approver','signer','witness')),
  signer_user_id  UUID,
  signer_name     TEXT NOT NULL,
  signer_position TEXT,
  signature_url   TEXT NOT NULL,
  signed_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, role, signer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_signatures_entity ON public.signatures(entity_type, entity_id);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_signatures"
  ON public.signatures FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "teacher_read_signatures"
  ON public.signatures FOR SELECT USING (public.is_teacher());

CREATE POLICY "user_insert_own_signature"
  ON public.signatures FOR INSERT
  WITH CHECK (signer_user_id = auth.uid() OR public.is_admin());

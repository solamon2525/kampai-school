-- ============================================================================
-- Migration 419: worksheet_sets — ชุดใบงานที่ครูบันทึก (seed + config)
-- ============================================================================
-- เปิดชุดซ้ำด้วย ?set=<uuid> เพื่อโปรเจคเตอร์/เฉลยวันหลังโดยไม่สุ่มใหม่
-- RLS: เจ้าของ/แอดมิน เขียนได้ · SELECT = เจ้าของ/แอดมิน หรือ access='link' (anon อ่านลิงก์ได้)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.worksheet_sets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id  UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  worksheet_key   TEXT NOT NULL,
  title           TEXT NOT NULL,
  seed            BIGINT NOT NULL,
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  access          TEXT NOT NULL DEFAULT 'link'
                    CHECK (access IN ('private', 'link')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worksheet_sets_owner_key_created
  ON public.worksheet_sets (owner_staff_id, worksheet_key, created_at DESC);

COMMENT ON TABLE public.worksheet_sets IS
  'Saved printable worksheet sets (seed+config) owned by teachers; link access allows projector reopen via ?set=';

ALTER TABLE public.worksheet_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worksheet_sets_select" ON public.worksheet_sets;
DROP POLICY IF EXISTS "worksheet_sets_insert" ON public.worksheet_sets;
DROP POLICY IF EXISTS "worksheet_sets_update" ON public.worksheet_sets;
DROP POLICY IF EXISTS "worksheet_sets_delete" ON public.worksheet_sets;

CREATE POLICY "worksheet_sets_select" ON public.worksheet_sets
  FOR SELECT USING (
    access = 'link'
    OR public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "worksheet_sets_insert" ON public.worksheet_sets
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "worksheet_sets_update" ON public.worksheet_sets
  FOR UPDATE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "worksheet_sets_delete" ON public.worksheet_sets
  FOR DELETE USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

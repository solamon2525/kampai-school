-- Migration 038: Admin login support
-- Allow principals (administrators table) to have auth accounts and login as 'admin'.

-- 1) Email + phone fields on administrators (needed for auth account)
ALTER TABLE public.administrators
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2) Link user_roles row to administrator (so we can show "has account" status
--    and reset password via administrator_id, mirroring the staff_id flow)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS administrator_id UUID
  REFERENCES public.administrators(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_administrator_id
  ON public.user_roles(administrator_id);

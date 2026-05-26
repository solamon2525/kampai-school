-- ===============================================================
-- Migration 083: Parent ↔ Student many-to-many linking
-- ===============================================================
-- Replaces the single-child link previously stored on user_roles.student_id.
-- Backfills existing user_roles parents → new table.
-- Adds RPC helpers my_children() and parents_of_student().

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relation text DEFAULT 'parent',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_psl_user ON public.parent_student_links(user_id);
CREATE INDEX IF NOT EXISTS idx_psl_student ON public.parent_student_links(student_id);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_read_own_links" ON public.parent_student_links;
CREATE POLICY "parent_read_own_links" ON public.parent_student_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_links" ON public.parent_student_links;
CREATE POLICY "admin_manage_links" ON public.parent_student_links
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Backfill from existing user_roles
INSERT INTO public.parent_student_links (user_id, student_id, is_primary)
SELECT user_id, student_id, true
FROM public.user_roles
WHERE role = 'parent' AND student_id IS NOT NULL AND user_id IS NOT NULL
ON CONFLICT (user_id, student_id) DO NOTHING;

-- Helper: list current parent's children
CREATE OR REPLACE FUNCTION public.my_children()
RETURNS TABLE (
  id uuid,
  name text,
  class text,
  room text,
  class_number integer,
  photo_url text,
  student_code text,
  is_primary boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.name, s.class, s.room, s.class_number, s.photo_url, s.student_code, psl.is_primary
  FROM public.students s
  JOIN public.parent_student_links psl ON psl.student_id = s.id
  WHERE psl.user_id = auth.uid()
  ORDER BY psl.is_primary DESC, s.class, s.class_number;
$$;

GRANT EXECUTE ON FUNCTION public.my_children() TO authenticated;

-- Helper: find parent user_ids for a given student (used by push trigger)
CREATE OR REPLACE FUNCTION public.parents_of_student(p_student_id uuid)
RETURNS TABLE (user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.parent_student_links WHERE student_id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.parents_of_student(uuid) TO authenticated;

COMMENT ON TABLE public.parent_student_links IS 'Many-to-many: one parent can have multiple children, one student can have multiple guardians';
COMMENT ON COLUMN public.parent_student_links.is_primary IS 'Default child to show first in parent portal switcher';

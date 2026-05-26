-- ===============================================================
-- Migration 091: Homework / Assignment Portal
-- ===============================================================
-- Teachers create assignments per class. Parents submit on behalf of
-- their child (or older students themselves). Teachers grade.

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text,
  class text NOT NULL,
  room text,
  due_date date NOT NULL,
  max_score numeric(5, 2) DEFAULT 10,
  attachment_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class, room, due_date DESC) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text,
  attachment_url text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score numeric(5, 2),
  teacher_comment text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_assignment ON public.assignment_submissions(assignment_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submission_student ON public.assignment_submissions(student_id, submitted_at DESC);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_assignments" ON public.assignments;
CREATE POLICY "staff_manage_assignments" ON public.assignments
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_assignments" ON public.assignments;
CREATE POLICY "parent_read_assignments" ON public.assignments
  FOR SELECT USING (
    is_archived = false AND EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      JOIN public.students s ON s.id = psl.student_id
      WHERE psl.user_id = auth.uid() AND s.class = assignments.class
    )
  );

DROP POLICY IF EXISTS "staff_manage_submissions" ON public.assignment_submissions;
CREATE POLICY "staff_manage_submissions" ON public.assignment_submissions
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_own_submissions" ON public.assignment_submissions;
CREATE POLICY "parent_read_own_submissions" ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = assignment_submissions.student_id)
  );

DROP POLICY IF EXISTS "parent_submit" ON public.assignment_submissions;
CREATE POLICY "parent_submit" ON public.assignment_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by
    AND EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = assignment_submissions.student_id)
  );

DROP POLICY IF EXISTS "parent_update_own_submission" ON public.assignment_submissions;
CREATE POLICY "parent_update_own_submission" ON public.assignment_submissions
  FOR UPDATE USING (
    auth.uid() = submitted_by
    AND graded_at IS NULL
  );

COMMENT ON TABLE public.assignments IS 'Teacher-created homework assignments per class';
COMMENT ON TABLE public.assignment_submissions IS 'One submission per (assignment, student). Parent submits; teacher grades.';

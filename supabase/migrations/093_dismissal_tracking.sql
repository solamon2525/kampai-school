-- ===============================================================
-- Migration 093: Dismissal / Pickup Tracking
-- ===============================================================
-- Authorized pickup_persons per student + per-event pickup_log scanned
-- by staff at dismissal. Snapshot fields preserve history even if the
-- pickup_persons record is later edited/deleted.

CREATE TABLE IF NOT EXISTS public.pickup_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL,
  phone text,
  national_id_last4 text,
  photo_url text,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(name) > 0)
);

CREATE INDEX IF NOT EXISTS idx_pickup_persons_student ON public.pickup_persons(student_id, is_active DESC, is_primary DESC);

CREATE TABLE IF NOT EXISTS public.pickup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pickup_person_id uuid REFERENCES public.pickup_persons(id) ON DELETE SET NULL,
  pickup_person_name_snapshot text NOT NULL,
  pickup_person_relation_snapshot text,
  action text NOT NULL CHECK (action IN ('pickup', 'self_dismiss', 'bus_board', 'bus_arrive_home', 'left_school')),
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_pickup_log_student ON public.pickup_log(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_log_date ON public.pickup_log(recorded_at DESC);

ALTER TABLE public.pickup_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_pickup_persons" ON public.pickup_persons;
CREATE POLICY "staff_manage_pickup_persons" ON public.pickup_persons
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_own_pickup_persons" ON public.pickup_persons;
CREATE POLICY "parent_read_own_pickup_persons" ON public.pickup_persons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = pickup_persons.student_id)
  );

DROP POLICY IF EXISTS "staff_manage_pickup_log" ON public.pickup_log;
CREATE POLICY "staff_manage_pickup_log" ON public.pickup_log
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_own_pickup_log" ON public.pickup_log;
CREATE POLICY "parent_read_own_pickup_log" ON public.pickup_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = pickup_log.student_id)
  );

COMMENT ON TABLE public.pickup_persons IS 'Authorized adults who may pick up each student';
COMMENT ON TABLE public.pickup_log IS 'Per-incident dismissal log — staff records who picked up whom at what time';

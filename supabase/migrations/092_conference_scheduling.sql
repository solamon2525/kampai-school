-- ===============================================================
-- Migration 092: Parent-Teacher Conference Scheduling (Calendly-style)
-- ===============================================================
-- Teacher publishes available time slots. Parent books one (UNIQUE
-- enforces single-booking per slot). Both sides can cancel.

CREATE TABLE IF NOT EXISTS public.conference_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 15 CHECK (duration_min BETWEEN 5 AND 120),
  location text,
  notes text,
  is_published boolean NOT NULL DEFAULT true,
  is_cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at > NOW() - INTERVAL '1 year')
);

CREATE INDEX IF NOT EXISTS idx_slots_teacher_starts ON public.conference_slots(teacher_user_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_slots_open ON public.conference_slots(starts_at) WHERE is_published = true AND is_cancelled = false;

CREATE TABLE IF NOT EXISTS public.conference_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL UNIQUE REFERENCES public.conference_slots(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  topic text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed')),
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_parent ON public.conference_bookings(parent_user_id, created_at DESC);

ALTER TABLE public.conference_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_published_slots" ON public.conference_slots;
CREATE POLICY "auth_read_published_slots" ON public.conference_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "teacher_manage_own_slots" ON public.conference_slots;
CREATE POLICY "teacher_manage_own_slots" ON public.conference_slots
  FOR ALL USING (auth.uid() = teacher_user_id OR public.is_admin())
  WITH CHECK (auth.uid() = teacher_user_id OR public.is_admin());

DROP POLICY IF EXISTS "parent_read_own_bookings" ON public.conference_bookings;
CREATE POLICY "parent_read_own_bookings" ON public.conference_bookings
  FOR SELECT USING (
    auth.uid() = parent_user_id
    OR EXISTS (SELECT 1 FROM public.conference_slots s WHERE s.id = conference_bookings.slot_id AND s.teacher_user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "parent_book_open_slot" ON public.conference_bookings;
CREATE POLICY "parent_book_open_slot" ON public.conference_bookings
  FOR INSERT WITH CHECK (
    auth.uid() = parent_user_id
    AND EXISTS (
      SELECT 1 FROM public.conference_slots s
      WHERE s.id = conference_bookings.slot_id
      AND s.is_published = true
      AND s.is_cancelled = false
      AND s.starts_at > NOW()
    )
  );

DROP POLICY IF EXISTS "parent_cancel_own_booking" ON public.conference_bookings;
CREATE POLICY "parent_cancel_own_booking" ON public.conference_bookings
  FOR UPDATE USING (
    auth.uid() = parent_user_id
    OR EXISTS (SELECT 1 FROM public.conference_slots s WHERE s.id = conference_bookings.slot_id AND s.teacher_user_id = auth.uid())
    OR public.is_admin()
  );

COMMENT ON TABLE public.conference_slots IS 'Teacher-published meeting slots (Calendly-style)';
COMMENT ON TABLE public.conference_bookings IS 'Parent booking — 1 booking per slot (UNIQUE constraint)';

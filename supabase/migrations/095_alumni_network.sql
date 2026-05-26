-- ===============================================================
-- Migration 095: Alumni Network — profiles + reunion events + RSVP
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  nickname text,
  graduation_year integer NOT NULL CHECK (graduation_year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW())::integer + 5),
  graduation_class text,
  current_school text,
  current_career text,
  current_workplace text,
  photo_url text,
  bio text,
  contact_email_public text,
  contact_phone_public text,
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alumni_verified ON public.alumni_profiles(is_verified, graduation_year DESC) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_alumni_featured ON public.alumni_profiles(is_featured DESC, graduation_year DESC) WHERE is_verified = true;

CREATE TABLE IF NOT EXISTS public.alumni_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  event_date timestamptz NOT NULL,
  location text,
  is_published boolean NOT NULL DEFAULT true,
  attendee_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alumni_events_date ON public.alumni_events(event_date DESC) WHERE is_published = true;

CREATE TABLE IF NOT EXISTS public.alumni_event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.alumni_events(id) ON DELETE CASCADE,
  alumni_profile_id uuid REFERENCES public.alumni_profiles(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_phone text,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 20),
  notes text,
  responded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendees_event ON public.alumni_event_attendees(event_id);

ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_verified_alumni" ON public.alumni_profiles;
CREATE POLICY "public_read_verified_alumni" ON public.alumni_profiles
  FOR SELECT USING (is_verified = true);

DROP POLICY IF EXISTS "public_submit_alumni" ON public.alumni_profiles;
CREATE POLICY "public_submit_alumni" ON public.alumni_profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "user_read_own_alumni" ON public.alumni_profiles;
CREATE POLICY "user_read_own_alumni" ON public.alumni_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_alumni" ON public.alumni_profiles;
CREATE POLICY "admin_manage_alumni" ON public.alumni_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_events" ON public.alumni_events;
CREATE POLICY "public_read_events" ON public.alumni_events
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_events" ON public.alumni_events;
CREATE POLICY "admin_manage_events" ON public.alumni_events
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_rsvp" ON public.alumni_event_attendees;
CREATE POLICY "public_rsvp" ON public.alumni_event_attendees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.alumni_events e WHERE e.id = alumni_event_attendees.event_id AND e.is_published = true)
  );

DROP POLICY IF EXISTS "admin_read_attendees" ON public.alumni_event_attendees;
CREATE POLICY "admin_read_attendees" ON public.alumni_event_attendees
  FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_alumni_event_attendee_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.alumni_events SET attendee_count = attendee_count + NEW.party_size WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_alumni_rsvp ON public.alumni_event_attendees;
CREATE TRIGGER on_alumni_rsvp
  AFTER INSERT ON public.alumni_event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.increment_alumni_event_attendee_count();

COMMENT ON TABLE public.alumni_profiles IS 'Alumni network — public submit, admin verifies before showing';
COMMENT ON TABLE public.alumni_events IS 'Alumni reunions and gatherings';
COMMENT ON TABLE public.alumni_event_attendees IS 'RSVP for alumni events — public can RSVP';

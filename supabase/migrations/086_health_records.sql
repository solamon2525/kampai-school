-- ===============================================================
-- Migration 086: Health Records & Growth Tracking
-- ===============================================================
-- Required by DMC export (น้ำหนัก/ส่วนสูง mandatory fields) and good
-- practice for พ.ร.บ.การศึกษาแห่งชาติ compliance.

CREATE TABLE IF NOT EXISTS public.student_health_records (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  blood_type text,
  allergies text[] DEFAULT ARRAY[]::text[],
  chronic_conditions text[] DEFAULT ARRAY[]::text[],
  medications text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  vision_left text,
  vision_right text,
  dental_status text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.student_vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  dose_number integer,
  given_date date NOT NULL,
  given_by text,
  next_dose_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, vaccine_name, dose_number)
);

CREATE INDEX IF NOT EXISTS idx_vacc_student ON public.student_vaccinations(student_id);
CREATE INDEX IF NOT EXISTS idx_vacc_next_dose ON public.student_vaccinations(next_dose_date) WHERE next_dose_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.student_growth_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  measured_at date NOT NULL,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  bmi numeric(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN height_cm IS NOT NULL AND height_cm > 0 AND weight_kg IS NOT NULL
      THEN ROUND((weight_kg / POWER(height_cm / 100.0, 2))::numeric, 2)
      ELSE NULL
    END
  ) STORED,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_growth_student_date ON public.student_growth_measurements(student_id, measured_at DESC);

CREATE OR REPLACE VIEW public.student_latest_growth AS
SELECT DISTINCT ON (student_id)
  student_id,
  measured_at,
  weight_kg,
  height_cm,
  bmi
FROM public.student_growth_measurements
ORDER BY student_id, measured_at DESC;

ALTER TABLE public.student_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_growth_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_health" ON public.student_health_records;
CREATE POLICY "staff_manage_health" ON public.student_health_records
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "staff_manage_vacc" ON public.student_vaccinations;
CREATE POLICY "staff_manage_vacc" ON public.student_vaccinations
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "staff_manage_growth" ON public.student_growth_measurements;
CREATE POLICY "staff_manage_growth" ON public.student_growth_measurements
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "parent_read_health" ON public.student_health_records;
CREATE POLICY "parent_read_health" ON public.student_health_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = student_health_records.student_id)
  );

DROP POLICY IF EXISTS "parent_read_vacc" ON public.student_vaccinations;
CREATE POLICY "parent_read_vacc" ON public.student_vaccinations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = student_vaccinations.student_id)
  );

DROP POLICY IF EXISTS "parent_read_growth" ON public.student_growth_measurements;
CREATE POLICY "parent_read_growth" ON public.student_growth_measurements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.parent_student_links psl WHERE psl.user_id = auth.uid() AND psl.student_id = student_growth_measurements.student_id)
  );

COMMENT ON TABLE public.student_health_records IS 'Per-student static health profile (blood type, allergies, emergency contact)';
COMMENT ON TABLE public.student_vaccinations IS 'Per-student vaccination history';
COMMENT ON TABLE public.student_growth_measurements IS 'Per-student weight/height/BMI tracked over time (used by DMC export)';
COMMENT ON VIEW public.student_latest_growth IS 'Latest growth measurement per student for DMC export';

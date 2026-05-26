-- ===============================================================
-- Migration 094: Survey Builder — parent/community feedback, NPS, satisfaction
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'parents', 'staff', 'students', 'class_specific')),
  target_class text,
  is_published boolean NOT NULL DEFAULT false,
  is_anonymous boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  response_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveys_published ON public.surveys(is_published, created_at DESC) WHERE is_published = true;

CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  question_text text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'radio', 'checkbox', 'rating_5', 'rating_10', 'nps')),
  options jsonb,
  is_required boolean NOT NULL DEFAULT false,
  UNIQUE(survey_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_questions_survey ON public.survey_questions(survey_id, order_index);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answers jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_survey ON public.survey_responses(survey_id, submitted_at DESC);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_surveys" ON public.surveys;
CREATE POLICY "public_read_published_surveys" ON public.surveys
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_surveys" ON public.surveys;
CREATE POLICY "admin_manage_surveys" ON public.surveys
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_questions" ON public.survey_questions;
CREATE POLICY "public_read_questions" ON public.survey_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_questions.survey_id AND s.is_published = true)
  );

DROP POLICY IF EXISTS "admin_manage_questions" ON public.survey_questions;
CREATE POLICY "admin_manage_questions" ON public.survey_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_submit_response" ON public.survey_responses;
CREATE POLICY "public_submit_response" ON public.survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_responses.survey_id AND s.is_published = true
            AND (s.starts_at IS NULL OR s.starts_at <= NOW())
            AND (s.ends_at IS NULL OR s.ends_at >= NOW()))
  );

DROP POLICY IF EXISTS "admin_read_responses" ON public.survey_responses;
CREATE POLICY "admin_read_responses" ON public.survey_responses
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "user_read_own_response" ON public.survey_responses;
CREATE POLICY "user_read_own_response" ON public.survey_responses
  FOR SELECT USING (auth.uid() = respondent_user_id);

CREATE OR REPLACE FUNCTION public.increment_survey_response_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.surveys SET response_count = response_count + 1 WHERE id = NEW.survey_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_survey_response ON public.survey_responses;
CREATE TRIGGER on_new_survey_response
  AFTER INSERT ON public.survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.increment_survey_response_count();

COMMENT ON TABLE public.surveys IS 'School-issued surveys for parent feedback / NPS / satisfaction';
COMMENT ON TABLE public.survey_responses IS 'Answers stored as JSONB keyed by question_id for flexibility';

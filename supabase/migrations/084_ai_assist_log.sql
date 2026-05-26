-- ===============================================================
-- Migration 084: AI Assistant usage log
-- ===============================================================
-- Tracks every call to the ai-assist edge function — mode, model,
-- token counts, duration, errors. Lets admin audit cost and per-user
-- usage. Inserts happen via service role only.

CREATE TABLE IF NOT EXISTS public.ai_assist_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('lesson_plan', 'exam_questions', 'report_comment', 'free')),
  model text NOT NULL,
  prompt_chars integer,
  output_chars integer,
  input_tokens integer,
  output_tokens integer,
  cached_input_tokens integer DEFAULT 0,
  duration_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_log_user ON public.ai_assist_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_mode ON public.ai_assist_log(mode, created_at DESC);

ALTER TABLE public.ai_assist_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_ai_log" ON public.ai_assist_log;
CREATE POLICY "users_read_own_ai_log" ON public.ai_assist_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_ai_log" ON public.ai_assist_log;
CREATE POLICY "admin_read_all_ai_log" ON public.ai_assist_log
  FOR SELECT USING (public.is_admin());

COMMENT ON TABLE public.ai_assist_log IS 'Usage tracking for AI Assistant — admin can audit cost + usage per user.';

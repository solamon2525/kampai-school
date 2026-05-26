-- ===============================================================
-- Migration 085: LINE Messaging API integration
-- ===============================================================
-- Replaces deprecated LINE Notify (closed 1 Apr 2025).
-- Webhook (line-webhook edge fn) captures LINE followers automatically;
-- admin links them to Kampai accounts; line-send edge fn fans out outbound.

CREATE TABLE IF NOT EXISTS public.line_user_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id text NOT NULL UNIQUE,
  display_name text,
  picture_url text,
  language text,
  is_followed boolean NOT NULL DEFAULT true,
  linked_at timestamptz,
  followed_at timestamptz NOT NULL DEFAULT now(),
  unfollowed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lul_user ON public.line_user_links(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.line_user_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_line_link" ON public.line_user_links;
CREATE POLICY "users_read_own_line_link" ON public.line_user_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_unlink_own_line" ON public.line_user_links;
CREATE POLICY "users_unlink_own_line" ON public.line_user_links
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_line_links" ON public.line_user_links;
CREATE POLICY "admin_manage_line_links" ON public.line_user_links
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.line_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text,
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  message_type text,
  payload jsonb,
  status text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lml_line ON public.line_message_logs(line_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lml_dir ON public.line_message_logs(direction, created_at DESC);

ALTER TABLE public.line_message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_line_logs" ON public.line_message_logs;
CREATE POLICY "admin_read_line_logs" ON public.line_message_logs
  FOR SELECT USING (public.is_admin());

-- Helper: resolve user_ids → line_user_ids for outbound fan-out
CREATE OR REPLACE FUNCTION public.line_ids_for_users(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, line_user_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, line_user_id
  FROM public.line_user_links
  WHERE user_id = ANY(p_user_ids) AND is_followed = true;
$$;

GRANT EXECUTE ON FUNCTION public.line_ids_for_users(uuid[]) TO authenticated;

COMMENT ON TABLE public.line_user_links IS 'LINE OA users — auto-captured from webhook, linked manually by admin or via OAuth (phase 2)';
COMMENT ON COLUMN public.line_user_links.user_id IS 'NULL = follower not yet linked to Kampai account';
COMMENT ON TABLE public.line_message_logs IS 'All in/out LINE messages — admin audit trail';

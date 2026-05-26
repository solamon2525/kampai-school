-- ===============================================================
-- Migration 082: Web Push Notifications subscriptions
-- ===============================================================
-- Stores Web Push API subscriptions per user, with topic-based filtering.
-- Used by send-push edge function to broadcast notifications.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  topics text[] NOT NULL DEFAULT ARRAY['absence', 'score', 'news', 'emergency']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  failed_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_topics ON public.push_subscriptions USING GIN(topics);

-- ─── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- User can read / insert / update / delete only their own subscriptions
DROP POLICY IF EXISTS "users_own_push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "users_own_push_subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all subscriptions (for broadcast targeting + debug)
DROP POLICY IF EXISTS "admin_read_push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "admin_read_push_subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (public.is_admin());

-- Admin can delete stale subscriptions (e.g. after repeated 410 Gone)
DROP POLICY IF EXISTS "admin_delete_push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "admin_delete_push_subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE public.push_subscriptions IS 'Web Push API subscriptions per user. Used by send-push edge function.';
COMMENT ON COLUMN public.push_subscriptions.topics IS 'Topics user has opted into: absence, score, news, emergency';
COMMENT ON COLUMN public.push_subscriptions.failed_count IS 'Increments on 4xx/5xx push delivery; subscription pruned at >= 5';

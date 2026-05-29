-- ===============================================================
-- Migration 102: Facebook Page news feed
-- ===============================================================
-- Adds homepage widget that pulls recent posts from school's Facebook Page
-- via Graph API. Token is stored server-side only (admin RLS).
-- Cached posts are publicly readable; only the service role (edge function)
-- can write to them.

-- ---------- 1) Config (secret) — admin only ----------
CREATE TABLE IF NOT EXISTS public.facebook_feed_config (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id                text NOT NULL,
  page_name              text,
  page_url               text,
  access_token           text NOT NULL,
  enabled                boolean NOT NULL DEFAULT true,
  posts_count            int NOT NULL DEFAULT 3 CHECK (posts_count BETWEEN 1 AND 10),
  refresh_interval_hours int NOT NULL DEFAULT 6 CHECK (refresh_interval_hours BETWEEN 1 AND 168),
  last_fetched_at        timestamptz,
  last_status            text CHECK (last_status IN ('ok','token_expired','rate_limited','error') OR last_status IS NULL),
  last_error             text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Singleton: only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS facebook_feed_config_singleton ON public.facebook_feed_config ((true));

ALTER TABLE public.facebook_feed_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_fb_config"  ON public.facebook_feed_config;
DROP POLICY IF EXISTS "admin_insert_fb_config"  ON public.facebook_feed_config;
DROP POLICY IF EXISTS "admin_update_fb_config"  ON public.facebook_feed_config;
DROP POLICY IF EXISTS "admin_delete_fb_config"  ON public.facebook_feed_config;

CREATE POLICY "admin_select_fb_config" ON public.facebook_feed_config FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_fb_config" ON public.facebook_feed_config FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_fb_config" ON public.facebook_feed_config FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_fb_config" ON public.facebook_feed_config FOR DELETE USING (public.is_admin());

-- ---------- 2) Cached posts — public read, service-role write ----------
CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id            text PRIMARY KEY,
  message       text,
  created_time  timestamptz NOT NULL,
  full_picture  text,
  permalink_url text NOT NULL,
  attachments   jsonb,
  fetched_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS facebook_posts_created_time_idx ON public.facebook_posts (created_time DESC);

ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_fb_posts" ON public.facebook_posts;
CREATE POLICY "public_select_fb_posts" ON public.facebook_posts FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies → only service-role can write

-- ---------- 3) Public meta RPC ----------
-- Exposes non-secret fields to homepage without leaking the access_token.
CREATE OR REPLACE FUNCTION public.get_facebook_feed_meta()
RETURNS TABLE (
  page_name              text,
  page_url               text,
  enabled                boolean,
  posts_count            int,
  refresh_interval_hours int,
  last_fetched_at        timestamptz,
  last_status            text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT page_name, page_url, enabled, posts_count, refresh_interval_hours, last_fetched_at, last_status
  FROM public.facebook_feed_config
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_facebook_feed_meta() TO anon, authenticated;

-- ---------- 4) updated_at trigger ----------
CREATE OR REPLACE FUNCTION public.facebook_feed_config_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS facebook_feed_config_touch ON public.facebook_feed_config;
CREATE TRIGGER facebook_feed_config_touch
  BEFORE UPDATE ON public.facebook_feed_config
  FOR EACH ROW EXECUTE FUNCTION public.facebook_feed_config_touch_updated_at();

COMMENT ON TABLE public.facebook_feed_config IS 'Singleton config for the homepage Facebook Page feed. Token is admin-only.';
COMMENT ON TABLE public.facebook_posts        IS 'Cached posts fetched from Facebook Graph API. Public read, service-role write only.';
COMMENT ON FUNCTION public.get_facebook_feed_meta() IS 'Public-safe view of config (no access_token).';

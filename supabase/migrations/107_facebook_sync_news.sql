-- ===============================================================
-- Migration 107: Auto-convert Facebook posts into news rows
-- ===============================================================
-- Extends the existing Facebook feed (Migration 102 + edge function
-- facebook-fetch) so that, when enabled, each fetched Facebook post is
-- turned into a real row in public.news (published immediately).
--
-- Idempotency: facebook_posts.news_synced marks posts already converted,
-- so deleting the generated news row will NOT resurrect it on the next sync.

-- ---------- 1) Marker on cached posts ----------
ALTER TABLE public.facebook_posts
  ADD COLUMN IF NOT EXISTS news_synced boolean NOT NULL DEFAULT false;

-- ---------- 2) Provenance columns on news ----------
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS source            text,
  ADD COLUMN IF NOT EXISTS source_fb_post_id text;

-- One news row per Facebook post (safety net against duplicate inserts).
CREATE UNIQUE INDEX IF NOT EXISTS news_source_fb_post_id_uidx
  ON public.news (source_fb_post_id)
  WHERE source_fb_post_id IS NOT NULL;

-- ---------- 3) Feature toggle on config (opt-in) ----------
ALTER TABLE public.facebook_feed_config
  ADD COLUMN IF NOT EXISTS sync_to_news boolean NOT NULL DEFAULT false;

-- ---------- 4) Seed the category used for Facebook-sourced news ----------
INSERT INTO public.news_categories (name, description, color)
VALUES ('ข่าวจาก Facebook', 'ข่าวที่ดึงอัตโนมัติจากเพจ Facebook ของโรงเรียน', 'bg-[#1877F2] text-card')
ON CONFLICT (name) DO NOTHING;

-- ---------- 5) Expose sync_to_news through the public meta RPC ----------
-- Drop first: adding an OUT param changes the return type (CREATE OR REPLACE alone fails).
DROP FUNCTION IF EXISTS public.get_facebook_feed_meta();
CREATE OR REPLACE FUNCTION public.get_facebook_feed_meta()
RETURNS TABLE (
  page_name              text,
  page_url               text,
  enabled                boolean,
  posts_count            int,
  refresh_interval_hours int,
  last_fetched_at        timestamptz,
  last_status            text,
  sync_to_news           boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT page_name, page_url, enabled, posts_count, refresh_interval_hours,
         last_fetched_at, last_status, sync_to_news
  FROM public.facebook_feed_config
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_facebook_feed_meta() TO anon, authenticated;

COMMENT ON COLUMN public.facebook_posts.news_synced IS 'True once this post has been converted into a public.news row (idempotency marker).';
COMMENT ON COLUMN public.news.source IS 'Origin of the row, e.g. ''facebook'' for auto-synced posts; NULL for manual entries.';
COMMENT ON COLUMN public.news.source_fb_post_id IS 'Facebook post id this news row was generated from (NULL for manual entries).';
COMMENT ON COLUMN public.facebook_feed_config.sync_to_news IS 'When true, facebook-fetch also creates public.news rows from fetched posts.';

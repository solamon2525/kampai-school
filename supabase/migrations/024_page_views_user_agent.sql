-- ============================================================================
-- Migration 024: page_views extend for real Analytics
-- ============================================================================
-- referrer column already exists from earlier schema; add user_agent only.

ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON public.page_views(visited_at DESC);

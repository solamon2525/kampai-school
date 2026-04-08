-- Function to increment news view count securely
-- This allows anonymous users to increment views without needing UPDATE permission on the table
CREATE OR REPLACE FUNCTION increment_news_view(news_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.news
  SET views = COALESCE(views, 0) + 1
  WHERE id = news_id;
END;
$$;

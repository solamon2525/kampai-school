-- Add external_links column to news table
ALTER TABLE news ADD COLUMN external_links JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN news.external_links IS 'List of external links (url, title) for the news item';

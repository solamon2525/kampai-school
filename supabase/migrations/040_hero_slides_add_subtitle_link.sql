-- Add columns referenced by HeroSlidesManagement.tsx that were never migrated
ALTER TABLE public.hero_slides
    ADD COLUMN IF NOT EXISTS subtitle text,
    ADD COLUMN IF NOT EXISTS link_url text;

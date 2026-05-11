-- 041_hero_slides_add_image_fit.sql
-- Add per-slide image_fit option for hero carousel rendering.
-- 'cover'   = fill frame (may crop) — current behavior, default
-- 'contain' = fit full image + blurred backdrop fills remaining space

ALTER TABLE hero_slides
ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'cover'
CHECK (image_fit IN ('cover', 'contain'));

COMMENT ON COLUMN hero_slides.image_fit IS
'How to fit image in hero frame: cover (crop to fill) or contain (full image + blurred backdrop)';

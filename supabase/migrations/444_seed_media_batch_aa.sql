-- Migration 444: Media Batch AA (O2/S5/E4/T6) — hub items seeded via apply script;
-- keep SQL twin for repo history (idempotent upserts by external_url handled in apply-migration-430).

-- Placeholder comment migration: actual seed applied by scripts/apply-migration-430-media-batch-aa.mjs
-- Items:
--   /games/social/thai-calendar-media.html (O2)
--   /games/science/human-organs-media.html (S5)
--   /games/english/classroom-english-media.html (E4)
--   /games/thai/literature-short-media.html (T6)

SELECT 1;

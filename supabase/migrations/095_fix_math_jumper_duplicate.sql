-- Fix duplicate game_slug 'math-jumper': legacy static record conflicts with
-- the newer Storage-based version uploaded via admin UI (2026-05-20).
-- .maybeSingle() returns error when 2 rows match → "ไม่พบเกมนี้ในระบบติดตาม".
-- Solution: untrack the legacy static record; keep Storage version as canonical.
UPDATE educational_hub_items
SET game_slug    = NULL,
    tracked_game = false,
    updated_at   = now()
WHERE id = '1f00e8f1-774d-4253-b6bd-e99a65363115'
  AND game_slug = 'math-jumper'
  AND external_url = '/games/math/math-jumper.html';

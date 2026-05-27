-- Move math-han game from Storage URL → git-tracked path
-- so PlayGame.tsx serves it from Vercel and postMessage integration works.
UPDATE educational_hub_items
SET
    external_url  = '/games/math/mth.html',
    game_slug     = 'math-han',
    tracked_game  = true,
    is_published  = true,
    updated_at    = now()
WHERE external_url LIKE '%/edu-hub-games/math/mth.html%';

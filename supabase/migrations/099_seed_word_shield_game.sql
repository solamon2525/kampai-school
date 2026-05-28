-- Move word-shield game from Storage URL → git-tracked path
-- so PlayGame.tsx serves it from Vercel and postMessage integration works.
UPDATE educational_hub_items
SET
    external_url  = '/games/tech/word-shield.html',
    game_slug     = 'word-shield',
    tracked_game  = true,
    is_published  = true,
    updated_at    = now()
WHERE id = 'e7dd462f-d2f3-4e8f-83b0-12b949b3adb8';

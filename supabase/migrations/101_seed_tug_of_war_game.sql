-- 101_seed_tug_of_war_game.sql
UPDATE educational_hub_items
SET
    external_url = '/games/thai/tug-of-war.html',
    game_slug    = 'tug-of-war',
    tracked_game = true,
    is_published = true,
    updated_at   = now()
WHERE id = 'b5e2db04-7f09-442b-a176-e7c8fe2b4288';

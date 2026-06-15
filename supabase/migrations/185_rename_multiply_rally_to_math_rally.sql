-- 185_rename_multiply_rally_to_math_rally.sql
-- Upgrades multiply-rally to math-rally with mixed modes
UPDATE public.educational_hub_items
SET game_slug = 'math-rally',
    title = 'รถซิ่งคณิตศาสตร์',
    external_url = '/games/math/math-rally/index.html',
    thumbnail_url = '/games/math/math-rally/cover.svg'
WHERE game_slug = 'multiply-rally' OR external_url = '/games/math/multiply-rally/index.html';

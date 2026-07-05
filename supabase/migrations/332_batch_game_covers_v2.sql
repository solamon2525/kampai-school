-- 332: ปกเกม 5 รายการ — 1280×720 full-bleed + cache bust
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/multiply-burst/cover.png?v=2',
    updated_at = now()
WHERE game_slug = 'multiply-burst'
   OR external_url = '/games/math/multiply-burst/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/catch-numbers/cover.png?v=2',
    updated_at = now()
WHERE game_slug = 'catch-numbers'
   OR external_url = '/games/math/catch-numbers/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-rally/cover.png?v=2',
    updated_at = now()
WHERE game_slug IN ('math-rally', 'multiply-rally')
   OR external_url IN (
     '/games/math/math-rally/index.html',
     '/games/math/multiply-rally/index.html'
   );

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/net-3d-cover.png?v=2',
    updated_at = now()
WHERE game_slug = 'net-3d'
   OR external_url = '/games/math/net-3d.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/ai-hand-gesture-game-cover.png?v=2',
    updated_at = now()
WHERE game_slug = 'ai-hand-gesture-game'
   OR external_url = '/games/thai/ai-hand-gesture-game.html';

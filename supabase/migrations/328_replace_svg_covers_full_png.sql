-- ============================================================================
-- Migration 328: แทนปก SVG ด้วย PNG เต็มขอบ (TH+EN)
-- ============================================================================

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/multiply-burst/cover-full.png', updated_at = now()
WHERE game_slug = 'multiply-burst'
   OR external_url = '/games/math/multiply-burst/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/voxel-quiz-adventure/cover-full.png', updated_at = now()
WHERE game_slug = 'voxel-quiz-adventure'
   OR external_url = '/games/english/voxel-quiz-adventure/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/engine/platformer-2d/cover-full.png', updated_at = now()
WHERE game_slug = 'platformer-blueprint'
   OR external_url LIKE '%platformer-2d%';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-rally/cover-full.png', updated_at = now()
WHERE game_slug IN ('math-rally', 'multiply-rally')
   OR external_url IN (
     '/games/math/math-rally/index.html',
     '/games/math/multiply-rally/index.html'
   );

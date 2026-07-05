-- 334: multiply-burst ปก v4 — ออกแบบใหม่ 1280×720 full-bleed
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/multiply-burst/cover.png?v=4',
    updated_at = now()
WHERE game_slug = 'multiply-burst'
   OR external_url = '/games/math/multiply-burst/index.html';

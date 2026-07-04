-- 329: mini-farm-island ปกเต็มขอบ + ชื่อไทย/อังกฤษไม่ถูกตัด
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/mini-farm-island/cover.png?v=2',
    updated_at = now()
WHERE game_slug = 'mini-farm-island';

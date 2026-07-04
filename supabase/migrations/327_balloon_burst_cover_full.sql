-- 327: balloon-burst ปกจิบิเต็มขอบ + ชื่อไทย/อังกฤษ
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/balloon-burst/cover-chibi-full.png',
    updated_at = now()
WHERE game_slug = 'balloon-burst';

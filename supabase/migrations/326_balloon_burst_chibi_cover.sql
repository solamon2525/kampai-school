-- 326: balloon-burst ปกจิบิใหม่ (ตัด cache ปกเก่า)
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/balloon-burst/cover-chibi.png',
    updated_at = now()
WHERE game_slug = 'balloon-burst';

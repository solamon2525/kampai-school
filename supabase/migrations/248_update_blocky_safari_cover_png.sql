-- อัปเดตปก Blocky Safari: SVG → PNG 1280×720 (fit-to-scale/contain)
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/blocky-safari/cover.png',
    updated_at = now()
WHERE game_slug = 'blocky-safari';

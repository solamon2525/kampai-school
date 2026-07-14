-- Fix the thumbnail URL for energy-rocket game from .svg to .png
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/energy-rocket/cover.png'
WHERE game_slug = 'energy-rocket';

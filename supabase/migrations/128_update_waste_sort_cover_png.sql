-- 128_update_waste_sort_cover_png.sql
-- เปลี่ยนปกเกม "แยกขยะ 4 ถัง" (waste-sort) → PNG สร้างด้วย Canva AI
-- public/games/career/waste-sort-cover.png
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/career/waste-sort-cover.png', updated_at = now()
WHERE game_slug = 'waste-sort';

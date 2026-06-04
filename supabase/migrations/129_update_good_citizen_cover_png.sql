-- 129_update_good_citizen_cover_png.sql
-- เปลี่ยนปกเกม "พลเมืองดี" (good-citizen) → PNG สร้างด้วย Canva AI
-- public/games/social/good-citizen-cover.png
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/social/good-citizen-cover.png', updated_at = now()
WHERE game_slug = 'good-citizen';

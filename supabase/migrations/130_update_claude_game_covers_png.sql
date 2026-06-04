-- 130_update_claude_game_covers_png.sql
-- เปลี่ยนปกเกม Claude (game-dev series) จาก SVG → PNG สร้างด้วย Canva AI (รอบที่ 1: 6 เกม)
-- ทุกใบ: เด็กนักเรียนชุดนักเรียนไทย + ฉากสื่อ gameplay ตรงเกม + ชื่อไทยตัวใหญ่
UPDATE public.educational_hub_items SET thumbnail_url = '/games/english/listen-spell-cover.png', updated_at = now() WHERE game_slug = 'listen-spell';
UPDATE public.educational_hub_items SET thumbnail_url = '/games/english/vocab-race-cover.png',  updated_at = now() WHERE game_slug = 'vocab-race';
UPDATE public.educational_hub_items SET thumbnail_url = '/games/career/cashier-cover.png',      updated_at = now() WHERE game_slug = 'cashier';
UPDATE public.educational_hub_items SET thumbnail_url = '/games/health/plate-builder-cover.png', updated_at = now() WHERE game_slug = 'plate-builder';
UPDATE public.educational_hub_items SET thumbnail_url = '/games/math/order-it-cover.png',        updated_at = now() WHERE game_slug = 'order-it';
UPDATE public.educational_hub_items SET thumbnail_url = '/games/math/number-line-cover.png',     updated_at = now() WHERE game_slug = 'number-line';

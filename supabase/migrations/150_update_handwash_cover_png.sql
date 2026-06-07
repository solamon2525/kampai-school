-- อัปเกรดปกเกม "ล้างมือ 7 ขั้น" (handwash-order) จาก SVG → PNG ภาพประกอบ chibi
-- (pilot ชุดอัปเกรดปกเกมล่าสุด — ดู scripts/covers/ + scripts/render-covers.mjs)
UPDATE educational_hub_items
SET thumbnail_url = '/games/health/handwash-order-cover.png'
WHERE game_slug = 'handwash-order';

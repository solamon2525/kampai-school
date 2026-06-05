-- 137_move_listen_spell_to_folder.sql
-- ย้ายเกม "ฟังแล้วสะกด" (listen-spell) จากไฟล์เดียว → โครงสร้างโฟลเดอร์ 5 ไฟล์
--   /games/english/listen-spell.html        → /games/english/listen-spell/index.html
--   /games/english/listen-spell-cover.png   → /games/english/listen-spell/cover.png
-- (เกมนำร่อง "วัฒนธรรมเกม v2": แยก index/style/config/data/game + เพิ่มโหมดออนไลน์)
-- Idempotent: รันซ้ำได้ (UPDATE by game_slug)
UPDATE public.educational_hub_items
SET external_url  = '/games/english/listen-spell/index.html',
    thumbnail_url = '/games/english/listen-spell/cover.png',
    updated_at    = now()
WHERE game_slug = 'listen-spell';

-- 396_update_pixel_forest_explorer_rpg.sql
-- Upgrade the forest explorer to action RPG v2.0.0.

UPDATE public.educational_hub_items SET
  description = 'Action RPG พิกเซลอาร์ต ต่อสู้มอนสเตอร์ด้วยดาบ เก็บ XP เพิ่มเลเวลและอัปเกรดสกิล',
  build_version = '2.0.0',
  build_updated_at = now(),
  updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

UPDATE public.game_docs SET
  game_format = 'Canvas 2D top-down pixel-art action RPG',
  features = ARRAY[
    'ฮีโร่เดินและฟันดาบ 4 ทิศ พร้อม HP XP Level และ Skill Point',
    'มอนสเตอร์ 3 สายมีเลเวล HP และรูปแบบโจมตีต่างกัน',
    'Skill Tree 4 สาย หีบสมบัติ ของดรอป และเอฟเฟกต์ต่อสู้',
    'WASD ลูกศร Space J K และระบบสัมผัส',
    'KampaiVersus local และ online พร้อม leaderboard'
  ],
  version = '2.0.0',
  notes = 'Major combat update using original Canvas and SVG pixel art',
  updated_at = now()
WHERE item_id = (
  SELECT id FROM public.educational_hub_items
  WHERE game_slug = 'pixel-forest-explorer' LIMIT 1
);

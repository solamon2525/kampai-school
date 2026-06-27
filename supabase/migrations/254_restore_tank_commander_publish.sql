-- 254: เปิด Tank Commander เดิมกลับมา — คู่กับ Math Tank Raid (คนละเกม ไม่แทนที่กัน)

UPDATE public.educational_hub_items
SET is_published = true,
    tracked_game = true,
    game_slug = 'tank-commander',
    thumbnail_url = '/games/tech/tank-commander-cover.png',
    subject = 'เทคโนโลยี',
    updated_at = now()
WHERE external_url = '/games/tech/tank-commander.html';

-- ยืนยัน math-tank-raid ยังเผยแพร่อยู่ (คนละ slug / คนละ URL)
UPDATE public.educational_hub_items
SET is_published = true,
    tracked_game = true,
    updated_at = now()
WHERE external_url = '/games/math/math-tank-raid.html';

UPDATE public.game_docs
SET notes = 'Math Tank Raid — คณิต ป.3-4 แยกจาก Tank Commander (เทคโนโลยี) · migration 253+254',
    updated_at = now()
WHERE item_id = (
  SELECT id FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-tank-raid.html' LIMIT 1
);

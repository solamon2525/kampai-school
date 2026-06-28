-- 264_thai_sara_run_character_docs.sql
-- อัป game_docs: รองรับคลังตัวละครจากหลังบ้าน (KAMPAI.character)

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id,
       'HTML5 Canvas Platformer — สระไทย ป.1-6 · sprite จากคลังหลังบ้านได้',
       ARRAY[
         'กระต่าย sprite sheet 128×128 · เดิน/วิ่ง/กระโดด · fallback bundled ใน git',
         'รองรับ KAMPAI.character จาก PlayGame (คลังตัวละคร admin) · co-op sheet P2',
         'KampaiVersus · KAMPAI SDK score/leaderboard · 19 ข้อสระไทย'
       ],
       'v1.1.0',
       'thai-sara-run — คลัง sprite ตัวละคร (migration 263/264)'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

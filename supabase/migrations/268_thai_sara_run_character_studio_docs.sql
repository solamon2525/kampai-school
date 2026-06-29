-- 268_thai_sara_run_character_studio_docs.sql
-- game_docs v1.3.0 — Character Studio + 5 hearts + grid bunny

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id,
       'HTML5 Canvas Platformer — สระไทย ป.1-6 · กระต่าย grid 3×6 จากคลังตัวละคร',
       ARRAY[
         'กระต่าย sprite grid 170×227 · 18 เฟรม (วิ่ง/โดด/ยืน) · KAMPAI.pickCharacterFrame',
         'คลังตัวละคร admin: Character Studio · map ท่า · preview บนพื้น · runFaces/anchorFoot',
         '5 หัวใจ · เก็บหัวใจเพิ่ม · ชนครั้งละ -1 · KampaiVersus co-op P2 sheet ฟ้า',
         'KAMPAI SDK score/leaderboard · fallback bundled git · 19 ข้อสระไทย'
       ],
       'v1.3.0',
       'thai-sara-run — คลังตัวละคร + animation + studio (bundle 263-267)'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

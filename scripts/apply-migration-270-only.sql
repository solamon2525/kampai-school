-- apply-migration-270-only.sql
-- รันใน Supabase SQL Editor หลัง deploy pose catalog

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id,
       'HTML5 Canvas Platformer — สระไทย ป.1-6 · กระต่าย grid 3×6 จากคลังตัวละคร',
       ARRAY[
         'กระต่าย sprite grid 170×227 · 18 เฟรม · KAMPAI.pickCharacterFrame + extras (attack/crouch/slide/…)',
         'คลังตัวละคร: Character Studio · pose map 5 กลุ่ม · Auto fit W×H · palette recolor · จุดเท้าแยกท่า',
         '5 หัวใจ · เก็บหัวใจเพิ่ม · co-op P2 · KAMPAI SDK score/leaderboard · 19 ข้อสระไทย'
       ],
       'v1.5.0',
       'thai-sara-run — pose catalog + color + auto-fit + per-pose foot anchors'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

SELECT 'game_docs v1.5.0' AS check, version
FROM public.game_docs d
JOIN public.educational_hub_items i ON i.id = d.item_id
WHERE i.game_slug = 'thai-sara-run';

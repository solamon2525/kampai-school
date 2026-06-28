-- apply-migration-269-only.sql
-- รันใน Supabase Dashboard → SQL Editor (หลัง push commit 269)
-- หรือรันเฉพาะส่วน 269 จาก scripts/apply-character-system-bundle.sql

ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS color_config jsonb;

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_color_config jsonb;

COMMENT ON COLUMN public.game_character_sheets.color_config IS
  'Palette recolor: {version, mode, slots[], slotsP2?, preset}';

COMMENT ON COLUMN public.educational_hub_items.character_color_config IS
  'Denormalized color_config จากคลัง — ส่งเข้า KAMPAI.character.color';

-- sync denormalized color จากคลัง → เกมที่ผูกอยู่
UPDATE public.educational_hub_items i
SET character_color_config = s.color_config
FROM public.game_character_sheets s
WHERE i.character_sheet_id = s.id
  AND s.color_config IS NOT NULL;

-- game_docs thai-sara-run → v1.4.0
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id,
       'HTML5 Canvas Platformer — สระไทย ป.1-6 · กระต่าย grid 3×6 จากคลังตัวละคร',
       ARRAY[
         'กระต่าย sprite grid 170×227 · 18 เฟรม (วิ่ง/โดด/ยืน) · KAMPAI.pickCharacterFrame',
         'คลังตัวละคร admin: Character Studio · map ท่า · preview บนพื้น · runFaces/anchorFoot',
         'ระบบใส่สี palette · preset กระต่ายฟ้า/ชมพู/เขียว · recolor runtime ใน KAMPAI.loadCharacterSheets',
         '5 หัวใจ · เก็บหัวใจเพิ่ม · ชนครั้งละ -1 · KampaiVersus co-op P2 sheet ฟ้า',
         'KAMPAI SDK score/leaderboard · fallback bundled git · 19 ข้อสระไทย'
       ],
       'v1.4.0',
       'thai-sara-run — คลังตัวละคร + animation + studio + color palette (269)'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

-- ตรวจผล
SELECT 'color_config column' AS check,
       count(*)::text AS sheets_with_color
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'game_character_sheets'
  AND column_name = 'color_config';

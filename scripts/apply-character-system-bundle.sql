-- =============================================================================
-- รวม migration 263 + 265 + 267 + game_docs (thai-sara-run)
-- รันครั้งเดียวใน Supabase SQL Editor ได้ (idempotent / IF NOT EXISTS)
--
-- ครอบคลุม:
--   · ตาราง game_character_sheets + RLS (select/insert/update/delete admin)
--   · คอลัมน์ตัวละคร + animation_config บน educational_hub_items
--   · seed กระต่าย thai-sara-run + ผูกเกม
--   · อัป game_docs thai-sara-run → v1.3.0
-- =============================================================================

-- ─── 263: คลังตัวละคร ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_character_sheets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE,
  sheet_url       text NOT NULL,
  sheet_url_p2    text,
  storage_path    text NOT NULL,
  storage_path_p2 text,
  frame_width     int NOT NULL DEFAULT 128,
  frame_height    int NOT NULL DEFAULT 128,
  frame_count     int NOT NULL DEFAULT 12,
  preview_url     text,
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_character_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_sheets_select_auth" ON public.game_character_sheets;
CREATE POLICY "char_sheets_select_auth" ON public.game_character_sheets
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "char_sheets_insert_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_insert_admin" ON public.game_character_sheets
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "char_sheets_delete_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_delete_admin" ON public.game_character_sheets
  FOR DELETE USING (public.is_admin());

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_sheet_id uuid REFERENCES public.game_character_sheets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS character_sheet_url text,
  ADD COLUMN IF NOT EXISTS character_sheet_url_p2 text,
  ADD COLUMN IF NOT EXISTS character_frame_w int,
  ADD COLUMN IF NOT EXISTS character_frame_h int,
  ADD COLUMN IF NOT EXISTS character_frame_count int;

CREATE INDEX IF NOT EXISTS idx_ehi_character_sheet_id
  ON public.educational_hub_items (character_sheet_id)
  WHERE character_sheet_id IS NOT NULL;

-- ─── 265: animation config ───────────────────────────────────────────────────
ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS animation_config jsonb;

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_animation_config jsonb;

COMMENT ON COLUMN public.game_character_sheets.animation_config IS
  'Frame mapping: preset, idle/walk/run/jump, runFaces, anchorFoot, feetPad';

COMMENT ON COLUMN public.educational_hub_items.character_animation_config IS
  'Denormalized animation_config จากคลัง — anon อ่านผ่าน published item';

-- ─── 267: RLS update + seed กระต่าย ─────────────────────────────────────────
DROP POLICY IF EXISTS "char_sheets_update_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_update_admin" ON public.game_character_sheets
  FOR UPDATE USING (public.is_admin());

INSERT INTO public.game_character_sheets (
  id,
  title,
  slug,
  sheet_url,
  sheet_url_p2,
  storage_path,
  storage_path_p2,
  frame_width,
  frame_height,
  frame_count,
  animation_config,
  notes
) VALUES (
  'f8e3a1c2-4b5d-6e7f-8a9b-0c1d2e3f4a5b',
  'กระต่าย Thai Sara Run',
  'thai-sara-run-bunny',
  'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-white-sheet.png',
  'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
  'git:games/thai/assets/thai-sara-run/bunny-white-sheet.png',
  'git:games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
  170,
  227,
  18,
  '{
    "preset": "grid-3x6-18",
    "layout": "grid",
    "cols": 6,
    "rows": 3,
    "idle": [12, 13, 14, 15, 16, 17],
    "walk": [12, 13, 14, 15, 16, 17],
    "run": [0, 1, 2, 3, 4, 5],
    "jump": [6, 7, 8, 9, 10, 11],
    "hurt": 12,
    "happy": 12,
    "walkFps": 4,
    "runFps": 12,
    "jumpFps": 10,
    "runFaces": "left",
    "anchorFoot": 0.94,
    "feetPad": 14
  }'::jsonb,
  'Seed จาก public/games/thai/assets/thai-sara-run/ — แก้ map ท่า/จุดเท้าได้ในคลังตัวละคร'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  sheet_url = EXCLUDED.sheet_url,
  sheet_url_p2 = EXCLUDED.sheet_url_p2,
  storage_path = EXCLUDED.storage_path,
  storage_path_p2 = EXCLUDED.storage_path_p2,
  frame_width = EXCLUDED.frame_width,
  frame_height = EXCLUDED.frame_height,
  frame_count = EXCLUDED.frame_count,
  animation_config = EXCLUDED.animation_config,
  notes = EXCLUDED.notes;

UPDATE public.educational_hub_items
SET
  character_sheet_id = 'f8e3a1c2-4b5d-6e7f-8a9b-0c1d2e3f4a5b',
  character_sheet_url = 'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-white-sheet.png',
  character_sheet_url_p2 = 'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
  character_frame_w = 170,
  character_frame_h = 227,
  character_frame_count = 18,
  character_animation_config = '{
    "preset": "grid-3x6-18",
    "layout": "grid",
    "cols": 6,
    "rows": 3,
    "idle": [12, 13, 14, 15, 16, 17],
    "walk": [12, 13, 14, 15, 16, 17],
    "run": [0, 1, 2, 3, 4, 5],
    "jump": [6, 7, 8, 9, 10, 11],
    "hurt": 12,
    "happy": 12,
    "walkFps": 4,
    "runFps": 12,
    "jumpFps": 10,
    "runFaces": "left",
    "anchorFoot": 0.94,
    "feetPad": 14
  }'::jsonb
WHERE game_slug = 'thai-sara-run';

-- ─── 269: ระบบใส่สีตัวละคร ───────────────────────────────────────────────────
ALTER TABLE public.game_character_sheets
  ADD COLUMN IF NOT EXISTS color_config jsonb;

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS character_color_config jsonb;

-- ─── game_docs thai-sara-run (รวม 264/266 → v1.3.0) ─────────────────────────
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
       'thai-sara-run — คลังตัวละคร + animation + studio + color palette (bundle 263-269)'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

-- ─── ตรวจผล (optional — ดูใน Results tab) ───────────────────────────────────
SELECT 'game_character_sheets' AS check, count(*)::text AS val
FROM public.game_character_sheets
UNION ALL
SELECT 'bunny seeded', count(*)::text
FROM public.game_character_sheets WHERE slug = 'thai-sara-run-bunny'
UNION ALL
SELECT 'thai-sara-run assigned', count(*)::text
FROM public.educational_hub_items
WHERE game_slug = 'thai-sara-run' AND character_sheet_id IS NOT NULL;

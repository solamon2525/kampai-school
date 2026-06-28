-- 267_character_sheets_update_seed_bunny.sql
-- RLS แก้ไขคลังตัวละคร + seed กระต่าย thai-sara-run จาก git asset + ผูกเกม

DROP POLICY IF EXISTS "char_sheets_update_admin" ON public.game_character_sheets;
CREATE POLICY "char_sheets_update_admin" ON public.game_character_sheets
  FOR UPDATE USING (public.is_admin());

-- กระต่าย default (asset ใน git — แก้ไข/อัปโหลดทับได้จากคลังตัวละคร)
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
  'Seed จาก public/games/thai/assets/thai-sara-run/ — ปรับ map ท่า/จุดเท้าได้ในคลังตัวละคร'
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

-- ผูกกระต่ายกับเกม thai-sara-run (ถ้ามี row)
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

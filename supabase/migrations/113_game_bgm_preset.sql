-- 113_game_bgm_preset.sql
-- เพลงประกอบรายเกม: เพิ่มคอลัมน์ bgm_preset (preset key ใน KAMPAI.sound)
-- null = เกมใช้ default ของตัวเอง (KAMPAI.sound.defaultBgm) · ค่า preset: cheerful/calm/warm/playful/bright/mellow/none
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS bgm_preset text;

-- seed ให้ตรงกับ defaultBgm เดิมของ 4 เกมควิซ (เพื่อให้หน้า admin โชว์ค่าปัจจุบัน)
UPDATE public.educational_hub_items SET bgm_preset = 'cheerful' WHERE game_slug = 'multiply-race' AND bgm_preset IS NULL;
UPDATE public.educational_hub_items SET bgm_preset = 'calm'     WHERE game_slug = 'sci-sort'      AND bgm_preset IS NULL;
UPDATE public.educational_hub_items SET bgm_preset = 'warm'     WHERE game_slug = 'social-quiz'   AND bgm_preset IS NULL;
UPDATE public.educational_hub_items SET bgm_preset = 'playful'  WHERE game_slug = 'vocab-race'    AND bgm_preset IS NULL;

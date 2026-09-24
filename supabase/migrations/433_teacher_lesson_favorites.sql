-- 433: Phase 8F — teacher lesson favorites (jsonb on educational_hub_profiles)

ALTER TABLE public.educational_hub_profiles
  ADD COLUMN IF NOT EXISTS lesson_favorites jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.educational_hub_profiles.lesson_favorites IS
  'Array of educational_hub_items.id marked "ใช้ในคาบนี้" by the teacher';

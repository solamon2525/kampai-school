-- 249_game_library_pin.sql
-- ปักหมุดเกมในหมวด "คลังเกมการศึกษา" (global — ทุกเครื่อง) แยกจาก homepage_featured และเกมโปรด localStorage
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS library_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_pin_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ehi_library_pinned
  ON public.educational_hub_items (library_pinned, library_pin_order)
  WHERE library_pinned = true AND is_published = true;

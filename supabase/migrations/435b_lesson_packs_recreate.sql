-- Fix Phase 15: ensure lesson_packs schema matches 435, create items table
-- Safe to re-run

-- Drop incomplete prior objects if needed, then recreate
DROP TABLE IF EXISTS public.lesson_pack_items CASCADE;
DROP TABLE IF EXISTS public.lesson_packs CASCADE;

CREATE TABLE public.lesson_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_key        TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT,
  subject         TEXT,
  grade_levels    TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url   TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  owner_staff_id  UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  phase_tag       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_packs_published
  ON public.lesson_packs (is_published, sort_order);
CREATE INDEX idx_lesson_packs_grades
  ON public.lesson_packs USING GIN (grade_levels);

CREATE TABLE public.lesson_pack_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id          UUID NOT NULL REFERENCES public.lesson_packs(id) ON DELETE CASCADE,
  edu_hub_item_id  UUID NOT NULL REFERENCES public.educational_hub_items(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('media', 'worksheet', 'game')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pack_id, edu_hub_item_id)
);

CREATE INDEX idx_lesson_pack_items_pack
  ON public.lesson_pack_items (pack_id, sort_order);

ALTER TABLE public.lesson_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_pack_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_lesson_packs" ON public.lesson_packs;
DROP POLICY IF EXISTS "owner_write_lesson_packs" ON public.lesson_packs;
DROP POLICY IF EXISTS "public_read_lesson_pack_items" ON public.lesson_pack_items;
DROP POLICY IF EXISTS "owner_write_lesson_pack_items" ON public.lesson_pack_items;

CREATE POLICY "public_read_lesson_packs" ON public.lesson_packs
  FOR SELECT USING (
    is_published = true
    OR public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_write_lesson_packs" ON public.lesson_packs
  FOR ALL USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "public_read_lesson_pack_items" ON public.lesson_pack_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lesson_packs lp
      WHERE lp.id = pack_id
        AND (
          lp.is_published = true
          OR public.is_admin()
          OR lp.owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "owner_write_lesson_pack_items" ON public.lesson_pack_items
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.lesson_packs lp
      WHERE lp.id = pack_id
        AND lp.owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.lesson_packs lp
      WHERE lp.id = pack_id
        AND lp.owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
    )
  );

DROP TRIGGER IF EXISTS trg_lesson_packs_updated_at ON public.lesson_packs;
CREATE TRIGGER trg_lesson_packs_updated_at
  BEFORE UPDATE ON public.lesson_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

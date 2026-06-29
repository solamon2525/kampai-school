-- apply-migration-273-only.sql
-- รันใน Supabase SQL Editor (Blueprint engine + คอลัมน์ blueprint บนเกม)

CREATE TABLE IF NOT EXISTS public.game_blueprints (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  engine          text NOT NULL DEFAULT 'platformer-2d',
  blueprint       jsonb NOT NULL,
  owner_staff_id  uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_blueprints_engine ON public.game_blueprints (engine);
CREATE INDEX IF NOT EXISTS idx_game_blueprints_owner ON public.game_blueprints (owner_staff_id);

ALTER TABLE public.game_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_admin_read_game_blueprints" ON public.game_blueprints;
DROP POLICY IF EXISTS "owner_admin_write_game_blueprints" ON public.game_blueprints;

CREATE POLICY "owner_admin_read_game_blueprints" ON public.game_blueprints
  FOR SELECT USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_admin_write_game_blueprints" ON public.game_blueprints
  FOR ALL USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS blueprint_id uuid REFERENCES public.game_blueprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS blueprint_json jsonb;

CREATE INDEX IF NOT EXISTS idx_ehi_blueprint_id
  ON public.educational_hub_items (blueprint_id)
  WHERE blueprint_id IS NOT NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('game_blueprints', 'educational_hub_items')
  AND column_name IN ('blueprint_id', 'blueprint_json', 'blueprint')
ORDER BY table_name, column_name;

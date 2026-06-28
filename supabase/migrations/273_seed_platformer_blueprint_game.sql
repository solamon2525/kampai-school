-- 273_seed_platformer_blueprint_game.sql
-- Blueprint ด่านเกม (Construct-lite) + engine platformer-2d demo

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

DO $$
DECLARE
  v_staff_id  uuid;
  v_cat_games uuid;
  v_bp_id     uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
  v_url       text := '/games/engine/platformer-2d/index.html';
  v_bp        jsonb := '{
    "version": 1,
    "engine": "platformer-2d",
    "world": { "width": 1280, "height": 720, "groundY": 620 },
    "rules": { "lives": 5, "timeLimitSec": 90, "starPoints": 10 },
    "spawn": { "x": 120, "y": 524 },
    "platforms": [
      { "id": "ground", "x": 0, "y": 620, "w": 1280, "h": 24 },
      { "id": "p1", "x": 280, "y": 480, "w": 180, "h": 24 },
      { "id": "p2", "x": 520, "y": 400, "w": 160, "h": 24 },
      { "id": "p3", "x": 760, "y": 320, "w": 200, "h": 24 }
    ],
    "collectibles": [
      { "id": "s1", "x": 340, "y": 440, "kind": "star" },
      { "id": "s2", "x": 580, "y": 360, "kind": "star" },
      { "id": "s3", "x": 820, "y": 280, "kind": "star" }
    ],
    "questions": []
  }'::jsonb;
BEGIN
  INSERT INTO public.game_blueprints (id, title, engine, blueprint)
  SELECT v_bp_id, 'ด่านตัวอย่าง Platformer', 'platformer-2d', v_bp
  WHERE NOT EXISTS (SELECT 1 FROM public.game_blueprints WHERE id = v_bp_id);

  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RETURN; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '🏗️ ออกแบบด่าน Platformer (Demo)', v_url, 'คณิตศาสตร์', 273
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'platformer-blueprint',
      tracked_game = true,
      is_published = true,
      game_play_style = 'platformer',
      thumbnail_url = '/games/engine/platformer-2d/cover.svg',
      blueprint_id = v_bp_id,
      blueprint_json = v_bp,
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Platformer 2D Blueprint Engine — ออกแบบด่านจากหลังบ้าน',
         ARRAY[
           'Visual editor ลาก platform / spawn / ดาว',
           'Engine เดียวโหลด blueprint จาก DB ผ่าน KAMPAI init',
           'รองรับตัวละครจาก Character Studio (KAMPAI.character)'
         ],
         'v1.0.0',
         'Blueprint engine MVP — migration 273'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;

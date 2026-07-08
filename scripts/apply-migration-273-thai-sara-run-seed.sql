-- apply-migration-273-thai-sara-run-seed.sql
-- รันใน Supabase SQL Editor หลัง apply-migration-273-only.sql
-- ผูกด่าน blueprint เริ่มต้นกับ thai-sara-run (idempotent)

DO $$
DECLARE
  v_bp_id uuid := 'b3e4f5a6-7890-4abc-def0-123456789abc'::uuid;
  v_bp    jsonb := '{
    "version": 1,
    "engine": "platformer-2d",
    "world": { "width": 1280, "height": 720, "groundY": 620 },
    "rules": { "lives": 5, "timeLimitSec": 0, "starPoints": 10 },
    "spawn": { "x": 120, "y": 524 },
    "platforms": [
      { "id": "ground", "x": 0, "y": 620, "w": 1280, "h": 24 },
      { "id": "p1", "x": 240, "y": 500, "w": 200, "h": 24 },
      { "id": "p2", "x": 500, "y": 420, "w": 220, "h": 24 },
      { "id": "p3", "x": 780, "y": 340, "w": 200, "h": 24 },
      { "id": "p4", "x": 1020, "y": 460, "w": 180, "h": 24 }
    ],
    "collectibles": [
      { "id": "s1", "x": 320, "y": 460, "kind": "star" },
      { "id": "s2", "x": 600, "y": 380, "kind": "star" },
      { "id": "h1", "x": 860, "y": 300, "kind": "heart" }
    ],
    "questions": [
      {
        "id": "q-p2",
        "platformId": "p2",
        "prompt": "ป _",
        "options": ["ู", "า", "ิ"],
        "answer": "ู"
      },
      {
        "id": "q-p4",
        "platformId": "p4",
        "prompt": "ต _",
        "options": ["า", "ี", "ุ"],
        "answer": "า"
      }
    ]
  }'::jsonb;
  v_item_id uuid;
BEGIN
  INSERT INTO public.game_blueprints (id, title, engine, blueprint)
  SELECT v_bp_id, 'thai-sara-run — ด่านเริ่มต้น', 'platformer-2d', v_bp
  WHERE NOT EXISTS (SELECT 1 FROM public.game_blueprints WHERE id = v_bp_id);

  UPDATE public.game_blueprints
  SET title = 'thai-sara-run — ด่านเริ่มต้น',
      blueprint = v_bp,
      updated_at = now()
  WHERE id = v_bp_id;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE game_slug = 'thai-sara-run'
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE NOTICE 'ไม่พบเกม game_slug=thai-sara-run — ข้ามผูก blueprint';
    RETURN;
  END IF;

  UPDATE public.educational_hub_items
  SET blueprint_id = v_bp_id,
      blueprint_json = v_bp,
      game_play_style = COALESCE(game_play_style, 'platformer-2d'),
      updated_at = now()
  WHERE id = v_item_id;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Platformer 2D + blueprint ด่านออกแบบได้',
         ARRAY[
           'โหลดด่านจาก blueprint (admin ออกแบบด่าน)',
           'คลังโจทย์สระ 19 ข้อ + นำเข้า CSV',
           'ตัวละครจาก Character Studio (KAMPAI.character)'
         ],
         'v1.1.0',
         'Blueprint ด่านเริ่มต้น — apply-migration-273-thai-sara-run-seed.sql'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

-- ตรวจผล
SELECT
  i.title,
  i.game_slug,
  i.game_play_style,
  i.blueprint_id IS NOT NULL AS has_blueprint,
  (i.blueprint_json->'platforms') IS NOT NULL AS has_platforms,
  jsonb_array_length(COALESCE(i.blueprint_json->'questions', '[]'::jsonb)) AS question_count
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-sara-run';

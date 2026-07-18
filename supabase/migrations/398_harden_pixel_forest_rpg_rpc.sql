-- 398_harden_pixel_forest_rpg_rpc.sql
-- Tighten the public game RPC payload boundary and add an admin-only balance rollup.

CREATE OR REPLACE FUNCTION public.save_pixel_forest_rpg_state(
  p_student_code text,
  p_expected_version int,
  p_idempotency_key text,
  p_state jsonb,
  p_events jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_student_id uuid;
  v_profile public.pixel_forest_rpg_profiles%ROWTYPE;
  v_class text;
  v_level int;
  v_xp int;
  v_gold int;
  v_gems int;
  v_chapter int;
  v_zone text;
  v_gold_delta int;
  v_gem_delta int;
  v_event jsonb;
  v_event_value numeric;
  v_new_version int;
BEGIN
  IF p_idempotency_key IS NULL
     OR char_length(p_idempotency_key) NOT BETWEEN 8 AND 80
     OR p_idempotency_key !~ '^[a-zA-Z0-9:_-]+$' THEN
    RAISE EXCEPTION 'RPG_INVALID_SAVE_KEY';
  END IF;
  IF p_expected_version IS NULL OR p_expected_version < 1 THEN
    RAISE EXCEPTION 'RPG_INVALID_VERSION';
  END IF;
  IF p_state IS NULL
     OR jsonb_typeof(p_state) IS DISTINCT FROM 'object'
     OR octet_length(p_state::text) > 100000 THEN
    RAISE EXCEPTION 'RPG_INVALID_STATE';
  END IF;
  IF p_events IS NULL
     OR jsonb_typeof(p_events) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_events) > 30
     OR octet_length(p_events::text) > 50000 THEN
    RAISE EXCEPTION 'RPG_INVALID_EVENTS';
  END IF;

  IF (p_state->>'schema_version') !~ '^[0-9]+$'
     OR (p_state->>'schema_version')::int <> 1
     OR jsonb_typeof(p_state->'inventory') IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_state->'equipment') IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_state->'unlocked_zones') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_state->'quest') IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_state->'runes') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_state->'bosses') IS DISTINCT FROM 'object'
     OR jsonb_array_length(p_state->'unlocked_zones') NOT BETWEEN 1 AND 4
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements_text(p_state->'unlocked_zones') AS zone_name
       WHERE zone_name NOT IN ('village', 'mosswood', 'swamp', 'ruins')
     ) THEN
    RAISE EXCEPTION 'RPG_STATE_SHAPE_INVALID';
  END IF;

  v_class := NULLIF(p_state->>'hero_class', '');
  IF v_class IS NULL OR v_class NOT IN ('swordsman', 'ranger', 'mage')
     OR (p_state->>'hero_level') !~ '^[0-9]+$'
     OR (p_state->>'hero_xp') !~ '^[0-9]+$'
     OR (p_state->>'gold') !~ '^[0-9]+$'
     OR (p_state->>'gems') !~ '^[0-9]+$'
     OR (p_state->>'chapter') !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'RPG_STATE_OUT_OF_RANGE';
  END IF;

  v_level := (p_state->>'hero_level')::int;
  v_xp := (p_state->>'hero_xp')::int;
  v_gold := (p_state->>'gold')::int;
  v_gems := (p_state->>'gems')::int;
  v_chapter := (p_state->>'chapter')::int;
  v_zone := NULLIF(p_state->>'zone', '');

  IF v_level NOT BETWEEN 1 AND 50
     OR v_xp NOT BETWEEN 0 AND 10000000
     OR v_gold NOT BETWEEN 0 AND 10000000
     OR v_gems NOT BETWEEN 0 AND 1000000
     OR v_chapter NOT BETWEEN 1 AND 4
     OR v_zone IS NULL
     OR v_zone NOT IN ('village', 'mosswood', 'swamp', 'ruins') THEN
    RAISE EXCEPTION 'RPG_STATE_OUT_OF_RANGE';
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = btrim(p_student_code)
    AND s.is_active IS NOT FALSE
  LIMIT 1;
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'RPG_STUDENT_NOT_FOUND'; END IF;

  INSERT INTO public.pixel_forest_rpg_profiles (student_id)
  VALUES (v_student_id)
  ON CONFLICT (student_id) DO NOTHING;

  SELECT * INTO v_profile
  FROM public.pixel_forest_rpg_profiles
  WHERE student_id = v_student_id
  FOR UPDATE;

  IF v_profile.last_save_key = p_idempotency_key THEN
    RETURN jsonb_build_object(
      'state_version', v_profile.state_version,
      'save_state', v_profile.save_state,
      'saved_at', v_profile.updated_at,
      'replayed', true
    );
  END IF;
  IF p_expected_version IS DISTINCT FROM v_profile.state_version THEN
    RAISE EXCEPTION 'RPG_SAVE_CONFLICT:%', v_profile.state_version;
  END IF;

  v_gold_delta := v_gold - v_profile.gold;
  v_gem_delta := v_gems - v_profile.gems;
  IF abs(v_gold_delta) > 2500 OR abs(v_gem_delta) > 100 THEN
    RAISE EXCEPTION 'RPG_ECONOMY_DELTA_TOO_LARGE';
  END IF;

  v_new_version := v_profile.state_version + 1;
  UPDATE public.pixel_forest_rpg_profiles SET
    hero_class = v_class,
    hero_level = v_level,
    hero_xp = v_xp,
    gold = v_gold,
    gems = v_gems,
    current_chapter = v_chapter,
    current_zone = v_zone,
    save_state = p_state,
    state_version = v_new_version,
    last_save_key = p_idempotency_key,
    last_played_at = now(),
    updated_at = now()
  WHERE student_id = v_student_id;

  IF v_gold_delta <> 0 THEN
    INSERT INTO public.pixel_forest_economy_ledger
      (student_id, currency, amount, balance_after, reason, idempotency_key, metadata)
    VALUES
      (v_student_id, 'gold', v_gold_delta, v_gold, 'save_sync', p_idempotency_key,
       jsonb_build_object('chapter', v_chapter, 'zone', v_zone))
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_gem_delta <> 0 THEN
    INSERT INTO public.pixel_forest_economy_ledger
      (student_id, currency, amount, balance_after, reason, idempotency_key, metadata)
    VALUES
      (v_student_id, 'gems', v_gem_delta, v_gems, 'save_sync', p_idempotency_key,
       jsonb_build_object('chapter', v_chapter, 'zone', v_zone))
    ON CONFLICT DO NOTHING;
  END IF;

  FOR v_event IN SELECT value FROM jsonb_array_elements(p_events)
  LOOP
    IF jsonb_typeof(v_event) IS DISTINCT FROM 'object'
       OR octet_length(v_event::text) > 4000
       OR jsonb_typeof(COALESCE(v_event->'metadata', '{}'::jsonb)) IS DISTINCT FROM 'object' THEN
      CONTINUE;
    END IF;
    IF v_event->>'type' IN (
      'session_start', 'session_end', 'class_selected', 'zone_enter', 'monster_kill',
      'player_death', 'boss_start', 'boss_clear', 'chapter_complete', 'item_craft',
      'weapon_enhance', 'rune_equip', 'damage_dealt', 'damage_taken'
    ) THEN
      v_event_value := CASE
        WHEN (v_event->>'value') ~ '^-?[0-9]+([.][0-9]+)?$'
          THEN (v_event->>'value')::numeric
        ELSE NULL
      END;
      IF v_event_value IS NOT NULL AND abs(v_event_value) > 1000000 THEN
        v_event_value := NULL;
      END IF;
      INSERT INTO public.pixel_forest_balance_events
        (student_id, event_type, hero_class, hero_level, chapter, zone, value, metadata)
      VALUES
        (v_student_id, v_event->>'type', v_class, v_level, v_chapter, v_zone,
         v_event_value, COALESCE(v_event->'metadata', '{}'::jsonb));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'state_version', v_new_version,
    'save_state', p_state,
    'saved_at', now(),
    'replayed', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_pixel_forest_rpg_state(text, int, text, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_pixel_forest_rpg_state(text, int, text, jsonb, jsonb)
  TO anon, authenticated;

CREATE OR REPLACE VIEW public.pixel_forest_balance_summary
WITH (security_invoker = true)
AS
SELECT
  date_trunc('day', created_at) AS play_day,
  hero_class,
  chapter,
  zone,
  event_type,
  count(*)::bigint AS event_count,
  count(DISTINCT student_id)::bigint AS player_count,
  round(avg(value), 2) AS average_value
FROM public.pixel_forest_balance_events
GROUP BY 1, 2, 3, 4, 5;

REVOKE ALL ON public.pixel_forest_balance_summary FROM PUBLIC, anon;
GRANT SELECT ON public.pixel_forest_balance_summary TO authenticated;

UPDATE public.educational_hub_items SET
  build_version = '3.0.1',
  build_updated_at = now(),
  updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

UPDATE public.game_docs SET
  version = '3.0.1',
  notes = 'RPG Vertical Slice รุ่น 1: persistent save RPC hardened with strict JSON shape and payload limits; admin-only balance rollup; original pixel art assets',
  updated_at = now()
WHERE item_id = (
  SELECT id FROM public.educational_hub_items
  WHERE game_slug = 'pixel-forest-explorer' LIMIT 1
);

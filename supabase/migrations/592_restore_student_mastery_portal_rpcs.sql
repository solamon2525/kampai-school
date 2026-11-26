-- ============================================================================
-- Migration 592: Restore missing Student/Parent Mastery Portal RPCs from 269
-- ============================================================================
-- Note: Migration 269_student_mastery_portal.sql was not recorded in
-- schema_migrations on production; resolve_student_by_code & recommend_games
-- exist, while my_mastery, child_mastery, class_indicator_heatmap, and
-- batch_set_game_indicators are missing from pg_proc.
-- This migration restores those 4 RPCs with null-safe v_stats fallbacks and
-- explicit privilege hardening (no table/data mutations).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.my_mastery(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
  v_grade   text;
  v_mastery jsonb;
  v_stats   jsonb;
BEGIN
  v_student := public.resolve_student_by_code(p_student_code);
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;
  v_grade := public.grade_from_class(v_student.class);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'indicator_id', ci.id,
    'subject_key',  ci.subject_key,
    'grade',        ci.grade,
    'indicator_code', ci.indicator_code,
    'description',  ci.description,
    'indicator_kind', ci.indicator_kind,
    'strand_title', ci.strand_title,
    'sort_order',   ci.sort_order,
    'status',       COALESCE(m.status, 'not_started'),
    'attempts',     COALESCE(m.attempts, 0),
    'best_score',   m.best_score,
    'last_event',   m.last_event,
    'assessed_level', m.assessed_level,
    'assessed_source', m.assessed_source
  ) ORDER BY ci.subject_key, ci.sort_order), '[]'::jsonb)
  INTO v_mastery
  FROM public.curriculum_indicators ci
  LEFT JOIN public.v_student_indicator_mastery m
    ON m.indicator_id = ci.id AND m.student_id = v_student.id
  WHERE ci.is_active = true
    AND (v_grade IS NULL OR ci.grade = v_grade);

  SELECT jsonb_build_object(
    'total_xp', COALESCE(p.total_xp, 0),
    'games_played', COALESCE(p.games_played, 0),
    'plays_count', COALESCE(p.plays_count, 0),
    'active_days', COALESCE(p.active_days, 0),
    'medals_count', COALESCE((SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = v_student.id), 0)
  ) INTO v_stats
  FROM public.student_global_profile p
  WHERE p.student_id = v_student.id;

  v_stats := COALESCE(
    v_stats,
    jsonb_build_object(
      'total_xp', 0,
      'games_played', 0,
      'plays_count', 0,
      'active_days', 0,
      'medals_count', COALESCE((SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = v_student.id), 0)
    )
  );

  RETURN jsonb_build_object(
    'student', jsonb_build_object(
      'id', v_student.id,
      'name', v_student.name,
      'nickname', v_student.nickname,
      'photo_url', v_student.photo_url,
      'class', v_student.class,
      'room', v_student.room,
      'student_code', v_student.student_code,
      'grade', v_grade
    ),
    'grade', v_grade,
    'mastery', v_mastery,
    'stats', v_stats
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.my_mastery(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_mastery(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.child_mastery(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
  v_grade   text;
  v_mastery jsonb;
  v_stats   jsonb;
BEGIN
  IF NOT COALESCE(public.is_my_student(p_student_id), false) THEN
    RAISE EXCEPTION 'not_your_child' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;
  v_grade := public.grade_from_class(v_student.class);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'indicator_id', ci.id,
    'subject_key',  ci.subject_key,
    'grade',        ci.grade,
    'indicator_code', ci.indicator_code,
    'description',  ci.description,
    'indicator_kind', ci.indicator_kind,
    'strand_title', ci.strand_title,
    'sort_order',   ci.sort_order,
    'status',       COALESCE(m.status, 'not_started'),
    'attempts',     COALESCE(m.attempts, 0),
    'best_score',   m.best_score,
    'last_event',   m.last_event,
    'assessed_level', m.assessed_level,
    'assessed_source', m.assessed_source
  ) ORDER BY ci.subject_key, ci.sort_order), '[]'::jsonb)
  INTO v_mastery
  FROM public.curriculum_indicators ci
  LEFT JOIN public.v_student_indicator_mastery m
    ON m.indicator_id = ci.id AND m.student_id = p_student_id
  WHERE ci.is_active = true
    AND (v_grade IS NULL OR ci.grade = v_grade);

  SELECT jsonb_build_object(
    'total_xp', COALESCE(p.total_xp, 0),
    'games_played', COALESCE(p.games_played, 0),
    'plays_count', COALESCE(p.plays_count, 0),
    'medals_count', COALESCE((SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = p_student_id), 0)
  ) INTO v_stats
  FROM public.student_global_profile p
  WHERE p.student_id = p_student_id;

  v_stats := COALESCE(
    v_stats,
    jsonb_build_object(
      'total_xp', 0,
      'games_played', 0,
      'plays_count', 0,
      'medals_count', COALESCE((SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = p_student_id), 0)
    )
  );

  RETURN jsonb_build_object(
    'student', jsonb_build_object(
      'id', v_student.id,
      'name', v_student.name,
      'photo_url', v_student.photo_url,
      'class', v_student.class,
      'room', v_student.room,
      'grade', v_grade
    ),
    'grade', v_grade,
    'mastery', v_mastery,
    'stats', v_stats
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.child_mastery(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.child_mastery(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.class_indicator_heatmap(
  p_class text,
  p_subject_key text,
  p_grade text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_total int;
BEGIN
  IF NOT (COALESCE(public.is_teacher(), false) OR COALESCE(public.is_admin(), false)) THEN
    RAISE EXCEPTION 'teacher_only' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.students
  WHERE class = p_class AND COALESCE(is_active, true) = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'indicator_id', ci.id,
    'indicator_code', ci.indicator_code,
    'description', ci.description,
    'indicator_kind', ci.indicator_kind,
    'strand_title', ci.strand_title,
    'sort_order', ci.sort_order,
    'total', v_total,
    'not_started', COUNT(*) FILTER (WHERE COALESCE(m.status, 'not_started') = 'not_started'),
    'practicing',  COUNT(*) FILTER (WHERE m.status = 'practicing'),
    'passed',      COUNT(*) FILTER (WHERE m.status = 'passed'),
    'mastered',    COUNT(*) FILTER (WHERE m.status = 'mastered')
  ) ORDER BY ci.sort_order), '[]'::jsonb)
  INTO v_result
  FROM public.curriculum_indicators ci
  LEFT JOIN public.v_student_indicator_mastery m ON m.indicator_id = ci.id
  LEFT JOIN public.students s ON s.id = m.student_id AND s.class = p_class
  WHERE ci.subject_key = p_subject_key
    AND ci.grade = p_grade
    AND ci.is_active = true
  GROUP BY ci.id, ci.indicator_code, ci.description, ci.indicator_kind,
           ci.strand_title, ci.sort_order;

  RETURN jsonb_build_object('total_students', v_total, 'rows', v_result);
END;
$function$;

REVOKE ALL ON FUNCTION public.class_indicator_heatmap(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.class_indicator_heatmap(text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.batch_set_game_indicators(p_mappings jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_map    jsonb;
  v_item   uuid;
  v_ids    uuid[];
  v_done   int := 0;
BEGIN
  IF NOT (COALESCE(public.is_teacher(), false) OR COALESCE(public.is_admin(), false)) THEN
    RAISE EXCEPTION 'teacher_only' USING ERRCODE = 'P0001';
  END IF;

  FOR v_map IN SELECT jsonb_array_elements(p_mappings) LOOP
    v_item := (v_map->>'edu_hub_item_id')::uuid;
    v_ids  := ARRAY(
      SELECT jsonb_array_elements_text(v_map->'indicator_ids')::uuid
    );
    DELETE FROM public.indicator_games WHERE edu_hub_item_id = v_item;
    IF array_length(v_ids, 1) > 0 THEN
      INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
      SELECT v_item, unnest(v_ids)
      ON CONFLICT DO NOTHING;
    END IF;
    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('updated', v_done);
END;
$function$;

REVOKE ALL ON FUNCTION public.batch_set_game_indicators(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.batch_set_game_indicators(jsonb) TO authenticated, service_role;

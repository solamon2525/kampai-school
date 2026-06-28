-- ============================================================================
-- Migration 269: Student/Parent Mastery Portal RPCs (Phase A — ระบบเรียนรู้ #1-4)
-- ============================================================================
-- ปัญหา: v_student_indicator_mastery จำกัด teacher/admin (RLS) แต่นักเรียนเข้าด้วย
--   student_code (anon) และผู้ปกครอง login → อ่านไม่ได้ทั้งคู่
-- แก้: RPC SECURITY DEFINER เป็นชั้นกลาง ที่ resolve identity + เก็บสิทธิ์ฝั่งเดียว
--
-- RPC ที่สร้าง:
--   1. my_mastery(p_student_code)         → Student Dashboard (#4)
--   2. child_mastery(p_student_id)        → Parent Mastery (#2) — ตรวจ is_my_student
--   3. recommend_games(p_student_code, n) → Game Recommendation (#1)
--   4. class_indicator_heatmap(p_class, subject, grade) → Class Heatmap ครู (#3)
--   5. batch_set_game_indicators(maps)    → เครื่องมือ Map Batch (#1 support)
-- ============================================================================

-- ─── helper: resolve student_code → student row (active เท่านั้น) ────────────
-- เป็น helper เดียวกันที่ lookup_student_for_game ใช้ แต่ตั้งให้ตรงนี้เพื่อความชัดเจน
CREATE OR REPLACE FUNCTION public.resolve_student_by_code(p_student_code text)
RETURNS public.students
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.students
  WHERE student_code = p_student_code
    AND COALESCE(is_active, true) = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.resolve_student_by_code(text) TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 1) my_mastery — Student Dashboard (#4)
-- คืน { student, grade, mastery[], stats } — mastery = join v_student_indicator_mastery
-- กับ curriculum_indicators เพื่อได้ subject/grade/description (อ่านทุกตัวของเกรดตัวเอง)
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.my_mastery(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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

  -- mastery: ทุกตัวชี้วัดในเกรดตัวเอง + status (LEFT JOIN เพื่อให้เห็นที่ยังไม่เริ่ม)
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

  -- stats: XP/เลเวล/เกมที่เล่น (จาก student_global_profile) + เหรียญนับ
  SELECT jsonb_build_object(
    'total_xp', COALESCE(p.total_xp, 0),
    'games_played', COALESCE(p.games_played, 0),
    'plays_count', COALESCE(p.plays_count, 0),
    'active_days', COALESCE(p.active_days, 0),
    'medals_count', (SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = v_student.id)
  ) INTO v_stats
  FROM public.student_global_profile p
  WHERE p.student_id = v_student.id;

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
GRANT EXECUTE ON FUNCTION public.my_mastery(text) TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2) child_mastery — Parent Mastery (#2) — ตรวจ is_my_student ก่อนเสมอ
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.child_mastery(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
  v_grade   text;
  v_mastery jsonb;
  v_stats   jsonb;
BEGIN
  -- ปลอดภัย: ผู้ปกครองดูได้เฉพาะลูกตัวเองเท่านั้น (helper SECURITY DEFINER migration 069)
  IF NOT public.is_my_student(p_student_id) THEN
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
    'medals_count', (SELECT COUNT(*) FROM public.game_student_achievements WHERE student_id = p_student_id)
  ) INTO v_stats
  FROM public.student_global_profile p
  WHERE p.student_id = p_student_id;

  RETURN jsonb_build_object(
    'student', jsonb_build_object(
      'id', v_student.id, 'name', v_student.name, 'photo_url', v_student.photo_url,
      'class', v_student.class, 'room', v_student.room, 'grade', v_grade
    ),
    'grade', v_grade, 'mastery', v_mastery, 'stats', v_stats
  );
END;
$function$;
GRANT EXECUTE ON FUNCTION public.child_mastery(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3) recommend_games — Game Recommendation (#1)
-- Tier 1 (smart): indicators ที่ยังไม่ผ่าน → เกมที่ map ตัวชี้วัดเหล่านั้น (ยังไม่เคยเล่น)
-- Tier 2 (subject fallback): เกมในวิชาเดียวกัน + grade ตรง ที่ยังไม่เคยเล่น
-- Tier 3 (popular pad): เกมยอดนิยม (view_count) ที่ยังไม่เคยเล่น จนครบ limit
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recommend_games(p_student_code text, p_limit int DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
  v_grade   text;
  v_result  jsonb;
BEGIN
  v_student := public.resolve_student_by_code(p_student_code);
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;
  v_grade := public.grade_from_class(v_student.class);

  WITH
  -- เกมที่นักเรียนเคยเล่นแล้ว (game_slug)
  played AS (
    SELECT DISTINCT game_slug FROM public.game_sessions
    WHERE student_id = v_student.id AND game_slug IS NOT NULL
  ),
  -- Tier 1: เกมที่ map กับตัวชี้วัดที่ยัง not_started/practicing ในเกรดตัวเอง
  tier1 AS (
    SELECT DISTINCT
      ehi.id AS item_id, ehi.game_slug AS slug, ehi.title, ehi.thumbnail_url,
      ehi.subject, ci.description AS indicator_desc, ci.subject_key
    FROM public.curriculum_indicators ci
    JOIN public.indicator_games ig ON ig.indicator_id = ci.id
    JOIN public.educational_hub_items ehi ON ehi.id = ig.edu_hub_item_id
    LEFT JOIN public.v_student_indicator_mastery m
      ON m.indicator_id = ci.id AND m.student_id = v_student.id
    WHERE ehi.tracked_game = true AND ehi.is_published = true
      AND ehi.game_slug IS NOT NULL
      AND ehi.game_slug NOT IN (SELECT game_slug FROM played)
      AND (v_grade IS NULL OR ci.grade = v_grade)
      AND COALESCE(m.status, 'not_started') IN ('not_started', 'practicing')
  ),
  t1 AS (
    SELECT item_id, slug, title, thumbnail_url, subject, subject_key,
           MIN(indicator_desc) AS indicator_desc,
           'indicator_gap'::text AS reason,
           1 AS tier
    FROM tier1 GROUP BY item_id, slug, title, thumbnail_url, subject, subject_key
  ),
  -- Tier 2: เกมในวิชาที่เรียน (subject_key เดียวกับ indicators ของเกรด) ที่ยังไม่เล่น
  t2 AS (
    SELECT ehi.id AS item_id, ehi.game_slug AS slug, ehi.title, ehi.thumbnail_url,
           ehi.subject, (public.subject_keys(ehi.subject))[1] AS subject_key,
           NULL::text AS indicator_desc, 'subject_suggest'::text AS reason, 2 AS tier
    FROM public.educational_hub_items ehi
    WHERE ehi.tracked_game = true AND ehi.is_published = true
      AND ehi.game_slug IS NOT NULL
      AND ehi.game_slug NOT IN (SELECT game_slug FROM played)
      AND ehi.id NOT IN (SELECT item_id FROM t1)
      AND EXISTS (
        SELECT 1 FROM public.curriculum_indicators ci
        WHERE ci.grade = v_grade AND ci.is_active = true
          AND public.subject_keys(ehi.subject) @> ARRAY[ci.subject_key]
      )
    LIMIT p_limit
  ),
  -- Tier 3: เกมยอดนิยมที่ยังไม่เล่น (pad ให้ครบ limit)
  t3 AS (
    SELECT ehi.id AS item_id, ehi.game_slug AS slug, ehi.title, ehi.thumbnail_url,
           ehi.subject, (public.subject_keys(ehi.subject))[1] AS subject_key,
           NULL::text AS indicator_desc, 'popular'::text AS reason, 3 AS tier
    FROM public.educational_hub_items ehi
    WHERE ehi.tracked_game = true AND ehi.is_published = true
      AND ehi.game_slug IS NOT NULL
      AND ehi.game_slug NOT IN (SELECT game_slug FROM played)
      AND ehi.id NOT IN (SELECT item_id FROM t1)
      AND ehi.id NOT IN (SELECT item_id FROM t2)
    ORDER BY ehi.view_count DESC NULLS LAST, ehi.created_at DESC
    LIMIT GREATEST(p_limit, 8)
  ),
  combined AS (
    SELECT * FROM t1
    UNION ALL SELECT * FROM t2
    UNION ALL SELECT * FROM t3
  ),
  ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY tier, item_id) AS rn FROM combined
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'item_id', item_id, 'slug', slug, 'title', title,
    'thumbnail', thumbnail_url, 'subject', subject, 'subject_key', subject_key,
    'reason', reason, 'indicator_desc', indicator_desc, 'tier', tier
  ) ORDER BY tier, item_id), '[]'::jsonb)
  INTO v_result
  FROM ranked WHERE rn <= p_limit;

  RETURN v_result;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.recommend_games(text, int) TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4) class_indicator_heatmap — Class Mastery Heatmap (ครู #3)
-- aggregate mastery รายห้อง → นับนักเรียนในแต่ละสถานะต่อตัวชี้วัด
-- RLS: is_teacher() เท่านั้น
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.class_indicator_heatmap(
  p_class text, p_subject_key text, p_grade text
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_result jsonb;
  v_total int;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'teacher_only' USING ERRCODE = 'P0001';
  END IF;

  -- จำนวนนักเรียน active ในห้อง (จำกัดที่เกรดเดียวกับที่ขอ)
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
    'not_started', COUNT(*) FILTER (WHERE COALESCE(m.status,'not_started') = 'not_started'),
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
GRANT EXECUTE ON FUNCTION public.class_indicator_heatmap(text, text, text) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 5) batch_set_game_indicators — เครื่องมือ Map Batch (admin #1 support)
-- รับ [{ edu_hub_item_id, indicator_ids: [uuid,...] }, ...] → replace ทีละเกม
-- transaction เดียว — ทั้งหมดสำเร็จหรือทั้งหมด rollback
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.batch_set_game_indicators(p_mappings jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_map    jsonb;
  v_item   uuid;
  v_ids    uuid[];
  v_done   int := 0;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'teacher_only' USING ERRCODE = 'P0001';
  END IF;

  FOR v_map IN SELECT jsonb_array_elements(p_mappings) LOOP
    v_item := v_map->>'edu_hub_item_id';
    v_ids  := ARRAY(
      SELECT jsonb_array_elements_text(v_map->'indicator_ids')::uuid
    );
    -- replace (delete + insert) ทีละเกม
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
GRANT EXECUTE ON FUNCTION public.batch_set_game_indicators(jsonb) TO authenticated;

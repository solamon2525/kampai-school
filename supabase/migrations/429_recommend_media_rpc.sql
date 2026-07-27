-- Migration 429: recommend_media RPC + grant
-- Sibling of recommend_games for teaching media (tracked_game=false, category media/videos)

CREATE OR REPLACE FUNCTION public.recommend_media(p_student_code text, p_limit int DEFAULT 8)
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
  media_items AS (
    SELECT ehi.*
    FROM public.educational_hub_items ehi
    JOIN public.educational_hub_categories cat ON cat.id = ehi.category_id
    WHERE ehi.tracked_game = false
      AND ehi.is_published = true
      AND cat.category_key IN ('media', 'videos')
      AND (
        (ehi.external_url IS NOT NULL AND ehi.external_url <> '' AND ehi.external_url NOT LIKE '%worksheet%')
        OR (ehi.youtube_id IS NOT NULL AND ehi.youtube_id <> '')
        OR (ehi.file_url IS NOT NULL AND ehi.file_url <> '')
      )
  ),
  -- Tier 1: สื่อที่ map ตัวชี้วัดที่ยังไม่ผ่านในเกรดตัวเอง
  tier1 AS (
    SELECT DISTINCT
      mi.id AS item_id,
      mi.title,
      mi.thumbnail_url,
      mi.subject,
      mi.external_url,
      mi.youtube_id,
      mi.file_url,
      mi.item_type,
      ci.description AS indicator_desc,
      ci.subject_key
    FROM public.curriculum_indicators ci
    JOIN public.indicator_games ig ON ig.indicator_id = ci.id
    JOIN media_items mi ON mi.id = ig.edu_hub_item_id
    LEFT JOIN public.v_student_indicator_mastery m
      ON m.indicator_id = ci.id AND m.student_id = v_student.id
    WHERE (v_grade IS NULL OR ci.grade = v_grade)
      AND COALESCE(m.status, 'not_started') IN ('not_started', 'practicing')
  ),
  t1 AS (
    SELECT item_id, title, thumbnail_url, subject, external_url, youtube_id, file_url, item_type, subject_key,
           MIN(indicator_desc) AS indicator_desc,
           'indicator_gap'::text AS reason,
           1 AS tier
    FROM tier1
    GROUP BY item_id, title, thumbnail_url, subject, external_url, youtube_id, file_url, item_type, subject_key
  ),
  -- Tier 2: สื่อในวิชาที่เรียน (เกรดตรง)
  t2 AS (
    SELECT mi.id AS item_id, mi.title, mi.thumbnail_url, mi.subject,
           mi.external_url, mi.youtube_id, mi.file_url, mi.item_type,
           (public.subject_keys(mi.subject))[1] AS subject_key,
           NULL::text AS indicator_desc, 'subject_suggest'::text AS reason, 2 AS tier
    FROM media_items mi
    WHERE mi.id NOT IN (SELECT item_id FROM t1)
      AND EXISTS (
        SELECT 1 FROM public.curriculum_indicators ci
        WHERE ci.grade = v_grade AND ci.is_active = true
          AND public.subject_keys(mi.subject) @> ARRAY[ci.subject_key]
      )
      AND (
        v_grade IS NULL
        OR mi.grade_levels IS NULL
        OR cardinality(mi.grade_levels) = 0
        OR v_grade = ANY (mi.grade_levels)
      )
    LIMIT p_limit
  ),
  -- Tier 3: สื่อยอดนิยม (view_count)
  t3 AS (
    SELECT mi.id AS item_id, mi.title, mi.thumbnail_url, mi.subject,
           mi.external_url, mi.youtube_id, mi.file_url, mi.item_type,
           (public.subject_keys(mi.subject))[1] AS subject_key,
           NULL::text AS indicator_desc, 'popular'::text AS reason, 3 AS tier
    FROM media_items mi
    WHERE mi.id NOT IN (SELECT item_id FROM t1)
      AND mi.id NOT IN (SELECT item_id FROM t2)
    ORDER BY mi.view_count DESC NULLS LAST, mi.created_at DESC
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
    'item_id', item_id,
    'title', title,
    'thumbnail', thumbnail_url,
    'subject', subject,
    'subject_key', subject_key,
    'external_url', external_url,
    'youtube_id', youtube_id,
    'file_url', file_url,
    'item_type', item_type,
    'reason', reason,
    'indicator_desc', indicator_desc,
    'tier', tier
  ) ORDER BY tier, item_id), '[]'::jsonb)
  INTO v_result
  FROM ranked WHERE rn <= p_limit;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.recommend_media(text, int) TO anon, authenticated;

COMMENT ON FUNCTION public.recommend_media(text, int) IS
  'Recommend teaching media for student code (3-tier: indicator_gap / subject_suggest / popular). Media = tracked_game=false in categories media|videos.';

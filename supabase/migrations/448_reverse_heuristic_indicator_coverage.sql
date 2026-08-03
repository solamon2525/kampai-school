-- 448b: reverse coverage with relaxed grade (exact → any-grade same subject)
-- Run after 448; safe idempotent

CREATE OR REPLACE FUNCTION public.subject_key_from_folder(p_subject text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_subject IS NULL THEN NULL
    WHEN p_subject ILIKE '%คณิต%' THEN 'math'
    WHEN p_subject ILIKE '%ไทย%' THEN 'thai'
    WHEN p_subject ILIKE '%อังกฤษ%' THEN 'english'
    WHEN p_subject ILIKE '%วิทย์%' OR p_subject ILIKE '%วิทยา%' OR p_subject ILIKE '%วิทยาศาสตร์%'
      OR p_subject ILIKE '%เทคโนโลยี%' OR p_subject ILIKE '%tech%' OR p_subject = 'science' THEN 'science'
    WHEN p_subject ILIKE '%สังคม%' THEN 'social'
    WHEN p_subject ILIKE '%สุข%' OR p_subject ILIKE '%พลศึกษา%' OR p_subject ILIKE '%พละ%' THEN 'health'
    WHEN p_subject ILIKE '%ศิลป%' THEN 'arts'
    WHEN p_subject ILIKE '%การงาน%' OR p_subject ILIKE '%อาชีพ%' THEN 'career'
    WHEN p_subject IN ('math','thai','english','science','social','health','arts','career') THEN p_subject
    ELSE NULL
  END;
$$;

-- Pass A: exact grade match (including empty grade_levels = wildcard for that subject)
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM public.curriculum_indicators ci
CROSS JOIN LATERAL (
  SELECT e.id
  FROM public.educational_hub_items e
  WHERE e.is_published = true
    AND public.subject_key_from_folder(e.subject) = ci.subject_key
    AND (
      e.grade_levels IS NULL
      OR cardinality(e.grade_levels) = 0
      OR ci.grade = ANY (e.grade_levels)
    )
  ORDER BY
    CASE
      WHEN e.grade_levels IS NOT NULL AND ci.grade = ANY (e.grade_levels) THEN 0
      ELSE 1
    END,
    COALESCE(e.view_count, 0) DESC,
    e.title ASC
  LIMIT 2
) ehi
WHERE ci.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.indicator_games ig WHERE ig.indicator_id = ci.id)
ON CONFLICT DO NOTHING;

-- Pass B: still uncovered → any published item in same subject_key (even wrong grade)
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM public.curriculum_indicators ci
CROSS JOIN LATERAL (
  SELECT e.id
  FROM public.educational_hub_items e
  WHERE e.is_published = true
    AND public.subject_key_from_folder(e.subject) = ci.subject_key
  ORDER BY COALESCE(e.view_count, 0) DESC, e.title ASC
  LIMIT 1
) ehi
WHERE ci.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.indicator_games ig WHERE ig.indicator_id = ci.id)
ON CONFLICT DO NOTHING;

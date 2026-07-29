-- ============================================================================
-- Migration 447: Heuristic map สื่อ/ใบงาน (และเกมที่ยังว่าง) → ตัวชี้วัด
-- ============================================================================
-- ต่อจาก 270 (tracked_game เท่านั้น) — ขยายให้รายการ published ที่มี subject+grade
-- แต่ยังไม่มีแถวใน indicator_games ได้ mapping อัตโนมัติ (LIMIT 6 ตาม sort_order)
-- Idempotent: เฉพาะรายการที่ยังไม่มี mapping · ON CONFLICT DO NOTHING
-- ครูควรตรวจใน IndicatorCoverageDialog (“เฉพาะช่องว่าง”) หลังรัน
-- ============================================================================

-- เผื่อ DB ที่ยังไม่มี helper จาก 270
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

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT
  ehi.id AS edu_hub_item_id,
  ci.id AS indicator_id
FROM public.educational_hub_items ehi
CROSS JOIN LATERAL (
  SELECT id FROM public.curriculum_indicators
  WHERE is_active = true
    AND subject_key = public.subject_key_from_folder(ehi.subject)
    AND grade = COALESCE((ehi.grade_levels)[1], 'ป.1')
  ORDER BY sort_order
  LIMIT 6
) ci
WHERE ehi.is_published = true
  AND ehi.subject IS NOT NULL
  AND ehi.grade_levels IS NOT NULL
  AND cardinality(ehi.grade_levels) > 0
  AND public.subject_key_from_folder(ehi.subject) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.indicator_games ig WHERE ig.edu_hub_item_id = ehi.id
  )
ON CONFLICT DO NOTHING;

-- สรุป coverage หลัง seed (ดูใน apply output)
SELECT
  COUNT(*) FILTER (WHERE mapped > 0) AS indicators_with_map,
  COUNT(*) AS indicators_total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE mapped > 0) / NULLIF(COUNT(*), 0),
    1
  ) AS coverage_pct
FROM (
  SELECT ci.id, COUNT(ig.edu_hub_item_id) AS mapped
  FROM public.curriculum_indicators ci
  LEFT JOIN public.indicator_games ig ON ig.indicator_id = ci.id
  WHERE ci.is_active = true
  GROUP BY ci.id
) t;

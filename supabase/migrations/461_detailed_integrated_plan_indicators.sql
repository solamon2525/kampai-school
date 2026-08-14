-- 461: แตกแผนบูรณาการจากหัวข้อรวมรายมาตรฐาน เป็นหนึ่งรายการต่อตัวชี้วัด ป.4
ALTER TABLE public.integrated_plan_topics
  ADD COLUMN IF NOT EXISTS source_indicator_id uuid REFERENCES public.curriculum_indicators(id) ON DELETE RESTRICT;

DROP INDEX IF EXISTS public.integrated_plan_topics_seed_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS integrated_plan_topics_owner_indicator_unique_idx
  ON public.integrated_plan_topics(owner_staff_id, source_indicator_id)
  WHERE source_indicator_id IS NOT NULL AND is_custom = false;

CREATE TEMP TABLE integrated_plan_old_seeded ON COMMIT DROP AS
SELECT id, owner_staff_id, subject_key, status, note, keywords
FROM public.integrated_plan_topics
WHERE is_custom = false AND source_indicator_id IS NULL;

CREATE TEMP TABLE integrated_plan_old_children ON COMMIT DROP AS
SELECT old.id AS old_topic_id, old.owner_staff_id, map.indicator_id
FROM integrated_plan_old_seeded old
JOIN public.integrated_plan_topic_indicators map ON map.topic_id = old.id;

INSERT INTO public.integrated_plan_topics (
  owner_staff_id, grade, subject_key, title, essential_concept, keywords,
  status, note, sort_order, is_custom, source_indicator_id
)
SELECT
  old.owner_staff_id,
  'ป.4',
  indicator.subject_key,
  left(indicator.description, 180),
  indicator.description,
  array_remove(array_cat(old.keywords, ARRAY[
    indicator.indicator_code,
    COALESCE(indicator.standard_code, ''),
    COALESCE(indicator.strand_title, '')
  ]), ''),
  old.status,
  old.note,
  indicator.sort_order,
  false,
  indicator.id
FROM integrated_plan_old_children child
JOIN integrated_plan_old_seeded old ON old.id = child.old_topic_id
JOIN public.curriculum_indicators indicator ON indicator.id = child.indicator_id
ON CONFLICT (owner_staff_id, source_indicator_id)
  WHERE source_indicator_id IS NOT NULL AND is_custom = false
DO UPDATE SET
  status = EXCLUDED.status,
  note = COALESCE(EXCLUDED.note, public.integrated_plan_topics.note),
  updated_at = now();

INSERT INTO public.integrated_plan_topic_indicators(topic_id, indicator_id)
SELECT topic.id, topic.source_indicator_id
FROM public.integrated_plan_topics topic
WHERE topic.source_indicator_id IS NOT NULL AND topic.is_custom = false
ON CONFLICT DO NOTHING;

-- หน่วยบูรณาการเดิม: แทนหัวข้อรวมด้วยตัวชี้วัดลูกทั้งหมดก่อนลบหัวข้อเดิม
INSERT INTO public.integrated_plan_unit_topics(unit_id, topic_id)
SELECT DISTINCT unit_link.unit_id, child_topic.id
FROM public.integrated_plan_unit_topics unit_link
JOIN integrated_plan_old_children child ON child.old_topic_id = unit_link.topic_id
JOIN public.integrated_plan_topics child_topic
  ON child_topic.owner_staff_id = child.owner_staff_id
 AND child_topic.source_indicator_id = child.indicator_id
ON CONFLICT DO NOTHING;

DELETE FROM public.integrated_plan_unit_topics unit_link
USING integrated_plan_old_seeded old
WHERE unit_link.topic_id = old.id;

DELETE FROM public.integrated_plan_topics topic
USING integrated_plan_old_seeded old
WHERE topic.id = old.id;

-- ผู้ใช้ใหม่สร้างหัวข้อหนึ่งรายการต่อตัวชี้วัดโดยตรง
CREATE OR REPLACE FUNCTION public.initialize_integrated_plan()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_staff uuid; v_count integer;
BEGIN
  SELECT staff_id INTO v_staff FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF v_staff IS NULL THEN RAISE EXCEPTION 'staff account required'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.integrated_plan_topics
    WHERE owner_staff_id = v_staff AND is_custom = false AND source_indicator_id IS NOT NULL
  ) THEN RETURN 0; END IF;

  WITH inserted AS (
    INSERT INTO public.integrated_plan_topics (
      owner_staff_id, grade, subject_key, title, essential_concept, keywords,
      sort_order, is_custom, source_indicator_id
    )
    SELECT
      v_staff,
      'ป.4',
      indicator.subject_key,
      left(indicator.description, 180),
      indicator.description,
      array_remove(ARRAY[
        indicator.indicator_code,
        COALESCE(indicator.standard_code, ''),
        COALESCE(indicator.strand_title, '')
      ], ''),
      indicator.sort_order,
      false,
      indicator.id
    FROM public.curriculum_indicators indicator
    WHERE indicator.grade = 'ป.4' AND indicator.is_active = true
    ON CONFLICT (owner_staff_id, source_indicator_id)
      WHERE source_indicator_id IS NOT NULL AND is_custom = false
    DO NOTHING
    RETURNING id, source_indicator_id
  )
  INSERT INTO public.integrated_plan_topic_indicators(topic_id, indicator_id)
  SELECT id, source_indicator_id FROM inserted WHERE source_indicator_id IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.initialize_integrated_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_integrated_plan() TO authenticated;

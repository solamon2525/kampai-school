-- ============================================================================
-- Migration 280: Thai Vocab Hub Phase E/F/G — reports, metadata, lazy RPC, mastery
-- ============================================================================

-- ─── Phase F: extended metadata columns ───────────────────────────────────────
ALTER TABLE public.thai_vocab_items
  ADD COLUMN IF NOT EXISTS classifier_for text,
  ADD COLUMN IF NOT EXISTS pair_id text,
  ADD COLUMN IF NOT EXISTS synonym_group text,
  ADD COLUMN IF NOT EXISTS origin_lang text;

-- ─── Phase G: lightweight category list (no words payload) ───────────────────
CREATE OR REPLACE FUNCTION public.get_thai_vocab_categories_only()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'slug', c.slug,
      'title', c.title,
      'icon', c.icon,
      'desc', c.description
    ) ORDER BY c.sort_order, c.slug)
    FROM public.thai_vocab_categories c
  ), '[]'::jsonb);
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_categories_only() TO anon, authenticated;

-- ─── Phase G: lazy load words per category ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_thai_vocab_words(p_category_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'word', i.word,
      'reading', i.reading,
      'meaning', i.meaning,
      'emoji', i.emoji,
      'grade', i.grade,
      'difficulty', i.difficulty,
      'indicator_code', i.indicator_code,
      'classifier_for', i.classifier_for,
      'pair_id', i.pair_id,
      'synonym_group', i.synonym_group,
      'origin_lang', i.origin_lang
    ) ORDER BY i.sort_order, i.word)
    FROM public.thai_vocab_items i
    WHERE i.category_slug = p_category_slug
  ), '[]'::jsonb);
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_words(text) TO anon, authenticated;

-- Update full catalog RPC to include new fields
CREATE OR REPLACE FUNCTION public.get_thai_vocab_catalog()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug', c.slug,
        'title', c.title,
        'icon', c.icon,
        'desc', c.description
      ) ORDER BY c.sort_order, c.slug)
      FROM public.thai_vocab_categories c
    ), '[]'::jsonb),
    'words', COALESCE((
      SELECT jsonb_object_agg(slug, items)
      FROM (
        SELECT i.category_slug AS slug,
          jsonb_agg(jsonb_build_object(
            'word', i.word,
            'reading', i.reading,
            'meaning', i.meaning,
            'emoji', i.emoji,
            'grade', i.grade,
            'difficulty', i.difficulty,
            'indicator_code', i.indicator_code,
            'classifier_for', i.classifier_for,
            'pair_id', i.pair_id,
            'synonym_group', i.synonym_group,
            'origin_lang', i.origin_lang
          ) ORDER BY i.sort_order, i.word) AS items
        FROM public.thai_vocab_items i
        GROUP BY i.category_slug
      ) grouped
    ), '{}'::jsonb)
  );
$$;

-- ─── Phase E: missed-word report (teacher / parent / admin) ──────────────────
CREATE OR REPLACE FUNCTION public.get_thai_vocab_missed_report(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF p_student_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF NOT (
    public.is_admin()
    OR public.is_teacher()
    OR public.is_my_student(p_student_id)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'category_slug', m.category_slug,
      'category_title', COALESCE(c.title, m.category_slug),
      'word', m.word,
      'reading', m.reading,
      'meaning', m.meaning,
      'miss_count', m.miss_count,
      'last_missed_at', m.last_missed_at,
      'indicator_code', vi.indicator_code
    ) ORDER BY m.last_missed_at DESC)
    FROM public.thai_vocab_missed m
    LEFT JOIN public.thai_vocab_categories c ON c.slug = m.category_slug
    LEFT JOIN public.thai_vocab_items vi
      ON vi.category_slug = m.category_slug AND vi.word = m.word
    WHERE m.student_id = p_student_id
  ), '[]'::jsonb);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_missed_report(uuid) TO authenticated;

-- Teacher: top missed words in a class
CREATE OR REPLACE FUNCTION public.get_thai_vocab_class_missed(p_class text, p_limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_class IS NULL OR trim(p_class) = '' THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'student_id', agg.id,
      'student_name', agg.name,
      'class_number', agg.class_number,
      'total_misses', agg.total_misses,
      'unique_words', agg.unique_words,
      'recent', '[]'::jsonb
    ) ORDER BY agg.total_misses DESC)
    FROM (
      SELECT
        s.id,
        s.name,
        s.class_number,
        sum(m.miss_count)::int AS total_misses,
        count(DISTINCT m.word)::int AS unique_words
      FROM public.students s
      JOIN public.thai_vocab_missed m ON m.student_id = s.id
      WHERE s.class = p_class AND COALESCE(s.is_active, true) = true
      GROUP BY s.id, s.name, s.class_number
      ORDER BY sum(m.miss_count) DESC
      LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
    ) agg
  ), '[]'::jsonb);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_class_missed(text, int) TO authenticated;

-- ─── Phase G: record indicator practice events for missed vocab ──────────────
CREATE OR REPLACE FUNCTION public.record_vocab_missed_indicators(
  p_student_id uuid,
  p_indicator_codes jsonb
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_code text;
  v_ind_id uuid;
  v_count int := 0;
BEGIN
  IF p_student_id IS NULL OR p_indicator_codes IS NULL OR jsonb_typeof(p_indicator_codes) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR v_code IN
    SELECT DISTINCT trim(both from t.val)
    FROM jsonb_array_elements_text(p_indicator_codes) AS t(val)
  LOOP
    IF v_code = '' THEN CONTINUE; END IF;
    SELECT id INTO v_ind_id
    FROM public.curriculum_indicators
    WHERE indicator_code = v_code
    LIMIT 1;
    IF v_ind_id IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.student_indicator_events
      (student_id, indicator_id, game_slug, score, passed)
    VALUES (p_student_id, v_ind_id, 'thai-vocab-hub', 0, false);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.record_vocab_missed_indicators(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_vocab_missed_indicators_by_code(
  p_student_code text,
  p_indicator_codes jsonb
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
BEGIN
  v_student := public.resolve_student_by_code(p_student_code);
  IF v_student.id IS NULL THEN RETURN 0; END IF;
  RETURN public.record_vocab_missed_indicators(v_student.id, p_indicator_codes);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.record_vocab_missed_indicators_by_code(text, jsonb) TO anon, authenticated;

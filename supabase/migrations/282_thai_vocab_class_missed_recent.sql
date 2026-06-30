-- ============================================================================
-- Migration 282: get_thai_vocab_class_missed — populate recent missed words per student
-- ============================================================================

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
    SELECT jsonb_agg(row_data ORDER BY (row_data->>'total_misses')::int DESC)
    FROM (
      SELECT jsonb_build_object(
        'student_id', s.id,
        'student_name', s.name,
        'class_number', s.class_number,
        'total_misses', sum(m.miss_count)::int,
        'unique_words', count(DISTINCT m.word)::int,
        'recent', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'word', r.word,
            'reading', r.reading,
            'meaning', r.meaning,
            'category_slug', r.category_slug,
            'miss_count', r.miss_count
          ) ORDER BY r.last_missed_at DESC), '[]'::jsonb)
          FROM (
            SELECT
              m2.word,
              m2.reading,
              m2.meaning,
              m2.category_slug,
              m2.miss_count,
              m2.last_missed_at
            FROM public.thai_vocab_missed m2
            WHERE m2.student_id = s.id
            ORDER BY m2.last_missed_at DESC
            LIMIT 5
          ) r
        )
      ) AS row_data
      FROM public.students s
      JOIN public.thai_vocab_missed m ON m.student_id = s.id
      WHERE s.class = p_class AND COALESCE(s.is_active, true) = true
      GROUP BY s.id, s.name, s.class_number
      ORDER BY sum(m.miss_count) DESC
      LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
    ) sub
  ), '[]'::jsonb);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_thai_vocab_class_missed(text, int) TO authenticated;

-- ============================================================================
-- Migration 278: Thai Vocab Hub — DB catalog + missed-word queue (Phase D)
-- ============================================================================

-- ─── Prerequisites (069/083/269 — idempotent; remote อาจยังไม่มี helper เหล่านี้) ─
CREATE OR REPLACE FUNCTION public.is_my_student(student_uuid UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND student_id = student_uuid
  )
  OR EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.user_id = auth.uid() AND psl.student_id = student_uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_student(UUID) TO anon, authenticated;

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

CREATE TABLE IF NOT EXISTS public.thai_vocab_categories (
  slug        text PRIMARY KEY,
  title       text NOT NULL,
  icon        text,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.thai_vocab_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug   text NOT NULL REFERENCES public.thai_vocab_categories(slug) ON DELETE CASCADE,
  word            text NOT NULL,
  reading         text NOT NULL,
  meaning         text NOT NULL,
  emoji           text,
  grade           text CHECK (grade IS NULL OR grade IN ('ป.4', 'ป.5', 'ป.6')),
  difficulty      smallint CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 3),
  indicator_code  text,
  tags            text[] NOT NULL DEFAULT '{}',
  note            text,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_slug, word, reading)
);

CREATE INDEX IF NOT EXISTS idx_thai_vocab_items_category
  ON public.thai_vocab_items (category_slug, sort_order);

CREATE INDEX IF NOT EXISTS idx_thai_vocab_items_grade
  ON public.thai_vocab_items (grade);

CREATE INDEX IF NOT EXISTS idx_thai_vocab_items_indicator
  ON public.thai_vocab_items (indicator_code)
  WHERE indicator_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.thai_vocab_missed (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_slug   text NOT NULL,
  word            text NOT NULL,
  reading         text,
  meaning         text,
  miss_count      int NOT NULL DEFAULT 1 CHECK (miss_count > 0),
  last_missed_at  timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, category_slug, word)
);

CREATE INDEX IF NOT EXISTS idx_thai_vocab_missed_student
  ON public.thai_vocab_missed (student_id, category_slug);

ALTER TABLE public.thai_vocab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_vocab_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thai_vocab_missed     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thai_vocab_cat_read" ON public.thai_vocab_categories;
CREATE POLICY "thai_vocab_cat_read" ON public.thai_vocab_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "thai_vocab_cat_admin" ON public.thai_vocab_categories;
CREATE POLICY "thai_vocab_cat_admin" ON public.thai_vocab_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "thai_vocab_items_read" ON public.thai_vocab_items;
CREATE POLICY "thai_vocab_items_read" ON public.thai_vocab_items
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "thai_vocab_items_admin" ON public.thai_vocab_items;
CREATE POLICY "thai_vocab_items_admin" ON public.thai_vocab_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "thai_vocab_missed_read" ON public.thai_vocab_missed;
CREATE POLICY "thai_vocab_missed_read" ON public.thai_vocab_missed
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR public.is_my_student(student_id)
  );

DROP POLICY IF EXISTS "thai_vocab_missed_admin" ON public.thai_vocab_missed;
CREATE POLICY "thai_vocab_missed_admin" ON public.thai_vocab_missed
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
            'indicator_code', i.indicator_code
          ) ORDER BY i.sort_order, i.word) AS items
        FROM public.thai_vocab_items i
        GROUP BY i.category_slug
      ) grouped
    ), '{}'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_catalog() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_thai_vocab_missed(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
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
      'word', m.word,
      'reading', m.reading,
      'meaning', m.meaning,
      'miss_count', m.miss_count,
      'last_missed_at', m.last_missed_at
    ) ORDER BY m.last_missed_at DESC)
    FROM public.thai_vocab_missed m
    WHERE m.student_id = p_student_id
  ), '[]'::jsonb);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_missed(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_thai_vocab_missed(
  p_student_id uuid,
  p_category_slug text,
  p_words jsonb
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_row jsonb;
  v_count int := 0;
BEGIN
  IF p_student_id IS NULL OR p_category_slug IS NULL OR p_category_slug = '' THEN
    RETURN 0;
  END IF;

  IF NOT (
    public.is_admin()
    OR public.is_my_student(p_student_id)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_words IS NULL OR jsonb_typeof(p_words) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_words)
  LOOP
    IF COALESCE(v_row->>'word', '') = '' THEN CONTINUE; END IF;
    INSERT INTO public.thai_vocab_missed (student_id, category_slug, word, reading, meaning, miss_count, last_missed_at)
    VALUES (
      p_student_id,
      p_category_slug,
      v_row->>'word',
      v_row->>'reading',
      v_row->>'meaning',
      1,
      now()
    )
    ON CONFLICT (student_id, category_slug, word) DO UPDATE SET
      reading = EXCLUDED.reading,
      meaning = COALESCE(EXCLUDED.meaning, thai_vocab_missed.meaning),
      miss_count = thai_vocab_missed.miss_count + 1,
      last_missed_at = now();
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.upsert_thai_vocab_missed(uuid, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_thai_vocab_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'slug', c.slug,
    'title', c.title,
    'item_count', (SELECT COUNT(*)::int FROM public.thai_vocab_items i WHERE i.category_slug = c.slug),
    'with_indicator', (SELECT COUNT(*)::int FROM public.thai_vocab_items i WHERE i.category_slug = c.slug AND i.indicator_code IS NOT NULL)
  ) ORDER BY c.sort_order), '[]'::jsonb)
  FROM public.thai_vocab_categories c;
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_stats() TO authenticated;

-- ─── RPC by student_code (anon /play — ไม่ต้อง login นักเรียน) ───────────────
CREATE OR REPLACE FUNCTION public.get_thai_vocab_missed_by_code(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
BEGIN
  v_student := public.resolve_student_by_code(p_student_code);
  IF v_student.id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'category_slug', m.category_slug,
      'word', m.word,
      'reading', m.reading,
      'meaning', m.meaning,
      'miss_count', m.miss_count,
      'last_missed_at', m.last_missed_at
    ) ORDER BY m.last_missed_at DESC)
    FROM public.thai_vocab_missed m
    WHERE m.student_id = v_student.id
  ), '[]'::jsonb);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_missed_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_thai_vocab_missed_by_code(
  p_student_code text,
  p_category_slug text,
  p_words jsonb
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student public.students%ROWTYPE;
  v_row jsonb;
  v_count int := 0;
BEGIN
  v_student := public.resolve_student_by_code(p_student_code);
  IF v_student.id IS NULL OR p_category_slug IS NULL OR p_category_slug = '' THEN
    RETURN 0;
  END IF;
  IF p_words IS NULL OR jsonb_typeof(p_words) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_words)
  LOOP
    IF COALESCE(v_row->>'word', '') = '' THEN CONTINUE; END IF;
    INSERT INTO public.thai_vocab_missed (student_id, category_slug, word, reading, meaning, miss_count, last_missed_at)
    VALUES (
      v_student.id,
      p_category_slug,
      v_row->>'word',
      v_row->>'reading',
      v_row->>'meaning',
      1,
      now()
    )
    ON CONFLICT (student_id, category_slug, word) DO UPDATE SET
      reading = EXCLUDED.reading,
      meaning = COALESCE(EXCLUDED.meaning, thai_vocab_missed.meaning),
      miss_count = thai_vocab_missed.miss_count + 1,
      last_missed_at = now();
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.upsert_thai_vocab_missed_by_code(text, text, jsonb) TO anon, authenticated;

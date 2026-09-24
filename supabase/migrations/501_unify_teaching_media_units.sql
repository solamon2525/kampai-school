-- Unify lesson packs into their primary media cards, repair catalog integrity,
-- and start an auditable 60-day usage window. No student data is collected.

-- The legacy lesson-pack category becomes a relationship, not a second catalog.
UPDATE public.educational_hub_categories
SET is_active = false,
    description = 'ความสัมพันธ์สื่อ ใบงาน และเกมภายในการ์ดสื่อหลัก',
    updated_at = now()
WHERE category_key = 'lesson-packs';

-- Keep the unit's one primary indicator distinguishable from its supporting indicators.
ALTER TABLE public.indicator_games
  ADD COLUMN IF NOT EXISTS mapping_role text NOT NULL DEFAULT 'supporting'
    CHECK (mapping_role IN ('primary', 'supporting')),
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS indicator_games_item_order_idx
  ON public.indicator_games (edu_hub_item_id, mapping_role, sort_order);

-- Repair the three known incomplete packs using canonical repository routes.
INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
SELECT pack.id, item.id, 'media', 10
FROM public.lesson_packs pack
JOIN LATERAL (
  SELECT id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/fraction-pieces-media.html'
  ORDER BY library_pinned DESC, view_count DESC, updated_at DESC
  LIMIT 1
) item ON true
WHERE pack.pack_key = 'legacy-fraction-pieces'
ON CONFLICT (pack_id, edu_hub_item_id) DO UPDATE SET role = 'media', sort_order = 10;

INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
SELECT pack.id, item.id, 'media', 10
FROM public.lesson_packs pack
JOIN LATERAL (
  SELECT id
  FROM public.educational_hub_items
  WHERE external_url = '/games/science/water-cycle-media.html'
  ORDER BY library_pinned DESC, view_count DESC, updated_at DESC
  LIMIT 1
) item ON true
WHERE pack.pack_key = 'legacy-water-cycle'
ON CONFLICT (pack_id, edu_hub_item_id) DO UPDATE SET role = 'media', sort_order = 10;

INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
SELECT pack.id, item.id, 'worksheet', 20
FROM public.lesson_packs pack
JOIN LATERAL (
  SELECT id
  FROM public.educational_hub_items
  WHERE external_url = '/games/science/digestive-worksheet.html'
  ORDER BY library_pinned DESC, view_count DESC, updated_at DESC
  LIMIT 1
) item ON true
WHERE pack.pack_key = 'legacy-digestive'
ON CONFLICT (pack_id, edu_hub_item_id) DO UPDATE SET role = 'worksheet', sort_order = 20;

-- Build an explicit duplicate map first so every reference is transferred
-- before a redundant catalog row is deleted.
CREATE TEMP TABLE _ehi_merge_map (
  duplicate_id uuid PRIMARY KEY,
  canonical_id uuid NOT NULL
) ON COMMIT DROP;

INSERT INTO _ehi_merge_map (duplicate_id, canonical_id)
WITH ranked AS (
  SELECT
    item.id,
    first_value(item.id) OVER (
      PARTITION BY category.category_key, item.external_url
      ORDER BY
        item.library_pinned DESC,
        EXISTS (SELECT 1 FROM public.lesson_pack_items link WHERE link.edu_hub_item_id = item.id) DESC,
        ((item.thumbnail_url IS NOT NULL)::int + (item.description IS NOT NULL)::int +
         (cardinality(item.tags) > 0)::int + (cardinality(item.grade_levels) > 0)::int) DESC,
        item.view_count DESC,
        item.updated_at DESC,
        item.id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY category.category_key, item.external_url
      ORDER BY
        item.library_pinned DESC,
        EXISTS (SELECT 1 FROM public.lesson_pack_items link WHERE link.edu_hub_item_id = item.id) DESC,
        ((item.thumbnail_url IS NOT NULL)::int + (item.description IS NOT NULL)::int +
         (cardinality(item.tags) > 0)::int + (cardinality(item.grade_levels) > 0)::int) DESC,
        item.view_count DESC,
        item.updated_at DESC,
        item.id
    ) AS rank_no
  FROM public.educational_hub_items item
  JOIN public.educational_hub_categories category ON category.id = item.category_id
  WHERE item.external_url IS NOT NULL
    AND category.category_key IN ('media', 'worksheets')
)
SELECT id, canonical_id
FROM ranked
WHERE rank_no > 1;

-- Fold the one broken route into the working Math Word Problem Hub.
INSERT INTO _ehi_merge_map (duplicate_id, canonical_id)
SELECT broken.id, canonical.id
FROM LATERAL (
  SELECT id FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-word-problem-media.html'
  ORDER BY updated_at DESC LIMIT 1
) broken
CROSS JOIN LATERAL (
  SELECT id FROM public.educational_hub_items
  WHERE external_url = '/games/math/math-word-problem-hub/index.html'
  ORDER BY library_pinned DESC, view_count DESC, updated_at DESC LIMIT 1
) canonical
ON CONFLICT (duplicate_id) DO UPDATE SET canonical_id = EXCLUDED.canonical_id;

DO $$
DECLARE
  merge_row record;
  duplicate_doc public.game_docs%ROWTYPE;
BEGIN
  FOR merge_row IN SELECT duplicate_id, canonical_id FROM _ehi_merge_map LOOP
    UPDATE public.educational_hub_items canonical
    SET
      description = COALESCE(canonical.description, duplicate.description),
      thumbnail_url = COALESCE(canonical.thumbnail_url, duplicate.thumbnail_url),
      tags = ARRAY(
        SELECT DISTINCT value
        FROM unnest(COALESCE(canonical.tags, '{}') || COALESCE(duplicate.tags, '{}')) value
        ORDER BY value
      ),
      grade_levels = ARRAY(
        SELECT DISTINCT value
        FROM unnest(COALESCE(canonical.grade_levels, '{}') || COALESCE(duplicate.grade_levels, '{}')) value
        ORDER BY value
      ),
      subject = COALESCE(canonical.subject, duplicate.subject),
      view_count = canonical.view_count + duplicate.view_count,
      download_count = canonical.download_count + duplicate.download_count,
      library_pinned = canonical.library_pinned OR duplicate.library_pinned,
      library_pin_order = CASE
        WHEN canonical.library_pinned AND duplicate.library_pinned
          THEN LEAST(canonical.library_pin_order, duplicate.library_pin_order)
        WHEN duplicate.library_pinned THEN duplicate.library_pin_order
        ELSE canonical.library_pin_order
      END,
      homepage_featured = canonical.homepage_featured OR duplicate.homepage_featured,
      game_slug = COALESCE(canonical.game_slug, duplicate.game_slug),
      tracked_game = canonical.tracked_game OR duplicate.tracked_game,
      build_version = COALESCE(canonical.build_version, duplicate.build_version),
      build_updated_at = GREATEST(canonical.build_updated_at, duplicate.build_updated_at),
      updated_at = now()
    FROM public.educational_hub_items duplicate
    WHERE canonical.id = merge_row.canonical_id
      AND duplicate.id = merge_row.duplicate_id;

    INSERT INTO public.indicator_games (
      indicator_id, edu_hub_item_id, mapping_role, sort_order
    )
    SELECT indicator_id, merge_row.canonical_id, mapping_role, sort_order
    FROM public.indicator_games
    WHERE edu_hub_item_id = merge_row.duplicate_id
    ON CONFLICT (indicator_id, edu_hub_item_id) DO UPDATE SET
      mapping_role = CASE
        WHEN public.indicator_games.mapping_role = 'primary' OR EXCLUDED.mapping_role = 'primary'
          THEN 'primary'
        ELSE 'supporting'
      END,
      sort_order = LEAST(public.indicator_games.sort_order, EXCLUDED.sort_order);

    INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
    SELECT pack_id, merge_row.canonical_id, role, sort_order
    FROM public.lesson_pack_items
    WHERE edu_hub_item_id = merge_row.duplicate_id
    ON CONFLICT (pack_id, edu_hub_item_id) DO UPDATE
      SET sort_order = LEAST(public.lesson_pack_items.sort_order, EXCLUDED.sort_order);

    UPDATE public.game_sessions
    SET edu_hub_item_id = merge_row.canonical_id
    WHERE edu_hub_item_id = merge_row.duplicate_id;

    UPDATE public.game_research_studies
    SET edu_hub_item_id = merge_row.canonical_id
    WHERE edu_hub_item_id = merge_row.duplicate_id;

    SELECT * INTO duplicate_doc
    FROM public.game_docs
    WHERE item_id = merge_row.duplicate_id;

    IF FOUND THEN
      IF EXISTS (SELECT 1 FROM public.game_docs WHERE item_id = merge_row.canonical_id) THEN
        UPDATE public.game_docs canonical_doc
        SET
          game_format = COALESCE(canonical_doc.game_format, duplicate_doc.game_format),
          features = ARRAY(
            SELECT DISTINCT value
            FROM unnest(COALESCE(canonical_doc.features, '{}') || COALESCE(duplicate_doc.features, '{}')) value
            ORDER BY value
          ),
          version = COALESCE(canonical_doc.version, duplicate_doc.version),
          notes = COALESCE(canonical_doc.notes, duplicate_doc.notes),
          updated_at = GREATEST(canonical_doc.updated_at, duplicate_doc.updated_at)
        WHERE canonical_doc.item_id = merge_row.canonical_id;
        DELETE FROM public.game_docs WHERE item_id = merge_row.duplicate_id;
      ELSE
        UPDATE public.game_docs
        SET item_id = merge_row.canonical_id
        WHERE item_id = merge_row.duplicate_id;
      END IF;
    END IF;

    UPDATE public.educational_hub_profiles profile
    SET lesson_favorites = COALESCE((
      SELECT jsonb_agg(to_jsonb(value) ORDER BY value)
      FROM (
        SELECT DISTINCT CASE
          WHEN favorite = merge_row.duplicate_id::text THEN merge_row.canonical_id::text
          ELSE favorite
        END AS value
        FROM jsonb_array_elements_text(profile.lesson_favorites) favorite
      ) merged_favorites
    ), '[]'::jsonb)
    WHERE profile.lesson_favorites ? merge_row.duplicate_id::text;

    DELETE FROM public.educational_hub_items WHERE id = merge_row.duplicate_id;
  END LOOP;
END $$;

-- Daily aggregate: no student id, no browsing history, only per-item counters.
CREATE TABLE IF NOT EXISTS public.educational_hub_usage_daily (
  item_id uuid NOT NULL REFERENCES public.educational_hub_items(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  owner_staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  owner_open_count integer NOT NULL DEFAULT 0 CHECK (owner_open_count >= 0),
  public_open_count integer NOT NULL DEFAULT 0 CHECK (public_open_count >= 0),
  last_opened_at timestamptz,
  PRIMARY KEY (item_id, usage_date)
);

CREATE INDEX IF NOT EXISTS educational_hub_usage_daily_owner_date_idx
  ON public.educational_hub_usage_daily (owner_staff_id, usage_date DESC);

ALTER TABLE public.educational_hub_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS educational_hub_usage_owner_read ON public.educational_hub_usage_daily;
CREATE POLICY educational_hub_usage_owner_read ON public.educational_hub_usage_daily
  FOR SELECT USING (
    public.is_admin()
    OR owner_staff_id IN (
      SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

REVOKE ALL ON public.educational_hub_usage_daily FROM anon;
GRANT SELECT ON public.educational_hub_usage_daily TO authenticated;

INSERT INTO public.educational_hub_usage_daily (item_id, usage_date, owner_staff_id)
SELECT id, (now() AT TIME ZONE 'Asia/Bangkok')::date, owner_staff_id
FROM public.educational_hub_items
WHERE owner_staff_id IS NOT NULL
ON CONFLICT (item_id, usage_date) DO NOTHING;

CREATE OR REPLACE FUNCTION public.initialize_ehi_usage_baseline()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.educational_hub_usage_daily (item_id, usage_date, owner_staff_id)
  VALUES (NEW.id, (now() AT TIME ZONE 'Asia/Bangkok')::date, NEW.owner_staff_id)
  ON CONFLICT (item_id, usage_date) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_initialize_ehi_usage_baseline ON public.educational_hub_items;
CREATE TRIGGER trg_initialize_ehi_usage_baseline
  AFTER INSERT ON public.educational_hub_items
  FOR EACH ROW EXECUTE FUNCTION public.initialize_ehi_usage_baseline();

CREATE OR REPLACE FUNCTION public.increment_ehi_view(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  item_owner uuid;
  viewer_is_owner boolean;
BEGIN
  UPDATE public.educational_hub_items
  SET view_count = view_count + 1
  WHERE id = p_id
  RETURNING owner_staff_id INTO item_owner;

  IF item_owner IS NULL THEN RETURN; END IF;

  viewer_is_owner := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND staff_id = item_owner
  );

  INSERT INTO public.educational_hub_usage_daily (
    item_id, usage_date, owner_staff_id, owner_open_count, public_open_count, last_opened_at
  ) VALUES (
    p_id,
    (now() AT TIME ZONE 'Asia/Bangkok')::date,
    item_owner,
    CASE WHEN viewer_is_owner THEN 1 ELSE 0 END,
    CASE WHEN viewer_is_owner THEN 0 ELSE 1 END,
    now()
  )
  ON CONFLICT (item_id, usage_date) DO UPDATE SET
    owner_open_count = public.educational_hub_usage_daily.owner_open_count + EXCLUDED.owner_open_count,
    public_open_count = public.educational_hub_usage_daily.public_open_count + EXCLUDED.public_open_count,
    last_opened_at = EXCLUDED.last_opened_at;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ehi_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ehi_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_ehi_usage_60d(p_owner_staff_id uuid)
RETURNS TABLE (
  item_id uuid,
  title text,
  subject text,
  library_pinned boolean,
  observation_started_on date,
  owner_open_count bigint,
  public_open_count bigint,
  total_open_count bigint,
  last_opened_at timestamptz,
  review_candidate boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND staff_id = p_owner_staff_id
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT
    item.id,
    item.title,
    item.subject,
    item.library_pinned,
    COALESCE(MIN(usage.usage_date), (now() AT TIME ZONE 'Asia/Bangkok')::date),
    COALESCE(SUM(usage.owner_open_count) FILTER (
      WHERE usage.usage_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
    ), 0)::bigint,
    COALESCE(SUM(usage.public_open_count) FILTER (
      WHERE usage.usage_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
    ), 0)::bigint,
    COALESCE(SUM(usage.owner_open_count + usage.public_open_count) FILTER (
      WHERE usage.usage_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
    ), 0)::bigint,
    MAX(usage.last_opened_at) FILTER (
      WHERE usage.usage_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
    ),
    (
      NOT item.library_pinned
      AND MIN(usage.usage_date) <= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
      AND COALESCE(SUM(usage.owner_open_count + usage.public_open_count) FILTER (
        WHERE usage.usage_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 59
      ), 0) <= 2
    )
  FROM public.educational_hub_items item
  LEFT JOIN public.educational_hub_usage_daily usage ON usage.item_id = item.id
  WHERE item.owner_staff_id = p_owner_staff_id
  GROUP BY item.id, item.title, item.subject, item.library_pinned
  ORDER BY item.library_pinned DESC, 8 DESC, item.title;
END;
$$;

REVOKE ALL ON FUNCTION public.list_ehi_usage_60d(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_ehi_usage_60d(uuid) TO authenticated;

-- One atomic editor endpoint for media metadata, worksheet/game links, and publication state.
CREATE OR REPLACE FUNCTION public.save_teaching_media_unit(
  p_pack_id uuid,
  p_media_item_id uuid,
  p_owner_staff_id uuid,
  p_title text,
  p_description text,
  p_subject text,
  p_grade_levels text[],
  p_thumbnail_url text,
  p_worksheet_item_ids uuid[],
  p_game_item_ids uuid[],
  p_is_published boolean
)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  unit_id uuid;
BEGIN
  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND staff_id = p_owner_staff_id
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items item
    JOIN public.educational_hub_categories category ON category.id = item.category_id
    WHERE item.id = p_media_item_id
      AND item.owner_staff_id = p_owner_staff_id
      AND category.category_key = 'media'
  ) THEN
    RAISE EXCEPTION 'primary media is invalid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_worksheet_item_ids, '{}')) resource_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items item
      JOIN public.educational_hub_categories category ON category.id = item.category_id
      WHERE item.id = resource_id
        AND item.owner_staff_id = p_owner_staff_id
        AND category.category_key = 'worksheets'
    )
  ) THEN
    RAISE EXCEPTION 'worksheet resource is invalid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_game_item_ids, '{}')) resource_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items item
      JOIN public.educational_hub_categories category ON category.id = item.category_id
      WHERE item.id = resource_id
        AND item.owner_staff_id = p_owner_staff_id
        AND category.category_key = 'games'
    )
  ) THEN
    RAISE EXCEPTION 'game resource is invalid';
  END IF;

  UPDATE public.educational_hub_items
  SET title = trim(p_title),
      description = NULLIF(trim(p_description), ''),
      subject = p_subject,
      grade_levels = COALESCE(p_grade_levels, '{}'),
      thumbnail_url = NULLIF(trim(p_thumbnail_url), ''),
      updated_at = now()
  WHERE id = p_media_item_id;

  SELECT pack.id INTO unit_id
  FROM public.lesson_packs pack
  WHERE pack.id = p_pack_id AND pack.owner_staff_id = p_owner_staff_id;

  IF unit_id IS NULL THEN
    SELECT link.pack_id INTO unit_id
    FROM public.lesson_pack_items link
    JOIN public.lesson_packs pack ON pack.id = link.pack_id
    WHERE link.edu_hub_item_id = p_media_item_id
      AND link.role = 'media'
      AND pack.owner_staff_id = p_owner_staff_id
    ORDER BY pack.updated_at DESC
    LIMIT 1;
  END IF;

  IF unit_id IS NULL THEN
    INSERT INTO public.lesson_packs (
      pack_key, title, description, subject, grade_levels, thumbnail_url,
      sort_order, is_published, owner_staff_id, phase_tag
    ) VALUES (
      'teaching-unit-' || p_media_item_id::text,
      trim(p_title), NULLIF(trim(p_description), ''), p_subject,
      COALESCE(p_grade_levels, '{}'), NULLIF(trim(p_thumbnail_url), ''),
      0, p_is_published, p_owner_staff_id, 'unified-media-unit'
    )
    RETURNING id INTO unit_id;
  ELSE
    UPDATE public.lesson_packs
    SET title = trim(p_title),
        description = NULLIF(trim(p_description), ''),
        subject = p_subject,
        grade_levels = COALESCE(p_grade_levels, '{}'),
        thumbnail_url = NULLIF(trim(p_thumbnail_url), ''),
        is_published = p_is_published,
        phase_tag = 'unified-media-unit',
        updated_at = now()
    WHERE id = unit_id;
  END IF;

  DELETE FROM public.lesson_pack_items WHERE pack_id = unit_id;
  INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
  VALUES (unit_id, p_media_item_id, 'media', 10);

  INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
  SELECT unit_id, resource_id, 'worksheet', 19 + ordinal::integer
  FROM unnest(COALESCE(p_worksheet_item_ids, '{}')) WITH ORDINALITY resource(resource_id, ordinal);

  INSERT INTO public.lesson_pack_items (pack_id, edu_hub_item_id, role, sort_order)
  SELECT unit_id, resource_id, 'game', 99 + ordinal::integer
  FROM unnest(COALESCE(p_game_item_ids, '{}')) WITH ORDINALITY resource(resource_id, ordinal);

  RETURN unit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_teaching_media_unit(
  uuid, uuid, uuid, text, text, text, text[], text, uuid, uuid, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_teaching_media_unit(
  uuid, uuid, uuid, text, text, text, text[], text, uuid, uuid, boolean
) TO authenticated;

COMMENT ON TABLE public.educational_hub_usage_daily IS
  'Per-item daily aggregate for 60-day teaching-media review; contains no student identity.';

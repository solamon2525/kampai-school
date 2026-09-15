-- Migration 513: Clone English Vocab Hub to Kru Maliwan (acb1c6dc-b19c-438b-8b93-502225af8635)
DO $$
DECLARE
  v_source_item public.educational_hub_items%ROWTYPE;
  v_new_item_id UUID;
  v_target_staff_id UUID := 'acb1c6dc-b19c-438b-8b93-502225af8635';
BEGIN
  -- 1. Find source item
  SELECT * INTO v_source_item
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/vocab-hub.html'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_source_item.id IS NULL THEN
    RAISE EXCEPTION 'Source item vocab-hub not found';
  END IF;

  -- 2. Insert cloned item if not exists
  SELECT id INTO v_new_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/vocab-hub.html'
    AND owner_staff_id = v_target_staff_id;

  IF v_new_item_id IS NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description,
      thumbnail_url, external_url, tags, grade_levels, subject,
      sort_order, is_published, game_slug, tracked_game,
      game_play_style, build_version
    ) VALUES (
      v_target_staff_id, v_source_item.category_id, v_source_item.item_type, v_source_item.title, v_source_item.description,
      v_source_item.thumbnail_url, v_source_item.external_url, v_source_item.tags, v_source_item.grade_levels, v_source_item.subject,
      v_source_item.sort_order, true, v_source_item.game_slug, v_source_item.tracked_game,
      v_source_item.game_play_style, v_source_item.build_version
    )
    RETURNING id INTO v_new_item_id;
  END IF;

  -- 3. Clone or update game_docs
  INSERT INTO public.game_docs (
    item_id, owner_staff_id, game_format, features, version, notes
  )
  SELECT
    v_new_item_id,
    v_target_staff_id,
    gd.game_format,
    gd.features,
    gd.version,
    gd.notes
  FROM public.game_docs gd
  WHERE gd.item_id = v_source_item.id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

END $$;

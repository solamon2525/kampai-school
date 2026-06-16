-- ============================================================================
-- Migration 200: Move "Thai Vocab Hub" (thai-vocab-hub) to Teaching Media (media)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Idempotent: re-run keeps settings updated
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/thai/thai-vocab-hub/index.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve media (คลังสื่อการสอน) category
  SELECT id INTO v_cat_media
  FROM public.educational_hub_categories WHERE category_key = 'media';
  
  IF v_cat_media IS NULL THEN
    RAISE EXCEPTION 'category "media" not found';
  END IF;

  -- 3. Resolve the item ID
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  IF v_item_id IS NOT NULL THEN
    -- 4. Move to media category and disable game tracking
    UPDATE public.educational_hub_items
    SET category_id = v_cat_media,
        tracked_game = false,
        game_slug = null,
        title = '📚 คลังคำศัพท์ภาษาไทย ป.4 (Thai Vocab Hub)',
        updated_at = now()
    WHERE id = v_item_id;

    -- 5. Delete from game_docs since it is no longer a game
    DELETE FROM public.game_docs
    WHERE item_id = v_item_id;
  END IF;

END $$;

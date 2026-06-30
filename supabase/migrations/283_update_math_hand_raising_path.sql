-- Migration 283: Update Math Hand Raising Game path and cover
-- Path: public/games/math/math-hand-raising/index.html
-- Cover: public/games/math/math-hand-raising/cover.png

DO $$
DECLARE
  v_old_url   TEXT := '/games/math/math-hand-raising.html';
  v_new_url   TEXT := '/games/math/math-hand-raising/index.html';
  v_new_cover TEXT := '/games/math/math-hand-raising/cover.png';
  v_item_id   UUID;
BEGIN
  -- 1. Find the existing item
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = v_old_url;

  IF v_item_id IS NOT NULL THEN
    -- 2. Update external_url and thumbnail_url
    UPDATE public.educational_hub_items
    SET external_url = v_new_url,
        thumbnail_url = v_new_cover,
        updated_at = now()
    WHERE id = v_item_id;

    RAISE NOTICE 'Updated math-hand-raising game url to %', v_new_url;
  ELSE
    RAISE NOTICE 'math-hand-raising game item not found under old url %', v_old_url;
  END IF;
END $$;

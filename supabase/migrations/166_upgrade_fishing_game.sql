-- ============================================================================
-- Migration 166: Upgrade "ตกปลามาตราตัวสะกด" (fishing) to folder-based structure
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/thai/fishing/index.html
-- Cover: public/games/thai/fishing/cover.svg
-- Idempotent: re-run updates successfully
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_old_url   TEXT := '/games/thai/fishing.html';
  v_new_url   TEXT := '/games/thai/fishing/index.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve games category
  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found';
  END IF;

  -- 3. Seed/Update item
  -- If it already exists with the old URL, we'll update it.
  -- If not, we'll insert a new one.
  IF EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND (external_url = v_old_url OR external_url = v_new_url)
  ) THEN
    UPDATE public.educational_hub_items
    SET external_url = v_new_url,
        game_slug = 'fishing',
        tracked_game = true,
        is_published = true,
        thumbnail_url = '/games/thai/fishing/cover.svg',
        updated_at = now()
    WHERE owner_staff_id = v_staff_id AND (external_url = v_old_url OR external_url = v_new_url);
  ELSE
    INSERT INTO public.educational_hub_items
      (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order, game_slug, tracked_game, is_published, thumbnail_url)
    VALUES
      (v_staff_id, v_cat_games, 'link', 'ตกปลามาตราตัวสะกด', v_new_url, 'ภาษาไทย', 40, 'fishing', true, true, '/games/thai/fishing/cover.svg');
  END IF;
END $$;

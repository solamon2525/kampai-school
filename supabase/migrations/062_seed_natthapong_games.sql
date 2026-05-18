-- =============================================================================
-- Migration 062: Seed legacy HTML games → educational-hub
-- =============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู (auto-resolved by name)
-- Source: D:\เก่า\kampai-school-app\games\* → public/games/**
-- Items: 17 standalone HTML games as item_type='link' pointing to /games/...
-- Idempotent: re-running keeps count = 17 (NOT EXISTS guard on external_url)
-- =============================================================================

DO $$
DECLARE
  v_staff_id   UUID;
  v_cat_games  UUID;
BEGIN
  -- ─── 1. Resolve staff_id ───────────────────────────────────────────────────
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%'
    AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found — seed staff first';
  END IF;

  -- ─── 2. Resolve games category ─────────────────────────────────────────────
  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories
  WHERE category_key = 'games';

  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found — migration 061 must run first';
  END IF;

  -- ─── 3. Ensure profile ─────────────────────────────────────────────────────
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- ─── 4. Seed 17 game items (idempotent via NOT EXISTS) ─────────────────────
  -- คณิตศาสตร์ (3)
  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'เกม 24 แต้ม', '/games/math/24.html', 'คณิตศาสตร์', 10
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/24.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Math Jumper', '/games/math/math-jumper.html', 'คณิตศาสตร์', 20
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/math-jumper.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Pizza คณิต', '/games/math/pizza.html', 'คณิตศาสตร์', 30
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/pizza.html');

  -- เทคโนโลยี (2)
  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Blockly Games', '/games/tech/blockly.html', 'เทคโนโลยี', 10
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/tech/blockly.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ฝึกพิมพ์ดีด', '/games/tech/typing.html', 'เทคโนโลยี', 20
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/tech/typing.html');

  -- ภาษาไทย (12)
  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Attack on Noun (v1)', '/games/thai/attack-noun.html', 'ภาษาไทย', 10
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attack-noun.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Attack on Noun (v2)', '/games/thai/attack-on-noun.html', 'ภาษาไทย', 20
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attack-on-noun.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Attack on Noun (v3)', '/games/thai/attnoun.html', 'ภาษาไทย', 30
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attnoun.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ตกปลามาตราตัวสะกด', '/games/thai/fishing.html', 'ภาษาไทย', 40
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/fishing.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Flappy Bird คำไทย', '/games/thai/flappy-bird.html', 'ภาษาไทย', 50
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/flappy-bird.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Kingdom คำไทย', '/games/thai/kingdom.html', 'ภาษาไทย', 60
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/kingdom.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Pizza Master Chef', '/games/thai/pizza-master-chef.html', 'ภาษาไทย', 70
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/pizza-master-chef.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'PPP', '/games/thai/ppp.html', 'ภาษาไทย', 80
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/ppp.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'สอนตัวเลข', '/games/thai/sonnum.html', 'ภาษาไทย', 90
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/sonnum.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ไวพจน์ (v1)', '/games/thai/waipot.html', 'ภาษาไทย', 100
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/waipot.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ไวพจน์ (v2)', '/games/thai/wipod.html', 'ภาษาไทย', 110
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/wipod.html');

  INSERT INTO public.educational_hub_items (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'ตกปลามาตรา ตัวสะกด 2', '/games/thai/%E0%B8%95%E0%B8%81%E0%B8%9B%E0%B8%A5%E0%B8%B2%E0%B8%A1%E0%B8%B2%E0%B8%95%E0%B8%A3%E0%B8%B2%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B8%AA%E0%B8%B0%E0%B8%81%E0%B8%942.html', 'ภาษาไทย', 120
  WHERE NOT EXISTS (SELECT 1 FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND external_url LIKE '/games/thai/%E0%B8%95%E0%B8%81%E0%B8%9B%E0%B8%A5%E0%B8%B2%E0%B8%A1%E0%B8%B2%E0%B8%95%E0%B8%A3%E0%B8%B2%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B8%AA%E0%B8%B0%E0%B8%81%E0%B8%942.html');

  RAISE NOTICE 'Seeded games for staff_id=%, total in category=%',
    v_staff_id,
    (SELECT COUNT(*) FROM public.educational_hub_items WHERE owner_staff_id = v_staff_id AND category_id = v_cat_games);
END $$;

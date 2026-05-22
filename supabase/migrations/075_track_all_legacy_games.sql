-- =============================================================================
-- Migration 075: Track all legacy HTML games in educational_hub_items
-- =============================================================================
-- Set tracked_game = true and update the unique game_slug fields for all 17 games
-- to align with their postMessage gameSlugs exactly.
-- =============================================================================

DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- Resolve staff_id for ครูณัฐพงศ์ สิงห์ชมภู to ensure targeted updates
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%'
    AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NOT NULL THEN
    -- 1. คณิตศาสตร์ (3 เกม)
    UPDATE public.educational_hub_items
       SET game_slug = 'math-24',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/24.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'math-jumper',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/math-jumper.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'math-pizza',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/math/pizza.html';

    -- 2. เทคโนโลยี (2 เกม)
    UPDATE public.educational_hub_items
       SET game_slug = 'tech-blockly',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/tech/blockly.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'tech-typing',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/tech/typing.html';

    -- 3. ภาษาไทย (12 เกม)
    UPDATE public.educational_hub_items
       SET game_slug = 'attack-noun',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attack-noun.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'attack-on-noun',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attack-on-noun.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'attnoun',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/attnoun.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'fishing',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/fishing.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'flappy-bird',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/flappy-bird.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'kingdom',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/kingdom.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'pizza-master-chef',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/pizza-master-chef.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'ppp',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/ppp.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'sonnum',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/sonnum.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'waipot',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/waipot.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'wipod',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/wipod.html';

    UPDATE public.educational_hub_items
       SET game_slug = 'fishing-2',
           tracked_game = true,
           updated_at = now()
     WHERE owner_staff_id = v_staff_id AND external_url = '/games/thai/%E0%B8%95%E0%B8%81%E0%B8%9B%E0%B8%A5%E0%B8%B2%E0%B8%A1%E0%B8%B2%E0%B8%95%E0%B8%A3%E0%B8%B2%20%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B8%AA%E0%B8%B0%E0%B8%81%E0%B8%942.html';
     
     RAISE NOTICE 'Successfully configured all 17 games to be tracked in educational_hub_items';
  ELSE
    RAISE WARNING 'Teacher ครูณัฐพงศ์ สิงห์ชมภู not found — no updates applied';
  END IF;
END $$;

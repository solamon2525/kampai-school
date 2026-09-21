-- 538_update_10_game_covers.sql
-- อัปเกรดภาพปกเกมการศึกษา 10 รายการ สู่ระดับสตูดิโอ 16:9 (1280×720 px)
-- 1. clock-quest: /games/math/clock-quest-cover.png
-- 2. light-sort: /games/science/light-sort-cover.png
-- 3. moon-phases-race: /games/science/moon-phases-race-cover.png
-- 4. maglev-rush: /games/science/maglev-rush/cover.png
-- 5. animal-feast: /games/science/animal-feast/cover.png
-- 6. follow-instructions-lab: /games/english/follow-instructions-lab-cover.png
-- 7. past-tense-run: /games/english/past-tense-run-cover.png
-- 8. bone-muscle-quest: /games/health/bone-muscle-quest-cover.png
-- 9. first-aid-rush: /games/health/first-aid-rush-cover.png
-- 10. fact-opinion-duel: /games/thai/fact-opinion-duel-cover.png
-- Idempotent: re-run ได้อย่างปลอดภัย ไม่ซ้ำซ้อน

DO $$
DECLARE
  v_staff_id UUID;
  v_cat_games UUID;
BEGIN
  -- 1. Update existing items in educational_hub_items by game_slug or external_url
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/math/clock-quest-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'clock-quest' OR external_url = '/games/math/clock-quest.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/science/light-sort-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'light-sort' OR external_url = '/games/science/light-sort.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/science/moon-phases-race-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'moon-phases-race' OR external_url = '/games/science/moon-phases-race.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/science/maglev-rush/cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'maglev-rush' OR external_url = '/games/science/maglev-rush/index.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/follow-instructions-lab-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'follow-instructions-lab' OR external_url = '/games/english/follow-instructions-lab.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/past-tense-run-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'past-tense-run' OR external_url = '/games/english/past-tense-run.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/health/bone-muscle-quest-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'bone-muscle-quest' OR external_url = '/games/health/bone-muscle-quest.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/health/first-aid-rush-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'first-aid-rush' OR external_url = '/games/health/first-aid-rush.html';

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/thai/fact-opinion-duel-cover.png',
      build_version = 'v1.229.91',
      build_updated_at = now(),
      updated_at = now()
  WHERE game_slug = 'fact-opinion-duel' OR external_url = '/games/thai/fact-opinion-duel.html';

  -- 2. animal-feast: UPDATE if exists, or INSERT if missing
  IF EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE game_slug = 'animal-feast' OR external_url = '/games/science/animal-feast/index.html'
  ) THEN
    UPDATE public.educational_hub_items
    SET thumbnail_url = '/games/science/animal-feast/cover.png',
        build_version = 'v1.229.91',
        build_updated_at = now(),
        updated_at = now()
    WHERE game_slug = 'animal-feast' OR external_url = '/games/science/animal-feast/index.html';
  ELSE
    SELECT id INTO v_staff_id FROM public.staff
    WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
    ORDER BY created_at LIMIT 1;

    IF v_staff_id IS NULL THEN
      SELECT id INTO v_staff_id FROM public.staff
      WHERE staff_type = 'teaching'
      ORDER BY created_at LIMIT 1;
    END IF;

    SELECT id INTO v_cat_games FROM public.educational_hub_categories
    WHERE category_key = 'games' LIMIT 1;

    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description,
      external_url, game_slug, subject, grade_levels, tags,
      sort_order, tracked_game, is_published, thumbnail_url,
      build_version, build_updated_at
    ) VALUES (
      v_staff_id, v_cat_games, 'link',
      '🐾 Animal Feast (ยอดนักป้อนอาหารสัตว์)',
      'เกมวิทยาศาสตร์สำหรับนักเรียนประถมศึกษา — ให้อาหารสัตว์ตามประเภทการกิน (พืช เนื้อ หรือทั้งสองอย่าง)',
      '/games/science/animal-feast/index.html',
      'animal-feast',
      'วิทยาศาสตร์',
      ARRAY['ป.1','ป.2','ป.3']::text[],
      ARRAY['science','animals','herbivore','carnivore','omnivore','primary','game']::text[],
      466, true, true,
      '/games/science/animal-feast/cover.png',
      'v1.229.91', now()
    );
  END IF;

  -- 3. Also update game_docs version for these 10 games
  UPDATE public.game_docs gd
  SET version = 'v1.229.91',
      updated_at = now()
  FROM public.educational_hub_items ehi
  WHERE gd.item_id = ehi.id
    AND ehi.game_slug IN (
      'clock-quest', 'light-sort', 'moon-phases-race', 'maglev-rush', 'animal-feast',
      'follow-instructions-lab', 'past-tense-run', 'bone-muscle-quest', 'first-aid-rush', 'fact-opinion-duel'
    );

END $$;

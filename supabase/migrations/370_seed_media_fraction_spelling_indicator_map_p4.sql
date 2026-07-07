-- 370: ผูกตัวชี้วัด ป.4 — สื่อ hub 4 รายการ + เกมเศษส่วน + เกมไทยสะกด

-- ── สื่อ (tracked_game = false) ─────────────────────────────────────────────
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/math-word-problem-hub/index.html', 'ค 1.1 ป.4/11'),
    ('/games/math/math-word-problem-hub/index.html', 'ค 1.1 ป.4/12'),
    ('/games/thai/thai-vocab-hub/index.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/thai-vocab-hub/index.html', 'ท 4.1 ป.4/6'),
    ('/games/english/vocab-hub.html', 'ต 1.1 ป.4/2'),
    ('/games/english/vocab-hub.html', 'ต 1.1 ป.4/3'),
    ('/games/ar-calibration/index.html', 'ว 4.2 ป.4/4')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url
 AND ehi.is_published = true
 AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- ── เกมเศษส่วน (tracked) ────────────────────────────────────────────────────
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('fraction-adventure', 'ค 1.1 ป.4/13'),
    ('fraction-adventure', 'ค 1.1 ป.4/14'),
    ('fraction-tank', 'ค 1.1 ป.4/13'),
    ('fraction-tank', 'ค 1.1 ป.4/14'),
    ('fraction-garden-ar', 'ค 1.1 ป.4/13'),
    ('fraction-garden-ar', 'ค 1.1 ป.4/3'),
    ('fraction-garden-ar', 'ค 1.1 ป.4/4'),
    ('math-pizza', 'ค 1.1 ป.4/13'),
    ('math-pizza', 'ค 1.1 ป.4/14')
) AS map(slug, code)
JOIN public.educational_hub_items ehi
  ON ehi.game_slug = map.slug
 AND ehi.tracked_game = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- ── เกมไทยสะกด (tracked) ───────────────────────────────────────────────────
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('thai-spelling-moto', 'ท 4.1 ป.4/1'),
    ('thai-spelling-moto', 'ท 4.1 ป.4/4'),
    ('thai-spelling', 'ท 4.1 ป.4/1'),
    ('thai-spelling', 'ท 4.1 ป.4/4'),
    ('tug-of-war', 'ท 4.1 ป.4/1'),
    ('tug-of-war', 'ท 4.1 ป.4/4'),
    ('fishing', 'ท 4.1 ป.4/1'),
    ('fishing', 'ท 4.1 ป.4/4'),
    ('balloon-fighter', 'ท 4.1 ป.4/1'),
    ('balloon-fighter', 'ท 4.1 ป.4/4')
) AS map(slug, code)
JOIN public.educational_hub_items ehi
  ON ehi.game_slug = map.slug
 AND ehi.tracked_game = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

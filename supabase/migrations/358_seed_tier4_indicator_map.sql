-- 358: Map ตัวชี้วัด ↔ data / science / idiom hubs

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/math/math-data-hub/index.html', 'ค 3.1 ป.4/1'),
    ('/games/math/math-data-hub/index.html', 'ค 3.1 ป.4/2'),
    ('/games/science/science-p45-hub/index.html', 'ว 2.1 ป.4/3'),
    ('/games/science/science-p45-hub/index.html', 'ว 3.2 ป.5/3'),
    ('/games/science/science-p45-hub/index.html', 'ว 1.3 ป.4/3'),
    ('/games/science/science-p45-hub/index.html', 'ว 1.2 ป.6/4'),
    ('/games/thai/thai-idiom-hub/index.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/thai-idiom-hub/index.html', 'ท 4.1 ป.5/1')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

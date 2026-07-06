-- 354: Map ตัวชี้วัด ↔ literature / decimal / geometry hubs

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-literature-hub/index.html', 'ท 5.1 ป.4/1'),
    ('/games/thai/thai-literature-hub/index.html', 'ท 5.1 ป.4/2'),
    ('/games/math/math-decimal-hub/index.html', 'ค 1.1 ป.4/5'),
    ('/games/math/math-decimal-hub/index.html', 'ค 1.1 ป.4/6'),
    ('/games/math/math-geometry-hub/index.html', 'ค 2.2 ป.4/1'),
    ('/games/math/math-geometry-hub/index.html', 'ค 2.2 ป.4/2')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

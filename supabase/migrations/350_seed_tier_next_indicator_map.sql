-- 350: Map ตัวชี้วัด ↔ สื่อ poetry / word-problem / writing

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-poetry-hub/index.html', 'ท 5.1 ป.4/4'),
    ('/games/thai/thai-poetry-hub/index.html', 'ท 4.1 ป.4/5'),
    ('/games/math/math-word-problem-hub/index.html', 'ค 1.2 ป.4/1'),
    ('/games/math/math-word-problem-hub/index.html', 'ค 1.2 ป.5/1'),
    ('/games/thai/thai-writing-hub/index.html', 'ท 2.1 ป.4/1'),
    ('/games/thai/thai-writing-hub/index.html', 'ท 4.1 ป.5/3')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

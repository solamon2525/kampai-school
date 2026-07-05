-- 341: W6 เติม indicator_games สำหรับ hub ที่ขาด

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-matra-chart.html', 'ท 4.1 ป.2/1'),
    ('/games/english/phonics-chart.html', 'ต 1.1 ป.1/2'),
    ('/games/english/phonics-chart.html', 'ต 2.2 ป.1/1'),
    ('/games/thai/thai-grammar-hub/index.html', 'ท 4.1 ป.4/2'),
    ('/games/thai/thai-grammar-hub/index.html', 'ท 4.1 ป.5/1'),
    ('/games/thai/thai-script-hub/index.html', 'ท 4.1 ป.1/1'),
    ('/games/thai/thai-script-hub/index.html', 'ท 4.1 ป.2/1')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- 361: Map ตัวชี้วัด ↔ social / english hubs

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/social/social-thailand-hub/index.html', 'ส 5.1 ป.4/1'),
    ('/games/social/social-thailand-hub/index.html', 'ส 4.3 ป.4/1'),
    ('/games/social/social-thailand-hub/index.html', 'ส 2.1 ป.4/1'),
    ('/games/english/english-grammar-p45-hub/index.html', 'ต 2.1 ป.4/1'),
    ('/games/english/english-grammar-p45-hub/index.html', 'ต 1.1 ป.4/2'),
    ('/games/english/english-grammar-p45-hub/index.html', 'ต 1.1 ป.4/1')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

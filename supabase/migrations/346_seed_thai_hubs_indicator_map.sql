-- 346: Map ตัวชี้วัด ↔ สื่อ Hub ไทย 3 ชิ้นใหม่ (indicator_games)

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-punctuation-hub/index.html', 'ท 4.1 ป.4/3'),
    ('/games/thai/thai-punctuation-hub/index.html', 'ท 4.1 ป.4/4'),
    ('/games/thai/thai-sentence-hub/index.html', 'ท 4.1 ป.5/2'),
    ('/games/thai/thai-reading-hub/index.html', 'ท 1.1 ป.5/2'),
    ('/games/thai/thai-reading-hub/index.html', 'ท 1.1 ป.5/3')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

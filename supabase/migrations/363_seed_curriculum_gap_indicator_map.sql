-- 363: ตัวชี้วัด ↔ narration media + poetry hub บทร้อยกรอง

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-narration-style-media.html', 'ท 1.1 ป.5/4'),
    ('/games/thai/thai-poetry-hub/index.html', 'ท 4.1 ป.5/2'),
    ('/games/thai/thai-poetry-hub/index.html', 'ท 5.1 ป.5/1')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- bump poetry game_docs version
UPDATE public.game_docs gd
SET version = 'v1.1.0',
    features = ARRAY['บทร้อยแก้ว','บทร้อยกรองขยาย','คำขวัญ','สัมผัส','ฉันทลักษณ์'],
    notes = 'ขยายบทร้อยกรอง 9 บท',
    updated_at = now()
FROM public.educational_hub_items ehi
WHERE gd.item_id = ehi.id AND ehi.external_url = '/games/thai/thai-poetry-hub/index.html';

-- 365: ตัวชี้วัด ↔ implied meaning + poetry/literature data bump

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/thai-implied-meaning-media.html', 'ท 1.1 ป.5/5'),
    ('/games/thai/thai-poetry-hub/index.html', 'ท 4.1 ป.4/5'),
    ('/games/thai/thai-literature-hub/index.html', 'ท 5.1 ป.5/2')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

UPDATE public.game_docs gd
SET version = 'v1.2.0',
    features = ARRAY['บทร้อยแก้ว','บทร้อยกรอง','คำขวัญขยาย','สัมผัส','ฉันทลักษณ์'],
    notes = 'คำขวัญ 12 บท',
    updated_at = now()
FROM public.educational_hub_items ehi
WHERE gd.item_id = ehi.id AND ehi.external_url = '/games/thai/thai-poetry-hub/index.html';

UPDATE public.game_docs gd
SET version = 'v1.1.0',
    features = ARRAY['นิทาน','สุภาษิต','คำพังเพย','ข้อคิด','บทอาขยาน','ตัวละคร'],
    notes = 'เพิ่มหมวดบทอาขยาน 5 บท',
    updated_at = now()
FROM public.educational_hub_items ehi
WHERE gd.item_id = ehi.id AND ehi.external_url = '/games/thai/thai-literature-hub/index.html';

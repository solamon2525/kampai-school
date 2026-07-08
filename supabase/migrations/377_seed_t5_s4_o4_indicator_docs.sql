-- 377: Map T5/S4/O4 media ↔ ตัวชี้วัด + game_docs

-- indicator map
INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/thai/sentence-structure.html', 'ท 4.1 ป.3/4'),
    ('/games/thai/sentence-structure.html', 'ท 4.1 ป.5/2'),
    ('/games/science/food-chain-media.html', 'ว 1.1 ป.5/3'),
    ('/games/science/food-chain-media.html', 'ว 1.1 ป.5/2'),
    ('/games/career/waste-sort-media.html', 'ง 1.1 ป.3/3'),
    ('/games/career/waste-sort-media.html', 'ง 1.1 ป.4/4')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- game_docs (1:1)
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/thai/sentence-structure.html',
     'โครงสร้างประโยค',
     ARRAY['โหมดเรียนรู้ ประธาน/กริยา/กรรม', 'โหมดเรียงประโยคแตะคำ', 'เฉลย + TTS optional', 'คู่ sentence-craft'],
     'v1.0.0',
     'T5 · ท 4.1 ป.3/4 · ท 4.1 ป.5/2 · ไม่ทับ thai-sentence-hub'),
    ('/games/science/food-chain-media.html',
     'ห่วงโซ่อาหาร',
     ARRAY['อธิบายผู้ผลิต/ผู้บริโภค/ผู้ล่า', 'ตัวอย่างระบบนิเวศไทย', 'เรียงโซ่ตามพลังงาน', 'คู่ food-chain'],
     'v1.0.0',
     'S4 · ว 1.1 ป.5/3'),
    ('/games/career/waste-sort-media.html',
     'คัดแยกขยะ 4 ถัง',
     ARRAY['ถังขยะ 4 สีมาตรฐานไทย', 'ฝึกแยกขยะ', 'เฉลย + คำอธิบาย', 'คู่ waste-sort'],
     'v1.0.0',
     'O4 · ง 1.1 ป.3/3 · ง 1.1 ป.4/4')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

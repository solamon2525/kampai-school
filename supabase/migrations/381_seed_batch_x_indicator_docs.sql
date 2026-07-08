-- 381: Map Batch X media ↔ ตัวชี้วัด + game_docs

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    ('/games/health/food-groups-media.html', 'พ 4.1 ป.3/2'),
    ('/games/health/food-groups-media.html', 'พ 4.1 ป.3/3'),
    ('/games/arts/color-wheel-media.html', 'ศ 1.1 ป.4/2'),
    ('/games/arts/color-wheel-media.html', 'ศ 1.1 ป.4/7'),
    ('/games/thai/synonym-media.html', 'ท 1.1 ป.4/2'),
    ('/games/science/plant-parts-media.html', 'ว 1.2 ป.4/1'),
    ('/games/science/moon-phases-media.html', 'ว 3.1 ป.4/1'),
    ('/games/science/moon-phases-media.html', 'ว 3.1 ป.4/2'),
    ('/games/math/rect-area-media.html', 'ค 2.1 ป.4/3'),
    ('/games/health/bone-muscle-media.html', 'พ 1.1 ป.4/2'),
    ('/games/health/bone-muscle-media.html', 'พ 1.1 ป.4/3'),
    ('/games/career/community-jobs-media.html', 'ง 2.1 ป.4/1'),
    ('/games/social/sufficiency-media.html', 'ส 3.1 ป.4/3'),
    ('/games/thai/dictionary-media.html', 'ท 4.1 ป.3/3'),
    ('/games/thai/dictionary-media.html', 'ท 4.1 ป.4/3')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/health/food-groups-media.html',
     'อาหารหลัก 5 หมู่',
     ARRAY['เรียนรู้ 5 หมู่','สำรวจอาหาร','จัดจานฝึก','ถูก/ผิด','จานครู 3 มื้อ','คู่ plate-builder'],
     'v1.0.0', 'H1 · พ 4.1 ป.3/2–3 · Batch X1'),
    ('/games/arts/color-wheel-media.html',
     'วงล้อสีวรรณะ',
     ARRAY['วงล้อสำรวจ','อุ่น vs เย็น','จัดฉาก','ผสมแม่สี','quiz','คู่ color-wheel'],
     'v1.0.0', 'A1 · ศ 1.1 ป.4/2,/7 · Batch X1'),
    ('/games/thai/synonym-media.html',
     'ไวพจน์',
     ARRAY['เรียนรู้ 24 กลุ่ม','แฟลชการ์ด','เลือกไวพจน์','จับคู่กลุ่ม','คู่ waipot'],
     'v1.0.0', 'T4 · ท 1.1 ป.4/2 · ไม่ copy thai-vocab-hub ทั้งก้อน · Batch X1'),
    ('/games/science/plant-parts-media.html',
     'ส่วนพืชดอก',
     ARRAY['แผนภาพคลิก','จับคู่หน้าที่','กินส่วนไหน','เรียงเติบโต','คู่ veggie-garden'],
     'v1.0.0', 'S-plant · ว 1.2 ป.4/1 · Batch X2'),
    ('/games/science/moon-phases-media.html',
     'ดวงจันทร์ 8 ข้าง',
     ARRAY['วงโคจรจำลอง','ไทม์ไลน์','เรียงลำดับ','ทายข้าง','พยากรณ์'],
     'v1.0.0', 'S-moon · ว 3.1 ป.4/1–2 · Batch X2'),
    ('/games/math/rect-area-media.html',
     'พื้นที่สี่เหลี่ยมมุมฉาก',
     ARRAY['กริดโต้ตอบ','นับช่อง','สูตร','โจทย์เรื่อง','พื้นที่ vs เส้นรอบรูป','คู่ mini-farm-island'],
     'v1.0.0', 'M-area · ค 2.1 ป.4/3 · Batch X2'),
    ('/games/health/bone-muscle-media.html',
     'กระดูก กล้ามเนื้อ ข้อ',
     ARRAY['hotspot แผนภาพ','แยกประเภท','ดูแลร่างกาย','ทายตำแหน่ง'],
     'v1.0.0', 'H-body · พ 1.1 ป.4/2–3 · Batch X3'),
    ('/games/career/community-jobs-media.html',
     'อาชีพในชุมชน',
     ARRAY['การ์ดอาชีพ','จัดกลุ่มภาค','ใครทำอะไร','สำคัญต่อชุมชน','สำรวจตัวเอง'],
     'v1.0.0', 'C1 · ง 2.1 ป.4/1 · Batch X3'),
    ('/games/social/sufficiency-media.html',
     'เศรษฐกิจพอเพียง',
     ARRAY['เรียนรู้ 3 ห่วง 2 เงื่อนไข','จับคู่','สถานการณ์','แผนของฉัน'],
     'v1.0.0', 'O-suff · ส 3.1 ป.4/3 · Batch X3'),
    ('/games/thai/dictionary-media.html',
     'พจนานุกรมดิจิทัล',
     ARRAY['สาธิต 5 ขั้น','ค้นหา','ฝึกเปิด','จัดเรียง','อ่านบทความ'],
     'v1.0.0', 'T-dict · ท 4.1 ป.3/3,/4/3 · Batch X3')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();

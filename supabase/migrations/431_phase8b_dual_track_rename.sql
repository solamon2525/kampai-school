-- 431: Phase 8B — dual-track rename media URLs + game_docs

-- Remap hub item external_url from legacy media paths to *-media.html
UPDATE public.educational_hub_items AS ehi
SET external_url = m.new_url,
    updated_at = now()
FROM (
  VALUES
    ('/games/thai/fact-opinion.html', '/games/thai/fact-opinion-media.html'),
    ('/games/thai/thai-word-types.html', '/games/thai/thai-word-types-media.html'),
    ('/games/science/states-of-matter.html', '/games/science/states-of-matter-media.html'),
    ('/games/science/vertebrate-sort.html', '/games/science/vertebrate-sort-media.html'),
    ('/games/math/fraction-pieces.html', '/games/math/fraction-pieces-media.html'),
    ('/games/thai/sentence-structure.html', '/games/thai/sentence-structure-media.html')
) AS m(old_url, new_url)
WHERE ehi.external_url = m.old_url;

-- indicator_games links via edu_hub_item_id (no game_url column) — no URL remap needed

-- game_docs for remapped Phase 8B media
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/thai/fact-opinion-media.html',
     'ข้อเท็จจริง vs ความคิดเห็น',
     ARRAY['จำแนก', 'โหมดฝึก', 'ป.4', 'คู่ fact-opinion-worksheet'],
     'v1.1.0',
     'Phase 8B dual-track rename'),
    ('/games/thai/thai-word-types-media.html',
     'ชนิดของคำ ป.3-4',
     ARRAY['นาม กริยา คุณศัพท์', 'โหมดฝึก/จัดกล่อง', 'โหมดสำนวน', 'คู่ thai-word-types-worksheet'],
     'v1.2.0',
     'Phase 8B dual-track rename'),
    ('/games/science/states-of-matter-media.html',
     'สสาร 3 สถานะ',
     ARRAY['ของแข็ง/ของเหลว/แก๊ส', 'สไลเดอร์อุณหภูมิ', 'ป.4', 'คู่ states-of-matter-worksheet'],
     'v1.1.0',
     'Phase 8B dual-track rename'),
    ('/games/science/vertebrate-sort-media.html',
     'จำแนกสัตว์',
     ARRAY['มี/ไม่มีกระดูกสันหลัง', 'จัดกลุ่ม', 'ป.4', 'คู่ vertebrate-sort-worksheet'],
     'v1.1.0',
     'Phase 8B dual-track rename'),
    ('/games/math/fraction-pieces-media.html',
     'สื่อเศษส่วนชิ้น',
     ARRAY['แท่งเศษส่วน', 'เทียบเศษส่วน', 'โหมดฝึก', 'คู่ fraction-pieces-worksheet'],
     'v1.1.0',
     'Phase 8B dual-track rename'),
    ('/games/thai/sentence-structure-media.html',
     'โครงสร้างประโยค',
     ARRAY['โหมดเรียนรู้ ประธาน/กริยา/กรรม', 'โหมดเรียงประโยคแตะคำ', 'เฉลย + TTS optional', 'คู่ sentence-structure-worksheet'],
     'v1.1.0',
     'Phase 8B dual-track rename')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();
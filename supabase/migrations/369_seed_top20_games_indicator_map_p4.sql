-- 369: ผูกตัวชี้วัด ป.4 กับเกมยอดนิยม top 20 (แถบสไลด์บนการ์ด)
-- เน้น ป.4 เป็นหลัก · เกมที่มี mapping แล้ว (เช่น math-rally) ใช้ ON CONFLICT DO NOTHING

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    -- math-runner — สูตรคูณ/หาร
    ('math-runner', 'ค 1.1 ป.4/9'),
    ('math-runner', 'ค 1.1 ป.4/10'),
    -- math-jumper — บวกลบคูณหาร
    ('math-jumper', 'ค 1.1 ป.4/10'),
    ('math-jumper', 'ค 1.1 ป.4/11'),
    -- multiply-race — สูตรคูณ
    ('multiply-race', 'ค 1.1 ป.4/9'),
    ('multiply-race', 'ค 1.1 ป.4/10'),
    -- pizza-master-chef — เศษส่วน
    ('pizza-master-chef', 'ค 1.1 ป.4/13'),
    ('pizza-master-chef', 'ค 1.1 ป.4/14'),
    -- waste-sort — ทรัพยากร/สิ่งแวดล้อม
    ('waste-sort', 'ง 1.1 ป.4/4'),
    ('waste-sort', 'ง 2.1 ป.4/1'),
    -- vocab-race — คำศัพท์อังกฤษ
    ('vocab-race', 'ต 1.1 ป.4/2'),
    ('vocab-race', 'ต 1.1 ป.4/3'),
    -- tank-commander — คณิตศาสตร์
    ('tank-commander', 'ค 1.1 ป.4/10'),
    ('tank-commander', 'ค 1.1 ป.4/11'),
    -- spelling — สะกดคำไทย
    ('spelling', 'ท 4.1 ป.4/1'),
    ('spelling', 'ท 4.1 ป.4/4'),
    -- sci-sort — จำแนกสัตว์
    ('sci-sort', 'ว 1.3 ป.4/3'),
    ('sci-sort', 'ว 1.3 ป.4/4'),
    -- good-citizen — พลเมืองดี
    ('good-citizen', 'ส 2.1 ป.4/1'),
    ('good-citizen', 'ส 2.1 ป.4/2'),
    -- energy-rocket — พลังงาน/สถานะสสาร
    ('energy-rocket', 'ว 2.1 ป.4/3'),
    ('energy-rocket', 'ว 2.1 ป.4/4'),
    -- thai-sara-run — สระ/หลักภาษาไทย
    ('thai-sara-run', 'ท 4.1 ป.4/1'),
    ('thai-sara-run', 'ท 4.1 ป.4/2'),
    -- math-rally — มีแล้วจาก 186 แต่เติม ป.4 เพิ่มถ้ายังไม่ครบ
    ('math-rally', 'ค 1.1 ป.4/10'),
    ('math-rally', 'ค 1.1 ป.4/11'),
    -- catch-numbers — จับตัวเลข/คณิต
    ('catch-numbers', 'ค 1.1 ป.4/9'),
    ('catch-numbers', 'ค 1.1 ป.4/10'),
    -- reading-game — อ่าน/ข้อเท็จจริง
    ('reading-game', 'ท 1.1 ป.4/4'),
    ('reading-game', 'ท 3.1 ป.4/1'),
    -- phonics-pop — อ่านออกเสียงภาษาอังกฤษ
    ('phonics-pop', 'ต 1.1 ป.4/2'),
    ('phonics-pop', 'ต 1.1 ป.4/3'),
    -- balloon-burst — สระ/คำไทย AR
    ('balloon-burst', 'ท 4.1 ป.4/1'),
    ('balloon-burst', 'ท 4.1 ป.4/2'),
    -- math-24 — คณิต 4 ตัวเลข
    ('math-24', 'ค 1.1 ป.4/10'),
    ('math-24', 'ค 1.1 ป.4/12'),
    -- math-blaster — บวกลบคูณหาร
    ('math-blaster', 'ค 1.1 ป.4/10'),
    ('math-blaster', 'ค 1.1 ป.4/11'),
    -- math-hand-raising — ยกมือตอบคณิต
    ('math-hand-raising', 'ค 1.1 ป.4/9'),
    ('math-hand-raising', 'ค 1.1 ป.4/10')
) AS map(slug, code)
JOIN public.educational_hub_items ehi
  ON ehi.game_slug = map.slug
 AND ehi.tracked_game = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

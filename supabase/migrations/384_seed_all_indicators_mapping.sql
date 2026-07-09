-- 384: ผูกตัวชี้วัด ป.1 - ป.6 กับเกมและสื่อการสอนที่เหลือทั้งหมดในคลัง
-- ช่วยคุณครูจัดหมวดหมู่และค้นหาผ่านตัวชี้วัดหลักสูตรแกนกลาง

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    -- 1. cashier (ร้านค้าทอนเงิน) -> คณิต ป.4/10 + การงาน ป.4/2
    ('/games/career/cashier.html', 'ค 1.1 ป.4/10'),
    ('/games/career/cashier.html', 'ง 1.1 ป.4/2'),

    -- 2. veggie-garden (สวนผักพอเพียง) -> สังคม ป.4/3 + การงาน ป.4/4
    ('/games/career/veggie-garden/index.html', 'ส 3.1 ป.4/3'),
    ('/games/career/veggie-garden/index.html', 'ง 1.1 ป.4/4'),

    -- 3. multiplication-rpg (คูณผู้พิทักษ์) -> คณิต ป.4/9 + คณิต ป.4/10
    ('/games/math/multiplication-rpg/index.html', 'ค 1.1 ป.4/9'),
    ('/games/math/multiplication-rpg/index.html', 'ค 1.1 ป.4/10'),

    -- 4. weight-adventure (ผจญภัยชั่งน้ำหนัก) -> คณิต ป.3/9 + คณิต ป.4/10
    ('/games/math/weight-adventure.html', 'ค 2.1 ป.3/9'),
    ('/games/math/weight-adventure.html', 'ค 1.1 ป.4/10'),

    -- 5. multiply-burst (สูตรคูณตาไว) -> คณิต ป.4/9 + คณิต ป.4/10
    ('/games/math/multiply-burst/index.html', 'ค 1.1 ป.4/9'),
    ('/games/math/multiply-burst/index.html', 'ค 1.1 ป.4/10'),

    -- 6. mini-farm-island (มินิฟาร์มไอส์แลนด์) -> คณิต ป.4/10 + คณิต ป.4/11
    ('/games/math/mini-farm-island/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/mini-farm-island/index.html', 'ค 1.1 ป.4/11'),

    -- 7. farm-adventure (ภารกิจวัดความยาวในฟาร์ม) -> คณิต ป.3/3 + คณิต ป.3/5
    ('/games/math/farm-adventure/index.html', 'ค 2.1 ป.3/3'),
    ('/games/math/farm-adventure/index.html', 'ค 2.1 ป.3/5'),

    -- 8. coin-exchange (แลกเหรียญ) -> คณิต ป.3/1 + คณิต ป.4/10
    ('/games/math/coin-exchange/index.html', 'ค 2.1 ป.3/1'),
    ('/games/math/coin-exchange/index.html', 'ค 1.1 ป.4/10'),

    -- 9. measure-up (วัดและเปรียบเทียบ) -> คณิต ป.3/3 + คณิต ป.3/5
    ('/games/math/measure-up/index.html', 'ค 2.1 ป.3/3'),
    ('/games/math/measure-up/index.html', 'ค 2.1 ป.3/5'),

    -- 10. math-move-quiz (ขยับตอบเลข) -> คณิต ป.4/10 + คณิต ป.4/7
    ('/games/math/math-move-quiz/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-move-quiz/index.html', 'ค 1.1 ป.4/7'),

    -- 11. jump-even-odd (กระโดดเลขคู่-คี่) -> คณิต ป.2/1 + คณิต ป.4/2
    ('/games/math/jump-even-odd/index.html', 'ค 1.1 ป.2/1'),
    ('/games/math/jump-even-odd/index.html', 'ค 1.1 ป.4/2'),

    -- 12. math-man-coop (ศึกวงกตคณิตศาสตร์คู่หู) -> คณิต ป.4/10 + คณิต ป.4/9
    ('/games/math/math-man-coop/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-man-coop/index.html', 'ค 1.1 ป.4/9'),

    -- 13. math-blaster (ดวลเลขกู้กาแล็กซี) -> คณิต ป.4/10 + คณิต ป.4/11
    ('/games/math/math-blaster/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-blaster/index.html', 'ค 1.1 ป.4/11'),

    -- 14. math-tank-raid (รถถังจอมคณิต) -> คณิต ป.4/10 + คณิต ป.4/9
    ('/games/math/math-tank-raid.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-tank-raid.html', 'ค 1.1 ป.4/9'),

    -- 15. ar-zone-quiz (ยืนเลือกคำตอบ) -> คณิต ป.4/10 + คณิต ป.4/7
    ('/games/demo/ar-zone-quiz/index.html', 'ค 1.1 ป.4/10'),
    ('/games/demo/ar-zone-quiz/index.html', 'ค 1.1 ป.4/7'),

    -- 16. math-racer (High View Racing) -> คณิต ป.4/10 + คณิต ป.4/9
    ('/games/math/math-racer/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/math-racer/index.html', 'ค 1.1 ป.4/9'),

    -- 17. math-han (เกมส์หารยาว) -> คณิต ป.4/9 + คณิต ป.4/10
    ('/games/math/mth.html', 'ค 1.1 ป.4/9'),
    ('/games/math/mth.html', 'ค 1.1 ป.4/10'),

    -- 18. detective (นักสืบโจทย์ปัญหา) -> คณิต ป.4/11 + คณิต ป.4/12
    ('/games/math/detective.html', 'ค 1.1 ป.4/11'),
    ('/games/math/detective.html', 'ค 1.1 ป.4/12'),

    -- 19. block-3d (บล็อก 3 มิติ) -> คณิต ป.6/3 + คณิต ป.4/2
    ('/games/math/block-3d.html', 'ค 2.2 ป.6/3'),
    ('/games/math/block-3d.html', 'ค 2.2 ป.4/2'),

    -- 20. probability-zoo-board (บอร์ดเกมความน่าจะเป็น) -> คณิต ป.4/10 + คณิต ป.4/7
    ('/games/math/probability-zoo-board/index.html', 'ค 1.1 ป.4/10'),
    ('/games/math/probability-zoo-board/index.html', 'ค 1.1 ป.4/7'),

    -- 21. coord-3d (พิกัด 3 มิติ) -> คณิต ป.4/2 + คณิต ป.6/3
    ('/games/math/coord-3d.html', 'ค 2.2 ป.4/2'),
    ('/games/math/coord-3d.html', 'ค 2.2 ป.6/3'),

    -- 22. multiply-rally (รถซิ่งสูตรคูณ) -> คณิต ป.4/9 + คณิต ป.4/10
    ('/games/math/multiply-rally/index.html', 'ค 1.1 ป.4/9'),
    ('/games/math/multiply-rally/index.html', 'ค 1.1 ป.4/10'),

    -- 23. net-3d (รูปคลี่ -> ทรง) -> คณิต ป.6/4 + คณิต ป.6/3
    ('/games/math/net-3d.html', 'ค 2.2 ป.6/4'),
    ('/games/math/net-3d.html', 'ค 2.2 ป.6/3'),

    -- 24. solid-3d (สำรวจทรง 3 มิติ) -> คณิต ป.6/3 + คณิต ป.6/4
    ('/games/math/solid-3d.html', 'ค 2.2 ป.6/3'),
    ('/games/math/solid-3d.html', 'ค 2.2 ป.6/4'),

    -- 25. number-line (เส้นจำนวนแม่นเป้า) -> คณิต ป.4/2 + คณิต ป.2/1
    ('/games/math/number-line.html', 'ค 1.1 ป.4/2'),
    ('/games/math/number-line.html', 'ค 1.1 ป.2/1'),

    -- 26. multiplication-kingdom (อาณาจักรคูณมหัศจรรย์) -> คณิต ป.4/9 + คณิต ป.4/10
    ('/games/math/multiplication-kingdom/index.html', 'ค 1.1 ป.4/9'),
    ('/games/math/multiplication-kingdom/index.html', 'ค 1.1 ป.4/10'),

    -- 27. order-it (เรียงให้ถูกลำดับ) -> คณิต ป.4/2
    ('/games/math/order-it.html', 'ค 1.1 ป.4/2'),

    -- 28. cyberdrop (Tech Vocab Hand Tracking) -> วิทย์/เทคโนโลยี ป.4/4 + ป.4/1
    ('/games/tech/cyberdrop.html', 'ว 4.2 ป.4/4'),
    ('/games/tech/cyberdrop.html', 'ว 4.2 ป.4/1'),

    -- 29. word-shield (Word-Shield) -> วิทย์/เทคโนโลยี ป.4/5 + ป.4/3
    ('/games/tech/word-shield.html', 'ว 4.2 ป.4/5'),
    ('/games/tech/word-shield.html', 'ว 4.2 ป.4/3'),

    -- 30. logic-gates (ตรรกะสวิตช์ไฟ) -> วิทย์/เทคโนโลยี ป.4/1 + ป.4/2
    ('/games/tech/logic-gates.html', 'ว 4.2 ป.4/1'),
    ('/games/tech/logic-gates.html', 'ว 4.2 ป.4/2'),

    -- 31. binary-bits (ถอดรหัสเลขฐานสอง) -> วิทย์/เทคโนโลยี ป.4/1 + ป.4/2
    ('/games/tech/binary-bits.html', 'ว 4.2 ป.4/1'),
    ('/games/tech/binary-bits.html', 'ว 4.2 ป.4/2'),

    -- 32. online-safety (ปลอดภัยออนไลน์) -> วิทย์/เทคโนโลยี ป.4/5 + ป.4/3
    ('/games/tech/online-safety.html', 'ว 4.2 ป.4/5'),
    ('/games/tech/online-safety.html', 'ว 4.2 ป.4/3'),

    -- 33. debug-it (พิชิตบั๊ก) -> วิทย์/เทคโนโลยี ป.4/2 + ป.4/1
    ('/games/tech/debug-it.html', 'ว 4.2 ป.4/2'),
    ('/games/tech/debug-it.html', 'ว 4.2 ป.4/1'),

    -- 34. robot-path (หุ่นยนต์ทำตามคำสั่ง) -> วิทย์/เทคโนโลยี ป.4/2 + ป.4/1
    ('/games/tech/robot-path.html', 'ว 4.2 ป.4/2'),
    ('/games/tech/robot-path.html', 'ว 4.2 ป.4/1'),

    -- 35. thai-edu-rpg (ภารกิจกอบกู้อาณาจักร) -> ไทย ป.4/1 + คณิต ป.4/10
    ('/games/thai/thai-edu-rpg.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/thai-edu-rpg.html', 'ค 1.1 ป.4/10'),

    -- 36. ai-hand-gesture-game (อัจฉริยะสองภาษา) -> ไทย ป.4/1 + อังกฤษ ป.4/2
    ('/games/thai/ai-hand-gesture-game.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/ai-hand-gesture-game.html', 'ต 1.1 ป.4/2'),

    -- 37. word-ninja-noun (ตัดคำนามนินจา AR) -> ไทย ป.4/2 + ไทย ป.4/1
    ('/games/thai/word-ninja-noun/index.html', 'ท 4.1 ป.4/2'),
    ('/games/thai/word-ninja-noun/index.html', 'ท 4.1 ป.4/1'),

    -- 38. kingdom (Kingdom คำไทย) -> ไทย ป.4/2 + ไทย ป.4/1
    ('/games/thai/kingdom.html', 'ท 4.1 ป.4/2'),
    ('/games/thai/kingdom.html', 'ท 4.1 ป.4/1'),

    -- 39. battle-city (รถถังหาศัพท์) -> ไทย ป.4/1 + ไทย ป.4/4
    ('/games/thai/battle-city/index.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/battle-city/index.html', 'ท 4.1 ป.4/4'),

    -- 40. thai-vocab-arena (ลานประลองคำศัพท์) -> ไทย ป.4/1 + ไทย ป.4/2
    ('/games/thai/thai-vocab-arena/index.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/thai-vocab-arena/index.html', 'ท 4.1 ป.4/2'),

    -- 41. wipod (ไวพจน์ v2) -> ไทย ป.4/2 + ไทย ป.4/1
    ('/games/thai/wipod.html', 'ท 1.1 ป.4/2'),
    ('/games/thai/wipod.html', 'ท 4.1 ป.4/1'),

    -- 42. wizard-thai (ศึกจอมเวทแห่งภาษา) -> ไทย ป.4/1 + ไทย ป.4/2
    ('/games/thai/wizard-thai.html', 'ท 4.1 ป.4/1'),
    ('/games/thai/wizard-thai.html', 'ท 4.1 ป.4/2'),

    -- 43. snake-3d (งูกินคำศัพท์ 3 มิติ) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/3
    ('/games/english/snake-3d/index.html', 'ต 1.1 ป.4/2'),
    ('/games/english/snake-3d/index.html', 'ต 1.1 ป.4/3'),

    -- 44. english-ar-quiz (English AR Quiz) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/3
    ('/games/english/english-ar-quiz/index.html', 'ต 1.1 ป.4/2'),
    ('/games/english/english-ar-quiz/index.html', 'ต 1.1 ป.4/3'),

    -- 45. english-quest (ผจญภัยศัพท์อังกฤษ) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/3
    ('/english-quest', 'ต 1.1 ป.4/2'),
    ('/english-quest', 'ต 1.1 ป.4/3'),

    -- 46. hands-up-quiz (ยกมือตอบ AR) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/3
    ('/games/english/hands-up-quiz/index.html', 'ต 1.1 ป.4/2'),
    ('/games/english/hands-up-quiz/index.html', 'ต 1.1 ป.4/3'),

    -- 47. vocab-move (เดินตอบศัพท์) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/3
    ('/games/english/vocab-move.html', 'ต 1.1 ป.4/2'),
    ('/games/english/vocab-move.html', 'ต 1.1 ป.4/3'),

    -- 48. listen-spell (ฟังแล้วสะกด) -> อังกฤษ ป.4/2 + อังกฤษ ป.4/1
    ('/games/english/listen-spell/index.html', 'ต 1.1 ป.4/2'),
    ('/games/english/listen-spell/index.html', 'ต 2.2 ป.4/1'),

    -- 49. room-3d (ห้องคำศัพท์ 3 มิติ) -> อังกฤษ ป.4/3 + อังกฤษ ป.4/2
    ('/games/english/room-3d.html', 'ต 1.1 ป.4/3'),
    ('/games/english/room-3d.html', 'ต 1.1 ป.4/2'),

    -- 50. blocky-safari (นักสำรวจพิทักษ์สัตว์โลก) -> วิทย์ ป.4/3 + วิทย์ ป.4/4
    ('/games/science/blocky-safari/index.html', 'ว 1.3 ป.4/3'),
    ('/games/science/blocky-safari/index.html', 'ว 1.3 ป.4/4'),

    -- 51. animal-habitat-3d (คัดแยกสัตว์ 3 มิติ) -> วิทย์ ป.4/3 + วิทย์ ป.4/1
    ('/games/science/animal-habitat-3d/index.html', 'ว 1.3 ป.4/3'),
    ('/games/science/animal-habitat-3d/index.html', 'ว 1.3 ป.4/1'),

    -- 52. digestive-ar (ระบบย่อยอาหารมหัศจรรย์) -> วิทย์ ป.6/4 + สุขศึกษา ป.5/1
    ('/games/science/digestive-ar/index.html', 'ว 1.2 ป.6/4'),
    ('/games/science/digestive-ar/index.html', 'พ 1.1 ป.5/1'),

    -- 53. genetic-quest (เกมล่าสมบัติพันธุศาสตร์) -> วิทย์ ป.5/1
    ('/games/science/genetic-quest/index.html', 'ว 1.3 ป.5/1'),

    -- 54. sink-float (จม หรือ ลอย?) -> วิทย์ ป.4/1 + วิทย์ ป.4/3
    ('/games/science/sink-float/index.html', 'ว 2.1 ป.4/1'),
    ('/games/science/sink-float/index.html', 'ว 2.1 ป.4/3'),

    -- 55. circuit-builder (ต่อวงจรไฟฟ้า) -> วิทย์ ป.6/1 + ป.6/2
    ('/games/science/circuit-builder.html', 'ว 2.3 ป.6/1'),
    ('/games/science/circuit-builder.html', 'ว 2.3 ป.6/2'),

    -- 56. food-chain (ห่วงโซ่อาหาร) -> วิทย์ ป.5/3 + วิทย์ ป.5/2
    ('/games/science/food-chain.html', 'ว 1.1 ป.5/3'),
    ('/games/science/food-chain.html', 'ว 1.1 ป.5/2'),

    -- 57. line-trace (ลากเส้นตามแบบ) -> ศิลปะ ป.4/3 + ศิลปะ ป.4/5
    ('/games/arts/line-trace/index.html', 'ศ 1.1 ป.4/3'),
    ('/games/arts/line-trace/index.html', 'ศ 1.1 ป.4/5'),

    -- 58. color-wheel (วงล้อสี) -> ศิลปะ ป.4/2 + ศิลปะ ป.4/7
    ('/games/arts/color-wheel/index.html', 'ศ 1.1 ป.4/2'),
    ('/games/arts/color-wheel/index.html', 'ศ 1.1 ป.4/7'),

    -- 59. thai-instruments (เครื่องดนตรีไทย) -> ศิลปะ ป.4/2 + ศิลปะ ป.4/1
    ('/games/arts/thai-instruments/index.html', 'ศ 2.1 ป.4/2'),
    ('/games/arts/thai-instruments/index.html', 'ศ 2.2 ป.4/1'),

    -- 60. rhythm-master (จังหวะดนตรี) -> ศิลปะ ป.4/3 + ศิลปะ ป.4/4
    ('/games/arts/rhythm-master/index.html', 'ศ 2.1 ป.4/3'),
    ('/games/arts/rhythm-master/index.html', 'ศ 2.1 ป.4/4'),

    -- 61. symmetry-art (เติมลายสมมาตร) -> ศิลปะ ป.4/3 + ศิลปะ ป.4/5
    ('/games/arts/symmetry-art.html', 'ศ 1.1 ป.4/3'),
    ('/games/arts/symmetry-art.html', 'ศ 1.1 ป.4/5'),

    -- 62. color-mix (ผสมสีให้ตรงเป้า) -> ศิลปะ ป.4/2 + ศิลปะ ป.4/9
    ('/games/arts/color-mix.html', 'ศ 1.1 ป.4/2'),
    ('/games/arts/color-mix.html', 'ศ 1.1 ป.4/9'),

    -- 63. globe-3d (ลูกโลก 3 มิติ) -> สังคม ป.4/1 + สังคม ป.4/2
    ('/games/social/globe-3d.html', 'ส 5.1 ป.4/1'),
    ('/games/social/globe-3d.html', 'ส 5.1 ป.4/2'),

    -- 64. social-quiz (สังคมรอบรู้) -> สังคม ป.4/1 + สังคม ป.4/1 (ส 4.3 ป.4/1)
    ('/games/social/social-quiz.html', 'ส 2.1 ป.4/1'),
    ('/games/social/social-quiz.html', 'ส 4.3 ป.4/1'),

    -- 65. handwash-order (ล้างมือ 7 ขั้น) -> สุขศึกษา ป.1/1 + วิทย์ ป.1/2
    ('/games/health/handwash-order.html', 'พ 4.1 ป.1/1'),

    -- 66. plate-builder (จัดจานสุขภาพ) -> สุขศึกษา ป.4/3 + สุขศึกษา ป.3/2
    ('/games/health/plate-builder.html', 'พ 4.1 ป.4/3'),
    ('/games/health/plate-builder.html', 'พ 4.1 ป.3/2')
) AS map(url, code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = map.url
 AND ehi.is_published = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = map.code
 AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

-- 340: W6 — map สื่อการสอน ↔ ตัวชี้วัด (indicator_games)
-- Idempotent: ON CONFLICT DO NOTHING · ไม่ทับ mapping ที่มีอยู่แล้ว

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (
  VALUES
    -- ป.4 batch 1 (336)
    ('/games/math/decimal-media.html', 'ค 1.1 ป.4/5'),
    ('/games/math/decimal-media.html', 'ค 1.1 ป.4/6'),
    ('/games/science/states-of-matter.html', 'ว 2.1 ป.4/3'),
    ('/games/science/states-of-matter.html', 'ว 2.1 ป.4/4'),
    ('/games/social/thailand-map.html', 'ส 5.1 ป.4/1'),
    ('/games/social/thailand-map.html', 'ส 5.1 ป.4/2'),
    ('/games/english/sight-words-p4.html', 'ต 1.1 ป.4/2'),
    -- ป.4 batch 2 (337)
    ('/games/thai/fact-opinion.html', 'ท 1.1 ป.4/4'),
    ('/games/thai/fact-opinion.html', 'ท 3.1 ป.4/1'),
    ('/games/math/bar-chart-media.html', 'ค 3.1 ป.4/1'),
    ('/games/social/good-citizen-media.html', 'ส 2.1 ป.4/1'),
    ('/games/science/vertebrate-sort.html', 'ว 1.3 ป.4/3'),
    ('/games/science/vertebrate-sort.html', 'ว 1.3 ป.4/4'),
    -- ป.4 batch 3 (338)
    ('/games/math/angle-media.html', 'ค 2.2 ป.4/1'),
    ('/games/math/angle-media.html', 'ค 2.2 ป.4/2'),
    ('/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/1'),
    ('/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/2'),
    ('/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/3'),
    ('/games/health/food-label-media.html', 'พ 4.1 ป.4/3'),
    ('/games/english/follow-instructions.html', 'ต 1.1 ป.4/1'),
    ('/games/english/follow-instructions.html', 'ต 1.1 ป.4/3'),
    -- M1 + S2 + O3 (339)
    ('/games/math/number-line-media.html', 'ค 1.1 ป.1/2'),
    ('/games/math/number-line-media.html', 'ค 1.1 ป.2/1'),
    ('/games/math/number-line-media.html', 'ค 1.1 ป.3/1'),
    ('/games/science/digestive-system-media.html', 'ว 1.2 ป.6/4'),
    ('/games/science/digestive-system-media.html', 'ว 1.2 ป.6/5'),
    ('/games/science/digestive-system-media.html', 'พ 1.1 ป.5/1'),
    ('/games/health/handwash-media.html', 'พ 4.1 ป.1/1'),
    ('/games/health/handwash-media.html', 'ว 1.2 ป.1/2'),
    -- สื่อเดิม + Sprint ต่อยอด (W6 ขยาย)
    ('/games/math/rounding.html', 'ค 1.1 ป.4/7'),
    ('/games/math/math-fraction-hub/index.html', 'ค 1.1 ป.4/13'),
    ('/games/math/math-fraction-hub/index.html', 'ค 1.1 ป.4/14'),
    ('/games/math/fraction-pieces.html', 'ค 1.1 ป.4/3'),
    ('/games/math/fraction-pieces.html', 'ค 1.1 ป.4/4'),
    ('/games/math/times-table.html', 'ค 1.1 ป.2/5'),
    ('/games/math/times-table.html', 'ค 1.1 ป.3/6'),
    ('/games/math/times-table.html', 'ค 1.1 ป.4/9'),
    ('/games/thai/thai-word-types.html', 'ท 4.1 ป.4/2'),
    ('/games/thai/thai-word-types.html', 'ท 4.1 ป.4/6'),
    ('/games/english/grammar-mini.html', 'ต 2.1 ป.4/1'),
    ('/games/thai/thai-sara-chart.html', 'ท 4.1 ป.1/1'),
    ('/games/thai/thai-sara-chart.html', 'ท 4.1 ป.2/1'),
    ('/games/science/water-cycle.html', 'ว 3.2 ป.5/3')
) AS map(url, code)
JOIN public.educational_hub_items ehi ON ehi.external_url = map.url
  AND ehi.is_published = true
  AND ehi.tracked_game = false
JOIN public.curriculum_indicators ci ON ci.indicator_code = map.code
  AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

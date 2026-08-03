-- 436: แก้ mapping ตัวชี้วัดโจทย์ปัญหา 4 ขั้น
-- ค 1.2 ป.4/1 ไม่มีในหลักสูตร (มีเฉพาะ ป.1/ป.3/ป.6) → ใช้ ค 1.1 ป.4/10 (บวกลบคูณหารระคน) แทน

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT item.id, indicator.id
FROM (VALUES
  ('/games/math/math-word-problem-media.html', 'ค 1.1 ป.4/10'),
  ('/games/math/math-word-problem-worksheet.html', 'ค 1.1 ป.4/10'),
  ('/games/math/math-word-problem-hub/index.html', 'ค 1.1 ป.4/10')
) AS mapping(item_url, indicator_code)
JOIN public.educational_hub_items item
  ON item.external_url = mapping.item_url
  AND item.is_published = true
JOIN public.curriculum_indicators indicator
  ON indicator.indicator_code = mapping.indicator_code
ON CONFLICT DO NOTHING;

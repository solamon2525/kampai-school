-- Migration 404: Rect Area Media -> Geometry Area Lab P.4-P.6 (v2.0.0)
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/rect-area-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN RAISE EXCEPTION 'item rect-area-media not found'; END IF;

  UPDATE public.educational_hub_items
  SET title = '📐 ห้องทดลองพื้นที่รูปเรขาคณิต',
      description = 'สื่อโต้ตอบพื้นที่รูปเรขาคณิต ป.4–6: 11 รูป สูตร ภาพ SVG ปรับขนาด โหมดโปรเจกเตอร์ แบบฝึกสุ่ม และพื้นที่เทียบเส้นรอบรูป',
      grade_levels = ARRAY['ป.4','ป.5','ป.6'],
      tags = ARRAY['พื้นที่','เรขาคณิต','รูปประกอบ','วงกลม','คณิตศาสตร์','โปรเจกเตอร์'],
      updated_at = now()
  WHERE id = v_item_id;

  UPDATE public.game_docs
  SET game_format = 'ห้องทดลองพื้นที่รูปเรขาคณิต ป.4–6',
      features = ARRAY[
        'รูปเรขาคณิต 11 ประเภทพร้อมสูตร',
        'เลือกเนื้อหาตามระดับ ป.4 ป.5 ป.6',
        'ภาพ SVG ปรับค่ามิติและคำนวณทันที',
        'ซูมภาพ 75–200% และโหมดโปรเจกเตอร์',
        'แบบฝึกกรอกคำตอบและสุ่มรูปพร้อมขนาด',
        'กริดนับช่องและพื้นที่เทียบเส้นรอบรูป'
      ],
      version = 'v2.0.0',
      notes = 'v2.0.0: ขยายจากสี่เหลี่ยมมุมฉากเป็น Area Lab ป.4–6 โดยคง URL เดิม',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;

INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
SELECT ehi.id, ci.id
FROM (VALUES
  ('ค 2.1 ป.4/3'),
  ('ค 2.1 ป.5/4'),
  ('ค 2.1 ป.6/2'),
  ('ค 2.1 ป.6/3')
) AS codes(code)
JOIN public.educational_hub_items ehi
  ON ehi.external_url = '/games/math/rect-area-media.html' AND ehi.is_published = true
JOIN public.curriculum_indicators ci
  ON ci.indicator_code = codes.code AND ci.is_active = true
ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

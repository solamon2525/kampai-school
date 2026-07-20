-- Migration 417: Add General Knowledge category and seed 3D print adhesion guide.
INSERT INTO public.educational_hub_categories
  (category_key, name, description, icon_name, color_class, sort_order, is_active)
VALUES
  ('general-knowledge', 'คลังความรู้ทั่วไป', 'บทความและคู่มือความรู้ที่นำไปใช้ได้ในชีวิตประจำวันและงานของโรงเรียน', 'BookOpen', 'success', 45, true)
ON CONFLICT (category_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  color_class = EXCLUDED.color_class,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

DO $$
DECLARE
  v_staff_id UUID;
  v_category_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'general-knowledge';

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  UPDATE public.educational_hub_items
  SET category_id = v_category_id,
      title = 'เทคนิคแก้ชิ้นงาน 3D ขนาดเล็กไม่ติดฐาน',
      description = 'คู่มือวิเคราะห์และแก้ปัญหาเลเยอร์แรกสำหรับ Bambu Lab A1 Mini และเครื่องพิมพ์ FDM แบบทีละขั้น พร้อมค่าตั้งต้นและเช็กลิสต์ก่อนพิมพ์',
      tags = ARRAY['3D Print', 'Bambu Lab', 'A1 Mini', 'Bambu Studio', 'ชิ้นงานไม่ติดฐาน', 'เทคโนโลยี'],
      subject = 'เทคโนโลยี',
      is_published = true,
      corner_badge = 'คู่มือใหม่',
      build_version = '1.0.0',
      build_updated_at = now(),
      updated_at = now()
  WHERE owner_staff_id = v_staff_id
    AND external_url = '/knowledge/3d-print-small-part-adhesion/';

  IF NOT FOUND THEN
    INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    external_url, tags, grade_levels, subject, sort_order, is_published,
    tracked_game, corner_badge, build_version, build_updated_at
  ) VALUES (
    v_staff_id,
    v_category_id,
    'link',
    'เทคนิคแก้ชิ้นงาน 3D ขนาดเล็กไม่ติดฐาน',
    'คู่มือวิเคราะห์และแก้ปัญหาเลเยอร์แรกสำหรับ Bambu Lab A1 Mini และเครื่องพิมพ์ FDM แบบทีละขั้น พร้อมค่าตั้งต้นและเช็กลิสต์ก่อนพิมพ์',
    '/knowledge/3d-print-small-part-adhesion/',
    ARRAY['3D Print', 'Bambu Lab', 'A1 Mini', 'Bambu Studio', 'ชิ้นงานไม่ติดฐาน', 'เทคโนโลยี'],
    ARRAY[]::TEXT[],
    'เทคโนโลยี',
    0,
    true,
    false,
    'คู่มือใหม่',
    '1.0.0',
    now()
    );
  END IF;
END $$;

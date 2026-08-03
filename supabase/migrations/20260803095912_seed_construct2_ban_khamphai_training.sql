-- เพิ่มคู่มือ Construct 2 เป็นรายการใหม่ โดยไม่แก้ไขรายการเดิม
DO $$
DECLARE
  v_staff_id UUID;
  v_category_id UUID;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff WHERE username = 'nattapong' LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff username "nattapong" not found'; END IF;
  INSERT INTO public.educational_hub_categories
    (category_key, name, description, icon_name, color_class, sort_order, is_active)
  VALUES ('training', 'คู่มือ / อบรม', 'คู่มือและเนื้อหาสำหรับพัฒนาทักษะ', 'GraduationCap', 'success', 50, true)
  ON CONFLICT (category_key) DO NOTHING;
  SELECT id INTO v_category_id FROM public.educational_hub_categories WHERE category_key = 'training';
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, thumbnail_url, external_url, tags, grade_levels, subject, sort_order, is_published)
  SELECT v_staff_id, v_category_id, 'link', 'Construct 2 บ้านคำไผ่',
    'คู่มือสร้างเกมแบบจับมือทำ 8 บท ตั้งแต่ระบบพื้น ตัวละคร พลังชีวิต มอนสเตอร์ ไปจนถึงโจทย์คณิต พร้อมเช็กลิสต์ที่ติ๊กได้จริง',
    '/training/construct2-ban-khamphai/cover.svg', '/training/construct2-ban-khamphai/',
    ARRAY['Construct 2', 'สร้างเกม', 'คู่มือ', 'Event Sheet'], ARRAY['ครู', 'บุคลากร'], 'เทคโนโลยี', 10, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/training/construct2-ban-khamphai/'
  );
END $$;

-- Promote the synthetic lesson-packs entry to a normal, globally sortable
-- Educational Hub category. Its content continues to come from lesson_packs.
INSERT INTO public.educational_hub_categories (
  category_key,
  name,
  description,
  icon_name,
  color_class,
  sort_order,
  is_active
)
VALUES (
  'lesson-packs',
  'ชุดเรียนพร้อมสอน',
  'สื่อ ใบงาน และเกมที่จัดเป็นชุดพร้อมใช้ในชั้นเรียน',
  'Package',
  'primary',
  0,
  true
)
ON CONFLICT (category_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  color_class = EXCLUDED.color_class,
  is_active = true;

-- Migration 496: seed Everyday Conversation teaching media for English Grade 4
DO $$
DECLARE
  v_staff_id UUID;
  v_category_id UUID;
  v_item_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'teaching staff owner not found';
  END IF;

  SELECT id INTO v_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'media' AND is_active = true
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'active media category not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO UPDATE SET is_hub_active = true;

  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id,
    v_category_id,
    'link',
    '🗣️ Everyday Conversation ป.4',
    'สื่อฝึกพูดถาม-ตอบภาษาอังกฤษ ป.4 จำนวน 30 บทใน 6 สถานการณ์ ครูนำฟังทีละประโยคหรือทั้งบท แล้วจับคู่สลับบท A/B พร้อมคำอ่านและคำแปลที่ซ่อนได้',
    '/games/english/everyday-conversation-p4-media.html',
    '/games/english/everyday-conversation-p4-media-cover.png',
    'ภาษาอังกฤษ',
    ARRAY['ป.4'],
    ARRAY['บทสนทนา','ฝึกพูด','ถามตอบ','ภาษาอังกฤษ','role play'],
    COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = v_category_id), 1),
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id
      AND external_url = '/games/english/everyday-conversation-p4-media.html'
  );

  UPDATE public.educational_hub_items
  SET category_id = v_category_id,
      title = '🗣️ Everyday Conversation ป.4',
      description = 'สื่อฝึกพูดถาม-ตอบภาษาอังกฤษ ป.4 จำนวน 30 บทใน 6 สถานการณ์ ครูนำฟังทีละประโยคหรือทั้งบท แล้วจับคู่สลับบท A/B พร้อมคำอ่านและคำแปลที่ซ่อนได้',
      thumbnail_url = '/games/english/everyday-conversation-p4-media-cover.png',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4'],
      tags = ARRAY['บทสนทนา','ฝึกพูด','ถามตอบ','ภาษาอังกฤษ','role play'],
      tracked_game = false,
      is_published = true,
      updated_at = now()
  WHERE owner_staff_id = v_staff_id
    AND external_url = '/games/english/everyday-conversation-p4-media.html'
  RETURNING id INTO v_item_id;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'everyday conversation media item not found after upsert';
  END IF;

  INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
  SELECT v_item_id, indicator.id
  FROM public.curriculum_indicators indicator
  WHERE indicator.indicator_code = ANY (ARRAY[
    'ต 1.1 ป.4/4',
    'ต 1.2 ป.4/1',
    'ต 1.2 ป.4/2',
    'ต 1.2 ป.4/3',
    'ต 1.2 ป.4/4',
    'ต 1.2 ป.4/5',
    'ต 4.1 ป.4/1'
  ])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'สื่อครูนำและจับคู่บทบาท A/B สำหรับฝึกพูดบทสนทนาภาษาอังกฤษ ป.4 โดยไม่เก็บคะแนน',
    ARRAY[
      '30 บทสนทนา 120 ช่วงพูดใน 6 สถานการณ์ใกล้ตัว',
      'ครูกดฟังทีละประโยคหรือเล่นทั้งบทพร้อมไฮไลต์ผู้พูด',
      'โหมดจับคู่ A/B พร้อมสลับบทฝั่งซ้ายและขวา',
      'เปิดหรือปิดคำอ่านไทยและคำแปลได้แยกกัน',
      'รองรับเต็มจอ มือถือ แท็บเล็ต และจอห้องเรียน',
      'ไม่มีเสียงอัตโนมัติและไม่ใช้ไมโครโฟน'
    ],
    'v1.0.0',
    'สร้างจากตัวชี้วัดภาษาอังกฤษ ป.4 ใน integrated-plan: ต 1.1 ป.4/4, ต 1.2 ป.4/1-5 และ ต 4.1 ป.4/1'
  )
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

-- Migration 314: Seed "Multiply Burst" AR Game (multiply-burst)
-- วิชาคณิตศาสตร์ — ฝึกสูตรคูณตาไวด้วยลูกโป่งตัวเลข (จิ้ม/แตะคำตอบ)
-- Path:  public/games/math/multiply-burst/index.html
-- Slug:  multiply-burst

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/multiply-burst/index.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff not found';
  END IF;

  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category games not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link',
    '✖️ สูตรคูณตาไว (Multiply Burst)', v_url, 'คณิตศาสตร์', 11
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug     = 'multiply-burst',
      tracked_game  = true,
      is_published  = true,
      thumbnail_url = '/games/math/multiply-burst/cover.png',
      bgm_preset    = 'playful',
      updated_at    = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item multiply-burst not found after seed';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'AR Balloon Popper — ฝึกสูตรคูณตาไวด้วยลูกโป่งตัวเลข จิ้มนิ้วหรือแตะหน้าจอเลือกคำตอบ',
    ARRAY[
      'โจทย์สูตรคูณแบบ 2×9=? แสดงบนจอตลอดเกม ตารางคูณ 2–9',
      'ลูกโป่งตัวเลขลอยขึ้นมา — จิ้มคำตอบถูก +10 คะแนน · จิ้มผิด -5 คะแนน (เวลา 60 วินาที)',
      'เสียงตอบถูก: ไดอะลอกสั้นภาษาไทย (TTS) · ตอบผิด: เสียงบิ้ว buzz ผ่าน KAMPAI SDK',
      'KampaiHands engine — ติดตามปลายนิ้วชี้ผ่านกล้อง + fallback แตะสัมผัส',
      'โหมดแข่ง 2 คน (KampaiVersus) · บันทึกคะแนนและตารางอันดับพอร์ทัล'
    ],
    'v1.0.0',
    'สำเนาและดัดแปลงจาก balloon-burst — เปลี่ยนเป็นเกมคณิตศาสตร์สูตรคูณตาไว'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

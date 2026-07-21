-- Migration 420: Seed "Divide by 2 Quick" game (divide-by-2)
-- วิชาคณิตศาสตร์ — ฝึกหาร 2 ในใจให้คล่อง (quiz 4 ตัวเลือก + combo + แข่งเวลา)
-- Path:  public/games/math/divide-by-2/index.html
-- Slug:  divide-by-2

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/math/divide-by-2/index.html';
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
    '➗ หารเร็วในใจ (Divide by 2)', v_url, 'คณิตศาสตร์', 420
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug     = 'divide-by-2',
      tracked_game  = true,
      is_published  = true,
      thumbnail_url = '/games/math/divide-by-2/cover.png',
      bgm_preset    = 'playful',
      updated_at    = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item divide-by-2 not found after seed';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'Quiz Race — ฝึกหาร 2 ในใจ โจทย์แบบ N ÷ 2 = ? เลือก 4 ตัวเลือก ตอบเร็วได้โบนัส',
    ARRAY[
      'โจทย์ตัวเลขคู่หาร 2 ลงตัว — 3 ระดับ: ง่าย (ป.2) / กลาง (ป.3) / ยาก (ป.4+)',
      'โหมดแข่ง 60 วินาที + โหมดฝึกไม่จับเวลา · แถบเวลาต่อข้อ ยากขึ้นเรื่อย ๆ',
      'คอมโบตอบถูกติดกัน x2/x3 คะแนน · ตอบเร็วได้โบนัส ⚡',
      'KampaiVersus: เดี่ยว + 2 คนเครื่องนี้ + ออนไลน์ · KAMPAI SDK score/leaderboard/TTS',
      'เตรียมต่อ: สื่อการสอน + ใบงานพิมพ์ (divide-by-2-worksheet)'
    ],
    'v1.0.0',
    'เกมหารเร็วในใจ — เน้นหาร 2 คิดในใจ คล้ายเกมสูตรคูณ (multiply-race)'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();

END $$;

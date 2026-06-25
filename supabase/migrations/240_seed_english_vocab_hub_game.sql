-- Migration 240: Seed English vocab-hub
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path:  public/games/english/vocab-hub.html
-- Slug:  vocab-hub
-- Idempotent: re-run safe

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_item_id   UUID;
  v_url       TEXT := '/games/english/vocab-hub.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link',
    '📖 คลังคำศัพท์ภาษาอังกฤษ (Vocab Hub)', v_url, 'ภาษาอังกฤษ', 5
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'vocab-hub', tracked_game = true, is_published = true,
      thumbnail_url = '/games/english/vocab-hub-cover.png', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
  IF v_item_id IS NULL THEN RAISE EXCEPTION 'item vocab-hub not found'; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id, v_staff_id,
    'คลังคำศัพท์ภาษาอังกฤษ 25 หมวดหมู่ ~280 คำ',
    ARRAY[
      '25 หมวดคำศัพท์: ตัวเลข สี วัน เดือน ตัวอักษร สัตว์ ผลไม้ ร่างกาย รูปทรง ครอบครัว อาหาร อาชีพ อากาศ กริยา เสื้อผ้า ห้องเรียน บ้าน ของเล่น ยานพาหนะ กีฬา สถานที่ ดนตรี ผัก',
      'โหมดฝึก: Auto Flash Choice Match Listen Spell Timed TypeIn TrueFalse FlipRace WordSearch Online',
      'เสียงอ่าน EN+TH ผ่าน Web Speech API + Selective Mute per-word',
      'Starred Words deck พิเศษ บันทึก localStorage',
      'Student Banner: ชื่อ Lv XP เล่นกี่ครั้ง คะแนนสูงสุด KAMPAI SDK',
      'Leaderboard top-5 ในหน้า Hub',
      'submitScore ทุก mode + XP Win Screen + Personal Best badge',
      'โหมดออนไลน์ Live ผ่าน KampaiMatch'
    ],
    'v2.0.0',
    'v2.0.0: Student Banner Leaderboard Personal-Best XP-Result Selective-Mute Starred-Words Thai-TTS'
  )
  ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features    = EXCLUDED.features,
      version     = EXCLUDED.version,
      notes       = EXCLUDED.notes,
      updated_at  = now();
END $$;
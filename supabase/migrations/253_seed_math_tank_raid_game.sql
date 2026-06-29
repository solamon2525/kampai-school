-- ============================================================================
-- Migration 253: Math Tank Raid (math-tank-raid) — แทน Tank Commander
-- ============================================================================
-- เกมใหม่: รถถังจอมคณิต ป.3-4 คูณ หาร เศษส่วน — ไม่มีควิซ popup
-- ปิด tank-commander เดิม (วิทยาการคำนวณ)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/math-tank-raid.html';
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
    '🛡️ Math Tank Raid — รถถังจอมคณิต ป.3-4', v_url, 'คณิตศาสตร์', 253
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'math-tank-raid',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/math-tank-raid-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  UPDATE public.educational_hub_items
  SET is_published = false,
      updated_at = now()
  WHERE owner_staff_id = v_staff_id
    AND external_url = '/games/tech/tank-commander.html';

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Top-down Tank Shooter + ลูกโป่งคำตอบคณิต (คูณ หาร เศษส่วน ป.3-4)',
         ARRAY[
           'ขับรถถัง WASD/จอย · เล็งยิง/ชนลูกโป่งคำตอบ — ไม่หยุดเกมด้วย popup ควิซ',
           'โจทย์: คูณ หาร ตาราง 2-9 · เศษส่วนง่าย (1/2 ของ n, 2/4 = 1/2)',
           'หลบศัตru + เก็บ ❤️🛡️🪙 · Wave ยากขึ้นทุก 5 ข้อถูก · คอมโบคะแนน',
           'KampaiVersus 90s · KAMPAI SDK score/leaderboard'
         ],
         'v1.0.0',
         'Math Tank Raid แทน Tank Commander — คณิต ป.3-4 (migration 253)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

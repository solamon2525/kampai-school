-- ============================================================================
-- Migration 207: Seed "Tank Commander : Learning Edition" (tank-commander)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/tech/tank-commander.html
-- Cover: public/games/tech/tank-commander-cover.svg
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/tech/tank-commander.html';
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- 2. Resolve games category
  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found';
  END IF;

  -- 3. Ensure profile is active
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  -- 4. Seed item
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'Tank Commander : Learning Edition', v_url, 'เทคโนโลยี', 75
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET game_slug = 'tank-commander',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/tech/tank-commander-cover.svg',
      bgm_preset = 'bright',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมขับรถถังต่อสู้แนวแอ็คชั่น 2D ผสมผสานควิซตอบคำถามวิชาวิทยาการคำนวณและคิดเชิงคำนวณ',
         ARRAY[
           'ควบคุมรถถังด้วยปุ่ม WASD และเล็งยิงด้วยเมาส์ หรือปุ่มจอยสติ๊กสัมผัสบนมือถือ',
           'ระบบต่อสู้กับรถถังศัตรู 5 ชนิด: Basic, Fast, Heavy, Sniper, Hacker (EMP)',
           'การท้าทายความรู้ด้วยควิซคำถามวิชาวิทยาการคำนวณทุกๆ 10 ศัตรูที่เอาชนะได้',
           'ระดับคำถามปรับเปลี่ยนความยากอัตโนมัติ (Adaptive Learning) ตามคะแนนตอบถูกหรือผิด',
           'การอัปเกรดความสามารถรถถัง (Damage, Speed, Armor, Shield) และสายทักษะ (Assault, Engineer, Cyber Commander)',
           'การต่อสู้กับบอสประจำด่านทั้ง 4 ด่าน (CPU Destroyer, Data Corruptor, Logic Commander, Cyber Hacker King)',
           'รายงานวิเคราะห์ผลการเรียนรู้และคำแนะนำรายบุคคลหลังจบเกม (Personalized Analytics Report)'
         ],
         'v1.0.0',
         'สร้างเกมครั้งแรก'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

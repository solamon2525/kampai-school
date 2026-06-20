-- ============================================================================
-- Migration 210: Seed "CyberDrop: Tech Vocab Hand Tracking" (cyberdrop)
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Path: public/games/tech/cyberdrop.html
-- Cover: public/games/tech/cyberdrop-cover.png
-- Idempotent: re-run keeps count stable
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/tech/cyberdrop.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'CyberDrop: Tech Vocab Hand Tracking', v_url, 'เทคโนโลยี', 77
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. Update settings
  UPDATE public.educational_hub_items
  SET game_slug = 'cyberdrop',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/tech/cyberdrop-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. Seed game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมฝึกทักษะและคำศัพท์เทคโนโลยีภาษาอังกฤษโดยการตรวจจับตำแหน่งและการเคลื่อนไหวของมือในการตอบคำถาม',
         ARRAY[
           'ควบคุมการเล่นผ่านกล้องเว็บแคมด้วยเทคโนโลยีปัญญาประดิษฐ์ MediaPipe Hands ตรวจจับตำแหน่งและท่าทางมือ',
           'ระบบท่าทาง จีบนิ้วชี้และนิ้วโป้ง (Pinch Gesture) เพื่อกดยืนยันเลือกคำตอบด้านล่างจอภาพ',
           'ระดับความเร็วและโจทย์คำศัพท์เทคโนโลยีสารสนเทศ 3 ด่าน (ฮาร์ดแวร์พื้นฐาน, ชิ้นส่วนภายใน, ซอฟต์แวร์และเน็ตเวิร์ก)',
           'ระบบสะสมคอมโบ (Combo multiplier) เพื่อเพิ่มคะแนนทวีคูณเมื่อตอบถูกติดต่อกัน',
           'ระบบเสียงแบบสังเคราะห์ (Synth) และดนตรีประกอบเข้ากับธีม Cyberpunk ล้ำยุค',
           'รองรับระบบบอร์ดคะแนนอันดับสูงสุดของห้องเรียน (Leaderboard) และประวัตินักเรียน'
         ],
         'v1.0.0',
         'สร้างเกมเทคโนโลยีจับการเคลื่อนไหวมือครั้งแรก'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

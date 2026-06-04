-- 125_seed_symmetry_art_game.sql
-- เกม "เติมลายสมมาตร" (symmetry-art) — วิชาศิลปะ ป.4-6 (Symmetry Art)
-- โชว์ลายครึ่งหนึ่ง (ล็อกสี) → เลือกสีแล้วแตะเติมอีกครึ่งให้สะท้อนกระจกสมมาตร (แนวตั้ง/แนวนอน) → กด "ตรวจ"
-- 12 ลาย 3 ระดับ: ง่าย (หัวใจ/ต้นไม้/บ้าน/เพชร) · กลาง (ผีเสื้อ/ดอกไม้/ว่าว/เห็ด) · ยาก (ปลา/ผีเสื้อใหญ่/ใบไม้/มงกุฎ)
-- public/games/arts/symmetry-art.html (KAMPAI SDK)
-- Idempotent: re-run แล้วจำนวนไม่เพิ่ม (NOT EXISTS guard) + sync flags/thumbnail/bgm ทุกครั้ง
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/arts/symmetry-art.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found — seed staff first';
  END IF;

  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION 'category "games" not found — migration 061 must run first';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', 'เติมลายสมมาตร', v_url, 'ศิลปะ', 21
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'symmetry-art', tracked_game = true, is_published = true,
      thumbnail_url = '/games/arts/symmetry-art-cover.svg', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;
END $$;

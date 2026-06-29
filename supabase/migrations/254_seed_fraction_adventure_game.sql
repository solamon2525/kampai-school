-- ============================================================================
-- Migration 254: Fraction Adventure (fraction-adventure)
-- ============================================================================
-- เกมใหม่: ผจญภัยเศษส่วน ป.4 (บวกเศษส่วนมีทั้งส่วนเท่ากันและไม่เท่ากัน โจทย์ปัญหา และ AR)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/fraction-adventure.html';
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
    '🍕 ผจญภัยเศษส่วน ป.4 — Fraction Adventure', v_url, 'คณิตศาสตร์', 254
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'fraction-adventure',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/fraction-adventure-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมการเรียนรู้เรื่องเศษส่วน ป.4 (Like/Unlike Denominators, Word Problems, AR Mode)',
         ARRAY[
           'โหมดเศษส่วนเท่ากัน (Like Denominators) - บวกเลขเศษ ส่วนคงเดิม',
           'โหมดเศษส่วนไม่เท่ากัน (Unlike Denominators) - แสดงการหา ค.ร.น. และตัวคูณร่วมทีละสเต็ป',
           'โหมดโจทย์ปัญหา (Word Problems) - สถานการณ์แบ่งเค้ก อ่านหนังสือ ริบบิ้น ภาษาไทยน่ารักๆ',
           'โหมด AR (MediaPipe Hands) - ตรวจจับนิ้วชี้และท่า Pinch (จีบ) เพื่อตอบปุ่มตัวเลขบนหน้าจอเสมือน',
           'มีสรุปผลสถิติเป็น Chart.js Pie Chart และระบบ Canvas Certificate ดาวน์โหลดรูปภาพได้ทันที'
         ],
         'v1.0.0',
         'ผจญภัยเศษส่วน ป.4 (migration 254)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

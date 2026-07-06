-- ============================================================================
-- Migration 366: Fraction Tank Battle (fraction-tank)
-- ============================================================================
-- เกมใหม่: ศึกรถถังพิชิตน่านฟ้าเศษส่วน ป.3-6
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/fraction-tank/index.html';
BEGIN
  -- 1. ค้นหา staff_id ของครูณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff ครูณัฐพงศ์ สิงห์ชมภู not found'; END IF;

  -- 2. ค้นหา category_id ของ category 'games'
  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  -- 3. ยืนยันว่า profile มีการทำรายการ
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- 4. แทรก/สร้างแถวใน educational_hub_items
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link',
    '🚀 Fraction Tank Battle — ศึกรถถังพิชิตน่านฟ้าเศษส่วน', v_url, 'คณิตศาสตร์', 366
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- 5. อัปเดตข้อมูล slug, thumbnail, tracking
  UPDATE public.educational_hub_items
  SET game_slug = 'fraction-tank',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/fraction-tank/cover.png',
      bgm_preset = 'cheerful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 6. แทรก/อัปเดตรายละเอียดใน game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Horizontal/Arcade Canvas Tank Shooter + โจทย์เปรียบเทียบเศษส่วน (> หรือ <)',
         ARRAY[
           'ควบคุมรถถังเคลื่อนที่ซ้าย-ขวา ยิงกระสุนวิถีโค้งตามแรงลมและแรงโน้มถ่วง',
           'ยิงสิ่งมีชีวิตลอยฟ้า (กริฟฟอน ไวเวิร์น ค้างคาว) ที่ถือเศษส่วนตรงตามเงื่อนไขเปรียบเทียบที่ภารกิจกำหนด',
           'มีระบบเก็บเสบียงกล่องร่มชูชีพ (กระสุนหลัก, มิสไซล์นำวิถียิง 2 นัดพร้อมกัน, และพลังชีวิต)',
           'ยิงบอลลูนสีเพื่อรับเสบียงช่วยเหลือ และเผชิญหน้ากับรถถังศัตรูรวมถึงบอสรถถังขนาดใหญ่',
           'เชื่อมโยง KAMPAI SDK สำหรับตารางอันดับผู้นำ บันทึกคะแนน และเก็บสถิติผู้เล่นสำเร็จ'
         ],
         'v1.0.0',
         'ศึกรถถังพิชิตน่านฟ้าเศษส่วน ป.3-6 (migration 366)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

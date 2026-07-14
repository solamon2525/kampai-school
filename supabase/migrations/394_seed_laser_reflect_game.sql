-- ============================================================================
-- Migration 394: Laser Reflect (laser-reflect)
-- ============================================================================
-- เกมใหม่: ลำแสงสะท้อนเรขาคณิต คณิต ป.4-6 (พิกัด X, Y และมุมสะท้อน)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/math/laser-reflect/index.html';
BEGIN
  -- ดึงข้อมูลพนักงาน ณัฐพงศ์
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  -- ดึง category id สำหรับเกม
  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  -- สร้างโปรไฟล์ hub หากยังไม่มี
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- เพิ่ม item ใหม่
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link',
    '📐 Laser Reflect — พิกัดวิถีสะท้อนเลเซอร์', v_url, 'คณิตศาสตร์', 394
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'laser-reflect',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/laser-reflect/cover.png',
      bgm_preset = 'calm',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ลงทะเบียนข้อมูลในตาราง game_docs (ตามกฎบังคับรายละเอียดเกม)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         '2D Coordinate Grid / Laser Raycasting Reflection Puzzle',
         ARRAY[
           'อ่านและวิเคราะห์ตำแหน่งพิกัด (X, Y) บนตารางพิกัดฉาก 2 มิติ',
           'ฝึกคำนวณและกะประมาณทฤษฎีมุมสะท้อน (มุมตกกระทบ = มุมสะท้อน)',
           'การวางแผนวิถีสะท้อนเลเซอร์เชิงเรขาคณิต (Spatial Reasoning)',
           'เชื่อมต่อระบบบันทึกคะแนนและกระดานอันดับผู้นำร่วมกับ KAMPAI SDK'
         ],
         'v1.0.0',
         'ลำแสงสะท้อนเรขาคณิต ป.4-6 (migration 394)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

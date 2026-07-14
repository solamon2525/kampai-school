-- ============================================================================
-- Migration 395: Code Craft (code-craft)
-- ============================================================================
-- เกมใหม่: วิศวกรโค้ดดิ้งหุ่นยนต์ เทคโนโลยี ป.4-6 (Sequence, If-Else, Loop)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/tech/code-craft/index.html';
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
    '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', v_url, 'เทคโนโลยี', 395
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'code-craft',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/tech/code-craft/cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ลงทะเบียนข้อมูลในตาราง game_docs (ตามกฎบังคับรายละเอียดเกม)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         '2D Grid / Blockly-like Visual Command Puzzle',
         ARRAY[
           'เขียนบล็อกคำสั่งควบคุมการทำงานของหุ่นยนต์คัดแยกพัสดุในคลังสินค้า',
           'ศึกษาหลักการลำดับคำสั่ง (Sequence), เงื่อนไข (If-Else), และการวนลูป (Loop)',
           'ตัวประเมินคำสั่งรันทีละขั้นตอน (Step-by-step Visual Interpreter) เพื่อตรวจดีบั๊ก',
           'จำกัดโควตาบรรทัดคำสั่งในแต่ละด่านเพื่อกระตุ้นวิธีคิดเชิงขั้นตอนและการย่อโค้ด'
         ],
         'v1.0.0',
         'วิศวกรโค้ดดิ้งหุ่นยนต์ วิทยาการคำนวณ ป.4-6 (migration 395)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

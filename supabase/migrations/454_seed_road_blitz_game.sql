-- ============================================================================
-- Migration 454: Road Blitz (road-blitz)
-- ============================================================================
-- เกมใหม่: 🏎️ Road Blitz — Arcade Highway Racer (Famicom 2D Pixel Art)
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/tech/road-blitz/index.html';
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
    '🏎️ Road Blitz — ซิ่งทางหลวง 8-Bit', v_url, 'เทคโนโลยี', 454
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'road-blitz',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/tech/road-blitz/cover.png',
      bgm_preset = 'retro',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ลงทะเบียนข้อมูลในตาราง game_docs (ตามกฎบังคับรายละเอียดเกม)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         '2D Vertical Scrolling Arcade Racer (Famicom 8-Bit Pixel Art)',
         ARRAY[
           'ควบคุมรถสปอร์ตสีแดงซิ่งหลบแท็กซี่ รถซีดาน และรถบรรทุกสินค้าหนัก',
           'ระบบจัดการถังน้ำมันเชื้อเพลิง (Fuel Anxiety Loop) ต้องคอยเก็บถังน้ำมันสีแดงเพื่อวิ่งต่อ',
           'เปลี่ยนฉากกลางวัน (Day Sunset Freeway) สู่ฉากกลางคืน (Night Cyber Highway) เมื่อถึงระยะทาง 10 KM',
           'รองรับการเล่นแข่ง 2 คน (Versus Mode) ทั้งแบบเครื่องเดียวกัน (Hot-seat) และแบบออนไลน์'
         ],
         'v1.0.0',
         'Road Blitz Arcade Highway Racer (migration 454)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

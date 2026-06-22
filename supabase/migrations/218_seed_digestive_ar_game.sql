-- 218_seed_digestive_ar_game.sql
-- เกม "Digestive System AR Explorer" — วิทยาศาสตร์ ป.4-6 ระบบย่อยอาหาร
-- ไฟล์: public/games/science/digestive-ar/ (โฟลเดอร์ 5 ไฟล์)
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/science/digestive-ar/index.html';
BEGIN
  -- ดึงข้อมูลครูผู้สอน ณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found'; END IF;

  -- ดึง category id สำหรับเกม
  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category "games" not found (migration 061)'; END IF;

  -- บันทึก educational_hub_profile หากยังไม่มี
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- เพิ่มตัวไอเท็มเกมหากยังไม่มี
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '🧬 Digestive System AR Explorer ระบบย่อยอาหารมหัศจรรย์', v_url, 'วิทยาศาสตร์', 218
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มเกม
  UPDATE public.educational_hub_items
  SET game_slug = 'digestive-ar', tracked_game = true, is_published = true,
      thumbnail_url = '/games/science/digestive-ar/cover.svg', bgm_preset = 'calm', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'จำลองลากวางอวัยวะระบบย่อยอาหารด้วยมือผ่านกล้อง AR หรือการสัมผัส',
         ARRAY[
           'วิชาวิทยาศาสตร์ ป.4-6 เรื่องหน้าที่และส่วนประกอบของระบบย่อยอาหาร',
           'ระบบปฏิสัมพันธ์ AR (มือจำลอง + โหมดสัมผัส) ตรวจจับความใกล้ระหว่างนิ้วชี้และนิ้วโป้ง (Pinch gesture)',
           'การเชื่อมต่อจุดอวัยวะกับ Drop Zones ด้วยการลากวาง (Drag & Drop)',
           'เชื่อมต่อระบบเสียงเอฟเฟกต์และดนตรีประกอบผ่าน KAMPAI SDK',
           'บันทึกคะแนนสูงสุดและสถิติการเล่นลงในระบบ Leaderboard และ Local Storage อัจฉริยะ',
           'รองรับการออกแบบ Responsive ปรับขนาดตามหน้าจอมือถือ แท็บเล็ต และเดสก์ท็อป',
           'มีระบบฝุ่นอนุภาคเรืองแสง (Particles) และพลุกระดาษฉลองเมื่อจัดระเบียบครบถ้วน'
         ],
         'v1.0.0',
         'นำเข้าเกมใหม่ — Digestive System AR Explorer ระบบย่อยอาหารมหัศจรรย์ ป.4-6'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

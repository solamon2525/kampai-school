-- 597_seed_math_survivors_game.sql
-- ลงทะเบียนเกม Math Survivors (Roguelite แนว Vampire Survivors คณิตศาสตร์ ป.4-ป.6)
DO $$
DECLARE
  v_staff_id UUID;
  v_cat_games UUID;
  v_url TEXT := '/games/math/math-survivors/index.html';
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
  SELECT v_staff_id, v_cat_games, 'link', 'อารีนาคณิตศาสตร์ ป.4-ป.6', v_url, 'math', 999
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'math-survivors',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/math/math-survivors/cover.png',
      bgm_preset = 'playful',
      game_play_style = 'roguelite-survivors',
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Roguelite Auto-Shooter แนว Vampire Survivors คณิตศาสตร์ ป.4–ป.6',
         ARRAY[
           'ระบบเอาชีวิตรอด Roguelite 3 องก์ (ป.4 บวกลบคูณหารพื้นฐาน / ป.5 คูณหาร-ระคนวงเล็บ / ป.6 สมการและลำดับคำนวณ) พร้อมบอสประจำองก์',
           'อาวุธเวทมนตร์ยิงอัตโนมัติ 5 ชนิด (คทาประกายดาว, วงแหวนพาย, สายฟ้าสมการ, จักรเศษส่วน, คลื่นระเบิดคูณสิบ) และสกิลเสริม 4 ชนิด ปลดล็อกผ่าน Level-Up Draft 3 การ์ด',
           'แมคคานิกลูกแก้วสมการแบบเรียลไทม์: ชนคำตอบที่ถูกเพื่อจุดระเบิด Super Math Nova ล้างฝูง + ฮีล HP + คอมโบโบนัส; ชนคำตอบผิดเสีย HP พร้อมป้ายเฉลยวิธีคิด',
           'ระบบ Seed ประจำวัน / สุ่มใหม่ แยก Run State และ Profile Unlocks + ซินธิไซเซอร์ Chiptune 8-bit WebAudio',
           'รองรับ 3 โหมดผ่าน KampaiVersus (เดี่ยว · 2 คนเครื่องเดียว · ออนไลน์) พร้อมโหมดฝึกซ้อมและจอยสติ๊กสัมผัสมือถือ'
         ],
         'v1.0.0',
         'สร้างครั้งแรก; ลูกแก้วโจทย์ถูก +150 (+คอมโบสูงสุด +100) + ฮีล 15 HP, กำจัดมอนสเตอร์ +12..+40, โค่นบอส +350, จบฝึกซ้อมไม่บันทึกคะแนน'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;

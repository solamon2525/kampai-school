-- 466_seed_solar_system_3d_media.sql
-- สื่อการสอน "🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)" — วิทยาศาสตร์และดาราศาสตร์ ป.4-6 (ว 3.1)
-- ไฟล์: public/games/science/solar-system-3d-media.html + cover PNG 16:9 1280x720
-- Idempotent: re-run ไม่เพิ่มซ้ำ + sync flags + game_docs

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_media UUID;
  v_url       TEXT := '/games/science/solar-system-3d-media.html';
BEGIN
  -- ดึงข้อมูลครูผู้สอน ณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found'; END IF;

  -- ดึง category id สำหรับสื่อการสอน (media)
  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media';
  IF v_cat_media IS NULL THEN RAISE EXCEPTION 'category "media" not found (migration 061)'; END IF;

  -- บันทึก educational_hub_profile หากยังไม่มี
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  -- เพิ่มตัวไอเท็มสื่อการสอนหากยังไม่มี
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)',
    'สื่อการสอนดาราศาสตร์ 3 มิติ สำรวจดาวเคราะห์ 8 ดวง ผ่าดูโครงสร้างภายใน ข้างขึ้น-ข้างแรม จำลองความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่าน',
    v_url,
    'วิทยาศาสตร์',
    ARRAY['ป.4','ป.5','ป.6']::text[],
    ARRAY['science','space','solar-system','3d','astronomy','media','planets']::text[],
    466, false, true,
    '/games/science/solar-system-3d-media-cover.png',
    'v1.0.0', now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  -- อัปเดตข้อมูลรายละเอียดไอเท็มสื่อ
  UPDATE public.educational_hub_items
  SET title = '🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)',
      description = 'สื่อการสอนดาราศาสตร์ 3 มิติ สำรวจดาวเคราะห์ 8 ดวง ผ่าดูโครงสร้างภายใน ข้างขึ้น-ข้างแรม จำลองความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่าน',
      external_url = v_url,
      subject = 'วิทยาศาสตร์',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['science','space','solar-system','3d','astronomy','media','planets']::text[],
      thumbnail_url = '/games/science/solar-system-3d-media-cover.png',
      tracked_game = false,
      is_published = true,
      build_version = 'v1.0.0',
      build_updated_at = now(),
      updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- ใส่รายละเอียดฟีเจอร์ลง game_docs
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Interactive 3D Celestial Lab — แบบจำลองระบบสุริยะ 3 มิติ, ผ่าดูโครงสร้างภายในดาวเคราะห์, ข้างขึ้น-ข้างแรม 8 เฟส, จำลองการเดินทางความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่านภาษาไทย',
         ARRAY[
           'แบบจำลอง 3 มิติเสมือนจริง: ดวงอาทิตย์และดาวเคราะห์ 8 ดวง หมุนรอบตัวเองและโคจรตามอัตราส่วนความเร็ว พร้อมเปิด-ปิดเส้นวงโคจร',
           'ระบบกล้องติดตามดาว (Follow Camera) และควบคุมความเร็วกาลเวลา (Time Scale Control) ปรับช้า-เร็วหรือหยุดเวลาได้',
           'โหมดผ่าดูโครงสร้างภายในดาว (Planetary Cross-Section): เปลือกดาว, เนื้อดาว, แก่นชั้นนอก, แก่นชั้นใน พร้อมป้ายสีและคำอธิบาย',
           'โหมดเรียงแถวเปรียบเทียบขนาด (Scale Alignment): เรียงลำดับจากดวงอาทิตย์ถึงดาวเนปจูนเพื่อเห็นความแตกต่างของขนาดที่แท้จริง',
           'โหมดเจาะลึกโลกและดวงจันทร์: จำลองการเอียงของแกนโลก 23.5 องศา และการโคจรของดวงจันทร์แสดงข้างขึ้น-ข้างแรม 8 เฟส',
           'เครื่องคำนวณการเดินทางความเร็วแสง (Speed of Light Simulator): จำลองการปล่อยอนุภาคโฟตอน 300,000 กม./วินาที ข้ามระหว่างดวงดาวพร้อมจับเวลาจริง',
           'สารานุกรมอวกาศ 3 มิติ (3D Encyclopedia): ข้อมูลประเภทดาว, แรงโน้มถ่วง, อุณหภูมิ, ดวงจันทร์บริวาร, เกร็ดความรู้ (Did you know?) พร้อมระบบเสียงอ่านภาษาไทย (TTS)',
           'ภารกิจนักสำรวจ (Quiz 3D Mission): ควิซ 9 ข้อตามตัวชี้วัด ว 3.1 รองรับการคลิกเลือกดาว 3D บนฉากจริงและปุ่มตัวเลือก พร้อมเฉลยและเสียงตอบรับ'
         ],
         'v1.0.0',
         'สื่อการสอนวิทยาศาสตร์ดาราศาสตร์และอวกาศ (ว 3.1) สำหรับประถมศึกษา ป.4–ป.6'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();

  -- ดึง category id สำหรับใบงาน (worksheets)
  DECLARE
    v_cat_ws UUID;
    v_ws_url TEXT := '/games/science/solar-system-3d-worksheet.html';
  BEGIN
    SELECT id INTO v_cat_ws FROM public.educational_hub_categories WHERE category_key = 'worksheets';
    IF v_cat_ws IS NOT NULL THEN
      INSERT INTO public.educational_hub_items
        (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
      SELECT
        v_staff_id, v_cat_ws, 'link',
        '📝 ใบงานระบบสุริยะ 3 มิติ',
        'ใบงานพิมพ์ A4 คู่สื่อระบบสุริยะ 3D จำแนกดาวเคราะห์ คำนวณข้างขึ้น-ข้างแรม ระยะทางความเร็วแสง และโครงสร้างดาว',
        v_ws_url,
        'วิทยาศาสตร์',
        ARRAY['ป.4','ป.5','ป.6']::text[],
        ARRAY['ใบงาน','วิทยาศาสตร์','ดาราศาสตร์','ระบบสุริยะ','พิมพ์ได้']::text[],
        466, false, true,
        '/games/science/solar-system-3d-media-cover.png',
        'v1.0.0', now()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.educational_hub_items
        WHERE owner_staff_id = v_staff_id AND external_url = v_ws_url
      );
    END IF;
  END;
END $$;

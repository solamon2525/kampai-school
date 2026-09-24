-- 533_upgrade_solar_system_3d_learning_studio.sql
-- ยกระดับสื่อและใบงาน "🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)" วิทยาศาสตร์ ป.4–ป.6 (ว 3.1)
-- ไฟล์: public/games/science/solar-system-3d-media.html + solar-system-3d-worksheet.html + solar-system-3d-media-cover.png
-- Idempotent: re-run ได้อย่างปลอดภัย ไม่ซ้ำซ้อน

DO $$
DECLARE
  v_staff_id     UUID;
  v_cat_media    UUID;
  v_cat_ws       UUID;
  v_media_url    TEXT := '/games/science/solar-system-3d-media.html';
  v_ws_url       TEXT := '/games/science/solar-system-3d-worksheet.html';
  v_cover_url    TEXT := '/games/science/solar-system-3d-media-cover.png';
  v_media_id     UUID;
  v_ws_id        UUID;
BEGIN
  -- 1. ค้นหาครูผู้สอน ณัฐพงศ์ สิงห์ชมภู
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching'
    ORDER BY created_at LIMIT 1;
  END IF;

  -- 2. ดึง Category IDs
  SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media';
  SELECT id INTO v_cat_ws FROM public.educational_hub_categories WHERE category_key = 'worksheets';

  -- 3. ลงทะเบียน / อัปเดตสื่อการสอน 3D (Media)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
  VALUES
    (v_staff_id, v_cat_media, 'link',
     '🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)',
     'สื่อการสอนดาราศาสตร์ 3 มิติ สำรวจดาวเคราะห์ 8 ดวง ผ่าดูโครงสร้างภายใน ข้างขึ้น-ข้างแรม จำลองความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่านภาษาไทย',
     v_media_url,
     'วิทยาศาสตร์',
     ARRAY['ป.4','ป.5','ป.6']::text[],
     ARRAY['science','space','solar-system','3d','astronomy','media','planets']::text[],
     466, false, true,
     v_cover_url,
     'v1.229.85', now())
  ON CONFLICT (id) DO NOTHING;

  -- อัปเดตข้อมูลสื่อการสอนหากมีอยู่แล้ว
  UPDATE public.educational_hub_items
  SET title = '🪐 ระบบสุริยะ 3 มิติ (Solar System 3D)',
      description = 'สื่อการสอนดาราศาสตร์ 3 มิติ สำรวจดาวเคราะห์ 8 ดวง ผ่าดูโครงสร้างภายใน ข้างขึ้น-ข้างแรม จำลองความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่านภาษาไทย',
      external_url = v_media_url,
      subject = 'วิทยาศาสตร์',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['science','space','solar-system','3d','astronomy','media','planets']::text[],
      thumbnail_url = v_cover_url,
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.85',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = v_media_url;

  -- 4. อัปเดตใบงาน (Worksheet) ให้ใช้ภาพปกใหม่และอัปเดตเวอร์ชัน
  UPDATE public.educational_hub_items
  SET title = 'ใบงานระบบสุริยะ 3 มิติ',
      description = 'ใบงานพิมพ์ A4 คู่สื่อระบบสุริยะ 3D จำแนกดาวเคราะห์ คำนวณข้างขึ้น-ข้างแรม ระยะทางความเร็วแสง และโครงสร้างดาว (50 ข้อ 5 หมวด)',
      external_url = v_ws_url,
      subject = 'วิทยาศาสตร์',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['ใบงาน','วิทยาศาสตร์','ดาราศาสตร์','ระบบสุริยะ','พิมพ์ได้']::text[],
      thumbnail_url = v_cover_url,
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.85',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = v_ws_url;

  -- 5. ดึง media item id เพื่อลงทะเบียน game_docs
  SELECT id INTO v_media_id FROM public.educational_hub_items WHERE external_url = v_media_url LIMIT 1;

  IF v_media_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_media_id,
      v_staff_id,
      'Interactive 3D Celestial Lab — แบบจำลองระบบสุริยะ 3 มิติ, ผ่าดูโครงสร้างภายในดาวเคราะห์, ข้างขึ้น-ข้างแรม 8 เฟส, จำลองการเดินทางความเร็วแสง และสารานุกรมอวกาศพร้อมเสียงอ่านภาษาไทย',
      ARRAY[
        'แบบจำลอง 3 มิติเสมือนจริง: ดวงอาทิตย์และดาวเคราะห์ 8 ดวง หมุนรอบตัวเองและโคจรตามอัตราส่วนความเร็ว พร้อมเปิด-ปิดเส้นวงโคจร',
        'ระบบกล้องติดตามดาว (Follow Camera) และควบคุมความเร็วกาลเวลา (Time Scale Control) ปรับช้า-เร็วหรือหยุดเวลาได้',
        'โหมดผ่าดูโครงสร้างภายในดาว (Planetary Cross-Section): เปลือกดาว, เนื้อดาว, แก่นชั้นนอก, แก่นชั้นใน พร้อมป้ายสีและคำอธิบาย',
        'โหมดเรียงแถวเปรียบเทียบขนาด (Scale Alignment): เรียงลำดับจากดวงอาทิตย์ถึงดาวเนปจูนเพื่อเห็นความแตกต่างของขนาดที่แท้จริง',
        'โหมดเจาะลึกโลกและดวงจันทร์: จำลองการเอียงของแกนโลก 23.5 องศา และการโคจรของดวงจันทร์แสดงข้างขึ้น-ข้างแรม 8 เฟส',
        'เครื่องคำนวณการเดินทางความเร็วแสง (Speed of Light Simulator): จำลองการปล่อยอนุภาคโฟตอน 300,000 กม./วินาที ข้ามระหว่างดวงดาวพร้อมจับเวลาจริง',
        'สารานุกรมอวกาศ 3 มิติ (3D Encyclopedia): ข้อมูลประเภทดาว, แรงโน้มถ่วง, อุณหภูมิ, ดวงจันทร์บริวาร, เกร็ดความรู้ (Did you know?) พร้อมระบบเสียงอ่านภาษาไทย (TTS)',
        'ภารกิจนักสำรวจ (Quiz 3D Mission): ควิซ 9 ข้อตามตัวชี้วัด ว 3.1 รองรับการคลิกเลือกดาว 3D บนฉากจริงและปุ่มตัวเลือก พร้อมเฉลยและเสียงตอบรับ',
        'คีย์ลัด Smartboard: ปุ่ม 1 (เรียนรู้), 2 (เรียงแถว), 3 (โลก-ดวงจันทร์), 4 (ความเร็วแสง), 5 (ควิซ), Space (อ่านเสียง/เล่นเสียงซ้ำ), F (เต็มจอ)',
        'ใบงานคู่สื่อการสอน A4: คลังโจทย์ 50 ข้อครอบคลุม 5 ทักษะวิทยาศาสตร์ดาราศาสตร์ พร้อมตัวกรองระดับชั้น ป.4, ป.5, ป.6 และเฉลยครู Zero-shift'
      ],
      'v1.229.85',
      'สื่อการสอนวิทยาศาสตร์ดาราศาสตร์และอวกาศ (ว 3.1 ป.4/1, ป.4/2, ป.5/1, ป.5/2) สำหรับประถมศึกษา ป.4–ป.6 โรงเรียนบ้านคำไผ่'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END IF;
END $$;

-- 534_upgrade_force_motion_learning_studio.sql
-- ยกระดับสื่อและใบงาน "🛒 แรงและการเคลื่อนที่ ป.5 (Force & Motion Studio)" วิทยาศาสตร์ ป.5 (ว 2.2 ป.5/1–5)
-- ไฟล์: public/games/science/force-motion-media.html + force-motion-worksheet.html + force-motion-media-cover.png
-- Idempotent: re-run ได้อย่างปลอดภัย ไม่ซ้ำซ้อน

DO $$
DECLARE
  v_staff_id     UUID;
  v_cat_media    UUID;
  v_cat_ws       UUID;
  v_media_url    TEXT := '/games/science/force-motion-media.html';
  v_ws_url       TEXT := '/games/science/force-motion-worksheet.html';
  v_cover_url    TEXT := '/games/science/force-motion-media-cover.png';
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

  -- 3. ลงทะเบียน / อัปเดตสื่อการสอน (Media)
  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url, subject, grade_levels, tags, sort_order, tracked_game, is_published, thumbnail_url, build_version, build_updated_at)
  VALUES
    (v_staff_id, v_cat_media, 'link',
     '🛒 แรงและการเคลื่อนที่ ป.5 (Force & Motion Studio)',
     'สตูดิโอการเรียนรู้วิทยาศาสตร์กายภาพ ป.5 สำรวจแรงผลัก-แรงดึง จำลองการหาแรงลัพธ์ ∑F เครื่องชั่งสปริงนิวตัน แล็บแรงเสียดทาน และแบบทดสอบ 15 ข้อพร้อมเสียงอ่านไทย',
     v_media_url,
     'วิทยาศาสตร์',
     ARRAY['ป.5']::text[],
     ARRAY['science','physics','force','motion','friction','net-force','newton','media']::text[],
     467, false, true,
     v_cover_url,
     'v1.229.86', now())
  ON CONFLICT (id) DO NOTHING;

  -- อัปเดตข้อมูลสื่อการสอนหากมีอยู่แล้ว
  UPDATE public.educational_hub_items
  SET title = '🛒 แรงและการเคลื่อนที่ ป.5 (Force & Motion Studio)',
      description = 'สตูดิโอการเรียนรู้วิทยาศาสตร์กายภาพ ป.5 สำรวจแรงผลัก-แรงดึง จำลองการหาแรงลัพธ์ ∑F เครื่องชั่งสปริงนิวตัน แล็บแรงเสียดทาน และแบบทดสอบ 15 ข้อพร้อมเสียงอ่านไทย',
      external_url = v_media_url,
      subject = 'วิทยาศาสตร์',
      grade_levels = ARRAY['ป.5']::text[],
      tags = ARRAY['science','physics','force','motion','friction','net-force','newton','media']::text[],
      thumbnail_url = v_cover_url,
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.86',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = v_media_url;

  -- 4. อัปเดตใบงาน (Worksheet) ให้ใช้ภาพปกใหม่และอัปเดตเวอร์ชัน
  UPDATE public.educational_hub_items
  SET title = 'ใบงานแรงและการเคลื่อนที่ ป.5',
      description = 'ใบงานพิมพ์ A4 คู่สื่อการสอนแรงและการเคลื่อนที่ ป.5 สรุปผลของแรง คำนวณแรงลัพธ์ เครื่องชั่งสปริง และแรงเสียดทาน (50 ข้อ 5 หมวด)',
      external_url = v_ws_url,
      subject = 'วิทยาศาสตร์',
      grade_levels = ARRAY['ป.5']::text[],
      tags = ARRAY['ใบงาน','วิทยาศาสตร์','แรงและการเคลื่อนที่','แรงเสียดทาน','แรงลัพธ์','พิมพ์ได้']::text[],
      thumbnail_url = v_cover_url,
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.86',
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
      'Interactive Physics Studio — สำรวจแรงผลัก vs แรงดึง, เครื่องชั่งสปริงนิวตันจำลอง, แบบจำลองแรงลัพธ์ ∑F 1 มิติ, ห้องแล็บแรงเสียดทาน 4 พื้นผิว และแบบทดสอบท้าทาย 15 ข้อพร้อมระบบเสียงอ่านภาษาไทย (TTS)',
      ARRAY[
        'สำรวจชนิดของแรง (Force Explorer): จำลองแรงผลัก vs แรงดึง พร้อมเวกเตอร์ลูกศรและตัวอย่างในชีวิตประจำวัน',
        'ผลของแรง 4 ประการ: สรุปผลของแรงทำให้วัตถุเริ่มเคลื่อนที่, เร็วขึ้นหรือช้าลง, หยุดนิ่ง, และเปลี่ยนทิศทางหรือเปลี่ยนรูปร่าง',
        'เครื่องชั่งสปริงนิวตันจำลอง: ปรับแรงดึงและน้ำหนักแขวน (1-10 N) พร้อมขดลวดสปริงยืดหดตามแรงจริงแบบ Interactive และสูตร W = mg',
        'แบบจำลองแรงลัพธ์ (Net Force Simulator): จำลองการรวมแรง 1 มิติ เพิ่มแรงดึง/ผลักฝั่งซ้าย (F1, F2) และฝั่งขวา (F3, F4) แบบ Real-time',
        'การคำนวณแรงลัพธ์ ∑F และสภาวะสมดุล: คำนวณ ∑F = F_right - F_left, แสดงทิศทางการเคลื่อนที่ และการเคลื่อนที่ของวัตถุตามกฎฟิสิกส์',
        'ห้องปฏิบัติการแรงเสียดทาน (Friction Lab): ทดสอบพื้นผิว 4 แบบ (ลานน้ำแข็ง μ=0.05, ไม้ขัดมัน μ=0.25, คอนกรีต μ=0.55, กระดาษทราย μ=0.85)',
        'การทดลองแรงเสียดทานตามสูตรจริง: ปรับมวลวัตถุ (1-10 kg) แรงกด N, คำนวณ f = μ × N, ปรับแรงผลัก และจำลองระยะทางไถลหยุดจริง',
        'การประยุกต์ใช้แรงเสียดทาน: สรุปความรู้เรื่องการเพิ่มแรงเสียดทาน (ดอกยาง, พื้นรองเท้า, เบรก) และการลดแรงเสียดทาน (ตลับลูกปืน, น้ำมันหล่อลื่น)',
        'แบบทดสอบท้าทาย (Practice Quiz 15 ข้อ): ครอบคลุม 5 ตัวชี้วัด ว 2.2 ป.5/1-5 พร้อมระบบคะแนน Streak, เสียงเฉลยภาษาไทย (TTS) และระดับเหรียญรางวัล',
        'ใบงานคู่สื่อการสอน A4: คลังโจทย์ 50 ข้อครอบคลุม 5 ทักษะวิทยาศาสตร์ พร้อมสุ่มโจทย์และเฉลยครู Zero-shift (ผ่านการตรวจสอบ 18/18 เช็ค)'
      ],
      'v1.229.86',
      'สื่อการสอนวิทยาศาสตร์กายภาพ (ว 2.2 ป.5/1, ป.5/2, ป.5/3, ป.5/4, ป.5/5) สำหรับประถมศึกษา ป.5 โรงเรียนบ้านคำไผ่'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END IF;
END $$;

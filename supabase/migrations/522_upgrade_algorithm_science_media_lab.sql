-- Upgrade the next roadmap wave in place without changing public URLs.
-- Includes algorithm unplugged and two science simulation labs.
-- Idempotent: safe to re-run and keeps all learning state local to the page.

DO $$
DECLARE
  v_owner_id uuid;
  v_media_category_id uuid;
  v_worksheet_category_id uuid;
  v_item_id uuid;
  seed record;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_media_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'media' AND is_active = true
  LIMIT 1;

  SELECT id INTO v_worksheet_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_owner_id IS NULL OR v_media_category_id IS NULL OR v_worksheet_category_id IS NULL THEN
    RAISE EXCEPTION 'teaching owner or active media/worksheet category not found';
  END IF;

  FOR seed IN
    SELECT * FROM (VALUES
      ('media','🧭 อัลกอริทึมแบบไม่ใช้คอมพิวเตอร์','สื่อเทคโนโลยี ป.1–ป.3 ฝึกตั้งเป้าหมาย เรียงขั้นตอน ใช้เงื่อนไข ทำซ้ำ และดีบัก.','/games/tech/algorithm-unplugged-media.html','/games/tech/algorithm-unplugged-media-cover.png','เทคโนโลยี',ARRAY['ป.1','ป.2','ป.3']::text[],ARRAY['อัลกอริทึม','ลำดับขั้น','ดีบัก','เทคโนโลยี']::text[],ARRAY['ว 4.2 ป.1/2','ว 4.2 ป.2/1','ว 4.2 ป.3/1']::text[]),
      ('worksheet','📝 ใบงานอัลกอริทึมแบบไม่ใช้คอมพิวเตอร์','ใบงานคู่สื่อ ฝึกเขียนลำดับขั้น เงื่อนไข การทำซ้ำ และแก้จุดผิด.','/games/tech/algorithm-unplugged-worksheet.html','/games/tech/algorithm-unplugged-media-cover.png','เทคโนโลยี',ARRAY['ป.1','ป.2','ป.3']::text[],ARRAY['ใบงาน','อัลกอริทึม','ดีบัก']::text[],ARRAY['ว 4.2 ป.1/2','ว 4.2 ป.2/1','ว 4.2 ป.3/1']::text[]),
      ('media','🧊 สถานะของสสาร','สื่อวิทยาศาสตร์ ป.4–ป.6 อธิบายของแข็ง ของเหลว แก๊ส และทดลองปรับความร้อนพร้อมคำถามทำนาย.','/games/science/states-of-matter-media.html','/games/science/states-of-matter-media-cover.svg','วิทยาศาสตร์',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['สสาร','ของแข็ง','ของเหลว','แก๊ส','ห้องทดลอง']::text[],ARRAY['ว 2.1 ป.4/3','ว 2.1 ป.4/4']::text[]),
      ('worksheet','📝 ใบงานสถานะของสสาร','ใบงานคู่สื่อ ฝึกจำแนกสถานะ อธิบายการเปลี่ยนสถานะ และเชื่อมกับอนุภาค.','/games/science/states-of-matter-worksheet.html','/games/science/states-of-matter-media-cover.svg','วิทยาศาสตร์',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','สสาร','การเปลี่ยนสถานะ']::text[],ARRAY['ว 2.1 ป.4/3','ว 2.1 ป.4/4']::text[]),
      ('media','⚡ ไฟฟ้าและวงจรอย่างง่าย','สื่อวิทยาศาสตร์ ป.6 ฝึกต่อแบตเตอรี่ สายไฟ และสวิตช์ พร้อมทดลองหาสาเหตุที่หลอดไฟติดหรือไม่ติด.','/games/science/electric-circuit-media.html','/games/science/electric-circuit-media-cover.png','วิทยาศาสตร์',ARRAY['ป.6']::text[],ARRAY['ไฟฟ้า','วงจร','แบตเตอรี่','ความปลอดภัย','ห้องทดลอง']::text[],ARRAY['ว 2.3 ป.6/1','ว 2.3 ป.6/2','ว 2.3 ป.6/4']::text[]),
      ('worksheet','📝 ใบงานไฟฟ้าและวงจรอย่างง่าย','ใบงานคู่สื่อ ฝึกระบุส่วนประกอบ วาดวงจร อธิบายวงจรเปิด/ปิด และความปลอดภัย.','/games/science/electric-circuit-worksheet.html','/games/science/electric-circuit-media-cover.png','วิทยาศาสตร์',ARRAY['ป.6']::text[],ARRAY['ใบงาน','ไฟฟ้า','วงจร','ความปลอดภัย']::text[],ARRAY['ว 2.3 ป.6/1','ว 2.3 ป.6/2','ว 2.3 ป.6/4']::text[])
    ) AS row(kind, title, description, external_url, thumbnail_url, subject, grade_levels, tags, indicator_codes)
  LOOP
    SELECT id INTO v_item_id
    FROM public.educational_hub_items
    WHERE external_url = seed.external_url
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_item_id IS NULL THEN
      INSERT INTO public.educational_hub_items (
        owner_staff_id, category_id, item_type, title, description, external_url,
        thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
      ) VALUES (
        v_owner_id,
        CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END,
        'link', seed.title, seed.description, seed.external_url, seed.thumbnail_url,
        seed.subject, seed.grade_levels, seed.tags,
        COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END), 1),
        false, true
      ) RETURNING id INTO v_item_id;
    ELSE
      UPDATE public.educational_hub_items
      SET owner_staff_id = v_owner_id,
          category_id = CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END,
          item_type = 'link',
          title = seed.title,
          description = seed.description,
          thumbnail_url = seed.thumbnail_url,
          subject = seed.subject,
          grade_levels = seed.grade_levels,
          tags = seed.tags,
          tracked_game = false,
          is_published = true,
          updated_at = now()
      WHERE id = v_item_id;
    END IF;

    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_item_id, indicator.id
    FROM public.curriculum_indicators indicator
    WHERE indicator.indicator_code = ANY (seed.indicator_codes)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

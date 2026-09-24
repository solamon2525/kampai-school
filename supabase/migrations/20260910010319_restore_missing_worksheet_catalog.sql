-- Restore every worksheet URL that exists in the repository but is missing from
-- the published production catalog. Keep legacy/canonical rows intact; this
-- migration adds or republishes the exact URL used by the shipped file.
-- Idempotent and local-state only: no scores, student answers, or new tables.

DO $$
DECLARE
  v_owner_id uuid;
  v_worksheet_category_id uuid;
  v_item_id uuid;
  seed record;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_worksheet_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_owner_id IS NULL OR v_worksheet_category_id IS NULL THEN
    RAISE EXCEPTION 'teaching owner or active worksheets category not found';
  END IF;

  FOR seed IN
    SELECT * FROM (VALUES
      ('/games/english/classroom-english-media-worksheet.html', 'ใบงาน Classroom English ป.1–ป.6', 'ใบงานฝึกคำสั่งและบทสนทนาภาษาอังกฤษในห้องเรียน', 'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','ภาษาอังกฤษ','ห้องเรียน']::text[], ARRAY['ต 1.1 ป.1/1','ต 1.1 ป.2/1','ต 1.2 ป.3/1']::text[]),
      ('/games/english/english-grammar-p45-hub-worksheet.html', 'ใบงานคลัง English ป.4–ป.5', 'ใบงานภาษาอังกฤษ ฝึกไวยากรณ์ คำศัพท์ และการใช้ภาษาอย่างเป็นขั้นตอน', 'ภาษาอังกฤษ', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาอังกฤษ','ไวยากรณ์']::text[], ARRAY['ต 2.1 ป.4/1','ต 1.1 ป.4/1','ต 1.1 ป.4/2']::text[]),
      ('/games/english/sight-words-p123-media-worksheet.html', 'ใบงาน Sight Words ป.1–ป.3', 'ใบงานฝึกอ่านและใช้คำศัพท์พื้นฐานภาษาอังกฤษสำหรับประถมต้น', 'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3']::text[], ARRAY['ใบงาน','ภาษาอังกฤษ','คำศัพท์']::text[], ARRAY['ต 1.1 ป.1/2','ต 1.1 ป.2/2']::text[]),
      ('/games/english/weather-seasons-worksheet.html', 'ใบงาน Weather and Seasons ป.4', 'ใบงานฝึกอ่านคำศัพท์และอธิบายสภาพอากาศกับฤดูกาล', 'ภาษาอังกฤษ', ARRAY['ป.4']::text[], ARRAY['ใบงาน','ภาษาอังกฤษ','อากาศ','ฤดูกาล']::text[], ARRAY['ต 1.1 ป.4/3','ต 1.3 ป.4/1']::text[]),
      ('/games/health/brush-teeth-media-worksheet.html', 'ใบงานแปรงฟันถูกวิธี ป.3', 'ใบงานเรียงขั้นตอนการแปรงฟันและอธิบายการดูแลช่องปาก', 'สุขศึกษา', ARRAY['ป.3']::text[], ARRAY['ใบงาน','สุขศึกษา','ดูแลฟัน']::text[], ARRAY['พ 4.1 ป.3/4']::text[]),
      ('/games/math/clock-media-worksheet.html', 'ใบงานนาฬิกาบอกเวลา ป.1–ป.4', 'ใบงานอ่านเวลา บอกช่วงเวลา และเชื่อมโยงเวลากับกิจวัตรประจำวัน', 'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[], ARRAY['ใบงาน','คณิตศาสตร์','เวลา']::text[], ARRAY['ค 2.1 ป.2/1','ค 2.1 ป.3/2','ค 2.1 ป.4/1']::text[]),
      ('/games/math/geometry-3d-media-worksheet.html', 'ใบงานเรขาคณิต 2D/3D ป.4–ป.6', 'ใบงานจำแนกรูปเรขาคณิตสองมิติและสามมิติ พร้อมสังเกตลักษณะสำคัญ', 'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','คณิตศาสตร์','เรขาคณิต']::text[], ARRAY['ค 2.2 ป.5/4','ค 2.2 ป.6/3','ค 2.2 ป.6/4']::text[]),
      ('/games/math/math-data-hub-worksheet.html', 'ใบงานคลังข้อมูลและกราฟ ป.4–ป.5', 'ใบงานอ่านตารางและกราฟ สรุปข้อมูล และอธิบายหลักฐานจากข้อมูล', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','คณิตศาสตร์','ข้อมูล','กราฟ']::text[], ARRAY['ค 3.1 ป.4/1']::text[]),
      ('/games/math/math-decimal-hub-worksheet.html', 'ใบงานคลังทศนิยม ป.4–ป.5', 'ใบงานอ่านค่า เปรียบเทียบ และคำนวณทศนิยมในสถานการณ์ใกล้ตัว', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','คณิตศาสตร์','ทศนิยม']::text[], ARRAY['ค 1.1 ป.4/5','ค 1.1 ป.4/6']::text[]),
      ('/games/math/math-geometry-hub-worksheet.html', 'ใบงานคลังเรขาคณิต ป.4–ป.5', 'ใบงานฝึกมุม เส้นรอบรูป พื้นที่ และการจำแนกรูปเรขาคณิต', 'คณิตศาสตร์', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','คณิตศาสตร์','เรขาคณิต']::text[], ARRAY['ค 2.2 ป.4/1','ค 2.2 ป.4/2']::text[]),
      ('/games/math/thai-money-media-worksheet.html', 'ใบงานเงินไทย ป.1–ป.3', 'ใบงานรู้จักธนบัตร เหรียญ รวมเงิน และแก้สถานการณ์การใช้เงินอย่างง่าย', 'คณิตศาสตร์', ARRAY['ป.1','ป.2','ป.3']::text[], ARRAY['ใบงาน','คณิตศาสตร์','เงินไทย']::text[], ARRAY['ค 2.1 ป.3/1']::text[]),
      ('/games/science/force-motion-worksheet.html', 'ใบงานแรงและการเคลื่อนที่ ป.5', 'ใบงานสังเกตแรงผลัก แรงดึง แรงเสียดทาน และผลของแรงต่อการเคลื่อนที่', 'วิทยาศาสตร์', ARRAY['ป.5']::text[], ARRAY['ใบงาน','วิทยาศาสตร์','แรง']::text[], ARRAY['ว 2.2 ป.5/1']::text[]),
      ('/games/science/human-organs-media-worksheet.html', 'ใบงานอวัยวะสำคัญ ป.4–ป.6', 'ใบงานจับคู่ชื่ออวัยวะกับหน้าที่ และเขียนวิธีดูแลร่างกาย', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','วิทยาศาสตร์','อวัยวะ']::text[], ARRAY['ว 1.2 ป.4/1','ว 1.2 ป.6/1']::text[]),
      ('/games/science/light-properties-media-worksheet.html', 'ใบงานสมบัติของแสง ป.4', 'ใบงานสังเกตการเดินทาง การสะท้อน และการเกิดเงาของแสง', 'วิทยาศาสตร์', ARRAY['ป.4']::text[], ARRAY['ใบงาน','วิทยาศาสตร์','แสง']::text[], ARRAY['ว 2.3 ป.4/1']::text[]),
      ('/games/science/science-p45-hub-worksheet.html', 'ใบงานคลังวิทย์ ป.4–ป.5', 'ใบงานวิทยาศาสตร์รวม ฝึกสังเกต จำแนก อธิบายเหตุผล และใช้หลักฐาน', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','วิทยาศาสตร์','สังเกต','หลักฐาน']::text[], ARRAY['ว 2.1 ป.4/3','ว 3.2 ป.5/3','ว 1.3 ป.4/3']::text[]),
      ('/games/science/solar-system-3d-worksheet.html', 'ใบงานระบบสุริยะ 3 มิติ', 'ใบงานจำแนกดาวเคราะห์ เปรียบเทียบการโคจร และอธิบายระบบสุริยะ', 'วิทยาศาสตร์', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','วิทยาศาสตร์','ระบบสุริยะ']::text[], ARRAY['ว 3.1 ป.4/1','ว 3.1 ป.4/2','ว 3.1 ป.5/1','ว 3.1 ป.5/2']::text[]),
      ('/games/social/map-directions-worksheet.html', 'ใบงานทิศ แผนที่ และสัญลักษณ์ ป.4', 'ใบงานอ่านแผนที่ ใช้ทิศ และอธิบายความหมายของสัญลักษณ์', 'สังคมศึกษา', ARRAY['ป.4']::text[], ARRAY['ใบงาน','สังคมศึกษา','แผนที่','ทิศทาง']::text[], ARRAY['ส 5.1 ป.4/1']::text[]),
      ('/games/social/social-thailand-hub-worksheet.html', 'ใบงานคลังสังคมศึกษาไทย ป.4–ป.5', 'ใบงานสังคมศึกษา ฝึกแผนที่ ประวัติศาสตร์อย่างง่าย และหน้าที่พลเมือง', 'สังคมศึกษา', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','สังคมศึกษา','ชุมชน','พลเมือง']::text[], ARRAY['ส 5.1 ป.4/1','ส 4.3 ป.4/1','ส 2.1 ป.4/1']::text[]),
      ('/games/social/thai-calendar-media-worksheet.html', 'ใบงานปฏิทินวันสำคัญไทย ป.1–ป.6', 'ใบงานอ่านปฏิทิน เรียงลำดับเวลา และรู้จักวันสำคัญของไทย', 'สังคมศึกษา', ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','สังคมศึกษา','ปฏิทิน','วันสำคัญ']::text[], ARRAY['ส 4.3 ป.4/1','ส 4.3 ป.5/1','ส 2.1 ป.3/1']::text[]),
      ('/games/thai/homophone-context-worksheet.html', 'ใบงานคำพ้องเสียงและการเลือกใช้คำ ป.5', 'ใบงานจำแนกคำพ้องเสียงและเลือกใช้คำจากบริบทอย่างถูกต้อง', 'ภาษาไทย', ARRAY['ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','คำพ้องเสียง']::text[], ARRAY['ท 4.1 ป.5/1']::text[]),
      ('/games/thai/literature-short-media-worksheet.html', 'ใบงานวรรณคดีสั้น ป.4–ป.6', 'ใบงานอ่านเรื่องสั้น จับใจความ วิเคราะห์ตัวละคร และสรุปข้อคิด', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','ภาษาไทย','วรรณคดี','อ่านจับใจความ']::text[], ARRAY['ท 1.1 ป.4/5','ท 1.1 ป.5/5','ท 1.1 ป.6/4']::text[]),
      ('/games/thai/thai-grammar-hub-worksheet.html', 'ใบงานคลังไวยากรณ์ไทย ป.4–ป.5', 'ใบงานจำแนกและใช้หลักไวยากรณ์ไทยในประโยค', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','ไวยากรณ์']::text[], ARRAY['ท 4.1 ป.4/2','ท 4.1 ป.4/6','ท 4.1 ป.5/2']::text[]),
      ('/games/thai/thai-idiom-hub-worksheet.html', 'ใบงานคลังสำนวนไทย ป.4–ป.6', 'ใบงานตีความสำนวนไทยและเลือกใช้สำนวนให้เหมาะกับสถานการณ์', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','ภาษาไทย','สำนวน']::text[], ARRAY['ท 1.1 ป.4/2','ท 1.1 ป.5/2']::text[]),
      ('/games/thai/thai-literature-hub-worksheet.html', 'ใบงานคลังวรรณคดีวรรณกรรม ป.4–ป.5', 'ใบงานอ่านวรรณคดีและวรรณกรรม ฝึกวิเคราะห์ตัวละคร ภาษา และข้อคิด', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','วรรณคดี','วรรณกรรม']::text[], ARRAY['ท 5.1 ป.4/1','ท 5.1 ป.4/2']::text[]),
      ('/games/thai/thai-poetry-hub-worksheet.html', 'ใบงานคลังบทร้อยกรอง ป.4–ป.5', 'ใบงานสังเกตคำคล้องจอง สัมผัส และลักษณะของบทร้อยกรอง', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','ร้อยกรอง']::text[], ARRAY['ท 5.1 ป.4/4','ท 4.1 ป.4/5']::text[]),
      ('/games/thai/thai-punctuation-hub-worksheet.html', 'ใบงานเครื่องหมายวรรคตอน ป.3–ป.5', 'ใบงานเลือกและใช้เครื่องหมายวรรคตอนให้สื่อความหมายชัดเจน', 'ภาษาไทย', ARRAY['ป.3','ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','วรรคตอน']::text[], ARRAY['ท 2.1 ป.3/1','ท 2.1 ป.4/1']::text[]),
      ('/games/thai/thai-reading-hub-worksheet.html', 'ใบงานคลังอ่านจับใจความ ป.4–ป.5', 'ใบงานอ่านเรื่อง ระบุใจความสำคัญ รายละเอียด และข้อสรุปจากหลักฐาน', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','อ่านจับใจความ']::text[], ARRAY['ท 1.1 ป.5/2','ท 1.1 ป.5/3']::text[]),
      ('/games/thai/thai-script-hub-worksheet.html', 'ใบงานคลังอักษรไทย ป.1–ป.4', 'ใบงานฝึกสังเกตและใช้ตัวอักษรไทยตามระดับชั้น', 'ภาษาไทย', ARRAY['ป.1','ป.2','ป.3','ป.4']::text[], ARRAY['ใบงาน','ภาษาไทย','อักษรไทย']::text[], ARRAY['ท 4.1 ป.1/1','ท 4.1 ป.2/1','ท 4.1 ป.4/1']::text[]),
      ('/games/thai/thai-sentence-hub-worksheet.html', 'ใบงานคลังประโยคไทย ป.3–ป.5', 'ใบงานเรียบเรียงประโยค ระบุส่วนประกอบ และปรับประโยคให้สื่อความหมาย', 'ภาษาไทย', ARRAY['ป.3','ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','ประโยค']::text[], ARRAY['ท 4.1 ป.3/4','ท 4.1 ป.5/2']::text[]),
      ('/games/thai/thai-vocab-hub-worksheet.html', 'ใบงานคลังคำศัพท์ไทย ป.4–ป.6', 'ใบงานเรียนรู้ความหมายและการเลือกใช้คำศัพท์ไทยจากบริบท', 'ภาษาไทย', ARRAY['ป.4','ป.5','ป.6']::text[], ARRAY['ใบงาน','ภาษาไทย','คำศัพท์']::text[], ARRAY['ท 4.1 ป.4/1','ท 4.1 ป.4/6']::text[]),
      ('/games/thai/thai-writing-hub-worksheet.html', 'ใบงานคลังแต่งข้อความ ป.4–ป.5', 'ใบงานวางแผนและเขียนข้อความสั้น พร้อมตรวจแก้ให้สื่อสารชัดเจน', 'ภาษาไทย', ARRAY['ป.4','ป.5']::text[], ARRAY['ใบงาน','ภาษาไทย','การเขียน']::text[], ARRAY['ท 2.1 ป.4/1','ท 4.1 ป.5/3']::text[])
    ) AS row(external_url, title, description, subject, grade_levels, tags, indicator_codes)
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
        v_owner_id, v_worksheet_category_id, 'link', seed.title, seed.description, seed.external_url,
        '/games/media-lab-assets/learning-scene.svg', seed.subject, seed.grade_levels, seed.tags,
        COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = v_worksheet_category_id), 1),
        false, true
      ) RETURNING id INTO v_item_id;
    ELSE
      UPDATE public.educational_hub_items
      SET owner_staff_id = v_owner_id,
          category_id = v_worksheet_category_id,
          item_type = 'link',
          title = seed.title,
          description = seed.description,
          thumbnail_url = COALESCE(thumbnail_url, '/games/media-lab-assets/learning-scene.svg'),
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

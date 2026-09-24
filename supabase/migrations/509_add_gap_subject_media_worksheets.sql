-- Migration 509: publish the next gap-first media + worksheet pairs.
-- Local-state learning artifacts only: no scores, student answers, or new tables.
DO $$
DECLARE
  v_staff_id uuid;
  v_media_category_id uuid;
  v_worksheet_category_id uuid;
  v_item_id uuid;
  seed record;
  v_url text;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'teaching staff owner not found';
  END IF;

  SELECT id INTO v_media_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'media' AND is_active = true
  LIMIT 1;

  SELECT id INTO v_worksheet_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_media_category_id IS NULL OR v_worksheet_category_id IS NULL THEN
    RAISE EXCEPTION 'active media and worksheet categories not found';
  END IF;

  FOR seed IN
    SELECT * FROM (VALUES
      ('media','🤖 รู้เท่าทัน AI และข้อมูล','สื่อเทคโนโลยี ป.4–ป.6 ฝึกตรวจแหล่งที่มา เปรียบเทียบหลักฐาน และใช้ AI อย่างรับผิดชอบ.','/games/tech/ai-data-literacy-media.html','เทคโนโลยี',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['AI','ข้อมูล','แหล่งที่มา','คิดอย่างมีวิจารณญาณ']::text[],ARRAY['ว 4.2 ป.4/1','ว 4.2 ป.5/1']::text[]),
      ('worksheet','🤖 ใบงานรู้เท่าทัน AI และข้อมูล','ใบงานคู่สื่อ ฝึกเขียนหลักฐาน เหตุผล และขั้นตอนตรวจข้อมูลก่อนแชร์.','/games/tech/ai-data-literacy-worksheet.html','เทคโนโลยี',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','AI','ข้อมูล','เหตุผล']::text[],ARRAY['ว 4.2 ป.4/1','ว 4.2 ป.5/1']::text[]),
      ('media','🎶 เครื่องดนตรีไทยและเสียง','สื่อศิลปะ ป.1–ป.4 ฝึกฟังและจำแนกเครื่องดนตรีไทยตามวิธีทำให้เกิดเสียง.','/games/arts/thai-instruments-media.html','ศิลปะ',ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],ARRAY['ดนตรีไทย','เสียง','ตี','สี','เป่า','ดีด']::text[],ARRAY['ศ 2.1 ป.1/1','ศ 2.1 ป.3/1']::text[]),
      ('worksheet','🎶 ใบงานเครื่องดนตรีไทยและเสียง','ใบงานคู่สื่อ ฝึกจำแนกวิธีเล่นและเขียนสิ่งที่สังเกตจากเสียง.','/games/arts/thai-instruments-worksheet.html','ศิลปะ',ARRAY['ป.1','ป.2','ป.3','ป.4']::text[],ARRAY['ใบงาน','ดนตรีไทย','เสียง']::text[],ARRAY['ศ 2.1 ป.1/1','ศ 2.1 ป.3/1']::text[]),
      ('media','🎨 การวิจารณ์งานศิลป์เบื้องต้น','สื่อศิลปะ ป.3–ป.6 ฝึกสังเกตสี เส้น รูปร่าง พื้นผิว และอธิบายอย่างสุภาพ.','/games/arts/art-critique-media.html','ศิลปะ',ARRAY['ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['วิจารณ์งานศิลป์','สี','เส้น','หลักฐาน']::text[],ARRAY['ศ 1.1 ป.3/1','ศ 1.1 ป.5/1']::text[]),
      ('worksheet','🎨 ใบงานวิจารณ์งานศิลป์','ใบงานคู่สื่อ ฝึกสังเกตภาพ เขียนหลักฐาน และให้ความคิดเห็นอย่างสุภาพ.','/games/arts/art-critique-worksheet.html','ศิลปะ',ARRAY['ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','วิจารณ์งานศิลป์','หลักฐาน']::text[],ARRAY['ศ 1.1 ป.3/1','ศ 1.1 ป.5/1']::text[]),
      ('media','💰 วางแผนรายรับรายจ่าย','สื่อการงานอาชีพ ป.4–ป.6 ทดลองจัดงบประมาณ แยกรายจ่ายจำเป็น และฝึกออม.','/games/career/budget-planning-media.html','การงานอาชีพ',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['รายรับ','รายจ่าย','งบประมาณ','การออม']::text[],ARRAY['ง 1.1 ป.4/1','ง 2.1 ป.5/1']::text[]),
      ('worksheet','💰 ใบงานวางแผนรายรับรายจ่าย','ใบงานคู่สื่อ ฝึกคำนวณเงินคงเหลือและเขียนเหตุผลการตัดสินใจใช้เงิน.','/games/career/budget-planning-worksheet.html','การงานอาชีพ',ARRAY['ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','รายรับ','รายจ่าย','การออม']::text[],ARRAY['ง 1.1 ป.4/1','ง 2.1 ป.5/1']::text[]),
      ('media','🦺 ความปลอดภัยในการทำงานและเครื่องมือ','สื่อการงานอาชีพ ป.1–ป.6 ฝึกสำรวจพื้นที่ เลือกเครื่องมือ ป้องกัน และเก็บงานอย่างปลอดภัย.','/games/career/workplace-safety-media.html','การงานอาชีพ',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ความปลอดภัย','เครื่องมือ','การป้องกัน']::text[],ARRAY['ง 1.1 ป.1/1','ง 1.1 ป.4/1']::text[]),
      ('worksheet','🦺 ใบงานความปลอดภัยในการทำงาน','ใบงานคู่สื่อ ฝึกเลือกวิธีปฏิบัติที่ปลอดภัยและเขียนเหตุผลการป้องกัน.','/games/career/workplace-safety-worksheet.html','การงานอาชีพ',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','ความปลอดภัย','เครื่องมือ']::text[],ARRAY['ง 1.1 ป.1/1','ง 1.1 ป.4/1']::text[]),
      ('media','💛 อารมณ์ การพักผ่อน และการดูแลตนเอง','สื่อสุขศึกษา ป.1–ป.6 ฝึกสังเกตอารมณ์ หยุดพัก ขอความช่วยเหลือ และดูแลร่างกาย.','/games/health/emotional-wellbeing-media.html','สุขศึกษา',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['อารมณ์','การพักผ่อน','การดูแลตนเอง']::text[],ARRAY['พ 4.1 ป.1/2','พ 4.1 ป.5/1']::text[]),
      ('worksheet','💛 ใบงานอารมณ์และการดูแลตนเอง','ใบงานคู่สื่อ ฝึกสังเกตอารมณ์และเขียนวิธีดูแลตนเองอย่างปลอดภัย.','/games/health/emotional-wellbeing-worksheet.html','สุขศึกษา',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','อารมณ์','การดูแลตนเอง']::text[],ARRAY['พ 4.1 ป.1/2','พ 4.1 ป.5/1']::text[]),
      ('media','🆘 ความปลอดภัยรอบตัวและการขอความช่วยเหลือ','สื่อสุขศึกษา ป.1–ป.6 ฝึกหยุด ถอย บอกผู้ใหญ่ และรอในจุดปลอดภัย.','/games/health/safety-help-media.html','สุขศึกษา',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ความปลอดภัย','ขอความช่วยเหลือ','สถานการณ์']::text[],ARRAY['พ 5.1 ป.1/1','พ 5.1 ป.4/1']::text[]),
      ('worksheet','🆘 ใบงานความปลอดภัยและการขอความช่วยเหลือ','ใบงานคู่สื่อ ฝึกเรียงขั้นตอนและเขียนข้อความขอความช่วยเหลือ.','/games/health/safety-help-worksheet.html','สุขศึกษา',ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],ARRAY['ใบงาน','ความปลอดภัย','ขอความช่วยเหลือ']::text[],ARRAY['พ 5.1 ป.1/1','พ 5.1 ป.4/1']::text[])
    ) AS row(kind, title, description, external_url, subject, grade_levels, tags, indicator_codes)
  LOOP
    v_url := seed.external_url;
    SELECT id INTO v_item_id
    FROM public.educational_hub_items
    WHERE external_url = v_url
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_item_id IS NULL THEN
      INSERT INTO public.educational_hub_items (
        owner_staff_id, category_id, item_type, title, description, external_url,
        thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
      ) VALUES (
        v_staff_id,
        CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END,
        'link', seed.title, seed.description, seed.external_url,
        '/games/media-lab-assets/learning-scene.svg', seed.subject, seed.grade_levels, seed.tags,
        COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END), 1),
        false, true
      ) RETURNING id INTO v_item_id;
    ELSE
      UPDATE public.educational_hub_items
      SET title = seed.title,
          description = seed.description,
          category_id = CASE WHEN seed.kind = 'media' THEN v_media_category_id ELSE v_worksheet_category_id END,
          thumbnail_url = '/games/media-lab-assets/learning-scene.svg',
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

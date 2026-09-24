-- 536: Upgrade Grammar & Vocab Media with Sequential Storyboard & Detailed Sentence Illustrations
-- Update game_docs and educational_hub_items metadata for /games/english/grammar-vocab-media.html

DO $$
DECLARE
  v_item_id UUID;
  v_staff_id UUID;
BEGIN
  -- 1. ค้นหาครูผู้สอน ณัฐพงศ์ สิงห์ชมภู หรือครูสายการสอน
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching'
    ORDER BY created_at LIMIT 1;
  END IF;

  -- 2. ค้นหา item id ของ grammar-vocab-media.html
  SELECT id INTO v_item_id FROM public.educational_hub_items
  WHERE external_url = '/games/english/grammar-vocab-media.html'
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    -- อัปเดตรายละเอียดใน educational_hub_items
    UPDATE public.educational_hub_items
    SET description = 'สื่อการสอนไวยากรณ์และคำศัพท์ภาษาอังกฤษ ป.4–ป.5 ครบ 6 โมดูลหลัก พร้อมนิทานภาพต่อเนื่อง 4 ฉาก (Sequential Storyboard), ภาพประกอบประโยคความละเอียดสูง, เสียงสองสำเนียง US/UK, Syntax Inspector และใบงาน A4',
        build_version = 'v1.229.88',
        build_updated_at = now(),
        updated_at = now()
    WHERE id = v_item_id;

    -- อัปเดตหรือลงทะเบียน game_docs
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'Interactive Grammar & Sequential Storyboard Studio — 5 โหมดการเรียนรู้, ภาพประกอบการใช้ประโยคละเอียด, นิทานภาพต่อเนื่อง 4 ฉาก (Storyboard) พร้อมเครื่องเล่น Auto-Play, Syntax Inspector, Fixer Lab และ Practice Quiz 15 ข้อ',
      ARRAY[
        '6 โมดูลไวยากรณ์พร้อมภาพประกอบประโยคละเอียด: Verb to Be, Articles, Pronouns, Demonstratives, Prepositions, Helping Verbs',
        'ภาพประกอบเพื่อการศึกษาความละเอียดสูง (WebP Educational Illustrations): จับคู่ภาพสถานการณ์จริงกับทุกประโยคตัวอย่าง',
        'นิทานภาพต่อเนื่อง 4 ฉาก (Sequential Storyboard): 3 เรื่องราวต่อเนื่อง พร้อมฟิล์มสตริปและระบบจำลองลำดับเหตุการณ์',
        'เครื่องเล่นนิทานอัตโนมัติ (Auto-Play Story Theater): บรรยายเสียงต่อเนื่องฉากต่อฉาก พร้อมระบบฝึกพูดตาม (Classroom Echo 3s)',
        'ระบบเสียงพูดสองสำเนียง (Multi-Accent TTS): สลับฟังสำเนียงอเมริกัน 🇺🇸 US และบริติช 🇬🇧 UK ได้ทันที',
        'ตัวตรวจโครงสร้างประโยค (Syntax Inspector): แยกรหัสสีส่วนประกอบประโยค (S + V + O + Prep) พร้อมอธิบายหน้าที่ไวยากรณ์',
        'ห้องแล็บแก้ไวยากรณ์ (Grammar Fixer Lab): ซ่อมประโยคที่ผิดหลักไวยากรณ์พร้อมวิเคราะห์คำใบ้และเฉลยละเอียด',
        'แบบทดสอบประเมินผล 15 ข้อ (Practice Quiz): พร้อมภาพประกอบคู่คำถามทุกข้อ ระบบคะแนน และเหรียญรางวัล',
        'คีย์ลัดสมาร์ตบอร์ด (Smartboard Shortcuts): ปุ่ม 1-5 สลับโหมด, Space อ่านเสียงซ้ำ, ลูกศร ซ้าย-ขวา เลื่อนฉาก/ข้อ, F เต็มจอ',
        'ใบงาน A4 สอดรับเนื้อหา: อัปเกรดสู่สถาปัตยกรรม worksheet-topic.js พร้อม 50 ข้อ 5 ทักษะ ผ่านเกณฑ์ 18 เช็ค'
      ],
      'v1.229.88',
      'ยกระดับสู่ระบบนิทานภาพต่อเนื่อง 4 ฉาก (Sequential Storyboard) และภาพประกอบประโยคความละเอียดสูง'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET features = EXCLUDED.features,
        game_format = EXCLUDED.game_format,
        version = 'v1.229.88',
        notes = EXCLUDED.notes,
        updated_at = now();

    RAISE NOTICE '536: Updated game_docs for grammar-vocab-media.html to v1.229.88';
  ELSE
    RAISE NOTICE '536: Item grammar-vocab-media.html not found, skipping game_docs update';
  END IF;
END $$;

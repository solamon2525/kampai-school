-- 535_upgrade_english_learning_studios.sql
-- ยกระดับสื่อและใบงาน 4 แพ็กเกจภาษาอังกฤษหลักสู่ Interactive Audio-Narrated Learning Studios (v1.229.87)
-- 1. Sight Words — คำอ่านจำ ป.4 (/games/english/sight-words-media.html + sight-words-worksheet.html)
-- 2. Sight Words ป.1–3 (/games/english/sight-words-p123-media.html + sight-words-p123-media-worksheet.html)
-- 3. Grammar & Vocab — สอนและฝึกสั้น (/games/english/grammar-vocab-media.html + grammar-vocab-worksheet.html)
-- 4. Past Tense Mini — สอนและฝึกสั้น (/games/english/past-tense-mini-media.html + past-tense-mini-worksheet.html)

DO $$
DECLARE
  v_staff_id UUID;
  v_id_sw4 UUID;
  v_id_sw123 UUID;
  v_id_gv UUID;
  v_id_pt UUID;
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

  -- 2. อัปเดตสื่อการสอน 4 ชุดใน educational_hub_items
  -- 2.1 Sight Words ป.4
  UPDATE public.educational_hub_items
  SET title = '👁️ Sight Words ป.4 (Sight Words Studio)',
      description = 'สตูดิโอคำอ่านจำภาษาอังกฤษ ป.4 (40 คำสำคัญ) สำรวจหมวดคำ บัตรคำแฟลชการ์ดพร้อมสัทศาสตร์ บริบทประโยค ห้องแล็บเติมคำ และแบบทดสอบ 15 ข้อพร้อมเสียงอ่านสองสำเนียง (US/UK)',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['english','sight-words','vocabulary','reading','phonetics','flashcards','quiz','media']::text[],
      thumbnail_url = '/games/english/sight-words-media-cover.png',
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/sight-words-media.html';

  -- 2.2 Sight Words ป.1–3
  UPDATE public.educational_hub_items
  SET title = '👁️ Sight Words ป.1–3 (Early Readers Studio)',
      description = 'สตูดิโอฝึกคำอ่านจำพื้นฐาน ป.1–ป.3 (60 คำ) แยกตามระดับชั้น กระดานสะกดคำพร้อมภาพประกอบ แฟลชการ์ดเสียงอ่านสองสำเนียง ปริศนาเรียงตัวอักษร และแบบทดสอบท้าทาย',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.1','ป.2','ป.3']::text[],
      tags = ARRAY['english','sight-words','primary','early-reading','spelling','flashcards','quiz','media']::text[],
      thumbnail_url = '/games/english/sight-words-p123-media-cover.png',
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/sight-words-p123-media.html';

  -- 2.3 Grammar & Vocab
  UPDATE public.educational_hub_items
  SET title = '🔤 Grammar & Vocab (English Learning Studio)',
      description = 'สตูดิโอเจาะลึกไวยากรณ์และคำศัพท์ภาษาอังกฤษ ป.4–ป.6 (6 หมวดสำคัญ: Verb to Be, Articles, Pronouns, Demonstratives, Prepositions, Helping Verbs) พร้อมตัวแก้ไขไวยากรณ์และแบบทดสอบ',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['english','grammar','vocabulary','articles','pronouns','prepositions','syntax','quiz','media']::text[],
      thumbnail_url = '/games/english/grammar-vocab-media-cover.png',
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/grammar-vocab-media.html';

  -- 2.4 Past Tense Mini
  UPDATE public.educational_hub_items
  SET title = '📘 Past Tense Mini (Time Machine Studio)',
      description = 'สตูดิโออดีตกาลภาษาอังกฤษ ป.4–ป.6 เส้นเวลาเปรียบเทียบ Past vs Present, ตารางกริยา 3 ช่อง regular (-ed) และ irregular พร้อมเครื่องตรวจจับกาลเวลา และแบบทดสอบ 15 ข้อ',
      subject = 'ภาษาอังกฤษ',
      grade_levels = ARRAY['ป.4','ป.5','ป.6']::text[],
      tags = ARRAY['english','past-tense','grammar','irregular-verbs','timeline','v2','quiz','media']::text[],
      thumbnail_url = '/games/english/past-tense-mini-media-cover.png',
      tracked_game = false,
      is_published = true,
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/past-tense-mini-media.html';

  -- 3. อัปเดตใบงานคู่สื่อการสอนทั้ง 4 ฉบับ
  UPDATE public.educational_hub_items
  SET title = 'ใบงาน Sight Words ป.4–6',
      description = 'ใบงานพิมพ์ A4 คู่สื่อการสอน Sight Words ป.4 ฝึกอ่านจำ แปลความหมาย และใช้คำเชื่อมในประโยค (50 ข้อ เฉลยครู Zero-shift)',
      thumbnail_url = '/games/english/sight-words-media-cover.png',
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/sight-words-worksheet.html';

  UPDATE public.educational_hub_items
  SET title = 'ใบงาน Sight Words ป.1–ป.3',
      description = 'ใบงานพิมพ์ A4 คู่สื่อการสอน Sight Words ป.1–3 ฝึกอ่านคำจำ วงคำ และแต่งประโยคง่ายๆ พร้อมเฉลยครู (50 ข้อ)',
      thumbnail_url = '/games/english/sight-words-p123-media-cover.png',
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/sight-words-p123-media-worksheet.html';

  UPDATE public.educational_hub_items
  SET title = 'ใบงาน Grammar & Vocab ป.4–6',
      description = 'ใบงานพิมพ์ A4 คู่สื่อการสอน Grammar & Vocab 5 ทักษะหลัก (Verb to Be, Articles, Pronouns, Demonstratives, Prepositions) 50 ข้อ พร้อมเฉลยครู Zero-shift',
      thumbnail_url = '/games/english/grammar-vocab-media-cover.png',
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/grammar-vocab-worksheet.html';

  UPDATE public.educational_hub_items
  SET title = 'ใบงาน Past Tense Mini ป.4–6',
      description = 'ใบงานพิมพ์ A4 คู่สื่อการสอน Past Tense Mini สรุปหลักการแปลงกริยาอดีต was/were, -ed และ irregular พร้อมเฉลยครู (50 ข้อ)',
      thumbnail_url = '/games/english/past-tense-mini-media-cover.png',
      build_version = 'v1.229.87',
      build_updated_at = now(),
      updated_at = now()
  WHERE external_url = '/games/english/past-tense-mini-worksheet.html';

  -- 4. ดึง ID ของแต่ละสื่อเพื่อลงทะเบียน game_docs
  SELECT id INTO v_id_sw4 FROM public.educational_hub_items WHERE external_url = '/games/english/sight-words-media.html' LIMIT 1;
  SELECT id INTO v_id_sw123 FROM public.educational_hub_items WHERE external_url = '/games/english/sight-words-p123-media.html' LIMIT 1;
  SELECT id INTO v_id_gv FROM public.educational_hub_items WHERE external_url = '/games/english/grammar-vocab-media.html' LIMIT 1;
  SELECT id INTO v_id_pt FROM public.educational_hub_items WHERE external_url = '/games/english/past-tense-mini-media.html' LIMIT 1;

  -- 4.1 game_docs: Sight Words ป.4
  IF v_id_sw4 IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_id_sw4, v_staff_id,
      'Interactive Vocabulary Studio — สำรวจ 40 คำอ่านจำ ป.4, แฟลชการ์ดสองสำเนียง (US/UK), ห้องแล็บบริบทประโยค และแบบทดสอบ 15 ข้อ',
      ARRAY[
        'คลังคำศัพท์ 40 คำอ่านจำ ป.4: ครอบคลุมคำเชื่อม คำบอกตำแหน่ง และคำศัพท์ความถี่สูงตามมาตรฐาน สพฐ.',
        'บัตรคำอัจฉริยะ (Smart Flashcards): สลับด้านคำศัพท์ คำแปลภาษาไทย สัทอักษรสากล (IPA) และประโยคตัวอย่าง',
        'ระบบเสียงพูดสองสำเนียง (Multi-Accent TTS): รองรับสำเนียงอเมริกัน 🇺🇸 US และบริติช 🇬🇧 UK พร้อมสลับเปิด/ปิดเสียง',
        'ห้องแล็บบริบทประโยค (Context Lab): วิเคราะห์ประโยคจริงและเลือกเติมคำอ่านจำที่สอดคล้องกับความหมายที่สุด',
        'แบบทดสอบความแม่นยำ (Practice Quiz 15 ข้อ): สุ่มคำถามความหมายและการใช้งาน พร้อม Streak และเฉลยภาษาไทยทันที',
        'คีย์ลัดสมาร์ตบอร์ด (Smartboard Shortcuts): กด Space ฟังเสียงอ่าน, ตัวเลข 1-4 สลับแท็บ, ปุ่ม F เปิดเต็มจอ',
        'ระบบตรวจสถานะ (State Inspection Hook): รองรับ window.__getState() สำหรับการทดสอบอัตโนมัติ',
        'ดีไซน์ Classroom-first: ไร้ Horizontal Scrollbar ปรับตามขนาดจอ 360x800 ถึง 1920x1080',
        'ภาพปกคมชัด 16:9 (1280x720): ออกแบบสไตล์เกมเพื่อการศึกษา น่ารัก ปลอดความรุนแรง',
        'ใบงานพิมพ์ A4 คู่ขนาน: สุ่มโจทย์ 50 ข้อ พร้อมระบบเฉลยครู Zero-shift ตรวจสอบผ่านเกณฑ์ 18/18 เช็ค'
      ],
      'v1.229.87', 'ยกระดับเต็มรูปแบบสู่ Interactive Audio-Narrated Studio'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET features = EXCLUDED.features,
        game_format = EXCLUDED.game_format,
        version = 'v1.229.87',
        notes = EXCLUDED.notes,
        updated_at = now();
  END IF;

  -- 4.2 game_docs: Sight Words ป.1–3
  IF v_id_sw123 IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_id_sw123, v_staff_id,
      'Interactive Early Readers Studio — สำรวจ 60 คำอ่านจำ ป.1–3 พร้อมกระดานสะกดคำ แฟลชการ์ดสองสำเนียง และปริศนาคำศัพท์',
      ARRAY[
        'คลังคำอ่านจำ 60 คำ ป.1–3: กรองคำศัพท์ตามระดับชั้น ป.1 (20 คำ), ป.2 (20 คำ), ป.3 (20 คำ) หรือรวมทั้งหมด',
        'กระดานคำศัพท์รูปภาพ (Visual Soundboard): แสดงคำศัพท์พร้อมไอคอนและระบบกดฟังเสียงทันใจ',
        'แฟลชการ์ดฝึกอ่าน: พลิกบัตรคำดูความหมายภาษาไทย คำอ่านโฟนิกส์ และประโยคสั้นๆ เหมาะสำหรับผู้เริ่มต้น',
        'ปริศนาสะกดคำ (Spelling Builder): เรียงตัวอักษรเป็นคำศัพท์ที่ถูกต้อง ฝึกความแม่นยำด้าน Orthography',
        'แบบทดสอบพื้นฐาน 10 ข้อ: แบบทดสอบจับคู่ภาพ เสียง และความหมาย พร้อมเฉลยอธิบายภาษาไทย',
        'ระบบเสียงพูดสองสำเนียง (US/UK TTS): เลือกสำเนียงการออกเสียงที่ต้องการและปรับความเร็วได้',
        'คีย์ลัดสมาร์ตบอร์ด: ควบคุมการเล่นผ่านแป้นพิมพ์ในห้องเรียนเพื่อความสะดวกรวดเร็วของคุณครู',
        'การออกแบบ Responsive เต็มจอ: รองรับสมาร์ตโฟน แท็บเล็ต และจอสัมผัสในห้องเรียนโดยไม่มีแถบเลื่อนข้าง',
        'ภาพปกความละเอียดสูง 16:9: กราฟิกสีสันสดใส สมวัยระดับประถมศึกษาตอนต้น',
        'ใบงานพิมพ์ A4 คู่ขนาน: คลังคำถาม 50 ข้อ สุ่มพิมพ์ได้ทันที พร้อมเฉลยครู'
      ],
      'v1.229.87', 'ยกระดับเต็มรูปแบบสู่ Interactive Early Readers Studio'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET features = EXCLUDED.features,
        game_format = EXCLUDED.game_format,
        version = 'v1.229.87',
        notes = EXCLUDED.notes,
        updated_at = now();
  END IF;

  -- 4.3 game_docs: Grammar & Vocab
  IF v_id_gv IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_id_gv, v_staff_id,
      'Interactive Grammar Studio — 6 โมดูลไวยากรณ์หลัก, ตัวตรวจโครงสร้างประโยค (Syntax Inspector) และห้องแล็บแก้ไขไวยากรณ์',
      ARRAY[
        '6 โมดูลไวยากรณ์หลัก: Verb to Be, Articles, Pronouns, Demonstratives, Prepositions of Place, และ Helping Verbs',
        'การ์ดสูตรและกฎไวยากรณ์: อธิบายโครงสร้างประธาน รูปกริยา ตัวอย่างประโยค และข้อยกเว้นชัดเจน',
        'ตัวตรวจโครงสร้างประโยค (Syntax Inspector): ไฮไลต์ส่วนประกอบประโยค (ประธาน + กริยาช่วย + กริยาหลัก + กรรม/ส่วนเติมเต็ม)',
        'ห้องแล็บแก้ไวยากรณ์ (Grammar Fixer Lab): แก้ไขประโยคที่ผิดไวยากรณ์ให้ถูกต้อง พร้อมอธิบายเหตุผลภาษาไทย',
        'แบบทดสอบไวยากรณ์ 15 ข้อ: ทดสอบครบทั้ง 6 หมวด พร้อมระบบคะแนน Streak และเหรียญรางวัล',
        'ระบบเสียงบรรยายสองสำเนียง (US/UK TTS): อ่านประโยคและหลักการออกเสียงอย่างเป็นธรรมชาติ',
        'คีย์ลัดสมาร์ตบอร์ด: สลับโหมดด้วยปุ่ม 1-4 และสั่งอ่านซ้ำด้วย Spacebar',
        'รองรับทุกขนาดหน้าจอ: ทดสอบจริงบนจอ 360x800 และ 1280x720 โดยไม่มีข้อความล้น',
        'ภาพปกมาตรฐาน 16:9 (1280x720): เวกเตอร์สีสันสดใสธีมการเรียนรู้ไวยากรณ์',
        'ใบงาน A4 สอดรับเนื้อหา: อัปเกรดสู่สถาปัตยกรรม worksheet-topic.js พร้อม 50 ข้อ 5 ทักษะ ผ่านเกณฑ์ 18 เช็ค'
      ],
      'v1.229.87', 'ยกระดับเต็มรูปแบบสู่ Interactive Grammar Studio'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET features = EXCLUDED.features,
        game_format = EXCLUDED.game_format,
        version = 'v1.229.87',
        notes = EXCLUDED.notes,
        updated_at = now();
  END IF;

  -- 4.4 game_docs: Past Tense Mini
  IF v_id_pt IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_id_pt, v_staff_id,
      'Interactive Past Tense Studio — เส้นเวลา Past vs Present, เมทริกซ์กริยา 3 ช่อง regular/irregular และห้องแล็บนักสืบกาลเวลา',
      ARRAY[
        'เส้นเวลากาลอดีต (Visual Time Machine): เปรียบเทียบความแตกต่างระหว่างเหตุการณ์อดีตที่สิ้นสุดแล้วกับปัจจุบัน',
        'ตารางกริยา 3 ช่อง Interactive: ค้นหาและกรองกริยา regular (-ed) และ irregular ได้ทันที พร้อมเสียงอ่าน',
        'กฎการเปลี่ยนรูปกริยา: สรุปหลักการเติม -ed (-d, เบิ้ลพยัญชนะ, เปลี่ยน y เป็น i) และกริยาเปลี่ยนรูปพิเศษ',
        'ห้องแล็บนักสืบเวลา (Time Detective Lab): ค้นหาคำบอกเวลาอดีต (yesterday, last night, ago) เพื่อเติมรูปกริยา V2',
        'แบบทดสอบอดีตกาล 15 ข้อ: ทดสอบทั้ง was/were, regular และ irregular verbs พร้อมบันทึกคะแนน',
        'ระบบเสียงอ่านสองสำเนียง: อ่านคำกริยาและประโยคภาษาอังกฤษด้วยสำเนียงอเมริกันและบริติช',
        'คีย์ลัดสำหรับการสอนในห้องเรียน: สลับโหมดและฟังเสียงอ่านได้สะดวกรวดเร็วผ่านแป้นพิมพ์',
        'รองรับหน้าจอสัมผัสและสมาร์ตบอร์ด: ปุ่มสัมผัสขนาดใหญ่กว่า 44px ใช้งานสะดวกและลื่นไหล',
        'ภาพปกคุณภาพสูง 16:9: ออกแบบสวยงามในสไตล์แฟนตาซีการย้อนเวลาเพื่อการศึกษา',
        'ใบงานคู่สื่อ A4: คลังโจทย์ 50 ข้อครอบคลุม was/were, -ed และ irregular verbs พร้อมเฉลยครู Zero-shift'
      ],
      'v1.229.87', 'ยกระดับเต็มรูปแบบสู่ Interactive Past Tense Studio'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET features = EXCLUDED.features,
        game_format = EXCLUDED.game_format,
        version = 'v1.229.87',
        notes = EXCLUDED.notes,
        updated_at = now();
  END IF;

END $$;

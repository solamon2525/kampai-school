-- ============================================================================
-- Migration 558: Seed English Picture-based Exam Bank (60 Questions) & ENGPIC60
-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 2551
-- บรรจุข้อสอบปรนัยภาษาอังกฤษตอบคำถามจากภาพ (Look at the picture...) จำนวน 60 ข้อ
-- ครอบคลุม 6 หมวด: Colors & Shapes (10), Classroom (10), Animals (10),
-- Food & Fruits (10), Body & Clothes (10), Actions & Weather (10)
-- พร้อมสร้างชุดข้อสอบมาตรฐานพร้อมรหัส PIN "ENGPIC60" สำหรับเปิดสอบและสั่งพิมพ์
-- ============================================================================

-- 1. แทรกข้อสอบภาพ 60 ข้อลงใน exam_questions
INSERT INTO public.exam_questions (
  id, subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, options, answer, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
(
  'e1000000-0000-4000-8000-000000000001'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'easy', 'L1', 'mcq',
  'Look at the picture. What color is this?', '["Red","Blue","Green","Yellow"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สีแดง ภาษาอังกฤษตรงกับคำว่า "Red"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/colors/red.webp'
),
(
  'e1000000-0000-4000-8000-000000000002'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'medium', 'L1', 'mcq',
  'Look at the picture. What color is this?', '["Black","Orange","Pink","Blue"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ สีน้ำเงิน ภาษาอังกฤษตรงกับคำว่า "Blue"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/colors/blue.webp'
),
(
  'e1000000-0000-4000-8000-000000000003'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'hard', 'L1', 'mcq',
  'Look at the picture. What color is this?', '["Green","Purple","Brown","White"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สีเขียว ภาษาอังกฤษตรงกับคำว่า "Green"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/colors/green.webp'
),
(
  'e1000000-0000-4000-8000-000000000004'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'easy', 'L1', 'mcq',
  'Look at the picture. What color is this?', '["Blue","Gray","Red","Yellow"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ สีเหลือง ภาษาอังกฤษตรงกับคำว่า "Yellow"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/colors/yellow.webp'
),
(
  'e1000000-0000-4000-8000-000000000005'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'medium', 'L1', 'mcq',
  'Look at the picture. What color is this?', '["Pink","Black","Green","Brown"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สีชมพู ภาษาอังกฤษตรงกับคำว่า "Pink"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/colors/pink.webp'
),
(
  'e1000000-0000-4000-8000-000000000006'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'hard', 'L1', 'mcq',
  'Look at the picture. What shape is this?', '["Star","Triangle","Square","Circle"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ รูปวงกลม ภาษาอังกฤษตรงกับคำว่า "Circle"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/shapes/circle.webp'
),
(
  'e1000000-0000-4000-8000-000000000007'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'easy', 'L1', 'mcq',
  'Look at the picture. What shape is this?', '["Square","Heart","Oval","Diamond"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รูปสี่เหลี่ยมจัตุรัส ภาษาอังกฤษตรงกับคำว่า "Square"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/shapes/square.webp'
),
(
  'e1000000-0000-4000-8000-000000000008'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'medium', 'L1', 'mcq',
  'Look at the picture. What shape is this?', '["Star","Rectangle","Circle","Triangle"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ รูปสามเหลี่ยม ภาษาอังกฤษตรงกับคำว่า "Triangle"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/shapes/triangle.webp'
),
(
  'e1000000-0000-4000-8000-000000000009'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'hard', 'L1', 'mcq',
  'Look at the picture. What shape is this?', '["Star","Triangle","Oval","Heart"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รูปดาว ภาษาอังกฤษตรงกับคำว่า "Star"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/shapes/star.webp'
),
(
  'e1000000-0000-4000-8000-000000000010'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Colors & Shapes', 'easy', 'L1', 'mcq',
  'Look at the picture. What shape is this?', '["Diamond","Square","Circle","Heart"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ รูปหัวใจ ภาษาอังกฤษตรงกับคำว่า "Heart"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/shapes/heart.webp'
),
(
  'e1000000-0000-4000-8000-000000000011'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a pencil.","It is a ruler.","It is an eraser.","It is a book."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ดินสอ ภาษาอังกฤษตรงกับคำว่า "pencil"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/pencil.webp'
),
(
  'e1000000-0000-4000-8000-000000000012'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a pen.","It is a chair.","It is a bag.","It is a book."]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ หนังสือ ภาษาอังกฤษตรงกับคำว่า "book"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/book.webp'
),
(
  'e1000000-0000-4000-8000-000000000013'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'hard', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a ruler.","It is a pencil.","It is scissors.","It is a crayon."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ไม้บรรทัด ภาษาอังกฤษตรงกับคำว่า "ruler"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/ruler.webp'
),
(
  'e1000000-0000-4000-8000-000000000014'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'easy', 'L1', 'mcq',
  'Look at the picture. What are these?', '["They are books.","They are rulers.","They are pencils.","They are scissors."]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ กรรไกร ภาษาอังกฤษใช้คำพหูพจน์ว่า "scissors"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/scissors.webp'
),
(
  'e1000000-0000-4000-8000-000000000015'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a school bag.","It is a notebook.","It is a calculator.","It is a desk."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ กระเป๋านักเรียน ภาษาอังกฤษตรงกับคำว่า "school bag"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/bag.webp'
),
(
  'e1000000-0000-4000-8000-000000000016'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'hard', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is an eraser.","It is a ruler.","It is a pencil.","It is a pen."]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ปากกา ภาษาอังกฤษตรงกับคำว่า "pen"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/pen.webp'
),
(
  'e1000000-0000-4000-8000-000000000017'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a chair.","It is a table.","It is a door.","It is a window."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ เก้าอี้ ภาษาอังกฤษตรงกับคำว่า "chair"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/chair.webp'
),
(
  'e1000000-0000-4000-8000-000000000018'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a book.","It is a brush.","It is a pen.","It is a crayon."]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ สีเทียน ภาษาอังกฤษตรงกับคำว่า "crayon"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/crayon.webp'
),
(
  'e1000000-0000-4000-8000-000000000019'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'hard', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a notebook.","It is a bag.","It is a ruler.","It is scissors."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สมุดบันทึก ภาษาอังกฤษตรงกับคำว่า "notebook"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/notebook.webp'
),
(
  'e1000000-0000-4000-8000-000000000020'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Classroom Objects', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this?', '["It is a phone.","It is a computer.","It is a clock.","It is a calculator."]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ เครื่องคิดเลข ภาษาอังกฤษตรงกับคำว่า "calculator"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/classroom/calculator.webp'
),
(
  'e1000000-0000-4000-8000-000000000021'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'easy', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["An elephant","A lion","A tiger","A zebra"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ช้าง ภาษาอังกฤษตรงกับคำว่า "An elephant"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/elephant.webp'
),
(
  'e1000000-0000-4000-8000-000000000022'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'medium', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A duck","A rabbit","A dog","A cat"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ แมว ภาษาอังกฤษตรงกับคำว่า "A cat"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/cat.webp'
),
(
  'e1000000-0000-4000-8000-000000000023'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'hard', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A dog","A cat","A wolf","A bear"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สุนัข ภาษาอังกฤษตรงกับคำว่า "A dog"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/dog.webp'
),
(
  'e1000000-0000-4000-8000-000000000024'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'easy', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A monkey","A bird","A frog","A rabbit"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ กระต่าย ภาษาอังกฤษตรงกับคำว่า "A rabbit"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/rabbit.webp'
),
(
  'e1000000-0000-4000-8000-000000000025'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'medium', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A lion","A tiger","A bear","A giraffe"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สิงโต ภาษาอังกฤษตรงกับคำว่า "A lion"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/lion.webp'
),
(
  'e1000000-0000-4000-8000-000000000026'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'hard', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A kangaroo","A zebra","A horse","A giraffe"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ยีราฟคอยาว ภาษาอังกฤษตรงกับคำว่า "A giraffe"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/giraffe.webp'
),
(
  'e1000000-0000-4000-8000-000000000027'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'easy', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A monkey","A panda","A koala","A fox"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ลิง ภาษาอังกฤษตรงกับคำว่า "A monkey"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/monkey.webp'
),
(
  'e1000000-0000-4000-8000-000000000028'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'medium', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A deer","A cow","A horse","A zebra"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ม้าลาย ภาษาอังกฤษตรงกับคำว่า "A zebra"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/zebra.webp'
),
(
  'e1000000-0000-4000-8000-000000000029'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'hard', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A fish","A duck","A frog","A bird"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ปลา ภาษาอังกฤษตรงกับคำว่า "A fish"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/fish.webp'
),
(
  'e1000000-0000-4000-8000-000000000030'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Animals & Pets', 'easy', 'L1', 'mcq',
  'Look at the picture. What animal is this?', '["A peacock","An owl","A bat","A bird"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ นก ภาษาอังกฤษตรงกับคำว่า "A bird"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/animals/bird.webp'
),
(
  'e1000000-0000-4000-8000-000000000031'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'easy', 'L1', 'mcq',
  'Look at the picture. What fruit is this?', '["An apple","An orange","A mango","A banana"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ผลแอปเปิ้ล ภาษาอังกฤษตรงกับคำว่า "An apple"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/fruits/apple.webp'
),
(
  'e1000000-0000-4000-8000-000000000032'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'medium', 'L1', 'mcq',
  'Look at the picture. What fruit is this?', '["A banana","A papaya","A pineapple","A watermelon"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ผลกล้วย ภาษาอังกฤษตรงกับคำว่า "A banana"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/fruits/banana.webp'
),
(
  'e1000000-0000-4000-8000-000000000033'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'hard', 'L1', 'mcq',
  'Look at the picture. What fruit is this?', '["An orange","A lemon","An apple","A strawberry"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ผลส้ม ภาษาอังกฤษตรงกับคำว่า "An orange"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/fruits/orange.webp'
),
(
  'e1000000-0000-4000-8000-000000000034'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'easy', 'L1', 'mcq',
  'Look at the picture. What fruit is this?', '["A watermelon","A coconut","A peach","A grape"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ แตงโม ภาษาอังกฤษตรงกับคำว่า "A watermelon"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/fruits/watermelon.webp'
),
(
  'e1000000-0000-4000-8000-000000000035'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'medium', 'L1', 'mcq',
  'Look at the picture. What fruit is this?', '["A strawberry","A cherry","A grape","A plum"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สตรอว์เบอร์รี ภาษาอังกฤษตรงกับคำว่า "A strawberry"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/fruits/strawberry.webp'
),
(
  'e1000000-0000-4000-8000-000000000036'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'hard', 'L1', 'mcq',
  'Look at the picture. What drink is this?', '["Milk","Juice","Tea","Water"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ แก้วนมสด ภาษาอังกฤษตรงกับคำว่า "Milk"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/food/milk.webp'
),
(
  'e1000000-0000-4000-8000-000000000037'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'easy', 'L1', 'mcq',
  'Look at the picture. What food is this?', '["Bread","Rice","Pizza","Cake"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ขนมปังแถว ภาษาอังกฤษตรงกับคำว่า "Bread"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/food/bread.webp'
),
(
  'e1000000-0000-4000-8000-000000000038'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this?', '["An egg","Cheese","Butter","Meat"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ไข่ไก่ ภาษาอังกฤษตรงกับคำว่า "An egg"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/food/egg.webp'
),
(
  'e1000000-0000-4000-8000-000000000039'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'hard', 'L1', 'mcq',
  'Look at the picture. What food is this?', '["Pizza","Hamburger","Sandwich","Noodles"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ถาดพิซซ่า ภาษาอังกฤษตรงกับคำว่า "Pizza"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/food/pizza.webp'
),
(
  'e1000000-0000-4000-8000-000000000040'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Food & Fruits', 'easy', 'L1', 'mcq',
  'Look at the picture. What dessert is this?', '["Ice cream","Cake","Chocolate","Cookie"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ไอศกรีมโคน ภาษาอังกฤษตรงกับคำว่า "Ice cream"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/food/ice-cream.webp'
),
(
  'e1000000-0000-4000-8000-000000000041'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this part of the body?', '["Eye","Ear","Nose","Mouth"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ดวงตา ภาษาอังกฤษตรงกับคำว่า "Eye"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/body/eye.webp'
),
(
  'e1000000-0000-4000-8000-000000000042'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this part of the body?', '["Arm","Head","Eye","Ear"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ใบหู ภาษาอังกฤษตรงกับคำว่า "Ear"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/body/ear.webp'
),
(
  'e1000000-0000-4000-8000-000000000043'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'hard', 'L1', 'mcq',
  'Look at the picture. What is this part of the body?', '["Nose","Mouth","Hand","Leg"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ จมูก ภาษาอังกฤษตรงกับคำว่า "Nose"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/body/nose.webp'
),
(
  'e1000000-0000-4000-8000-000000000044'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this part of the body?', '["Ear","Foot","Nose","Mouth"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ปาก ภาษาอังกฤษตรงกับคำว่า "Mouth"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/body/mouth.webp'
),
(
  'e1000000-0000-4000-8000-000000000045'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this part of the body?', '["Hand","Foot","Arm","Leg"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ฝ่ามือ ภาษาอังกฤษตรงกับคำว่า "Hand"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/body/hand.webp'
),
(
  'e1000000-0000-4000-8000-000000000046'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'hard', 'L1', 'mcq',
  'Look at the picture. What is this?', '["Shoes","Pants","A shirt","A hat"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ หมวก ภาษาอังกฤษตรงกับคำว่า "A hat"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/clothes/hat.webp'
),
(
  'e1000000-0000-4000-8000-000000000047'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'easy', 'L1', 'mcq',
  'Look at the picture. What is this?', '["A shirt","A dress","A jacket","A scarf"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ เสื้อเชิ้ต ภาษาอังกฤษตรงกับคำว่า "A shirt"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/clothes/shirt.webp'
),
(
  'e1000000-0000-4000-8000-000000000048'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'medium', 'L1', 'mcq',
  'Look at the picture. What is this?', '["Socks","Boots","Pants","A dress"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ชุดกระโปรงเดรส ภาษาอังกฤษตรงกับคำว่า "A dress"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/clothes/dress.webp'
),
(
  'e1000000-0000-4000-8000-000000000049'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'hard', 'L1', 'mcq',
  'Look at the picture. What are these?', '["Shoes","Socks","Gloves","Boots"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รองเท้าคู่ ภาษาอังกฤษตรงกับคำว่า "Shoes"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/clothes/shoes.webp'
),
(
  'e1000000-0000-4000-8000-000000000050'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Body Parts & Clothes', 'easy', 'L1', 'mcq',
  'Look at the picture. What are these?', '["Gloves","Pants","Shoes","Socks"]'::jsonb, to_jsonb('3'::text), 'จากภาพคือ ถุงเท้าคู่ ภาษาอังกฤษตรงกับคำว่า "Socks"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/clothes/socks.webp'
),
(
  'e1000000-0000-4000-8000-000000000051'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'easy', 'L2', 'mcq',
  'Look at the picture. What is the boy doing?', '["He is running.","He is sleeping.","He is reading.","He is swimming."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ เด็กผู้ชายกำลังวิ่ง ภาษาอังกฤษตรงกับ "He is running."',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/verbs/run.webp'
),
(
  'e1000000-0000-4000-8000-000000000052'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'medium', 'L2', 'mcq',
  'Look at the picture. What is the girl doing?', '["She is swimming.","She is dancing.","She is cooking.","She is jumping."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ กำลังว่ายน้ำ ภาษาอังกฤษตรงกับ "She is swimming."',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/verbs/swim.webp'
),
(
  'e1000000-0000-4000-8000-000000000053'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'hard', 'L2', 'mcq',
  'Look at the picture. What is he doing?', '["He is reading a book.","He is writing.","He is eating.","He is drinking."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ กำลังอ่านหนังสือ ภาษาอังกฤษตรงกับ "He is reading a book."',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/verbs/read.webp'
),
(
  'e1000000-0000-4000-8000-000000000054'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'easy', 'L2', 'mcq',
  'Look at the picture. What is the child doing?', '["Sleeping","Dancing","Singing","Walking"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ กำลังนอนหลับ ภาษาอังกฤษตรงกับคำว่า "Sleeping"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/verbs/sleep.webp'
),
(
  'e1000000-0000-4000-8000-000000000055'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'medium', 'L2', 'mcq',
  'Look at the picture. What vehicle is this?', '["A car","A bus","A bicycle","A train"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รถยนต์ ภาษาอังกฤษตรงกับคำว่า "A car"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/transportation/car.webp'
),
(
  'e1000000-0000-4000-8000-000000000056'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'hard', 'L2', 'mcq',
  'Look at the picture. What vehicle is this?', '["A bicycle","A motorcycle","A boat","An airplane"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รถจักรยาน ภาษาอังกฤษตรงกับคำว่า "A bicycle"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/transportation/bicycle.webp'
),
(
  'e1000000-0000-4000-8000-000000000057'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'easy', 'L2', 'mcq',
  'Look at the picture. What vehicle is this?', '["An airplane","A helicopter","A ship","A train"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ เครื่องบิน ภาษาอังกฤษตรงกับคำว่า "An airplane"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/transportation/airplane.webp'
),
(
  'e1000000-0000-4000-8000-000000000058'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'medium', 'L2', 'mcq',
  'Look at the picture. How is the weather?', '["It is sunny.","It is rainy.","It is snowy.","It is cloudy."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ ท้องฟ้าแจ่มใสมีแดดจัด ภาษาอังกฤษตรงกับ "It is sunny."',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/weather/sunny.webp'
),
(
  'e1000000-0000-4000-8000-000000000059'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'hard', 'L2', 'mcq',
  'Look at the picture. How is the weather?', '["It is rainy.","It is windy.","It is stormy.","It is cold."]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ สภาพอากาศมีฝนตก ภาษาอังกฤษตรงกับ "It is rainy."',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/weather/rainy.webp'
),
(
  'e1000000-0000-4000-8000-000000000060'::uuid, 'ภาษาอังกฤษ', 'ป.4', 'Visual Vocabulary: Actions, Vehicles & Weather', 'easy', 'L2', 'mcq',
  'Look at the picture. What do you see in the sky?', '["A rainbow","A cloud","The sun","Stars"]'::jsonb, to_jsonb('0'::text), 'จากภาพคือ รุ้งกินน้ำบนท้องฟ้า ภาษาอังกฤษตรงกับคำว่า "A rainbow"',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน', '2cc2e12b-eff6-475f-894e-f09822fcacb2'::uuid, 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)', '/games/english/vocab-hub-assets/weather/rainbow.webp'
);

-- 2. สร้างหรืออัปเดตชุดข้อสอบมาตรฐาน ENGPIC60 ใน exam_sets

INSERT INTO public.exam_sets (
  id, title, subject, grade, pin_code, time_limit_minutes, pass_threshold_pct, is_active, questions
) VALUES (
  'e0033333-3333-4444-8888-000000000003'::uuid,
  'แบบทดสอบคำศัพท์ภาษาอังกฤษจากภาพ ป.4 (English Picture Vocabulary Quiz 60)',
  'ภาษาอังกฤษ',
  'ป.4',
  'ENGPIC60',
  45,
  60,
  true,
  '[{"id":"e1000000-0000-4000-8000-000000000001","question":"Look at the picture. What color is this?","question_text":"Look at the picture. What color is this?","options":["Red","Blue","Green","Yellow"],"answer":"0","explanation":"จากภาพคือ สีแดง ภาษาอังกฤษตรงกับคำว่า \"Red\"","media_image_url":"/games/english/vocab-hub-assets/colors/red.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000002","question":"Look at the picture. What color is this?","question_text":"Look at the picture. What color is this?","options":["Black","Orange","Pink","Blue"],"answer":"3","explanation":"จากภาพคือ สีน้ำเงิน ภาษาอังกฤษตรงกับคำว่า \"Blue\"","media_image_url":"/games/english/vocab-hub-assets/colors/blue.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000003","question":"Look at the picture. What color is this?","question_text":"Look at the picture. What color is this?","options":["Green","Purple","Brown","White"],"answer":"0","explanation":"จากภาพคือ สีเขียว ภาษาอังกฤษตรงกับคำว่า \"Green\"","media_image_url":"/games/english/vocab-hub-assets/colors/green.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000004","question":"Look at the picture. What color is this?","question_text":"Look at the picture. What color is this?","options":["Blue","Gray","Red","Yellow"],"answer":"3","explanation":"จากภาพคือ สีเหลือง ภาษาอังกฤษตรงกับคำว่า \"Yellow\"","media_image_url":"/games/english/vocab-hub-assets/colors/yellow.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000005","question":"Look at the picture. What color is this?","question_text":"Look at the picture. What color is this?","options":["Pink","Black","Green","Brown"],"answer":"0","explanation":"จากภาพคือ สีชมพู ภาษาอังกฤษตรงกับคำว่า \"Pink\"","media_image_url":"/games/english/vocab-hub-assets/colors/pink.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000006","question":"Look at the picture. What shape is this?","question_text":"Look at the picture. What shape is this?","options":["Star","Triangle","Square","Circle"],"answer":"3","explanation":"จากภาพคือ รูปวงกลม ภาษาอังกฤษตรงกับคำว่า \"Circle\"","media_image_url":"/games/english/vocab-hub-assets/shapes/circle.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000007","question":"Look at the picture. What shape is this?","question_text":"Look at the picture. What shape is this?","options":["Square","Heart","Oval","Diamond"],"answer":"0","explanation":"จากภาพคือ รูปสี่เหลี่ยมจัตุรัส ภาษาอังกฤษตรงกับคำว่า \"Square\"","media_image_url":"/games/english/vocab-hub-assets/shapes/square.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000008","question":"Look at the picture. What shape is this?","question_text":"Look at the picture. What shape is this?","options":["Star","Rectangle","Circle","Triangle"],"answer":"3","explanation":"จากภาพคือ รูปสามเหลี่ยม ภาษาอังกฤษตรงกับคำว่า \"Triangle\"","media_image_url":"/games/english/vocab-hub-assets/shapes/triangle.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000009","question":"Look at the picture. What shape is this?","question_text":"Look at the picture. What shape is this?","options":["Star","Triangle","Oval","Heart"],"answer":"0","explanation":"จากภาพคือ รูปดาว ภาษาอังกฤษตรงกับคำว่า \"Star\"","media_image_url":"/games/english/vocab-hub-assets/shapes/star.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000010","question":"Look at the picture. What shape is this?","question_text":"Look at the picture. What shape is this?","options":["Diamond","Square","Circle","Heart"],"answer":"3","explanation":"จากภาพคือ รูปหัวใจ ภาษาอังกฤษตรงกับคำว่า \"Heart\"","media_image_url":"/games/english/vocab-hub-assets/shapes/heart.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000011","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a pencil.","It is a ruler.","It is an eraser.","It is a book."],"answer":"0","explanation":"จากภาพคือ ดินสอ ภาษาอังกฤษตรงกับคำว่า \"pencil\"","media_image_url":"/games/english/vocab-hub-assets/classroom/pencil.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000012","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a pen.","It is a chair.","It is a bag.","It is a book."],"answer":"3","explanation":"จากภาพคือ หนังสือ ภาษาอังกฤษตรงกับคำว่า \"book\"","media_image_url":"/games/english/vocab-hub-assets/classroom/book.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000013","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a ruler.","It is a pencil.","It is scissors.","It is a crayon."],"answer":"0","explanation":"จากภาพคือ ไม้บรรทัด ภาษาอังกฤษตรงกับคำว่า \"ruler\"","media_image_url":"/games/english/vocab-hub-assets/classroom/ruler.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000014","question":"Look at the picture. What are these?","question_text":"Look at the picture. What are these?","options":["They are books.","They are rulers.","They are pencils.","They are scissors."],"answer":"3","explanation":"จากภาพคือ กรรไกร ภาษาอังกฤษใช้คำพหูพจน์ว่า \"scissors\"","media_image_url":"/games/english/vocab-hub-assets/classroom/scissors.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000015","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a school bag.","It is a notebook.","It is a calculator.","It is a desk."],"answer":"0","explanation":"จากภาพคือ กระเป๋านักเรียน ภาษาอังกฤษตรงกับคำว่า \"school bag\"","media_image_url":"/games/english/vocab-hub-assets/classroom/bag.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000016","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is an eraser.","It is a ruler.","It is a pencil.","It is a pen."],"answer":"3","explanation":"จากภาพคือ ปากกา ภาษาอังกฤษตรงกับคำว่า \"pen\"","media_image_url":"/games/english/vocab-hub-assets/classroom/pen.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000017","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a chair.","It is a table.","It is a door.","It is a window."],"answer":"0","explanation":"จากภาพคือ เก้าอี้ ภาษาอังกฤษตรงกับคำว่า \"chair\"","media_image_url":"/games/english/vocab-hub-assets/classroom/chair.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000018","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a book.","It is a brush.","It is a pen.","It is a crayon."],"answer":"3","explanation":"จากภาพคือ สีเทียน ภาษาอังกฤษตรงกับคำว่า \"crayon\"","media_image_url":"/games/english/vocab-hub-assets/classroom/crayon.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000019","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a notebook.","It is a bag.","It is a ruler.","It is scissors."],"answer":"0","explanation":"จากภาพคือ สมุดบันทึก ภาษาอังกฤษตรงกับคำว่า \"notebook\"","media_image_url":"/games/english/vocab-hub-assets/classroom/notebook.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000020","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["It is a phone.","It is a computer.","It is a clock.","It is a calculator."],"answer":"3","explanation":"จากภาพคือ เครื่องคิดเลข ภาษาอังกฤษตรงกับคำว่า \"calculator\"","media_image_url":"/games/english/vocab-hub-assets/classroom/calculator.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000021","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["An elephant","A lion","A tiger","A zebra"],"answer":"0","explanation":"จากภาพคือ ช้าง ภาษาอังกฤษตรงกับคำว่า \"An elephant\"","media_image_url":"/games/english/vocab-hub-assets/animals/elephant.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000022","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A duck","A rabbit","A dog","A cat"],"answer":"3","explanation":"จากภาพคือ แมว ภาษาอังกฤษตรงกับคำว่า \"A cat\"","media_image_url":"/games/english/vocab-hub-assets/animals/cat.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000023","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A dog","A cat","A wolf","A bear"],"answer":"0","explanation":"จากภาพคือ สุนัข ภาษาอังกฤษตรงกับคำว่า \"A dog\"","media_image_url":"/games/english/vocab-hub-assets/animals/dog.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000024","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A monkey","A bird","A frog","A rabbit"],"answer":"3","explanation":"จากภาพคือ กระต่าย ภาษาอังกฤษตรงกับคำว่า \"A rabbit\"","media_image_url":"/games/english/vocab-hub-assets/animals/rabbit.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000025","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A lion","A tiger","A bear","A giraffe"],"answer":"0","explanation":"จากภาพคือ สิงโต ภาษาอังกฤษตรงกับคำว่า \"A lion\"","media_image_url":"/games/english/vocab-hub-assets/animals/lion.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000026","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A kangaroo","A zebra","A horse","A giraffe"],"answer":"3","explanation":"จากภาพคือ ยีราฟคอยาว ภาษาอังกฤษตรงกับคำว่า \"A giraffe\"","media_image_url":"/games/english/vocab-hub-assets/animals/giraffe.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000027","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A monkey","A panda","A koala","A fox"],"answer":"0","explanation":"จากภาพคือ ลิง ภาษาอังกฤษตรงกับคำว่า \"A monkey\"","media_image_url":"/games/english/vocab-hub-assets/animals/monkey.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000028","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A deer","A cow","A horse","A zebra"],"answer":"3","explanation":"จากภาพคือ ม้าลาย ภาษาอังกฤษตรงกับคำว่า \"A zebra\"","media_image_url":"/games/english/vocab-hub-assets/animals/zebra.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000029","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A fish","A duck","A frog","A bird"],"answer":"0","explanation":"จากภาพคือ ปลา ภาษาอังกฤษตรงกับคำว่า \"A fish\"","media_image_url":"/games/english/vocab-hub-assets/animals/fish.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000030","question":"Look at the picture. What animal is this?","question_text":"Look at the picture. What animal is this?","options":["A peacock","An owl","A bat","A bird"],"answer":"3","explanation":"จากภาพคือ นก ภาษาอังกฤษตรงกับคำว่า \"A bird\"","media_image_url":"/games/english/vocab-hub-assets/animals/bird.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000031","question":"Look at the picture. What fruit is this?","question_text":"Look at the picture. What fruit is this?","options":["An apple","An orange","A mango","A banana"],"answer":"0","explanation":"จากภาพคือ ผลแอปเปิ้ล ภาษาอังกฤษตรงกับคำว่า \"An apple\"","media_image_url":"/games/english/vocab-hub-assets/fruits/apple.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000032","question":"Look at the picture. What fruit is this?","question_text":"Look at the picture. What fruit is this?","options":["A banana","A papaya","A pineapple","A watermelon"],"answer":"0","explanation":"จากภาพคือ ผลกล้วย ภาษาอังกฤษตรงกับคำว่า \"A banana\"","media_image_url":"/games/english/vocab-hub-assets/fruits/banana.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000033","question":"Look at the picture. What fruit is this?","question_text":"Look at the picture. What fruit is this?","options":["An orange","A lemon","An apple","A strawberry"],"answer":"0","explanation":"จากภาพคือ ผลส้ม ภาษาอังกฤษตรงกับคำว่า \"An orange\"","media_image_url":"/games/english/vocab-hub-assets/fruits/orange.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000034","question":"Look at the picture. What fruit is this?","question_text":"Look at the picture. What fruit is this?","options":["A watermelon","A coconut","A peach","A grape"],"answer":"0","explanation":"จากภาพคือ แตงโม ภาษาอังกฤษตรงกับคำว่า \"A watermelon\"","media_image_url":"/games/english/vocab-hub-assets/fruits/watermelon.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000035","question":"Look at the picture. What fruit is this?","question_text":"Look at the picture. What fruit is this?","options":["A strawberry","A cherry","A grape","A plum"],"answer":"0","explanation":"จากภาพคือ สตรอว์เบอร์รี ภาษาอังกฤษตรงกับคำว่า \"A strawberry\"","media_image_url":"/games/english/vocab-hub-assets/fruits/strawberry.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000036","question":"Look at the picture. What drink is this?","question_text":"Look at the picture. What drink is this?","options":["Milk","Juice","Tea","Water"],"answer":"0","explanation":"จากภาพคือ แก้วนมสด ภาษาอังกฤษตรงกับคำว่า \"Milk\"","media_image_url":"/games/english/vocab-hub-assets/food/milk.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000037","question":"Look at the picture. What food is this?","question_text":"Look at the picture. What food is this?","options":["Bread","Rice","Pizza","Cake"],"answer":"0","explanation":"จากภาพคือ ขนมปังแถว ภาษาอังกฤษตรงกับคำว่า \"Bread\"","media_image_url":"/games/english/vocab-hub-assets/food/bread.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000038","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["An egg","Cheese","Butter","Meat"],"answer":"0","explanation":"จากภาพคือ ไข่ไก่ ภาษาอังกฤษตรงกับคำว่า \"An egg\"","media_image_url":"/games/english/vocab-hub-assets/food/egg.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000039","question":"Look at the picture. What food is this?","question_text":"Look at the picture. What food is this?","options":["Pizza","Hamburger","Sandwich","Noodles"],"answer":"0","explanation":"จากภาพคือ ถาดพิซซ่า ภาษาอังกฤษตรงกับคำว่า \"Pizza\"","media_image_url":"/games/english/vocab-hub-assets/food/pizza.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000040","question":"Look at the picture. What dessert is this?","question_text":"Look at the picture. What dessert is this?","options":["Ice cream","Cake","Chocolate","Cookie"],"answer":"0","explanation":"จากภาพคือ ไอศกรีมโคน ภาษาอังกฤษตรงกับคำว่า \"Ice cream\"","media_image_url":"/games/english/vocab-hub-assets/food/ice-cream.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000041","question":"Look at the picture. What is this part of the body?","question_text":"Look at the picture. What is this part of the body?","options":["Eye","Ear","Nose","Mouth"],"answer":"0","explanation":"จากภาพคือ ดวงตา ภาษาอังกฤษตรงกับคำว่า \"Eye\"","media_image_url":"/games/english/vocab-hub-assets/body/eye.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000042","question":"Look at the picture. What is this part of the body?","question_text":"Look at the picture. What is this part of the body?","options":["Arm","Head","Eye","Ear"],"answer":"3","explanation":"จากภาพคือ ใบหู ภาษาอังกฤษตรงกับคำว่า \"Ear\"","media_image_url":"/games/english/vocab-hub-assets/body/ear.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000043","question":"Look at the picture. What is this part of the body?","question_text":"Look at the picture. What is this part of the body?","options":["Nose","Mouth","Hand","Leg"],"answer":"0","explanation":"จากภาพคือ จมูก ภาษาอังกฤษตรงกับคำว่า \"Nose\"","media_image_url":"/games/english/vocab-hub-assets/body/nose.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000044","question":"Look at the picture. What is this part of the body?","question_text":"Look at the picture. What is this part of the body?","options":["Ear","Foot","Nose","Mouth"],"answer":"3","explanation":"จากภาพคือ ปาก ภาษาอังกฤษตรงกับคำว่า \"Mouth\"","media_image_url":"/games/english/vocab-hub-assets/body/mouth.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000045","question":"Look at the picture. What is this part of the body?","question_text":"Look at the picture. What is this part of the body?","options":["Hand","Foot","Arm","Leg"],"answer":"0","explanation":"จากภาพคือ ฝ่ามือ ภาษาอังกฤษตรงกับคำว่า \"Hand\"","media_image_url":"/games/english/vocab-hub-assets/body/hand.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000046","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["Shoes","Pants","A shirt","A hat"],"answer":"3","explanation":"จากภาพคือ หมวก ภาษาอังกฤษตรงกับคำว่า \"A hat\"","media_image_url":"/games/english/vocab-hub-assets/clothes/hat.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000047","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["A shirt","A dress","A jacket","A scarf"],"answer":"0","explanation":"จากภาพคือ เสื้อเชิ้ต ภาษาอังกฤษตรงกับคำว่า \"A shirt\"","media_image_url":"/games/english/vocab-hub-assets/clothes/shirt.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000048","question":"Look at the picture. What is this?","question_text":"Look at the picture. What is this?","options":["Socks","Boots","Pants","A dress"],"answer":"3","explanation":"จากภาพคือ ชุดกระโปรงเดรส ภาษาอังกฤษตรงกับคำว่า \"A dress\"","media_image_url":"/games/english/vocab-hub-assets/clothes/dress.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000049","question":"Look at the picture. What are these?","question_text":"Look at the picture. What are these?","options":["Shoes","Socks","Gloves","Boots"],"answer":"0","explanation":"จากภาพคือ รองเท้าคู่ ภาษาอังกฤษตรงกับคำว่า \"Shoes\"","media_image_url":"/games/english/vocab-hub-assets/clothes/shoes.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000050","question":"Look at the picture. What are these?","question_text":"Look at the picture. What are these?","options":["Gloves","Pants","Shoes","Socks"],"answer":"3","explanation":"จากภาพคือ ถุงเท้าคู่ ภาษาอังกฤษตรงกับคำว่า \"Socks\"","media_image_url":"/games/english/vocab-hub-assets/clothes/socks.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000051","question":"Look at the picture. What is the boy doing?","question_text":"Look at the picture. What is the boy doing?","options":["He is running.","He is sleeping.","He is reading.","He is swimming."],"answer":"0","explanation":"จากภาพคือ เด็กผู้ชายกำลังวิ่ง ภาษาอังกฤษตรงกับ \"He is running.\"","media_image_url":"/games/english/vocab-hub-assets/verbs/run.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000052","question":"Look at the picture. What is the girl doing?","question_text":"Look at the picture. What is the girl doing?","options":["She is swimming.","She is dancing.","She is cooking.","She is jumping."],"answer":"0","explanation":"จากภาพคือ กำลังว่ายน้ำ ภาษาอังกฤษตรงกับ \"She is swimming.\"","media_image_url":"/games/english/vocab-hub-assets/verbs/swim.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000053","question":"Look at the picture. What is he doing?","question_text":"Look at the picture. What is he doing?","options":["He is reading a book.","He is writing.","He is eating.","He is drinking."],"answer":"0","explanation":"จากภาพคือ กำลังอ่านหนังสือ ภาษาอังกฤษตรงกับ \"He is reading a book.\"","media_image_url":"/games/english/vocab-hub-assets/verbs/read.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000054","question":"Look at the picture. What is the child doing?","question_text":"Look at the picture. What is the child doing?","options":["Sleeping","Dancing","Singing","Walking"],"answer":"0","explanation":"จากภาพคือ กำลังนอนหลับ ภาษาอังกฤษตรงกับคำว่า \"Sleeping\"","media_image_url":"/games/english/vocab-hub-assets/verbs/sleep.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000055","question":"Look at the picture. What vehicle is this?","question_text":"Look at the picture. What vehicle is this?","options":["A car","A bus","A bicycle","A train"],"answer":"0","explanation":"จากภาพคือ รถยนต์ ภาษาอังกฤษตรงกับคำว่า \"A car\"","media_image_url":"/games/english/vocab-hub-assets/transportation/car.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000056","question":"Look at the picture. What vehicle is this?","question_text":"Look at the picture. What vehicle is this?","options":["A bicycle","A motorcycle","A boat","An airplane"],"answer":"0","explanation":"จากภาพคือ รถจักรยาน ภาษาอังกฤษตรงกับคำว่า \"A bicycle\"","media_image_url":"/games/english/vocab-hub-assets/transportation/bicycle.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000057","question":"Look at the picture. What vehicle is this?","question_text":"Look at the picture. What vehicle is this?","options":["An airplane","A helicopter","A ship","A train"],"answer":"0","explanation":"จากภาพคือ เครื่องบิน ภาษาอังกฤษตรงกับคำว่า \"An airplane\"","media_image_url":"/games/english/vocab-hub-assets/transportation/airplane.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000058","question":"Look at the picture. How is the weather?","question_text":"Look at the picture. How is the weather?","options":["It is sunny.","It is rainy.","It is snowy.","It is cloudy."],"answer":"0","explanation":"จากภาพคือ ท้องฟ้าแจ่มใสมีแดดจัด ภาษาอังกฤษตรงกับ \"It is sunny.\"","media_image_url":"/games/english/vocab-hub-assets/weather/sunny.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000059","question":"Look at the picture. How is the weather?","question_text":"Look at the picture. How is the weather?","options":["It is rainy.","It is windy.","It is stormy.","It is cold."],"answer":"0","explanation":"จากภาพคือ สภาพอากาศมีฝนตก ภาษาอังกฤษตรงกับ \"It is rainy.\"","media_image_url":"/games/english/vocab-hub-assets/weather/rainy.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"},{"id":"e1000000-0000-4000-8000-000000000060","question":"Look at the picture. What do you see in the sky?","question_text":"Look at the picture. What do you see in the sky?","options":["A rainbow","A cloud","The sun","Stars"],"answer":"0","explanation":"จากภาพคือ รุ้งกินน้ำบนท้องฟ้า ภาษาอังกฤษตรงกับคำว่า \"A rainbow\"","media_image_url":"/games/english/vocab-hub-assets/weather/rainbow.webp","media_title":"คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)","points":1,"question_type":"mcq"}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  pin_code = EXCLUDED.pin_code,
  questions = EXCLUDED.questions,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- Migration 552: Seed Mixed Exam Bank (Fill-in & Essay), Link Indicators, and Standard Sets
-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ.
-- ============================================================================

-- 1. Batch Indicator Alignment for Existing 1,500 MCQ Questions
UPDATE public.exam_questions
SET 
  indicator_code = CASE
    WHEN subject = 'คณิตศาสตร์' AND (topic ILIKE '%จำนวน%' OR topic ILIKE '%บวก%' OR topic ILIKE '%ลบ%' OR topic ILIKE '%คูณ%' OR topic ILIKE '%หาร%') THEN 'ค 1.1 ป.4/10'
    WHEN subject = 'คณิตศาสตร์' AND (topic ILIKE '%เศษส่วน%' OR topic ILIKE '%ทศนิยม%') THEN 'ค 1.1 ป.4/3'
    WHEN subject = 'คณิตศาสตร์' AND (topic ILIKE '%เรขาคณิต%' OR topic ILIKE '%มุม%' OR topic ILIKE '%รูปทรง%') THEN 'ค 2.2 ป.4/1'
    WHEN subject = 'คณิตศาสตร์' AND (topic ILIKE '%พื้นที่%' OR topic ILIKE '%ความยาว%') THEN 'ค 2.1 ป.4/1'
    WHEN subject = 'คณิตศาสตร์' THEN 'ค 1.1 ป.4/11'
    
    WHEN subject = 'ภาษาไทย' AND (topic ILIKE '%อ่าน%' OR topic ILIKE '%ใจความ%') THEN 'ท 1.1 ป.4/3'
    WHEN subject = 'ภาษาไทย' AND (topic ILIKE '%เขียน%' OR topic ILIKE '%เรียงความ%') THEN 'ท 2.1 ป.4/1'
    WHEN subject = 'ภาษาไทย' AND (topic ILIKE '%คำนาม%' OR topic ILIKE '%คำสรรพนาม%' OR topic ILIKE '%ชนิดของคำ%') THEN 'ท 4.1 ป.4/1'
    WHEN subject = 'ภาษาไทย' AND (topic ILIKE '%วรรณคดี%' OR topic ILIKE '%นิทาน%') THEN 'ท 5.1 ป.4/1'
    WHEN subject = 'ภาษาไทย' THEN 'ท 1.1 ป.4/1'

    WHEN subject = 'วิทยาศาสตร์' AND (topic ILIKE '%พืช%' OR topic ILIKE '%สัตว์%' OR topic ILIKE '%สิ่งมีชีวิต%') THEN 'ว 1.2 ป.4/1'
    WHEN subject = 'วิทยาศาสตร์' AND (topic ILIKE '%สาร%' OR topic ILIKE '%สถานะ%' OR topic ILIKE '%สมบัติ%') THEN 'ว 2.1 ป.4/1'
    WHEN subject = 'วิทยาศาสตร์' AND (topic ILIKE '%แรง%' OR topic ILIKE '%การเคลื่อนที่%' OR topic ILIKE '%แสง%') THEN 'ว 2.2 ป.4/1'
    WHEN subject = 'วิทยาศาสตร์' AND (topic ILIKE '%ดวงดาว%' OR topic ILIKE '%สุริยะ%' OR topic ILIKE '%ดวงจันทร์%') THEN 'ว 3.1 ป.4/1'
    WHEN subject = 'วิทยาศาสตร์' THEN 'ว 2.1 ป.4/1'

    WHEN subject = 'ภาษาอังกฤษ' AND (topic ILIKE '%reading%' OR topic ILIKE '%comprehension%') THEN 'ต 1.1 ป.4/4'
    WHEN subject = 'ภาษาอังกฤษ' AND (topic ILIKE '%vocabulary%' OR topic ILIKE '%words%') THEN 'ต 1.1 ป.4/2'
    WHEN subject = 'ภาษาอังกฤษ' AND (topic ILIKE '%grammar%' OR topic ILIKE '%tense%') THEN 'ต 1.2 ป.4/1'
    WHEN subject = 'ภาษาอังกฤษ' THEN 'ต 1.1 ป.4/1'

    WHEN subject = 'สังคมศึกษา' AND (topic ILIKE '%ศาสนา%' OR topic ILIKE '%ศีลธรรม%') THEN 'ส 1.1 ป.4/1'
    WHEN subject = 'สังคมศึกษา' AND (topic ILIKE '%พลเมือง%' OR topic ILIKE '%กฎหมาย%') THEN 'ส 2.1 ป.4/1'
    WHEN subject = 'สังคมศึกษา' AND (topic ILIKE '%เศรษฐกิจ%' OR topic ILIKE '%พอเพียง%') THEN 'ส 3.1 ป.4/1'
    WHEN subject = 'สังคมศึกษา' THEN 'ส 5.1 ป.4/1'

    WHEN subject = 'ประวัติศาสตร์' AND (topic ILIKE '%สุโขทัย%' OR topic ILIKE '%อยุธยา%') THEN 'ส 4.3 ป.4/1'
    WHEN subject = 'ประวัติศาสตร์' AND (topic ILIKE '%บุคคลสำคัญ%') THEN 'ส 4.3 ป.4/2'
    WHEN subject = 'ประวัติศาสตร์' THEN 'ส 4.1 ป.4/1'

    WHEN subject = 'สุขศึกษา' AND (topic ILIKE '%อาหาร%' OR topic ILIKE '%โภชนาการ%') THEN 'พ 4.1 ป.4/1'
    WHEN subject = 'สุขศึกษา' AND (topic ILIKE '%ร่างกาย%' OR topic ILIKE '%อวัยวะ%') THEN 'พ 1.1 ป.4/1'
    WHEN subject = 'สุขศึกษา' THEN 'พ 3.1 ป.4/1'

    WHEN subject = 'ศิลปะ' AND (topic ILIKE '%ดนตรี%') THEN 'ศ 2.1 ป.4/1'
    WHEN subject = 'ศิลปะ' AND (topic ILIKE '%นาฏศิลป์%') THEN 'ศ 3.1 ป.4/1'
    WHEN subject = 'ศิลปะ' THEN 'ศ 1.1 ป.4/1'

    WHEN subject = 'การงานอาชีพ' AND (topic ILIKE '%เกษตร%' OR topic ILIKE '%ปลูกผัก%') THEN 'ง 1.1 ป.4/2'
    WHEN subject = 'การงานอาชีพ' AND (topic ILIKE '%งานช่าง%' OR topic ILIKE '%ความปลอดภัย%') THEN 'ง 1.1 ป.4/1'
    WHEN subject = 'การงานอาชีพ' THEN 'ง 2.1 ป.4/1'

    WHEN subject = 'ต้านทุจริต' THEN 'ส 2.1 ป.4/1'
    ELSE 'ค 1.1 ป.4/1'
  END,
  indicator_desc = 'มาตรฐานการเรียนรู้และตัวชี้วัดกลุ่มสาระการเรียนรู้ หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551'
WHERE indicator_code IS NULL;

-- 2. บรรจุข้อสอบเติมคำ (Fill-in) คุณภาพสูง
INSERT INTO public.exam_questions (
  subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, answer, accepted_answers, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
(
  'คณิตศาสตร์', 'ป.4', 'การคูณและการหารระคน', 'medium', 'L3', 'fillin',
  'จากเกม "รถซิ่งสูตรคูณ" หากนักเรียนขับรถเก็บกล่องตัวเลขได้ 125 แต้ม แล้วได้รับโบนัสคูณ 8 เท่า และบวกคะแนนพิเศษอีก 150 แต้ม นักเรียนจะได้คะแนนรวมทั้งหมดกี่แต้ม?',
  to_jsonb('1150'::text),
  ARRAY['1150', '1,150', '1150 แต้ม', '1,150 แต้ม', '๑๑๕๐'],
  'คำนวณจาก (125 × 8) + 150 = 1,000 + 150 = 1,150 แต้ม',
  'ค 1.1 ป.4/10', 'หาผลลัพธ์การบวก ลบ คูณ หารระคนของจำนวนนับ และ ๐',
  '3bdf7fcc-9c95-46c0-a795-d8eb1d87b5e1', 'รถซิ่งสูตรคูณ', '/games/math/math-rally/cover.png?v=3'
),
(
  'คณิตศาสตร์', 'ป.4', 'เรขาคณิตสองมิติและสามมิติ', 'easy', 'L2', 'fillin',
  'จากสื่อ "🧊 เรขาคณิต 2D/3D" รูปทรงลูกบาศก์ (Cube) มีจำนวนหน้าทั้งหมดกี่หน้า?',
  to_jsonb('6'::text),
  ARRAY['6', '6 หน้า', '๖', '๖ หน้า', 'หกหน้า', 'หก'],
  'ลูกบาศก์เป็นรูปเรขาคณิตสามมิติที่มีหน้าเป็นรูปสี่เหลี่ยมจัตุรัสขนาดเท่ากันทั้งหมด 6 หน้า',
  'ค 2.2 ป.4/1', 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุมและเขียนสัญลักษณ์แสดงมุม และจำแนกรูปเรขาคณิต',
  '45046f41-4f71-48ac-979d-8e3e4fbebc13', '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนแท้และจำนวนคละ', 'medium', 'L3', 'fillin',
  'จากสื่อ "🍕 สื่อการสอนเศษส่วน ป.4" ถ้ามีพิซซ่าถาดหนึ่งแบ่งออกเป็น 8 ชิ้นเท่าๆ กัน รับประทานไปแล้ว 3 ชิ้น จะเหลือพิซซ่าคิดเป็นเศษส่วนเท่าใดของถาด? (เขียนในรูปเศษส่วน เช่น 5/8)',
  to_jsonb('5/8'::text),
  ARRAY['5/8', 'เศษ 5 ส่วน 8', 'เศษ5ส่วน8', '๕/๘'],
  'พิซซ่าเต็มถาดมี 8/8 ชิ้น รับประทานไป 3/8 ชิ้น เหลือ 8/8 - 3/8 = 5/8 ถาด',
  'ค 1.1 ป.4/3', 'บอก อ่านและเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ และแสดงสิ่งต่างๆ ตามเศษส่วน จำนวนคละที่กำหนด',
  '5e1c246c-36f8-4904-ab3f-5c1236ff2e84', '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4', '/games/math/math-fraction-hub/cover-bars.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การประมาณค่าจำนวนนับ', 'easy', 'L2', 'fillin',
  'โรงเรียนบ้านคำไผ่มีเงินออมในธนาคารพอเพียงสะสมรวม 48,760 บาท ค่าประมาณใกล้เคียงจำนวนเต็มพันของจำนวนนี้คือเท่าใด?',
  to_jsonb('49000'::text),
  ARRAY['49000', '49,000', '49000 บาท', '49,000 บาท', '๔๙๐๐๐'],
  'พิจารณาหลักร้อยคือเลข 7 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้นเป็น 49,000',
  'ค 1.1 ป.4/2', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร จากสถานการณ์ต่างๆ อย่างสมเหตุสมผล',
  '4b14bbd8-3a49-4ee4-bed6-3795f9cb5412', '📝 ใบงานการประมาณค่า ป.4', '/games/math/rounding-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'ทศนิยมหนึ่งตำแหน่งและสองตำแหน่ง', 'medium', 'L3', 'fillin',
  'เขียนเศษส่วน 75/100 ให้อยู่ในรูปทศนิยมสองตำแหน่ง',
  to_jsonb('0.75'::text),
  ARRAY['0.75', '.75', '๐.๗๕'],
  '75 ส่วนใน 100 ส่วน เขียนเป็นทศนิยมสองตำแหน่งได้เท่ากับ 0.75',
  'ค 1.1 ป.4/5', 'บอก อ่านและเขียนทศนิยมไม่เกิน ๓ ตำแหน่งแสดงปริมาณของสิ่งต่างๆ',
  'db57a331-242b-4dec-b9bb-5d12088b0d10', '🔢 Math Decimal Learning Studio', '/games/math/math-decimal-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'วงจรไฟฟ้าอย่างง่าย', 'easy', 'L2', 'fillin',
  'จากเกม "ต่อวงจรไฟฟ้า" อุปกรณ์ใดในวงจรไฟฟ้าทำหน้าที่เป็นแหล่งกำเนิดพลังงานไฟฟ้าที่ให้กระแสไฟฟ้าแก่วงจร?',
  to_jsonb('ถ่านไฟฉาย'::text),
  ARRAY['ถ่านไฟฉาย', 'แบตเตอรี่', 'เซลล์ไฟฟ้า', 'ถ่าน', 'battery'],
  'ถ่านไฟฉายหรือเซลล์ไฟฟ้าทำหน้าที่เป็นแหล่งกำเนิดพลังงานไฟฟ้าที่จ่ายพลังงานให้หลอดไฟสว่าง',
  'ว 2.3 ป.4/1', 'อธิบายการทำงานของวงจรไฟฟ้าอย่างง่าย',
  'b18dfce5-536a-4e71-8932-13971600b261', 'ต่อวงจรไฟฟ้า', '/games/science/circuit-builder-cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่และส่วนประกอบของพืชดอก', 'easy', 'L1', 'fillin',
  'จากสื่อ "🌱 ส่วนของพืชดอก" ส่วนประกอบใดของพืชทำหน้าที่หลักในการดูดน้ำและแร่ธาตุจากดินขึ้นไปเลี้ยงลำต้น?',
  to_jsonb('ราก'::text),
  ARRAY['ราก', 'รากพืช', 'ระบบราก', 'root'],
  'รากทำหน้าที่ดูดน้ำและธาตุอาหารจากดิน และช่วยค้ำจุนลำต้นให้ตั้งตรง',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอกของพืชดอกโดยใช้ข้อมูลที่รวบรวมได้',
  '8488353a-b93c-45bd-ac95-48484b9e3364', '🌱 ส่วนของพืชดอก', '/games/science/plant-parts-media-cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสารและการเปลี่ยนสถานะ', 'medium', 'L2', 'fillin',
  'กระบวนการที่สารเปลี่ยนสถานะจาก "ของเหลว" กลายเป็น "แก๊ส" เมื่อได้รับความร้อน เรียกว่ากระบวนการอะไร?',
  to_jsonb('การกลายเป็นไอ'::text),
  ARRAY['การกลายเป็นไอ', 'การระเหย', 'การเดือด', 'กลายเป็นไอ', 'ระเหย', 'evaporation'],
  'การเปลี่ยนสถานะจากของเหลวเป็นแก๊สเรียกว่า การกลายเป็นไอ ซึ่งแบ่งเป็นการระเหยและการเดือด',
  'ว 2.1 ป.4/1', 'เปรียบเทียบสมบัติทางกายภาพ ด้านความแข็ง สภาพยืดหยุ่น การนำความร้อน และการนำไฟฟ้าของวัสดุ',
  '2f26d41a-e6a2-404f-bc20-81965e553665', '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ชนิดของคำในภาษาไทย', 'easy', 'L2', 'fillin',
  'จากเกม "⚔️ ตัดคำนามนินจา" คำว่า "โรงเรียนบ้านคำไผ่" จัดเป็นคำนามชนิดใด (สามัญนาม หรือ วิสามัญนาม)?',
  to_jsonb('วิสามัญนาม'::text),
  ARRAY['วิสามัญนาม', 'นามชี้เฉพาะ', 'คำวิสามัญนาม'],
  'วิสามัญนาม คือ คำนามที่ใช้เป็นชื่อเฉพาะเจาะจงของบุคคล สถานที่ หรือสิ่งของ',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ และจำแนกชนิดของคำ',
  '48f34117-7739-4972-87d9-8223f27fbad7', '⚔️ ตัดคำนามนินจา (AR)', '/games/thai/word-ninja-noun/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'เครื่องหมายวรรคตอน', 'easy', 'L1', 'fillin',
  'เครื่องหมายวรรคตอน " ! " มีชื่อเรียกตามหลักภาษาไทยว่าเครื่องหมายอะไร?',
  to_jsonb('อัศเจรีย์'::text),
  ARRAY['อัศเจรีย์', 'เครื่องหมายตกใจ', 'เครื่องหมายอัศเจรีย์'],
  'เครื่องหมาย ! เรียกว่า อัศเจรีย์ ใช้เขียนหลังคำอุทานหรือข้อความที่แสดงอารมณ์ตกใจ แปลกใจ',
  'ท 4.1 ป.4/2', 'ใช้เครื่องหมายวรรคตอนได้อย่างถูกต้อง',
  'f4564c46-7d74-4f33-b3e7-81cfeae4f493', '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5', '/games/thai/thai-punctuation-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'มาตราตัวสะกด', 'easy', 'L2', 'fillin',
  'คำว่า "ก้อนเมฆ" มีพยัญชนะ ฆ เป็นตัวสะกด จัดอยู่ในมาตราตัวสะกดแม่ใด?',
  to_jsonb('แม่กก'::text),
  ARRAY['แม่กก', 'กก', 'มาตรากก', 'มาตราแม่กก'],
  'ก้อนเมฆ สะกดด้วย ฆ ออกเสียงเหมือน ก สะกด จึงอยู่ในมาตราแม่กก',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
  '63ea18cb-3ac9-48b9-872e-becd2142d3a3', '🎣 มาตราตัวสะกด', '/games/thai/thai-matra-chart-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Classroom Vocabulary', 'easy', 'L1', 'fillin',
  'Fill in the missing English word: An object used to write on paper or in a notebook with ink is a "p__".',
  to_jsonb('pen'::text),
  ARRAY['pen', 'Pen', 'PEN', 'a pen'],
  'Pen หมายถึง ปากกาหมึกสำหรับเขียน',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
  'fc6bf43f-9249-4a91-bcfb-c24cf27db608', '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Days of the week', 'easy', 'L1', 'fillin',
  'What day comes after Tuesday? (Write the English word in lowercase)',
  to_jsonb('wednesday'::text),
  ARRAY['wednesday', 'Wednesday', 'WEDNESDAY'],
  'Wednesday คือ วันพุธ ซึ่งเป็นวันถัดจากวันอังคาร (Tuesday)',
  'ต 1.1 ป.4/3', 'เลือก/ระบุภาพ หรือสัญลักษณ์ตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน',
  'fc6bf43f-9249-4a91-bcfb-c24cf27db608', '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การอนุรักษ์สิ่งแวดล้อมและเศรษฐกิจหมุนเวียน', 'easy', 'L2', 'fillin',
  'จากกิจกรรม "ธนาคารขยะรีไซเคิล โรงเรียนบ้านคำไผ่" ขยะประเภทกล่องนมยูเอชทีและขวดพลาสติกใสจัดเป็นขยะประเภทใด?',
  to_jsonb('ขยะรีไซเคิล'::text),
  ARRAY['ขยะรีไซเคิล', 'รีไซเคิล', 'ขยะที่นำกลับมาใช้ใหม่ได้', 'recycle'],
  'กล่องนมและขวดพลาสติกใสเป็นขยะที่สามารถนำไปแปรรูปกลับมาใช้ประโยชน์ใหม่ได้ จึงจัดเป็นขยะรีไซเคิล',
  'ส 5.2 ป.4/2', 'มีส่วนร่วมในการอนุรักษ์และฟื้นฟูทรัพยากรธรรมชาติและสิ่งแวดล้อมในจังหวัด',
  '302a9639-7d4d-4433-9e86-233900dc28bc', '♻️ คัดแยกขยะ 4 ถัง', '/games/career/waste-sort-media-cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การแก้ปัญหาอย่างเป็นขั้นตอนและอัลกอริทึม', 'easy', 'L2', 'fillin',
  'จากเกม "🤖 Code Craft" ลำดับขั้นตอนการทำงานที่เขียนขึ้นเพื่อสั่งให้คอมพิวเตอร์หรือหุ่นยนต์ทำงานตามที่ต้องการ เรียกว่าอะไร?',
  to_jsonb('อัลกอริทึม'::text),
  ARRAY['อัลกอริทึม', 'algorithm', 'โปรแกรม', 'ชุดคำสั่ง'],
  'อัลกอริทึม (Algorithm) คือ ขั้นตอนวิธีที่ชัดเจนเป็นลำดับในการแก้ปัญหาหรือสั่งงานคอมพิวเตอร์',
  'ว 4.2 ป.4/1', 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การอธิบายการทำงาน การคาดการณ์ผลลัพธ์ จากปัญหาอย่างง่าย',
  'b673b26e-4c29-457e-af54-0134246838ec', '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
);

-- 3. บรรจุข้อสอบอัตนัย (Essay Questions with Rubric)
INSERT INTO public.exam_questions (
  subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, answer, rubric, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาการบวก ลบ คูณ หารระคน ๒ ขั้นตอน', 'hard', 'L4', 'essay',
  'โจทย์ปัญหา: ธนาคารขยะโรงเรียนบ้านคำไผ่ รับซื้อขวดพลาสติกจากนักเรียนชั้น ป.4 ราคากิโลกรัมละ 12 บาท นักเรียนร่วมกันสะสมได้ 45 กิโลกรัม จากนั้นนำเงินที่ได้ทั้งหมดไปซื้ออุปกรณ์ทำความสะอาดห้องเรียนเป็นเงิน 280 บาท ให้นักเรียนเขียนประโยคสัญลักษณ์ แสดงวิธีทำอย่างละเอียด และหาว่าเหลืองินกี่บาท',
  to_jsonb('ประโยคสัญลักษณ์: (45 × 12) - 280 = ▢
วิธีทำ:
1) ขายขวดพลาสติกได้เงิน = 45 × 12 = 540 บาท
2) ซื้ออุปกรณ์ทำความสะอาด = 280 บาท
3) เหลืองิน = 540 - 280 = 260 บาท
ตอบ: เหลือเงิน ๒๖๐ บาท'::text),
  '{
  "full_score": 5,
  "key_solution": "ประโยคสัญลักษณ์ (45 × 12) - 280 = ▢ และคำตอบคือเหลือเงิน 260 บาท",
  "criteria": [
    {
      "name": "การเขียนประโยคสัญลักษณ์",
      "points": 1,
      "description": "เขียน (45 × 12) - 280 = ▢ หรือแสดงโครงสร้างถูกต้อง"
    },
    {
      "name": "ขั้นตอนการหาเงินจากการขายขวด (ขั้นที่ 1)",
      "points": 1.5,
      "description": "แสดง 45 × 12 = 540 บาท พร้อมระบุข้อความและหน่วยถูกต้อง"
    },
    {
      "name": "ขั้นตอนการหักเงินซื้ออุปกรณ์ (ขั้นที่ 2)",
      "points": 1.5,
      "description": "แสดง 540 - 280 = 260 บาท พร้อมระบุข้อความและหน่วยถูกต้อง"
    },
    {
      "name": "ความถูกต้องของคำตอบและการสรุปคำตอบ",
      "points": 1,
      "description": "ระบุคำตอบ 260 บาท และหน่วยถูกต้องชัดเจน"
    }
  ],
  "keywords": [
    "ประโยคสัญลักษณ์",
    "540",
    "280",
    "260",
    "บาท"
  ]
}'::jsonb,
  'การแก้โจทย์ปัญหา 2 ขั้นตอน ต้องวิเคราะห์สิ่งที่โจทย์กำหนด สิ่งที่โจทย์ถาม สร้างประโยคสัญลักษณ์ และคำนวณตามลำดับขั้นตอน',
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา ๒ ขั้นตอน ของจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ และ ๐',
  '4ec9c182-2a57-4066-8f6c-d97e52519a86', 'นักสืบโจทย์ปัญหา', 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/educational-hub/a5f53911-b9cb-465a-b963-7202bcb907b1/thumbs/1780165651613_fg63tc.webp'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาพื้นที่รูปสี่เหลี่ยมมุมฉาก', 'medium', 'L3', 'essay',
  'แปลงผักพอเพียงของโรงเรียนบ้านคำไผ่เป็นรูปสี่เหลี่ยมผืนผ้า กว้าง 4 เมตร และยาว 9 เมตร ให้นักเรียนแสดงวิธีทำหาพื้นที่ของแปลงผักแปลงนี้ และอธิบายว่าหากต้องการล้อมรั้วรอบแปลงผักจะต้องใช้ลวดตาข่ายยาวอย่างน้อยกี่เมตร',
  to_jsonb('1) การหาพื้นที่สี่เหลี่ยมผืนผ้า:
สูตร: พื้นที่ = กว้าง × ยาว = 4 × 9 = 36 ตารางเมตร
2) การหาความยาวรอบรูป (ล้อมรั้ว):
สูตร: ความยาวรอบรูป = (กว้าง + ยาว) × 2 = (4 + 9) × 2 = 13 × 2 = 26 เมตร
ตอบ: แปลงผักมีพื้นที่ ๓๖ ตารางเมตร และต้องใช้ลวดตาข่ายยาวอย่างน้อย ๒๖ เมตร'::text),
  '{
  "full_score": 5,
  "key_solution": "พื้นที่ 36 ตารางเมตร และความยาวรอบรูป 26 เมตร",
  "criteria": [
    {
      "name": "สูตรและขั้นตอนการหาพื้นที่",
      "points": 2,
      "description": "แสดงวิธีคำนวณ กว้าง × ยาว = 4 × 9 = 36 ตารางเมตร พร้อมหน่วย"
    },
    {
      "name": "สูตรและขั้นตอนการหาความยาวรอบรูป",
      "points": 2,
      "description": "แสดงวิธีคำนวณ (4 + 9) × 2 = 26 เมตร พร้อมหน่วย"
    },
    {
      "name": "การสรุปคำตอบและหน่วยกำกับ",
      "points": 1,
      "description": "สรุปคำตอบครบถ้วนและระบุหน่วย ตารางเมตร และ เมตร ถูกต้อง"
    }
  ],
  "keywords": [
    "กว้าง x ยาว",
    "36",
    "ตารางเมตร",
    "ความยาวรอบรูป",
    "26",
    "เมตร"
  ]
}'::jsonb,
  'พื้นที่รูปสี่เหลี่ยมผืนผ้า = กว้าง × ยาว มีหน่วยเป็นตารางหน่วย ส่วนความยาวรอบรูป = 2 × (กว้าง + ยาว) มีหน่วยเป็นหน่วยความยาว',
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบของโจทย์ปัญหาเกี่ยวกับความยาวรอบรูปและพื้นที่ของรูปสี่เหลี่ยมมุมฉาก',
  'ea84c27b-dd37-4a79-bb86-8590dc2e7bb2', '📐 พื้นที่สี่เหลี่ยมมุมฉาก', '/games/math/rect-area-media-cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การทดลองและเปรียบเทียบสถานะของสาร', 'hard', 'L4', 'essay',
  'จากสื่อการทดลองวิทยาศาสตร์ "สถานะของสาร" ให้นักเรียนเปรียบเทียบความแตกต่างระหว่าง "ของแข็ง (Solid)" และ "ของเหลว (Liquid)" ในประเด็น: 1) รูปร่าง 2) ปริมาตร และ 3) การจัดเรียงอนุภาค พร้อมยกตัวอย่างสารในชีวิตประจำวันอย่างละ 1 ชนิด',
  to_jsonb('1) ของแข็ง: รูปร่างคงที่ ไม่เปลี่ยนตามภาชนะ, ปริมาตรคงที่, อนุภาคเรียงชิดติดกันแน่นหนาและสั่นอยู่กับที่ เช่น น้ำแข็ง, ก้อนหิน
2) ของเหลว: รูปร่างไม่คงที่ เปลี่ยนแปลงตามภาชนะที่บรรจุ, ปริมาตรคงที่, อนุภาคอยู่ใกล้ชิดกันแต่เลื่อนไหลผ่านกันได้ เช่น น้ำดื่ม, น้ำมันพืช'::text),
  '{
  "full_score": 5,
  "key_solution": "เปรียบเทียบรูปร่าง ปริมาตร การจัดเรียงอนุภาคของของแข็งและของเหลว พร้อมยกตัวอย่างถูกต้อง",
  "criteria": [
    {
      "name": "สมบัติของของแข็ง",
      "points": 2,
      "description": "อธิบายรูปร่างคงที่ ปริมาตรคงที่ อนุภาคชิดแน่น และยกตัวอย่างถูกต้อง"
    },
    {
      "name": "สมบัติของของเหลว",
      "points": 2,
      "description": "อธิบายรูปร่างเปลี่ยนตามภาชนะ ปริมาตรคงที่ อนุภาคไหลได้ และยกตัวอย่างถูกต้อง"
    },
    {
      "name": "การสรุปเปรียบเทียบและความเป็นระเบียบ",
      "points": 1,
      "description": "เรียบเรียงภาษาได้ชัดเจน เข้าใจง่าย และใช้ศัพท์วิทยาศาสตร์ถูกต้อง"
    }
  ],
  "keywords": [
    "รูปร่างคงที่",
    "รูปร่างเปลี่ยน",
    "ปริมาตรคงที่",
    "อนุภาค",
    "ชิดกัน",
    "น้ำแข็ง",
    "น้ำ"
  ]
}'::jsonb,
  'ของแข็งมีแรงยึดเหนี่ยวระหว่างอนุภาคมาก อนุภาคจึงชิดแน่น รูปร่างและปริมาตรคงที่ ส่วนของเหลวมีแรงยึดเหนี่ยวน้อยกว่า อนุภาคเคลื่อนที่ได้ รูปร่างจึงเปลี่ยนตามภาชนะแต่ปริมาตรยังคงที่',
  'ว 2.1 ป.4/1', 'เปรียบเทียบสมบัติทางกายภาพของสสารในชีวิตประจำวัน',
  '2f26d41a-e6a2-404f-bc20-81965e553665', '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'วงจรไฟฟ้าอย่างง่ายและตัวนำ-ฉนวน', 'medium', 'L3', 'essay',
  'จากเกม "ต่อวงจรไฟฟ้า" หากหลอดไฟในวงจรไม่สว่าง ให้นักเรียนวิเคราะห์สาเหตุที่เป็นไปได้ 3 ประการ และเสนอแนวทางในการตรวจสอบและแก้ไขเพื่อให้หลอดไฟสว่างตามปกติ',
  to_jsonb('สาเหตุที่เป็นไปได้และแนวทางแก้ไข:
1. ถ่านไฟฉายหมดหรือใส่ขั้วผิด -> ตรวจสอบขั้วบวก/ลบ และเปลี่ยนถ่านก้อนใหม่ที่มีพลังงาน
2. สายไฟขาดหรือต่อไม่ครบวงจร (วงจรเปิด) -> ตรวจสอบจุดเชื่อมต่อสายไฟให้แน่นหนาและต่อให้ครบวงจร
3. หลอดไฟขาดหรือนำวัตถุที่เป็นฉนวนไฟฟ้ามาต่อคั่น -> เปลี่ยนหลอดไฟใหม่ และใช้วัตถุที่เป็นตัวนำไฟฟ้า เช่น ลวดทองแดง ตะปูเหล็ก'::text),
  '{
  "full_score": 5,
  "key_solution": "วิเคราะห์สาเหตุ 3 ข้อ (แหล่งกำเนิด, สายไฟ/วงจรเปิด, หลอดไฟ/ตัวนำไฟฟ้า) พร้อมวิธีแก้",
  "criteria": [
    {
      "name": "การระบุสาเหตุข้อที่ 1 และวิธีแก้",
      "points": 1.5,
      "description": "ระบุประเด็นถ่านไฟฉาย/แหล่งพลังงาน พร้อมวิธีตรวจสอบ"
    },
    {
      "name": "การระบุสาเหตุข้อที่ 2 และวิธีแก้",
      "points": 1.5,
      "description": "ระบุประเด็นสายไฟ/วงจรเปิด/ขั้วหลุด พร้อมวิธีตรวจสอบ"
    },
    {
      "name": "การระบุสาเหตุข้อที่ 3 และวิธีแก้",
      "points": 1.5,
      "description": "ระบุประเด็นหลอดไฟขาด/ฉนวนไฟฟ้า พร้อมวิธีตรวจสอบ"
    },
    {
      "name": "ความสมเหตุสมผลทางวิทยาศาสตร์",
      "points": 0.5,
      "description": "ใช้หลักการวงจรปิด-วงจรเปิด และตัวนำ-ฉนวนไฟฟ้าอย่างถูกต้อง"
    }
  ],
  "keywords": [
    "ถ่าน",
    "วงจรเปิด",
    "สายไฟหลุด",
    "หลอดไฟขาด",
    "ตัวนำ",
    "ฉนวน"
  ]
}'::jsonb,
  'หลอดไฟจะสว่างได้เมื่อมีกระแสไฟฟ้าไหลครบวงจร (วงจรปิด) แหล่งกำเนิดมีพลังงาน ตัวนำต่อเชื่อมสมบูรณ์ และหลอดไฟไม่ขาด',
  'ว 2.3 ป.4/1', 'อธิบายการทำงานของวงจรไฟฟ้าอย่างง่าย',
  'b18dfce5-536a-4e71-8932-13971600b261', 'ต่อวงจรไฟฟ้า', '/games/science/circuit-builder-cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การอ่านจับใจความและเขียนสรุปข้อคิด', 'medium', 'L4', 'essay',
  'จากคลังอ่านจับใจความ "Kingdom คำไทย" เรื่อง "กระต่ายกับเต่า": ให้นักเรียนเขียนสรุปข้อคิดเตือนใจที่ได้จากเรื่องนี้ 2 ประการ พร้อมยกตัวอย่างว่านักเรียนจะนำข้อคิดดังกล่าวมาปรับใช้ในการเรียนหรือการทำหน้าที่ในโรงเรียนบ้านคำไผ่อย่างไร',
  to_jsonb('ข้อคิดที่ได้จากเรื่อง:
1) ความพยายามและความสม่ำเสมอ ย่อมนำไปสู่ความสำเร็จ เช่น เต่าแม้จะเดินช้าแต่มีความมุ่งมั่น ไม่ย่อท้อ จึงเข้าเส้นชัยได้
2) ความประมาทและความทะนงตัว เป็นบ่อเกิดของความล้มเหลว เช่น กระต่ายที่คิดว่าตนเองวิ่งเร็วกว่า จึงนอนหลับและพ่ายแพ้ในที่สุด

การนำไปปรับใช้:
นำมาใช้ในการเรียน เช่น หมั่นทบทวนบทเรียนและทำการบ้านอย่างสม่ำเสมอ ไม่ผัดวันประกันพรุ่ง และไม่ประมาทว่าตนเองเก่งแล้วจนละเลยการอ่านหนังสือ'::text),
  '{
  "full_score": 5,
  "key_solution": "สรุปข้อคิด 2 ประการ (ความพยายามชนะความประมาท) และยกตัวอย่างการปรับใช้จริง",
  "criteria": [
    {
      "name": "การสรุปข้อคิดประการที่ 1",
      "points": 1.5,
      "description": "ระบุเรื่องความเพียรพยายาม ความไม่ย่อท้อ ได้ชัดเจน"
    },
    {
      "name": "การสรุปข้อคิดประการที่ 2",
      "points": 1.5,
      "description": "ระบุเรื่องการไม่ประมาท ความทะนงตน ได้ชัดเจน"
    },
    {
      "name": "การประยุกต์ใช้ในการเรียนในโรงเรียน",
      "points": 1,
      "description": "ยกตัวอย่างสถานการณ์จริงที่นำไปใช้ได้อย่างเป็นรูปธรรม"
    },
    {
      "name": "การใช้ภาษาและการสะกดคำ",
      "points": 1,
      "description": "สะกดคำถูกต้อง ใช้ประโยคสื่อความหมายได้ดี ไม่มีคำผิด"
    }
  ],
  "keywords": [
    "ความพยายาม",
    "ความเพียร",
    "ความประมาท",
    "สม่ำเสมอ",
    "ทบทวนบทเรียน",
    "การเรียน"
  ]
}'::jsonb,
  'การอ่านจับใจความที่ดีต้องจับประเด็นสำคัญ สรุปคุณค่า และนำข้อคิดมาประยุกต์ใช้ในชีวิตประจำวันได้',
  'ท 1.1 ป.4/3', 'อ่านเรื่องสั้นๆ ตามเวลาที่กำหนดและตอบคำถามจากเรื่องที่อ่าน',
  '5362e998-a2d7-4d05-acfa-58f14290423d', 'Kingdom คำไทย', 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/educational-hub/a5f53911-b9cb-465a-b963-7202bcb907b1/thumbs/1779902694886_3ygwt7.webp'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Routine & Reading Comprehension', 'medium', 'L3', 'essay',
  'Read the short paragraph and answer the questions in full English sentences:
"Tom is a student at Ban Khamphai School. He gets up at 6:00 AM every day. He walks to school with his friends. After school, he deposits 10 baht into the school savings bank and waters the school vegetable garden."
Questions:
1) What time does Tom get up?
2) How does Tom go to school?
3) What good things does Tom do after school?',
  to_jsonb('1) Tom gets up at 6:00 AM.
2) He walks to school (with his friends).
3) After school, he deposits 10 baht into the school savings bank and waters the school vegetable garden.'::text),
  '{
  "full_score": 5,
  "key_solution": "1) He gets up at 6:00 AM. 2) He walks to school. 3) He deposits money and waters vegetables.",
  "criteria": [
    {
      "name": "Answer Question 1",
      "points": 1.5,
      "description": "Answer 6:00 AM with correct subject and verb"
    },
    {
      "name": "Answer Question 2",
      "points": 1.5,
      "description": "Answer walks to school / on foot correctly"
    },
    {
      "name": "Answer Question 3",
      "points": 1.5,
      "description": "Mention savings bank and/or watering garden"
    },
    {
      "name": "Grammar and Capitalization",
      "points": 0.5,
      "description": "Capital letters and punctuation used properly"
    }
  ],
  "keywords": [
    "gets up",
    "6:00",
    "walks",
    "savings",
    "garden",
    "waters"
  ]
}'::jsonb,
  'การตอบคำถามจากการอ่านภาษาอังกฤษ ควรตอบเป็นประโยคที่สมบูรณ์ ประธาน กริยา และข้อมูลตรงตามเนื้อเรื่อง',
  'ต 1.1 ป.4/4', 'ตอบคำถามจากการฟังและอ่านประโยค บทสนทนา และนิทานง่ายๆ',
  'b7421614-062f-4029-a892-0c364a72d290', '🔤 English AR Quiz (ป.4)', 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/educational-hub/shared/covers/1781983671148_e74db0e3_english-ar-quiz-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หลักปรัชญาของเศรษฐกิจพอเพียงในโรงเรียน', 'medium', 'L4', 'essay',
  'ให้นักเรียนอธิบายหลักการของ "เศรษฐกิจพอเพียง 3 ห่วง 2 เงื่อนไข" และยกตัวอย่างการปฏิบัติตนของนักเรียนในการเข้าร่วม "ธนาคารพอเพียง (การออมเงิน)" หรือ "ธนาคารขยะ" ของโรงเรียนบ้านคำไผ่ ให้สอดคล้องกับหลักการนี้อย่างน้อย 1 กิจกรรม',
  to_jsonb('หลักการ 3 ห่วง 2 เงื่อนไข:
- 3 ห่วง ได้แก่ ความพอประมาณ, ความมีเหตุผล, และการมีภูมิคุ้มกันในตัวที่ดี
- 2 เงื่อนไข ได้แก่ เงื่อนไขความรู้ และเงื่อนไขคุณธรรม

การนำไปปรับใช้ในโรงเรียน:
กิจกรรมธนาคารพอเพียง: นักเรียนแบ่งเงินค่าขนมส่วนหนึ่งมาฝากออมทุกวัน ไม่ใช้จ่ายฟุ่มเฟือย (ความพอประมาณ), คิดก่อนซื้อว่าสิ่งใดจำเป็น (ความมีเหตุผล), และมีเงินเก็บสำรองไว้ใช้ยามจำเป็นหรือเป็นทุนการศึกษาในอนาคต (มีภูมิคุ้มกัน) โดยมีความซื่อสัตย์และมีวินัยในการออม (เงื่อนไขคุณธรรม)'::text),
  '{
  "full_score": 5,
  "key_solution": "ระบุ 3 ห่วง (พอประมาณ เหตุผล ภูมิคุ้มกัน) 2 เงื่อนไข (ความรู้ คุณธรรม) และเชื่อมโยงกับการออมเงินหรือธนาคารขยะ",
  "criteria": [
    {
      "name": "อธิบาย 3 ห่วง",
      "points": 1.5,
      "description": "ระบุ พอประมาณ มีเหตุผล มีภูมิคุ้มกัน ได้ครบถ้วน"
    },
    {
      "name": "อธิบาย 2 เงื่อนไข",
      "points": 1,
      "description": "ระบุ เงื่อนไขความรู้ และ เงื่อนไขคุณธรรม"
    },
    {
      "name": "ยกตัวอย่างเชื่อมโยงกิจกรรมโรงเรียน",
      "points": 2,
      "description": "ยกตัวอย่างการออมเงินหรือธนาคารขยะ และอธิบายความสอดคล้องกับหลักปรัชญาได้ชัดเจน"
    },
    {
      "name": "การสรุปความคิดเห็น",
      "points": 0.5,
      "description": "เรียบเรียงภาษาได้เข้าใจง่ายและถูกต้องตามหลักวิชาการ"
    }
  ],
  "keywords": [
    "พอประมาณ",
    "มีเหตุผล",
    "ภูมิคุ้มกัน",
    "ความรู้",
    "คุณธรรม",
    "ออมเงิน",
    "ธนาคารขยะ"
  ]
}'::jsonb,
  'เศรษฐกิจพอเพียงสามารถนำมาปฏิบัติได้จริงในชีวิตประจำวันของนักเรียนผ่านการออมเงิน การดูแลรักษาของใช้ส่วนรวม และการมีวินัย',
  'ส 3.1 ป.4/3', 'อธิบายหลักการของเศรษฐกิจพอเพียงและนำไปใช้ในชีวิตประจำวันของตนเอง',
  'dcf8a8e8-bc07-4ea7-bad8-a15ee09272cd', '📅 ปฏิทินวันสำคัญไทย', '/games/social/thai-calendar-media-cover.png'
);

-- 4. สร้างชุดข้อสอบมาตรฐานแบบผสม (Standard Mixed Exam Sets)
-- 4.1 วิชาคณิตศาสตร์ ป.4 (ปรนัย 12 ข้อ + เติมคำ 5 ข้อ + แสดงวิธีทำ 2 ข้อ = 19 ข้อ)
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0011111-2222-3333-4444-555566667777',
  'แบบทดสอบมาตรฐานพหุรูปแบบ วิชาคณิตศาสตร์ ป.4 (ปรนัย · เติมคำ · แสดงวิธีทำ)',
  'คณิตศาสตร์', 'ป.4', 60, 50, true, 'MATH4MIX',
  (
    SELECT jsonb_agg(sub.q_obj)
    FROM (
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'mcq',
          'question_text', question_text,
          'options', options,
          'answer', answer,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'points', 1
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'คณิตศาสตร์' AND question_type = 'mcq'
        LIMIT 12
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'fillin',
          'question_text', question_text,
          'answer', answer,
          'accepted_answers', accepted_answers,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 2
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'คณิตศาสตร์' AND question_type = 'fillin'
        LIMIT 5
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'essay',
          'question_text', question_text,
          'answer', answer,
          'rubric', rubric,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 5
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'คณิตศาสตร์' AND question_type = 'essay'
        LIMIT 2
      )
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 4.2 วิชาวิทยาศาสตร์ ป.4 (ปรนัย 12 ข้อ + เติมคำ 3 ข้อ + เขียนอธิบาย 2 ข้อ)
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0022222-3333-4444-5555-666677778888',
  'แบบทดสอบมาตรฐานพหุรูปแบบ วิชาวิทยาศาสตร์ ป.4 (ปรนัย · เติมคำ · เขียนอธิบาย)',
  'วิทยาศาสตร์', 'ป.4', 60, 50, true, 'SCI4MIX',
  (
    SELECT jsonb_agg(sub.q_obj)
    FROM (
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'mcq',
          'question_text', question_text,
          'options', options,
          'answer', answer,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'points', 1
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'วิทยาศาสตร์' AND question_type = 'mcq'
        LIMIT 12
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'fillin',
          'question_text', question_text,
          'answer', answer,
          'accepted_answers', accepted_answers,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 2
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'วิทยาศาสตร์' AND question_type = 'fillin'
        LIMIT 3
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'essay',
          'question_text', question_text,
          'answer', answer,
          'rubric', rubric,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 5
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'วิทยาศาสตร์' AND question_type = 'essay'
        LIMIT 2
      )
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 4.3 วิชาภาษาไทย ป.4 (ปรนัย 12 ข้อ + เติมคำ 3 ข้อ + เขียนสรุปความ 1 ข้อ)
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0033333-4444-5555-6666-777788889999',
  'แบบทดสอบมาตรฐานพหุรูปแบบ วิชาภาษาไทย ป.4 (ปรนัย · เติมคำ · เขียนสรุปความ)',
  'ภาษาไทย', 'ป.4', 60, 50, true, 'THAI4MIX',
  (
    SELECT jsonb_agg(sub.q_obj)
    FROM (
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'mcq',
          'question_text', question_text,
          'options', options,
          'answer', answer,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'points', 1
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาไทย' AND question_type = 'mcq'
        LIMIT 12
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'fillin',
          'question_text', question_text,
          'answer', answer,
          'accepted_answers', accepted_answers,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 2
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาไทย' AND question_type = 'fillin'
        LIMIT 3
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'essay',
          'question_text', question_text,
          'answer', answer,
          'rubric', rubric,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 5
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาไทย' AND question_type = 'essay'
        LIMIT 1
      )
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 4.4 วิชาภาษาอังกฤษ ป.4 (ปรนัย 12 ข้อ + เติมคำ 2 ข้อ + เขียนตอบ 1 ข้อ)
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0044444-5555-6666-7777-888899990000',
  'แบบทดสอบมาตรฐานพหุรูปแบบ วิชาภาษาอังกฤษ ป.4 (ปรนัย · เติมคำ · เขียนตอบ)',
  'ภาษาอังกฤษ', 'ป.4', 60, 50, true, 'ENG4MIX',
  (
    SELECT jsonb_agg(sub.q_obj)
    FROM (
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'mcq',
          'question_text', question_text,
          'options', options,
          'answer', answer,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'points', 1
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาอังกฤษ' AND question_type = 'mcq'
        LIMIT 12
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'fillin',
          'question_text', question_text,
          'answer', answer,
          'accepted_answers', accepted_answers,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 2
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาอังกฤษ' AND question_type = 'fillin'
        LIMIT 2
      )
      UNION ALL
      (
        SELECT jsonb_build_object(
          'id', id,
          'question_type', 'essay',
          'question_text', question_text,
          'answer', answer,
          'rubric', rubric,
          'explanation', explanation,
          'indicator_code', indicator_code,
          'media_title', media_title,
          'media_image_url', media_image_url,
          'points', 5
        ) as q_obj
        FROM public.exam_questions
        WHERE subject = 'ภาษาอังกฤษ' AND question_type = 'essay'
        LIMIT 1
      )
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

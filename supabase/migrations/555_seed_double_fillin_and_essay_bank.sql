-- ============================================================================
-- Migration 555: Seed Double Fill-in & Essay Exam Bank (312 Questions)
-- โรงเรียนบ้านคำไผ่ · ระบบคลังข้อสอบมาตรฐาน สพฐ. 2551
-- บรรจุข้อสอบเติมคำ (Fill-in) 195 ข้อ + อัตนัย (Essay) 117 ข้อ ครบ 11 วิชา
-- ผูกสื่อจริงในคลัง (educational_hub_items), ตัวชี้วัด สพฐ. ป.4 และ Rubric ละเอียด
-- ============================================================================

INSERT INTO public.exam_questions (
  subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, answer, rubric, accepted_answers, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'โรงเรียนบ้านคำไผ่มีสมุด 456 เล่ม จัดใส่กล่อง กล่องละ 4 เล่มเท่าๆ กัน จะจัดได้ทั้งหมดกี่กล่อง? (ตอบเฉพาะตัวเลข)', to_jsonb('114'::text), '{}'::jsonb, ARRAY['114', '๑๑๔', '114 กล่อง', '๑๑๔ กล่อง'], '456 ÷ 4 = 114 กล่อง',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'คุณครูมีดินสอ 525 แท่ง นำมาแจกให้นักเรียน 5 คน คนละเท่าๆ กัน นักเรียนแต่ละคนจะได้รับดินสอกี่แท่ง? (ตอบเฉพาะตัวเลข)', to_jsonb('105'::text), '{}'::jsonb, ARRAY['105', '๑๐๕', '105 แท่ง', '๑๐๕ แท่ง'], '525 ÷ 5 = 105 แท่ง',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'ผลลัพธ์ของ 847 ÷ 7 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('121'::text), '{}'::jsonb, ARRAY['121', '๑๒๑'], '847 ÷ 7 = 121',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'ผลลัพธ์ของ 639 ÷ 3 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('213'::text), '{}'::jsonb, ARRAY['213', '๒๑๓'], '639 ÷ 3 = 213',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'ผลลัพธ์ของ 912 ÷ 4 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('228'::text), '{}'::jsonb, ARRAY['228', '๒๒๘'], '912 ÷ 4 = 228',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหารสั้นและหารยาว', 'medium', 'L2', 'fillin',
  'สหกรณ์โรงเรียนมีนมกล่อง 735 กล่อง แจกให้นักเรียน 5 ห้อง ห้องละเท่าๆ กัน แต่ละห้องจะได้นมกี่กล่อง? (ตอบเฉพาะตัวเลข)', to_jsonb('147'::text), '{}'::jsonb, ARRAY['147', '๑๔๗', '147 กล่อง', '๑๔๗ กล่อง'], '735 ÷ 5 = 147 กล่อง',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 125 × 8 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('1000'::text), '{}'::jsonb, ARRAY['1000', '1,000', '๑๐๐๐', '๑,๐๐๐'], '125 × 8 = 1,000',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 240 × 15 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('3600'::text), '{}'::jsonb, ARRAY['3600', '3,600', '๓๖๐๐', '๓,๖๐๐'], '240 × 15 = 3,600',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 312 × 12 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('3744'::text), '{}'::jsonb, ARRAY['3744', '3,744', '๓๗๔๔', '๓,๗๔๔'], '312 × 12 = 3,744',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 450 × 20 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('9000'::text), '{}'::jsonb, ARRAY['9000', '9,000', '๙๐๐๐', '๙,๐๐๐'], '450 × 20 = 9,000',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 105 × 25 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('2625'::text), '{}'::jsonb, ARRAY['2625', '2,625', '๒๖๒๕', '๒,๖๒๕'], '105 × 25 = 2,625',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การคูณจำนวนหลายหลัก', 'medium', 'L2', 'fillin',
  'ผลคูณของ 520 × 11 มีค่าเท่ากับเท่าใด? (ตอบเฉพาะตัวเลข)', to_jsonb('5720'::text), '{}'::jsonb, ARRAY['5720', '5,720', '๕๗๒๐', '๕,๗๒๐'], '520 × 11 = 5,720',
  'ค 1.1 ป.4/7', 'ประมาณผลลัพธ์ของการบวก การลบ การคูณ การหาร', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มสิบของ 2,458 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('2460'::text), '{}'::jsonb, ARRAY['2460', '2,460', '๒๔๖๐', '๒,๔๖๐'], 'พิจารณาหลักหน่วยคือ 8 ปัดขึ้นเป็น 2,460',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มร้อยของ 2,458 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('2500'::text), '{}'::jsonb, ARRAY['2500', '2,500', '๒๕๐๐', '๒,๕๐๐'], 'พิจารณาหลักสิบคือ 5 ปัดขึ้นเป็น 2,500',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มพันของ 2,458 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('2000'::text), '{}'::jsonb, ARRAY['2000', '2,000', '๒๐๐๐', '๒,๐๐๐'], 'พิจารณาหลักร้อยคือ 4 ปัดลงเป็น 2,000',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มสิบของ 7,814 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('7810'::text), '{}'::jsonb, ARRAY['7810', '7,810', '๗๘๑๐', '๗,๘๑๐'], 'พิจารณาหลักหน่วยคือ 4 ปัดลงเป็น 7,810',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มร้อยของ 7,814 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('7800'::text), '{}'::jsonb, ARRAY['7800', '7,800', '๗๘๐๐', '๗,๘๐๐'], 'พิจารณาหลักสิบคือ 1 ปัดลงเป็น 7,800',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าประมาณ', 'medium', 'L2', 'fillin',
  'ค่าประมาณเป็นจำนวนเต็มพันของ 7,814 คือจำนวนใด? (ตอบเฉพาะตัวเลข)', to_jsonb('8000'::text), '{}'::jsonb, ARRAY['8000', '8,000', '๘๐๐๐', '๘,๐๐๐'], 'พิจารณาหลักร้อยคือ 8 ปัดขึ้นเป็น 8,000',
  'ค 1.1 ป.4/2', 'เปรียบเทียบและเรียงลำดับจำนวนนับ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'เขียนเศษเกิน 7/3 ให้อยู่ในรูปของเศษคละได้อย่างไร? (เขียนในรูปแบบ เช่น 2 1/3 หรือ 2 เศษ 1 ส่วน 3)', to_jsonb('2 1/3'::text), '{}'::jsonb, ARRAY['2 1/3', '2 เศษ 1 ส่วน 3', '๒ ๑/๓', '๒ เศษ ๑ ส่วน ๓'], '7 ÷ 3 ได้ 2 เศษ 1 เขียนได้เป็น 2 1/3',
  'ค 1.1 ป.4/3', 'บอก อ่านและเขียนเศษส่วน จำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'เขียนจำนวนคละ 3 2/5 ให้อยู่ในรูปของเศษเกินได้อย่างไร? (เขียนในรูปแบบเศษส่วน เช่น 17/5)', to_jsonb('17/5'::text), '{}'::jsonb, ARRAY['17/5', '๑๗/๕', 'เศษ 17 ส่วน 5', 'เศษ ๑๗ ส่วน ๕'], '(3 × 5) + 2 = 17 ได้เป็น 17/5',
  'ค 1.1 ป.4/3', 'บอก อ่านและเขียนเศษส่วน จำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'เศษส่วนอย่างต่ำของ 12/16 คือเศษส่วนใด? (เขียนในรูปแบบ เช่น 3/4)', to_jsonb('3/4'::text), '{}'::jsonb, ARRAY['3/4', '๓/๔', 'เศษ 3 ส่วน 4', 'เศษ ๓ ส่วน ๔'], '12÷4 = 3, 16÷4 = 4 ได้ 3/4',
  'ค 1.1 ป.4/3', 'บอก อ่านและเขียนเศษส่วน จำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'เศษส่วนอย่างต่ำของ 15/25 คือเศษส่วนใด? (เขียนในรูปแบบ เช่น 3/5)', to_jsonb('3/5'::text), '{}'::jsonb, ARRAY['3/5', '๓/๕', 'เศษ 3 ส่วน 5', 'เศษ ๓ ส่วน ๕'], '15÷5 = 3, 25÷5 = 5 ได้ 3/5',
  'ค 1.1 ป.4/3', 'บอก อ่านและเขียนเศษส่วน จำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'ผลบวกของ 2/7 + 3/7 มีค่าเท่ากับเท่าใด? (ตอบในรูปเศษส่วน เช่น 5/7)', to_jsonb('5/7'::text), '{}'::jsonb, ARRAY['5/7', '๕/๗', 'เศษ 5 ส่วน 7', 'เศษ ๕ ส่วน ๗'], '2/7 + 3/7 = 5/7',
  'ค 1.1 ป.4/13', 'หาผลบวก ผลลบของเศษส่วนและจำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'เศษส่วนและเศษคละ', 'medium', 'L2', 'fillin',
  'ผลลบของ 9/11 - 4/11 มีค่าเท่ากับเท่าใด? (ตอบในรูปเศษส่วน เช่น 5/11)', to_jsonb('5/11'::text), '{}'::jsonb, ARRAY['5/11', '๕/๑๑', 'เศษ 5 ส่วน 11', 'เศษ ๕ ส่วน ๑๑'], '9/11 - 4/11 = 5/11',
  'ค 1.1 ป.4/13', 'หาผลบวก ผลลบของเศษส่วนและจำนวนคละ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตและการหาพื้นที่', 'medium', 'L2', 'fillin',
  'รูปสี่เหลี่ยมจัตุรัสมีความยาวด้านละ 6 เซนติเมตร จะมีพื้นที่กี่ตารางเซนติเมตร? (ตอบเฉพาะตัวเลข)', to_jsonb('36'::text), '{}'::jsonb, ARRAY['36', '๓๖', '36 ตารางเซนติเมตร', '36 ตร.ซม.'], 'ด้าน × ด้าน = 6 × 6 = 36 ตารางเซนติเมตร',
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบของโจทย์ปัญหาเกี่ยวกับความยาวรอบรูปและพื้นที่', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตและการหาพื้นที่', 'medium', 'L2', 'fillin',
  'รูปสี่เหลี่ยมผืนผ้ากว้าง 5 เซนติเมตร ยาว 8 เซนติเมตร จะมีความยาวรอบรูปกี่เซนติเมตร? (ตอบเฉพาะตัวเลข)', to_jsonb('26'::text), '{}'::jsonb, ARRAY['26', '๒๖', '26 เซนติเมตร', '26 ซม.'], '2 × (5 + 8) = 26 เซนติเมตร',
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบของโจทย์ปัญหาเกี่ยวกับความยาวรอบรูปและพื้นที่', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตและการหาพื้นที่', 'medium', 'L2', 'fillin',
  'รูปสี่เหลี่ยมผืนผ้ากว้าง 4 เมตร ยาว 7 เมตร จะมีพื้นที่กี่ตารางเมตร? (ตอบเฉพาะตัวเลข)', to_jsonb('28'::text), '{}'::jsonb, ARRAY['28', '๒๘', '28 ตารางเมตร', '28 ตร.ม.'], 'กว้าง × ยาว = 4 × 7 = 28 ตารางเมตร',
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบของโจทย์ปัญหาเกี่ยวกับความยาวรอบรูปและพื้นที่', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตและมุม', 'medium', 'L2', 'fillin',
  'มุมที่มีขนาดเท่ากับ 90 องศา เรียกว่ามุมอะไร?', to_jsonb('มุมฉาก'::text), '{}'::jsonb, ARRAY['มุมฉาก', 'ฉาก'], 'มุม 90 องศา พอดีเรียกว่า มุมฉาก',
  'ค 2.2 ป.4/1', 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุม', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตและมุม', 'medium', 'L2', 'fillin',
  'มุมที่มีขนาดมากกว่า 0 องศา แต่น้อยกว่า 90 องศา เรียกว่ามุมอะไร?', to_jsonb('มุมแหลม'::text), '{}'::jsonb, ARRAY['มุมแหลม', 'แหลม'], 'มุมที่เล็กกว่ามุมฉาก เรียกว่า มุมแหลม',
  'ค 2.2 ป.4/1', 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุม', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'รูปเรขาคณิตสามมิติ', 'medium', 'L2', 'fillin',
  'ปริซึมสามเหลี่ยมมีหน้าทั้งหมดกี่หน้า? (ตอบเฉพาะตัวเลข)', to_jsonb('5'::text), '{}'::jsonb, ARRAY['5', '๕', '5 หน้า', '๕ หน้า'], 'ปริซึมสามเหลี่ยมมี 5 หน้า (ฐาน 2 หน้า หน้าข้าง 3 หน้า)',
  'ค 2.2 ป.4/2', 'สร้างรูปสี่เหลี่ยมมุมฉาก', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "สัมภาษณ์" ตัวการันต์ที่ถูกต้องคือพยัญชนะตัวใด?', to_jsonb('ณ การันต์'::text), '{}'::jsonb, ARRAY['ณ การันต์', 'ณ', 'ณ์', 'ตัว ณ'], 'สัมภาษณ์ สะกดด้วย ณ การันต์',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "ปรากฏ" พยัญชนะตัวสะกดที่ถูกต้องคือ ฎ ชฎา หรือ ฏ ปฏัก?', to_jsonb('ฏ ปฏัก'::text), '{}'::jsonb, ARRAY['ฏ ปฏัก', 'ฏ', 'ปฏัก', 'ตัว ฏ'], 'ปรากฏ สะกดด้วย ฏ ปฏัก',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "มงกุฎ" พยัญชนะตัวสะกดที่ถูกต้องคือ ฎ ชฎา หรือ ฏ ปฏัก?', to_jsonb('ฎ ชฎา'::text), '{}'::jsonb, ARRAY['ฎ ชฎา', 'ฎ', 'ชฎา', 'ตัว ฎ'], 'มงกุฎ สะกดด้วย ฎ ชฎา',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "รสชาติ" คำว่า "ชาติ" เขียนสะกดถูกต้องมีสระอิบนตัว ต หรือไม่? (ตอบว่า "มี" หรือ "ไม่มี")', to_jsonb('มี'::text), '{}'::jsonb, ARRAY['มี', 'มีสระอิ'], 'รสชาติ เขียนถูกต้องคือมีสระอิบน ต เต่า',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "อนุสรณ์" ตัวการันต์ที่ถูกต้องคือพยัญชนะตัวใด?', to_jsonb('ณ การันต์'::text), '{}'::jsonb, ARRAY['ณ การันต์', 'ณ', 'ณ์', 'ตัว ณ'], 'อนุสรณ์ สะกดด้วย ณ การันต์',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "พิสูจน์" ตัวการันต์ที่ถูกต้องคือพยัญชนะตัวใด?', to_jsonb('น การันต์'::text), '{}'::jsonb, ARRAY['น การันต์', 'น', 'น์', 'ตัว น'], 'พิสูจน์ สะกดด้วย น การันต์',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "ผาสุก" (ความสุขสำราญ) ตัวสะกดของคำว่า "สุก" ใช้ ก ไก่ หรือ ข ไข่?', to_jsonb('ก ไก่'::text), '{}'::jsonb, ARRAY['ก ไก่', 'ก', 'ตัว ก'], 'ผาสุก สะกดด้วย ก ไก่',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "ประณีต" (เรียบร้อย ละเอียดลออ) คำว่า "ณีต" ใช้ น หนู หรือ ณ เณร?', to_jsonb('ณ เณร'::text), '{}'::jsonb, ARRAY['ณ เณร', 'ณ', 'ตัว ณ'], 'ประณีต สะกดด้วย ณ เณร',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "บรรทัด" ใช้ "บัน" หรือ "บรร (ร หัน)"?', to_jsonb('บรร'::text), '{}'::jsonb, ARRAY['บรร', 'ร หัน', 'บรร (ร หัน)'], 'บรรทัด เขียนด้วย บรร (ร หัน)',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำที่มักเขียนผิด', 'medium', 'L2', 'fillin',
  'คำว่า "สังเกต" มีสระอิตรงตัว ต เต่า หรือไม่? (ตอบว่า "มี" หรือ "ไม่มี")', to_jsonb('ไม่มี'::text), '{}'::jsonb, ARRAY['ไม่มี', 'ไม่มีสระอิ'], 'คำว่า "สังเกต" ไม่มีสระอิบน ต เต่า',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ลักษณนาม', 'medium', 'L2', 'fillin',
  'ช้างบ้าน (ช้างที่นำมาเลี้ยง) มีคำลักษณนามเรียกว่าอะไร? (เช่น ตัว, เชือก, หรือ ช้าง)', to_jsonb('เชือก'::text), '{}'::jsonb, ARRAY['เชือก', '1 เชือก'], 'ช้างบ้านใช้ลักษณนามว่า "เชือก"',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ลักษณนาม', 'medium', 'L2', 'fillin',
  'พระพุทธรูป มีคำลักษณนามเรียกว่าอะไร?', to_jsonb('องค์'::text), '{}'::jsonb, ARRAY['องค์', '1 องค์'], 'พระพุทธรูปใช้ลักษณนามว่า "องค์"',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ลักษณนาม', 'medium', 'L2', 'fillin',
  'รถยนต์ มีคำลักษณนามเรียกว่าอะไร?', to_jsonb('คัน'::text), '{}'::jsonb, ARRAY['คัน', '1 คัน'], 'รถยนต์ใช้ลักษณนามว่า "คัน"',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ลักษณนาม', 'medium', 'L2', 'fillin',
  'แหวน มีคำลักษณนามเรียกว่าอะไร?', to_jsonb('วง'::text), '{}'::jsonb, ARRAY['วง', '1 วง'], 'แหวน กำไล ใช้ลักษณนามว่า "วง"',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ลักษณนาม', 'medium', 'L2', 'fillin',
  'ดินสอ มีคำลักษณนามเรียกว่าอะไร?', to_jsonb('แท่ง'::text), '{}'::jsonb, ARRAY['แท่ง', '1 แท่ง'], 'ดินสอใช้ลักษณนามว่า "แท่ง"',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนและสุภาษิต', 'medium', 'L2', 'fillin',
  'จงเติมคำลงในช่องว่างของสำนวน: "ช้างตายทั้งตัว เอา...มาปิด"', to_jsonb('ใบบัว'::text), '{}'::jsonb, ARRAY['ใบบัว', 'ใบ บัว'], 'ช้างตายทั้งตัว เอาใบบัวมาปิด',
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนและสุภาษิต', 'medium', 'L2', 'fillin',
  'จงเติมคำลงในช่องว่างของสำนวน: "วัวหายล้อม..."', to_jsonb('คอก'::text), '{}'::jsonb, ARRAY['คอก', 'ล้อมคอก'], 'วัวหายล้อมคอก',
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนและสุภาษิต', 'medium', 'L2', 'fillin',
  'จงเติมคำลงในช่องว่างของสำนวน: "น้ำขึ้นให้รีบ..."', to_jsonb('ตัก'::text), '{}'::jsonb, ARRAY['ตัก', 'รีบตัก'], 'น้ำขึ้นให้รีบตัก',
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนและสุภาษิต', 'medium', 'L2', 'fillin',
  'จงเติมคำลงในช่องว่างของสำนวน: "ขี่ช้างจับ..."', to_jsonb('ตั๊กแตน'::text), '{}'::jsonb, ARRAY['ตั๊กแตน', 'ตัวตั๊กแตน'], 'ขี่ช้างจับตั๊กแตน',
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนและสุภาษิต', 'medium', 'L2', 'fillin',
  'จงเติมคำลงในช่องว่างของสุภาษิต: "ไก่งามเพราะขน คนงามเพราะ..."', to_jsonb('แต่ง'::text), '{}'::jsonb, ARRAY['แต่ง', 'การแต่งตัว'], 'ไก่งามเพราะขน คนงามเพราะแต่ง',
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์', 'medium', 'L2', 'fillin',
  'คำราชาศัพท์ว่า "พระเนตร" หมายถึงอวัยวะส่วนใดของร่างกาย?', to_jsonb('ตา'::text), '{}'::jsonb, ARRAY['ตา', 'ดวงตา'], 'พระเนตร หมายถึง ตา',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์', 'medium', 'L2', 'fillin',
  'คำราชาศัพท์ว่า "พระกรรณ" หมายถึงอวัยวะส่วนใดของร่างกาย?', to_jsonb('หู'::text), '{}'::jsonb, ARRAY['หู', 'ใบหู'], 'พระกรรณ หมายถึง หู',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์', 'medium', 'L2', 'fillin',
  'คำราชาศัพท์ว่า "พระหัตถ์" หมายถึงอวัยวะส่วนใดของร่างกาย?', to_jsonb('มือ'::text), '{}'::jsonb, ARRAY['มือ'], 'พระหัตถ์ หมายถึง มือ',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์', 'medium', 'L2', 'fillin',
  'คำราชาศัพท์ว่า "พระโอษฐ์" หมายถึงอวัยวะส่วนใดของร่างกาย?', to_jsonb('ปาก'::text), '{}'::jsonb, ARRAY['ปาก', 'ริมฝีปาก'], 'พระโอษฐ์ หมายถึง ปาก',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์', 'medium', 'L2', 'fillin',
  'คำราชาศัพท์ว่า "ฉลองพระบาท" หมายถึงสิ่งของเครื่องใช้ใด?', to_jsonb('รองเท้า'::text), '{}'::jsonb, ARRAY['รองเท้า'], 'ฉลองพระบาท หมายถึง รองเท้า',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ชนิดของคำ', 'medium', 'L2', 'fillin',
  'ในประโยค "แมวสีขาววิ่งจับหนูในสนาม" คำว่า "สีขาว" ทำหน้าที่เป็นคำชนิดใด? (คำนาม, คำกริยา หรือ คำวิเศษณ์)', to_jsonb('คำวิเศษณ์'::text), '{}'::jsonb, ARRAY['คำวิเศษณ์', 'วิเศษณ์'], 'สีขาวทำหน้าที่เป็นคำวิเศษณ์ขยายคำนามแมว',
  'ท 4.1 ป.4/1', 'จำแนกชนิดของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ชนิดของคำ', 'medium', 'L2', 'fillin',
  'ในประโยค "คุณครูสอนหนังสือนักเรียนอย่างตั้งใจ" คำว่า "สอน" เป็นคำชนิดใด? (คำนาม, คำสรรพนาม หรือ คำกริยา)', to_jsonb('คำกริยา'::text), '{}'::jsonb, ARRAY['คำกริยา', 'กริยา'], 'สอน แสดงอาการ จึงเป็นคำกริยา',
  'ท 4.1 ป.4/1', 'จำแนกชนิดของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ชนิดของคำ', 'medium', 'L2', 'fillin',
  'คำสรรพนามที่ใช้แทนตัวเองเมื่อพูดคุยกับคุณครูอย่างสุภาพสำหรับนักเรียนชายคือคำว่าอะไร?', to_jsonb('ผม'::text), '{}'::jsonb, ARRAY['ผม', 'กระผม'], 'นักเรียนชายใช้คำสรรพนามว่า ผม',
  'ท 4.1 ป.4/1', 'จำแนกชนิดของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'มาตราตัวสะกด', 'medium', 'L2', 'fillin',
  'คำว่า "กราบ" สะกดอยู่ในมาตราแม่ใด?', to_jsonb('แม่กบ'::text), '{}'::jsonb, ARRAY['แม่กบ', 'กบ', 'มาตราแม่กบ', 'มาตรา กบ'], 'บ สะกดอยู่ในแม่กบ',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'มาตราตัวสะกด', 'medium', 'L2', 'fillin',
  'คำว่า "เรือน" สะกดอยู่ในมาตราแม่ใด?', to_jsonb('แม่กน'::text), '{}'::jsonb, ARRAY['แม่กน', 'กน', 'มาตราแม่กน', 'มาตรา กน'], 'น สะกดอยู่ในแม่กน',
  'ท 4.1 ป.4/1', 'สะกดคำและบอกความหมายของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A room in a house where people cook food is called a ________.', to_jsonb('kitchen'::text), '{}'::jsonb, ARRAY['kitchen', 'Kitchen', 'a kitchen'], 'Kitchen = ห้องครัว',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A quiet place at school where students read and borrow books is a ________.', to_jsonb('library'::text), '{}'::jsonb, ARRAY['library', 'Library', 'a library'], 'Library = ห้องสมุด',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A person who works at school and teaches students is a ________.', to_jsonb('teacher'::text), '{}'::jsonb, ARRAY['teacher', 'Teacher', 'a teacher'], 'Teacher = คุณครู',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A person who takes care of sick people in a hospital is a doctor or a ________.', to_jsonb('nurse'::text), '{}'::jsonb, ARRAY['nurse', 'Nurse', 'a nurse'], 'Nurse = พยาบาล',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'You open an ________ when it rains to keep yourself dry.', to_jsonb('umbrella'::text), '{}'::jsonb, ARRAY['umbrella', 'Umbrella', 'an umbrella'], 'Umbrella = ร่ม',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A tool with two sharp blades used for cutting paper is ________.', to_jsonb('scissors'::text), '{}'::jsonb, ARRAY['scissors', 'Scissors'], 'Scissors = กรรไกร',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'The first meal of the day eaten in the morning is called ________.', to_jsonb('breakfast'::text), '{}'::jsonb, ARRAY['breakfast', 'Breakfast'], 'Breakfast = อาหารเช้า',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'A vehicle with two wheels that you pedal to ride is a ________.', to_jsonb('bicycle'::text), '{}'::jsonb, ARRAY['bicycle', 'bike', 'Bicycle', 'Bike', 'a bicycle'], 'Bicycle = รถจักรยาน',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'The day that comes after Sunday is ________.', to_jsonb('Monday'::text), '{}'::jsonb, ARRAY['Monday', 'monday'], 'Monday = วันจันทร์',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Daily Vocabulary', 'medium', 'L2', 'fillin',
  'The yellow fruit that monkeys love to eat is a ________.', to_jsonb('banana'::text), '{}'::jsonb, ARRAY['banana', 'Banana', 'a banana'], 'Banana = กล้วย',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Grammar & Verb to be', 'medium', 'L2', 'fillin',
  'Complete the sentence: She ________ a smart student in Grade 4. (is / am / are)', to_jsonb('is'::text), '{}'::jsonb, ARRAY['is', 'Is'], 'She ใช้กับ is',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Grammar & Verb to be', 'medium', 'L2', 'fillin',
  'Complete the sentence: They ________ playing football in the playground. (is / am / are)', to_jsonb('are'::text), '{}'::jsonb, ARRAY['are', 'Are'], 'They ใช้กับ are',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Grammar & Verb to be', 'medium', 'L2', 'fillin',
  'Complete the sentence: I ________ happy to study at Kampai School. (is / am / are)', to_jsonb('am'::text), '{}'::jsonb, ARRAY['am', 'Am'], 'I ใช้กับ am',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Past Simple Tense', 'medium', 'L2', 'fillin',
  'Yesterday, Somchai ________ (go) to the local market with his mother. (Write the past form of "go")', to_jsonb('went'::text), '{}'::jsonb, ARRAY['went', 'Went'], 'รูปอดีตของ go คือ went',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Past Simple Tense', 'medium', 'L2', 'fillin',
  'Last Sunday, we ________ (eat) delicious noodles for lunch. (Write the past form of "eat")', to_jsonb('ate'::text), '{}'::jsonb, ARRAY['ate', 'Ate'], 'รูปอดีตของ eat คือ ate',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Past Simple Tense', 'medium', 'L2', 'fillin',
  'Anan ________ (play) badminton yesterday afternoon. (Write the past form of "play")', to_jsonb('played'::text), '{}'::jsonb, ARRAY['played', 'Played'], 'รูปอดีตของ play คือ played',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Plural Nouns', 'medium', 'L2', 'fillin',
  'What is the plural form of the word "child"? (One child, two ________)', to_jsonb('children'::text), '{}'::jsonb, ARRAY['children', 'Children'], 'พหูพจน์ของ child คือ children',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Plural Nouns', 'medium', 'L2', 'fillin',
  'What is the plural form of the word "tooth"? (One tooth, all my ________)', to_jsonb('teeth'::text), '{}'::jsonb, ARRAY['teeth', 'Teeth'], 'พหูพจน์ของ tooth คือ teeth',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Plural Nouns', 'medium', 'L2', 'fillin',
  'What is the plural form of the word "box"? (One box, three ________)', to_jsonb('boxes'::text), '{}'::jsonb, ARRAY['boxes', 'Boxes'], 'คำลงท้ายด้วย x เติม es เป็น boxes',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Prepositions', 'medium', 'L2', 'fillin',
  'Complete the sentence: The book is ________ the table. (on / in / under) [หนังสือน่าวางอยู่บนโต๊ะ]', to_jsonb('on'::text), '{}'::jsonb, ARRAY['on', 'On'], 'บนโต๊ะใช้ on',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "hot"?', to_jsonb('cold'::text), '{}'::jsonb, ARRAY['cold', 'Cold'], 'hot ตรงข้ามกับ cold',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "big"?', to_jsonb('small'::text), '{}'::jsonb, ARRAY['small', 'Small', 'little'], 'big ตรงข้ามกับ small',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "fast"?', to_jsonb('slow'::text), '{}'::jsonb, ARRAY['slow', 'Slow'], 'fast ตรงข้ามกับ slow',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "happy"?', to_jsonb('sad'::text), '{}'::jsonb, ARRAY['sad', 'Sad', 'unhappy'], 'happy ตรงข้ามกับ sad',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "tall"?', to_jsonb('short'::text), '{}'::jsonb, ARRAY['short', 'Short'], 'tall ตรงข้ามกับ short',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Opposites', 'medium', 'L2', 'fillin',
  'What is the opposite of the word "good"?', to_jsonb('bad'::text), '{}'::jsonb, ARRAY['bad', 'Bad'], 'good ตรงข้ามกับ bad',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Phonics & Spelling', 'medium', 'L2', 'fillin',
  'Fill in the missing letter for the sound /æ/: c _ t (เหมียวๆ)', to_jsonb('a'::text), '{}'::jsonb, ARRAY['a', 'A', 'cat', 'Cat'], 'c-a-t = cat',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Phonics & Spelling', 'medium', 'L2', 'fillin',
  'Fill in the missing letters for the sound /i:/: b _ _ (ผึ้งบินหึ่งๆ)', to_jsonb('ee'::text), '{}'::jsonb, ARRAY['ee', 'EE', 'bee', 'Bee'], 'b-e-e = bee',
  'ต 1.1 ป.4/2', 'อ่านออกเสียงคำ สะกดคำ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Question Words', 'medium', 'L2', 'fillin',
  'Complete the question: "________ is your name?" (What / Where / When)', to_jsonb('What'::text), '{}'::jsonb, ARRAY['What', 'what'], 'What is your name?',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Question Words', 'medium', 'L2', 'fillin',
  'Complete the question: "________ do you live?" (Where / Who / How) [ถามสถานที่อยู่อาศัย]', to_jsonb('Where'::text), '{}'::jsonb, ARRAY['Where', 'where'], 'Where do you live?',
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'medium', 'L2', 'fillin',
  'ส่วนประกอบของพืชที่ทำหน้าที่หลักในการดูดน้ำและแร่ธาตุจากดินคือส่วนใด?', to_jsonb('ราก'::text), '{}'::jsonb, ARRAY['ราก', 'รากพืช'], 'รากดูดน้ำและแร่ธาตุ',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'medium', 'L2', 'fillin',
  'ส่วนประกอบของพืชที่ทำหน้าที่สร้างอาหารด้วยกระบวนการสังเคราะห์ด้วยแสงคือส่วนใด?', to_jsonb('ใบ'::text), '{}'::jsonb, ARRAY['ใบ', 'ใบพืช'], 'ใบสังเคราะห์ด้วยแสง',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'medium', 'L2', 'fillin',
  'ส่วนประกอบของพืชดอกที่ทำหน้าที่หลักในการสืบพันธุ์คือส่วนใด?', to_jsonb('ดอก'::text), '{}'::jsonb, ARRAY['ดอก', 'ดอกไม้'], 'ดอกทำหน้าที่สืบพันธุ์',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'medium', 'L2', 'fillin',
  'สารสีเขียวในใบพืชที่ช่วยดูดกลืนพลังงานแสงเพื่อสร้างอาหารมีชื่อเรียกว่าอะไร?', to_jsonb('คลอโรฟิลล์'::text), '{}'::jsonb, ARRAY['คลอโรฟิลล์', 'คลอโรฟิล', 'chlorophyll'], 'คลอโรฟิลล์ (Chlorophyll) คือสารสีเขียว',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'medium', 'L2', 'fillin',
  'ส่วนประกอบของพืชที่ทำหน้าที่ชูกิ่งก้านใบ และลำเลียงน้ำแร่ธาตุไปสู่ส่วนต่างๆ คือส่วนใด?', to_jsonb('ลำต้น'::text), '{}'::jsonb, ARRAY['ลำต้น'], 'ลำต้นชูกิ่งก้านใบและลำเลียงสาร',
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสาร', 'medium', 'L2', 'fillin',
  'น้ำแข็ง มีสถานะเป็นอะไร? (ของแข็ง, ของเหลว หรือ แก๊ส)', to_jsonb('ของแข็ง'::text), '{}'::jsonb, ARRAY['ของแข็ง'], 'น้ำแข็งเป็นของแข็ง',
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสาร', 'medium', 'L2', 'fillin',
  'ไอน้ำ มีสถานะเป็นอะไร? (ของแข็ง, ของเหลว หรือ แก๊ส)', to_jsonb('แก๊ส'::text), '{}'::jsonb, ARRAY['แก๊ส', 'ก๊าซ'], 'ไอน้ำเป็นแก๊ส',
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสาร', 'medium', 'L2', 'fillin',
  'กระบวนการที่สารเปลี่ยนสถานะจากของเหลวกลายเป็นแก๊ส เรียกว่าการอะไร?', to_jsonb('การระเหย'::text), '{}'::jsonb, ARRAY['การระเหย', 'ระเหย', 'การกลายเป็นไอ'], 'การระเหยคือของเหลวกลายเป็นแก๊ส',
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสาร', 'medium', 'L2', 'fillin',
  'กระบวนการที่ไอน้ำกระทบความเย็นแล้วเปลี่ยนกลับเป็นหยดน้ำของเหลว เรียกว่าการอะไร?', to_jsonb('การควบแน่น'::text), '{}'::jsonb, ARRAY['การควบแน่น', 'ควบแน่น'], 'การควบแน่นคือแก๊สกลายเป็นของเหลว',
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สถานะของสาร', 'medium', 'L2', 'fillin',
  'สารที่มีปริมาตรคงที่ แต่รูปร่างเปลี่ยนแปลงไปตามภาชนะที่บรรจุ คือสารในสถานะใด?', to_jsonb('ของเหลว'::text), '{}'::jsonb, ARRAY['ของเหลว'], 'ของเหลวมีปริมาตรคงที่แต่เปลี่ยนรูปร่างตามภาชนะ',
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะ', 'medium', 'L2', 'fillin',
  'ศูนย์กลางของระบบสุริยะของเราคือดาวดวงใด?', to_jsonb('ดวงอาทิตย์'::text), '{}'::jsonb, ARRAY['ดวงอาทิตย์', 'พระอาทิตย์', 'Sun'], 'ดวงอาทิตย์เป็นศูนย์กลางระบบสุริยะ',
  'ว 3.1 ป.4/3', 'สร้างแบบจำลองแสดงองค์ประกอบของระบบสุริยะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะ', 'medium', 'L2', 'fillin',
  'การที่โลกหมุนรอบตัวเองครบ 1 รอบ ทำให้เกิดปรากฏการณ์ใดขึ้นบนโลก? (เช่น กลางวันกลางคืน หรือ ฤดูกาล)', to_jsonb('กลางวันกลางคืน'::text), '{}'::jsonb, ARRAY['กลางวันกลางคืน', 'กลางวันและกลางคืน', 'กลางวัน กลางคืน'], 'โลกหมุนรอบตัวเองทำให้เกิดกลางวันกลางคืน',
  'ว 3.1 ป.4/1', 'อธิบายแบบรูปเส้นทางการขึ้นและตกของดวงจันทร์', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะ', 'medium', 'L2', 'fillin',
  'ดาวบริวารเพียงดวงเดียวที่โคจรรอบโลกของเราคือดาวดวงใด?', to_jsonb('ดวงจันทร์'::text), '{}'::jsonb, ARRAY['ดวงจันทร์', 'พระจันทร์', 'Moon'], 'ดวงจันทร์เป็นดาวบริวารของโลก',
  'ว 3.1 ป.4/1', 'อธิบายแบบรูปเส้นทางการขึ้นและตกของดวงจันทร์', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะ', 'medium', 'L2', 'fillin',
  'ดาวเคราะห์ในระบบสุริยะดวงใดที่มีขนาดใหญ่ที่สุด?', to_jsonb('ดาวพฤหัสบดี'::text), '{}'::jsonb, ARRAY['ดาวพฤหัสบดี', 'ดาวพฤหัส', 'Jupiter'], 'ดาวพฤหัสบดีมีขนาดใหญ่ที่สุด',
  'ว 3.1 ป.4/3', 'สร้างแบบจำลองแสดงองค์ประกอบของระบบสุริยะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะ', 'medium', 'L2', 'fillin',
  'ดาวเคราะห์ดวงใดที่อยู่ใกล้ดวงอาทิตย์มากที่สุด?', to_jsonb('ดาวพุธ'::text), '{}'::jsonb, ARRAY['ดาวพุธ', 'Mercury'], 'ดาวพุธอยู่ใกล้ดวงอาทิตย์ที่สุด',
  'ว 3.1 ป.4/3', 'สร้างแบบจำลองแสดงองค์ประกอบของระบบสุริยะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงและการเคลื่อนที่', 'medium', 'L2', 'fillin',
  'แรงดึงดูดของโลกที่กระทำต่อวัตถุทำให้สิ่งของตกลงสู่พื้นดินเสมอ เรียกว่าแรงอะไร?', to_jsonb('แรงโน้มถ่วง'::text), '{}'::jsonb, ARRAY['แรงโน้มถ่วง', 'แรงดึงดูดของโลก', 'แรงโน้มถ่วงของโลก'], 'แรงโน้มถ่วงดึงดูดวัตถุสู่พื้นโลก',
  'ว 2.2 ป.4/1', 'ระบุผลของแรงโน้มถ่วงที่มีต่อวัตถุ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงและการเคลื่อนที่', 'medium', 'L2', 'fillin',
  'แรงที่เกิดขึ้นระหว่างผิวสัมผัสของวัตถุ 2 ชนิด เพื่อต้านการเคลื่อนที่ เรียกว่าแรงอะไร?', to_jsonb('แรงเสียดทาน'::text), '{}'::jsonb, ARRAY['แรงเสียดทาน', 'ความเสียดทาน'], 'แรงเสียดทานต้านการเคลื่อนที่',
  'ว 2.2 ป.4/1', 'ระบุผลของแรงโน้มถ่วงและแรงเสียดทาน', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงและการเคลื่อนที่', 'medium', 'L2', 'fillin',
  'วัตถุที่ยอมให้แสงผ่านไปได้ทั้งหมดหรือเกือบทั้งหมด เรียกว่าตัวกลางชนิดใด? (เช่น ตัวกลางโปร่งใส หรือ ตัวกลางทึบแสง)', to_jsonb('ตัวกลางโปร่งใส'::text), '{}'::jsonb, ARRAY['ตัวกลางโปร่งใส', 'โปร่งใส'], 'ตัวกลางโปร่งใสยอมให้แสงผ่านได้หมด',
  'ว 2.3 ป.4/1', 'จำแนกวัตถุเป็นตัวกลางโปร่งใส โปร่งแสง ทึบแสง', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงและการเคลื่อนที่', 'medium', 'L2', 'fillin',
  'วัตถุที่ไม่ยอมให้แสงผ่านได้เลยและทำให้เกิดเงาด้านหลัง เรียกว่าวัตถุชนิดใด?', to_jsonb('วัตถุทึบแสง'::text), '{}'::jsonb, ARRAY['วัตถุทึบแสง', 'ทึบแสง'], 'วัตถุทึบแสง แสงผ่านไม่ได้ เกิดเงา',
  'ว 2.3 ป.4/1', 'จำแนกวัตถุเป็นตัวกลางโปร่งใส โปร่งแสง ทึบแสง', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงและการเคลื่อนที่', 'medium', 'L2', 'fillin',
  'อุปกรณ์ที่ทำหน้าที่เปลี่ยนพลังงานแสงอาทิตย์ให้เป็นพลังงานไฟฟ้า เรียกว่าโซลาร์เซลล์ หรือเซลล์________', to_jsonb('สุริยะ'::text), '{}'::jsonb, ARRAY['สุริยะ', 'เซลล์สุริยะ'], 'เซลล์สุริยะเปลี่ยนแสงอาทิตย์เป็นไฟฟ้า',
  'ว 2.3 ป.4/1', 'จำแนกวัตถุและการใช้ประโยชน์', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสิ่งมีชีวิต', 'medium', 'L2', 'fillin',
  'กบและคางคก จัดเป็นสัตว์กลุ่มใด? (สัตว์น้ำ, สัตว์สะเทินน้ำสะเทินบก หรือ สัตว์เลื้อยคลาน)', to_jsonb('สัตว์สะเทินน้ำสะเทินบก'::text), '{}'::jsonb, ARRAY['สัตว์สะเทินน้ำสะเทินบก', 'สะเทินน้ำสะเทินบก', 'สัตว์ครึ่งบกครึ่งน้ำ'], 'กบเป็นสัตว์สะเทินน้ำสะเทินบก',
  'ว 1.3 ป.4/1', 'จำแนกสิ่งมีชีวิต', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสิ่งมีชีวิต', 'medium', 'L2', 'fillin',
  'โลมาและวาฬ เป็นสัตว์น้ำแต่หายใจด้วยปอดและออกลูกเป็นตัว จัดเป็นสัตว์กลุ่มใด?', to_jsonb('สัตว์เลี้ยงลูกด้วยน้ำนม'::text), '{}'::jsonb, ARRAY['สัตว์เลี้ยงลูกด้วยน้ำนม', 'สัตว์เลี้ยงลูกด้วยนม'], 'โลมาและวาฬเลี้ยงลูกด้วยน้ำนม',
  'ว 1.3 ป.4/2', 'จำแนกสัตว์ออกเป็นสัตว์มีกระดูกสันหลังและไม่มี', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสิ่งมีชีวิต', 'medium', 'L2', 'fillin',
  'ไส้เดือนดิน ยุง และมด จัดเป็นสัตว์มีกระดูกสันหลัง หรือ สัตว์ไม่มีกระดูกสันหลัง?', to_jsonb('สัตว์ไม่มีกระดูกสันหลัง'::text), '{}'::jsonb, ARRAY['สัตว์ไม่มีกระดูกสันหลัง', 'ไม่มีกระดูกสันหลัง'], 'แมลงและไส้เดือนเป็นสัตว์ไม่มีกระดูกสันหลัง',
  'ว 1.3 ป.4/2', 'จำแนกสัตว์ออกเป็นสัตว์มีกระดูกสันหลังและไม่มี', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสิ่งมีชีวิต', 'medium', 'L2', 'fillin',
  'จระเข้ เต่า และงู จัดเป็นสัตว์มีกระดูกสันหลังกลุ่มใด? (สัตว์ปีก หรือ สัตว์เลื้อยคลาน)', to_jsonb('สัตว์เลื้อยคลาน'::text), '{}'::jsonb, ARRAY['สัตว์เลื้อยคลาน', 'เลื้อยคลาน'], 'จระเข้ เต่า งู เป็นสัตว์เลื้อยคลาน',
  'ว 1.3 ป.4/2', 'จำแนกสัตว์ออกเป็นสัตว์มีกระดูกสันหลังและไม่มี', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสิ่งมีชีวิต', 'medium', 'L2', 'fillin',
  'สิ่งมีชีวิตกลุ่มใดที่ไม่สามารถสร้างอาหารเองได้และไม่สามารถเคลื่อนที่ได้ เช่น เห็ด รา? (พืช, สัตว์, หรือ กลุ่มที่ไม่ใช่พืชและสัตว์)', to_jsonb('กลุ่มที่ไม่ใช่พืชและสัตว์'::text), '{}'::jsonb, ARRAY['กลุ่มที่ไม่ใช่พืชและสัตว์', 'เห็ดรา', 'ไม่จัดเป็นพืชและสัตว์'], 'เห็ดราอยู่ในกลุ่มที่ไม่ใช่พืชและสัตว์',
  'ว 1.3 ป.4/1', 'จำแนกสิ่งมีชีวิต', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'วันสำคัญทางศาสนา', 'medium', 'L2', 'fillin',
  'วันสำคัญทางพระพุทธศาสนาที่พระสงฆ์ 1,250 รูป มาประชุมพร้อมเพรียงกันโดยมิได้นัดหมาย คือวันอะไร?', to_jsonb('วันมาฆบูชา'::text), '{}'::jsonb, ARRAY['วันมาฆบูชา', 'มาฆบูชา'], 'วันมาฆบูชา (จาตุรงคสันนิบาต)',
  'ส 1.1 ป.4/1', 'อธิบายความสำคัญของพระพุทธศาสนา', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'วันสำคัญทางศาสนา', 'medium', 'L2', 'fillin',
  'วันสำคัญทางพระพุทธศาสนาที่เกิดเหตุการณ์ประสูติ ตรัสรู้ และปรินิพพาน ตรงกันคือวันอะไร?', to_jsonb('วันวิสาขบูชา'::text), '{}'::jsonb, ARRAY['วันวิสาขบูชา', 'วิสาขบูชา'], 'วันวิสาขบูชา',
  'ส 1.1 ป.4/1', 'อธิบายความสำคัญของพระพุทธศาสนา', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'วันสำคัญทางศาสนา', 'medium', 'L2', 'fillin',
  'วันสำคัญที่พระพุทธเจ้าทรงแสดงปฐมเทศนา (ธัมมจักกัปปวัตตนสูตร) คือวันอะไร?', to_jsonb('วันอาสาฬหบูชา'::text), '{}'::jsonb, ARRAY['วันอาสาฬหบูชา', 'อาสาฬหบูชา'], 'วันอาสาฬหบูชา มีพระรัตนตรัยครบองค์สาม',
  'ส 1.1 ป.4/1', 'อธิบายความสำคัญของพระพุทธศาสนา', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หลักธรรมคำสอน', 'medium', 'L2', 'fillin',
  'หลักธรรมที่หมายถึง "ความกตัญญูกตเวที" คือการรู้คุณและ________คุณ', to_jsonb('ตอบแทน'::text), '{}'::jsonb, ARRAY['ตอบแทน', 'ตอบแทนบุญคุณ'], 'กตัญญูคือรู้คุณ กตเวทีคือตอบแทนคุณ',
  'ส 1.1 ป.4/4', 'แสดงความเคารพพระรัตนตรัย', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หลักธรรมคำสอน', 'medium', 'L2', 'fillin',
  'ศีล 5 ข้อที่ 2 ห้ามทำสิ่งใด? (ห้ามฆ่าสัตว์ หรือ ห้ามลักทรัพย์)', to_jsonb('ห้ามลักทรัพย์'::text), '{}'::jsonb, ARRAY['ห้ามลักทรัพย์', 'ลักทรัพย์', 'ไม่ลักทรัพย์'], 'ศีลข้อ 2 อทินนาทานา เวรมณี คือเว้นจากการลักทรัพย์',
  'ส 1.1 ป.4/4', 'ปฏิบัติตามโอวาท 3', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หน้าที่พลเมือง', 'medium', 'L2', 'fillin',
  'เด็กไทยที่มีสัญชาติไทยต้องเริ่มทำบัตรประจำตัวประชาชนเมื่อมีอายุครบกี่ปีบริบูรณ์? (ตอบเฉพาะตัวเลข)', to_jsonb('7'::text), '{}'::jsonb, ARRAY['7', '๗', '7 ปี', '๗ ปี'], 'อายุครบ 7 ปีบริบูรณ์ต้องทำบัตรประชาชน',
  'ส 2.1 ป.4/1', 'ปฏิบัติตนเป็นพลเมืองดี', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หน้าที่พลเมือง', 'medium', 'L2', 'fillin',
  'สัญญาณไฟจราจรสีแดง หมายถึงให้ยานพาหนะปฏิบัติอย่างไร?', to_jsonb('หยุด'::text), '{}'::jsonb, ARRAY['หยุด', 'หยุดรถ'], 'ไฟแดงหมายถึงหยุดรถ',
  'ส 2.1 ป.4/1', 'ปฏิบัติตนเป็นพลเมืองดี', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'สิทธิเด็ก', 'medium', 'L2', 'fillin',
  'สิทธิขั้นพื้นฐานของเด็กมี 4 ประการ ได้แก่ สิทธิที่จะมีชีวิตรอด, สิทธิที่จะได้รับการพัฒนา, สิทธิที่จะมีส่วนร่วม และสิทธิที่จะได้รับการ________ (คุ้มครอง หรือ ลงโทษ)', to_jsonb('ปกป้องคุ้มครอง'::text), '{}'::jsonb, ARRAY['ปกป้องคุ้มครอง', 'คุ้มครอง', 'การคุ้มครอง'], 'สิทธิที่จะได้รับการปกป้องคุ้มครอง',
  'ส 2.1 ป.4/2', 'ปฏิบัติตามกฎหมายที่เกี่ยวข้อง', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'ประชาธิปไตย', 'medium', 'L2', 'fillin',
  'ในสังคมประชาธิปไตย เมื่อมีความคิดเห็นแตกต่างกัน ควรใช้หลักการใดในการตัดสิน? (เสียงข้างมาก หรือ การใช้กำลัง)', to_jsonb('เสียงข้างมาก'::text), '{}'::jsonb, ARRAY['เสียงข้างมาก', 'มติเสียงข้างมาก', 'เสียงส่วนใหญ่'], 'ประชาธิปไตยยึดหลักเสียงข้างมาก',
  'ส 2.1 ป.4/1', 'ปฏิบัติตนเป็นพลเมืองดี', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หน้าที่พลเมือง', 'medium', 'L2', 'fillin',
  'เงินที่ประชาชนมีรายได้ต้องจ่ายให้แก่รัฐบาลเพื่อนำไปพัฒนาประเทศ เรียกว่าเงินอะไร?', to_jsonb('ภาษี'::text), '{}'::jsonb, ARRAY['ภาษี', 'เงินภาษี', 'ภาษีอากร'], 'ภาษีคือเงินที่ประชาชนจ่ายเพื่อพัฒนาประเทศ',
  'ส 2.1 ป.4/1', 'ปฏิบัติตนเป็นพลเมืองดี', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'ปรัชญาเศรษฐกิจพอเพียง', 'medium', 'L2', 'fillin',
  'ปรัชญาเศรษฐกิจพอเพียงประกอบด้วย "3 ห่วง 2 เงื่อนไข" ห่วงทั้งสาม ได้แก่ ความพอประมาณ, การมีภูมิคุ้มกันที่ดี และความมี________', to_jsonb('เหตุผล'::text), '{}'::jsonb, ARRAY['เหตุผล', 'ความมีเหตุผล'], '3 ห่วง: พอประมาณ มีเหตุผล มีภูมิคุ้มกัน',
  'ส 3.1 ป.4/1', 'ระบุปัจจัยที่มีผลต่อการเลือกซื้อสินค้า', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'ปรัชญาเศรษฐกิจพอเพียง', 'medium', 'L2', 'fillin',
  'เงื่อนไขสำคัญ 2 ประการตามหลักปรัชญาเศรษฐกิจพอเพียง คือ เงื่อนไขคุณธรรม และเงื่อนไข________', to_jsonb('ความรู้'::text), '{}'::jsonb, ARRAY['ความรู้', 'เงื่อนไขความรู้'], '2 เงื่อนไข: ความรู้ และคุณธรรม',
  'ส 3.1 ป.4/1', 'ระบุปัจจัยที่มีผลต่อการเลือกซื้อสินค้า', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'เศรษฐศาสตร์ในชีวิตประจำวัน', 'medium', 'L2', 'fillin',
  'เงินส่วนที่เหลือหลังจากหักค่าใช้จ่ายที่จำเป็นในแต่ละวัน เรียกว่าเงิน________', to_jsonb('ออม'::text), '{}'::jsonb, ARRAY['ออม', 'เงินออม', 'การออม'], 'เงินออมคือเงินที่เหลือเก็บไว้',
  'ส 3.1 ป.4/2', 'บอกความสำคัญของการสร้างรายได้และการออม', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การเกษตรทฤษฎีใหม่', 'medium', 'L2', 'fillin',
  'การจัดสรรพื้นที่ตามแนวเกษตรทฤษฎีใหม่ สัดส่วนพื้นที่สำหรับขุดสระเก็บกักน้ำคิดเป็นร้อยละเท่าใด? (ตอบเฉพาะตัวเลข เช่น 10 หรือ 30)', to_jsonb('30'::text), '{}'::jsonb, ARRAY['30', '๓๐', '30%', 'ร้อยละ 30'], 'สัดส่วนทฤษฎีใหม่ 30:30:30:10 (สระน้ำ 30%)',
  'ส 3.1 ป.4/1', 'ระบุปัจจัยที่มีผลต่อการเลือกซื้อสินค้า', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'เศรษฐศาสตร์ในชีวิตประจำวัน', 'medium', 'L2', 'fillin',
  'ผู้ผลิตสินค้าและบริการเพื่อขายให้แก่ผู้ซื้อ เรียกว่า "ผู้ผลิต" ส่วนผู้ที่นำเงินไปซื้อสินค้ามาใช้ เรียกว่า "ผู้________"', to_jsonb('บริโภค'::text), '{}'::jsonb, ARRAY['บริโภค', 'ผู้บริโภค'], 'ผู้บริโภคคือผู้ซื้อสินค้ามาใช้',
  'ส 3.1 ป.4/1', 'ระบุปัจจัยที่มีผลต่อการเลือกซื้อสินค้า', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การนับช่วงเวลา', 'medium', 'L2', 'fillin',
  'ช่วงเวลาในรอบ 10 ปี เรียกว่าอะไร? (ทศวรรษ, ศตวรรษ หรือ สหัสวรรษ)', to_jsonb('ทศวรรษ'::text), '{}'::jsonb, ARRAY['ทศวรรษ'], 'ทศวรรษ = 10 ปี',
  'ส 4.1 ป.4/1', 'นับช่วงเวลาเป็นทศวรรษ ศตวรรษ และสหัสวรรษ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การนับช่วงเวลา', 'medium', 'L2', 'fillin',
  'ช่วงเวลาในรอบ 100 ปี เรียกว่าอะไร?', to_jsonb('ศตวรรษ'::text), '{}'::jsonb, ARRAY['ศตวรรษ'], 'ศตวรรษ = 100 ปี',
  'ส 4.1 ป.4/1', 'นับช่วงเวลาเป็นทศวรรษ ศตวรรษ และสหัสวรรษ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การนับช่วงเวลา', 'medium', 'L2', 'fillin',
  'ช่วงเวลาในรอบ 1,000 ปี เรียกว่าอะไร?', to_jsonb('สหัสวรรษ'::text), '{}'::jsonb, ARRAY['สหัสวรรษ'], 'สหัสวรรษ = 1,000 ปี',
  'ส 4.1 ป.4/1', 'นับช่วงเวลาเป็นทศวรรษ ศตวรรษ และสหัสวรรษ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การเทียบศักราช', 'medium', 'L2', 'fillin',
  'การนับพุทธศักราช (พ.ศ.) ในประเทศไทย เริ่มนับเมื่อพระพุทธเจ้าเสด็จดับขันธ์เข้าสู่________', to_jsonb('ปรินิพพาน'::text), '{}'::jsonb, ARRAY['ปรินิพพาน', 'นิพพาน'], 'พ.ศ. เริ่มนับหลังพระพุทธเจ้านิพพาน',
  'ส 4.1 ป.4/2', 'อธิบายยุคสมัยในการศึกษาประวัติศาสตร์', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การเทียบศักราช', 'medium', 'L2', 'fillin',
  'หากต้องการแปลงปี คริสต์ศักราช (ค.ศ.) เป็น พุทธศักราช (พ.ศ.) ต้องนำตัวเลขใดไปบวกเพิ่ม? (ตอบเฉพาะตัวเลข)', to_jsonb('543'::text), '{}'::jsonb, ARRAY['543', '๕๔๓'], 'พ.ศ. = ค.ศ. + 543',
  'ส 4.1 ป.4/2', 'อธิบายยุคสมัยในการศึกษาประวัติศาสตร์', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'อาณาจักรสุโขทัย', 'medium', 'L2', 'fillin',
  'ปฐมกษัตริย์ผู้สถาปนาราชวงศ์พระร่วงแห่งอาณาจักรสุโขทัย คือพ่อขุน________', to_jsonb('ศรีอินทราทิตย์'::text), '{}'::jsonb, ARRAY['ศรีอินทราทิตย์', 'พ่อขุนศรีอินทราทิตย์', 'บางกลางหาว'], 'พ่อขุนศรีอินทราทิตย์ ปฐมกษัตริย์สุโขทัย',
  'ส 4.3 ป.4/1', 'อธิบายการตั้งถิ่นฐานและพัฒนาการ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'อาณาจักรสุโขทัย', 'medium', 'L2', 'fillin',
  'พระมหากษัตริย์ผู้ทรงประดิษฐ์อักษรไทย (ลายสือไทย) ขึ้นเมื่อปี พ.ศ. 1826 คือพ่อขุน________', to_jsonb('รามคำแหงมหาราช'::text), '{}'::jsonb, ARRAY['รามคำแหงมหาราช', 'รามคำแหง', 'พ่อขุนรามคำแหง'], 'พ่อขุนรามคำแหงมหาราชประดิษฐ์ลายสือไทย',
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'อาณาจักรสุโขทัย', 'medium', 'L2', 'fillin',
  'รูปแบบการปกครองในสมัยสุโขทัยตอนต้นที่พระมหากษัตริย์ทรงดูแลราษฎรอย่างใกล้ชิด เรียกว่าการปกครองแบบใด? (พ่อปกครองลูก หรือ สมบูรณาญาสิทธิราชย์)', to_jsonb('พ่อปกครองลูก'::text), '{}'::jsonb, ARRAY['พ่อปกครองลูก', 'แบบพ่อปกครองลูก'], 'การปกครองแบบพ่อปกครองลูก',
  'ส 4.3 ป.4/1', 'อธิบายการตั้งถิ่นฐานและพัฒนาการ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'อาณาจักรสุโขทัย', 'medium', 'L2', 'fillin',
  'เครื่องปั้นดินเผาเคลือบเนื้อละเอียดที่มีชื่อเสียงโด่งดังและเป็นสินค้าส่งออกสำคัญของสุโขทัย เรียกว่าเครื่องปั้นดินเผา________', to_jsonb('สังคโลก'::text), '{}'::jsonb, ARRAY['สังคโลก', 'เครื่องสังคโลก'], 'เครื่องสังคโลกสุโขทัย',
  'ส 4.3 ป.4/1', 'อธิบายการตั้งถิ่นฐานและพัฒนาการ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'อาณาจักรสุโขทัย', 'medium', 'L2', 'fillin',
  'หลักฐานทางประวัติศาสตร์ที่จารึกเรื่องราวความเป็นอยู่ของอาณาจักรสุโขทัย "ในน้ำมีปลา ในนามีข้าว" คือศิลา________', to_jsonb('จารึก'::text), '{}'::jsonb, ARRAY['จารึก', 'ศิลาจารึก', 'ศิลาจารึกหลักที่ 1'], 'ศิลาจารึกหลักที่ 1',
  'ส 4.3 ป.4/1', 'อธิบายการตั้งถิ่นฐานและพัฒนาการ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'แหล่งโบราณคดีในประเทศไทย', 'medium', 'L2', 'fillin',
  'แหล่งโบราณคดียุคก่อนประวัติศาสตร์ที่มีชื่อเสียงด้านภาชนะดินเผาเขียนสีลายก้นหอย ตั้งอยู่ที่อำเภอหนองหาน จังหวัดอุดรธานี คือแหล่งโบราณคดีบ้าน________', to_jsonb('เชียง'::text), '{}'::jsonb, ARRAY['เชียง', 'บ้านเชียง'], 'แหล่งโบราณคดีบ้านเชียง',
  'ส 4.2 ป.4/1', 'อธิบายลักษณะสำคัญของหลักฐาน', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'บุคคลสำคัญ', 'medium', 'L2', 'fillin',
  'ทหารเอกแห่งสมเด็จพระเจ้าตากสินมหาราช ผู้ต่อสู้กับข้าศึกจนดาบหักและยอมพลีชีพเพื่อชาติ คือพระยา________ดาบหัก', to_jsonb('พิชัย'::text), '{}'::jsonb, ARRAY['พิชัย', 'พระยาพิชัย'], 'พระยาพิชัยดาบหัก',
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'บุคคลสำคัญ', 'medium', 'L2', 'fillin',
  'วีรสตรีไทยสองท่านผู้รวบรวมกำลังชาวเมืองถลางต่อสู้ป้องกันข้าศึก คือท้าวเทพกระษัตรี และท้าวศรี________', to_jsonb('สุนทร'::text), '{}'::jsonb, ARRAY['สุนทร', 'ท้าวศรีสุนทร'], 'ท้าวเทพกระษัตรี และท้าวศรีสุนทร',
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'หลักฐานทางประวัติศาสตร์', 'medium', 'L2', 'fillin',
  'หลักฐานทางประวัติศาสตร์ที่เป็นลายลักษณ์อักษร เช่น พงศาวดาร จดหมายเหตุ หรือ ศิลาจารึก จัดเป็นหลักฐานประเภทใด? (ชั้นต้น หรือ ชั้นรอง)', to_jsonb('ชั้นต้น'::text), '{}'::jsonb, ARRAY['ชั้นต้น', 'หลักฐานชั้นต้น'], 'เอกสารร่วมสมัยเป็นหลักฐานชั้นต้น',
  'ส 4.1 ป.4/3', 'แยกแยะความแตกต่างของหลักฐาน', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'มรดกทางวัฒนธรรม', 'medium', 'L2', 'fillin',
  'การอนุรักษ์โบราณสถานและโบราณวัตถุในท้องถิ่น นักเรียนไม่ควรขีดเขียนสิ่งใดลงบนโบราณสถาน ใช่หรือไม่? (ตอบว่า "ใช่" หรือ "ไม่ใช่")', to_jsonb('ใช่'::text), '{}'::jsonb, ARRAY['ใช่', 'ถูกต้อง'], 'ไม่ควรขีดเขียนทำลายโบราณสถาน',
  'ส 4.2 ป.4/2', 'บอกความสำคัญของการอนุรักษ์', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'อาหารหลัก 5 หมู่', 'medium', 'L2', 'fillin',
  'อาหารหมู่ที่ 1 ซึ่งได้แก่ เนื้อสัตว์ ไข่ นม และถั่วเมล็ดแห้ง ให้สารอาหารประเภทใดที่ช่วยเสริมสร้างกล้ามเนื้อ?', to_jsonb('โปรตีน'::text), '{}'::jsonb, ARRAY['โปรตีน', 'Protein'], 'โปรตีนช่วยสร้างกล้ามเนื้อ',
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'อาหารหลัก 5 หมู่', 'medium', 'L2', 'fillin',
  'ข้าว แป้ง น้ำตาล เผือก และมัน เป็นอาหารหมู่ที่ 2 ซึ่งให้สารอาหารประเภทใดที่ให้พลังงานแก่ร่างกาย?', to_jsonb('คาร์โบไฮเดรต'::text), '{}'::jsonb, ARRAY['คาร์โบไฮเดรต', 'Carbohydrate'], 'คาร์โบไฮเดรตให้พลังงาน',
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'อาหารหลัก 5 หมู่', 'medium', 'L2', 'fillin',
  'พืชผักใบเขียวและผักชนิดต่างๆ เป็นอาหารหมู่ที่ 3 ซึ่งให้สารอาหารประเภทวิตามินและ________', to_jsonb('เกลือแร่'::text), '{}'::jsonb, ARRAY['เกลือแร่', 'แร่ธาตุ'], 'ผักให้เกลือแร่ (แร่ธาตุ)',
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'อาหารหลัก 5 หมู่', 'medium', 'L2', 'fillin',
  'ผลไม้ต่างๆ เช่น ส้ม กล้วย มะละกอ จัดเป็นอาหารหมู่ที่ 4 ที่อุดมไปด้วยสารอาหารประเภทใด?', to_jsonb('วิตามิน'::text), '{}'::jsonb, ARRAY['วิตามิน', 'Vitamin'], 'ผลไม้อุดมด้วยวิตามิน',
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'อาหารหลัก 5 หมู่', 'medium', 'L2', 'fillin',
  'น้ำมันพืช น้ำมันสัตว์ และเนย จัดเป็นอาหารหมู่ที่ 5 ที่ให้สารอาหารประเภทใด?', to_jsonb('ไขมัน'::text), '{}'::jsonb, ARRAY['ไขมัน', 'Fat'], 'ไขมันให้ความอบอุ่นแก่ร่างกาย',
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'สุขอนามัยส่วนบุคคล', 'medium', 'L2', 'fillin',
  'การแปรงฟันอย่างถูกวิธีเพื่อป้องกันฟันผุ ควรแปรงฟันอย่างน้อยวันละกี่ครั้ง? (ตอบเฉพาะตัวเลข)', to_jsonb('2'::text), '{}'::jsonb, ARRAY['2', '๒', '2 ครั้ง', '๒ ครั้ง'], 'ควรแปรงฟันอย่างน้อยวันละ 2 ครั้ง',
  'พ 1.1 ป.4/1', 'อธิบายการเจริญเติบโต', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'สุขอนามัยส่วนบุคคล', 'medium', 'L2', 'fillin',
  'การล้างมือด้วยสบู่และน้ำสะอาดตามหลักสุขอนามัยมีทั้งหมดกี่ขั้นตอน? (ตอบเฉพาะตัวเลข)', to_jsonb('7'::text), '{}'::jsonb, ARRAY['7', '๗', '7 ขั้นตอน', '๗ ขั้นตอน'], 'ล้างมือ 7 ขั้นตอน',
  'พ 4.1 ป.4/1', 'อธิบายสุขบัญญัติแห่งชาติ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'สุขอนามัยส่วนบุคคล', 'medium', 'L2', 'fillin',
  'ในหนึ่งวัน เด็กวัยเรียนควรดื่มน้ำสะอาดอย่างน้อยวันละกี่แก้ว? (ตอบเป็นตัวเลข เช่น 6-8 แก้ว หรือ 8)', to_jsonb('8'::text), '{}'::jsonb, ARRAY['8', '๘', '6-8', '8 แก้ว', '๖-๘ แก้ว'], 'ควรดื่มน้ำ 6-8 แก้วต่อวัน',
  'พ 4.1 ป.4/1', 'อธิบายสุขบัญญัติแห่งชาติ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ทันตสุขภาพ', 'medium', 'L2', 'fillin',
  'สารอาหารหรือแร่ธาตุที่ผสมในยาสีฟันเพื่อช่วยเคลือบผิวฟันและป้องกันฟันผุคือสารใด?', to_jsonb('ฟลูออไรด์'::text), '{}'::jsonb, ARRAY['ฟลูออไรด์', 'ฟลูออไรด', 'Fluoride'], 'ฟลูออไรด์ป้องกันฟันผุ',
  'พ 4.1 ป.4/1', 'อธิบายสุขบัญญัติแห่งชาติ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การออกกำลังกาย', 'medium', 'L2', 'fillin',
  'การออกกำลังกายที่เหมาะสมสำหรับเด็กวัยเรียนควรทำอย่างน้อยสัปดาห์ละกี่วัน? (ตอบเป็นตัวเลข เช่น 3 หรือ 3-5 วัน)', to_jsonb('3'::text), '{}'::jsonb, ARRAY['3', '๓', '3 วัน', '3-5 วัน', '๓-๕ วัน'], 'ควรออกกำลังกายอย่างน้อยสัปดาห์ละ 3-5 วัน',
  'พ 3.1 ป.4/1', 'ควบคุมตนเองในการเคลื่อนไหว', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'สารเสพติดและอันตราย', 'medium', 'L2', 'fillin',
  'สารพิษชนิดหนึ่งในควันบุหรี่ที่ทำให้ผู้สูบเกิดการเสพติด คือสารใด?', to_jsonb('นิโคติน'::text), '{}'::jsonb, ARRAY['นิโคติน', 'Nicotine'], 'นิโคตินเป็นสารเสพติดในบุหรี่',
  'พ 5.1 ป.4/1', 'อธิบายความสำคัญของการปฏิเสธสุรา บุหรี่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ความปลอดภัย', 'medium', 'L2', 'fillin',
  'หมายเลขโทรศัพท์ฉุกเฉินสำหรับแจ้งเหตุด่วนเหตุร้ายต่อเจ้าหน้าที่ตำรวจคือหมายเลขใด? (ตอบเฉพาะตัวเลข)', to_jsonb('191'::text), '{}'::jsonb, ARRAY['191', '๑๙๑'], '191 เหตุด่วนเหตุร้าย',
  'พ 5.1 ป.4/2', 'วิเคราะห์การขอความช่วยเหลือเมื่อเกิดเหตุ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ความปลอดภัย', 'medium', 'L2', 'fillin',
  'หมายเลขโทรศัพท์ฉุกเฉินสำหรับเรียกรถพยาบาลกู้ชีพคือหมายเลขใด? (ตอบเฉพาะตัวเลข)', to_jsonb('1669'::text), '{}'::jsonb, ARRAY['1669', '๑๖๖๙'], '1669 บริการการแพทย์ฉุกเฉิน',
  'พ 5.1 ป.4/2', 'วิเคราะห์การขอความช่วยเหลือเมื่อเกิดเหตุ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ความปลอดภัย', 'medium', 'L2', 'fillin',
  'เมื่อเดินข้ามถนนอย่างปลอดภัยตรงจุดที่มีทางข้าม ควรเดินข้ามบนทางอะไร?', to_jsonb('ทางม้าลาย'::text), '{}'::jsonb, ARRAY['ทางม้าลาย', 'ทางข้ามม้าลาย'], 'ทางม้าลายปลอดภัยที่สุดในการข้ามถนน',
  'พ 5.1 ป.4/2', 'อธิบายการปฏิบัติตนเพื่อความปลอดภัย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ความปลอดภัย', 'medium', 'L2', 'fillin',
  'ก่อนขี่รถจักรยานทุกครั้งเพื่อป้องกันการบาดเจ็บที่ศีรษะ นักเรียนควรสวมใส่อุปกรณ์ใด?', to_jsonb('หมวกกันน็อก'::text), '{}'::jsonb, ARRAY['หมวกกันน็อก', 'หมวกนิรภัย', 'หมวกกันน็อค'], 'หมวกกันน็อกช่วยป้องกันศีรษะ',
  'พ 5.1 ป.4/2', 'อธิบายการปฏิบัติตนเพื่อความปลอดภัย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ทฤษฎีสีและแม่สี', 'medium', 'L2', 'fillin',
  'แม่สีทางทัศนศิลป์มีทั้งหมดกี่สี? (ตอบเฉพาะตัวเลข)', to_jsonb('3'::text), '{}'::jsonb, ARRAY['3', '๓', '3 สี', '๓ สี'], 'แม่สีมี 3 สี (แดง เหลือง น้ำเงิน)',
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ทฤษฎีสีและแม่สี', 'medium', 'L2', 'fillin',
  'เมื่อนำสีแดงผสมกับสีเหลืองในอัตราส่วนเท่ากัน จะได้สีอะไร?', to_jsonb('สีส้ม'::text), '{}'::jsonb, ARRAY['สีส้ม', 'ส้ม'], 'แดง + เหลือง = สีส้ม',
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ทฤษฎีสีและแม่สี', 'medium', 'L2', 'fillin',
  'เมื่อนำสีเหลืองผสมกับสีน้ำเงินในอัตราส่วนเท่ากัน จะได้สีอะไร?', to_jsonb('สีเขียว'::text), '{}'::jsonb, ARRAY['สีเขียว', 'เขียว'], 'เหลือง + น้ำเงิน = สีเขียว',
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ทฤษฎีสีและแม่สี', 'medium', 'L2', 'fillin',
  'เมื่อนำสีแดงผสมกับสีน้ำเงินในอัตราส่วนเท่ากัน จะได้สีอะไร?', to_jsonb('สีม่วง'::text), '{}'::jsonb, ARRAY['สีม่วง', 'ม่วง'], 'แดง + น้ำเงิน = สีม่วง',
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'องค์ประกอบศิลป์', 'medium', 'L2', 'fillin',
  'งานศิลปะที่มีความกว้าง ความยาว และความหนาหรือความลึก เรียกว่ารูปทรงกี่มิติ? (ตอบเป็นตัวเลข เช่น 2 หรือ 3 มิติ)', to_jsonb('3'::text), '{}'::jsonb, ARRAY['3', '๓', '3 มิติ', '๓ มิติ'], 'รูปทรงมี 3 มิติ',
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประเภทเครื่องดนตรีไทย', 'medium', 'L2', 'fillin',
  'เครื่องดนตรีไทยแบ่งออกเป็น 4 ประเภท ได้แก่ ดีด, สี, ตี และ________', to_jsonb('เป่า'::text), '{}'::jsonb, ARRAY['เป่า', 'เครื่องเป่า'], 'เครื่องดนตรีไทย 4 ประเภท: ดีด สี ตี เป่า',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประเภทเครื่องดนตรีไทย', 'medium', 'L2', 'fillin',
  'จะเข้และซึง จัดเป็นเครื่องดนตรีไทยประเภทใด? (ดีด, สี, ตี หรือ เป่า)', to_jsonb('ดีด'::text), '{}'::jsonb, ARRAY['ดีด', 'เครื่องดีด'], 'จะเข้และซึงเป็นเครื่องดีด',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประเภทเครื่องดนตรีไทย', 'medium', 'L2', 'fillin',
  'ซอด้วงและซออู้ จัดเป็นเครื่องดนตรีไทยประเภทใด? (ดีด, สี, ตี หรือ เป่า)', to_jsonb('สี'::text), '{}'::jsonb, ARRAY['สี', 'เครื่องสี'], 'ซอด้วงและซออู้เป็นเครื่องสี',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประเภทเครื่องดนตรีไทย', 'medium', 'L2', 'fillin',
  'ระนาดเอกและฆ้องวงใหญ่ จัดเป็นเครื่องดนตรีไทยประเภทใด? (ดีด, สี, ตี หรือ เป่า)', to_jsonb('ตี'::text), '{}'::jsonb, ARRAY['ตี', 'เครื่องตี'], 'ระนาดและฆ้องวงเป็นเครื่องตี',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประเภทเครื่องดนตรีไทย', 'medium', 'L2', 'fillin',
  'ขลุ่ยเพียงออและปี่ใน จัดเป็นเครื่องดนตรีไทยประเภทใด? (ดีด, สี, ตี หรือ เป่า)', to_jsonb('เป่า'::text), '{}'::jsonb, ARRAY['เป่า', 'เครื่องเป่า'], 'ขลุ่ยและปี่เป็นเครื่องเป่า',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ดนตรีสากลและนาฏศิลป์', 'medium', 'L2', 'fillin',
  'ตัวโน้ตสากลพื้นฐานมี 7 ระดับเสียง ได้แก่ โด, เร, มี, ฟา, ซอล, ลา และ________', to_jsonb('ที'::text), '{}'::jsonb, ARRAY['ที', 'ซี', 'Ti', 'Si'], 'โน้ตทั้ง 7 ได้แก่ Do Re Mi Fa Sol La Ti',
  'ศ 2.1 ป.4/2', 'ระบุทิศทางการเคลื่อนที่ของทำนอง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ดนตรีสากล', 'medium', 'L2', 'fillin',
  'กีตาร์และไวโอลิน จัดเป็นเครื่องดนตรีสากลประเภทใด? (เครื่องสาย หรือ เครื่องเป่า)', to_jsonb('เครื่องสาย'::text), '{}'::jsonb, ARRAY['เครื่องสาย', 'เครื่องสาย (String)'], 'กีตาร์และไวโอลินเป็นเครื่องสาย',
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทยและสากล', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'นาฏศิลป์ไทย', 'medium', 'L2', 'fillin',
  'ท่ารำแม่บทไทยที่ใช้นิ้วหัวแม่มือจรดข้อแรกของนิ้วชี้ นิ้วที่เหลือกรีดตึง เรียกว่าการ________ (จีบ หรือ ดัดมือ)', to_jsonb('จีบ'::text), '{}'::jsonb, ARRAY['จีบ', 'การจีบ'], 'การจีบเป็นท่ารำพื้นฐาน',
  'ศ 3.1 ป.4/1', 'ระบุทักษะพื้นฐานทางนาฏศิลป์', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'นาฏศิลป์ไทย', 'medium', 'L2', 'fillin',
  'การแสดงนาฏศิลป์ชั้นสูงของไทยที่ผู้แสดงต้องสวมศีรษะจำลองปิดหน้าทั้งหมด เรียกว่าการแสดงอะไร?', to_jsonb('โขน'::text), '{}'::jsonb, ARRAY['โขน', 'การแสดงโขน'], 'โขนสวมหัวโขนปิดหน้า',
  'ศ 3.2 ป.4/1', 'อธิบายประวัติความเป็นมาของนาฏศิลป์', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'นาฏศิลป์พื้นเมือง', 'medium', 'L2', 'fillin',
  'การแสดง "ฟ้อนเล็บ" เป็นศิลปะการแสดงพื้นบ้านประจำภาคใดของประเทศไทย? (ภาคเหนือ หรือ ภาคใต้)', to_jsonb('ภาคเหนือ'::text), '{}'::jsonb, ARRAY['ภาคเหนือ', 'เหนือ'], 'ฟ้อนเล็บเป็นการแสดงพื้นบ้านล้านนาภาคเหนือ',
  'ศ 3.2 ป.4/1', 'อธิบายการแสดงพื้นเมือง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การดูแลของใช้และงานบ้าน', 'medium', 'L2', 'fillin',
  'ก่อนนำเสื้อผ้าไปซัก ควรแยกประเภทผ้าขาวออกจากผ้าอะไรเพื่อป้องกันสีตกใส่?', to_jsonb('ผ้าสี'::text), '{}'::jsonb, ARRAY['ผ้าสี', 'ผ้ามีสี'], 'แยกผ้าขาวออกจากผ้าสี',
  'ง 1.1 ป.4/1', 'บอกเหตุผลในการทำงาน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การดูแลของใช้และงานบ้าน', 'medium', 'L2', 'fillin',
  'การกวาดพื้นห้องเรียนอย่างถูกวิธี ควรกวาดจากมุมห้องและใต้โต๊ะออกมารวมกันไว้ที่จุดใด? (หน้าห้อง, กลางห้อง หรือ ประตู)', to_jsonb('กลางห้อง'::text), '{}'::jsonb, ARRAY['กลางห้อง', 'บริเวณกลางห้อง', 'ประตู'], 'กวาดจากมุมห้องมารวมไว้ที่กลางห้อง',
  'ง 1.1 ป.4/1', 'บอกเหตุผลในการทำงาน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'เครื่องมือเกษตร', 'medium', 'L2', 'fillin',
  'เครื่องมือการเกษตรที่ใช้สำหรับขุดหลุมขนาดใหญ่ ดายหญ้า และพรวนดิน คืออะไร? (จอบ หรือ กรรไกรตัดหญ้า)', to_jsonb('จอบ'::text), '{}'::jsonb, ARRAY['จอบ'], 'จอบใช้ขุดหลุมและดายหญ้า',
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานอย่างมีทักษะ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'เครื่องมือเกษตร', 'medium', 'L2', 'fillin',
  'อุปกรณ์รดน้ำที่มีฝักบัวกระจายน้ำเป็นฝอย เหมาะสำหรับรดน้ำต้นกล้าขนาดเล็ก คืออะไร?', to_jsonb('บัวรดน้ำ'::text), '{}'::jsonb, ARRAY['บัวรดน้ำ', 'กาน้ำรดน้ำ'], 'บัวรดน้ำช่วยให้น้ำกระจายตัวนุ่มนวล',
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานอย่างมีทักษะ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'เครื่องมือเกษตร', 'medium', 'L2', 'fillin',
  'เครื่องมือขนาดเล็กใช้สำหรับขุดหลุมปลูกต้นกล้าและขุดย้ายต้นกล้า คือช้อน________', to_jsonb('ปลูก'::text), '{}'::jsonb, ARRAY['ปลูก', 'ช้อนปลูก'], 'ช้อนปลูกใช้ย้ายต้นกล้า',
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานอย่างมีทักษะ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ปุ๋ยและการบำรุงดิน', 'medium', 'L2', 'fillin',
  'ปุ๋ยที่ได้จากมูลสัตว์ เช่น ขี้วัว ขี้ไก่ หรือขี้หมู เรียกว่าปุ๋ยอะไร? (ปุ๋ยคอก หรือ ปุ๋ยเคมี)', to_jsonb('ปุ๋ยคอก'::text), '{}'::jsonb, ARRAY['ปุ๋ยคอก'], 'ปุ๋ยคอกได้จากมูลสัตว์',
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานอย่างมีทักษะ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การคัดแยกขยะและการรีไซเคิล', 'medium', 'L2', 'fillin',
  'การนำขวดน้ำพลาสติกที่ใช้แล้วมาประดิษฐ์เป็นกระถางปลูกผัก จัดเป็นหลักการ 3R ข้อใด? (Reuse หรือ Recycle)', to_jsonb('Reuse'::text), '{}'::jsonb, ARRAY['Reuse', 'reuse', 'การใช้ซ้ำ'], 'Reuse คือการนำกลับมาใช้ซ้ำ',
  'ง 1.1 ป.4/1', 'บอกเหตุผลในการทำงาน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'งานประดิษฐ์', 'medium', 'L2', 'fillin',
  'อุปกรณ์ที่ใช้สำหรับติดกระดาษกับกระดาษในงานประดิษฐ์ขนาดเบา คืออะไร? (กาว หรือ ค้อน)', to_jsonb('กาว'::text), '{}'::jsonb, ARRAY['กาว', 'กาวน้ำ', 'กาวลาเท็กซ์'], 'กาวใช้ยึดติดวัสดุเบา',
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานอย่างมีทักษะ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ความปลอดภัยในการทำงานช่าง', 'medium', 'L2', 'fillin',
  'เมื่อใช้งานมีดหรือคัตเตอร์เสร็จแล้ว ควรทำสิ่งใดกับใบมีดก่อนนำไปเก็บ? (เลื่อนเก็บใบมีด หรือ เปิดค้างไว้)', to_jsonb('เลื่อนเก็บใบมีด'::text), '{}'::jsonb, ARRAY['เลื่อนเก็บใบมีด', 'เก็บใบมีด', 'หดใบมีด'], 'เลื่อนเก็บใบมีดเพื่อความปลอดภัย',
  'ง 1.1 ป.4/2', 'ปฏิบัติตามความปลอดภัย', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การจัดการการเงินครัวเรือน', 'medium', 'L2', 'fillin',
  'สมุดบันทึกรายการเงินที่ได้รับเข้ามาและเงินที่จ่ายออกไปในแต่ละวัน เรียกว่าสมุดบันทึกรายรับ-________', to_jsonb('รายจ่าย'::text), '{}'::jsonb, ARRAY['รายจ่าย', 'รายรับรายจ่าย'], 'บัญชีรายรับ-รายจ่าย',
  'ง 1.1 ป.4/1', 'บอกเหตุผลในการทำงาน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ขั้นตอนวิธีและการเขียนโปรแกรม', 'medium', 'L2', 'fillin',
  'ลำดับขั้นตอนในการแก้ปัญหาหรือการทำงานอย่างชัดเจนเป็นขั้นๆ เรียกว่าอะไร? (Algorithm หรือ Hardware)', to_jsonb('Algorithm'::text), '{}'::jsonb, ARRAY['Algorithm', 'algorithm', 'อัลกอริทึม', 'ขั้นตอนวิธี'], 'Algorithm คือขั้นตอนวิธีในการแก้ปัญหา',
  'ว 4.2 ป.4/1', 'ใช้เหตุผลเชิงตรรกะ', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ขั้นตอนวิธีและการเขียนโปรแกรม', 'medium', 'L2', 'fillin',
  'คำสั่งในโปรแกรมที่สั่งให้ทำงานเดิมซ้ำหลายๆ รอบ เรียกว่าคำสั่งอะไร? (Loop หรือ Bug)', to_jsonb('Loop'::text), '{}'::jsonb, ARRAY['Loop', 'loop', 'การวนซ้ำ', 'ลูป'], 'Loop คือคำสั่งวนซ้ำ',
  'ว 4.2 ป.4/2', 'ออกแบบและเขียนโปรแกรมอย่างง่าย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ขั้นตอนวิธีและการเขียนโปรแกรม', 'medium', 'L2', 'fillin',
  'ข้อผิดพลาดที่เกิดขึ้นในโปรแกรมคอมพิวเตอร์ เรียกว่าอะไร? (Bug หรือ Chip)', to_jsonb('Bug'::text), '{}'::jsonb, ARRAY['Bug', 'bug', 'บั๊ก'], 'Bug คือข้อผิดพลาดในโปรแกรม',
  'ว 4.2 ป.4/2', 'ตรวจหาข้อผิดพลาดและแก้ไข', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ขั้นตอนวิธีและการเขียนโปรแกรม', 'medium', 'L2', 'fillin',
  'การค้นหาและแก้ไขข้อผิดพลาดในโปรแกรมคอมพิวเตอร์ มีชื่อเรียกว่า ดี________ (Debugging)', to_jsonb('บั๊ก'::text), '{}'::jsonb, ARRAY['บั๊ก', 'บัก', 'ดีบั๊ก', 'Debugging', 'debugging'], 'Debugging คือการแก้จุดบกพร่อง',
  'ว 4.2 ป.4/2', 'ตรวจหาข้อผิดพลาดและแก้ไข', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'อุปกรณ์คอมพิวเตอร์', 'medium', 'L2', 'fillin',
  'อุปกรณ์ที่ทำหน้าที่เปรียบเสมือน "สมอง" ของคอมพิวเตอร์ในการคิดคำนวณและประมวลผล คือตัวย่ออะไร? (CPU หรือ RAM)', to_jsonb('CPU'::text), '{}'::jsonb, ARRAY['CPU', 'cpu', 'ซีพียู'], 'CPU คือหน่วยประมวลผลกลาง',
  'ว 4.2 ป.4/3', 'ใช้อินเทอร์เน็ตค้นหาความรู้', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'อุปกรณ์คอมพิวเตอร์', 'medium', 'L2', 'fillin',
  'คีย์บอร์ด (แป้นพิมพ์) และ เมาส์ จัดเป็นอุปกรณ์ประเภทใด? (หน่วยรับเข้า / Input หรือ หน่วยส่งออก / Output)', to_jsonb('หน่วยรับเข้า'::text), '{}'::jsonb, ARRAY['หน่วยรับเข้า', 'Input', 'input', 'หน่วยนำเข้า'], 'คีย์บอร์ดและเมาส์เป็นหน่วยรับเข้า (Input)',
  'ว 4.2 ป.4/3', 'ใช้อินเทอร์เน็ตค้นหาความรู้', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'อุปกรณ์คอมพิวเตอร์', 'medium', 'L2', 'fillin',
  'จอภาพ (Monitor) และ เครื่องพิมพ์ (Printer) จัดเป็นอุปกรณ์ประเภทใด? (หน่วยรับเข้า / Input หรือ หน่วยส่งออก / Output)', to_jsonb('หน่วยส่งออก'::text), '{}'::jsonb, ARRAY['หน่วยส่งออก', 'Output', 'output'], 'จอภาพและเครื่องพิมพ์เป็นหน่วยส่งออก (Output)',
  'ว 4.2 ป.4/3', 'ใช้อินเทอร์เน็ตค้นหาความรู้', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ความปลอดภัยทางดิจิทัล', 'medium', 'L2', 'fillin',
  'รหัสลับส่วนตัวที่ใช้ในการเข้าสู่ระบบบัญชีผู้ใช้หรืออีเมล เรียกว่าอะไร? (Password หรือ Username)', to_jsonb('Password'::text), '{}'::jsonb, ARRAY['Password', 'password', 'รหัสผ่าน'], 'Password หรือรหัสผ่าน',
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีอย่างปลอดภัย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ความปลอดภัยทางดิจิทัล', 'medium', 'L2', 'fillin',
  'การรังแก ข่มขู่ หรือล้อเลียนผู้อื่นบนโลกอินเทอร์เน็ตและโซเชียลมีเดีย เรียกว่า Cyber________ (Cyberbullying)', to_jsonb('bullying'::text), '{}'::jsonb, ARRAY['bullying', 'Bullying', 'บูลลี่', 'บูลลิ่ง', 'Cyberbullying'], 'Cyberbullying คือการกลั่นแกล้งบนไซเบอร์',
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีอย่างปลอดภัย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ความปลอดภัยทางดิจิทัล', 'medium', 'L2', 'fillin',
  'ข้อมูลใดต่อไปนี้เป็นข้อมูลส่วนตัวที่ไม่ควรเปิดเผยแก่คนแปลกหน้าบนอินเทอร์เน็ต? (รหัสผ่านบัตรประชาชน หรือ ชื่อเล่นการ์ตูน)', to_jsonb('รหัสผ่านบัตรประชาชน'::text), '{}'::jsonb, ARRAY['รหัสผ่านบัตรประชาชน', 'รหัสผ่าน', 'เลขบัตรประชาชน', 'ข้อมูลส่วนตัว'], 'รหัสผ่านและเลขบัตรประชาชนเป็นข้อมูลส่วนตัว',
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีอย่างปลอดภัย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาการบวก ลบ คูณระคน', 'easy', 'L2', 'essay',
  'สหกรณ์โรงเรียนบ้านคำไผ่ มีสมุด 25 โหล (1 โหล = 12 เล่ม) ขายให้นักเรียนไปแล้ว 180 เล่ม จงแสดงวิธีทำเพื่อหาว่า สหกรณ์โรงเรียนเหลือสมุดกี่เล่ม?', to_jsonb('วิธีทำ:
1) หาจำนวนสมุดทั้งหมด: 25 × 12 = 300 เล่ม
2) ขายให้นักเรียนไป: 180 เล่ม
3) เหลือสมุด: 300 - 180 = 120 เล่ม
ตอบ เหลือสมุดทั้งหมด ๑๒๐ เล่ม'::text), '{"full_score":5,"key_solution":"วิธีทำ: 25 × 12 = 300 เล่ม, 300 - 180 = 120 เล่ม","criteria":[{"name":"ขั้นตอนการคำนวณ","points":2.5,"description":"แสดงวิธีหาผลคูณและผลลบถูกต้อง"},{"name":"คำตอบและหน่วย","points":1.5,"description":"คำตอบ 120 เล่ม"},{"name":"ความเป็นระเบียบ","points":1,"description":"แสดงวิธีทำเข้าใจง่าย"}],"keywords":["25","12","300","180","120","เล่ม"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาการซื้อขายเงินทอน', 'easy', 'L2', 'essay',
  'มานีมีเงิน 500 บาท นำไปซื้อกล่องดินสอราคา 85 บาท และซื้อหนังสือนิทาน 3 เล่ม ราคาเล่มละ 65 บาท จงแสดงวิธีทำเพื่อหาว่า มานีจะเหลือเงินกี่บาท?', to_jsonb('วิธีทำ:
1) ราคาหนังสือนิทาน 3 เล่ม: 3 × 65 = 195 บาท
2) รวมเงินที่ซื้อของ: 85 + 195 = 280 บาท
3) เงินคงเหลือ: 500 - 280 = 220 บาท
ตอบ มานีจะเหลือเงิน ๒๒๐ บาท'::text), '{"full_score":5,"key_solution":"3 × 65 = 195, 85 + 195 = 280, 500 - 280 = 220 บาท","criteria":[{"name":"ขั้นตอนการคำนวณราคาสินค้า","points":2.5,"description":"คำนวณราคาและผลรวมถูกต้อง"},{"name":"คำนวณเงินทอน","points":1.5,"description":"500 - 280 = 220 บาท"},{"name":"การสรุปคำตอบ","points":1,"description":"ระบุหน่วยเป็นบาท"}],"keywords":["500","85","195","280","220","บาท"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาพื้นที่รูปสี่เหลี่ยมมุมฉาก', 'easy', 'L2', 'essay',
  'แปลงผักสวนครัวรูปสี่เหลี่ยมผืนผ้าของโรงเรียนบ้านคำไผ่ กว้าง 4 เมตร และยาว 9 เมตร คุณครูต้องการล้อมรั้วรอบแปลงผักและใส่ปุ๋ยเต็มพื้นที่ จงแสดงวิธีหา 1) ความยาวรอบแปลงผัก และ 2) พื้นที่ของแปลงผักทั้งหมด', to_jsonb('วิธีทำ:
1) ความยาวรอบแปลงผัก = 2 × (4 + 9) = 2 × 13 = 26 เมตร
2) พื้นที่ของแปลงผัก = 4 × 9 = 36 ตารางเมตร
ตอบ 1) ความยาวรอบรูป ๒๖ เมตร 2) พื้นที่ ๓๖ ตารางเมตร'::text), '{"full_score":5,"key_solution":"ความยาวรอบรูป 26 เมตร, พื้นที่ 36 ตารางเมตร","criteria":[{"name":"หาความยาวรอบรูป","points":2,"description":"คำนวณ 2 × (4 + 9) = 26 เมตร"},{"name":"หาพื้นที่","points":2,"description":"คำนวณ 4 × 9 = 36 ตารางเมตร"},{"name":"ระบุหน่วยถูกต้อง","points":1,"description":"ระบุเมตรและตารางเมตร"}],"keywords":["26","36","เมตร","ตารางเมตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบเกี่ยวกับความยาวรอบรูปและพื้นที่', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาเศษส่วน', 'easy', 'L2', 'essay',
  'เชือกเส้นหนึ่งยาว 8/10 เมตร ช่างตัดไปใช้ผูกกล่องพัสดุ 3/10 เมตร และใช้ผูกต้นไม้ 2/10 เมตร จงแสดงวิธีทำเพื่อหาว่า เชือกเส้นนี้เหลือความยาวกี่เมตร?', to_jsonb('วิธีทำ:
1) เชือกที่ใช้ไปทั้งหมด = 3/10 + 2/10 = 5/10 เมตร
2) เชือกที่เหลือ = 8/10 - 5/10 = 3/10 เมตร
ตอบ เชือกเหลือความยาว ๓/๑๐ เมตร'::text), '{"full_score":5,"key_solution":"8/10 - (3/10 + 2/10) = 3/10 เมตร","criteria":[{"name":"ขั้นตอนคำนวณ","points":2.5,"description":"บวกเศษส่วนที่ใช้และนำไปลบ"},{"name":"คำตอบถูกต้อง","points":1.5,"description":"ได้ผลลัพธ์ 3/10 เมตร"},{"name":"แสดงวิธีทำและหน่วย","points":1,"description":"เขียนหน่วยเมตรชัดเจน"}],"keywords":["8/10","3/10","2/10","5/10","เมตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/14', 'แสดงวิธีหาคำตอบการบวก ลบเศษส่วน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาการหารและการแบ่งเท่ากัน', 'easy', 'L2', 'essay',
  'คุณครูมีดินสอสี 360 แท่ง นำมาจัดใส่กล่อง กล่องละ 12 แท่งเท่าๆ กัน จากนั้นนำไปแจกให้นักเรียน 6 ห้อง ห้องละเท่าๆ กัน แต่ละห้องจะได้ดินสอสีกี่กล่อง? จงแสดงวิธีทำ', to_jsonb('วิธีทำ:
1) จำนวนกล่องทั้งหมด: 360 ÷ 12 = 30 กล่อง
2) แจก 6 ห้อง: 30 ÷ 6 = 5 กล่อง
ตอบ แต่ละห้องจะได้รับดินสอสี ๕ กล่อง'::text), '{"full_score":5,"key_solution":"360 ÷ 12 = 30 กล่อง, 30 ÷ 6 = 5 กล่อง","criteria":[{"name":"หาจำนวนกล่อง","points":2,"description":"360 ÷ 12 = 30"},{"name":"แบ่งรายห้อง","points":2,"description":"30 ÷ 6 = 5"},{"name":"สรุปคำตอบ","points":1,"description":"ตอบ 5 กล่อง"}],"keywords":["360","12","30","6","5","กล่อง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาเวลาและระยะเวลา', 'easy', 'L2', 'essay',
  'การแข่งขันกีฬาสีของโรงเรียนบ้านคำไผ่ เริ่มต้นเวลา 08:30 น. และสิ้นสุดการแข่งขันเวลา 11:45 น. จงแสดงวิธีคิดเพื่อหาว่า การแข่งขันกีฬาสีใช้เวลาทั้งหมดกี่ชั่วโมงและกี่นาที?', to_jsonb('วิธีคิด:
จากเวลา 08:30 น. ถึง 11:30 น. = 3 ชั่วโมง
จากเวลา 11:30 น. ถึง 11:45 น. = 15 นาที
รวมเวลาทั้งหมด = 3 ชั่วโมง 15 นาที
ตอบ ใช้เวลาแข่งขันทั้งหมด ๓ ชั่วโมง ๑๕ นาที'::text), '{"full_score":5,"key_solution":"ใช้เวลาแข่งขัน 3 ชั่วโมง 15 นาที","criteria":[{"name":"นับชั่วโมง","points":2,"description":"08:30 ถึง 11:30 ได้ 3 ชั่วโมง"},{"name":"นับนาที","points":2,"description":"11:30 ถึง 11:45 ได้ 15 นาที"},{"name":"สรุปคำตอบ","points":1,"description":"ตอบ 3 ชั่วโมง 15 นาที"}],"keywords":["08:30","11:45","3 ชั่วโมง","15 นาที"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 2.1 ป.4/1', 'แสดงวิธีหาคำตอบเกี่ยวกับเวลา', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'การหาค่าเฉลี่ยอย่างง่าย', 'easy', 'L2', 'essay',
  'ในการทดสอบคณิตศาสตร์ 4 ครั้ง สมนึกสอบได้คะแนน 18, 16, 20 และ 14 คะแนนตามลำดับ จงแสดงวิธีทำเพื่อหาคะแนนเฉลี่ยของสมนึก', to_jsonb('วิธีทำ:
1) รวมคะแนน 4 ครั้ง = 18 + 16 + 20 + 14 = 68 คะแนน
2) คะแนนเฉลี่ย = 68 ÷ 4 = 17 คะแนน
ตอบ สมนึกได้คะแนนเฉลี่ย ๑๗ คะแนน'::text), '{"full_score":5,"key_solution":"รวม 68 คะแนน, เฉลี่ย 17 คะแนน","criteria":[{"name":"หาผลรวม","points":2,"description":"18+16+20+14 = 68"},{"name":"หาค่าเฉลี่ย","points":2,"description":"68 ÷ 4 = 17"},{"name":"สรุปคำตอบ","points":1,"description":"ตอบ 17 คะแนน"}],"keywords":["18","16","20","14","68","4","17","คะแนน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาการคูณและการประหยัด', 'easy', 'L2', 'essay',
  'ก้อยหยอดเงินใส่กระปุกออมสินทุกวัน วันละ 15 บาท เป็นเวลา 30 วัน เมื่อครบกำหนด ก้อยนำเงินไปซื้อของขวัญให้คุณแม่ราคา 320 บาท จงแสดงวิธีทำเพื่อหาว่า ก้อยจะเหลือเงินออมกี่บาท?', to_jsonb('วิธีทำ:
1) หาเงินออมทั้งหมด: 15 × 30 = 450 บาท
2) ซื้อของขวัญให้คุณแม่: 320 บาท
3) เงินคงเหลือ: 450 - 320 = 130 บาท
ตอบ ก้อยจะเหลือเงินออม ๑๓๐ บาท'::text), '{"full_score":5,"key_solution":"ออม 450 บาท, เหลือ 130 บาท","criteria":[{"name":"หาเงินออมรวม","points":2,"description":"15 × 30 = 450 บาท"},{"name":"หาเงินคงเหลือ","points":2,"description":"450 - 320 = 130 บาท"},{"name":"สรุปคำตอบ","points":1,"description":"ตอบ 130 บาท"}],"keywords":["15","30","450","320","130","บาท"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาน้ำหนักและการชั่ง', 'easy', 'L2', 'essay',
  'แม่ค้าซื้อข้าวสารมา 3 กระสอบ หนักกระสอบละ 50 กิโลกรัม นำมาแบ่งใส่ถุง ถุงละ 5 กิโลกรัม จะแบ่งข้าวสารได้ทั้งหมดกี่ถุง? จงแสดงวิธีทำ', to_jsonb('วิธีทำ:
1) น้ำหนักข้าวสารทั้งหมด = 3 × 50 = 150 กิโลกรัม
2) แบ่งใส่ถุง ถุงละ 5 กก. = 150 ÷ 5 = 30 ถุง
ตอบ จะแบ่งข้าวสารได้ทั้งหมด ๓๐ ถุง'::text), '{"full_score":5,"key_solution":"ข้าวสาร 150 กก., แบ่งได้ 30 ถุง","criteria":[{"name":"หาน้ำหนักรวม","points":2,"description":"3 × 50 = 150 กก."},{"name":"หาจำนวนถุง","points":2,"description":"150 ÷ 5 = 30 ถุง"},{"name":"สรุปคำตอบ","points":1,"description":"ตอบ 30 ถุง"}],"keywords":["3","50","150","5","30","กิโลกรัม","ถุง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/11', 'แสดงวิธีหาคำตอบของโจทย์ปัญหา 2 ขั้นตอน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาปริมาตรและความจุ', 'easy', 'L2', 'essay',
  'ถังน้ำใบหนึ่งมีความจุ 20 ลิตร มีน้ำอยู่เดิม 8 ลิตร 500 มิลลิลิตร ถ้าต้องการเติมน้ำให้เต็มถังพอดี จะต้องเติมน้ำเพิ่มอีกเท่าใด? จงแสดงวิธีทำ', to_jsonb('วิธีทำ:
20 ลิตร = 19 ลิตร 1,000 มิลลิลิตร
มีน้ำอยู่ 8 ลิตร 500 มิลลิลิตร
ต้องเติมน้ำเพิ่ม: 19 ลิตร - 8 ลิตร = 11 ลิตร, 1,000 มล. - 500 มล. = 500 มล.
ตอบ ต้องเติมน้ำเพิ่มอีก ๑๑ ลิตร ๕๐๐ มิลลิลิตร'::text), '{"full_score":5,"key_solution":"เติมน้ำเพิ่ม 11 ลิตร 500 มิลลิลิตร","criteria":[{"name":"แปลงหน่วยและตั้งลบ","points":2.5,"description":"กระจาย 20 ลิตรเป็น 19 ลิตร 1000 มล."},{"name":"คำนวณผลต่าง","points":1.5,"description":"ได้ 11 ลิตร 500 มล."},{"name":"สรุปหน่วย","points":1,"description":"เขียนหน่วยลิตรและมิลลิลิตร"}],"keywords":["20 ลิตร","8 ลิตร","500 มิลลิลิตร","11 ลิตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 2.1 ป.4/1', 'แสดงวิธีหาคำตอบเกี่ยวกับปริมาตรและความจุ', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาเศษส่วนและการแบ่งของ', 'easy', 'L2', 'essay',
  'เค้กวันเกิด 1 ก้อน แบ่งเป็น 8 ชิ้นเท่าๆ กัน พ่อรับประทานไป 2 ชิ้น แม่รับประทานไป 1 ชิ้น และน้องรับประทานไป 3 ชิ้น จงแสดงวิธีทำเพื่อหาว่า 1) เค้กที่รับประทานไปแล้วคิดเป็นเศษส่วนเท่าใด 2) ยังเหลือเค้กอีกกี่ชิ้นและคิดเป็นเศษส่วนเท่าใด?', to_jsonb('วิธีทำ:
1) รับประทานไปแล้ว = 2 + 1 + 3 = 6 ชิ้น คิดเป็น 6/8 ก้อน (หรือ 3/4 ก้อน)
2) เค้กที่เหลือ = 8 - 6 = 2 ชิ้น คิดเป็น 2/8 ก้อน (หรือ 1/4 ก้อน)
ตอบ 1) รับประทานไปแล้ว ๖/๘ ก้อน 2) เหลือเค้ก ๒ ชิ้น (๒/๘ ก้อน)'::text), '{"full_score":5,"key_solution":"กินไป 6/8 ก้อน, เหลือ 2 ชิ้น (2/8 ก้อน)","criteria":[{"name":"หาเศษส่วนที่กินไป","points":2,"description":"รวม 6 ชิ้น คิดเป็น 6/8 ก้อน"},{"name":"หาเศษส่วนที่เหลือ","points":2,"description":"เหลือ 2 ชิ้น คิดเป็น 2/8 ก้อน"},{"name":"สรุปชัดเจน","points":1,"description":"ตอบครบทั้งสองข้อ"}],"keywords":["6/8","2/8","2 ชิ้น","เศษส่วน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 1.1 ป.4/14', 'แสดงวิธีหาคำตอบการบวก ลบเศษส่วน', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'คณิตศาสตร์', 'ป.4', 'โจทย์ปัญหาเรขาคณิตความยาวรอบรูป', 'easy', 'L2', 'essay',
  'สนามหญ้ารูปสี่เหลี่ยมจัตุรัสมีความยาวด้านละ 15 เมตร ถ้าคุณครูให้นักเรียนวิ่งรอบสนามหญ้านี้จำนวน 3 รอบ นักเรียนจะได้ระยะทางวิ่งทั้งหมดกี่เมตร? จงแสดงวิธีทำ', to_jsonb('วิธีทำ:
1) ความยาวรอบสนาม 1 รอบ = 4 × 15 = 60 เมตร
2) วิ่ง 3 รอบ = 3 × 60 = 180 เมตร
ตอบ นักเรียนจะได้ระยะทางวิ่งทั้งหมด ๑๘๐ เมตร'::text), '{"full_score":5,"key_solution":"รอบรูป 60 เมตร, วิ่ง 3 รอบ = 180 เมตร","criteria":[{"name":"หารอบรูป 1 รอบ","points":2,"description":"4 × 15 = 60 เมตร"},{"name":"คูณ 3 รอบ","points":2,"description":"60 × 3 = 180 เมตร"},{"name":"ระบุหน่วย","points":1,"description":"ระบุหน่วยเป็นเมตร"}],"keywords":["15","4","60","3","180","เมตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ค 2.1 ป.4/3', 'แสดงวิธีหาคำตอบเกี่ยวกับความยาวรอบรูปและพื้นที่', '45046f41-4f71-48ac-979d-8e3e4fbebc13'::uuid, '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', '/games/math/geometry-3d-media-cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'หน้าที่ของส่วนต่างๆ ของพืช', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายหน้าที่สำคัญของ "ราก" และ "ใบ" ของพืชดอก พร้อมยกตัวอย่างประโยชน์ที่พืชได้รับจากแต่ละส่วน (เขียน 3-4 บรรทัด)', to_jsonb('คำตอบ:
1) ราก: ทำหน้าที่ยึดลำต้นให้อยู่กับดิน และดูดน้ำ แร่ธาตุจากดินไปเลี้ยงส่วนต่างๆ ของพืช
2) ใบ: ทำหน้าที่สร้างอาหารด้วยกระบวนการสังเคราะห์ด้วยแสง โดยอาศัยคลอโรฟิลล์ แสงแดด ก๊าซคาร์บอนไดออกไซด์ และน้ำ รวมทั้งทำหน้าที่หายใจและคายน้ำ'::text), '{"full_score":5,"key_solution":"อธิบายหน้าที่ของรากและใบครบถ้วน","criteria":[{"name":"หน้าที่ของราก","points":2,"description":"ระบุการยึดลำต้นและดูดน้ำแร่ธาตุ"},{"name":"หน้าที่ของใบ","points":2,"description":"ระบุการสังเคราะห์ด้วยแสงและการคายน้ำ"},{"name":"การใช้ภาษา","points":1,"description":"เรียบเรียงชัดเจนเข้าใจง่าย"}],"keywords":["ราก","ใบ","ดูดน้ำ","สังเคราะห์ด้วยแสง","คลอโรฟิลล์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 1.2 ป.4/1', 'บรรยายหน้าที่ของราก ลำต้น ใบ และดอก', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การจำแนกสัตว์มีกระดูกสันหลัง', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกความแตกต่างระหว่าง "สัตว์สะเทินน้ำสะเทินบก" กับ "สัตว์เลื้อยคลาน" ในด้านลักษณะผิวหนังและการวางไข่ พร้อมยกตัวอย่างสัตว์กลุ่มละ 1 ชนิด', to_jsonb('คำตอบ:
1) สัตว์สะเทินน้ำสะเทินบก: ผิวหนังเปียกชื้น ไม่มีเกล็ด วางไข่ในน้ำมีวุ้นหุ้ม เช่น กบ, คางคก
2) สัตว์เลื้อยคลาน: ผิวหนังแห้ง มีเกล็ดแข็งปกคลุม วางไข่บนบกมีเปลือกแข็งหรือเปลือกเหนียวหุ้ม เช่น จระเข้, เต่า'::text), '{"full_score":5,"key_solution":"เปรียบเทียบผิวหนัง การวางไข่ และตัวอย่างสัตว์","criteria":[{"name":"ลักษณะผิวหนัง","points":2,"description":"ระบุผิวชื้นไร้เกล็ด vs ผิวแห้งมีเกล็ด"},{"name":"การวางไข่และตัวอย่าง","points":2,"description":"ไข่ในน้ำมีวุ้น vs ไข่บนบกมีเปลือก พร้อมตัวอย่าง"},{"name":"ความถูกต้องทางวิทยาศาสตร์","points":1,"description":"ถูกต้องตามหลักอนุกรมวิธาน"}],"keywords":["ผิวหนัง","เกล็ด","วางไข่","กบ","เต่า"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 1.3 ป.4/2', 'จำแนกสัตว์ออกเป็นสัตว์มีกระดูกสันหลังและไม่มีกระดูกสันหลัง', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'สมบัติของสสาร 3 สถานะ', 'easy', 'L2', 'essay',
  'ให้นักเรียนเปรียบเทียบสมบัติด้าน "รูปร่าง" และ "ปริมาตร" ของสสารทั้ง 3 สถานะ ได้แก่ ของแข็ง ของเหลว และแก๊ส โดยสรุปให้ชัดเจน', to_jsonb('คำตอบ:
1) ของแข็ง: รูปร่างคงที่ ปริมาตรคงที่ ไม่เปลี่ยนตามภาชนะ (เช่น ก้อนหิน)
2) ของเหลว: รูปร่างเปลี่ยนตามภาชนะที่บรรจุ แต่ปริมาตรคงที่ (เช่น น้ำดื่ม)
3) แก๊ส: รูปร่างและปริมาตรไม่คงที่ เปลี่ยนแปลงฟุ้งกระจายตามภาชนะที่บรรจุ (เช่น อากาศ)'::text), '{"full_score":5,"key_solution":"เปรียบเทียบรูปร่างและปริมาตรครบ 3 สถานะ","criteria":[{"name":"ของแข็งและของเหลว","points":2.5,"description":"ระบุสมบัติของแข็งและของเหลวถูกต้อง"},{"name":"แก๊สและตัวอย่าง","points":1.5,"description":"ระบุสมบัติแก๊สถูกต้อง"},{"name":"การจัดระบบข้อความ","points":1,"description":"เขียนเป็นข้อๆ ชัดเจน"}],"keywords":["ของแข็ง","ของเหลว","แก๊ส","รูปร่าง","ปริมาตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.1 ป.4/3', 'เปรียบเทียบสมบัติของสสารทั้ง 3 สถานะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงโน้มถ่วงของโลก', 'easy', 'L2', 'essay',
  'เมื่อเราปล่อยลูกบอลจากที่สูง ทำไมลูกบอลจึงตกลงสู่พื้นดินเสมอ และหากโลกนี้ไม่มีแรงโน้มถ่วง จะส่งผลต่อการใช้ชีวิตของมนุษย์อย่างไร? จงอธิบาย', to_jsonb('คำตอบ:
ลูกบอลตกลงสู่พื้นดินเพราะมี "แรงโน้มถ่วงของโลก" หรือแรงดึงดูดของโลกดึงดูดวัตถุเข้าสู่จุดศูนย์กลางโลก
หากโลกไม่มีแรงโน้มถ่วง สิ่งของ มนุษย์ และน้ำในมหาสมุทรจะลอยเคว้งคว้างในอากาศ ไม่สามารถตั้งสิ่งของหรือเดินบนพื้นได้ตามปกติ'::text), '{"full_score":5,"key_solution":"อธิบายแรงโน้มถ่วงและผลเมื่อไม่มีแรงโน้มถ่วง","criteria":[{"name":"สาเหตุที่ลูกบอลตก","points":2,"description":"ระบุแรงโน้มถ่วง/แรงดึงดูดของโลก"},{"name":"ผลกระทบเมื่อไร้แรงโน้มถ่วง","points":2,"description":"ระบุวัตถุและคนลอยเคว้งคว้าง"},{"name":"การอธิบายเหตุผล","points":1,"description":"เชื่อมโยงความคิดสมเหตุสมผล"}],"keywords":["แรงโน้มถ่วง","ศูนย์กลางโลก","ลอย","พื้นดิน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.2 ป.4/1', 'ระบุผลของแรงโน้มถ่วงที่มีต่อวัตถุ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ตัวกลางของแสงและการเกิดเงา', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายความแตกต่างระหว่าง "ตัวกลางโปร่งใส" "ตัวกลางโปร่งแสง" และ "วัตถุทึบแสง" พร้อมยกตัวอย่างสิ่งของรอบตัวอย่างละ 1 ชนิด', to_jsonb('คำตอบ:
1) ตัวกลางโปร่งใส: แสงผ่านได้หมด มองเห็นสิ่งข้างหลังได้ชัดเจน เช่น กระจกใส, น้ำสะอาด
2) ตัวกลางโปร่งแสง: แสงผ่านได้บางส่วน มองเห็นสิ่งข้างหลังได้ไม่ชัดเจน เช่น กระดาษไข, กระจกฝ้า
3) วัตถุทึบแสง: แสงผ่านไม่ได้เลย เกิดเงาดำด้านหลัง เช่น แผ่นไม้, ก้อนอิฐ'::text), '{"full_score":5,"key_solution":"อธิบายตัวกลาง 3 แบบพร้อมยกตัวอย่าง","criteria":[{"name":"ตัวกลางโปร่งใสและโปร่งแสง","points":2,"description":"บอกความต่างของการผ่านของแสงถูกต้อง"},{"name":"วัตถุทึบแสงและเงา","points":2,"description":"ระบุแสงผ่านไม่ได้เกิดเงา"},{"name":"ตัวอย่างสิ่งของ","points":1,"description":"ยกตัวอย่างถูกต้องทั้ง 3 ชนิด"}],"keywords":["โปร่งใส","โปร่งแสง","ทึบแสง","แสงผ่าน","เงา"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.3 ป.4/1', 'จำแนกวัตถุเป็นตัวกลางโปร่งใส โปร่งแสง และทึบแสง', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ระบบสุริยะและดาวเคราะห์', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกชื่อศูนย์กลางของระบบสุริยะ และบอกลักษณะเด่นของโลกของเราที่แตกต่างจากดาวเคราะห์ดวงอื่นที่ทำให้สิ่งมีชีวิตอาศัยอยู่ได้', to_jsonb('คำตอบ:
ศูนย์กลางของระบบสุริยะคือ "ดวงอาทิตย์"
ลักษณะเด่นของโลกที่ทำให้สิ่งมีชีวิตอยู่ได้ คือ โลกอยู่ในระยะห่างที่พอเหมาะจากดวงอาทิตย์ มีอุณหภูมิอบอุ่นพอเหมาะ มีน้ำในรูปของเหลว มีชั้นบรรยากาศที่มีก๊าซออกซิเจนสำหรับหายใจ และมีก๊าซช่วยป้องกันรังสีอันตราย'::text), '{"full_score":5,"key_solution":"ระบุดวงอาทิตย์และปัจจัยที่เอื้อต่อสิ่งมีชีวิตบนโลก","criteria":[{"name":"ศูนย์กลางระบบสุริยะ","points":1.5,"description":"ระบุดวงอาทิตย์"},{"name":"ปัจจัยเอื้อต่อชีวิต","points":2.5,"description":"ระบุน้ำ อุณหภูมิ ออกซิเจน บรรยากาศ"},{"name":"การเรียบเรียง","points":1,"description":"เขียนเป็นลำดับเข้าใจง่าย"}],"keywords":["ดวงอาทิตย์","โลก","น้ำ","ออกซิเจน","สิ่งมีชีวิต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 3.1 ป.4/3', 'สร้างแบบจำลองแสดงองค์ประกอบของระบบสุริยะ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การเกิดกลางวันและกลางคืน', 'easy', 'L2', 'essay',
  'ปรากฏการณ์กลางวันและกลางคืนเกิดขึ้นได้อย่างไร และถ้าโลกหยุดหมุนรอบตัวเองจะเกิดอะไรขึ้นกับสิ่งมีชีวิตบนโลก? จงอธิบาย', to_jsonb('คำตอบ:
กลางวันกลางคืนเกิดขึ้นจากการที่ "โลกหมุนรอบตัวเอง" 1 รอบ ใช้เวลา 24 ชั่วโมง ด้านที่หันรับแสงจากดวงอาทิตย์จะเป็นเวลากลางวัน ด้านที่อยู่ตรงข้ามไม่ได้รับแสงจะเป็นเวลากลางคืน
ถ้าโลกหยุดหมุน ด้านหนึ่งจะร้อนจัดเป็นกลางวันตลอดกาล และอีกด้านจะหนาวจัดมืดมิดเป็นกลางคืนตลอดกาล สิ่งมีชีวิตจะไม่สามารถดำรงชีวิตอยู่ได้'::text), '{"full_score":5,"key_solution":"อธิบายการหมุนของโลกและผลกระทบเมื่อโลกหยุดหมุน","criteria":[{"name":"กลไกกลางวันกลางคืน","points":2.5,"description":"อธิบายการหมุนของโลกและแสงดวงอาทิตย์"},{"name":"ผลเมื่อโลกหยุดหมุน","points":1.5,"description":"ด้านหนึ่งร้อนจัด อีกด้านหนาวจัด"},{"name":"การให้เหตุผล","points":1,"description":"แสดงความเข้าใจเชิงวิทยาศาสตร์"}],"keywords":["โลกหมุนรอบตัวเอง","24 ชั่วโมง","ดวงอาทิตย์","กลางวัน","กลางคืน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 3.1 ป.4/1', 'อธิบายแบบรูปเส้นทางการขึ้นและตกของดวงจันทร์และดวงอาทิตย์', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'ห่วงโซ่อาหารและสิ่งแวดล้อม', 'easy', 'L2', 'essay',
  'ในแปลงผักของโรงเรียนบ้านคำไผ่ มีต้นผัก หนอน นกกระจอก และแมว ให้นักเรียน 1) เขียนแผนภาพห่วงโซ่อาหาร 2) ระบุว่าสิ่งมีชีวิตใดเป็น "ผู้ผลิต" และสิ่งมีชีวิตใดเป็น "ผู้บริโภคอันดับสูงสุด"', to_jsonb('คำตอบ:
1) ห่วงโซ่อาหาร: ต้นผัก -> หนอน -> นกกระจอก -> แมว (ลูกศรชี้ไปทางผู้กิน)
2) ผู้ผลิต คือ "ต้นผัก" (เพราะสามารถสังเคราะห์ด้วยแสงสร้างอาหารเองได้)
3) ผู้บริโภคอันดับสูงสุด คือ "แมว" (ผู้ล่าในห่วงโซ่นี้)'::text), '{"full_score":5,"key_solution":"เขียนห่วงโซ่อาหาร ระบุผู้ผลิตและผู้บริโภคสูงสุด","criteria":[{"name":"การเขียนห่วงโซ่อาหาร","points":2,"description":"เขียนลำดับผัก->หนอน->นก->แมว พร้อมทิศทางลูกศร"},{"name":"ระบุผู้ผลิต","points":1.5,"description":"ระบุต้นผักพร้อมเหตุผลสร้างอาหารเองได้"},{"name":"ระบุผู้บริโภคสูงสุด","points":1.5,"description":"ระบุแมวถูกต้อง"}],"keywords":["ต้นผัก","หนอน","นกกระจอก","แมว","ผู้ผลิต","ห่วงโซ่อาหาร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 1.2 ป.4/1', 'บรรยายความสัมพันธ์ของสิ่งมีชีวิต', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'แรงเสียดทานในชีวิตประจำวัน', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกประโยชน์ของ "แรงเสียดทาน" ในชีวิตประจำวันมา 2 ข้อ และบอกวิธีลดแรงเสียดทานที่ทำให้เครื่องจักรหรือสิ่งของเคลื่อนที่ได้สะดวกขึ้น 1 วิธี', to_jsonb('คำตอบ:
ประโยชน์ของแรงเสียดทาน:
1) ลวดลายดอกยางของรองเท้าและยางรถยนต์ ช่วยยึดเกาะถนนทำให้ไม่ลื่นล้มและเบรกรถได้ปลอดภัย
2) ช่วยให้เราจับถือสิ่งของ เช่น ดินสอหรือแก้วน้ำ ได้โดยไม่ลื่นหลุดมือ
วิธีลดแรงเสียดทาน: การหยอดน้ำมันหล่อลื่น หรือการใช้ตลับลูกปืนในล้อรถจักรยาน'::text), '{"full_score":5,"key_solution":"ประโยชน์แรงเสียดทาน 2 ข้อ และวิธีลดแรงเสียดทาน 1 วิธี","criteria":[{"name":"ประโยชน์ 2 ข้อ","points":2.5,"description":"บอกประโยชน์ยางรถ/การเดิน/การจับสิ่งของ"},{"name":"วิธีลดแรงเสียดทาน","points":1.5,"description":"บอกการใช้น้ำมันหล่อลื่นหรือลูกปืน"},{"name":"ความชัดเจน","points":1,"description":"ยกตัวอย่างในชีวิตจริงได้ดี"}],"keywords":["แรงเสียดทาน","ดอกยาง","ยึดเกาะ","น้ำมันหล่อลื่น","ลื่น"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.2 ป.4/1', 'ระบุผลของแรงโน้มถ่วงและแรงเสียดทาน', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การนำความร้อนของวัสดุ', 'easy', 'L2', 'essay',
  'กระทะปรุงอาหารมักทำตัวกระทะด้วยโลหะ (เช่น อะลูมิเนียมหรือเหล็ก) แต่ทำด้ามจับด้วยพลาสติกหรือไม้ จงอธิบายเหตุผลทางวิทยาศาสตร์ว่าทำไมจึงต้องเลือกใช้วัสดุที่แตกต่างกันเช่นนี้', to_jsonb('คำตอบ:
1) ตัวกระทะทำด้วยโลหะเพราะโลหะเป็น "ตัวนำความร้อนที่ดี" สามารถถ่ายเทความร้อนจากเตาไฟไปสู่อาหารได้อย่างรวดเร็วทำให้อาหารสุกทั่วถึง
2) ด้ามจับทำด้วยพลาสติกหรือไม้เพราะเป็น "ฉนวนความร้อน" (นำความร้อนได้ไม่ดี) ช่วยป้องกันไม่ให้ความร้อนถ่ายเทมาถึงมือของผู้ปรุงอาหาร ทำให้หยิบจับกระทะได้โดยไม่ร้อนลวกมือ'::text), '{"full_score":5,"key_solution":"อธิบายตัวนำความร้อนและฉนวนความร้อน","criteria":[{"name":"ตัวกระทะ (ตัวนำความร้อน)","points":2,"description":"ระบุโลหะนำความร้อนได้ดีทำให้อาหารสุก"},{"name":"ด้ามจับ (ฉนวนความร้อน)","points":2,"description":"ระบุไม้/พลาสติกเป็นฉนวนป้องกันความร้อนลวกมือ"},{"name":"ความเชื่อมโยงเหตุผล","points":1,"description":"อธิบายได้ถูกต้องตามหลักฟิสิกส์"}],"keywords":["ตัวนำความร้อน","ฉนวนความร้อน","โลหะ","พลาสติก","ความร้อน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.1 ป.4/1', 'เปรียบเทียบสมบัติทางกายภาพด้านการนำความร้อนของวัสดุ', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'วัฏจักรชีวิตของสัตว์', 'easy', 'L2', 'essay',
  'ให้นักเรียนเปรียบเทียบวัฏจักรชีวิตของ "ผีเสื้อ" ซึ่งมีการเปลี่ยนแปลงรูปร่าง 4 ระยะ กับวัฏจักรชีวิตของ "ไก่" ที่ไม่มีการเปลี่ยนแปลงรูปร่าง', to_jsonb('คำตอบ:
1) ผีเสื้อ มีการเปลี่ยนแปลงรูปร่าง 4 ระยะ ได้แก่ ไข่ -> หนอน (ตัวอ่อน) -> ดักแด้ -> ตัวเต็มวัย (ผีเสื้อ)
2) ไก่ ไม่มีการเปลี่ยนแปลงรูปร่างที่ซับซ้อน มี 3 ระยะ ได้แก่ ไข่ -> ลูกเจี๊ยบ -> ไก่ตัวเต็มวัย โดยลูกเจี๊ยบมีรูปร่างคล้ายพ่อแม่ตั้งแต่ฟักออกจากไข่'::text), '{"full_score":5,"key_solution":"เปรียบเทียบวัฏจักรผีเสื้อ 4 ระยะ และไก่","criteria":[{"name":"วัฏจักรผีเสื้อ","points":2,"description":"ระบุ 4 ระยะ (ไข่ หนอน ดักแด้ ตัวเต็มวัย)"},{"name":"วัฏจักรไก่","points":2,"description":"ระบุไข่ ลูกเจี๊ยบ ตัวเต็มวัย"},{"name":"การเปรียบเทียบ","points":1,"description":"ชี้ให้เห็นความต่างของการเปลี่ยนรูป"}],"keywords":["ผีเสื้อ","ไข่","หนอน","ดักแด้","ไก่","วัฏจักรชีวิต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 1.2 ป.4/1', 'บรรยายการเจริญเติบโตของสัตว์', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'วิทยาศาสตร์', 'ป.4', 'การอนุรักษ์สิ่งแวดล้อมในโรงเรียน', 'easy', 'L2', 'essay',
  'นักเรียนสามารถมีส่วนร่วมในการช่วยลดภาวะโลกร้อนและประหยัดพลังงานในโรงเรียนบ้านคำไผ่ได้อย่างไรบ้าง? จงยกตัวอย่างการปฏิบัติที่เป็นรูปธรรมมา 3 ข้อ', to_jsonb('คำตอบ:
1) ช่วยกันปิดสวิตช์ไฟและพัดลมทุกครั้งเมื่อไม่มีคนอยู่ในห้องเรียนหรือเลิกเรียน
2) ปิดก๊อกน้ำให้สนิทหลังล้างมือ ไม่เปิดน้ำทิ้งไว้
3) คัดแยกขยะก่อนทิ้ง และนำกระดาษหน้าที่สองกลับมาใช้ซ้ำ (Reuse)'::text), '{"full_score":5,"key_solution":"เสนอแนวทางประหยัดพลังงานและลดโลกร้อน 3 ข้อ","criteria":[{"name":"ข้อที่ 1 ปิดไฟพัดลม","points":1.5,"description":"ระบุการประหยัดไฟฟ้า"},{"name":"ข้อที่ 2 ปิดน้ำ","points":1.5,"description":"ระบุการประหยัดน้ำ"},{"name":"ข้อที่ 3 จัดการขยะ/รีไซเคิล","points":1,"description":"ระบุการคัดแยกขยะหรือนำกลับมาใช้ซ้ำ"}],"keywords":["ปิดไฟ","ปิดน้ำ","คัดแยกขยะ","ประหยัดพลังงาน","โรงเรียน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 2.1 ป.4/1', 'ประยุกต์ใช้ความรู้ในการดูแลสิ่งแวดล้อม', '2f26d41a-e6a2-404f-bc20-81965e553665'::uuid, '📝 ใบงานคลังวิทย์ ป.4–ป.5', '/games/science/science-p45-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การแต่งประโยคเพื่อการสื่อสาร', 'easy', 'L2', 'essay',
  'ให้นักเรียนแต่งประโยค 3 ส่วน (ประกอบด้วย ประธาน + กริยา + กรรม) จำนวน 1 ประโยค โดยต้องมีคำว่า "คุณครู" และ "โรงเรียนบ้านคำไผ่" และขยายความให้ชัดเจน', to_jsonb('ตัวอย่างประโยค:
คุณครูใจดีสอนวิชาคณิตศาสตร์ให้นักเรียนที่โรงเรียนบ้านคำไผ่ทุกเช้า
(ประธาน: คุณครูใจดี, กริยา: สอน, กรรม: วิชาคณิตศาสตร์, ส่วนขยายสถานที่/เวลา: ที่โรงเรียนบ้านคำไผ่ทุกเช้า)'::text), '{"full_score":5,"key_solution":"ประโยค 3 ส่วนมีประธาน กริยา กรรม และคำที่กำหนด","criteria":[{"name":"โครงสร้างประโยค 3 ส่วน","points":2.5,"description":"มีประธาน กริยา กรรม ชัดเจน"},{"name":"มีคำที่กำหนดครบ","points":1.5,"description":"มีคำว่า คุณครู และ โรงเรียนบ้านคำไผ่"},{"name":"การสะกดคำและความหมาย","points":1,"description":"สะกดคำถูกต้อง สื่อความหมายชัดเจน"}],"keywords":["คุณครู","โรงเรียนบ้านคำไผ่","ประธาน","กริยา","กรรม"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนสื่อสารโดยใช้ถ้อยคำถูกต้องชัดเจน', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การเขียนข้อความแสดงความขอบคุณ', 'easy', 'L2', 'essay',
  'ให้นักเรียนเขียนข้อความสั้นๆ 2-3 บรรทัด เพื่อแสดงความขอบคุณคุณพ่อคุณแม่หรือผู้ปกครองที่คอยดูแลและสนับสนุนการเรียนของนักเรียนมาโดยตลอด โดยใช้ภาษาที่สุภาพและซาบซึ้ง', to_jsonb('ตัวอย่างข้อความ:
กราบขอบพระคุณคุณพ่อคุณแม่ที่คอยอบรมสั่งสอนและดูแลหนูเป็นอย่างดี สนับสนุนให้หนูได้มาเรียนที่โรงเรียนบ้านคำไผ่ หนูสัญญาว่าจะเป็นเด็กดี ตั้งใจเรียนหนังสือ และช่วยเหลืองานบ้านเพื่อแบ่งเบาภาระของคุณพ่อคุณแม่ค่ะ'::text), '{"full_score":5,"key_solution":"เขียนขอบคุณสุภาพ แสดงความกตัญญูและตั้งใจเรียน","criteria":[{"name":"เนื้อหาแสดงความขอบคุณ","points":2,"description":"ระบุบุญคุณและการดูแลชัดเจน"},{"name":"ความตั้งใจปฏิบัติตนเป็นเด็กดี","points":1.5,"description":"แสดงความมุ่งมั่นในการเรียนหรือช่วยงาน"},{"name":"การใช้ภาษาและคำสุภาพ","points":1.5,"description":"ใช้คำสุภาพ ถูกต้องตามกาลเทศะ"}],"keywords":["ขอบพระคุณ","คุณพ่อคุณแม่","ตั้งใจเรียน","เด็กดี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนสื่อสารโดยใช้ถ้อยคำถูกต้องชัดเจน', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การอ่านจับใจความและสรุปข้อคิด', 'easy', 'L2', 'essay',
  'จากนิทานเรื่อง "ราชสีห์กับหนู" ให้นักเรียนบอกข้อคิดเตือนใจที่ได้จากเรื่องนี้มา 2 ข้อ และอธิบายว่าสามารถนำไปปรับใช้ในการอยู่ร่วมกับเพื่อนที่โรงเรียนได้อย่างไร', to_jsonb('คำตอบ:
ข้อคิดที่ได้:
1) อย่าดูถูกผู้ที่ตัวเล็กกว่าหรือด้อยกว่า เพราะทุกคนต่างมีความสามารถและอาจช่วยเหลือเราในยามจำเป็นได้
2) การมีความกตัญญูและช่วยเหลือเกื้อกูลกันย่อมนำมาซึ่งมิตรภาพที่ดี
การนำไปปรับใช้: ไม่ล้อเลียนหรือแกล้งเพื่อนที่ตัวเล็กหรือเรียนไม่เก่ง แต่คอยช่วยเหลือซึ่งกันและกัน'::text), '{"full_score":5,"key_solution":"ข้อคิด 2 ข้อและการปรับใช้กับเพื่อน","criteria":[{"name":"ข้อคิด 2 ข้อ","points":2.5,"description":"ไม่ดูถูกผู้อื่นและมีความกตัญญู"},{"name":"การนำไปปรับใช้","points":1.5,"description":"ช่วยเหลือเพื่อนไม่ล้อเลียน"},{"name":"การเรียบเรียง","points":1,"description":"ใช้ภาษาเข้าใจง่ายสะกดถูกต้อง"}],"keywords":["ราชสีห์","หนู","อย่าดูถูก","กตัญญู","ช่วยเหลือ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 1.1 ป.4/3', 'อ่านเรื่องสั้นๆ และตอบคำถาม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'ชนิดของคำในประโยค', 'easy', 'L2', 'essay',
  'พิจารณาประโยค: "เด็กดีช่วยคุณครูถือหนังสือเล่มใหญ่"
ให้นักเรียนจำแนกชนิดของคำต่อไปนี้: 1) คำว่า "เด็ก" 2) คำว่า "ช่วยถือ" 3) คำว่า "ใหญ่" ว่าเป็นคำชนิดใดในภาษาไทย', to_jsonb('คำตอบ:
1) คำว่า "เด็ก" เป็น คำนาม (สามัญนาม ทำหน้าที่เป็นประธาน)
2) คำว่า "ช่วยถือ" เป็น คำกริยา (แสดงการกระทำ)
3) คำว่า "ใหญ่" เป็น คำวิเศษณ์ (ทำหน้าที่ขยายคำนาม "หนังสือ")'::text), '{"full_score":5,"key_solution":"จำแนกคำนาม คำกริยา และคำวิเศษณ์ถูกต้อง","criteria":[{"name":"คำนาม (เด็ก)","points":1.5,"description":"ระบุเป็นคำนาม"},{"name":"คำกริยา (ช่วยถือ)","points":1.5,"description":"ระบุเป็นคำกริยา"},{"name":"คำวิเศษณ์ (ใหญ่)","points":2,"description":"ระบุเป็นคำวิเศษณ์ขยายนาม"}],"keywords":["คำนาม","คำกริยา","คำวิเศษณ์","เด็ก","ช่วยถือ","ใหญ่"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 4.1 ป.4/1', 'จำแนกชนิดของคำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การเขียนบันทึกประจำวัน', 'easy', 'L2', 'essay',
  'ให้นักเรียนเขียนบันทึกประจำวันสั้นๆ 3-4 บรรทัด เล่าถึงกิจกรรมที่ประทับใจที่สุดในวันนี้ที่โรงเรียนบ้านคำไผ่ โดยระบุวัน เวลา กิจกรรม และความรู้สึก', to_jsonb('ตัวอย่างบันทึก:
วันพฤหัสบดีที่ 1 ตุลาคม 2569
วันนี้เวลาบ่ายสองโมง คุณครูพาพวกเราไปเก็บผักบุ้งที่แปลงผักสวนครัวพอเพียง หนูได้ช่วยเพื่อนรดน้ำและตัดผักบุ้งสดๆ ไปให้แม่ครัวทำอาหารกลางวัน หนูรู้สึกสนุกและภูมิใจมากที่ได้กินผักที่พวกเราช่วยกันปลูกเอง'::text), '{"full_score":5,"key_solution":"มีวันเวลา กิจกรรม และความรู้สึกชัดเจน","criteria":[{"name":"ระบุวันเวลากิจกรรม","points":2,"description":"มีวันและเหตุการณ์ชัดเจน"},{"name":"ความรู้สึกและความประทับใจ","points":1.5,"description":"ระบุความรู้สึกภูมิใจหรือสนุกสนาน"},{"name":"การใช้ภาษาและการสะกด","points":1.5,"description":"เขียนลื่นไหล สะกดคำถูกต้อง"}],"keywords":["บันทึก","โรงเรียนบ้านคำไผ่","กิจกรรม","รู้สึก","ภูมิใจ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนสื่อสารโดยใช้ถ้อยคำถูกต้องชัดเจน', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'สำนวนไทยและการใช้', 'easy', 'L2', 'essay',
  'ให้นักเรียนเลือกสำนวนไทยมา 1 สำนวน เช่น "น้ำขึ้นให้รีบตัก" หรือ "วัวหายล้อมคอก" พร้อมอธิบายความหมายและยกตัวอย่างเหตุการณ์สมมุติในชีวิตประจำวัน', to_jsonb('ตัวอย่างคำตอบ:
สำนวน: "น้ำขึ้นให้รีบตัก"
ความหมาย: เมื่อมีโอกาสดีๆ ผ่านเข้ามาในชีวิต ควรรีบคว้าไว้และลงมือทำอย่างเต็มที่
เหตุการณ์สมมุติ: คุณครูประกาศรับสมัครนักเรียนเข้าร่วมแข่งขันวาดภาพระบายสี มานีซึ่งชอบวาดภาพจึงรีบไปสมัครทันทีโดยไม่รอช้า ตรงกับสำนวนน้ำขึ้นให้รีบตัก'::text), '{"full_score":5,"key_solution":"ระบุสำนวน ความหมาย และเหตุการณ์สมมุติ","criteria":[{"name":"ระบุสำนวนและความหมาย","points":2.5,"description":"บอกสำนวนและความหมายถูกต้อง"},{"name":"เหตุการณ์สมมุติสอดคล้อง","points":1.5,"description":"ยกตัวอย่างเชื่อมโยงกับความหมายได้ดี"},{"name":"การใช้ภาษา","points":1,"description":"สะกดคำถูกต้องสื่อสารชัดเจน"}],"keywords":["สำนวน","ความหมาย","โอกาส","ตัวอย่าง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 5.1 ป.4/1', 'บอกข้อคิดจากการอ่านวรรณคดีและวรรณกรรม', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การเขียนคำแนะนำและข้อควรปฏิบัติ', 'easy', 'L2', 'essay',
  'ให้นักเรียนเขียน "ข้อปฏิบัติในการใช้ห้องสมุดโรงเรียนบ้านคำไผ่" มา 3 ข้อ เพื่อให้ห้องสมุดเป็นสถานที่ที่น่าใช้และเป็นระเบียบเรียบร้อย', to_jsonb('คำตอบ:
1) ไม่ส่งเสียงดังหรือคุยกันเสียงดัง เพื่อไม่รบกวนสมาธิของผู้อื่น
2) ไม่นำขนม อาหาร หรือเครื่องดื่ม เข้ามารับประทานในห้องสมุด
3) เมื่ออ่านหนังสือเสร็จแล้ว ให้นำไปวางไว้ที่จุดพักหนังสือหรือเก็บคืนเข้าชั้นเดิมให้เรียบร้อย'::text), '{"full_score":5,"key_solution":"ข้อปฏิบัติ 3 ข้อในห้องสมุด","criteria":[{"name":"ข้อที่ 1 ความเงียบ","points":1.5,"description":"ไม่ส่งเสียงดัง"},{"name":"ข้อที่ 2 อาหารเครื่องดื่ม","points":1.5,"description":"ไม่นำอาหารเข้ามากิน"},{"name":"ข้อที่ 3 การเก็บหนังสือ","points":1,"description":"เก็บหนังสือเข้าที่หรือจุดพัก"}],"keywords":["ห้องสมุด","ไม่ส่งเสียงดัง","ไม่นำขนม","เก็บหนังสือ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนข้อความแนะนำ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การเขียนบรรยายประสบการณ์', 'easy', 'L2', 'essay',
  'ให้นักเรียนเขียนเล่าเรื่องสั้นๆ 3-4 บรรทัด เกี่ยวกับ "สัตว์เลี้ยงที่ฉันรัก" หรือสัตว์ที่นักเรียนประทับใจ โดยบอกชื่อ ลักษณะนิสัย และเหตุผลที่ชอบ', to_jsonb('ตัวอย่างเรื่องเล่า:
สัตว์เลี้ยงที่ฉันรักคือสุนัขพันธุ์ไทยชื่อว่า "เจ้าด่าง" มันมีขนสีขาวแต้มลายสีน้ำตาล หูตูบ และหางกระดิกตลอดเวลา เจ้าด่างเป็นสุนัขที่แสนรู้และร่าเริง ทุกวันที่ฉันกลับจากโรงเรียนบ้านคำไผ่ มันจะวิ่งมารอรับที่หน้าประตูบ้าน ฉันรักเจ้าด่างเพราะมันเป็นเพื่อนที่ซื่อสัตย์เสมอ'::text), '{"full_score":5,"key_solution":"บอกชื่อ รูปร่างลักษณะ นิสัย และเหตุผลที่รัก","criteria":[{"name":"ลักษณะรูปร่างสัตว์","points":2,"description":"บรรยายสี ขนาด หู หาง ชัดเจน"},{"name":"นิสัยและเหตุผลที่ชอบ","points":2,"description":"บอกความแสนรู้ ความผูกพัน"},{"name":"การสะกดและเรียบเรียง","points":1,"description":"เขียนเป็นย่อหน้าสละสลวย"}],"keywords":["สัตว์เลี้ยง","สุนัข","รัก","เพื่อน","ซื่อสัตย์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนสื่อสารเรื่องราว', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'มารยาทในการพูดและการฟัง', 'easy', 'L2', 'essay',
  'เมื่อนักเรียนกำลังฟังคุณครูอธิบายบทเรียนในห้องเรียน นักเรียนควรมีมารยาทในการฟังอย่างไรบ้าง? จงบอกข้อควรปฏิบัติมา 3 ข้อ', to_jsonb('คำตอบ:
1) ตั้งใจฟังและมองดูคุณครู ไม่พูดคุยแข่งกับคุณครูหรือเล่นกับเพื่อน
2) ไม่ทำกิจกรรมอื่นในขณะที่ฟัง เช่น ไม่แอบอ่านการ์ตูนหรือเล่นของเล่น
3) หากมีข้อสงสัยหรือไม่เข้าใจ ให้ยกมือขึ้นขออนุญาตก่อนถามเมื่อคุณครูเปิดโอกาส'::text), '{"full_score":5,"key_solution":"มารยาทการฟัง 3 ข้อ","criteria":[{"name":"ตั้งใจฟังไม่คุยแข่ง","points":1.5,"description":"มีสมาธิจดจ่อ"},{"name":"ไม่ทำสิ่งอื่น","points":1.5,"description":"ไม่เล่นหรือทำกิจกรรมอื่น"},{"name":"ยกมือขออนุญาตซักถาม","points":1,"description":"ปฏิบัติตามมารยาทสากล"}],"keywords":["มารยาท","ตั้งใจฟัง","ไม่คุย","ยกมือ","คุณครู"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 3.1 ป.4/1', 'มีมารยาทในการฟัง การดู และการพูด', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'คำราชาศัพท์ในชีวิตประจำวัน', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายความสำคัญว่า ทำไมคนไทยจึงต้องเรียนรู้และใช้ "คำราชาศัพท์" และคำสุภาพให้ถูกต้องเหมาะสมกับบุคคลแต่ละระดับ', to_jsonb('คำตอบ:
คนไทยต้องเรียนรู้คำราชาศัพท์เพราะเป็นมรดกทางภาษาและวัฒนธรรมอันดีงามของชาติ การใช้คำราชาศัพท์และคำสุภาพเป็นการแสดงความเคารพยกย่องพระมหากษัตริย์ พระบรมวงศานุวงศ์ พระสงฆ์ และบุคคลทั่วไปตามกาลเทศะและฐานะของบุคคล ทำให้การสื่อสารในสังคมมีความไพเราะและราบรื่น'::text), '{"full_score":5,"key_solution":"อธิบายคุณค่าทางวัฒนธรรมและความเหมาะสมตามกาลเทศะ","criteria":[{"name":"คุณค่าทางวัฒนธรรม","points":2.5,"description":"เป็นมรดกทางภาษาและเอกลักษณ์ไทย"},{"name":"การแสดงความเคารพตามกาลเทศะ","points":1.5,"description":"แสดงความสุภาพต่อบุคคลแต่ละระดับ"},{"name":"การเรียบเรียงภาษา","points":1,"description":"เขียนสละสลวยเข้าใจง่าย"}],"keywords":["คำราชาศัพท์","วัฒนธรรม","กาลเทศะ","ความเคารพ","สุภาพ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 4.1 ป.4/1', 'ใช้คำราชาศัพท์และคำสุภาพ', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาไทย', 'ป.4', 'การเขียนข้อความเพื่อการติดต่อสื่อสาร', 'easy', 'L2', 'essay',
  'หากนักเรียนจำเป็นต้องลาหยุดเรียน 1 วัน เนื่องจากต้องเดินทางไปทำธุระกับครอบครัวต่างจังหวัด ให้นักเรียนเขียนข้อความสั้นๆ 2-3 บรรทัด เพื่อส่งข้อความแจ้งคุณครูประจำชั้นอย่างสุภาพ', to_jsonb('ตัวอย่างข้อความ:
เรียน คุณครูประจำชั้นที่เคารพ
เนื่องจากหนูมีความจำเป็นต้องเดินทางไปทำธุระสำคัญกับคุณพ่อคุณแม่ที่ต่างจังหวัด จึงขออนุญาตลาหยุดเรียนเป็นเวลา 1 วัน ในวันศุกร์นี้ เมื่อกลับมาแล้วจะรีบติดตามการบ้านและบทเรียนจากเพื่อนค่ะ ขอบพระคุณค่ะ'::text), '{"full_score":5,"key_solution":"เขียนขออนุญาตลาธุระสุภาพ มีสาเหตุและระยะเวลา","criteria":[{"name":"ระบุเหตุผลและระยะเวลา","points":2.5,"description":"บอกไปธุระต่างจังหวัดและระบุ 1 วัน"},{"name":"คำขึ้นต้นและลงท้ายสุภาพ","points":1.5,"description":"ใช้คำว่า เรียนคุณครู และ ขอบพระคุณ"},{"name":"ความรับผิดชอบในการเรียน","points":1,"description":"บอกจะติดตามบทเรียน"}],"keywords":["เรียนคุณครู","ลาหยุด","1 วัน","ต่างจังหวัด","ขอบพระคุณ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ท 2.1 ป.4/1', 'เขียนสื่อสารอย่างมีมารยาท', '09148797-df6c-42fd-a5a5-653fe6067de8'::uuid, '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', '/games/thai/thai-vocab-hub/cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Self Introduction', 'easy', 'L2', 'essay',
  'Write 3-4 sentences in English to introduce yourself. Include: 1) Your name 2) Your age 3) Grade and school name (Kampai School) 4) Your favorite subject or hobby.', to_jsonb('Example:
Hello! My name is Somchai. I am 10 years old. I am studying in Grade 4 at Kampai School. My favorite subject is Science because I love doing fun experiments.'::text), '{"full_score":5,"key_solution":"4 key elements: Name, age, grade/school, hobby","criteria":[{"name":"Name and Age","points":1.5,"description":"Correct grammar for name and age"},{"name":"Grade and School Name","points":1.5,"description":"Mentions Grade 4 and Kampai School"},{"name":"Favorite subject/hobby","points":1,"description":"Mentions favorite subject with reason"}],"keywords":["name","years old","Grade 4","Kampai School","favorite"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูลเกี่ยวกับตนเอง', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'My Daily Routine', 'easy', 'L2', 'essay',
  'Write 3 sentences in English about what you do in the morning before going to school. (Use words like: wake up, brush my teeth, eat breakfast)', to_jsonb('Example:
I wake up at six o''clock every morning. Then, I brush my teeth and wash my face. After that, I eat breakfast with my family before walking to school.'::text), '{"full_score":5,"key_solution":"3 morning activities with correct present simple tense","criteria":[{"name":"Morning activities","points":2.5,"description":"Mentions wake up, brush teeth, eat breakfast"},{"name":"Grammar and spelling","points":1.5,"description":"Correct present simple verbs"},{"name":"Sentence transition","points":1,"description":"Uses then/after that"}],"keywords":["wake up","brush","teeth","breakfast","school"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/1', 'พูดและเขียนเกี่ยวกับกิจวัตรประจำวัน', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Describing My Favorite Animal', 'easy', 'L2', 'essay',
  'Describe your favorite animal in 3 English sentences. Mention: 1) What animal it is 2) What it looks like or eats 3) Why you like it.', to_jsonb('Example:
My favorite animal is the rabbit. It has long soft ears, white fur, and loves eating fresh carrots. I like rabbits because they are very cute and gentle.'::text), '{"full_score":5,"key_solution":"Identifies animal, description/food, and reason","criteria":[{"name":"Identifies animal and appearance","points":2,"description":"Names animal and describes physical traits"},{"name":"Food and reason","points":2,"description":"Mentions what it eats and why liked"},{"name":"English grammar","points":1,"description":"Simple accurate sentences"}],"keywords":["favorite animal","ears","fur","eats","cute"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.3 ป.4/1', 'พูดและเขียนให้ข้อมูลเกี่ยวกับสิ่งแวดล้อมใกล้ตัว', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Past Weekend Activities', 'easy', 'L2', 'essay',
  'Write 3 sentences in English about what you did last weekend using past tense verbs (such as: went, played, visited, watched, helped).', to_jsonb('Example:
Last Saturday, I visited my grandparents in the village. On Sunday, I played football with my friends in the playground. In the evening, I helped my mother cook dinner.'::text), '{"full_score":5,"key_solution":"3 past activities using correct Past Simple verbs","criteria":[{"name":"Past Simple verbs usage","points":2.5,"description":"Uses visited, played, helped correctly"},{"name":"Context and activities","points":1.5,"description":"Describes realistic weekend activities"},{"name":"Spelling and punctuation","points":1,"description":"Capital letters and periods used correctly"}],"keywords":["last","visited","played","helped","weekend"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/1', 'พูดและเขียนเกี่ยวกับกิจกรรมในอดีต', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Healthy Food and Eating Habits', 'easy', 'L2', 'essay',
  'Write 3 sentences in English about healthy foods you like to eat and drink to stay strong and healthy.', to_jsonb('Example:
I like to eat fresh fruits like apples, bananas, and oranges every day. I also drink a glass of fresh milk in the morning. Eating good food helps my body grow strong and stay healthy.'::text), '{"full_score":5,"key_solution":"Mentions healthy food, drinks, and health benefit","criteria":[{"name":"Healthy foods mentioned","points":2,"description":"Mentions fruits, vegetables, or milk"},{"name":"Health benefits","points":2,"description":"Mentions growing strong/staying healthy"},{"name":"Sentence structure","points":1,"description":"Clear and accurate sentences"}],"keywords":["fruits","milk","healthy","strong","eat"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.3 ป.4/1', 'พูดและเขียนข้อมูลเกี่ยวกับตนเอง', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Classroom Rules', 'easy', 'L2', 'essay',
  'Write 3 simple rules in English for good students in the classroom. (Use phrases like: Listen to..., Keep the room..., Raise your hand...)', to_jsonb('Example:
1) Listen carefully when the teacher is speaking.
2) Raise your hand before asking a question.
3) Keep the classroom clean and tidy.'::text), '{"full_score":5,"key_solution":"3 clear classroom rules in English","criteria":[{"name":"3 distinct rules","points":3,"description":"Covers listening, raising hand, cleanliness"},{"name":"Imperative verb forms","points":1,"description":"Uses Listen, Raise, Keep correctly"},{"name":"Punctuation and format","points":1,"description":"Numbered or bulleted neatly"}],"keywords":["listen","teacher","raise your hand","clean","classroom"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.1 ป.4/1', 'ปฏิบัติตามคำสั่งและคำขอร้อง', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'The Weather Today', 'easy', 'L2', 'essay',
  'Describe the weather in 2-3 English sentences. Mention the weather condition (sunny, rainy, cloudy, windy) and what you should wear or bring.', to_jsonb('Example:
Today the weather is sunny and very hot. The sun is shining brightly in the blue sky. I should wear a hat and drink plenty of cold water.'::text), '{"full_score":5,"key_solution":"Weather condition and recommended clothing/action","criteria":[{"name":"Weather description","points":2,"description":"Describes sunny, hot, rainy, etc."},{"name":"Clothing or practical advice","points":2,"description":"Mentions wearing hat, umbrella, drinking water"},{"name":"English vocabulary","points":1,"description":"Accurate weather vocabulary"}],"keywords":["weather","sunny","hot","wear","water"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.3 ป.4/1', 'พูดและเขียนเกี่ยวกับสภาพอากาศ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Giving Directions at School', 'easy', 'L2', 'essay',
  'A new student asks you where the school library is. Write 2-3 sentences in English giving simple directions from the classroom to the library.', to_jsonb('Example:
Walk out of our classroom and turn right down the hallway. Go straight past the computer lab. The library is on your left, next to the teacher''s office.'::text), '{"full_score":5,"key_solution":"Simple direction vocabulary: turn right, go straight, next to","criteria":[{"name":"Direction instructions","points":2.5,"description":"Uses turn right/left, go straight, next to"},{"name":"Landmarks mentioned","points":1.5,"description":"Mentions computer lab, office, hallway"},{"name":"Clarity","points":1,"description":"Easy for a new student to follow"}],"keywords":["turn right","go straight","library","next to","classroom"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/2', 'ให้คำแนะนำง่ายๆ ในการบอกทิศทาง', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'My Best Friend', 'easy', 'L2', 'essay',
  'Write 3 sentences in English about your best friend at school. Include: 1) Friend''s name 2) What you like doing together 3) Why he/she is a good friend.', to_jsonb('Example:
My best friend at Kampai School is Danai. We always play football together during lunchtime. He is very kind because he always shares his snacks with me.'::text), '{"full_score":5,"key_solution":"Friend name, shared activity, and why he/she is special","criteria":[{"name":"Friend name and activity","points":2,"description":"Names friend and activity like football/reading"},{"name":"Kind quality described","points":2,"description":"Explains kindness or sharing"},{"name":"Language accuracy","points":1,"description":"Correct pronouns (he/she)"}],"keywords":["best friend","play","lunch","kind","shares"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/1', 'พูดและเขียนเกี่ยวกับเพื่อน', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Future Dream Job', 'easy', 'L2', 'essay',
  'What do you want to be when you grow up? Write 3 sentences in English stating your dream job and why you want to do that job.', to_jsonb('Example:
When I grow up, I want to be a doctor. I want to help sick people and take care of children in the hospital. I will study hard to make my dream come true.'::text), '{"full_score":5,"key_solution":"States career aspiration and gives meaningful reason","criteria":[{"name":"States dream job","points":1.5,"description":"Names job (doctor, teacher, police, etc.)"},{"name":"Reason for choice","points":2.5,"description":"Explains helping people, teaching, etc."},{"name":"Future ambition","points":1,"description":"Mentions studying hard"}],"keywords":["grow up","want to be","doctor","help","study"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.3 ป.4/1', 'พูดและเขียนเกี่ยวกับความฝันและอาชีพ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'ภาษาอังกฤษ', 'ป.4', 'Thank You Message', 'easy', 'L2', 'essay',
  'Write a short thank-you message (2-3 sentences in English) to your teacher for teaching and helping you at school.', to_jsonb('Example:
Dear Teacher,
Thank you very much for teaching me with kindness every day. You always help me understand difficult lessons. I am very proud to be your student!'::text), '{"full_score":5,"key_solution":"Polite opening, expression of gratitude, and reason","criteria":[{"name":"Greeting and gratitude","points":2,"description":"Uses Dear Teacher and Thank you very much"},{"name":"Specific praise/reason","points":2,"description":"Mentions teaching kindness or helping"},{"name":"Tone and punctuation","points":1,"description":"Polite respectful tone"}],"keywords":["Dear Teacher","Thank you","teaching","help","student"]}'::jsonb, ARRAY[]::text[], NULL,
  'ต 1.2 ป.4/1', 'เขียนข้อความขอบคุณอย่างสุภาพ', 'fc6bf43f-9249-4a91-bcfb-c24cf27db608'::uuid, '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/games/english/english-quest-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'หลักธรรมโอวาท 3 ในชีวิตประจำวัน', 'easy', 'L2', 'essay',
  'หลักธรรม "โอวาท 3" ของพระพุทธเจ้า ได้แก่ 1) การไม่ทำความชั่ว 2) การทำความดี 3) การทำจิตใจให้บริสุทธิ์ ให้นักเรียนยกตัวอย่างการปฏิบัติตนตามหลักธรรมทั้ง 3 ข้อนี้มาอย่างละ 1 ตัวอย่างในชีวิตจริง', to_jsonb('คำตอบ:
1) การไม่ทำความชั่ว: ไม่ลักขโมยสิ่งของของเพื่อน ไม่รังแกสัตว์ และไม่พูดโกหก
2) การทำความดี: ช่วยคุณครูยกของ กวาดห้องเรียน แบ่งปันขนมให้เพื่อน และกตัญญูต่อพ่อแม่
3) การทำจิตใจให้ผ่องใสบริสุทธิ์: สวดมนต์ไหว้พระ นั่งสมาธิก่อนเริ่มเรียน เพื่อให้จิตใจสงบ'::text), '{"full_score":5,"key_solution":"ยกตัวอย่างการปฏิบัติครบ 3 ประการ","criteria":[{"name":"ไม่ทำความชั่ว","points":1.5,"description":"ไม่ขโมย ไม่แกล้ง ไม่โกหก"},{"name":"ทำความดี","points":1.5,"description":"ช่วยเหลืองาน มีน้ำใจ กตัญญู"},{"name":"ทำจิตใจให้บริสุทธิ์","points":1,"description":"สวดมนต์ นั่งสมาธิ จิตใจสงบ"}],"keywords":["โอวาท 3","ไม่ทำชั่ว","ทำความดี","จิตใจบริสุทธิ์","สมาธิ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 1.1 ป.4/4', 'ปฏิบัติตามหลักธรรมโอวาท 3', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'วันสำคัญทางศาสนาและการทำบุญ', 'easy', 'L2', 'essay',
  'วันวิสาขบูชา มีความสำคัญอย่างไรต่อชาวพุทธ และในวันนี้นักเรียนและครอบครัวควรปฏิบัติตนอย่างไรเพื่อสืบทอดพระพุทธศาสนา?', to_jsonb('คำตอบ:
ความสำคัญ: เป็นวันที่ตรงกับเหตุการณ์สำคัญ 3 เหตุการณ์ในพระชนมชีพของพระพุทธเจ้า ได้แก่ วันประสูติ ตรัสรู้ และปรินิพพาน
การปฏิบัติตน: ในตอนเช้าไปทำบุญตักบาตรที่วัด ฟังเทศน์รักษาศีล และในตอนค่ำร่วมพิธีเวียนเทียนรอบพระอุโบสถเพื่อรำลึกถึงพระรัตนตรัย'::text), '{"full_score":5,"key_solution":"ความสำคัญประสูติ ตรัสรู้ ปรินิพพาน และกิจกรรมทำบุญ","criteria":[{"name":"ความสำคัญ 3 เหตุการณ์","points":2.5,"description":"ระบุประสูติ ตรัสรู้ ปรินิพพาน"},{"name":"กิจกรรมทางศาสนา","points":1.5,"description":"ตักบาตร ฟังธรรม เวียนเทียน"},{"name":"การใช้ภาษา","points":1,"description":"เขียนถูกต้องตามหลักศาสนา"}],"keywords":["วิสาขบูชา","ประสูติ","ตรัสรู้","ปรินิพพาน","เวียนเทียน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 1.1 ป.4/1', 'อธิบายความสำคัญของวันสำคัญทางศาสนา', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การเป็นพลเมืองดีตามวิถีประชาธิปไตย', 'easy', 'L2', 'essay',
  'การปฏิบัติตนเป็นพลเมืองดีตามวิถีประชาธิปไตยในห้องเรียน นักเรียนควรมีพฤติกรรมอย่างไรบ้าง? จงยกตัวอย่างมา 3 ข้อ', to_jsonb('คำตอบ:
1) เคารพกฎระเบียบของห้องเรียนและโรงเรียน เช่น เข้าแถวตรงเวลา ไม่ส่งเสียงดัง
2) รับฟังความคิดเห็นของเพื่อนทุกคน และยอมรับมติเสียงข้างมากในการทำงานกลุ่ม
3) มีส่วนร่วมในการเลือกตั้งหัวหน้าห้องอย่างบริสุทธิ์ใจ ไม่เห็นแก่พวกพ้อง'::text), '{"full_score":5,"key_solution":"พฤติกรรมพลเมืองดีประชาธิปไตย 3 ข้อ","criteria":[{"name":"เคารพกฎระเบียบ","points":1.5,"description":"รักษาวินัยของห้องเรียน"},{"name":"เคารพเสียงข้างมาก","points":1.5,"description":"รับฟังและยอมรับมติกลุ่ม"},{"name":"การมีส่วนร่วมเลือกตั้ง","points":1,"description":"ใช้สิทธิ์เลือกตั้งตัวแทน"}],"keywords":["พลเมืองดี","ประชาธิปไตย","เคารพกฎ","เสียงข้างมาก","เลือกตั้ง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ปฏิบัติตนเป็นพลเมืองดีตามวิถีประชาธิปไตย', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การประยุกต์เศรษฐกิจพอเพียงในการออม', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายว่า จะนำหลัก "3 ห่วง (พอประมาณ มีเหตุผล มีภูมิคุ้มกัน)" มาใช้ในการบริหารจัดการเงินค่าขนมในแต่ละวันได้อย่างไร', to_jsonb('คำตอบ:
1) พอประมาณ: ซื้ออาหารและขนมเท่าที่จำเป็น ไม่ซื้อของฟุ่มเฟือยเกินงบค่าขนมที่ได้รับ
2) มีเหตุผล: คิดพิจารณาก่อนซื้อว่าสิ่งนั้นมีประโยชน์ต่อร่างกายและการเรียนหรือไม่
3) มีภูมิคุ้มกันที่ดี: หยอดเงินที่เหลือใส่กระปุกออมสินทุกวัน เพื่อเก็บไว้ใช้จ่ายในยามฉุกเฉินหรือซื้ออุปกรณ์การเรียนที่จำเป็น'::text), '{"full_score":5,"key_solution":"อธิบาย 3 ห่วงเชื่อมโยงกับการใช้เงินค่าขนม","criteria":[{"name":"ความพอประมาณ","points":1.5,"description":"ไม่ซื้อของฟุ่มเฟือย"},{"name":"ความมีเหตุผล","points":1.5,"description":"คิดไตร่ตรองความจำเป็นก่อนซื้อ"},{"name":"การมีภูมิคุ้มกัน","points":1,"description":"การออมเงินเผื่อฉุกเฉิน"}],"keywords":["เศรษฐกิจพอเพียง","พอประมาณ","มีเหตุผล","ภูมิคุ้มกัน","เงินออม"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 3.1 ป.4/1', 'ประยุกต์ใช้ปรัชญาเศรษฐกิจพอเพียง', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'กฎจราจรและความปลอดภัยในชุมชน', 'easy', 'L2', 'essay',
  'การปฏิบัติตามกฎจราจรมีความสำคัญอย่างไรต่อนักเรียนและคนในสังคม และจงยกตัวอย่างกฎจราจรที่นักเรียนต้องปฏิบัติในการเดินทางมาโรงเรียน 2 ข้อ', to_jsonb('คำตอบ:
ความสำคัญ: ช่วยป้องกันอุบัติเหตุ ลดการบาดเจ็บและเสียชีวิต ทำให้การจราจรบนท้องถนนมีความเป็นระเบียบเรียบร้อย
กฎที่ต้องปฏิบัติ:
1) ข้ามถนนบนทางม้าลายหรือสะพานลอย และมองซ้ายขวาก่อนข้ามเสมอ
2) สวมหมวกนิรภัย (หมวกกันน็อก) ทุกครั้งเมื่อโดยสารรถจักรยานยนต์'::text), '{"full_score":5,"key_solution":"ความสำคัญของกฎจราจรและตัวอย่างการปฏิบัติ 2 ข้อ","criteria":[{"name":"ความสำคัญ","points":2,"description":"ลดอุบัติเหตุและความเป็นระเบียบ"},{"name":"ตัวอย่าง 2 ข้อ","points":2,"description":"ข้ามทางม้าลาย และสวมหมวกกันน็อก"},{"name":"การสรุป","points":1,"description":"เขียนชัดเจนสื่อความหมายดี"}],"keywords":["กฎจราจร","อุบัติเหตุ","ทางม้าลาย","หมวกกันน็อก","ปลอดภัย"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/2', 'ปฏิบัติตามกฎหมายที่เกี่ยวข้อง', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'สิทธิและหน้าที่ของเด็ก', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกความแตกต่างระหว่าง "สิทธิ" กับ "หน้าที่" พร้อมยกตัวอย่างสิทธิที่เด็กพึงได้รับ และหน้าที่ที่เด็กต้องปฏิบัติต่อโรงเรียนอย่างละ 1 ตัวอย่าง', to_jsonb('คำตอบ:
ความแตกต่าง:
- สิทธิ คือ อำนาจหรือประโยชน์ที่กฎหมายคุ้มครองให้แก่บุคคล เช่น สิทธิที่จะได้รับการศึกษาขั้นพื้นฐานอย่างเท่าเทียม
- หน้าที่ คือ สิ่งที่บุคคลต้องปฏิบัติเพื่อความเป็นระเบียบเรียบร้อยของสังคม เช่น หน้าที่ตั้งใจเรียนหนังสือและช่วยรักษาความสะอาดของโรงเรียน'::text), '{"full_score":5,"key_solution":"อธิบายความต่างของสิทธิและหน้าที่พร้อมตัวอย่าง","criteria":[{"name":"ความหมายของสิทธิและตัวอย่าง","points":2,"description":"อธิบายสิทธิและยกตัวอย่างการศึกษา"},{"name":"ความหมายของหน้าที่และตัวอย่าง","points":2,"description":"อธิบายหน้าที่และยกตัวอย่างการตั้งใจเรียน"},{"name":"การเปรียบเทียบ","points":1,"description":"ชี้ความสัมพันธ์สองสิ่งชัดเจน"}],"keywords":["สิทธิ","หน้าที่","การศึกษา","ตั้งใจเรียน","กฎหมาย"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/2', 'ปฏิบัติตามสิทธิและหน้าที่', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การอยู่ร่วมกันในสังคมอย่างสันติ', 'easy', 'L2', 'essay',
  'เมื่อนักเรียนมีความคิดเห็นไม่ตรงกับเพื่อนในการทำงานกลุ่ม นักเรียนควรปฏิบัติตนอย่างไรเพื่อไม่ให้เกิดความขัดแย้งและทำงานให้สำเร็จลุล่วง?', to_jsonb('คำตอบ:
1) ใจเย็นและเปิดใจรับฟังเหตุผลของเพื่อนอย่างตั้งใจ ไม่ใช้อารมณ์หรือคำพูดรุนแรง
2) ร่วมกันอภิปรายข้อดีข้อเสียของแต่ละความคิดเห็นอย่างมีเหตุผล
3) ใช้การลงมติเสียงข้างมากอย่างยุติธรรม และร่วมมือกันทำงานตามข้อตกลงเพื่อเป้าหมายของกลุ่ม'::text), '{"full_score":5,"key_solution":"แนวทางแก้ปัญหาความเห็นต่างอย่างสันติ","criteria":[{"name":"การรับฟังและควบคุมอารมณ์","points":2,"description":"เปิดใจรับฟังไม่ใช้อารมณ์"},{"name":"การหาข้อสรุปด้วยเหตุผล/มติ","points":2,"description":"อภิปรายข้อดีข้อเสียและใช้เสียงข้างมาก"},{"name":"ความร่วมมือในกลุ่ม","points":1,"description":"มุ่งเน้นความสำเร็จของงาน"}],"keywords":["รับฟัง","เหตุผล","เสียงข้างมาก","ความสามัคคี","ไม่ขัดแย้ง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'การอยู่ร่วมกันอย่างสันติสุข', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การอนุรักษ์สิ่งแวดล้อมชุมชน', 'easy', 'L2', 'essay',
  'แม่น้ำ ลำคลอง และป่าไม้ในชุมชนมีความสำคัญต่อการดำรงชีวิตของคนในท้องถิ่นอย่างไร และนักเรียนสามารถช่วยดูแลรักษาแหล่งน้ำได้อย่างไร?', to_jsonb('คำตอบ:
ความสำคัญ: เป็นแหล่งน้ำสำหรับอุปโภคบริโภค การทำเกษตรกรรม และเป็นที่อยู่อาศัยของสัตว์น้ำ ช่วยสร้างความอุดมสมบูรณ์ให้ชุมชน
การดูแลรักษา: ไม่ทิ้งขยะ สิ่งปฏิกูล หรือสารเคมีลงในแม่น้ำลำคลอง และช่วยกันเก็บขยะริมตลิ่งเมื่อมีกิจกรรมจิตอาสา'::text), '{"full_score":5,"key_solution":"ความสำคัญของแหล่งน้ำและการดูแลรักษา","criteria":[{"name":"ความสำคัญต่อชีวิตและการเกษตร","points":2,"description":"บอกประโยชน์น้ำกินน้ำใช้และเกษตร"},{"name":"วิธีดูแลรักษา","points":2,"description":"ไม่ทิ้งขยะและช่วยกันทำความสะอาด"},{"name":"จิตสาธารณะ","points":1,"description":"แสดงความรับผิดชอบต่อส่วนรวม"}],"keywords":["แหล่งน้ำ","แม่น้ำลำคลอง","เกษตร","ไม่ทิ้งขยะ","อนุรักษ์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 5.2 ป.4/1', 'มีส่วนร่วมในการอนุรักษ์สิ่งแวดล้อม', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การทำบัญชีรายรับ-รายจ่าย', 'easy', 'L2', 'essay',
  'การจดบันทึก "รายรับ-รายจ่าย" ประจำวัน มีประโยชน์ต่อนักเรียนและครอบครัวอย่างไรบ้าง? จงอธิบายมา 2 ข้อ', to_jsonb('คำตอบ:
1) ช่วยให้ทราบว่าในแต่ละวันเราใช้จ่ายเงินไปกับสิ่งใดบ้าง มีเงินเหลือเก็บออมเท่าใด
2) ช่วยให้มองเห็นค่าใช้จ่ายที่ไม่จำเป็น ทำให้สามารถวางแผนตัดลดรายจ่ายฟุ่มเฟือยและมีเงินออมเพิ่มขึ้น'::text), '{"full_score":5,"key_solution":"ประโยชน์ของการทำบัญชี 2 ข้อ","criteria":[{"name":"ทราบสถานะการเงิน","points":2,"description":"รู้รายรับรายจ่ายและเงินออม"},{"name":"ช่วยลดรายจ่ายฟุ่มเฟือย","points":2,"description":"ตัดรายจ่ายไม่จำเป็นวางแผนการเงิน"},{"name":"การใช้ภาษา","points":1,"description":"เข้าใจง่ายเป็นประโยชน์จริง"}],"keywords":["รายรับรายจ่าย","เงินออม","ลดรายจ่าย","วางแผนการเงิน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 3.1 ป.4/2', 'บอกความสำคัญของการออมและการใช้จ่าย', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'ผู้นำชุมชนและบทบาทหน้าที่', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกชื่อตำแหน่งของผู้นำชุมชนในระดับหมู่บ้านหรือตำบลมา 1 ตำแหน่ง (เช่น ผู้ใหญ่บ้าน หรือ กำนัน) พร้อมอธิบายบทบาทหน้าที่ในการดูแลลูกบ้าน', to_jsonb('คำตอบ:
ตำแหน่ง: "ผู้ใหญ่บ้าน"
บทบาทหน้าที่: ดูแลความสงบเรียบร้อยและความปลอดภัยของคนในหมู่บ้าน เป็นตัวแทนประสานงานระหว่างชาวบ้านกับทางราชการ แจ้งข่าวสารสำคัญจากรัฐบาล และช่วยไกล่เกลี่ยข้อพิพาทในหมู่บ้านอย่างเป็นธรรม'::text), '{"full_score":5,"key_solution":"ระบุตำแหน่งและอธิบายหน้าที่ดูแลความสงบเรียบร้อย","criteria":[{"name":"ระบุตำแหน่งผู้นำชุมชน","points":1.5,"description":"ระบุผู้ใหญ่บ้านหรือกำนัน"},{"name":"อธิบายหน้าที่","points":2.5,"description":"ดูแลความสงบ ประสานงานราชการ ไกล่เกลี่ย"},{"name":"ความถูกต้อง","points":1,"description":"สอดคล้องกับระเบียบบริหารราชการ"}],"keywords":["ผู้ใหญ่บ้าน","กำนัน","ความสงบเรียบร้อย","ประสานงาน","ชุมชน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.2 ป.4/1', 'ระบุบทบาทหน้าที่ของผู้นำชุมชน', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'สังคมศึกษา', 'ป.4', 'การเคารพสิทธิผู้อื่นในโรงเรียน', 'easy', 'L2', 'essay',
  'ทำไมเราจึงไม่ควรล้อเลียนปมด้อยของเพื่อน (เช่น รูปร่าง หน้าตา หรือฐานะ) และการกระทำเช่นนั้นส่งผลเสียต่อเพื่อนและบรรยากาศในห้องเรียนอย่างไร?', to_jsonb('คำตอบ:
การล้อเลียนปมด้อยเป็นการละเมิดสิทธิและศักดิ์ศรีความเป็นมนุษย์ของผู้อื่น
ผลเสีย:
1) ทำให้เพื่อนที่ถูกล้อรู้สึกเสียใจ อับอาย ขาดความมั่นใจ และไม่อยากมาโรงเรียน
2) ทำให้บรรยากาศในห้องเรียนเกิดความแตกแยก ขาดความรักความสามัคคี และอาจนำไปสู่การทะเลาะเบาะแว้ง'::text), '{"full_score":5,"key_solution":"อธิบายเหตุผลและผลกระทบต่อจิตใจเพื่อนและห้องเรียน","criteria":[{"name":"เหตุผลทางสิทธิมนุษยชน","points":2,"description":"เป็นการละเมิดสิทธิและศักดิ์ศรี"},{"name":"ผลเสียต่อจิตใจเพื่อน","points":1.5,"description":"เพื่อนเสียใจ อับอาย ขาดความมั่นใจ"},{"name":"ผลเสียต่อบรรยากาศห้องเรียน","points":1.5,"description":"เกิดความแตกแยก ทะเลาะวิวาท"}],"keywords":["ล้อเลียน","ปมด้อย","ละเมิดสิทธิ","เสียใจ","ความสามัคคี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ปฏิบัติตนตามหลักสิทธิมนุษยชน', 'd5387db8-ff6d-4397-8df1-721640d1cbdd'::uuid, '🤝 พลเมืองดี — หน้าที่และจริยธรรม', '/games/social/good-citizen-media-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'ความสำคัญของการศึกษาประวัติศาสตร์', 'easy', 'L2', 'essay',
  'การศึกษาประวัติศาสตร์และเรื่องราวในอดีตมีประโยชน์ต่อนักเรียนและประเทศชาติอย่างไร? จงอธิบายมา 2 ข้อ', to_jsonb('คำตอบ:
1) ช่วยให้เข้าใจความเป็นมาของชาติ ความเสียสละของบรรพบุรุษ เกิดความภาคภูมิใจและรักชาติ
2) นำบทเรียนและข้อผิดพลาดในอดีตมาเป็นแนวทางในการแก้ไขปัญหาและพัฒนาชีวิตในปัจจุบัน'::text), '{"full_score":5,"key_solution":"ประโยชน์ 2 ข้อ: ความภาคภูมิใจและบทเรียนในอดีต","criteria":[{"name":"เข้าใจรากเหง้าความภาคภูมิใจ","points":2.5,"description":"ระบุความรักชาติและเข้าใจบรรพบุรุษ"},{"name":"นำบทเรียนมาปรับใช้","points":1.5,"description":"ใช้ข้อผิดพลาดในอดีตมาพัฒนาปัจจุบัน"},{"name":"การเรียบเรียง","points":1,"description":"เข้าใจง่ายชัดเจน"}],"keywords":["ประวัติศาสตร์","บรรพบุรุษ","บทเรียน","รักชาติ","ปัจจุบัน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.1 ป.4/2', 'อธิบายความสำคัญของประวัติศาสตร์', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'พ่อขุนรามคำแหงมหาราชและผลงาน', 'easy', 'L2', 'essay',
  'พ่อขุนรามคำแหงมหาราช ทรงมีพระปรีชาสามารถและสร้างผลงานสำคัญใดที่ถือเป็นมรดกทางวัฒนธรรมอันล้ำค่าที่สุดของคนไทย? จงอธิบาย', to_jsonb('คำตอบ:
ผลงานสำคัญคือ ทรง "ประดิษฐ์อักษรไทย (ลายสือไทย)" ขึ้นเมื่อปี พ.ศ. 1826 โดยดัดแปลงมาจากอักษรขอมและมอญ จารึกลงในศิลาจารึกหลักที่ 1 ทำให้คนไทยมีภาษาและตัวอักษรของตนเองใช้บันทึกเรื่องราวสืบต่อมาจนถึงปัจจุบัน'::text), '{"full_score":5,"key_solution":"ประดิษฐ์อักษรไทย ลายสือไทย พ.ศ. 1826 ศิลาจารึกหลักที่ 1","criteria":[{"name":"การประดิษฐ์ลายสือไทย","points":2.5,"description":"ระบุลายสือไทย พ.ศ. 1826"},{"name":"ความสำคัญต่อชาติ","points":1.5,"description":"ทำให้ไทยมีตัวอักษรเป็นของตนเอง"},{"name":"รายละเอียดทางประวัติศาสตร์","points":1,"description":"ระบุศิลาจารึกหลักที่ 1"}],"keywords":["พ่อขุนรามคำแหง","ลายสือไทย","อักษรไทย","พ.ศ. 1826","ศิลาจารึก"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'วิถีชีวิตชาวสุโขทัยจากศิลาจารึก', 'easy', 'L2', 'essay',
  'จากข้อความในศิลาจารึก "ในน้ำมีปลา ในนามีข้าว ใครจักใคร่ค้าช้างค้า ใครจักใคร่ค้าม้าค้า" สะท้อนให้เห็นถึงสภาพเศรษฐกิจและความเป็นอยู่ของชาวสุโขทัยอย่างไร?', to_jsonb('คำตอบ:
1) สะท้อนถึงความอุดมสมบูรณ์ของทรัพยากรธรรมชาติ ดินดี น้ำดี เหมาะแก่การเพาะปลูกและหาอาหาร
2) สะท้อนถึงระบบเศรษฐกิจแบบการค้าเสรี ประชาชนมีอิสระในการค้าขายสินค้าโดยไม่มีการเก็บภาษีผ่านด่าน (จังกอบ)'::text), '{"full_score":5,"key_solution":"สะท้อนความอุดมสมบูรณ์และการค้าเสรีไร้ภาษีจังกอบ","criteria":[{"name":"ความอุดมสมบูรณ์","points":2,"description":"ระบุอาหารสมบูรณ์ ดินน้ำดี"},{"name":"การค้าเสรี","points":2,"description":"ระบุค้าขายอิสระไม่มีภาษีจังกอบ"},{"name":"การวิเคราะห์หลักฐาน","points":1,"description":"วิเคราะห์จากข้อความจารึกได้ตรงประเด็น"}],"keywords":["ในน้ำมีปลา","ในนามีข้าว","อุดมสมบูรณ์","การค้าเสรี","จังกอบ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.3 ป.4/1', 'อธิบายพัฒนาการของมนุษย์ในดินแดนไทย', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การนับช่วงเวลา ทศวรรษ ศตวรรษ สหัสวรรษ', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายความหมายของคำว่า "ทศวรรษ" "ศตวรรษ" และ "สหัสวรรษ" ว่าหมายถึงรอบเวลากี่ปี และบอกประโยชน์ของการแบ่งช่วงเวลาในการศึกษาประวัติศาสตร์', to_jsonb('คำตอบ:
- ทศวรรษ หมายถึง ช่วงเวลา 10 ปี
- ศตวรรษ หมายถึง ช่วงเวลา 100 ปี
- สหัสวรรษ หมายถึง ช่วงเวลา 1,000 ปี
ประโยชน์: ช่วยให้การระบุช่วงเวลาทางประวัติศาสตร์มีความชัดเจน เข้าใจลำดับเหตุการณ์ และเปรียบเทียบยุคสมัยได้ง่ายขึ้น'::text), '{"full_score":5,"key_solution":"บอกจำนวนปีครบ 3 คำและบอกประโยชน์การศึกษาประวัติศาสตร์","criteria":[{"name":"ระบุรอบปี 10, 100, 1000","points":2.5,"description":"ระบุตัวเลขปีถูกต้องทั้ง 3 คำ"},{"name":"ประโยชน์ในการศึกษาประวัติศาสตร์","points":1.5,"description":"เข้าใจลำดับเหตุการณ์และเปรียบเทียบยุคสมัย"},{"name":"ความถูกต้อง","points":1,"description":"สะกดคำและอธิบายชัดเจน"}],"keywords":["ทศวรรษ","ศตวรรษ","สหัสวรรษ","10 ปี","100 ปี","1,000 ปี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.1 ป.4/1', 'นับช่วงเวลาเป็นทศวรรษ ศตวรรษ และสหัสวรรษ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'แหล่งโบราณคดีบ้านเชียง', 'easy', 'L2', 'essay',
  'แหล่งโบราณคดีบ้านเชียง จังหวัดอุดรธานี มีความสำคัญอย่างไรในประวัติศาสตร์ และค้นพบหลักฐานโบราณคดีที่สำคัญอะไรบ้าง?', to_jsonb('คำตอบ:
ความสำคัญ: เป็นหลักฐานแสดงการตั้งถิ่นฐานของมนุษย์ยุคก่อนประวัติศาสตร์ในดินแดนไทยที่มีอายุกว่าหลายพันปี ได้รับการยกย่องเป็นมรดกโลกทางวัฒนธรรม
หลักฐานสำคัญ: ภาชนะดินเผาเขียนสีลายก้นหอยสีแดงบนพื้นสีนวล โครงกระดูกมนุษย์โบราณ และเครื่องมือเครื่องใช้สำริดและเหล็ก'::text), '{"full_score":5,"key_solution":"ความสำคัญมรดกโลกและภาชนะดินเผาลายก้นหอย","criteria":[{"name":"ความสำคัญทางประวัติศาสตร์","points":2,"description":"ระบุยุคก่อนประวัติศาสตร์และมรดกโลก"},{"name":"หลักฐานที่ค้นพบ","points":2,"description":"ระบุหม้อดินเผาลายก้นหอย โลหะสำริด"},{"name":"ระบุสถานที่","points":1,"description":"จังหวัดอุดรธานี"}],"keywords":["บ้านเชียง","อุดรธานี","ลายก้นหอย","ก่อนประวัติศาสตร์","มรดกโลก"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.2 ป.4/1', 'อธิบายลักษณะสำคัญของหลักฐานในท้องถิ่น', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'วีรกรรมพระยาพิชัยดาบหัก', 'easy', 'L2', 'essay',
  'วีรกรรมของพระยาพิชัยดาบหัก ให้ข้อคิดและคุณธรรมสำคัญในเรื่องใดแก่นักเรียน? จงอธิบาย', to_jsonb('คำตอบ:
พระยาพิชัยดาบหักแสดงถึงคุณธรรมด้าน "ความกล้าหาญ ความเสียสละ และความจงรักภักดีต่อชาติและพระมหากษัตริย์" โดยสู้รบกับข้าศึกจนดาบในมือหักแต่ก็ไม่ยอมถอยหลัง
ข้อคิดที่ได้: สอนให้เรามีความซื่อสัตย์ อดทน มุ่งมั่นต่อหน้าที่ และพร้อมเสียสละประโยชน์ส่วนตนเพื่อส่วนรวมและประเทศชาติ'::text), '{"full_score":5,"key_solution":"ความกล้าหาญ ความจงรักภักดี และข้อคิดความเสียสละ","criteria":[{"name":"วีรกรรมดาบหัก","points":2,"description":"เล่าเหตุการณ์ความกล้าหาญไม่ยอมแพ้"},{"name":"คุณธรรมและข้อคิด","points":2,"description":"ความจงรักภักดี เสียสละเพื่อส่วนรวม"},{"name":"การนำมาปรับใช้","points":1,"description":"มุ่งมั่นในหน้าที่ของตนเอง"}],"keywords":["พระยาพิชัยดาบหัก","ความกล้าหาญ","จงรักภักดี","เสียสละ","หน้าที่"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'วีรกรรมท้าวเทพกระษัตรี ท้าวศรีสุนทร', 'easy', 'L2', 'essay',
  'ท้าวเทพกระษัตรีและท้าวศรีสุนทร มีความสำคัญอย่างไรในประวัติศาสตร์ไทย และใช้วิธีการใดในการปกป้องเมืองถลางจากข้าศึก?', to_jsonb('คำตอบ:
ท่านทั้งสองเป็นวีรสตรีผู้รวบรวมกำลังชาวเมืองถลาง (ภูเก็ต) ต่อสู้ป้องกันเมืองจากกองทัพพม่าในสงครามเก้าทัพ
กลอุบายสำคัญ: ใช้ไหวพริบให้ผู้หญิงแต่งกายเป็นทหารชาย เดินวนเวียนถืออาวุธบนเชิงเทิน ทำให้ข้าศึกสำคัญผิดคิดว่าเมืองถลางมีกำลังทหารหนุนแน่นหนา จนข้าศึกขาดเสบียงและถอยทัพไป'::text), '{"full_score":5,"key_solution":"วีรสตรีเมืองถลางและกลอุบายหญิงแต่งชายลวงข้าศึก","criteria":[{"name":"บทบาทวีรสตรีเมืองถลาง","points":2,"description":"ระบุการป้องกันเมืองถลาง สงครามเก้าทัพ"},{"name":"กลอุบายที่ใช้","points":2,"description":"ระบุให้ผู้หญิงแต่งตัวเป็นทหารลวงข้าศึก"},{"name":"ความถูกต้อง","points":1,"description":"ระบุชื่อเมืองถลาง/ภูเก็ตถูกต้อง"}],"keywords":["ท้าวเทพกระษัตรี","ท้าวศรีสุนทร","เมืองถลาง","กลอุบาย","วีรสตรี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.3 ป.4/2', 'บอกประวัติและผลงานของบุคคลสำคัญ', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'หลักฐานชั้นต้นและหลักฐานชั้นรอง', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกความแตกต่างระหว่าง "หลักฐานชั้นต้น" กับ "หลักฐานชั้นรอง" พร้อมยกตัวอย่างหลักฐานแต่ละประเภทอย่างละ 1 ตัวอย่าง', to_jsonb('คำตอบ:
- หลักฐานชั้นต้น: หลักฐานที่เกิดขึ้นร่วมสมัยกับเหตุการณ์จริง สร้างขึ้นโดยบุคคลที่อยู่ในเหตุการณ์ เช่น ศิลาจารึก จดหมายเหตุ โบราณวัตถุ
- หลักฐานชั้นรอง: หลักฐานที่สร้างขึ้นภายหลังจากเหตุการณ์ โดยผู้เขียนศึกษาค้นคว้าจากหลักฐานชั้นต้น เช่น หนังสือแบบเรียนประวัติศาสตร์ ภาพยนตร์ประวัติศาสตร์'::text), '{"full_score":5,"key_solution":"เปรียบเทียบหลักฐานชั้นต้นและชั้นรองพร้อมตัวอย่าง","criteria":[{"name":"หลักฐานชั้นต้นและตัวอย่าง","points":2,"description":"ระบุร่วมสมัยและยกตัวอย่างศิลาจารึก"},{"name":"หลักฐานชั้นรองและตัวอย่าง","points":2,"description":"ระบุสร้างขึ้นภายหลังและยกตัวอย่างหนังสือเรียน"},{"name":"ความถูกต้อง","points":1,"description":"นิยามถูกต้องตามหลักประวัติศาสตร์"}],"keywords":["หลักฐานชั้นต้น","หลักฐานชั้นรอง","ร่วมสมัย","ศิลาจารึก","หนังสือเรียน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.1 ป.4/3', 'แยกแยะความแตกต่างของหลักฐาน', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'การอนุรักษ์โบราณสถานและโบราณวัตถุ', 'easy', 'L2', 'essay',
  'หากในท้องถิ่นของนักเรียนมีโบราณสถานเก่าแก่อายุนับร้อยปี นักเรียนและชุมชนควรช่วยกันดูแลรักษาอย่างไรเพื่อไม่ให้ชำรุดเสียหาย?', to_jsonb('คำตอบ:
1) ไม่ขีดเขียนชื่อ ข้อความ หรือสลักสิ่งใดลงบนกำแพงและโบราณสถาน
2) ไม่ปีนป่าย หยิบจับ หรือเคลื่อนย้ายก้อนหินและโบราณวัตถุออกจากสถานที่เดิม
3) ช่วยกันรักษาความสะอาด ไม่ทิ้งขยะ และแจ้งเจ้าหน้าที่เมื่อพบเห็นการชำรุดเสียหายหรือการลักลอบขโมย'::text), '{"full_score":5,"key_solution":"แนวทางดูแลรักษาโบราณสถาน 3 ข้อ","criteria":[{"name":"ไม่ขีดเขียนทำลาย","points":1.5,"description":"ระบุไม่เขียนข้อความบนกำแพง"},{"name":"ไม่ปีนป่ายเคลื่อนย้าย","points":1.5,"description":"ระบุไม่ปีนหรือหยิบของออกไป"},{"name":"รักษาความสะอาดและแจ้งเจ้าหน้าที่","points":1,"description":"ทิ้งขยะเป็นที่และเป็นหูเป็นตา"}],"keywords":["โบราณสถาน","ไม่ขีดเขียน","ไม่ปีนป่าย","รักษาความสะอาด","อนุรักษ์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.2 ป.4/2', 'บอกความสำคัญของการอนุรักษ์สิ่งแวดล้อมทางวัฒนธรรม', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'ประวัติศาสตร์', 'ป.4', 'ประโยชน์ของการจัดทำไทม์ไลน์ (Timeline)', 'easy', 'L2', 'essay',
  'การนำเหตุการณ์ทางประวัติศาสตร์มาเรียงลำดับลงบน "เส้นเวลา (Timeline)" มีประโยชน์อย่างไรต่อการเรียนรู้ของนักเรียน?', to_jsonb('คำตอบ:
1) ช่วยให้เห็นภาพรวมของเหตุการณ์และเข้าใจว่าเหตุการณ์ใดเกิดขึ้นก่อนหรือหลังได้อย่างชัดเจน
2) ช่วยให้เข้าใจความสัมพันธ์เชิงเหตุและผล ว่าเหตุการณ์ในอดีตส่งผลต่อเนื่องมาสู่เหตุการณ์ในยุคต่อมาอย่างไร
3) ช่วยให้จดจำช่วงเวลา ยุคสมัย และพัฒนาการของประวัติศาสตร์ได้ง่ายขึ้น'::text), '{"full_score":5,"key_solution":"ประโยชน์ของเส้นเวลา: ลำดับก่อนหลัง ความเป็นเหตุเป็นผล การจำง่าย","criteria":[{"name":"เข้าใจลำดับก่อนหลัง","points":2,"description":"ระบุเห็นลำดับเวลาชัดเจน"},{"name":"เข้าใจความสัมพันธ์เหตุผล","points":2,"description":"เชื่อมโยงเหตุและผลของเหตุการณ์"},{"name":"ช่วยในการจดจำ","points":1,"description":"จดจำได้ง่ายขึ้น"}],"keywords":["เส้นเวลา","Timeline","ลำดับเหตุการณ์","ก่อนหลัง","เหตุและผล"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 4.1 ป.4/1', 'นับช่วงเวลาและจัดลำดับเหตุการณ์', 'e4a29ada-eb6e-493e-b198-869cc54f1edc'::uuid, '🏛️ สมัยสุโขทัย — ไทม์ไลน์', '/games/social/sukhothai-timeline-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การเลือกรับประทานอาหารหลัก 5 หมู่', 'easy', 'L2', 'essay',
  'ให้นักเรียนออกแบบรายการอาหารกลางวัน 1 มื้อ ที่มีสารอาหารครบถ้วนทั้ง 5 หมู่ พร้อมระบุว่าแต่ละอย่างจัดอยู่ในอาหารหมู่ใดและให้ประโยชน์อย่างไร', to_jsonb('ตัวอย่างมื้ออาหาร: "ข้าวราดผัดกะเพราไก่ใส่ถั่วฝักยาว ไข่ต้ม กล้วยน้ำว้า 1 ลูก และน้ำสะอาด"
1) หมู่ 1 (โปรตีน): เนื้อไก่ ไข่ต้ม (ช่วยสร้างกล้ามเนื้อและซ่อมแซมร่างกาย)
2) หมู่ 2 (คาร์โบไฮเดรต): ข้าวสวย (ให้พลังงานหลัก)
3) หมู่ 3 (เกลือแร่): ถั่วฝักยาว ใบกะเพรา (ช่วยระบบขับถ่าย)
4) หมู่ 4 (วิตามิน): กล้วยน้ำว้า (เสริมภูมิต้านทานโรค)
5) หมู่ 5 (ไขมัน): น้ำมันที่ใช้ผัด (ให้ความอบอุ่นแก่ร่างกาย)'::text), '{"full_score":5,"key_solution":"เมนูอาหารมีครบ 5 หมู่ พร้อมระบุสารอาหารและประโยชน์","criteria":[{"name":"เมนูอาหารระบุครบ 5 หมู่","points":3,"description":"แจกแจงอาหารตรงกับหมู่ 1-5 ครบถ้วน"},{"name":"ประโยชน์ของสารอาหาร","points":1,"description":"ระบุประโยชน์โปรตีน คาร์โบไฮเดรต ฯลฯ"},{"name":"ความสมดุลของมื้ออาหาร","points":1,"description":"เป็นอาหารที่ดีต่อสุขภาพจริง"}],"keywords":["5 หมู่","โปรตีน","คาร์โบไฮเดรต","เกลือแร่","วิตามิน","ไขมัน"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 4.1 ป.4/1', 'อธิบายความสำคัญของอาหารหลัก 5 หมู่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ประโยชน์ของการออกกำลังกาย', 'easy', 'L2', 'essay',
  'การออกกำลังกายเป็นประจำอย่างน้อยสัปดาห์ละ 3-5 วัน ส่งผลดีต่อสุขภาพร่างกายและสุขภาพจิตของนักเรียนอย่างไรบ้าง? จงอธิบายมา 2 ด้าน', to_jsonb('คำตอบ:
1) ด้านร่างกาย: ช่วยให้กล้ามเนื้อและกระดูกแข็งแรง หัวใจและปอดทำงานได้ดี ระบบไหลเวียนโลหิตดี และช่วยควบคุมน้ำหนักตัวไม่ให้อ้วน
2) ด้านจิตใจ: ช่วยคลายเครียดจากการเรียน ทำให้อารมณ์แจ่มใส ร่าเริง นอนหลับสบาย และได้ฝึกความมีน้ำใจนักกีฬาเมื่อเล่นร่วมกับเพื่อน'::text), '{"full_score":5,"key_solution":"ผลดี 2 ด้าน: ด้านร่างกายและด้านจิตใจ","criteria":[{"name":"ด้านร่างกาย","points":2,"description":"กล้ามเนื้อแข็งแรง ปอดหัวใจดี"},{"name":"ด้านจิตใจ","points":2,"description":"คลายเครียด อารมณ์ดี หลับสบาย"},{"name":"การสรุป","points":1,"description":"เขียนเป็นระเบียบชัดเจน"}],"keywords":["ออกกำลังกาย","กล้ามเนื้อแข็งแรง","คลายเครียด","สุขภาพจิต","น้ำใจนักกีฬา"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 3.1 ป.4/1', 'ควบคุมตนเองในการเคลื่อนไหวและออกกำลังกาย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การล้างมือ 7 ขั้นตอนป้องกันโรค', 'easy', 'L2', 'essay',
  'ทำไมการล้างมือด้วยสบู่และน้ำสะอาดจึงเป็นวิธีป้องกันเชื้อโรคที่ง่ายและมีประสิทธิภาพที่สุด และนักเรียนควรล้างมือในเวลาใดบ้าง? จงยกตัวอย่าง 2 ช่วงเวลา', to_jsonb('คำตอบ:
ความสำคัญ: มือของเราเป็นอวัยวะที่หยิบจับสิ่งของต่างๆ ตลอดเวลาและสัมผัสเชื้อโรคได้ง่าย การล้างมือด้วยสบู่ช่วยชะล้างและฆ่าเชื้อแบคทีเรียและไวรัสไม่ให้เข้าสู่ร่างกายผ่านการจับอาหารหรือขยี้ตา
ช่วงเวลาที่ควรล้างมือ:
1) ก่อนรับประทานอาหารทุกครั้ง
2) หลังจากเข้าห้องน้ำหรือขับถ่ายเสร็จ'::text), '{"full_score":5,"key_solution":"ความสำคัญของการล้างมือและระบุ 2 ช่วงเวลาสำคัญ","criteria":[{"name":"ความสำคัญการล้างมือ","points":2.5,"description":"ระบุมือสัมผัสเชื้อโรค สบู่ช่วยฆ่าเชื้อ"},{"name":"2 ช่วงเวลาสำคัญ","points":1.5,"description":"ก่อนกินอาหาร และหลังเข้าห้องน้ำ"},{"name":"ความถูกต้อง","points":1,"description":"สอดคล้องกับหลักสุขอนามัย"}],"keywords":["ล้างมือ","สบู่","เชื้อโรค","ก่อนกินอาหาร","หลังเข้าห้องน้ำ"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 4.1 ป.4/1', 'อธิบายสุขบัญญัติแห่งชาติ', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การดูแลรักษาฟันและช่องปาก', 'easy', 'L2', 'essay',
  'การดูแลรักษาฟันให้แข็งแรงและไม่ผุ นักเรียนควรปฏิบัติตนอย่างไรบ้าง? จงบอกวิธีปฏิบัติมา 3 ข้อ', to_jsonb('คำตอบ:
1) แปรงฟันอย่างถูกวิธีอย่างน้อยวันละ 2 ครั้ง (ตอนเช้าและก่อนนอน) ด้วยยาสีฟันผสมฟลูออไรด์
2) หลีกเลี่ยงการรับประทานลูกอม น้ำอัดลม และขนมหวานเหนียวติดฟัน
3) ไปพบทันตแพทย์เพื่อตรวจสุขภาพฟันทุกๆ 6 เดือน'::text), '{"full_score":5,"key_solution":"ดูแลฟัน 3 ข้อ: แปรงฟัน เลี่ยงของหวาน พบทันตแพทย์","criteria":[{"name":"แปรงฟันวันละ 2 ครั้ง","points":1.5,"description":"ระบุแปรงเช้า-ก่อนนอน ฟลูออไรด์"},{"name":"เลี่ยงขนมหวานน้ำอัดลม","points":1.5,"description":"ระบุลูกอม น้ำอัดลม ขนมเหนียว"},{"name":"พบทันตแพทย์ทุก 6 เดือน","points":1,"description":"ตรวจสุขภาพฟันสม่ำเสมอ"}],"keywords":["แปรงฟัน","ฟลูออไรด์","ลูกอม","ทันตแพทย์","ฟันผุ"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 1.1 ป.4/1', 'อธิบายการดูแลสุขภาพร่างกาย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'โทษและพิษภัยของบุหรี่', 'easy', 'L2', 'essay',
  'การสูบบุหรี่ส่งผลเสียต่อสุขภาพของผู้สูบและคนรอบข้าง (ควันบุหรี่มือสอง) อย่างไรบ้าง? ให้นักเรียนอธิบายอันตรายที่เกิดขึ้น', to_jsonb('คำตอบ:
1) ต่อผู้สูบ: ทำลายปอดและหลอดลม เสี่ยงต่อการเป็นโรคมะเร็งปอด โรคถุงลมโป่งพอง โรคหลอดเลือดหัวใจ กลิ่นปากเหม็น ฟันเหลือง
2) ต่อคนรอบข้าง (ควันบุหรี่มือสอง): ผู้ที่สูดดมควันเข้าไปโดยเฉพาะเด็กและคนชรา จะได้รับสารพิษ เช่น สารก่อมะเร็ง นิโคติน ทำให้เกิดโรคทางเดินหายใจและโรคปอดได้เช่นเดียวกับผู้สูบ'::text), '{"full_score":5,"key_solution":"ผลเสียต่อผู้สูบและควันบุหรี่มือสองต่อคนรอบข้าง","criteria":[{"name":"ผลเสียต่อผู้สูบ","points":2,"description":"มะเร็งปอด ถุงลมโป่งพอง หัวใจ"},{"name":"ผลต่อคนรอบข้าง","points":2,"description":"ควันมือสองทำลายระบบหายใจเด็ก"},{"name":"ความตระหนักรู้","points":1,"description":"ชี้ให้เห็นพิษภัยชัดเจน"}],"keywords":["บุหรี่","มะเร็งปอด","ควันบุหรี่มือสอง","นิโคติน","สารพิษ"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 5.1 ป.4/1', 'อธิบายผลเสียของการสูบบุหรี่', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การปฐมพยาบาลบาดแผลถลอก', 'easy', 'L2', 'essay',
  'เมื่อเพื่อนนักเรียนหกล้มในสนามและมีบาดแผลถลอกที่หัวเข่า มีเลือดซึมและเศษทรายติดอยู่ นักเรียนควรมีขั้นตอนการปฐมพยาบาลเบื้องต้นอย่างไร?', to_jsonb('คำตอบ:
1) ล้างแผลด้วยน้ำสะอาดและสบู่อ่อนๆ เพื่อชะล้างเศษทรายและสิ่งสกปรกออก
2) ใช้ผ้าสะอาดหรือสำลีซับแผลให้แห้งอย่างเบามือ
3) เช็ดรอบๆ บาดแผลด้วยแอลกอฮอล์ล้างแผล (ห้ามเช็ดลงบนแผลสด)
4) ทายาฆ่าเชื้อใส่แผลสด เช่น โพวิโดนไอโอดีน (เบตาดีน) และปิดด้วยพลาสเตอร์ยาหากจำเป็น'::text), '{"full_score":5,"key_solution":"ขั้นตอนปฐมพยาบาล: ล้างน้ำ ซับแห้ง ทายาฆ่าเชื้อ ปิดพลาสเตอร์","criteria":[{"name":"ล้างทำความสะอาดแผล","points":2,"description":"ใช้น้ำสะอาดล้างสิ่งสกปรกทราย"},{"name":"ซับแห้งและทายา","points":2,"description":"ซับแห้ง ทายาใส่แผลสด (เบตาดีน)"},{"name":"ความปลอดภัย","points":1,"description":"ไม่ใช้แอลกอฮอล์ราดบนแผลสดตรงๆ"}],"keywords":["ปฐมพยาบาล","แผลถลอก","ล้างน้ำสะอาด","เบตาดีน","พลาสเตอร์"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 5.1 ป.4/2', 'แสดงวิธีปฐมพยาบาล', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การจัดการความเครียดและอารมณ์', 'easy', 'L2', 'essay',
  'เมื่อนักเรียนรู้สึกโกรธหรือไม่สบายใจจากเรื่องต่างๆ นักเรียนมีวิธีจัดการกับอารมณ์ของตนเองอย่างไรเพื่อไม่ให้เกิดการทะเลาะวิวาทหรือทำร้ายผู้อื่น? จงบอกมา 2 วิธี', to_jsonb('คำตอบ:
1) หยุดและนับ 1 ถึง 10 ในใจ หรือสูดหายใจเข้าลึกๆ ช้าๆ เพื่อให้สติกลับมาและอารมณ์เย็นลง
2) เดินเลี่ยงออกจากสถานการณ์นั้น แล้วไปทำกิจกรรมที่ผ่อนคลาย เช่น ฟังเพลง วาดรูป เล่นกีฬา หรือพูดคุยปรึกษาคุณครูหรือผู้ปกครอง'::text), '{"full_score":5,"key_solution":"วิธีควบคุมอารมณ์ 2 วิธี: ตั้งสติ/นับเลข และทำกิจกรรมผ่อนคลาย","criteria":[{"name":"การตั้งสตินับ 1-10","points":2,"description":"ระบุนับ 1-10 สูดหายใจลึก"},{"name":"เดินเลี่ยงทำกิจกรรมผ่อนคลาย","points":2,"description":"ระบุฟังเพลง เล่นกีฬา ปรึกษาผู้ใหญ่"},{"name":"การคิดเชิงบวก","points":1,"description":"แก้ปัญหาอย่างสร้างสรรค์"}],"keywords":["จัดการอารมณ์","นับ 1 ถึง 10","หายใจลึก","ผ่อนคลาย","ไม่รุนแรง"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 2.1 ป.4/1', 'อธิบายการจัดการกับอารมณ์และความเครียด', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ความปลอดภัยในการขี่รถจักรยาน', 'easy', 'L2', 'essay',
  'ในการขี่รถจักรยานมาโรงเรียนให้ปลอดภัย นักเรียนควรมีข้อควรปฏิบัติในการใช้อุปกรณ์ป้องกันและกฎระเบียบบนถนนอย่างไรบ้าง? จงบอกมา 2 ข้อ', to_jsonb('คำตอบ:
1) สวมหมวกนิรภัย (หมวกกันน็อก) สำหรับจักรยานทุกครั้งเพื่อป้องกันการบาดเจ็บที่ศีรษะ
2) ขี่ชิดขอบทางด้านซ้าย ไม่ขี่ซิกแซกหรือแข่งกัน และให้สัญญาณมือก่อนเลี้ยวเสมอ'::text), '{"full_score":5,"key_solution":"สวมหมวกกันน็อกและขี่ชิดซ้าย/ให้สัญญาณมือ","criteria":[{"name":"อุปกรณ์ป้องกัน","points":2,"description":"ระบุสวมหมวกกันน็อก"},{"name":"กฎการขับขี่","points":2,"description":"ระบุชิดซ้าย ให้สัญญาณมือ"},{"name":"ความปลอดภัย","points":1,"description":"ไม่ประมาท"}],"keywords":["จักรยาน","หมวกกันน็อก","ชิดซ้าย","สัญญาณมือ","ปลอดภัย"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 5.1 ป.4/2', 'ปฏิบัติตนเพื่อความปลอดภัย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'การป้องกันตนเองจากคนแปลกหน้า', 'easy', 'L2', 'essay',
  'หากมีคนแปลกหน้าเข้ามาทักทาย ชักชวนขึ้นรถ หรือนำขนมมาให้โดยที่นักเรียนไม่รู้จัก นักเรียนควรปฏิบัติตนอย่างไรเพื่อความปลอดภัย?', to_jsonb('คำตอบ:
1) ปฏิเสธอย่างสุภาพและเด็ดขาดทันที โดยไม่รับขนมหรือสิ่งของ และไม่ยอมขึ้นรถไปด้วยเด็ดขาด
2) รีบเดินหนีไปยังที่ที่มีผู้คนพลุกพล่าน หรือวิ่งไปหาคุณครู พ่อแม่ หรือเจ้าหน้าที่รักษาความปลอดภัย
3) หากถูกจับตัวหรือบังคับ ให้ตะโกนร้องขอความช่วยเหลือเสียงดัง เช่น "ช่วยด้วย ไม่รู้จักคนนี้!"'::text), '{"full_score":5,"key_solution":"ปฏิเสธเด็ดขาด วิ่งไปหาผู้ใหญ่ ตะโกนขอความช่วยเหลือ","criteria":[{"name":"ปฏิเสธไม่รับของไม่ขึ้นรถ","points":2,"description":"ปฏิเสธทันที"},{"name":"หนีไปหาผู้ใหญ่","points":1.5,"description":"วิ่งไปหาครูหรือที่ชุมชน"},{"name":"การขอความช่วยเหลือฉุกเฉิน","points":1.5,"description":"ตะโกนร้องให้คนช่วย"}],"keywords":["คนแปลกหน้า","ปฏิเสธ","ไม่ขึ้นรถ","วิ่งหนี","ช่วยด้วย"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 2.1 ป.4/2', 'หลีกเลี่ยงพฤติกรรมเสี่ยง', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'สุขศึกษา', 'ป.4', 'ประโยชน์ของการดื่มน้ำสะอาดและการพักผ่อน', 'easy', 'L2', 'essay',
  'การดื่มน้ำสะอาดวันละ 6-8 แก้ว และการนอนหลับพักผ่อนอย่างน้อยวันละ 8-10 ชั่วโมง มีความสำคัญต่อการเจริญเติบโตของร่างกายและสมองของเด็กวัยเรียนอย่างไร?', to_jsonb('คำตอบ:
1) การดื่มน้ำสะอาด: ช่วยในการลำเลียงสารอาหาร ช่วยให้ระบบย่อยอาหารและการขับถ่ายทำงานปกติ ผิวพรรณสดใส และช่วยรักษาสมดุลอุณหภูมิร่างกาย
2) การนอนหลับพักผ่อน: เป็นช่วงที่ร่างกายหลั่งฮอร์โมนการเจริญเติบโต (Growth Hormone) ช่วยซ่อมแซมส่วนที่สึกหรอ ทำให้สมองได้พักผ่อน มีความจำดีและตื่นมาสดชื่นพร้อมเรียนรู้'::text), '{"full_score":5,"key_solution":"ประโยชน์ของน้ำและการนอนหลับต่อร่างกายและสมอง","criteria":[{"name":"ประโยชน์ของน้ำ","points":2,"description":"ระบบไหลเวียน ขับถ่าย สมดุลร่างกาย"},{"name":"ประโยชน์ของการนอนหลับ","points":2,"description":"การเจริญเติบโต สมองแจ่มใส ความจำดี"},{"name":"ความเชื่อมโยง","points":1,"description":"ระบุ Growth Hormone หรือการฟื้นฟู"}],"keywords":["ดื่มน้ำ","6-8 แก้ว","นอนหลับ","การเจริญเติบโต","สมอง"]}'::jsonb, ARRAY[]::text[], NULL,
  'พ 1.1 ป.4/1', 'อธิบายการเจริญเติบโตตามวัย', '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b'::uuid, '🧼 ล้างมือ 7 ขั้นตอน', '/games/health/handwash-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'การผสมสีขั้นที่ 2 จากแม่สี', 'easy', 'L2', 'essay',
  'แม่สีขั้นที่ 1 ได้แก่ สีแดง สีเหลือง และสีน้ำเงิน ให้นักเรียนอธิบายว่า เมื่อนำแม่สีทั้งสามมาจับคู่ผสมกันในอัตราส่วนเท่ากัน จะเกิดเป็นสีขั้นที่ 2 สีใดบ้าง?', to_jsonb('คำตอบ:
1) สีแดง + สีเหลือง = สีส้ม
2) สีเหลือง + สีน้ำเงิน = สีเขียว
3) สีแดง + สีน้ำเงิน = สีม่วง
สีขั้นที่ 2 ที่ได้คือ สีส้ม สีเขียว และสีม่วง'::text), '{"full_score":5,"key_solution":"ระบุคู่ผสม 3 คู่: แดง+เหลือง=ส้ม, เหลือง+น้ำเงิน=เขียว, แดง+น้ำเงิน=ม่วง","criteria":[{"name":"คู่ที่ 1 สีส้ม","points":1.5,"description":"แดง+เหลือง = ส้ม"},{"name":"คู่ที่ 2 สีเขียว","points":1.5,"description":"เหลือง+น้ำเงิน = เขียว"},{"name":"คู่ที่ 3 สีม่วง","points":1.5,"description":"แดง+น้ำเงิน = ม่วง"}],"keywords":["แม่สี","สีส้ม","สีเขียว","สีม่วง","การผสมสี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรงและสี', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'การจัดองค์ประกอบภาพและความสมดุล', 'easy', 'L2', 'essay',
  'การวาดภาพระบายสีให้ดูสวยงามและน่าสนใจ "ความสมดุล (Balance)" และ "จุดเด่น (Focal Point)" ในภาพมีความสำคัญอย่างไร? จงอธิบาย', to_jsonb('คำตอบ:
- ความสมดุล: คือการจัดวางน้ำหนักของภาพซ้ายและขวาให้ดูเท่าเทียมกัน ไม่เอียงหรือหนักไปข้างใดข้างหนึ่ง ทำให้ภาพดูมั่นคงสบายตา
- จุดเด่น: คือส่วนที่สำคัญที่สุดของภาพที่ผู้วาดต้องการให้สะดุดตาเป็นสิ่งแรก โดยใช้ขนาดที่ใหญ่กว่า ใช้สีที่เด่นชัด หรือวางไว้ในตำแหน่งที่เหมาะสม'::text), '{"full_score":5,"key_solution":"อธิบายความสมดุลและจุดเด่นในภาพวาด","criteria":[{"name":"ความสมดุล","points":2,"description":"จัดวางน้ำหนักซ้ายขวาให้สมดุล"},{"name":"จุดเด่น","points":2,"description":"ส่วนสำคัญที่สุด สะดุดตา ขนาด/สีเด่น"},{"name":"การใช้ภาษาศิลปะ","points":1,"description":"เข้าใจหลักองค์ประกอบศิลป์"}],"keywords":["ความสมดุล","จุดเด่น","องค์ประกอบภาพ","สวยงาม","ขนาด"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 1.1 ป.4/3', 'จัดระยะ ความลึก น้ำหนักและแสงเงา', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ความแตกต่างของรูป 2 มิติ และรูปทรง 3 มิติ', 'easy', 'L2', 'essay',
  'ให้นักเรียนบอกความแตกต่างระหว่าง "รูปร่าง 2 มิติ" กับ "รูปทรง 3 มิติ" ในงานทัศนศิลป์ พร้อมยกตัวอย่างเปรียบเทียบ 1 คู่', to_jsonb('คำตอบ:
- รูปร่าง 2 มิติ: มีเฉพาะความกว้างและความยาว เป็นภาพแบนราบไม่มีความหนา เช่น รูปสี่เหลี่ยม หรือ รูปวงกลม
- รูปทรง 3 มิติ: มีความกว้าง ความยาว และมีความหนาหรือความลึก มีปริมาตร ดูมีมิติสมจริง เช่น ลูกเต๋า (ทรงลูกบาศก์) หรือ ลูกฟุตบอล (ทรงกลม)
ตัวอย่างเปรียบเทียบ: รูปวงกลม (2 มิติ) แตกต่างจาก ลูกบอลทรงกลม (3 มิติ)'::text), '{"full_score":5,"key_solution":"เปรียบเทียบ 2 มิติ vs 3 มิติ พร้อมยกตัวอย่างคู่เปรียบเทียบ","criteria":[{"name":"รูปร่าง 2 มิติ","points":2,"description":"ระบุกว้าง-ยาว แบนราบ"},{"name":"รูปทรง 3 มิติ","points":2,"description":"ระบุกว้าง-ยาว-หนา/ลึก มีปริมาตร"},{"name":"ตัวอย่างเปรียบเทียบ","points":1,"description":"ยกตัวอย่างวงกลม vs ทรงกลม"}],"keywords":["2 มิติ","3 มิติ","รูปร่าง","รูปทรง","ความลึก","ปริมาตร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 1.1 ป.4/1', 'เปรียบเทียบรูปร่าง รูปทรง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'การจำแนกเครื่องดนตรีไทย 4 ประเภท', 'easy', 'L2', 'essay',
  'เครื่องดนตรีไทยแบ่งออกเป็น 4 ประเภท ได้แก่ ดีด สี ตี เป่า ให้นักเรียนยกตัวอย่างเครื่องดนตรีไทยมาประเภทละ 1 ชนิด พร้อมระบุวิธีทำให้เกิดเสียง', to_jsonb('คำตอบ:
1) ประเภทดีด: "จะเข้" (ใช้ไม้ดีดสะบัดบนสายให้เกิดเสียง)
2) ประเภทสี: "ซอด้วง" (ใช้คันชักเสียดสีกับสาย)
3) ประเภทตี: "ระนาดเอก" (ใช้ไม้ตีลงบนผืนระนาด)
4) ประเภทเป่า: "ขลุ่ยเพียงออ" (ใช้ลมเป่าผ่านรูเป่าทำให้เกิดเสียงกังวาน)'::text), '{"full_score":5,"key_solution":"ยกตัวอย่างเครื่องดนตรี ดีด สี ตี เป่า พร้อมวิธีเกิดเสียง","criteria":[{"name":"ประเภทดีดและสี","points":2,"description":"จะเข้/ซึง และ ซอด้วง/ซออู้"},{"name":"ประเภทตีและเป่า","points":2,"description":"ระนาด/ฆ้อง และ ขลุ่ย/ปี่"},{"name":"วิธีทำให้เกิดเสียง","points":1,"description":"อธิบายการดีด สี ตี เป่า ถูกต้อง"}],"keywords":["เครื่องดนตรีไทย","ดีด","สี","ตี","เป่า","ระนาด","ซอ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 2.1 ป.4/1', 'จำแนกประเภทเครื่องดนตรีไทย', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'อารมณ์และความรู้สึกจากบทเพลง', 'easy', 'L2', 'essay',
  'การฟังเพลงที่มีจังหวะเร็วและทำนองสนุกสนาน แตกต่างจากการฟังเพลงที่มีจังหวะช้าและทำนองนุ่มนวลอย่างไร ในแง่ของอารมณ์ความรู้สึกของผู้ฟัง?', to_jsonb('คำตอบ:
- เพลงจังหวะเร็วทำนองสนุกสนาน: ทำให้ผู้ฟังรู้สึกสดชื่น ตื่นตัว คึกคัก อยากขยับตัวเต้นตาม และคลายความง่วงเหงาซึมเซา
- เพลงจังหวะช้าทำนองนุ่มนวล: ทำให้ผู้ฟังรู้สึกสงบ ผ่อนคลาย สบายใจ ช่วยลดความตึงเครียด และบางครั้งอาจให้ความรู้สึกซาบซึ้งหรือคิดถึง'::text), '{"full_score":5,"key_solution":"เปรียบเทียบอารมณ์เพลงจังหวะเร็ว vs จังหวะช้า","criteria":[{"name":"เพลงจังหวะเร็ว","points":2,"description":"ระบุตื่นตัว สดชื่น สนุกสนาน"},{"name":"เพลงจังหวะช้า","points":2,"description":"ระบุสงบ ผ่อนคลาย ซาบซึ้ง"},{"name":"การบรรยายอารมณ์","points":1,"description":"ใช้คำบรรยายความรู้สึกได้ดี"}],"keywords":["จังหวะเร็ว","จังหวะช้า","สดชื่น","ผ่อนคลาย","อารมณ์เพลง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 2.1 ป.4/3', 'บอกความหมายและอารมณ์ของเพลง', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'คุณค่าและการอนุรักษ์ดนตรีไทย', 'easy', 'L2', 'essay',
  'ดนตรีไทยมีคุณค่าและเอกลักษณ์ที่สำคัญอย่างไร และในฐานะนักเรียน เราจะช่วยอนุรักษ์ดนตรีไทยให้คงอยู่ต่อไปได้อย่างไร?', to_jsonb('คำตอบ:
คุณค่า: เป็นศิลปวัฒนธรรมประจำชาติที่มีประวัติศาสตร์ยาวนาน มีสำเนียงและท่วงทำนองไพเราะอ่อนช้อย สะท้อนถึงภูมิปัญญาไทย
การอนุรักษ์: ตั้งใจเรียนวิชาดนตรีไทยในห้องเรียน ฝึกหัดเล่นเครื่องดนตรีไทย เช่น ขลุ่ยหรืออังกะลุง ร่วมชมการแสดงดนตรีไทย และเผยแพร่ชื่นชมไม่ดูถูกศิลปะของชาติ'::text), '{"full_score":5,"key_solution":"คุณค่าดนตรีไทยและแนวทางอนุรักษ์ของนักเรียน","criteria":[{"name":"คุณค่าและเอกลักษณ์","points":2,"description":"ระบุมรดกภูมิปัญญาและท่วงทำนองไพเราะ"},{"name":"แนวทางอนุรักษ์","points":2,"description":"ฝึกเล่น ชื่นชม และร่วมกิจกรรม"},{"name":"ความภาคภูมิใจ","points":1,"description":"แสดงความภาคภูมิใจในวัฒนธรรมไทย"}],"keywords":["ดนตรีไทย","มรดกชาติ","อนุรักษ์","ฝึกหัด","ภูมิปัญญา"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 2.2 ป.4/1', 'บอกประวัติความเป็นมาและคุณค่าของดนตรี', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ภาษาท่าและนาฏยศัพท์ไทย', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายความหมายของ "นาฏยศัพท์" และยกตัวอย่างท่ารำพื้นฐาน 2 ท่า (เช่น ท่าจีบ หรือ ท่าตั้งวง) พร้อมอธิบายลักษณะของท่าทาง', to_jsonb('คำตอบ:
นาฏยศัพท์: ศัพท์เฉพาะที่ใช้เรียกท่ารำและกิริยาอาการในการแสดงนาฏศิลป์ไทย
ตัวอย่างท่ารำ:
1) ท่าจีบ: ใช้นิ้วหัวแม่มือจรดข้อแรกของนิ้วชี้ นิ้วที่เหลือกรีดตึงและหักข้อมือเข้าหาลำแขน (เช่น จีบหงาย จีบคว่ำ)
2) ท่าตั้งวง: ทอดลำแขนให้โค้งสวยงาม นิ้วทั้งสี่เรียงชิดติดกัน ปลายนิ้วชี้ขึ้น หักข้อมือเข้าหาลำแขน'::text), '{"full_score":5,"key_solution":"ความหมายนาฏยศัพท์และอธิบายท่าจีบกับตั้งวง","criteria":[{"name":"ความหมายนาฏยศัพท์","points":1.5,"description":"ระบุศัพท์เฉพาะที่ใช้ในนาฏศิลป์"},{"name":"อธิบายท่าจีบ","points":1.5,"description":"หัวแม่มือจรดข้อแรกนิ้วชี้ กรีดนิ้ว หักข้อมือ"},{"name":"อธิบายท่าตั้งวง","points":1.5,"description":"แขนโค้ง นิ้วเรียงชิด หักข้อมือ"}],"keywords":["นาฏยศัพท์","ท่าจีบ","ตั้งวง","นาฏศิลป์","หักข้อมือ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 3.1 ป.4/1', 'ระบุทักษะพื้นฐานทางนาฏศิลป์', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'การแสดงโขนและเอกลักษณ์ของไทย', 'easy', 'L2', 'essay',
  'การแสดง "โขน" มีเอกลักษณ์และความโดดเด่นทางศิลปะแตกต่างจากการแสดงละครทั่วไปอย่างไร? จงอธิบาย', to_jsonb('คำตอบ:
เอกลักษณ์ของโขน:
1) ตัวละครฝ่ายยักษ์ ลิง และเทวดา จะสวม "หัวโขน" ปิดหน้าทั้งหมด ทำให้ผู้แสดงต้องสื่อสารอารมณ์ผ่านท่ารำและท่าทางที่สง่างาม
2) มีการพากย์และเจรจาโดยผู้พากย์เสียงแยกต่างหาก มีวงปี่พาทย์ไม้แข็งบรรเลงประกอบเพลงหน้าพาทย์
3) เครื่องแต่งกายวิจิตรงดงามประณีตเลียนแบบเครื่องทรงของกษัตริย์ในราชสำนัก'::text), '{"full_score":5,"key_solution":"เอกลักษณ์โขน: สวมหัวโขน มีผู้พากย์เจรจา เครื่องแต่งกายวิจิตร","criteria":[{"name":"การสวมหัวโขนและท่ารำ","points":2,"description":"ระบุยักษ์ ลิง สวมหัวโขน ใช้ท่ารำสื่อสาร"},{"name":"การพากย์เจรจาและดนตรี","points":1.5,"description":"ระบุผู้พากย์และวงปี่พาทย์"},{"name":"เครื่องแต่งกาย","points":1,"description":"เครื่องทรงวิจิตรงดงาม"}],"keywords":["โขน","หัวโขน","พากย์เจรจา","ปี่พาทย์","นาฏศิลป์ชั้นสูง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 3.2 ป.4/1', 'อธิบายประวัติความเป็นมาของโขน', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'การละเล่นพื้นบ้านไทย', 'easy', 'L2', 'essay',
  'การละเล่นพื้นบ้านของเด็กไทย เช่น มอนซ่อนผ้า ม้าก้านกล้วย หรือ รีรีข้าวสาร ให้ประโยชน์และความสนุกสนานแก่นักเรียนอย่างไรบ้าง? จงบอกมา 2 ข้อ', to_jsonb('คำตอบ:
1) ด้านร่างกาย: ได้เคลื่อนไหว วิ่ง หลบหลีก และออกกำลังกาย ทำให้ร่างกายแข็งแรงและคล่องแคล่ว
2) ด้านสังคมและอารมณ์: ได้เล่นร่วมกับเพื่อน ฝึกความสามัคคี รู้จักการเคารพกติกา มีน้ำใจนักกีฬา และสร้างความสนุกสนานเพลิดเพลินโดยไม่ต้องใช้เงินซื้อของเล่นราคาแพง'::text), '{"full_score":5,"key_solution":"ประโยชน์ 2 ด้าน: ด้านร่างกายและด้านสังคมอารมณ์","criteria":[{"name":"ด้านร่างกายและความแข็งแรง","points":2,"description":"วิ่ง เคลื่อนไหว คล่องแคล่ว"},{"name":"ด้านสังคมความสามัคคี","points":2,"description":"เล่นร่วมกับเพื่อน เคารพกติกา"},{"name":"การยกตัวอย่าง","points":1,"description":"ระบุการละเล่นชัดเจน"}],"keywords":["การละเล่นพื้นบ้าน","มอญซ่อนผ้า","รีรีข้าวสาร","ร่างกาย","สามัคคี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 3.2 ป.4/1', 'บอกประโยชน์ของการละเล่นพื้นบ้าน', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'ศิลปะ', 'ป.4', 'ประโยชน์ของงานศิลปะต่อจิตใจ', 'easy', 'L2', 'essay',
  'การทำงานศิลปะ เช่น การวาดภาพระบายสี หรือการปั้นดินน้ำมัน มีประโยชน์ต่อการพัฒนาสมาธิและความคิดสร้างสรรค์ของนักเรียนอย่างไร?', to_jsonb('คำตอบ:
1) ช่วยฝึกสมาธิและความอดทน: การจดจ่อกับการลงลายเส้น ระบายสี หรือปั้นรูปทรง ทำให้จิตใจนิ่งสงบ ไม่ฟุ้งซ่าน
2) พัฒนาความคิดสร้างสรรค์: ได้ใช้จินตนาการถ่ายทอดเรื่องราวและความรู้สึกออกมาเป็นภาพตามความคิดของตนเองอย่างอิสระ
3) ช่วยผ่อนคลายความเครียดและสร้างความภาคภูมิใจเมื่อสร้างสรรค์ผลงานสำเร็จ'::text), '{"full_score":5,"key_solution":"ประโยชน์ด้านสมาธิ ความคิดสร้างสรรค์ และการผ่อนคลาย","criteria":[{"name":"การฝึกสมาธิ","points":2,"description":"ระบุจิตใจนิ่งสงบ จดจ่อกับงาน"},{"name":"ความคิดสร้างสรรค์จินตนาการ","points":2,"description":"ระบุถ่ายทอดความคิดอิสระ"},{"name":"การผ่อนคลายและความภูมิใจ","points":1,"description":"คลายเครียด ภูมิใจในผลงาน"}],"keywords":["ศิลปะ","สมาธิ","ความคิดสร้างสรรค์","จินตนาการ","ระบายสี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ศ 1.1 ป.4/1', 'บอกประโยชน์ของงานทัศนศิลป์', '068ea5e4-306b-478d-9396-c7632d61fd27'::uuid, '🎶 เครื่องดนตรีไทยและเสียง', '/games/arts/thai-instruments-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ขั้นตอนการกวาดและถูพื้นห้องเรียน', 'easy', 'L2', 'essay',
  'ในการทำความสะอาดเวรประจำวัน ให้นักเรียนบอกขั้นตอนการกวาดและถูพื้นห้องเรียนอย่างถูกวิธีตั้งแต่ต้นจนจบ (เขียน 3-4 ขั้นตอน)', to_jsonb('คำตอบ:
1) ยกเก้าอี้ขึ้นวางคว่ำไว้บนโต๊ะเรียน เพื่อให้พื้นห้องโล่งไม่มีสิ่งกีดขวาง
2) กวาดฝุ่นจากใต้โต๊ะและมุมห้องออกมารวมกันไว้บริเวณกลางห้อง
3) กวาดเศษขยะและฝุ่นผงใส่ที่โกยผง แล้วนำไปทิ้งลงถังขยะ
4) นำไม้ถูพื้นชุบน้ำบิดหมาดๆ ถูพื้นจากด้านในห้องถอยหลังออกมาสู่ประตูห้อง แล้วรอให้พื้นแห้งสนิทก่อนยกลง'::text), '{"full_score":5,"key_solution":"ลำดับขั้นตอนการกวาดและถูพื้นห้องเรียนอย่างถูกต้อง","criteria":[{"name":"การเตรียมพื้นที่และกวาดจากมุม","points":2,"description":"ยกเก้าอี้ กวาดจากมุมมารวมกลางห้อง"},{"name":"การทิ้งขยะและการถูพื้น","points":2,"description":"กวาดใส่ที่โกย ถูถอยหลังสู่ประตู"},{"name":"ความเป็นระเบียบ","points":1,"description":"เขียนเป็นข้อๆ ต่อเนื่อง"}],"keywords":["กวาดพื้น","ถูพื้น","ยกเก้าอี้","ที่โกยผง","ห้องเรียน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'บอกขั้นตอนการทำงานตามกระบวนการ', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การคัดแยกขยะ 4 ประเภท', 'easy', 'L2', 'essay',
  'การคัดแยกขยะในโรงเรียนบ้านคำไผ่แบ่งออกเป็น 4 ถังสี ได้แก่ ถังขยะอินทรีย์/ย่อยสลาย (สีเขียว), ถังขยะรีไซเคิล (สีเหลือง), ถังขยะทั่วไป (สีน้ำเงิน), และถังขยะอันตราย (สีแดง) ให้นักเรียนบอกตัวอย่างขยะที่ต้องทิ้งลงในแต่ละถังสี', to_jsonb('คำตอบ:
1) สีเขียว (ขยะย่อยสลาย/อินทรีย์): เศษอาหาร เศษผัก เปลือกผลไม้ ใบไม้แห้ง
2) สีเหลือง (ขยะรีไซเคิล): ขวดพลาสติก กระป๋องน้ำอัดลม กระดาษ กล่องนม
3) สีน้ำเงิน (ขยะทั่วไป): ซองขนมกรุบกรอบ ถุงพลาสติกเปื้อนเศษอาหาร โฟม หลอดดูด
4) สีแดง (ขยะอันตราย): ถ่านไฟฉาย หลอดไฟ กระป๋องยาฆ่าแมลง ขวดน้ำยาล้างห้องน้ำ'::text), '{"full_score":5,"key_solution":"ระบุตัวอย่างขยะตรงกับถังขยะทั้ง 4 สีถูกต้อง","criteria":[{"name":"สีเขียวและสีเหลือง","points":2.5,"description":"ระบุเศษอาหาร/ผัก และ ขวดพลาสติก/กระดาษ"},{"name":"สีน้ำเงินและสีแดง","points":1.5,"description":"ระบุซองขนม/ถุงพลาสติก และ ถ่านไฟฉาย/หลอดไฟ"},{"name":"ความถูกต้อง","points":1,"description":"ตรงตามมาตรฐานกระทรวงทรัพยากรฯ"}],"keywords":["คัดแยกขยะ","ขยะอินทรีย์","ขยะรีไซเคิล","ขยะอันตราย","4 ถัง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'บอกเหตุผลในการทำงาน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การดูแลรักษาเสื้อผ้าและรองเท้านักเรียน', 'easy', 'L2', 'essay',
  'การดูแลรักษาชุดนักเรียนและรองเท้านักเรียนให้สะอาด เรียบร้อย และใช้งานได้ยาวนาน นักเรียนควรมีวิธีปฏิบัติตนอย่างไรบ้าง? จงบอกมา 3 ข้อ', to_jsonb('คำตอบ:
1) ระมัดระวังไม่ให้เสื้อผ้าเปื้อนขณะรับประทานอาหารหรือเล่นกีฬา และแยกผ้าขาวออกจากผ้าสีก่อนซักเสมอ
2) เมื่อเสื้อผ้าเปียกชื้น ให้ผึ่งลมให้แห้งก่อนนำไปใส่ตะกร้าซักเพื่อป้องกันเชื้อรา
3) ทำความสะอาดรองเท้านักเรียนอย่างสม่ำเสมอ เช่น รองเท้าผ้าใบนำไปซักตากแดด ส่วนรองเท้าหนังใช้แปรงปัดฝุ่นและขัดด้วยยาขัดรองเท้าให้เงางาม'::text), '{"full_score":5,"key_solution":"แนวทางดูแลชุดนักเรียนและรองเท้า 3 ข้อ","criteria":[{"name":"ระวังเปื้อนและแยกผ้าซัก","points":1.5,"description":"ระบุการแยกผ้าขาว-ผ้าสี"},{"name":"ป้องกันความชื้นเชื้อรา","points":1.5,"description":"ผึ่งให้แห้งก่อนซัก"},{"name":"การดูแลรองเท้า","points":1,"description":"ซักตากแดดหรือขัดรองเท้าหนัง"}],"keywords":["ชุดนักเรียน","รองเท้า","แยกผ้า","ขัดรองเท้า","สะอาด"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'บอกขั้นตอนการดูแลของใช้ส่วนตัว', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ขั้นตอนการเพาะเมล็ดผักสวนครัว', 'easy', 'L2', 'essay',
  'ในการปลูกผักบุ้งจีนในแปลงเกษตรของโรงเรียนบ้านคำไผ่ ให้นักเรียนอธิบายขั้นตอนการเตรียมดินและการเพาะเมล็ดอย่างถูกวิธี (เขียน 3 ขั้นตอน)', to_jsonb('คำตอบ:
1) ใช้จอบขุดพรวนดินลึกประมาณ 15-20 เซนติเมตร ตากดินไว้ 5-7 วัน เพื่อฆ่าเชื้อโรคและวัชพืช
2) ผสมปุ๋ยคอกหรือปุ๋ยหมักคลุกเคล้ากับดินเพื่อเพิ่มธาตุอาหาร แล้วยกร่องแปลงผักให้เรียบสม่ำเสมอ
3) โรยเมล็ดผักบุ้งลงในร่องตื้นๆ กลบดินบางๆ แล้วใช้บัวรดน้ำรดน้ำให้ชุ่มชื้นทุกเช้าและเย็น'::text), '{"full_score":5,"key_solution":"ขั้นตอนการปลูกผัก: ขุดพรวนตากดิน ผสมปุ๋ยคอก หยอดเมล็ดรดน้ำ","criteria":[{"name":"ขุดพรวนตากดิน","points":1.5,"description":"ใช้จอบพรวนดินตากแดดฆ่าเชื้อ"},{"name":"ผสมปุ๋ยยกร่อง","points":1.5,"description":"ใส่ปุ๋ยคอกคลุกเคล้าดิน"},{"name":"หยอดเมล็ดและรดน้ำ","points":1,"description":"กลบดินบางๆ ใช้บัวรดน้ำ"}],"keywords":["ปลูกผัก","พรวนดิน","ปุ๋ยคอก","บัวรดน้ำ","แปลงผัก"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานเกษตรอย่างปลอดภัย', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การใช้และเก็บรักษาเครื่องมือเกษตร', 'easy', 'L2', 'essay',
  'เมื่อใช้งาน "จอบ" และ "ช้อนปลูก" เสร็จแล้ว นักเรียนควรทำความสะอาดและเก็บรักษาอย่างไรให้ปลอดภัยและไม่เกิดสนิม?', to_jsonb('คำตอบ:
1) ขูดเศษดินและเศษหญ้าที่ติดอยู่ออกให้หมด แล้วล้างด้วยน้ำสะอาด
2) ใช้ผ้าแห้งเช็ดเครื่องมือให้แห้งสนิทเพื่อป้องกันความชื้น
3) ชโลมหรือทาน้ำมันกันสนิมบริเวณที่เป็นโลหะ
4) นำไปแขวนหรือเก็บเข้าที่ให้เป็นระเบียบ โดยหันคมเครื่องมือเข้าด้านในหรือชี้ลงพื้นเพื่อความปลอดภัย'::text), '{"full_score":5,"key_solution":"ล้างเศษดิน เช็ดให้แห้ง ทาน้ำมันกันสนิม แขวนเข้าที่","criteria":[{"name":"ล้างเศษดิน","points":1.5,"description":"ขูดดินล้างน้ำสะอาด"},{"name":"เช็ดแห้งทาน้ำมันกันสนิม","points":2,"description":"เช็ดแห้ง ทาน้ำมันกันสนิมที่โลหะ"},{"name":"เก็บเข้าที่ปลอดภัย","points":1,"description":"แขวนหันคมเข้าด้านใน"}],"keywords":["จอบ","ช้อนปลูก","ล้างดิน","น้ำมันกันสนิม","เก็บรักษา"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/2', 'ใช้และเก็บรักษาเครื่องมืออย่างปลอดภัย', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การประดิษฐ์ของใช้จากวัสดุเหลือใช้', 'easy', 'L2', 'essay',
  'หากมี "ขวดน้ำพลาสติก" ที่ดื่มน้ำหมดแล้วจำนวนมาก ให้นักเรียนเสนอแนวคิดการนำขวดน้ำมาประดิษฐ์เป็นของใช้ที่มีประโยชน์ในโรงเรียนมา 1 ชิ้น พร้อมบอกขั้นตอนการทำสั้นๆ', to_jsonb('ตัวอย่างชิ้นงาน: "กระถางต้นไม้แขวนรีไซเคิล"
ขั้นตอนการทำ:
1) ล้างทำความสะอาดขวดพลาสติกและลอกฉลากออก
2) ใช้คัตเตอร์หรือกรรไกรตัดเปิดช่องตรงกลางขวด และเจาะรูเล็กๆ ที่ก้นขวดเพื่อระบายน้ำ
3) ตกแต่งทาสีหรือวาดลวดลายรูปสัตว์น่ารักๆ รอบขวด
4) เจาะรูที่หัวท้ายร้อยเชือกแขวน ใส่ดินปลูกและนำต้นไม้หรือผักสวนครัวมาปลูก'::text), '{"full_score":5,"key_solution":"ระบุชิ้นงานและขั้นตอนทำกระถาง/กล่องใส่ของชัดเจน","criteria":[{"name":"ระบุชื่อชิ้นงานสร้างสรรค์","points":1.5,"description":"เช่น กระถางต้นไม้ กล่องใส่ดินสอ"},{"name":"ขั้นตอนการประดิษฐ์","points":2.5,"description":"ตัด เจาะรู ตกแต่ง ร้อยเชือก ปลูกต้นไม้"},{"name":"ประโยชน์ใช้สอย","points":1,"description":"ใช้งานได้จริงในโรงเรียน"}],"keywords":["ขวดพลาสติก","ประดิษฐ์","รีไซเคิล","กระถางต้นไม้","กรรไกร"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/2', 'ฝึกปฏิบัติงานประดิษฐ์', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ประโยชน์ของบัญชีรายรับ-รายจ่าย', 'easy', 'L2', 'essay',
  'การทำบัญชีรายรับ-รายจ่ายส่วนตัว ช่วยปลูกฝังนิสัยรักความประหยัดและส่งผลต่ออนาคตของนักเรียนอย่างไร? จงอธิบาย', to_jsonb('คำตอบ:
การทำบัญชีรายรับ-รายจ่ายช่วยให้นักเรียนมีวินัยทางการเงิน รู้จักคุณค่าของเงินที่ผู้ปกครองหามาอย่างเหน็ดเหนื่อย ทำให้คิดไตร่ตรองก่อนซื้อสิ่งของเสมอ และช่วยสร้างนิสัยการออมเงินตั้งแต่เด็ก เมื่อเติบโตขึ้นจะมีภูมิคุ้มกันทางการเงิน ไม่เป็นหนี้สิน และสามารถพึ่งพาตนเองได้ตามหลักปรัชญาเศรษฐกิจพอเพียง'::text), '{"full_score":5,"key_solution":"อธิบายวินัยทางการเงิน การรู้คุณค่าเงิน และภูมิคุ้มกันในอนาคต","criteria":[{"name":"วินัยทางการเงินและรู้คุณค่าเงิน","points":2.5,"description":"ระบุคิดก่อนซื้อ เห็นความเหนื่อยพ่อแม่"},{"name":"ผลต่ออนาคตและภูมิคุ้มกัน","points":1.5,"description":"ระบุมีเงินออม ไม่เป็นหนี้ พึ่งพาตนเองได้"},{"name":"การเรียบเรียง","points":1,"description":"เชื่อมโยงเศรษฐกิจพอเพียงชัดเจน"}],"keywords":["บัญชีรายรับรายจ่าย","ประหยัด","วินัยทางการเงิน","เงินออม","พอเพียง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'บอกประโยชน์ของการจัดการการเงิน', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'ความปลอดภัยในการใช้เครื่องใช้ไฟฟ้า', 'easy', 'L2', 'essay',
  'การใช้เครื่องใช้ไฟฟ้าในบ้านหรือห้องเรียน (เช่น พัดลม กาต้มน้ำ เตารีด) อย่างปลอดภัยเพื่อป้องกันไฟดูดและอัคคีภัย นักเรียนควรปฏิบัติตามกฎความปลอดภัยใดบ้าง? จงบอกมา 3 ข้อ', to_jsonb('คำตอบ:
1) มือต้องแห้งสนิททุกครั้งก่อนสัมผัสปลั๊กไฟหรือสวิตช์ไฟ ห้ามจับขณะมือเปียกน้ำเด็ดขาด
2) เมื่อต้องการถอดปลั๊ก ให้จับที่ตัวหัวปลั๊กแล้วดึงตรงๆ ห้ามกระตุกที่สายไฟเพราะสายไฟอาจขาดใน
3) ปิดสวิตช์และถอดปลั๊กเครื่องใช้ไฟฟ้าทุกครั้งหลังใช้งานเสร็จ และห้ามเสียบปลั๊กหลายอันในเต้ารับเดียวกันจนไฟเกิน'::text), '{"full_score":5,"key_solution":"กฎความปลอดภัยไฟฟ้า 3 ข้อ: มือแห้ง ดึงที่หัวปลั๊ก ปิดสวิตช์ถอดปลั๊ก","criteria":[{"name":"มือแห้งก่อนจับปลั๊ก","points":1.5,"description":"ห้ามจับปลั๊กขณะมือเปียก"},{"name":"ดึงที่หัวปลั๊กไม่กระตุกสาย","points":1.5,"description":"จับตัวปลั๊กป้องกันสายขาดใน"},{"name":"ปิดสวิตช์ถอดปลั๊กหลังใช้","points":1,"description":"ป้องกันไฟฟ้าลัดวงจร"}],"keywords":["เครื่องใช้ไฟฟ้า","มือเปียก","ถอดปลั๊ก","สายไฟ","ปลอดภัย"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/2', 'ปฏิบัติตามความปลอดภัย', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การทำงานร่วมกับผู้อื่น', 'easy', 'L2', 'essay',
  'ในการทำงานบ้านหรืองานกลุ่มร่วมกับเพื่อนๆ นักเรียนควรปฏิบัติตนอย่างไรเพื่อให้งานสำเร็จเรียบร้อยและทุกคนทำงานร่วมกันอย่างมีความสุข?', to_jsonb('คำตอบ:
1) มีความรับผิดชอบในหน้าที่ที่ได้รับมอบหมาย ทำงานให้เสร็จตรงเวลา ไม่เอาเปรียบเพื่อน
2) มีน้ำใจช่วยเหลือเพื่อนร่วมงานเมื่อเพื่อนต้องการความช่วยเหลือ
3) รับฟังความคิดเห็นของเพื่อน พูดจาสุภาพ และร่วมมือกันแก้ไขปัญหาเมื่อมีข้อผิดพลาดเกิดขึ้น'::text), '{"full_score":5,"key_solution":"รับผิดชอบงานตนเอง มีน้ำใจช่วยเหลือเพื่อน รับฟังและพูดจาสุภาพ","criteria":[{"name":"ความรับผิดชอบต่อหน้าที่","points":2,"description":"ทำงานเสร็จตรงเวลาไม่เอาเปรียบ"},{"name":"มีน้ำใจช่วยเหลือกลุ่ม","points":1.5,"description":"ช่วยเหลือเพื่อนร่วมงาน"},{"name":"การสื่อสารรับฟัง","points":1.5,"description":"พูดสุภาพ รับฟังความเห็น"}],"keywords":["ทำงานกลุ่ม","รับผิดชอบ","มีน้ำใจ","รับฟัง","สามัคคี"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'ทำงานร่วมกับผู้อื่นได้อย่างมีความสุข', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'การงานอาชีพ', 'ป.4', 'การจัดโต๊ะเรียนและกระเป๋านักเรียน', 'easy', 'L2', 'essay',
  'การจัดกระเป๋านักเรียนและโต๊ะเรียนให้เป็นระเบียบเรียบร้อยตามตารางสอนในแต่ละวัน มีประโยชน์ต่อนักเรียนอย่างไรบ้าง? จงอธิบายมา 2 ข้อ', to_jsonb('คำตอบ:
1) ช่วยให้หยิบใช้หนังสือและอุปกรณ์การเรียนได้สะดวก รวดเร็ว ไม่เสียเวลาค้นหา และป้องกันสิ่งของสูญหาย
2) ช่วยลดน้ำหนักของกระเป๋านักเรียน ไม่ต้องแบกหนังสือที่ไม่จำเป็นมาโรงเรียน ช่วยป้องกันอาการปวดหลังและไหล่'::text), '{"full_score":5,"key_solution":"ประโยชน์ 2 ข้อ: หยิบใช้ง่ายไม่สูญหาย และกระเป๋าเบาไม่ปวดหลัง","criteria":[{"name":"หยิบใช้ง่ายและไม่สูญหาย","points":2,"description":"ระบุค้นหาเร็ว อุปกรณ์ไม่หาย"},{"name":"ลดน้ำหนักกระเป๋าป้องกันปวดหลัง","points":2,"description":"ระบุกระเป๋าเบา สุขภาพหลังไหล่ดี"},{"name":"การสรุป","points":1,"description":"เขียนเข้าใจง่ายมีประโยชน์จริง"}],"keywords":["จัดกระเป๋า","ตารางสอน","โต๊ะเรียน","หยิบใช้สะดวก","ไม่ปวดหลัง"]}'::jsonb, ARRAY[]::text[], NULL,
  'ง 1.1 ป.4/1', 'บอกขั้นตอนการจัดระเบียบของใช้', '5ce11c89-0525-41a8-8490-ea0f3c3afc4d'::uuid, '🧵 งานบ้านและงานประดิษฐ์', '/games/career/home-crafts-media-cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การเขียนอัลกอริทึมในชีวิตประจำวัน', 'easy', 'L2', 'essay',
  'ให้นักเรียนเขียน "อัลกอริทึม (ขั้นตอนวิธี)" ในการ "แปรงฟันอย่างถูกวิธี" ตั้งแต่เริ่มต้นจนเสร็จสิ้น มาเป็นข้อๆ อย่างเป็นลำดับขั้นตอน (3-4 ขั้นตอน)', to_jsonb('คำตอบ:
1) เริ่มต้น: หยิบแปรงสีฟัน บีบยาสีฟันผสมฟลูออไรด์ขนาดเท่าเม็ดถั่วเขียวลงบนขนแปรง
2) บ้วนน้ำสะอาด 1 ครั้ง แล้วนำแปรงสีฟันทำมุม 45 องศากับขอบเหงือก ปัดขนแปรงขึ้นลงให้ทั่วฟันบน ฟันล่าง ด้านนอก ด้านใน และฟันกราม
3) แปรงลิ้นเบาๆ เพื่อกำจัดแบคทีเรีย แล้วบ้วนฟองยาสีฟันและล้างปากด้วยน้ำสะอาด
4) สิ้นสุด: ล้างแปรงสีฟันให้สะอาดและเก็บในที่แห้ง'::text), '{"full_score":5,"key_solution":"ขั้นตอนอัลกอริทึมแปรงฟันชัดเจน เป็นลำดับขั้น","criteria":[{"name":"เตรียมแปรงและยาสีฟัน","points":1.5,"description":"บีบยาสีฟัน บ้วนน้ำ"},{"name":"ขั้นตอนการแปรงฟันและลิ้น","points":2,"description":"แปรงฟันทุกซี่ ขอบเหงือก ลิ้น"},{"name":"ล้างปากและเก็บแปรง","points":1.5,"description":"บ้วนปาก ล้างแปรงเก็บเข้าที่"}],"keywords":["อัลกอริทึม","แปรงฟัน","ยาสีฟัน","เป็นขั้นตอน","เริ่มต้น","สิ้นสุด"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/1', 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหาและอธิบายการทำงาน', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ประโยชน์ของคำสั่งวนซ้ำ (Loop)', 'easy', 'L2', 'essay',
  'ในการเขียนโปรแกรมคอมพิวเตอร์ คำสั่งวนซ้ำ (Loop) มีประโยชน์อย่างไรเมื่อเปรียบเทียบกับการเขียนคำสั่งซ้ำๆ เดิมหลายบรรทัด? จงอธิบายและยกตัวอย่าง', to_jsonb('คำตอบ:
ประโยชน์ของคำสั่งวนซ้ำ (Loop):
1) ช่วยให้โค้ดสั้นลง กระชับ อ่านเข้าใจง่าย และไม่เปลืองเนื้อที่หน่วยความจำ
2) ลดความผิดพลาดในการเขียนคำสั่งเดิมซ้ำๆ และแก้ไขได้ง่ายเพียงเปลี่ยนตัวเลขรอบ
ตัวอย่าง: หากต้องการให้หุ่นยนต์เดินหน้า 10 ช่อง แทนที่จะเขียน "เดินหน้า" 10 บรรทัด เราเขียนเพียงคำสั่ง "ทำซ้ำ 10 ครั้ง: เดินหน้า" ซึ่งสะดวกและรวดเร็วกว่ามาก'::text), '{"full_score":5,"key_solution":"อธิบายโค้ดสั้น กระชับ ลดข้อผิดพลาด พร้อมยกตัวอย่างหุ่นยนต์เดินหน้า","criteria":[{"name":"ประโยชน์โค้ดสั้นกระชับ","points":2,"description":"ระบุลดความยาวโค้ด อ่านง่าย"},{"name":"ลดข้อผิดพลาดและแก้ง่าย","points":1.5,"description":"ระบุแก้ตัวเลขจุดเดียวได้"},{"name":"ตัวอย่างเปรียบเทียบชัดเจน","points":1.5,"description":"ยกตัวอย่างทำซ้ำ 10 ครั้ง"}],"keywords":["Loop","คำสั่งวนซ้ำ","โค้ดสั้นลง","ทำซ้ำ","หุ่นยนต์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/2', 'ออกแบบและเขียนโปรแกรมอย่างง่าย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ข้อผิดพลาด (Bug) และการดีบั๊ก (Debugging)', 'easy', 'L2', 'essay',
  'คำว่า "บั๊ก (Bug)" และ "การดีบั๊ก (Debugging)" ในการเขียนโปรแกรมหมายถึงอะไร และหากโปรแกรมที่เขียนทำงานไม่ถูกต้อง นักเรียนมีขั้นตอนการตรวจสอบแก้ไขอย่างไร?', to_jsonb('คำตอบ:
- บั๊ก (Bug): คือข้อผิดพลาด จุดบกพร่อง หรือคำสั่งที่ไม่ถูกต้องในโปรแกรมคอมพิวเตอร์ที่ทำให้โปรแกรมทำงานผิดพลาดหรือไม่ยอมทำงาน
- การดีบั๊ก (Debugging): คือกระบวนการค้นหาจุดผิดพลาดและแก้ไขคำสั่งให้ถูกต้อง
ขั้นตอนการตรวจสอบ: ตรวจสอบคำสั่งทีละบรรทัดตามลำดับ (Step-by-step) สังเกตว่าโปรแกรมหยุดทำงานที่จุดใด แล้วแก้ไขเงื่อนไขหรือค่าตัวเลขที่ผิดพลาด จากนั้นรันโปรแกรมทดสอบใหม่'::text), '{"full_score":5,"key_solution":"นิยาม Bug และ Debugging พร้อมอธิบายการตรวจทีละขั้นตอน","criteria":[{"name":"นิยาม Bug","points":1.5,"description":"ระบุข้อผิดพลาดในโปรแกรม"},{"name":"นิยาม Debugging","points":1.5,"description":"ระบุการตรวจหาและแก้ไขบั๊ก"},{"name":"ขั้นตอนการตรวจสอบทีละขั้น","points":2,"description":"ตรวจทีละบรรทัดและทดสอบใหม่"}],"keywords":["Bug","Debugging","บั๊ก","ดีบั๊ก","ข้อผิดพลาด","ตรวจทีละบรรทัด"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/2', 'ตรวจหาข้อผิดพลาดและแก้ไข', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การตั้งรหัสผ่าน (Password) ที่ปลอดภัย', 'easy', 'L2', 'essay',
  'การตั้งรหัสผ่าน (Password) บัญชีผู้ใช้คอมพิวเตอร์หรืออีเมลให้ปลอดภัยจากการถูกคาดเดาและแฮกข้อมูล ควรมีหลักการตั้งรหัสผ่านอย่างไรบ้าง? จงบอกมา 3 ข้อ', to_jsonb('คำตอบ:
1) มีความยาวอย่างน้อย 8-12 ตัวอักษรขึ้นไป
2) ผสมผสานระหว่างตัวอักษรพิมพ์ใหญ่ (A-Z) ตัวอักษรพิมพ์เล็ก (a-z) ตัวเลข (0-9) และสัญลักษณ์พิเศษ (เช่น #, @, !)
3) ไม่ใช้วันเดือนปีเกิด เบอร์โทรศัพท์ หรือชื่อเล่นของตนเองมาตั้งเป็นรหัสผ่าน และไม่บอกรหัสผ่านแก่ผู้อื่น'::text), '{"full_score":5,"key_solution":"ความยาว 8+ ผสมพิมพ์ใหญ่เล็กตัวเลขสัญลักษณ์ ไม่ใช้วันเกิด/เบอร์โทร","criteria":[{"name":"ความยาวรหัสผ่าน","points":1.5,"description":"ระบุอย่างน้อย 8 ตัวขึ้นไป"},{"name":"ผสมผสานตัวอักษรหลากหลาย","points":2,"description":"ระบุพิมพ์ใหญ่ เล็ก ตัวเลข สัญลักษณ์"},{"name":"ไม่ใช้ข้อมูลส่วนตัวที่เดาง่าย","points":1.5,"description":"ไม่ใช้วันเกิด เบอร์โทร ไม่บอกใคร"}],"keywords":["รหัสผ่าน","Password","ความปลอดภัย","ตัวเลข","สัญลักษณ์","ไม่ใช้วันเกิด"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การป้องกันการกลั่นแกล้งบนไซเบอร์ (Cyberbullying)', 'easy', 'L2', 'essay',
  'การกลั่นแกล้งบนโลกออนไลน์ (Cyberbullying) คืออะไร และหากนักเรียนพบเห็นเพื่อนกำลังถูกล้อเลียนหรือถูกว่าร้ายในกลุ่มแชต นักเรียนควรทำอย่างไร?', to_jsonb('คำตอบ:
ความหมาย: คือการใช้โซเชียลมีเดีย แชต หรืออินเทอร์เน็ตในการล้อเลียน ว่าร้าย ข่มขู่ โพสต์ประจาน หรือสร้างความอับอายให้แก่ผู้อื่น
สิ่งที่ควรทำ:
1) ไม่กดไลก์ ไม่แชร์ และไม่ร่วมพิมพ์ข้อความซ้ำเติมเพื่อน
2) ให้กำลังใจเพื่อนที่ถูกแกล้ง และแนะนำให้บันทึกภาพหน้าจอ (Capture) ไว้เป็นหลักฐาน
3) แจ้งคุณครูประจำชั้นหรือผู้ปกครองให้เข้ามาช่วยดูแลและจัดการปัญหาอย่างถูกต้อง'::text), '{"full_score":5,"key_solution":"ความหมาย Cyberbullying และ 3 แนวทางช่วยเหลือเพื่อน","criteria":[{"name":"ความหมาย Cyberbullying","points":2,"description":"ระบุการแกล้ง ล้อเลียน ข่มขู่ออนไลน์"},{"name":"ไม่แชร์ไม่ซ้ำเติม","points":1.5,"description":"ระบุไม่ส่งต่อ แคปหลักฐาน"},{"name":"แจ้งครูหรือผู้ปกครอง","points":1.5,"description":"แจ้งผู้ใหญ่ช่วยแก้ปัญหา"}],"keywords":["Cyberbullying","กลั่นแกล้งออนไลน์","แคปหลักฐาน","แจ้งคุณครู","ไม่แชร์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'เข้าใจสิทธิและหน้าที่ ป้องกัน Cyberbullying', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การประเมินความน่าเชื่อถือของข้อมูลบนอินเทอร์เน็ต', 'easy', 'L2', 'essay',
  'เมื่อค้นหาข้อมูลบทเรียนบนอินเทอร์เน็ตเพื่อทำรายงาน นักเรียนมีวิธีตรวจสอบอย่างไรว่า ข้อมูลที่พบมีความถูกต้องและน่าเชื่อถือ? จงบอกมา 2 ข้อ', to_jsonb('คำตอบ:
1) ตรวจสอบแหล่งที่มาของเว็บไซต์ ควรมาจากหน่วยงานรัฐบาล การศึกษา หรือองค์กรที่น่าเชื่อถือ (เช่น เว็บไซต์ที่ลงท้ายด้วย .go.th, .ac.th หรือ .org) มีชื่อผู้เขียนและวันที่เผยแพร่ระบุชัดเจน
2) เปรียบเทียบข้อมูลจากเว็บไซต์หรือแหล่งข้อมูลอื่นอย่างน้อย 2-3 แหล่ง ว่ามีเนื้อหาตรงกันและสมเหตุสมผลหรือไม่'::text), '{"full_score":5,"key_solution":"ตรวจสอบแหล่งที่มา (.go.th, .ac.th) และเปรียบเทียบหลายแหล่ง","criteria":[{"name":"ตรวจสอบแหล่งที่มาและผู้เขียน","points":2.5,"description":"ระบุเว็บไซต์น่าเชื่อถือ .go.th .ac.th วันที่"},{"name":"เปรียบเทียบข้อมูลหลายแหล่ง","points":1.5,"description":"เปรียบเทียบ 2-3 เว็บไซต์"},{"name":"การวิเคราะห์ข้อมูล","points":1,"description":"คิดวิเคราะห์ไม่เชื่อทันที"}],"keywords":["ความน่าเชื่อถือ","แหล่งที่มา",".go.th",".ac.th","เปรียบเทียบข้อมูล"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/3', 'ค้นหาและประเมินความน่าเชื่อถือของข้อมูล', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'ผลกระทบของการติดหน้าจอและสมาร์ตโฟน', 'easy', 'L2', 'essay',
  'การเล่นเกมหรือจ้องหน้าจอสมาร์ตโฟนเป็นเวลานานติดต่อกันหลายชั่วโมง ส่งผลเสียต่อสุขภาพกายและการเรียนของนักเรียนอย่างไรบ้าง? จงอธิบายมา 2 ข้อ', to_jsonb('คำตอบ:
1) ด้านสุขภาพกาย: ทำให้สายตาสั้น ตาแห้ง ปวดกระบอกตา และอาจเกิดอาการปวดคอ ปวดหลัง ปวดข้อมือ (Office Syndrome) รวมทั้งทำให้นอนหลับยากขึ้นจากแสงสีฟ้าของหน้าจอ
2) ด้านการเรียน: เสียสมาธิ อ่อนเพลีย ไม่มีเวลาทบทวนบทเรียนและทำการบ้าน ทำให้ผลการเรียนตกต่ำ'::text), '{"full_score":5,"key_solution":"ผลเสีย 2 ด้าน: ด้านสุขภาพตา/ร่างกาย และด้านสมาธิ/การเรียน","criteria":[{"name":"สุขภาพตาและร่างกาย","points":2.5,"description":"สายตาสั้น ตาแห้ง ปวดคอ แสงสีฟ้า"},{"name":"สมาธิและการเรียน","points":1.5,"description":"สมาธิสั้น อ่อนเพลีย เกรดตก"},{"name":"การใช้ภาษา","points":1,"description":"ตรงประเด็นชัดเจน"}],"keywords":["หน้าจอ","สมาร์ตโฟน","สายตา","แสงสีฟ้า","สมาธิ","การเรียน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีอย่างเหมาะสมและปลอดภัย', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'มารยาทในการสื่อสารบนโซเชียลมีเดีย', 'easy', 'L2', 'essay',
  'ในการใช้แอปพลิเคชันส่งข้อความหรือโซเชียลมีเดียพูดคุยกับเพื่อนและคุณครู นักเรียนควรมีมารยาทในการพิมพ์ข้อความอย่างไรบ้าง? จงบอกมา 3 ข้อ', to_jsonb('คำตอบ:
1) ใช้คำพูดที่สุภาพ ถูกต้องตามกาลเทศะ มีคำลงท้าย เช่น "ครับ/ค่ะ" ไม่ใช้คำหยาบคาย
2) ไม่ส่งข้อความหรือโทรติดต่อในเวลาวิกาลหรือดึกเกินไปที่รบกวนเวลาพักผ่อนของผู้อื่น
3) ไม่ส่งต่อข้อมูลที่ไม่เป็นความจริง ข่าวปลอม (Fake News) หรือข้อความลูกโซ่ที่สร้างความตื่นตระหนก'::text), '{"full_score":5,"key_solution":"มารยาทการแชต: ใช้คำสุภาพ ไม่ส่งเวลาดึก ไม่ส่งต่อข่าวปลอม","criteria":[{"name":"ใช้คำสุภาพมีหางเสียง","points":1.5,"description":"ระบุคำสุภาพ ครับ/ค่ะ"},{"name":"ระวังเวลาติดต่อ","points":1.5,"description":"ไม่ส่งเวลาดึกรบกวนผู้อื่น"},{"name":"ไม่ส่งข่าวปลอม Fake News","points":1,"description":"ไม่ส่งต่อข้อมูลเท็จ"}],"keywords":["มารยาทออนไลน์","สุภาพ","เวลาวิกาล","Fake News","แชต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'มีมารยาทในการสื่อสารทางดิจิทัล', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การปกป้องข้อมูลส่วนตัว (Personal Data)', 'easy', 'L2', 'essay',
  'ทำไมข้อมูลส่วนตัว เช่น หมายเลขประจำตัวประชาชน รหัสผ่าน ที่อยู่บ้าน และหมายเลขโทรศัพท์ จึงห้ามเปิดเผยต่อคนแปลกหน้าบนโลกอินเทอร์เน็ต?', to_jsonb('คำตอบ:
เพราะข้อมูลส่วนตัวเหล่านี้สามารถถูกมิจฉาชีพนำไปใช้ในทางมิชอบ เช่น นำไปสวมรอยทำธุรกรรมทางการเงิน แฮกบัญชี ขโมยเงิน หลอกลวงคนอื่นในชื่อของเรา หรืออาจนำมาซึ่งอันตรายถึงตัวเมื่อมิจฉาชีพทราบที่อยู่บ้านและเบอร์โทรศัพท์ ดังนั้นการปกป้องข้อมูลส่วนตัวจึงเป็นการป้องกันตนเองและครอบครัวจากภัยคุกคามทางไซเบอร์'::text), '{"full_score":5,"key_solution":"อธิบายภัยสวมรอย แฮกบัญชี และอันตรายถึงตัว","criteria":[{"name":"ภัยสวมรอยและขโมยเงิน","points":2.5,"description":"มิจฉาชีพสวมรอย แฮกบัญชี โกงเงิน"},{"name":"อันตรายต่อความปลอดภัยในชีวิต","points":1.5,"description":"ทราบที่อยู่บ้าน คุกคามถึงตัว"},{"name":"การสรุป","points":1,"description":"เข้าใจความสำคัญของข้อมูลส่วนบุคคล"}],"keywords":["ข้อมูลส่วนตัว","มิจฉาชีพ","สวมรอย","แฮก","ปลอดภัย"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'ปกป้องข้อมูลส่วนบุคคล', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'เทคโนโลยี', 'ป.4', 'การใช้ AI และเทคโนโลยีช่วยในการเรียนรู้อย่างรู้เท่าทัน', 'easy', 'L2', 'essay',
  'ในปัจจุบันมีเทคโนโลยีปัญญาประดิษฐ์ (AI) และอินเทอร์เน็ตที่ช่วยตอบคำถามได้รวดเร็ว นักเรียนควรนำเทคโนโลยีเหล่านี้มาใช้ประโยชน์ในการเรียนอย่างไร โดยไม่กลายเป็นการพึ่งพาจนขาดความคิดของตนเอง?', to_jsonb('คำตอบ:
1) ใช้ AI เป็น "ผู้ช่วยในการค้นคว้าและอธิบายความรู้" เมื่อไม่เข้าใจบทเรียน เช่น ขอให้อธิบายเรื่องยากๆ ให้เข้าใจง่ายขึ้น
2) ใช้ตรวจสอบแนวคิดหรือหาไอเดียใหม่ๆ ในการทำโครงงาน ไม่ใช่สั่งให้ AI เขียนคำตอบหรือการบ้านให้ทั้งหมดแล้วลอกส่ง
3) ต้องใช้สมองคิดวิเคราะห์ ทบทวนความถูกต้อง และสรุปความรู้ด้วยถ้อยคำของตนเองเสมอ เพื่อให้เกิดความรู้ติดตัวอย่างแท้จริง'::text), '{"full_score":5,"key_solution":"ใช้ AI เป็นผู้ช่วยค้นคว้า ไม่ลอกส่ง คิดวิเคราะห์ด้วยตนเอง","criteria":[{"name":"ใช้เป็นผู้ช่วยค้นคว้าอธิบาย","points":2,"description":"ระบุช่วยอธิบายแนวคิดยากๆ"},{"name":"ไม่ลอกคำตอบส่ง","points":1.5,"description":"ไม่ให้ AI ทำการบ้านแทนทั้งหมด"},{"name":"คิดวิเคราะห์และสรุปด้วยตัวเอง","points":1.5,"description":"ใช้สมองคิดและเขียนด้วยตนเอง"}],"keywords":["AI","ปัญญาประดิษฐ์","ค้นคว้า","ไม่ลอกการบ้าน","คิดวิเคราะห์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ว 4.2 ป.4/4', 'ใช้เทคโนโลยีในการเรียนรู้อย่างสร้างสรรค์', 'b673b26e-4c29-457e-af54-0134246838ec'::uuid, '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', '/games/tech/code-craft/cover.png'
),
(
  'ต้านทุจริต', 'ป.4', 'ผลประโยชน์ส่วนตนและส่วนรวม', 'easy', 'L2', 'essay',
  'ให้นักเรียนอธิบายความแตกต่างระหว่าง "ผลประโยชน์ส่วนตน" กับ "ผลประโยชน์ส่วนรวม" พร้อมยกตัวอย่างสถานการณ์ในโรงเรียนบ้านคำไผ่มาอย่างละ 1 ตัวอย่าง', to_jsonb('คำตอบ:
- ผลประโยชน์ส่วนตน: สิ่งที่เป็นประโยชน์ต่อตนเองหรือครอบครัวเท่านั้น เช่น การตั้งใจเก็บเงินค่าขนมไว้ซื้อหนังสือเรียนของตนเอง
- ผลประโยชน์ส่วนรวม: สิ่งที่เป็นประโยชน์ร่วมกันของทุกคนในสังคมหรือโรงเรียน เช่น พัดลมห้องเรียน สนามกีฬา และน้ำดื่มโรงเรียน
ตัวอย่าง: การช่วยกันปิดไฟห้องเรียนเมื่อเลิกเรียนเป็นประโยชน์ส่วนรวม แต่การนำกระดาษรายงานโรงเรียนกลับไปพับจรวดเล่นที่บ้านเป็นการเบียดเบียนเพื่อประโยชน์ส่วนตน'::text), '{"full_score":5,"key_solution":"อธิบายความต่างของประโยชน์ส่วนตนและส่วนรวมพร้อมตัวอย่างโรงเรียน","criteria":[{"name":"นิยามประโยชน์ส่วนตนและตัวอย่าง","points":2,"description":"ระบุเพื่อตนเองและยกตัวอย่าง"},{"name":"นิยามประโยชน์ส่วนรวมและตัวอย่าง","points":2,"description":"ระบุเพื่อทุกคนและยกตัวอย่างโรงเรียน"},{"name":"การเปรียบเทียบ","points":1,"description":"ชี้ความแตกต่างชัดเจน"}],"keywords":["ผลประโยชน์ส่วนตน","ผลประโยชน์ส่วนรวม","โรงเรียนบ้านคำไผ่","ของส่วนรวม","ปิดไฟ"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'แยกแยะระหว่างประโยชน์ส่วนตนและส่วนรวม', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'ระบบคิดฐานสอง (Digital Thinking)', 'easy', 'L2', 'essay',
  '"ระบบคิดฐานสอง" ในการต้านการทุจริตคืออะไร และช่วยให้นักเรียนตัดสินใจแยกแยะระหว่างความถูกและความผิดได้อย่างไร? จงยกตัวอย่าง 1 สถานการณ์', to_jsonb('คำตอบ:
ระบบคิดฐานสอง (Digital Thinking) คือ การคิดแยกแยะระหว่างเรื่องส่วนตนกับเรื่องส่วนรวมออกจากกันอย่างเด็ดขาด ตัดสินบนพื้นฐานของความ "ถูก หรือ ผิด" "ทำได้ หรือ ทำไม่ได้" โดยไม่มีการประนีประนอมหรือยอมรับการทุจริตเล็กๆ น้อยๆ
ตัวอย่าง: แม้จะเก็บเงินได้เพียง 1 บาทที่ตกอยู่บนพื้นห้องเรียน เราก็คิดแบบฐานสองว่า เงินนี้ไม่ใช่ของเรา จึงเป็นสิ่งที่นำไปใช้เอง "ไม่ได้" และต้องนำส่งคุณครูเพื่อประกาศหาเจ้าของ'::text), '{"full_score":5,"key_solution":"นิยามระบบคิดฐานสอง (ถูก/ผิด เด็ดขาด) พร้อมตัวอย่างเงิน 1 บาท","criteria":[{"name":"นิยามระบบคิดฐานสอง","points":2.5,"description":"ระบุแยกถูก-ผิด ทำได้-ทำไม่ได้ เด็ดขาด"},{"name":"ตัวอย่างสถานการณ์","points":1.5,"description":"ยกตัวอย่างเก็บเงิน 1 บาทส่งครู"},{"name":"การใช้เหตุผล","points":1,"description":"ไม่หยวนต่อความผิดเล็กน้อย"}],"keywords":["ระบบคิดฐานสอง","Digital Thinking","ถูกผิด","ทำได้ทำไม่ได้","ไม่หยวน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ใช้ระบบคิดฐานสองในการแยกแยะ', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'ผลประโยชน์ทับซ้อน (Conflict of Interest)', 'easy', 'L2', 'essay',
  'สถานการณ์ใดที่เรียกว่าเกิด "ผลประโยชน์ทับซ้อน" ขึ้นในโรงเรียน? ให้นักเรียนยกตัวอย่างกรณีสมมุติ 1 กรณีและอธิบายว่าควรแก้ไขอย่างไรให้ถูกต้องเป็นธรรม', to_jsonb('คำตอบ:
กรณีสมมุติ: ก้อยเป็นหัวหน้าห้องและได้รับมอบหมายให้เป็นกรรมการตัดสินการประกวดจัดโต๊ะเรียนที่สะอาดที่สุด หากก้อยแอบให้คะแนนกลุ่มเพื่อนสนิทของตนเองเต็ม ทั้งที่โต๊ะยังสกปรก ถือว่าเกิดผลประโยชน์ทับซ้อน
วิธีแก้ไข: ก้อยต้องปฏิบัติหน้าที่ด้วยความซื่อสัตย์ ยึดเกณฑ์การให้คะแนนที่เป็นกลาง หรือขอถอนตัวจากการตัดสินโต๊ะของกลุ่มเพื่อนสนิทเพื่อให้กรรมการคนอื่นตัดสินแทนอย่างโปร่งใส'::text), '{"full_score":5,"key_solution":"ยกตัวอย่างผลประโยชน์ทับซ้อนและวิธีแก้ไขด้วยความเป็นกลาง","criteria":[{"name":"กรณีสมมุติผลประโยชน์ทับซ้อน","points":2.5,"description":"ระบุความลำเอียงให้พวกพ้อง/ผลประโยชน์ตน"},{"name":"แนวทางแก้ไขอย่างเป็นธรรม","points":1.5,"description":"ระบุยึดเกณฑ์กลาง หรือถอนตัวให้คนอื่นตัดสิน"},{"name":"ความเข้าใจคอนเซ็ปต์","points":1,"description":"เข้าใจ Conflict of Interest ชัดเจน"}],"keywords":["ผลประโยชน์ทับซ้อน","ความเป็นกลาง","ซื่อสัตย์","โปร่งใส","ตัดสิน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'วิเคราะห์ผลประโยชน์ทับซ้อน', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'การไม่แซงคิวและไม่ลอกการบ้าน', 'easy', 'L2', 'essay',
  'ทำไมการ "แซงคิวซื้ออาหาร" หรือการ "ลอกการบ้านเพื่อน" จึงจัดเป็นพฤติกรรมการทุจริต และส่งผลเสียต่อตัวนักเรียนเองอย่างไร?', to_jsonb('คำตอบ:
เพราะเป็นการเอาเปรียบผู้อื่น ละเมิดสิทธิของคนที่มาเข้าแถวก่อน และแสดงถึงความไม่ซื่อสัตย์ต่อตนเองและผู้อื่น
ผลเสียต่อตนเอง:
1) กลายเป็นคนเห็นแก่ตัว ขาดระเบียบวินัย และไม่ได้รับความไว้วางใจจากเพื่อนๆ
2) การลอกการบ้านทำให้สมองไม่ได้ฝึกคิด ไม่เกิดความรู้และความเข้าใจที่แท้จริง เมื่อถึงเวลาสอบก็จะไม่สามารถทำข้อสอบได้ด้วยตนเอง'::text), '{"full_score":5,"key_solution":"อธิบายการเอาเปรียบ และผลเสียต่อจิตสำนึกและการเรียนรู้","criteria":[{"name":"เหตุผลที่เป็นการทุจริต","points":2,"description":"ระบุเอาเปรียบ ละเมิดสิทธิ ไม่ซื่อสัตย์"},{"name":"ผลเสียต่อตนเอง","points":2,"description":"ขาดความรู้ ไม่เข้าใจเนื้อหา ขาดวินัย"},{"name":"การสรุปบทเรียน","points":1,"description":"สะท้อนคิดสร้างสรรค์"}],"keywords":["แซงคิว","ลอกการบ้าน","ทุจริต","เอาเปรียบ","ความซื่อสัตย์"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ปฏิบัติตนตามหลักความซื่อสัตย์สุจริต', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'โมเดล STRONG: จิตพอเพียงต้านทุจริต', 'easy', 'L2', 'essay',
  'หลักการ STRONG: จิตพอเพียงต้านทุจริต มีตัวอักษรสำคัญ เช่น S (Sufficient - พอเพียง) และ T (Transparent - โปร่งใส) ให้นักเรียนอธิบายว่า นักเรียนจะนำความพอเพียงและความโปร่งใสมาใช้ในชีวิตประจำวันได้อย่างไร', to_jsonb('คำตอบ:
1) S - Sufficient (ความพอเพียง): รู้จักพอใจในสิ่งของและเงินค่าขนมที่ตนเองมี ไม่เรียกร้องฟุ่มเฟือย ไม่โลภอยากได้ของเพื่อน และไม่ขโมยหรือคดโกงเพื่อให้ได้มา
2) T - Transparent (ความโปร่งใส): ทำงานและกิจกรรมต่างๆ อย่างตรงไปตรงมา ตรวจสอบได้ เช่น การทำหน้าที่เหรัญญิกห้องเก็บเงินค่าห้อง ต้องทำบัญชีรายรับรายจ่ายเปิดเผยให้เพื่อนทุกคนดูได้ตลอดเวลา'::text), '{"full_score":5,"key_solution":"อธิบายการนำ S (พอเพียง) และ T (โปร่งใส) มาใช้ในชีวิตจริง","criteria":[{"name":"S - ความพอเพียง","points":2,"description":"พอใจในสิ่งที่ตนมี ไม่โลภ ไม่คดโกง"},{"name":"T - ความโปร่งใส","points":2,"description":"ตรงไปตรงมา ตรวจสอบได้ ทำบัญชีแจกแจง"},{"name":"ความเข้าใจโมเดล STRONG","points":1,"description":"สอดคล้องกับหลักสูตร ป.ป.ช."}],"keywords":["STRONG","พอเพียง","โปร่งใส","ตรวจสอบได้","ต้านทุจริต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ประยุกต์ใช้โมเดล STRONG', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'การเก็บสิ่งของตกหล่นและนำส่งคืน', 'easy', 'L2', 'essay',
  'เมื่อนักเรียนพบกระเป๋าสตางค์หรือโทรศัพท์มือถือของผู้อื่นตกอยู่ใต้โต๊ะหรือในสนามโรงเรียน นักเรียนควรปฏิบัติตนอย่างไร และการกระทำนั้นสะท้อนถึงคุณธรรมใด?', to_jsonb('คำตอบ:
สิ่งที่ควรปฏิบัติ: ไม่หยิบมาเป็นของตนเอง ไม่แอบเปิดเอาเงินข้างใน แต่ให้เก็บและนำไปส่งมอบให้คุณครูประจำชั้นหรือคุณครูเวรทันที เพื่อประกาศหาเจ้าของที่แท้จริง
คุณธรรมที่สะท้อน: สะท้อนถึง "ความซื่อสัตย์สุจริต การมีจิตสาธารณะ และความเห็นอกเห็นใจผู้อื่น" เพราะตระหนักดีว่าเจ้าของของที่ทำหายย่อมมีความเดือดร้อนและกังวลใจ'::text), '{"full_score":5,"key_solution":"ขั้นตอนนำส่งครูเพื่อหาเจ้าของ และสะท้อนความซื่อสัตย์เห็นใจผู้อื่น","criteria":[{"name":"การปฏิบัติส่งมอบครู","points":2.5,"description":"ระบุไม่นำมาเป็นของตน นำส่งครูประกาศหา"},{"name":"คุณธรรมที่สะท้อน","points":1.5,"description":"ระบุความซื่อสัตย์ สุจริต เห็นใจผู้อื่น"},{"name":"จิตสำนึกที่ดี","points":1,"description":"แสดงความเป็นพลเมืองดี"}],"keywords":["เก็บของได้","ส่งคุณครู","ความซื่อสัตย์","เห็นอกเห็นใจ","สุจริต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ปฏิบัติตนด้วยความซื่อสัตย์สุจริต', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'การใช้ทรัพยากรส่วนรวมของโรงเรียน', 'easy', 'L2', 'essay',
  'การใช้น้ำประปา ไฟฟ้า และอุปกรณ์กีฬาของโรงเรียนบ้านคำไผ่อย่างคุ้มค่าและไม่เบียดเบียนของส่วนรวม นักเรียนควรมีแนวทางปฏิบัติอย่างไรบ้าง? จงบอกมา 3 ข้อ', to_jsonb('คำตอบ:
1) ปิดก๊อกน้ำให้สนิททุกครั้งหลังล้างมือหรือแปรงฟันเสร็จ ไม่เปิดน้ำทิ้งไว้เล่น
2) ปิดสวิตช์ไฟและพัดลมทุกตัวในห้องเรียนเมื่อหมดชั่วโมงเรียนหรือไม่มีคนอยู่ในห้อง
3) ใช้ลูกบอลและอุปกรณ์กีฬาด้วยความระมัดระวัง ไม่เตะอัดกำแพงจนพัง และนำไปเก็บเข้าตู้เก็บอุปกรณ์คืนที่เดิมทุกครั้งหลังเล่นเสร็จ'::text), '{"full_score":5,"key_solution":"แนวทางดูแลของส่วนรวม 3 ด้าน: น้ำ ไฟ อุปกรณ์กีฬา","criteria":[{"name":"การใช้น้ำประปา","points":1.5,"description":"ปิดก๊อกน้ำสนิท ไม่เปิดทิ้ง"},{"name":"การใช้ไฟฟ้า","points":1.5,"description":"ปิดไฟพัดลมเมื่อไม่ใช้งาน"},{"name":"การใช้อุปกรณ์กีฬา","points":1,"description":"ระมัดระวังและเก็บคืนที่เดิม"}],"keywords":["ของส่วนรวม","ปิดก๊อกน้ำ","ปิดไฟ","อุปกรณ์กีฬา","โรงเรียนบ้านคำไผ่"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ดูแลรักษาทรัพย์สินส่วนรวม', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'ความโปร่งใสในการเลือกตั้งประธานนักเรียน', 'easy', 'L2', 'essay',
  'การเลือกตั้งประธานนักเรียนของโรงเรียนบ้านคำไผ่ เพื่อให้ได้ผู้นำที่ดีและกระบวนการมีความโปร่งใส ไม่มีการทุจริต นักเรียนในฐานะผู้ลงคะแนนและกรรมการควรปฏิบัติตนอย่างไร?', to_jsonb('คำตอบ:
- ผู้ลงคะแนน: เลือกผู้สมัครจากความรู้ ความสามารถ ความซื่อสัตย์ และนโยบายที่เป็นประโยชน์ ไม่เลือกเพราะได้รับขนมหรือเป็นเพื่อนสนิท
- กรรมการเลือกตั้ง: ตรวจนับคะแนนอย่างเปิดเผยต่อหน้าทุกคน ไม่แก้ไขบัตรลงคะแนน และสรุปผลคะแนนอย่างตรงไปตรงมาตามความจริง'::text), '{"full_score":5,"key_solution":"บทบาทผู้ลงคะแนนเลือกคนดี และกรรมการนับคะแนนเปิดเผยตรงไปตรงมา","criteria":[{"name":"บทบาทผู้ลงคะแนน","points":2,"description":"เลือกคนดี มีความสามารถ ไม่รับสินบน"},{"name":"บทบาทกรรมการ","points":2,"description":"นับคะแนนเปิดเผย ไม่แก้ไขบัตร โปร่งใส"},{"name":"จิตสำนึกประชาธิปไตย","points":1,"description":"สร้างวัฒนธรรมสุจริต"}],"keywords":["เลือกตั้ง","ประธานนักเรียน","โปร่งใส","คนดี","นับคะแนน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.2 ป.4/1', 'มีส่วนร่วมในกระบวนการเลือกตั้งตามวิถีประชาธิปไตย', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'ความละอายและความไม่ทนต่อการทุจริต', 'easy', 'L2', 'essay',
  'คำว่า "ความละอายและความไม่ทนต่อการทุจริต" มีความหมายอย่างไร และหากนักเรียนเห็นเพื่อนแอบหยิบเงินของครูไป นักเรียนควรทำอย่างไร?', to_jsonb('คำตอบ:
ความหมาย: ความละอายใจต่อบาปและความผิด (หิริ) แม้ไม่มีใครเห็นก็ไม่ยอมทำชั่ว และความไม่ทนต่อการโกง คือไม่ยอมนิ่งเฉยเมื่อพบเห็นการกระทำความผิดที่สร้างความเดือดร้อนให้ส่วนรวม
การปฏิบัติเมื่อเห็นเพื่อนขโมยเงิน: ไม่ช่วยเพื่อนปกปิดความผิด ไม่รับส่วนแบ่ง แต่ตักเตือนให้เพื่อนนำเงินไปคืนครู หรือรีบไปแจ้งคุณครูอย่างลับๆ ทันทีเพื่อให้คุณครูตักเตือนและช่วยเหลือเพื่อนแก้ไขพฤติกรรม'::text), '{"full_score":5,"key_solution":"อธิบายความละอายใจ/ไม่ทนต่อการโกง และการแก้ปัญหาเมื่อเพื่อนขโมยเงิน","criteria":[{"name":"นิยามความละอายและไม่ทน","points":2.5,"description":"ระบุละอายใจไม่ทำผิด และไม่นิ่งเฉยเมื่อพบการโกง"},{"name":"การแก้ปัญหาเมื่อเห็นเพื่อนขโมย","points":1.5,"description":"ไม่ปกปิด ตักเตือน หรือแจ้งครูช่วยเหลือ"},{"name":"คุณธรรมความกล้าหาญ","points":1,"description":"กล้าทำสิ่งที่ถูกต้อง"}],"keywords":["ความละอาย","ไม่ทนต่อการทุจริต","ขโมยเงิน","แจ้งคุณครู","ตักเตือน"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'มีความละอายและความไม่ทนต่อการทุจริต', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
),
(
  'ต้านทุจริต', 'ป.4', 'การสร้างสังคมสุจริตเริ่มที่ตัวเรา', 'easy', 'L2', 'essay',
  '"การสร้างสังคมสุจริตและประเทศไทยไร้ทุจริต ต้องเริ่มต้นจากตัวเราเองที่บ้านและโรงเรียน" นักเรียนเห็นด้วยกับคำกล่าวนี้หรือไม่ เพราะเหตุใด? จงอธิบาย', to_jsonb('คำตอบ:
เห็นด้วยอย่างยิ่ง เพราะสังคมและประเทศชาติประกอบขึ้นจากบุคคลทุกคน หากเราเริ่มต้นปลูกฝังความซื่อสัตย์ ความมีวินัย และการเคารพสิทธิผู้อื่นตั้งแต่ยังเป็นเด็กในครอบครัวและโรงเรียนบ้านคำไผ่ เราจะเติบโตเป็นผู้ใหญ่ที่ไม่โกง ไม่คดโกงเงินหลวง และมีความรับผิดชอบต่อส่วนรวม เมื่อทุกคนในสังคมมีจิตสำนึกสุจริต สังคมไทยก็จะเจริญก้าวหน้า สงบสุข และปราศจากการคอร์รัปชันอย่างยั่งยืน'::text), '{"full_score":5,"key_solution":"เห็นด้วย และอธิบายการปลูกฝังจิตสำนึกจากเด็กสู่ผู้ใหญ่พัฒนาชาติ","criteria":[{"name":"แสดงความเห็นด้วยและเหตุผล","points":2.5,"description":"บุคคลคือรากฐานของสังคม ปลูกฝังแต่เด็ก"},{"name":"ผลต่อสังคมและประเทศชาติ","points":1.5,"description":"โตไปไม่โกง สังคมสงบสุขไร้คอร์รัปชัน"},{"name":"การเรียบเรียงภาษา","points":1,"description":"ลึกซึ้งและแสดงพลังบวก"}],"keywords":["สังคมสุจริต","เริ่มต้นที่ตัวเรา","โรงเรียนบ้านคำไผ่","ซื่อสัตย์","ไร้ทุจริต"]}'::jsonb, ARRAY[]::text[], NULL,
  'ส 2.1 ป.4/1', 'ปฏิบัติตนตามหลักความซื่อสัตย์สุจริตเพื่อพัฒนาสังคม', '302a9639-7d4d-4433-9e86-233900dc28bc'::uuid, '♻️ คัดแยกขยะ 4 ถัง', '/images/virtue-bank.png'
);
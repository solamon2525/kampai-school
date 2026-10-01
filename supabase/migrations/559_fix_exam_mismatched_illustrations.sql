-- ============================================================================
-- Migration 559: Fix Mismatched Exam Illustrations & Enrich Visual Exam Bank
-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 2551
-- 1. อัปเดตภาพประกอบจริงตรงโจทย์สำหรับข้อสอบวิชาการงานอาชีพ ป.4 (ชุด PIN 1111 และข้อสอบเครื่องมือ)
-- 2. เคลียร์ภาพปกเกมซ้ำซ้อน (media_image_url = NULL) ออกจากข้อสอบทฤษฎีทุกวิชา
-- 3. ซิงค์ตาราง exam_sets (โดยเฉพาะ PIN 1111) ให้ข้อสอบใน Snapshot แสดงผลภาพใหม่ทันที
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ส่วนที่ 1: อัปเดตภาพประกอบจริงสำหรับข้อสอบวิชาการงานอาชีพ ป.4 (20 ข้อชุด PIN 1111)
-- ----------------------------------------------------------------------------
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/coconut-broom.webp',
    media_title = 'ภาพประกอบ: ไม้กวาดทางมะพร้าวมีด้าม'
WHERE id = '780a1615-d3ba-4ac7-a30d-479d289ac4cd'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/grass-broom.webp',
    media_title = 'ภาพประกอบ: ไม้กวาดดอกหญ้า'
WHERE id = '313deab1-5bde-4bb8-9a55-4522efb4e774'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/mop-bucket.webp',
    media_title = 'ภาพประกอบ: ไม้ถูพื้นและถังน้ำ'
WHERE id = '99dab586-a7d5-4613-9bce-5168884d9922'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/mopping-backwards.webp',
    media_title = 'ภาพประกอบ: การถูพื้นห้องเดินถอยหลัง'
WHERE id = 'ed7eee2d-317f-48ee-8906-1b9fd693fb0d'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/dishwashing.webp',
    media_title = 'ภาพประกอบ: การล้างจานชามและฟองน้ำ'
WHERE id = '14621b92-9b94-4f65-8be7-ba591a01b950'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/dish-drying-rack.webp',
    media_title = 'ภาพประกอบ: ตะแกรงคว่ำจานชาม'
WHERE id = '7f6d0bbe-4ff6-4799-9306-b0e72acb8859'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/laundry-sorting.webp',
    media_title = 'ภาพประกอบ: การแยกผ้าขาวและผ้าสีก่อนซัก'
WHERE id = 'dfc85250-9316-47b9-ae2b-cc71ea177fbf'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/clothes-mud-soak.webp',
    media_title = 'ภาพประกอบ: การแช่ผ้าเปื้อนโคลนก่อนซัก'
WHERE id = '6dcbd7df-3bb1-4390-a89b-0f911b9f23a3'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/clothes-drying-shade.webp',
    media_title = 'ภาพประกอบ: การตากผ้ากลับด้านในที่ร่ม'
WHERE id = 'bf5254bb-6be6-42c6-9da3-4fb36612e8e1'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/wardrobe-organized.webp',
    media_title = 'ภาพประกอบ: การจัดตู้เสื้อผ้าเป็นระเบียบ'
WHERE id = '8efaaccc-dad1-4baf-8868-1445d555ae4b'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/pencil-case.webp',
    media_title = 'ภาพประกอบ: กล่องดินสอและเครื่องเขียน'
WHERE id = 'cfa1a6d2-6e16-4332-a18c-2d7c2a4e3adc'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/schoolbag-schedule.webp',
    media_title = 'ภาพประกอบ: การจัดกระเป๋าตามตารางเรียน'
WHERE id = '97932f08-4c19-41cb-8a65-d0a22ce05bec'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/courtyard-sweeping.webp',
    media_title = 'ภาพประกอบ: การช่วยกวาดลานบ้าน'
WHERE id = 'a5d51ab2-692b-4c67-bee7-4f01cc1a7bc3'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/toilet-brush.webp',
    media_title = 'ภาพประกอบ: แปรงขัดโถสุขภัณฑ์'
WHERE id = '05eec797-00bf-4d64-b623-7a65af84554d'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/sneakers-wash.webp',
    media_title = 'ภาพประกอบ: การซักรองเท้าผ้าใบ'
WHERE id = '1cd27296-c9dd-45a8-9a7d-c3c30f7dbb4d'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/cleaning-rag.webp',
    media_title = 'ภาพประกอบ: ผ้าขี้ริ้วซักสะอาดตากแห้ง'
WHERE id = 'a43d055f-9076-4840-834a-a92d333f97be'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/garden-hose.webp',
    media_title = 'ภาพประกอบ: สายยางรดน้ำต้นไม้'
WHERE id = 'c2758572-f209-4717-b3b1-a7d0b2a14b37'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/bed-making.webp',
    media_title = 'ภาพประกอบ: การเก็บที่นอนและพับผ้าห่ม'
WHERE id = 'a07dd1ba-594a-4a9f-9488-87e986affcb2'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/vegetable-garden.webp',
    media_title = 'ภาพประกอบ: แปลงผักสวนครัว'
WHERE id = 'e716b078-afa2-4ec6-b1b4-e5bd0e344876'::uuid;
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/family-cooperation.webp',
    media_title = 'ภาพประกอบ: การทำงานร่วมกันในครอบครัว'
WHERE id = '8d0f3cf1-8636-4ee1-a1be-d65d70f75212'::uuid;

-- อัปเดตคำถามเครื่องมือเกษตรอื่นๆ ในคลังข้อสอบการงานอาชีพ
UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/hoe-digging.webp',
    media_title = 'ภาพประกอบ: จอบขุดดินและดายหญ้า'
WHERE subject = 'การงานอาชีพ' AND question_text LIKE '%จอบ%' AND (media_image_url IS NULL OR media_image_url LIKE '%cover%');

UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/transplanting-trowel.webp',
    media_title = 'ภาพประกอบ: ช้อนปลูก'
WHERE subject = 'การงานอาชีพ' AND question_text LIKE '%ช้อนปลูก%' AND (media_image_url IS NULL OR media_image_url LIKE '%cover%');

UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/cultivating-fork.webp',
    media_title = 'ภาพประกอบ: ส้อมพรวนดิน'
WHERE subject = 'การงานอาชีพ' AND question_text LIKE '%ส้อมพรวน%' AND (media_image_url IS NULL OR media_image_url LIKE '%cover%');

UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/watering-can.webp',
    media_title = 'ภาพประกอบ: บัวรดน้ำ'
WHERE subject = 'การงานอาชีพ' AND question_text LIKE '%บัวรดน้ำ%' AND (media_image_url IS NULL OR media_image_url LIKE '%cover%');

UPDATE public.exam_questions
SET media_image_url = '/games/career/illustrations/waste-sorting-4bins.webp',
    media_title = 'ภาพประกอบ: ถังขยะ 4 สี แยกประเภท'
WHERE subject = 'การงานอาชีพ' AND (question_text LIKE '%ถังขยะ%' OR question_text LIKE '%คัดแยกขยะ%') AND (media_image_url IS NULL OR media_image_url LIKE '%cover%');

-- ----------------------------------------------------------------------------
-- ส่วนที่ 2: เคลียร์ภาพปกเกมซ้ำซ้อนออกจากข้อสอบทฤษฎีทั่วไปทุกวิชา
-- (คงเฉพาะภาพประกอบจริงที่ตรงกับเนื้อหา เช่น ภาษาอังกฤษ ENGPIC60 และการงานอาชีพชุดใหม่)
-- ----------------------------------------------------------------------------
UPDATE public.exam_questions
SET media_image_url = NULL,
    media_title = NULL
WHERE media_image_url IS NOT NULL
  AND (
    media_image_url ILIKE '%cover%'
    OR media_image_url LIKE '%/images/virtue-bank.png%'
    OR media_image_url LIKE '%educational-hub/shared/covers/%'
  );

-- ----------------------------------------------------------------------------
-- ส่วนที่ 3: ซิงค์ Snapshot คำถามในตาราง exam_sets (โดยเฉพาะชุด PIN 1111 และชุดอื่นๆ)
-- ปรับให้ snapshot อ่านค่า media_image_url และ media_title ใหม่จาก exam_questions
-- ----------------------------------------------------------------------------
UPDATE public.exam_sets es
SET questions = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(
        elem,
        '{media_image_url}',
        COALESCE(to_jsonb(eq.media_image_url), 'null'::jsonb)
      ),
      '{media_title}',
      COALESCE(to_jsonb(eq.media_title), 'null'::jsonb)
    )
  )
  FROM jsonb_array_elements(es.questions) elem
  LEFT JOIN public.exam_questions eq ON eq.id = (elem->>'id')::uuid
)
WHERE es.questions IS NOT NULL
  AND jsonb_typeof(es.questions) = 'array';

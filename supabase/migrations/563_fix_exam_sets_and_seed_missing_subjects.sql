-- Migration 563: Fix exam sets and seed missing standard subjects
-- 1. Fix typo in Social Studies set title ('แบบทดสอบสังคมศึกษา ป.4 ( ข้อ)' -> 'แบบทดสอบสังคมศึกษา ป.4 (20 ข้อ)')
-- 2. Update Art set PIN 4444 to have full 20 questions from exam_questions (was previously 4 questions)
-- 3. Seed standard 20-question sets for Math (PIN 8888), Thai (PIN 9999), and Health (PIN 1001)

-- 1. Fix typo in Social Studies set title
UPDATE exam_sets
SET title = 'แบบทดสอบสังคมศึกษา ป.4 (20 ข้อ)'
WHERE pin_code = '3333' OR id = 'c603f1f8-1590-47bf-a2cd-a7ada1b42afb';

-- 2. Populate complete 20 art questions for Art set PIN 4444
UPDATE exam_sets
SET questions = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'subject', subject,
      'grade', grade,
      'topic', topic,
      'difficulty', difficulty,
      'bloom_level', bloom_level,
      'question_type', question_type,
      'question_text', question_text,
      'options', options,
      'answer', answer,
      'accepted_answers', accepted_answers,
      'rubric', rubric,
      'indicator_id', indicator_id,
      'indicator_code', indicator_code,
      'indicator_desc', indicator_desc,
      'media_item_id', media_item_id,
      'media_title', media_title,
      'media_image_url', media_image_url,
      'explanation', explanation
    )
  )
  FROM (
    SELECT * FROM exam_questions
    WHERE grade = 'ป.4' AND subject = 'ศิลปะ'
    ORDER BY id
    LIMIT 20
  ) q
)
WHERE pin_code = '4444' OR id = '60e45465-ecab-496d-9a23-bcb74de6cd15';

-- 3. Seed standard Mathematics set (PIN 8888, 20 questions)
INSERT INTO exam_sets (
  title, subject, grade, time_limit_minutes, pass_threshold_pct, pin_code, is_active, questions
)
SELECT
  'แบบทดสอบคณิตศาสตร์ ป.4 (20 ข้อ)',
  'คณิตศาสตร์',
  'ป.4',
  60,
  50,
  '8888',
  true,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'subject', subject,
        'grade', grade,
        'topic', topic,
        'difficulty', difficulty,
        'bloom_level', bloom_level,
        'question_type', question_type,
        'question_text', question_text,
        'options', options,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'rubric', rubric,
        'indicator_id', indicator_id,
        'indicator_code', indicator_code,
        'indicator_desc', indicator_desc,
        'media_item_id', media_item_id,
        'media_title', media_title,
        'media_image_url', media_image_url,
        'explanation', explanation
      )
    )
    FROM (
      SELECT * FROM exam_questions
      WHERE grade = 'ป.4' AND subject = 'คณิตศาสตร์'
      ORDER BY id
      LIMIT 20
    ) q
  )
WHERE NOT EXISTS (
  SELECT 1 FROM exam_sets WHERE pin_code = '8888' OR (subject = 'คณิตศาสตร์' AND grade = 'ป.4' AND is_active = true)
);

-- 4. Seed standard Thai Language set (PIN 9999, 20 questions)
INSERT INTO exam_sets (
  title, subject, grade, time_limit_minutes, pass_threshold_pct, pin_code, is_active, questions
)
SELECT
  'แบบทดสอบภาษาไทย ป.4 (20 ข้อ)',
  'ภาษาไทย',
  'ป.4',
  60,
  50,
  '9999',
  true,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'subject', subject,
        'grade', grade,
        'topic', topic,
        'difficulty', difficulty,
        'bloom_level', bloom_level,
        'question_type', question_type,
        'question_text', question_text,
        'options', options,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'rubric', rubric,
        'indicator_id', indicator_id,
        'indicator_code', indicator_code,
        'indicator_desc', indicator_desc,
        'media_item_id', media_item_id,
        'media_title', media_title,
        'media_image_url', media_image_url,
        'explanation', explanation
      )
    )
    FROM (
      SELECT * FROM exam_questions
      WHERE grade = 'ป.4' AND subject = 'ภาษาไทย'
      ORDER BY id
      LIMIT 20
    ) q
  )
WHERE NOT EXISTS (
  SELECT 1 FROM exam_sets WHERE pin_code = '9999' OR (subject = 'ภาษาไทย' AND grade = 'ป.4' AND is_active = true)
);

-- 5. Seed standard Health & Physical Education set (PIN 1001, 20 questions)
INSERT INTO exam_sets (
  title, subject, grade, time_limit_minutes, pass_threshold_pct, pin_code, is_active, questions
)
SELECT
  'แบบทดสอบสุขศึกษา ป.4 (20 ข้อ)',
  'สุขศึกษา',
  'ป.4',
  60,
  50,
  '1001',
  true,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'subject', subject,
        'grade', grade,
        'topic', topic,
        'difficulty', difficulty,
        'bloom_level', bloom_level,
        'question_type', question_type,
        'question_text', question_text,
        'options', options,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'rubric', rubric,
        'indicator_id', indicator_id,
        'indicator_code', indicator_code,
        'indicator_desc', indicator_desc,
        'media_item_id', media_item_id,
        'media_title', media_title,
        'media_image_url', media_image_url,
        'explanation', explanation
      )
    )
    FROM (
      SELECT * FROM exam_questions
      WHERE grade = 'ป.4' AND subject = 'สุขศึกษา'
      ORDER BY id
      LIMIT 20
    ) q
  )
WHERE NOT EXISTS (
  SELECT 1 FROM exam_sets WHERE pin_code = '1001' OR (subject = 'สุขศึกษา' AND grade = 'ป.4' AND is_active = true)
);

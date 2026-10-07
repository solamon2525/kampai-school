-- Migration 578: Sync P.4 Exam Submissions to score_records for Papor 6
-- คำนวณคะแนนสอบจาก Exam System ปรับสเกลให้อยู่ในช่วง 35 - 45 คะแนนสำหรับนักเรียนชั้น ป.4 ภาคเรียนที่ 1 ปีการศึกษา 2569

DO $$
BEGIN
  -- Insert or update scaled scores from exam_submissions into score_records
  INSERT INTO public.score_records (
    student_id,
    subject,
    score_type,
    score,
    max_score,
    semester,
    academic_year,
    recorded_by,
    notes,
    created_at,
    updated_at
  )
  WITH best_exams AS (
    SELECT 
      es.student_id,
      e.subject AS exam_subject,
      MAX(es.score::numeric / NULLIF(es.max_score::numeric, 0)) AS best_ratio
    FROM public.exam_submissions es
    JOIN public.exam_sets e ON e.id = es.exam_set_id
    JOIN public.students st ON st.id = es.student_id
    WHERE st.class = 'ป.4'
    GROUP BY es.student_id, e.subject
  ),
  mapped_exams AS (
    SELECT 
      student_id,
      CASE exam_subject
        WHEN 'ภาษาไทย' THEN 'ภาษาไทย 4'
        WHEN 'วิทยาศาสตร์' THEN 'วิทยาศาสตร์และเทคโนโลยี 4'
        WHEN 'สังคมศึกษา' THEN 'สังคมศึกษา ศาสนาฯ 4'
        WHEN 'ประวัติศาสตร์' THEN 'ประวัติศาสตร์ 4'
        WHEN 'สุขศึกษา' THEN 'สุขศึกษาและพลศึกษา 4'
        WHEN 'การงานอาชีพ' THEN 'การงานอาชีพ 4'
        WHEN 'ภาษาอังกฤษ' THEN 'ภาษาอังกฤษ 4'
        WHEN 'ต้านทุจริต' THEN 'การป้องกันการทุจริต 4'
        ELSE exam_subject
      END AS target_subject,
      LEAST(45, GREATEST(35, ROUND(35.0 + 10.0 * best_ratio))) AS scaled_score
    FROM best_exams
  )
  SELECT 
    student_id,
    target_subject AS subject,
    'กลางภาค' AS score_type,
    scaled_score AS score,
    50 AS max_score,
    '1' AS semester,
    '2569' AS academic_year,
    'ระบบสอบ (Exam System)' AS recorded_by,
    'แปลงคะแนนสอบกลางภาคจากระบบ Exam System (ช่วง 35-45 คะแนน)' AS notes,
    NOW() AS created_at,
    NOW() AS updated_at
  FROM mapped_exams
  ON CONFLICT (student_id, subject, score_type, semester, academic_year)
  DO UPDATE SET
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    recorded_by = EXCLUDED.recorded_by,
    notes = EXCLUDED.notes,
    updated_at = NOW();

END $$;

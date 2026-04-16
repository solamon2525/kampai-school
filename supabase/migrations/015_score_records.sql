-- ===============================================================
-- Migration 015: Score Records (ระบบคะแนนเก็บ)
-- รองรับ: คะแนนเก็บ, กลางภาค, ปลายภาค รายวิชา รายนักเรียน
-- ===============================================================

CREATE TABLE IF NOT EXISTS score_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,                         -- วิชา
  score_type      TEXT NOT NULL DEFAULT 'เก็บ'
                  CHECK (score_type IN ('เก็บ', 'กลางภาค', 'ปลายภาค')),
  score           DECIMAL(6,2) NOT NULL DEFAULT 0,       -- คะแนนที่ได้
  max_score       DECIMAL(6,2) NOT NULL DEFAULT 100,     -- คะแนนเต็ม
  semester        TEXT NOT NULL DEFAULT '1'
                  CHECK (semester IN ('1', '2')),
  academic_year   TEXT NOT NULL,                         -- ปีการศึกษา เช่น 2567
  recorded_by     TEXT,                                  -- ผู้บันทึก
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject, score_type, semester, academic_year)
);

-- Index สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_score_records_student     ON score_records(student_id);
CREATE INDEX IF NOT EXISTS idx_score_records_subject     ON score_records(subject, semester, academic_year);
CREATE INDEX IF NOT EXISTS idx_score_records_year        ON score_records(academic_year, semester);

-- RLS
ALTER TABLE score_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage score_records"
  ON score_records FOR ALL
  USING (auth.role() = 'authenticated');

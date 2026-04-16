-- ===============================================================
-- Migration 016: Conduct Scores (ระบบคะแนนความดี)
-- รองรับ: บวกคะแนน/หักคะแนน พร้อมเหตุผลและหมวดหมู่
-- ===============================================================

CREATE TABLE IF NOT EXISTS conduct_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('add', 'deduct')),  -- บวก/หัก
  score        INT NOT NULL DEFAULT 1,                           -- จำนวนคะแนน
  category     TEXT NOT NULL DEFAULT 'ความดี',                   -- หมวดหมู่
  reason       TEXT NOT NULL,                                    -- เหตุผล/รายละเอียด
  recorded_by  TEXT,                                             -- ผู้บันทึก (ครู)
  academic_year TEXT NOT NULL,                                   -- ปีการศึกษา
  semester     TEXT NOT NULL DEFAULT '1' CHECK (semester IN ('1', '2')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_conduct_student   ON conduct_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_conduct_year      ON conduct_scores(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_conduct_category  ON conduct_scores(category);

-- RLS
ALTER TABLE conduct_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage conduct_scores"
  ON conduct_scores FOR ALL
  USING (auth.role() = 'authenticated');

-- หมวดหมู่เหตุผลสำเร็จรูป (ใช้อ้างอิงใน UI)
-- add: ความดี, จิตอาสา, วินัย, วิชาการ, กีฬา
-- deduct: วินัย, ทรัพย์สิน, การเรียน, ความประพฤติ

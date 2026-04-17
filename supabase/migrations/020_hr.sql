-- ===================================================
-- Migration 020: งานบุคคล (HR)
-- การลา, ประเมิน PA, บันทึกการอบรม
-- ===================================================

-- การลาของบุคลากร
CREATE TABLE IF NOT EXISTS leave_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id       UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type     TEXT NOT NULL DEFAULT 'ลาป่วย'
                 CHECK (leave_type IN ('ลาป่วย','ลากิจ','ลาพักร้อน','ลาคลอด','ลาบวช','ลาอื่นๆ')),
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  days           DECIMAL(4,1) NOT NULL DEFAULT 1,
  reason         TEXT,
  status         TEXT NOT NULL DEFAULT 'รออนุมัติ'
                 CHECK (status IN ('รออนุมัติ','อนุมัติ','ไม่อนุมัติ')),
  approved_by    TEXT,
  notes          TEXT,
  attachment_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ประเมิน PA (Performance Agreement)
CREATE TABLE IF NOT EXISTS pa_assessments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id           UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  academic_year      TEXT NOT NULL,
  semester           INTEGER NOT NULL DEFAULT 1 CHECK (semester IN (1,2)),
  id_plan_url        TEXT,
  observation_count  INTEGER DEFAULT 0,
  observation_target INTEGER DEFAULT 2,
  training_hours     DECIMAL(6,1) DEFAULT 0,
  training_target    DECIMAL(6,1) DEFAULT 20,
  self_rating        DECIMAL(3,1) DEFAULT 0 CHECK (self_rating BETWEEN 0 AND 5),
  director_rating    DECIMAL(3,1) DEFAULT 0 CHECK (director_rating BETWEEN 0 AND 5),
  status             TEXT NOT NULL DEFAULT 'กำลังดำเนินการ'
                     CHECK (status IN ('กำลังดำเนินการ','ส่งแล้ว','ผ่าน','ไม่ผ่าน')),
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, academic_year, semester)
);

-- บันทึกการอบรม/สัมมนา
CREATE TABLE IF NOT EXISTS training_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  course_name     TEXT NOT NULL,
  provider        TEXT,
  training_type   TEXT DEFAULT 'อบรม'
                  CHECK (training_type IN ('อบรม','สัมมนา','ศึกษาดูงาน','ประชุมวิชาการ')),
  start_date      DATE,
  end_date        DATE,
  hours           DECIMAL(5,1) DEFAULT 0,
  location        TEXT,
  budget          DECIMAL(10,2) DEFAULT 0,
  certificate_url TEXT,
  status          TEXT DEFAULT 'สมัครแล้ว'
                  CHECK (status IN ('สมัครแล้ว','กำลังอบรม','ผ่านการอบรม','ไม่ผ่าน')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON leave_requests(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_pa_assessments_staff ON pa_assessments(staff_id);
CREATE INDEX IF NOT EXISTS idx_pa_assessments_year ON pa_assessments(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_training_records_staff ON training_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_training_records_date ON training_records(start_date DESC);

-- Row Level Security
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pa_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage leave_requests"
  ON leave_requests FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage pa_assessments"
  ON pa_assessments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage training_records"
  ON training_records FOR ALL USING (auth.role() = 'authenticated');

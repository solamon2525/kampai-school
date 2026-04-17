-- ===================================================
-- Migration 021: ฝ่ายวิชาการ
-- ตารางสอน, แผนการสอน, สื่อการสอน, ปฏิทินวิชาการ
-- นักเรียนที่ต้องการความช่วยเหลือ, แนะแนว, นิเทศ
-- ===================================================

-- ตารางสอน/ตารางเรียน
CREATE TABLE IF NOT EXISTS class_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID REFERENCES staff(id) ON DELETE SET NULL,
  grade         TEXT NOT NULL,           -- 'อ.1','อ.2','ป.1'...'ป.6'
  room          TEXT,
  subject       TEXT NOT NULL,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),  -- 1=จันทร์, 5=ศุกร์
  period        INTEGER NOT NULL CHECK (period BETWEEN 1 AND 8),        -- คาบที่ 1-8
  start_time    TIME,
  end_time      TIME,
  semester      INTEGER DEFAULT 1 CHECK (semester IN (1,2)),
  academic_year TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- แผนการจัดการเรียนรู้
CREATE TABLE IF NOT EXISTS lesson_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id       UUID REFERENCES staff(id) ON DELETE SET NULL,
  subject        TEXT NOT NULL,
  grade          TEXT NOT NULL,
  unit_title     TEXT NOT NULL,
  week_number    INTEGER,
  objectives     TEXT,
  activities     TEXT,
  materials      TEXT,
  evaluation     TEXT,
  duration_hours DECIMAL(4,1) DEFAULT 1,
  semester       INTEGER DEFAULT 1 CHECK (semester IN (1,2)),
  academic_year  TEXT NOT NULL,
  status         TEXT DEFAULT 'ร่าง'
                 CHECK (status IN ('ร่าง','อนุมัติ','ใช้งาน')),
  file_url       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ทะเบียนสื่อการสอน/อุปกรณ์
CREATE TABLE IF NOT EXISTS teaching_materials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  material_type    TEXT DEFAULT 'สื่อการสอน'
                   CHECK (material_type IN ('สื่อการสอน','อุปกรณ์วิทยาศาสตร์','คอมพิวเตอร์','หนังสือ','อื่นๆ')),
  subject          TEXT,
  quantity         INTEGER DEFAULT 1,
  storage_location TEXT,
  condition        TEXT DEFAULT 'ดี'
                   CHECK (condition IN ('ดี','ชำรุด','จำหน่ายออก')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ปฏิทินวิชาการ (แยกจาก events ทั่วไป)
CREATE TABLE IF NOT EXISTS academic_calendar (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  event_type    TEXT NOT NULL DEFAULT 'วิชาการ'
                CHECK (event_type IN ('วันเรียน','วันหยุด','สอบ','ส่งเอกสาร','ประชุม','กิจกรรม','วิชาการ')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  semester      INTEGER CHECK (semester IN (1,2)),
  academic_year TEXT NOT NULL,
  description   TEXT,
  is_all_day    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- นักเรียนที่ต้องการความช่วยเหลือพิเศษ
CREATE TABLE IF NOT EXISTS student_special_needs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  need_type    TEXT NOT NULL
               CHECK (need_type IN ('บกพร่องทางการเรียน','พิการ','ด้อยโอกาส','ปัญญาเจริญ','สุขภาพจิต','อื่นๆ')),
  description  TEXT,
  support_plan TEXT,
  support_by   TEXT,
  status       TEXT DEFAULT 'ติดตาม'
               CHECK (status IN ('ติดตาม','กำลังช่วยเหลือ','จบแล้ว')),
  start_date   DATE DEFAULT CURRENT_DATE,
  end_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- บันทึกการแนะแนว/ให้คำปรึกษา
CREATE TABLE IF NOT EXISTS counseling_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor     TEXT NOT NULL,
  session_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  topic         TEXT NOT NULL,
  concern_type  TEXT DEFAULT 'การเรียน'
                CHECK (concern_type IN ('การเรียน','พฤติกรรม','ครอบครัว','อาชีพ','อื่นๆ')),
  content       TEXT,
  action_taken  TEXT,
  followup_date DATE,
  status        TEXT DEFAULT 'ติดตาม'
                CHECK (status IN ('ติดตาม','เสร็จสิ้น')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- บันทึกการนิเทศชั้นเรียน
CREATE TABLE IF NOT EXISTS supervision_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  supervisor       TEXT NOT NULL,
  visit_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  subject_observed TEXT,
  grade_observed   TEXT,
  strengths        TEXT,
  improvements     TEXT,
  recommendations  TEXT,
  followup_date    DATE,
  status           TEXT DEFAULT 'รอติดตาม'
                   CHECK (status IN ('รอติดตาม','ติดตามแล้ว')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_class_schedules_staff ON class_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_grade ON class_schedules(grade, academic_year);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day_of_week, period);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_staff ON lesson_plans(staff_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade ON lesson_plans(grade, academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_year ON academic_calendar(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_date ON academic_calendar(start_date);
CREATE INDEX IF NOT EXISTS idx_student_special_needs_student ON student_special_needs(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_records_student ON counseling_records(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_records_date ON counseling_records(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_supervision_records_staff ON supervision_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_supervision_records_date ON supervision_records(visit_date DESC);

-- Row Level Security
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_special_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage class_schedules"
  ON class_schedules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage lesson_plans"
  ON lesson_plans FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage teaching_materials"
  ON teaching_materials FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage academic_calendar"
  ON academic_calendar FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage student_special_needs"
  ON student_special_needs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage counseling_records"
  ON counseling_records FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage supervision_records"
  ON supervision_records FOR ALL USING (auth.role() = 'authenticated');

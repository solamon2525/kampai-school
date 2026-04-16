-- ===============================================================
-- Migration 018: เชื่อม waste_transactions กับ students (student_id FK)
-- ===============================================================

-- 1. เพิ่ม student_id column (ถ้ายังไม่มี)
ALTER TABLE waste_transactions
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- 2. Index สำหรับ query เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_waste_student_id ON waste_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_waste_date        ON waste_transactions(transaction_date DESC);

-- 3. อัปเดต VIEW ให้ดึง photo_url จาก students table ด้วย
--    - ถ้ามี student_id → join กับ students
--    - ยังรักษา student_name / student_class text ไว้ (backward compat)
CREATE OR REPLACE VIEW waste_student_summary AS
SELECT
  wt.student_name,
  wt.student_class,
  wt.student_id,
  s.photo_url,
  s.student_code,
  COUNT(*)              AS total_transactions,
  SUM(wt.weight_kg)     AS total_weight,
  SUM(wt.amount)        AS total_amount,
  MAX(wt.transaction_date) AS last_transaction_date
FROM waste_transactions wt
LEFT JOIN students s ON s.id = wt.student_id
GROUP BY
  wt.student_name,
  wt.student_class,
  wt.student_id,
  s.photo_url,
  s.student_code
ORDER BY total_amount DESC;

-- Migration 151: เพิ่ม 'อื่นๆ' ใน score_type CHECK constraint
ALTER TABLE score_records
  DROP CONSTRAINT IF EXISTS score_records_score_type_check;

ALTER TABLE score_records
  ADD CONSTRAINT score_records_score_type_check
  CHECK (score_type IN ('เก็บ', 'กลางภาค', 'ปลายภาค', 'อื่นๆ'));

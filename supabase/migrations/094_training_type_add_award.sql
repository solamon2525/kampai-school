-- 094: เพิ่มประเภท 'รางวัล/เกียรติยศ' ใน training_records.training_type
--
-- เดิม migration 020 ประกาศ CHECK (อบรม/สัมมนา/ศึกษาดูงาน/ประชุมวิชาการ) แต่ prod
-- ไม่มี constraint จริง (schema drift) → DROP IF EXISTS เป็น no-op, ADD สร้างใหม่ครบ 5 ค่า
-- เพื่อรองรับเกียรติบัตรประเภทรางวัล/เกียรติยศ (ไม่ใช่การอบรม) ในระบบพัฒนาบุคลากร

ALTER TABLE training_records DROP CONSTRAINT IF EXISTS training_records_training_type_check;

ALTER TABLE training_records ADD CONSTRAINT training_records_training_type_check
  CHECK (training_type IN ('อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ', 'รางวัล/เกียรติยศ'));

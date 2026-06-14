-- ลบเลขกลุ่ม (ASCII digit) ที่หลุดมาท้ายคำอธิบายตัวชี้วัดศิลปะจากการ extract PDF
-- (เฉพาะ arts; math ที่ลงท้ายด้วย "และ 0" เป็นข้อความหลักสูตรจริง ห้ามแตะ)
-- applied to remote via execute_sql ใน session เดียวกับ seed — migration นี้เพื่อ replay บน DB ใหม่
UPDATE public.curriculum_indicators
SET description = regexp_replace(description, '\s+[0-9]{1,2}$', ''), updated_at = now()
WHERE subject_key = 'arts' AND description ~ '\s[0-9]{1,2}$';

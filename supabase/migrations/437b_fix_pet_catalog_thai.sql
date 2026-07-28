-- Fix Thai text in pet_catalog after encoding corruption on initial apply
UPDATE public.pet_catalog SET
  name_th = v.name_th,
  species_th = v.species_th,
  description = v.description,
  updated_at = now()
FROM (VALUES
  ('chang-noi', 'น้องภูผา', 'ช้างไทย', 'คู่หูใจดี พร้อมเริ่มการผจญภัยไปกับทุกคน'),
  ('wichian-cat', 'น้องมะลิ', 'แมววิเชียรมาศ', 'ช่างสังเกตและชอบค้นหาคำตอบใหม่ ๆ'),
  ('field-rabbit', 'น้องปุยเมฆ', 'กระต่ายนา', 'คล่องแคล่ว สดใส และไม่ยอมแพ้ง่าย ๆ'),
  ('thai-buffalo', 'น้องกล้า', 'ควายไทย', 'ขยัน อดทน และพร้อมฝึกฝนทุกวัน'),
  ('hornbill', 'น้องสายรุ้ง', 'นกเงือก', 'นักสำรวจผู้รักธรรมชาติและวิทยาศาสตร์'),
  ('betta-fish', 'น้องประกาย', 'ปลากัดไทย', 'คู่หูสีสวยสำหรับนักเรียนผู้มุ่งมั่น')
) AS v(code, name_th, species_th, description)
WHERE pet_catalog.code = v.code;

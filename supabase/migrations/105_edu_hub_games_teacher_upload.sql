-- ============================================================================
-- Migration 105: ครู (is_teacher) อัปโหลด/อัปเดต/ลบไฟล์เกมใน bucket edu-hub-games ได้
-- ============================================================================
-- เดิม (migration 063) เปิดให้ admin เท่านั้น. table RLS ของ educational_hub_items
-- เป็น owner-or-admin อยู่แล้ว → "ใครอัปเกมก็มีสิทธิ์แก้" ทำได้โดยปลดล็อก storage ให้ครูด้วย
-- public.is_teacher() = teacher หรือ admin (migration 022)
-- หมายเหตุ: storage RLS เป็น path-based ไม่ scope ตาม owner — UI โชว์ปุ่มแทน/ลบเฉพาะ owner-or-admin
-- ============================================================================

DROP POLICY IF EXISTS "Admin insert edu-hub-games" ON storage.objects;
DROP POLICY IF EXISTS "Admin update edu-hub-games" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete edu-hub-games" ON storage.objects;

CREATE POLICY "Teacher insert edu-hub-games" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'edu-hub-games' AND public.is_teacher());

CREATE POLICY "Teacher update edu-hub-games" ON storage.objects
  FOR UPDATE USING (bucket_id = 'edu-hub-games' AND public.is_teacher());

CREATE POLICY "Teacher delete edu-hub-games" ON storage.objects
  FOR DELETE USING (bucket_id = 'edu-hub-games' AND public.is_teacher());

-- ============================================================================
-- Migration 034: RLS policies สำหรับ admin อ่าน user_roles ทั้งหมด
-- ต้องการเพื่อแสดงสถานะ account ครูใน TeacherListManagement
-- ============================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ผู้ใช้อ่าน role ของตัวเอง (AuthProvider ใช้)
DROP POLICY IF EXISTS "user_read_own_role" ON public.user_roles;
CREATE POLICY "user_read_own_role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Admin อ่านได้ทั้งหมด (TeacherListManagement account status badge)
DROP POLICY IF EXISTS "admin_read_all_roles" ON public.user_roles;
CREATE POLICY "admin_read_all_roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

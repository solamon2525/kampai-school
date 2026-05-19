-- ===============================================================
-- Migration 067: Conduct Scores — admin-only UPDATE/DELETE
-- ===============================================================
-- Migration 022 ตั้ง policy "teacher_manage_conduct_scores" เป็น FOR ALL ให้ทั้ง
--   teacher และ admin (เพราะ is_teacher() คืน true ทั้งคู่) → teacher แก้/ลบได้
-- ใหม่: แยกสิทธิ์
--   - SELECT, INSERT  → teacher + admin (is_teacher() — Record tab ยังบันทึกได้)
--   - UPDATE, DELETE → admin เท่านั้น (is_admin())
-- ===============================================================

DROP POLICY IF EXISTS "Auth manage conduct_scores" ON public.conduct_scores;
DROP POLICY IF EXISTS "teacher_manage_conduct_scores" ON public.conduct_scores;
DROP POLICY IF EXISTS "Auth read conduct_scores" ON public.conduct_scores;
DROP POLICY IF EXISTS "Auth insert conduct_scores" ON public.conduct_scores;
DROP POLICY IF EXISTS "Admin update conduct_scores" ON public.conduct_scores;
DROP POLICY IF EXISTS "Admin delete conduct_scores" ON public.conduct_scores;

CREATE POLICY "teacher_read_conduct_scores"
  ON public.conduct_scores FOR SELECT
  USING (public.is_teacher());

CREATE POLICY "teacher_insert_conduct_scores"
  ON public.conduct_scores FOR INSERT
  WITH CHECK (public.is_teacher());

CREATE POLICY "admin_update_conduct_scores"
  ON public.conduct_scores FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_conduct_scores"
  ON public.conduct_scores FOR DELETE
  USING (public.is_admin());

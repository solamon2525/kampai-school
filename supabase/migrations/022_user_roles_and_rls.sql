-- ============================================================================
-- Migration 022: user_roles enhancement + RLS hardening
-- ============================================================================
-- 1) ขยาย user_roles ให้ link ไป staff/students + เพิ่ม 'parent' role
-- 2) สร้าง helper functions: auth_role(), is_admin(), is_teacher()
-- 3) ปิดช่องโหว่ policies ที่เป็น qual=true / Allow public full access
--    โดยใช้ pattern: Public SELECT (ถ้าจำเป็น) + is_admin() ALL สำหรับ write
-- ============================================================================

-- ---------- 1. user_roles structure ----------
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS staff_id   UUID REFERENCES public.staff(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL;

-- เพิ่มค่า 'parent' ลงใน enum user_role (ถ้ายังไม่มี)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'parent'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'parent';
  END IF;
END$$;

-- ---------- 2. Helper functions ----------
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text IN ('teacher','admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_role()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO anon, authenticated;

-- ---------- 3. RLS hardening ----------

-- ===== Group A: Public-read + Admin-write =====
DROP POLICY IF EXISTS "Allow public full access for administrators" ON public.administrators;
CREATE POLICY "public_read_administrators"  ON public.administrators FOR SELECT USING (true);
CREATE POLICY "admin_write_administrators"  ON public.administrators FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for staff" ON public.staff;
CREATE POLICY "public_read_staff"  ON public.staff FOR SELECT USING (true);
CREATE POLICY "admin_write_staff"  ON public.staff FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow full access for curriculum_programs" ON public.curriculum_programs;
CREATE POLICY "public_read_curriculum_programs"  ON public.curriculum_programs FOR SELECT USING (true);
CREATE POLICY "admin_write_curriculum_programs"  ON public.curriculum_programs FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow full access for curriculum_activities" ON public.curriculum_activities;
CREATE POLICY "public_read_curriculum_activities"  ON public.curriculum_activities FOR SELECT USING (true);
CREATE POLICY "admin_write_curriculum_activities"  ON public.curriculum_activities FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for student_achievements" ON public.student_achievements;
CREATE POLICY "public_read_student_achievements"  ON public.student_achievements FOR SELECT USING (true);
CREATE POLICY "admin_write_student_achievements"  ON public.student_achievements FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for student_activities" ON public.student_activities;
CREATE POLICY "public_read_student_activities"  ON public.student_activities FOR SELECT USING (true);
CREATE POLICY "admin_write_student_activities"  ON public.student_activities FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for student_council" ON public.student_council;
CREATE POLICY "public_read_student_council"  ON public.student_council FOR SELECT USING (true);
CREATE POLICY "admin_write_student_council"  ON public.student_council FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for student_stats" ON public.student_stats;
CREATE POLICY "public_read_student_stats"  ON public.student_stats FOR SELECT USING (true);
CREATE POLICY "admin_write_student_stats"  ON public.student_stats FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public full access for grade_data" ON public.grade_data;
CREATE POLICY "public_read_grade_data"  ON public.grade_data FOR SELECT USING (true);
CREATE POLICY "admin_write_grade_data"  ON public.grade_data FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow full access for facilities" ON public.facilities;
CREATE POLICY "public_read_facilities"  ON public.facilities FOR SELECT USING (true);
CREATE POLICY "admin_write_facilities"  ON public.facilities FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow full access for faq" ON public.faq;
CREATE POLICY "public_read_faq"  ON public.faq FOR SELECT USING (true);
CREATE POLICY "admin_write_faq"  ON public.faq FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow full access for milestones" ON public.milestones;
CREATE POLICY "public_read_milestones"  ON public.milestones FOR SELECT USING (true);
CREATE POLICY "admin_write_milestones"  ON public.milestones FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage news" ON public.news;
CREATE POLICY "admin_manage_news" ON public.news FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage news categories" ON public.news_categories;
CREATE POLICY "admin_manage_news_categories" ON public.news_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage albums" ON public.gallery_albums;
CREATE POLICY "admin_manage_albums" ON public.gallery_albums FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage photos" ON public.gallery_photos;
CREATE POLICY "admin_manage_photos" ON public.gallery_photos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert events" ON public.events;
DROP POLICY IF EXISTS "Admin can update events" ON public.events;
DROP POLICY IF EXISTS "Admin can delete events" ON public.events;
CREATE POLICY "admin_insert_events" ON public.events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_events" ON public.events FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_events" ON public.events FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin can delete settings" ON public.school_settings;
CREATE POLICY "admin_insert_settings" ON public.school_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_settings" ON public.school_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_settings" ON public.school_settings FOR DELETE USING (public.is_admin());

-- ===== Group B: Admin-only (PII / internal) =====
DROP POLICY IF EXISTS "Allow public full access for admissions" ON public.admissions;
CREATE POLICY "public_insert_admissions" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_manage_admissions"  ON public.admissions FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can view messages"   ON public.contact_messages;
DROP POLICY IF EXISTS "Admin can update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin can delete messages" ON public.contact_messages;
CREATE POLICY "admin_view_messages"   ON public.contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_messages" ON public.contact_messages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_messages" ON public.contact_messages FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Auth manage students" ON public.students;
CREATE POLICY "teacher_read_students" ON public.students FOR SELECT USING (public.is_teacher());
CREATE POLICY "admin_write_students"  ON public.students FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin read" ON public.page_views;
CREATE POLICY "admin_read_page_views" ON public.page_views FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage" ON public.email_subscribers;
CREATE POLICY "admin_manage_subscribers" ON public.email_subscribers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage hero_slides" ON public.hero_slides;
CREATE POLICY "admin_manage_hero_slides" ON public.hero_slides FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage documents" ON public.documents;
CREATE POLICY "admin_manage_documents" ON public.documents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage doc_categories" ON public.document_categories;
CREATE POLICY "admin_manage_doc_categories" ON public.document_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage waste_categories" ON public.waste_categories;
CREATE POLICY "admin_manage_waste_categories" ON public.waste_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage waste_transactions" ON public.waste_transactions;
CREATE POLICY "admin_manage_waste_transactions" ON public.waste_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access incoming"    ON public.incoming_letters;
DROP POLICY IF EXISTS "Auth manage incoming_letters"  ON public.incoming_letters;
CREATE POLICY "admin_manage_incoming_letters" ON public.incoming_letters FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access outgoing"    ON public.outgoing_letters;
DROP POLICY IF EXISTS "Auth manage outgoing_letters"  ON public.outgoing_letters;
CREATE POLICY "admin_manage_outgoing_letters" ON public.outgoing_letters FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access orders"         ON public.orders_announcements;
DROP POLICY IF EXISTS "Auth manage orders_announcements" ON public.orders_announcements;
CREATE POLICY "admin_manage_orders_announcements" ON public.orders_announcements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access meetings" ON public.meetings;
DROP POLICY IF EXISTS "Auth manage meetings"       ON public.meetings;
CREATE POLICY "admin_manage_meetings" ON public.meetings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Auth read leave_requests"   ON public.leave_requests;
DROP POLICY IF EXISTS "Auth write leave_requests"  ON public.leave_requests;
CREATE POLICY "admin_manage_leave_requests" ON public.leave_requests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth read leave_balances"  ON public.leave_balances;
DROP POLICY IF EXISTS "Auth write leave_balances" ON public.leave_balances;
CREATE POLICY "admin_manage_leave_balances" ON public.leave_balances FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage pa_assessments" ON public.pa_assessments;
DROP POLICY IF EXISTS "Auth read pa_assessments"   ON public.pa_assessments;
DROP POLICY IF EXISTS "Auth write pa_assessments"  ON public.pa_assessments;
CREATE POLICY "admin_manage_pa_assessments" ON public.pa_assessments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage training_records" ON public.training_records;
DROP POLICY IF EXISTS "Auth read training_records"   ON public.training_records;
DROP POLICY IF EXISTS "Auth write training_records"  ON public.training_records;
CREATE POLICY "admin_manage_training_records" ON public.training_records FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== Group C: Teacher+Admin (academic) =====
DROP POLICY IF EXISTS "Auth manage class_schedules" ON public.class_schedules;
CREATE POLICY "teacher_manage_class_schedules" ON public.class_schedules FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage lesson_plans" ON public.lesson_plans;
CREATE POLICY "teacher_manage_lesson_plans" ON public.lesson_plans FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage teaching_materials" ON public.teaching_materials;
CREATE POLICY "teacher_manage_teaching_materials" ON public.teaching_materials FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage academic_calendar" ON public.academic_calendar;
CREATE POLICY "teacher_read_academic_calendar" ON public.academic_calendar FOR SELECT USING (public.is_teacher());
CREATE POLICY "admin_write_academic_calendar"  ON public.academic_calendar FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth manage counseling_records" ON public.counseling_records;
CREATE POLICY "teacher_manage_counseling_records" ON public.counseling_records FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage supervision_records" ON public.supervision_records;
CREATE POLICY "teacher_manage_supervision_records" ON public.supervision_records FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage student_special_needs" ON public.student_special_needs;
CREATE POLICY "teacher_manage_student_special_needs" ON public.student_special_needs FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage attendance" ON public.attendance_records;
CREATE POLICY "teacher_manage_attendance" ON public.attendance_records FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage score_records" ON public.score_records;
CREATE POLICY "teacher_manage_score_records" ON public.score_records FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

DROP POLICY IF EXISTS "Auth manage conduct_scores" ON public.conduct_scores;
CREATE POLICY "teacher_manage_conduct_scores" ON public.conduct_scores FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

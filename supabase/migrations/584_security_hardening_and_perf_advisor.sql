-- Migration 584: Security Hardening & Performance Advisor Fixes
-- Addresses Supabase Security & Performance Advisor recommendations:
-- 1. Missing RLS policy on integrated_plan_pin_settings
-- 2. Convert SECURITY DEFINER views to SECURITY INVOKER
-- 3. Set search_path = public on mutable functions
-- 4. Revoke anon execute on sensitive/admin RPCs
-- 5. Add covering indexes for high-frequency foreign keys

-- 1. RLS Policy for integrated_plan_pin_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'integrated_plan_pin_settings' 
    AND policyname = 'owner_or_admin_manage_pin_settings'
  ) THEN
    CREATE POLICY "owner_or_admin_manage_pin_settings" ON public.integrated_plan_pin_settings
    FOR ALL TO authenticated
    USING (
      public.is_admin() OR
      owner_staff_id IN (
        SELECT staff_id FROM public.user_roles WHERE user_id = (SELECT auth.uid())
      )
    )
    WITH CHECK (
      public.is_admin() OR
      owner_staff_id IN (
        SELECT staff_id FROM public.user_roles WHERE user_id = (SELECT auth.uid())
      )
    );
  END IF;
END $$;

-- 2. Security Invoker on Views
ALTER VIEW IF EXISTS public.v_recent_documents_unified SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_aggregated_calendar SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_docs_hub_kpi SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_urgent_documents SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_educational_hub_teachers SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_budget_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.student_latest_growth SET (security_invoker = true);
ALTER VIEW IF EXISTS public.game_student_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.waste_student_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.student_global_profile SET (security_invoker = true);
ALTER VIEW IF EXISTS public.student_subject_xp SET (security_invoker = true);
ALTER VIEW IF EXISTS public.reading_student_summary SET (security_invoker = true);

-- 3. Set explicit search_path on mutable functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.increment_news_view(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.get_storage_usage() SET search_path = public;
ALTER FUNCTION public.get_db_size() SET search_path = public;
ALTER FUNCTION public.next_incoming_number() SET search_path = public;
ALTER FUNCTION public.next_outgoing_number() SET search_path = public;
ALTER FUNCTION public.touch_ticker_items_updated_at() SET search_path = public;
ALTER FUNCTION public.touch_school_dashboard_updated_at() SET search_path = public;
ALTER FUNCTION public.log_letter_status_change() SET search_path = public;
ALTER FUNCTION public.add_tracking_note(text, uuid, text) SET search_path = public;
ALTER FUNCTION public.facebook_feed_config_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.bkk_today() SET search_path = public;
ALTER FUNCTION public.subject_keys(text) SET search_path = public;
ALTER FUNCTION public.grade_from_class(text) SET search_path = public;
ALTER FUNCTION public.subject_key_from_folder(text) SET search_path = public;
ALTER FUNCTION public.get_top_heroes(integer, text, text) SET search_path = public;
ALTER FUNCTION public.get_exam_indicator_coverage(text, text) SET search_path = public;
ALTER FUNCTION public.pet_friendship_level(integer) SET search_path = public;
ALTER FUNCTION public.enroll_class_students_to_gradebook(text, text) SET search_path = public;
ALTER FUNCTION public.clean_duplicate_homeroom_assignments() SET search_path = public;

-- 4. Revoke anon execute on sensitive/admin functions
REVOKE EXECUTE ON FUNCTION public.admin_claim_and_approve_reward(text, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_game_sessions(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_reward_stock(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_supply_request(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_reward_claim_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enroll_class_students_to_gradebook(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.clean_duplicate_homeroom_assignments() FROM anon;

-- 5. Add covering indexes for high-frequency foreign keys
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_by ON public.assignment_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_by ON public.assignment_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_records_recorded_by_admin ON public.attendance_records(recorded_by_administrator_id);
CREATE INDEX IF NOT EXISTS idx_conduct_scores_recorded_by_admin ON public.conduct_scores(recorded_by_administrator_id);
CREATE INDEX IF NOT EXISTS idx_daily_quest_completions_student_id ON public.daily_quest_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_quest_completions_session_id ON public.daily_quest_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_teacher_id ON public.exam_questions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_indicator_id ON public.exam_questions(indicator_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_graded_by ON public.exam_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_game_sessions_edu_hub_item_id ON public.game_sessions(edu_hub_item_id);
CREATE INDEX IF NOT EXISTS idx_game_student_achievements_session_id ON public.game_student_achievements(session_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_logs_recorded_by_staff_id ON public.reading_logs(recorded_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_id ON public.reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_staff_id ON public.savings_transactions(recorded_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_admin_id ON public.savings_transactions(recorded_by_administrator_id);
CREATE INDEX IF NOT EXISTS idx_student_growth_recorded_by ON public.student_growth_measurements(recorded_by);
CREATE INDEX IF NOT EXISTS idx_student_health_updated_by ON public.student_health_records(updated_by);
CREATE INDEX IF NOT EXISTS idx_student_indicator_assessments_ind_id ON public.student_indicator_assessments(indicator_id);
CREATE INDEX IF NOT EXISTS idx_student_pets_pet_id ON public.student_pets(pet_id);
CREATE INDEX IF NOT EXISTS idx_supply_requests_reviewed_by ON public.supply_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_staff_id ON public.user_roles(staff_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_student_id ON public.user_roles(student_id);
CREATE INDEX IF NOT EXISTS idx_waste_transactions_admin_id ON public.waste_transactions(recorded_by_administrator_id);

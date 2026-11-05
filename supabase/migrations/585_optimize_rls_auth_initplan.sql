-- Migration 585: Optimize core RLS policies with (select auth.uid()) to resolve auth_rls_initplan warnings
-- Uses ALTER POLICY to avoid destructive drops and modifies in place

ALTER POLICY "user_read_own_role" ON public.user_roles USING (user_id = (SELECT auth.uid()));
ALTER POLICY "parent_read_own_links" ON public.parent_student_links USING (user_id = (SELECT auth.uid()));
ALTER POLICY "sessions_self_read" ON public.game_sessions USING (student_id IN (SELECT ur.student_id FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid())));
ALTER POLICY "ach_self_read" ON public.game_student_achievements USING (student_id IN (SELECT ur.student_id FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid())));
ALTER POLICY "user_read_own_menu_permissions" ON public.user_menu_permissions USING (user_id = (SELECT auth.uid()));
ALTER POLICY "users_read_own_line_link" ON public.line_user_links USING (user_id = (SELECT auth.uid()));
ALTER POLICY "users_unlink_own_line" ON public.line_user_links USING (user_id = (SELECT auth.uid()));
ALTER POLICY "user_read_own_consents" ON public.pdpa_consents USING (user_id = (SELECT auth.uid()));

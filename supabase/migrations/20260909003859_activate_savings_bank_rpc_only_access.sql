-- Activate only after the RPC-backed frontend is live. No data changes.
DROP POLICY IF EXISTS "public_read_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "teacher_write_savings_transactions" ON public.savings_transactions;
CREATE POLICY "staff_read_savings_transactions"
  ON public.savings_transactions FOR SELECT TO authenticated
  USING (public.is_teacher() OR public.is_admin());

REVOKE ALL ON public.savings_transactions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.savings_student_summary FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.savings_transactions TO authenticated;
GRANT SELECT ON public.savings_student_summary TO authenticated;
ALTER VIEW public.savings_student_summary SET (security_invoker = true);

-- Migration 579: Fix security vulnerabilities and RLS policies on ปพ.5 / ปพ.6 evaluation and promotion tables
-- Drops insecure policies with 'OR true' and public anon reads, replacing with role-based checks.

-- 1. Secure student_obec_evaluations
DROP POLICY IF EXISTS "Allow public read obec evaluations" ON public.student_obec_evaluations;
DROP POLICY IF EXISTS "Allow teachers and admins manage obec evaluations" ON public.student_obec_evaluations;
DROP POLICY IF EXISTS "Allow read obec evaluations for all authenticated users" ON public.student_obec_evaluations;

CREATE POLICY "Staff can read obec evaluations"
ON public.student_obec_evaluations FOR SELECT
TO authenticated
USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Staff can manage obec evaluations"
ON public.student_obec_evaluations FOR ALL
TO authenticated
USING (public.is_admin() OR public.is_teacher())
WITH CHECK (public.is_admin() OR public.is_teacher());

-- 2. Secure student_term_promotion_records
DROP POLICY IF EXISTS "Allow public read promotion records" ON public.student_term_promotion_records;
DROP POLICY IF EXISTS "Allow teachers and admins manage promotion records" ON public.student_term_promotion_records;
DROP POLICY IF EXISTS "Allow read promotion records for all authenticated users" ON public.student_term_promotion_records;

CREATE POLICY "Staff can read promotion records"
ON public.student_term_promotion_records FOR SELECT
TO authenticated
USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Staff can manage promotion records"
ON public.student_term_promotion_records FOR ALL
TO authenticated
USING (public.is_admin() OR public.is_teacher())
WITH CHECK (public.is_admin() OR public.is_teacher());

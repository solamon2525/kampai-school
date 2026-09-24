CREATE INDEX IF NOT EXISTS idx_waste_showcase_reports_updated_by
  ON public.waste_bank_showcase_reports (updated_by);
CREATE INDEX IF NOT EXISTS idx_waste_showcase_photos_created_by
  ON public.waste_bank_showcase_photos (created_by);

DROP POLICY IF EXISTS "Public read current waste showcase report" ON public.waste_bank_showcase_reports;
DROP POLICY IF EXISTS "Admin manage waste showcase reports" ON public.waste_bank_showcase_reports;

CREATE POLICY "Anon read current waste showcase report"
ON public.waste_bank_showcase_reports FOR SELECT TO anon
USING (
  academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
  AND semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
);
CREATE POLICY "Authenticated read permitted waste showcase reports"
ON public.waste_bank_showcase_reports FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR (
    academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
    AND semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
  )
);
CREATE POLICY "Admin insert waste showcase reports"
ON public.waste_bank_showcase_reports FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admin update waste showcase reports"
ON public.waste_bank_showcase_reports FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admin delete waste showcase reports"
ON public.waste_bank_showcase_reports FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public read current published waste showcase photos" ON public.waste_bank_showcase_photos;
DROP POLICY IF EXISTS "Admin manage waste showcase photos" ON public.waste_bank_showcase_photos;

CREATE POLICY "Anon read current published waste showcase photos"
ON public.waste_bank_showcase_photos FOR SELECT TO anon
USING (
  is_published
  AND EXISTS (
    SELECT 1 FROM public.waste_bank_showcase_reports report
    WHERE report.id = report_id
      AND report.academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
      AND report.semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
  )
);
CREATE POLICY "Authenticated read permitted waste showcase photos"
ON public.waste_bank_showcase_photos FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR (
    is_published
    AND EXISTS (
      SELECT 1 FROM public.waste_bank_showcase_reports report
      WHERE report.id = report_id
        AND report.academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
        AND report.semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
    )
  )
);
CREATE POLICY "Admin insert waste showcase photos"
ON public.waste_bank_showcase_photos FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admin update waste showcase photos"
ON public.waste_bank_showcase_photos FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admin delete waste showcase photos"
ON public.waste_bank_showcase_photos FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

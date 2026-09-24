-- Keep public showcase access scoped to the active school term.
DROP POLICY IF EXISTS "Public read waste showcase reports" ON public.waste_bank_showcase_reports;
CREATE POLICY "Public read current waste showcase report"
ON public.waste_bank_showcase_reports FOR SELECT
USING (
  academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
  AND semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
);

DROP POLICY IF EXISTS "Public read published waste showcase photos" ON public.waste_bank_showcase_photos;
CREATE POLICY "Public read current published waste showcase photos"
ON public.waste_bank_showcase_photos FOR SELECT
USING (
  is_published
  AND EXISTS (
    SELECT 1
    FROM public.waste_bank_showcase_reports report
    WHERE report.id = report_id
      AND report.academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
      AND report.semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
  )
);

DROP POLICY IF EXISTS "Read permitted waste showcase images" ON storage.objects;
CREATE POLICY "Read permitted waste showcase images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'waste-bank-showcase'
  AND (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.waste_bank_showcase_photos photo
      JOIN public.waste_bank_showcase_reports report ON report.id = photo.report_id
      WHERE photo.storage_path = name
        AND photo.is_published
        AND report.academic_year = (SELECT value FROM public.school_settings WHERE key = 'active_academic_year')
        AND report.semester = (SELECT value FROM public.school_settings WHERE key = 'active_semester')
    )
  )
);

-- Existing schools may have a customized menu_config that overrides code defaults.
-- Append the new service item without replacing any administrator customization.
UPDATE public.school_settings
SET value = jsonb_set(
  value::jsonb,
  '{items}',
  COALESCE(value::jsonb -> 'items', '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'id', 'waste-bank-results',
      'label', 'ผลการดำเนินงานธนาคารขยะ',
      'href', '/waste-bank/results',
      'icon', 'Presentation',
      'parent', 'services',
      'order', 6
    )
  )
)::text
WHERE key = 'menu_config'
  AND jsonb_typeof(value::jsonb -> 'items') = 'array'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(value::jsonb -> 'items') item
    WHERE item ->> 'id' = 'waste-bank-results'
  );

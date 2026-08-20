-- Public Waste Bank outcomes page + admin-managed narrative and photo gallery.

CREATE TABLE public.waste_bank_showcase_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'ผลการดำเนินงานธนาคารขยะ',
  introduction TEXT NOT NULL DEFAULT 'ร่วมกันคัดแยกขยะ เปลี่ยนวัสดุรีไซเคิลเป็นแต้ม และสร้างนิสัยรับผิดชอบต่อสิ่งแวดล้อม',
  goal_text TEXT NOT NULL DEFAULT 'ปลูกฝังการคัดแยกขยะและการใช้ทรัพยากรอย่างรู้คุณค่า',
  highlight_text TEXT NOT NULL DEFAULT 'ทุกชิ้นที่นำมาฝาก คือการลงมือสร้างโรงเรียนสีเขียวร่วมกัน',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year, semester)
);

CREATE TABLE public.waste_bank_showcase_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.waste_bank_showcase_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('waste_delivery', 'reward_claim', 'reward_handover')),
  storage_path TEXT NOT NULL UNIQUE,
  caption TEXT NOT NULL DEFAULT '',
  activity_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_waste_showcase_photos_report_sort
  ON public.waste_bank_showcase_photos (report_id, sort_order, created_at);
CREATE INDEX idx_waste_showcase_photos_public
  ON public.waste_bank_showcase_photos (report_id, category, sort_order)
  WHERE is_published = true;

ALTER TABLE public.waste_bank_showcase_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_bank_showcase_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read waste showcase reports"
  ON public.waste_bank_showcase_reports FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Admin manage waste showcase reports"
  ON public.waste_bank_showcase_reports FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Public read published waste showcase photos"
  ON public.waste_bank_showcase_photos FOR SELECT
  TO anon, authenticated
  USING (is_published OR (SELECT public.is_admin()));
CREATE POLICY "Admin manage waste showcase photos"
  ON public.waste_bank_showcase_photos FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

GRANT SELECT ON public.waste_bank_showcase_reports TO anon, authenticated;
GRANT SELECT ON public.waste_bank_showcase_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.waste_bank_showcase_reports TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.waste_bank_showcase_photos TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'waste-bank-showcase',
  'waste-bank-showcase',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Read permitted waste showcase images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'waste-bank-showcase'
    AND (
      (SELECT public.is_admin())
      OR EXISTS (
        SELECT 1
        FROM public.waste_bank_showcase_photos photo
        WHERE photo.storage_path = name
          AND photo.is_published = true
      )
    )
  );
CREATE POLICY "Admin upload waste showcase images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'waste-bank-showcase' AND (SELECT public.is_admin()));
CREATE POLICY "Admin update waste showcase images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'waste-bank-showcase' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'waste-bank-showcase' AND (SELECT public.is_admin()));
CREATE POLICY "Admin delete waste showcase images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'waste-bank-showcase' AND (SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.get_waste_bank_public_results()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH active_term AS (
    SELECT
      COALESCE((SELECT value FROM public.school_settings WHERE key = 'active_academic_year'), '') AS academic_year,
      COALESCE((SELECT value FROM public.school_settings WHERE key = 'active_semester'), '') AS semester
  ),
  term_tx AS (
    SELECT wt.*
    FROM public.waste_transactions wt, active_term term
    WHERE wt.academic_year = term.academic_year
      AND wt.semester = term.semester
  ),
  term_claims AS (
    SELECT rc.*
    FROM public.reward_claims rc, active_term term
    WHERE rc.academic_year = term.academic_year
      AND rc.semester = term.semester
      AND rc.status = 'approved'
  ),
  totals AS (
    SELECT
      COUNT(*)::INTEGER AS transactions,
      COALESCE(SUM(quantity), 0)::INTEGER AS items,
      COUNT(DISTINCT student_id)::INTEGER AS students,
      COALESCE(SUM(points_earned), 0)::INTEGER AS points,
      MAX(GREATEST(created_at, transaction_date::TIMESTAMPTZ)) AS latest_transaction
    FROM term_tx
  ),
  reward_totals AS (
    SELECT
      COUNT(*)::INTEGER AS approved_claims,
      COALESCE(SUM(quantity), 0)::INTEGER AS awarded_items,
      MAX(reviewed_at) AS latest_reward
    FROM term_claims
  ),
  category_rows AS (
    SELECT wc.id, wc.name, wc.icon, COALESCE(SUM(tx.quantity), 0)::INTEGER AS items
    FROM public.waste_categories wc
    LEFT JOIN term_tx tx ON tx.category_id = wc.id
    GROUP BY wc.id, wc.name, wc.icon, wc.order_position
    HAVING COALESCE(SUM(tx.quantity), 0) > 0
    ORDER BY items DESC, wc.order_position
  ),
  monthly_rows AS (
    SELECT
      to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
      SUM(quantity)::INTEGER AS items,
      COUNT(*)::INTEGER AS transactions
    FROM term_tx
    GROUP BY date_trunc('month', transaction_date)
    ORDER BY date_trunc('month', transaction_date)
  ),
  student_rows AS (
    SELECT
      tx.student_id,
      MAX(tx.student_name) AS name,
      MAX(tx.student_class) AS class_name,
      MAX(s.photo_url) AS photo_url,
      SUM(tx.quantity)::INTEGER AS items,
      COUNT(*)::INTEGER AS transactions,
      SUM(tx.points_earned)::INTEGER AS points
    FROM term_tx tx
    LEFT JOIN public.students s ON s.id = tx.student_id
    WHERE tx.student_id IS NOT NULL
    GROUP BY tx.student_id
    ORDER BY points DESC, items DESC, name
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'academic_year', term.academic_year,
    'semester', term.semester,
    'updated_at', GREATEST(t.latest_transaction, r.latest_reward),
    'totals', jsonb_build_object(
      'items', t.items,
      'transactions', t.transactions,
      'students', t.students,
      'points', t.points,
      'approved_claims', r.approved_claims,
      'awarded_items', r.awarded_items
    ),
    'categories', COALESCE((SELECT jsonb_agg(to_jsonb(category_rows)) FROM category_rows), '[]'::jsonb),
    'monthly', COALESCE((SELECT jsonb_agg(to_jsonb(monthly_rows)) FROM monthly_rows), '[]'::jsonb),
    'top_students', COALESCE((SELECT jsonb_agg(to_jsonb(student_rows) - 'student_id') FROM student_rows), '[]'::jsonb)
  )
  FROM active_term term
  CROSS JOIN totals t
  CROSS JOIN reward_totals r;
$$;

REVOKE ALL ON FUNCTION public.get_waste_bank_public_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_waste_bank_public_results() TO anon, authenticated;

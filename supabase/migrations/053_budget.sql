-- ============================================================================
-- Migration 053: Budget / การเงิน
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year   INTEGER NOT NULL,
  code          TEXT,
  name          TEXT NOT NULL,
  allocated     NUMERIC(14,2) NOT NULL DEFAULT 0,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fiscal_year, code)
);

CREATE INDEX IF NOT EXISTS idx_budget_categories_year ON public.budget_categories(fiscal_year);

CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES public.budget_categories(id) ON DELETE CASCADE,
  txn_type      TEXT NOT NULL DEFAULT 'เบิกจ่าย'
                CHECK (txn_type IN ('เบิกจ่าย','ผูกพัน','โอน','คืน')),
  amount        NUMERIC(14,2) NOT NULL,
  txn_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  doc_ref       TEXT,
  vendor        TEXT,
  note          TEXT,
  posted_by     UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_transactions_cat ON public.budget_transactions(category_id, txn_date DESC);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_budget_categories"
  ON public.budget_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_budget_categories"
  ON public.budget_categories FOR SELECT USING (public.is_teacher());

CREATE POLICY "admin_manage_budget_transactions"
  ON public.budget_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "teacher_read_budget_transactions"
  ON public.budget_transactions FOR SELECT USING (public.is_teacher());

CREATE OR REPLACE VIEW public.v_budget_summary AS
SELECT
  c.id AS category_id, c.fiscal_year, c.code, c.name, c.allocated,
  COALESCE(SUM(CASE WHEN t.txn_type = 'เบิกจ่าย' THEN t.amount ELSE 0 END), 0) AS paid,
  COALESCE(SUM(CASE WHEN t.txn_type = 'ผูกพัน'  THEN t.amount ELSE 0 END), 0) AS committed,
  COALESCE(SUM(CASE WHEN t.txn_type = 'คืน'     THEN t.amount ELSE 0 END), 0) AS refunded,
  c.allocated
    - COALESCE(SUM(CASE WHEN t.txn_type IN ('เบิกจ่าย','ผูกพัน') THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.txn_type = 'คืน' THEN t.amount ELSE 0 END), 0)
    AS remaining
FROM public.budget_categories c
LEFT JOIN public.budget_transactions t ON t.category_id = c.id
GROUP BY c.id, c.fiscal_year, c.code, c.name, c.allocated;

GRANT SELECT ON public.v_budget_summary TO authenticated;

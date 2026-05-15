-- ============================================================================
-- Migration 045: ระบบ "ธนาคารพอเพียง" (Savings Bank)
-- ============================================================================
-- ระบบฝาก/ถอนเงินจริง (บาท) สำหรับนักเรียนประถม สอนวินัยการออม
-- สอดคล้องปรัชญาเศรษฐกิจพอเพียงใน footer
--
-- โครงสร้าง:
-- (A) ตาราง savings_transactions — บันทึกธุรกรรมฝาก/ถอน
-- (B) VIEW savings_student_summary — ยอดเงินสะสมรายคน (cumulative ไม่ scope term)
-- (C) RLS policies — public SELECT, teacher/admin write
-- (D) RPC public: lookup_savings_balance(code) + get_savings_history(code, limit)
-- ============================================================================

-- ─── (A) Table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_class TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit','withdraw')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(10,2),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by TEXT,
  recorded_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  recorded_by_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL,
  academic_year TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_txn_student
  ON public.savings_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_savings_txn_date
  ON public.savings_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_savings_txn_term
  ON public.savings_transactions(academic_year, semester);

-- ─── (B) Summary VIEW (cumulative — savings ไม่ reset ทุกเทอม) ─────────────
DROP VIEW IF EXISTS public.savings_student_summary;
CREATE VIEW public.savings_student_summary AS
SELECT
  s.id           AS student_id,
  s.name         AS full_name,
  s.class        AS class_name,
  s.photo_url,
  s.student_code,
  COUNT(t.id)::int AS total_transactions,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'deposit'  THEN t.amount ELSE 0 END), 0)::numeric(10,2) AS total_deposits,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'withdraw' THEN t.amount ELSE 0 END), 0)::numeric(10,2) AS total_withdrawals,
  COALESCE(
    SUM(CASE WHEN t.transaction_type = 'deposit'  THEN  t.amount
             WHEN t.transaction_type = 'withdraw' THEN -t.amount
             ELSE 0 END), 0
  )::numeric(10,2) AS current_balance
FROM public.students s
LEFT JOIN public.savings_transactions t ON t.student_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code;

-- ─── (C) RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_savings_transactions"  ON public.savings_transactions;
DROP POLICY IF EXISTS "teacher_write_savings_transactions" ON public.savings_transactions;

-- SELECT: public (เพื่อให้ student lookup ผ่าน summary view ทำงานได้ + parent view)
CREATE POLICY "public_read_savings_transactions"
  ON public.savings_transactions
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: teacher หรือ admin
CREATE POLICY "teacher_write_savings_transactions"
  ON public.savings_transactions
  FOR ALL
  USING (public.is_teacher() OR public.is_admin())
  WITH CHECK (public.is_teacher() OR public.is_admin());

-- ─── (D) Public RPCs ───────────────────────────────────────────────────────

-- lookup_savings_balance: นักเรียนเช็คยอดเงินตัวเองด้วย student_code (no auth)
CREATE OR REPLACE FUNCTION public.lookup_savings_balance(p_code TEXT)
RETURNS TABLE (
  student_id      UUID,
  full_name       TEXT,
  class_name      TEXT,
  photo_url       TEXT,
  current_balance NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.student_id,
    s.full_name,
    s.class_name,
    s.photo_url,
    s.current_balance
  FROM public.savings_student_summary s
  WHERE s.student_code = p_code
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_savings_balance(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_savings_balance(TEXT) TO anon, authenticated;

-- get_savings_history: ดึงประวัติธุรกรรมของนักเรียนด้วย student_code (no auth)
CREATE OR REPLACE FUNCTION public.get_savings_history(p_code TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  txn_id            UUID,
  transaction_type  TEXT,
  amount            NUMERIC,
  balance_after     NUMERIC,
  transaction_date  DATE,
  notes             TEXT,
  recorded_by       TEXT,
  academic_year     TEXT,
  semester          TEXT,
  created_at        TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    t.id,
    t.transaction_type,
    t.amount,
    t.balance_after,
    t.transaction_date,
    t.notes,
    t.recorded_by,
    t.academic_year,
    t.semester,
    t.created_at
  FROM public.savings_transactions t
  JOIN public.students s ON s.id = t.student_id
  WHERE s.student_code = p_code
  ORDER BY t.transaction_date DESC, t.created_at DESC
  LIMIT p_limit
$$;

REVOKE ALL ON FUNCTION public.get_savings_history(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_savings_history(TEXT, INT) TO anon, authenticated;

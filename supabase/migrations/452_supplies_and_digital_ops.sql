-- ===============================================================
-- Migration 452: พัสดุพื้นฐาน + ตัวชี้วัดลดภาระครู (BAYAO Smart Office)
-- ===============================================================

-- ── พัสดุ / วัสดุ ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supply_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'วัสดุสำนักงาน',
  unit          TEXT NOT NULL DEFAULT 'ชิ้น',
  stock         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  location      TEXT,
  note          TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_items_active ON public.supply_items(is_active, category);

CREATE TABLE IF NOT EXISTS public.supply_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.supply_items(id) ON DELETE RESTRICT,
  staff_id        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  quantity        NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  purpose         TEXT,
  status          TEXT NOT NULL DEFAULT 'รออนุมัติ'
                  CHECK (status IN ('รออนุมัติ','อนุมัติ','จ่ายแล้ว','ไม่อนุมัติ','ยกเลิก')),
  reviewed_by     UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_requests_status ON public.supply_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_requests_staff ON public.supply_requests(staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_requests_item ON public.supply_requests(item_id);

ALTER TABLE public.supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_supply_items" ON public.supply_items;
CREATE POLICY "admin_manage_supply_items"
  ON public.supply_items FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teacher_read_supply_items" ON public.supply_items;
CREATE POLICY "teacher_read_supply_items"
  ON public.supply_items FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_supply_requests" ON public.supply_requests;
CREATE POLICY "admin_manage_supply_requests"
  ON public.supply_requests FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teacher_insert_own_supply_requests" ON public.supply_requests;
CREATE POLICY "teacher_insert_own_supply_requests"
  ON public.supply_requests FOR INSERT
  WITH CHECK (
    public.is_teacher()
    AND staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_read_own_supply_requests" ON public.supply_requests;
CREATE POLICY "teacher_read_own_supply_requests"
  ON public.supply_requests FOR SELECT
  USING (
    public.is_admin()
    OR staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_cancel_own_pending_supply_requests" ON public.supply_requests;
CREATE POLICY "teacher_cancel_own_pending_supply_requests"
  ON public.supply_requests FOR UPDATE
  USING (
    status = 'รออนุมัติ'
    AND staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('รออนุมัติ', 'ยกเลิก')
    AND staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Approve + deduct stock in one transaction
CREATE OR REPLACE FUNCTION public.approve_supply_request(
  p_request_id UUID,
  p_review_note TEXT DEFAULT NULL
)
RETURNS public.supply_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.supply_requests;
  v_item public.supply_items;
  v_reviewer UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT staff_id INTO v_reviewer
  FROM public.user_roles
  WHERE user_id = auth.uid() AND staff_id IS NOT NULL
  LIMIT 1;

  SELECT * INTO v_req FROM public.supply_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF v_req.status <> 'รออนุมัติ' THEN RAISE EXCEPTION 'request not pending'; END IF;

  SELECT * INTO v_item FROM public.supply_items WHERE id = v_req.item_id FOR UPDATE;
  IF NOT FOUND OR NOT v_item.is_active THEN RAISE EXCEPTION 'item unavailable'; END IF;
  IF v_item.stock < v_req.quantity THEN RAISE EXCEPTION 'stock insufficient'; END IF;

  UPDATE public.supply_items
  SET stock = stock - v_req.quantity, updated_at = NOW()
  WHERE id = v_item.id;

  UPDATE public.supply_requests
  SET status = 'จ่ายแล้ว',
      reviewed_by = v_reviewer,
      reviewed_at = NOW(),
      review_note = p_review_note
  WHERE id = p_request_id
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_supply_request(
  p_request_id UUID,
  p_review_note TEXT DEFAULT NULL
)
RETURNS public.supply_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.supply_requests;
  v_reviewer UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT staff_id INTO v_reviewer
  FROM public.user_roles
  WHERE user_id = auth.uid() AND staff_id IS NOT NULL
  LIMIT 1;

  UPDATE public.supply_requests
  SET status = 'ไม่อนุมัติ',
      reviewed_by = v_reviewer,
      reviewed_at = NOW(),
      review_note = p_review_note
  WHERE id = p_request_id AND status = 'รออนุมัติ'
  RETURNING * INTO v_req;

  IF NOT FOUND THEN RAISE EXCEPTION 'request not found or not pending'; END IF;
  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_supply_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_supply_request(UUID, TEXT) TO authenticated;

-- ── ตัวชี้วัดลดภาระครู ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.digital_workload_baselines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key      TEXT NOT NULL,
  workflow_label    TEXT NOT NULL,
  minutes_before    NUMERIC(8,1) NOT NULL CHECK (minutes_before >= 0),
  minutes_after     NUMERIC(8,1) NOT NULL CHECK (minutes_after >= 0),
  note              TEXT,
  recorded_by       UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_key)
);

CREATE TABLE IF NOT EXISTS public.digital_paper_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_be         INTEGER NOT NULL,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  sheets_used     INTEGER NOT NULL DEFAULT 0 CHECK (sheets_used >= 0),
  note            TEXT,
  recorded_by     UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year_be, month)
);

ALTER TABLE public.digital_workload_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_paper_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_workload_baselines" ON public.digital_workload_baselines;
CREATE POLICY "admin_manage_workload_baselines"
  ON public.digital_workload_baselines FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teacher_read_workload_baselines" ON public.digital_workload_baselines;
CREATE POLICY "teacher_read_workload_baselines"
  ON public.digital_workload_baselines FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_paper_logs" ON public.digital_paper_logs;
CREATE POLICY "admin_manage_paper_logs"
  ON public.digital_paper_logs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teacher_read_paper_logs" ON public.digital_paper_logs;
CREATE POLICY "teacher_read_paper_logs"
  ON public.digital_paper_logs FOR SELECT
  USING (public.is_teacher() OR public.is_admin());

-- Seed starter inventory
INSERT INTO public.supply_items (name, category, unit, stock, min_stock, location)
VALUES
  ('กระดาษ A4', 'วัสดุสำนักงาน', 'รีม', 20, 5, 'ห้องธุรการ'),
  ('ปากกาลูกลื่น', 'วัสดุสำนักงาน', 'ด้าม', 50, 10, 'ห้องธุรการ'),
  ('หมึกพิมพ์ขาวดำ', 'วัสดุสำนักงาน', 'ตลับ', 4, 1, 'ห้องธุรการ'),
  ('ชอล์ก / ปากกาไวท์บอร์ด', 'วัสดุการเรียน', 'กล่อง', 10, 2, 'คลังพัสดุ'),
  ('กระดาษสี', 'วัสดุการเรียน', 'แพ็ก', 8, 2, 'คลังพัสดุ');

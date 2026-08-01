-- ===============================================================
-- Migration 453: พัสดุ — โฟลว์คืนของ (จ่ายแล้ว → ขอคืน → คืนแล้ว)
-- ===============================================================

ALTER TABLE public.supply_requests
  DROP CONSTRAINT IF EXISTS supply_requests_status_check;

ALTER TABLE public.supply_requests
  ADD CONSTRAINT supply_requests_status_check
  CHECK (status IN (
    'รออนุมัติ',
    'อนุมัติ',
    'จ่ายแล้ว',
    'ขอคืน',
    'คืนแล้ว',
    'ไม่อนุมัติ',
    'ยกเลิก'
  ));

-- Teacher: cancel pending OR request return on fulfilled items
DROP POLICY IF EXISTS "teacher_cancel_own_pending_supply_requests" ON public.supply_requests;
DROP POLICY IF EXISTS "teacher_update_own_supply_requests" ON public.supply_requests;
CREATE POLICY "teacher_update_own_supply_requests"
  ON public.supply_requests FOR UPDATE
  USING (
    staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
    AND status IN ('รออนุมัติ', 'จ่ายแล้ว')
  )
  WITH CHECK (
    staff_id IN (
      SELECT s.id FROM public.staff s
      JOIN public.user_roles ur ON ur.staff_id = s.id
      WHERE ur.user_id = auth.uid()
    )
    AND status IN ('รออนุมัติ', 'ยกเลิก', 'จ่ายแล้ว', 'ขอคืน')
  );

-- Admin confirms return and restores stock
CREATE OR REPLACE FUNCTION public.return_supply_request(
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
  IF v_req.status <> 'ขอคืน' THEN RAISE EXCEPTION 'request not awaiting return'; END IF;

  SELECT * INTO v_item FROM public.supply_items WHERE id = v_req.item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'item not found'; END IF;

  UPDATE public.supply_items
  SET stock = stock + v_req.quantity, updated_at = NOW()
  WHERE id = v_item.id;

  UPDATE public.supply_requests
  SET status = 'คืนแล้ว',
      reviewed_by = v_reviewer,
      reviewed_at = NOW(),
      review_note = COALESCE(p_review_note, review_note)
  WHERE id = p_request_id
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_supply_request(UUID, TEXT) TO authenticated;

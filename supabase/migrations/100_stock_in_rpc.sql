-- ============================================================================
-- Migration 100: Stock Management in RPC (drop trigger, atomic in RPC)
-- ============================================================================
-- ปัญหา: trigger trg_reward_claim_status_change ใน prod เคยหายเงียบๆ
-- (migration 081 รัน function สำเร็จแต่ trigger ไม่ติด) → stock drift
-- เปลี่ยน architecture:
-- - stock หัก inline ใน claim_reward RPC (atomic, ไม่พึ่ง trigger)
-- - reject_reward_claim RPC คืน stock (idempotent)
-- - approve_reward_claim RPC ไม่กระทบ stock (pending→approved ไม่ต้องเปลี่ยน)
-- - admin_set_reward_stock RPC สำหรับ reconcile drift รายตัว
-- - DROP trigger เพราะไม่ต้องการอีก
-- function handle_reward_claim_status_change() คงไว้ (deprecated comment)
-- ============================================================================

-- ─── (A) claim_reward — หัก stock inline ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_reward(
  p_code TEXT, p_reward_id UUID, p_quantity INT DEFAULT 1
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_balance    INT;
  v_reward     RECORD;
  v_claim_id   UUID;
  v_year       TEXT;
  v_sem        TEXT;
  v_total      INT;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
  END IF;

  SELECT year, sem INTO v_year, v_sem FROM active_term();

  SELECT s.student_id, s.available_points
    INTO v_student_id, v_balance
    FROM public.waste_student_summary s
   WHERE s.student_code = p_code
   LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT r.id, r.name, r.points_cost, r.stock, r.is_active
    INTO v_reward
    FROM public.rewards r
   WHERE r.id = p_reward_id
     FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  v_total := v_reward.points_cost * p_quantity;

  IF v_balance < v_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  IF v_reward.stock IS NOT NULL AND v_reward.stock < p_quantity THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reward_claims
    (student_id, reward_id, reward_name, points_used, quantity, status,
     academic_year, semester, balance_after)
  VALUES
    (v_student_id, v_reward.id, v_reward.name, v_total, p_quantity, 'pending',
     v_year, v_sem, v_balance - v_total)
  RETURNING id INTO v_claim_id;

  -- หัก stock atomic (ไม่พึ่ง trigger)
  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards
       SET stock = GREATEST(0, v_reward.stock - p_quantity)
     WHERE id = p_reward_id;
  END IF;

  RETURN v_claim_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_reward(TEXT, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reward(TEXT, UUID, INT) TO anon, authenticated;


-- ─── (B) approve_reward_claim — ไม่กระทบ stock ────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_reward_claim(p_claim_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_claim RECORD;
  v_staff UUID;
  v_admin UUID;
BEGIN
  SELECT id, reward_id, status INTO v_claim
    FROM public.reward_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE='P0001';
  END IF;
  -- idempotent
  IF v_claim.status = 'approved' THEN RETURN; END IF;

  IF NOT public.can_approve_reward(v_claim.reward_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE='42501';
  END IF;

  SELECT staff_id, administrator_id INTO v_staff, v_admin
    FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;

  UPDATE public.reward_claims
     SET status='approved',
         reviewed_at=NOW(),
         reviewed_by=auth.uid(),
         approved_by_staff_id=v_staff,
         approved_by_administrator_id=v_admin
   WHERE id = p_claim_id;
  -- pending → approved: stock ไม่กระทบ (หักไปแล้วตอน INSERT)
  -- rejected → approved: ก็ไม่หักซ้ำ (หายากแต่ถ้ามี admin reverse, ต้อง manual reset stock)
END;
$$;
REVOKE ALL ON FUNCTION public.approve_reward_claim(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_reward_claim(UUID) TO authenticated;


-- ─── (C) reject_reward_claim — คืน stock เฉพาะถ้า OLD status active ───────
CREATE OR REPLACE FUNCTION public.reject_reward_claim(
  p_claim_id UUID, p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_claim RECORD;
  v_staff UUID;
  v_admin UUID;
BEGIN
  SELECT id, reward_id, status, quantity INTO v_claim
    FROM public.reward_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLAIM_NOT_FOUND' USING ERRCODE='P0001';
  END IF;
  -- idempotent — กัน double-restore
  IF v_claim.status = 'rejected' THEN RETURN; END IF;

  IF NOT public.can_approve_reward(v_claim.reward_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE='42501';
  END IF;

  SELECT staff_id, administrator_id INTO v_staff, v_admin
    FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;

  UPDATE public.reward_claims
     SET status='rejected',
         reviewed_at=NOW(),
         reviewed_by=auth.uid(),
         rejection_reason=p_reason,
         approved_by_staff_id=v_staff,
         approved_by_administrator_id=v_admin
   WHERE id = p_claim_id;

  -- คืน stock เฉพาะถ้า OLD status เป็น active (pending/approved)
  IF v_claim.status IN ('pending','approved') THEN
    UPDATE public.rewards
       SET stock = CASE
                     WHEN stock IS NOT NULL THEN stock + COALESCE(v_claim.quantity, 1)
                     ELSE NULL
                   END
     WHERE id = v_claim.reward_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.reject_reward_claim(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_reward_claim(UUID, TEXT) TO authenticated;


-- ─── (D) admin_set_reward_stock — reconcile drift รายตัว (admin only) ─────
CREATE OR REPLACE FUNCTION public.admin_set_reward_stock(
  p_reward_id UUID, p_new_stock INT
)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_final INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE='42501';
  END IF;
  v_final := GREATEST(0, COALESCE(p_new_stock, 0));
  UPDATE public.rewards
     SET stock = v_final, updated_at = NOW()
   WHERE id = p_reward_id;
  RETURN v_final;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_reward_stock(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_reward_stock(UUID, INT) TO authenticated;


-- ─── (E) Drop trigger — เลิกพึ่ง trigger ────────────────────────────────
DROP TRIGGER IF EXISTS trg_reward_claim_status_change ON public.reward_claims;

-- คง function ไว้สำหรับ emergency rollback (re-attach trigger ได้)
COMMENT ON FUNCTION public.handle_reward_claim_status_change() IS
  'DEPRECATED v1.37.4: stock logic moved to claim_reward/reject_reward_claim/admin_set_reward_stock RPCs. Trigger trg_reward_claim_status_change was dropped. Keep this function as escape hatch in case of emergency rollback.';

-- หลัง deploy: admin ควรเข้า Rewards Management → ตรวจรางวัลที่มี
-- active claims รวม > stock → กด pencil ข้าง stock เพื่อ reset ค่าให้ตรงสต๊อกจริง
-- query สำหรับ admin: SELECT r.name, r.stock, SUM(rc.quantity) FILTER (WHERE rc.status IN ('pending','approved'))
--                     FROM rewards r LEFT JOIN reward_claims rc ON rc.reward_id=r.id
--                     GROUP BY r.id, r.name, r.stock HAVING r.stock IS NOT NULL;

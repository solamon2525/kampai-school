-- ============================================================================
-- Migration 099: Reward Claim Quantity (multi-item per claim)
-- ============================================================================
-- หน้า /waste-bank/rewards เดิมแลกได้ทีละ 1 ชิ้น (hard-coded points_used = cost)
-- → เพิ่ม column quantity + อัปเดต claim_reward RPC ให้รับ p_quantity
-- → อัปเดต stock trigger ให้ ±NEW.quantity แทน ±1
-- → get_student_history คืน quantity ด้วย เผื่อแสดงผลในประวัติ
-- ============================================================================

-- (A) เพิ่ม column quantity (default 1 → backward compat กับ row เก่า)
ALTER TABLE public.reward_claims
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1
    CHECK (quantity > 0);

-- (B) Replace claim_reward — 3 args, p_quantity DEFAULT 1
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

  -- 1. lookup student + balance ใน term ปัจจุบัน
  SELECT s.student_id, s.available_points
    INTO v_student_id, v_balance
    FROM public.waste_student_summary s
   WHERE s.student_code = p_code
   LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 2. lock + read reward
  SELECT r.id, r.name, r.points_cost, r.stock, r.is_active
    INTO v_reward
    FROM public.rewards r
   WHERE r.id = p_reward_id
     FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  v_total := v_reward.points_cost * p_quantity;

  -- 3. balance check (รวม quantity)
  IF v_balance < v_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  -- 4. stock check (NULL = unlimited, มี cap → ต้องพอตาม quantity)
  IF v_reward.stock IS NOT NULL AND v_reward.stock < p_quantity THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  -- 5. insert claim พร้อม quantity + term + balance_after
  INSERT INTO public.reward_claims
    (student_id, reward_id, reward_name, points_used, quantity, status,
     academic_year, semester, balance_after)
  VALUES
    (v_student_id, v_reward.id, v_reward.name, v_total, p_quantity, 'pending',
     v_year, v_sem, v_balance - v_total)
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$;

-- Drop signature เก่า (2-arg) เพื่อกัน ambiguous overload — 3-arg DEFAULT 1 ครอบคลุมทั้งคู่
DROP FUNCTION IF EXISTS public.claim_reward(TEXT, UUID);
REVOKE ALL ON FUNCTION public.claim_reward(TEXT, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reward(TEXT, UUID, INT) TO anon, authenticated;

-- (C) อัปเดต stock trigger ให้ใช้ NEW.quantity / OLD.quantity แทน ±1
CREATE OR REPLACE FUNCTION public.handle_reward_claim_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qty INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_qty := COALESCE(NEW.quantity, 1);
    IF NEW.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
         SET stock = CASE
                       WHEN stock IS NOT NULL THEN GREATEST(0, stock - v_qty)
                       ELSE NULL
                     END
       WHERE id = NEW.reward_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_qty := COALESCE(NEW.quantity, OLD.quantity, 1);
    -- active → rejected: คืน stock +qty
    IF OLD.status IN ('pending', 'approved') AND NEW.status = 'rejected' THEN
      UPDATE public.rewards
         SET stock = CASE
                       WHEN stock IS NOT NULL THEN stock + v_qty
                       ELSE NULL
                     END
       WHERE id = NEW.reward_id;
    -- rejected → active: หัก stock -qty
    ELSIF OLD.status = 'rejected' AND NEW.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
         SET stock = CASE
                       WHEN stock IS NOT NULL THEN GREATEST(0, stock - v_qty)
                       ELSE NULL
                     END
       WHERE id = NEW.reward_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_qty := COALESCE(OLD.quantity, 1);
    IF OLD.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
         SET stock = CASE
                       WHEN stock IS NOT NULL THEN stock + v_qty
                       ELSE NULL
                     END
       WHERE id = OLD.reward_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
-- (Re)attach trigger — กันกรณี trg_reward_claim_status_change ไม่ได้ติดใน env บางตัว
-- (เคยพบใน prod ที่ migration 081 รัน function สำเร็จแต่ trigger ไม่ติด)
DROP TRIGGER IF EXISTS trg_reward_claim_status_change ON public.reward_claims;
CREATE TRIGGER trg_reward_claim_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.reward_claims
FOR EACH ROW
EXECUTE FUNCTION public.handle_reward_claim_status_change();

-- (D) get_student_history คืน quantity เพิ่มเติม
CREATE OR REPLACE FUNCTION public.get_student_history(p_code TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  claim_id      UUID,
  reward_name   TEXT,
  reward_image  TEXT,
  points_used   INT,
  quantity      INT,
  balance_after INT,
  status        reward_claim_status,
  claimed_at    TIMESTAMPTZ,
  academic_year TEXT,
  semester      TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    rc.id,
    rc.reward_name,
    r.image_url,
    rc.points_used,
    rc.quantity,
    rc.balance_after,
    rc.status,
    rc.claimed_at,
    rc.academic_year,
    rc.semester
  FROM reward_claims rc
  JOIN students s ON s.id = rc.student_id
  LEFT JOIN rewards r ON r.id = rc.reward_id
  WHERE s.student_code = p_code
  ORDER BY rc.claimed_at DESC
  LIMIT p_limit
$$;
REVOKE ALL ON FUNCTION public.get_student_history(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_history(TEXT, INT) TO anon, authenticated;

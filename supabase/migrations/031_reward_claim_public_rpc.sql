-- 031_reward_claim_public_rpc.sql
-- Public-facing RPCs for student-initiated reward claims (no auth required).
-- Both functions are SECURITY DEFINER so anon can call them; all business
-- rules (student lookup by code, balance, stock, active) are enforced inside.

-- ─── lookup_student_balance ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lookup_student_balance(p_code TEXT)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  class_name TEXT,
  photo_url TEXT,
  available_points INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.student_id,
    s.full_name,
    s.class_name,
    s.photo_url,
    s.available_points
  FROM public.waste_student_summary s
  WHERE s.student_code = p_code
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_student_balance(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_student_balance(TEXT) TO anon, authenticated;

-- ─── claim_reward ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_reward(p_code TEXT, p_reward_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_balance INT;
  v_reward RECORD;
  v_claim_id UUID;
BEGIN
  -- 1. lookup student by code (uses summary view = post-RLS-bypass via SECURITY DEFINER)
  SELECT s.student_id, s.available_points
    INTO v_student_id, v_balance
  FROM public.waste_student_summary s
  WHERE s.student_code = p_code
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 2. lock + read reward row
  SELECT r.id, r.name, r.points_cost, r.stock, r.is_active
    INTO v_reward
  FROM public.rewards r
  WHERE r.id = p_reward_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  -- 3. balance check (available_points already accounts for pending+approved claims)
  IF v_balance < v_reward.points_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  -- 4. stock check (NULL stock = unlimited)
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  -- 5. insert pending claim
  INSERT INTO public.reward_claims
    (student_id, reward_id, reward_name, points_used, status)
  VALUES
    (v_student_id, v_reward.id, v_reward.name, v_reward.points_cost, 'pending')
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_reward(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reward(TEXT, UUID) TO anon, authenticated;

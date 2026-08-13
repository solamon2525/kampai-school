-- Reward dual-wallet pricing: waste-bank points + virtue points.
-- Existing rewards/claims remain waste-points-only for backward compatibility.

ALTER TABLE public.rewards
  ADD COLUMN waste_points_cost integer NOT NULL DEFAULT 0,
  ADD COLUMN virtue_points_cost integer NOT NULL DEFAULT 0;

UPDATE public.rewards
SET waste_points_cost = points_cost,
    virtue_points_cost = 0;

ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_wallet_costs_nonnegative
    CHECK (waste_points_cost >= 0 AND virtue_points_cost >= 0),
  ADD CONSTRAINT rewards_wallet_costs_not_empty
    CHECK (waste_points_cost + virtue_points_cost > 0);

CREATE OR REPLACE FUNCTION public.normalize_reward_wallet_costs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.points_cost IS DISTINCT FROM OLD.points_cost
     AND NEW.waste_points_cost IS NOT DISTINCT FROM OLD.waste_points_cost
     AND NEW.virtue_points_cost IS NOT DISTINCT FROM OLD.virtue_points_cost THEN
    NEW.waste_points_cost := NEW.points_cost;
    NEW.virtue_points_cost := 0;
  ELSIF NEW.waste_points_cost + NEW.virtue_points_cost = 0 AND NEW.points_cost > 0 THEN
    NEW.waste_points_cost := NEW.points_cost;
  ELSE
    NEW.points_cost := NEW.waste_points_cost + NEW.virtue_points_cost;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_reward_wallet_costs
BEFORE INSERT OR UPDATE OF points_cost, waste_points_cost, virtue_points_cost
ON public.rewards
FOR EACH ROW EXECUTE FUNCTION public.normalize_reward_wallet_costs();

ALTER TABLE public.reward_claims
  ADD COLUMN waste_points_used integer NOT NULL DEFAULT 0,
  ADD COLUMN virtue_points_used integer NOT NULL DEFAULT 0,
  ADD COLUMN waste_balance_after integer,
  ADD COLUMN virtue_balance_after integer;

UPDATE public.reward_claims
SET waste_points_used = points_used,
    virtue_points_used = 0,
    waste_balance_after = balance_after,
    virtue_balance_after = NULL;

ALTER TABLE public.reward_claims
  ADD CONSTRAINT reward_claims_wallet_points_nonnegative
    CHECK (waste_points_used >= 0 AND virtue_points_used >= 0);

CREATE INDEX idx_reward_claims_student_year_active
  ON public.reward_claims(student_id, academic_year, status);

DROP FUNCTION IF EXISTS public.lookup_student_balance(text);
CREATE FUNCTION public.lookup_student_balance(p_code text)
RETURNS TABLE (
  student_id uuid,
  full_name text,
  class_name text,
  photo_url text,
  waste_points_earned integer,
  waste_points_available integer,
  virtue_points_earned integer,
  virtue_points_spent integer,
  virtue_points_available integer,
  virtue_academic_year text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH term AS (SELECT year FROM public.active_term()),
  virtue AS (
    SELECT
      s.id AS student_id,
      GREATEST(0, COALESCE(SUM(
        CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END
      ), 0))::integer AS earned
    FROM public.students s
    CROSS JOIN term t
    LEFT JOIN public.conduct_scores cs
      ON cs.student_id = s.id AND cs.academic_year = t.year
    WHERE s.student_code = p_code AND s.is_active = true
    GROUP BY s.id
  ), spent AS (
    SELECT COALESCE(SUM(rc.virtue_points_used), 0)::integer AS amount
    FROM public.reward_claims rc
    JOIN public.students s ON s.id = rc.student_id
    CROSS JOIN term t
    WHERE s.student_code = p_code
      AND rc.academic_year = t.year
      AND rc.status IN ('pending'::public.reward_claim_status, 'approved'::public.reward_claim_status)
  )
  SELECT
    w.student_id,
    w.full_name,
    w.class_name,
    w.photo_url,
    COALESCE(w.total_points_earned, 0)::integer,
    GREATEST(0, COALESCE(w.available_points, 0))::integer,
    v.earned,
    sp.amount,
    GREATEST(0, v.earned - sp.amount)::integer,
    t.year
  FROM public.waste_student_summary w
  JOIN virtue v ON v.student_id = w.student_id
  CROSS JOIN spent sp
  CROSS JOIN term t
  WHERE w.student_code = p_code
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.lookup_student_balance(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_student_balance(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_reward(
  p_code text, p_reward_id uuid, p_quantity integer DEFAULT 1
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_reward record;
  v_claim_id uuid;
  v_year text;
  v_sem text;
  v_waste_balance integer;
  v_virtue_earned integer;
  v_virtue_spent integer;
  v_virtue_balance integer;
  v_waste_total integer;
  v_virtue_total integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
  END IF;

  SELECT year, sem INTO v_year, v_sem FROM public.active_term();

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_code = p_code AND s.is_active = true
  FOR UPDATE;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT r.id, r.name, r.waste_points_cost, r.virtue_points_cost, r.stock, r.is_active
  INTO v_reward
  FROM public.rewards r
  WHERE r.id = p_reward_id
  FOR UPDATE;
  IF NOT FOUND OR NOT v_reward.is_active THEN
    RAISE EXCEPTION 'REWARD_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT GREATEST(0, COALESCE(w.available_points, 0))::integer
  INTO v_waste_balance
  FROM public.waste_student_summary w
  WHERE w.student_id = v_student_id;

  SELECT GREATEST(0, COALESCE(SUM(
    CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END
  ), 0))::integer
  INTO v_virtue_earned
  FROM public.conduct_scores cs
  WHERE cs.student_id = v_student_id AND cs.academic_year = v_year;

  SELECT COALESCE(SUM(rc.virtue_points_used), 0)::integer
  INTO v_virtue_spent
  FROM public.reward_claims rc
  WHERE rc.student_id = v_student_id
    AND rc.academic_year = v_year
    AND rc.status IN ('pending'::public.reward_claim_status, 'approved'::public.reward_claim_status);

  v_waste_balance := COALESCE(v_waste_balance, 0);
  v_virtue_balance := GREATEST(0, v_virtue_earned - v_virtue_spent);
  v_waste_total := v_reward.waste_points_cost * p_quantity;
  v_virtue_total := v_reward.virtue_points_cost * p_quantity;

  IF v_waste_balance < v_waste_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_WASTE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_virtue_balance < v_virtue_total THEN
    RAISE EXCEPTION 'INSUFFICIENT_VIRTUE_POINTS' USING ERRCODE = 'P0001';
  END IF;
  IF v_reward.stock IS NOT NULL AND v_reward.stock < p_quantity THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reward_claims (
    student_id, reward_id, reward_name, points_used, quantity, status,
    academic_year, semester, balance_after,
    waste_points_used, virtue_points_used, waste_balance_after, virtue_balance_after
  ) VALUES (
    v_student_id, v_reward.id, v_reward.name, v_waste_total, p_quantity, 'pending',
    v_year, v_sem, v_waste_balance - v_waste_total,
    v_waste_total, v_virtue_total, v_waste_balance - v_waste_total,
    v_virtue_balance - v_virtue_total
  ) RETURNING id INTO v_claim_id;

  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards
    SET stock = v_reward.stock - p_quantity, updated_at = now()
    WHERE id = p_reward_id;
  END IF;

  RETURN v_claim_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_reward(text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reward(text, uuid, integer) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_student_history(text, integer);
CREATE FUNCTION public.get_student_history(p_code text, p_limit integer DEFAULT 50)
RETURNS TABLE (
  claim_id uuid,
  reward_name text,
  reward_image text,
  points_used integer,
  quantity integer,
  balance_after integer,
  waste_points_used integer,
  virtue_points_used integer,
  waste_balance_after integer,
  virtue_balance_after integer,
  status public.reward_claim_status,
  claimed_at timestamptz,
  academic_year text,
  semester text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    rc.id, rc.reward_name, r.image_url, rc.points_used, rc.quantity, rc.balance_after,
    rc.waste_points_used, rc.virtue_points_used,
    rc.waste_balance_after, rc.virtue_balance_after,
    rc.status, rc.claimed_at, rc.academic_year, rc.semester
  FROM public.reward_claims rc
  JOIN public.students s ON s.id = rc.student_id
  LEFT JOIN public.rewards r ON r.id = rc.reward_id
  WHERE s.student_code = p_code
  ORDER BY rc.claimed_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100)
$$;
REVOKE ALL ON FUNCTION public.get_student_history(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_history(text, integer) TO anon, authenticated;

COMMENT ON COLUMN public.rewards.waste_points_cost IS 'Waste-bank points required per item.';
COMMENT ON COLUMN public.rewards.virtue_points_cost IS 'Net conduct/virtue points required per item.';
COMMENT ON COLUMN public.reward_claims.virtue_points_used IS 'Virtue points reserved by this claim; rejected claims are excluded from available-balance calculations.';

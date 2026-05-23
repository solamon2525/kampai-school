-- 1. Create a trigger function to handle automatic reward stock deduction/restoration on claim approval/rejection
CREATE OR REPLACE FUNCTION public.handle_reward_claim_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT (if status is approved initially)
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN GREATEST(0, stock - 1)
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    END IF;
  
  -- On UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    -- Transitioning to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN GREATEST(0, stock - 1)
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    -- Transitioning away from 'approved'
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN stock + 1
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Drop the trigger if it already exists, then recreate it
DROP TRIGGER IF EXISTS trg_reward_claim_status_change ON public.reward_claims;
CREATE TRIGGER trg_reward_claim_status_change
AFTER INSERT OR UPDATE ON public.reward_claims
FOR EACH ROW
EXECUTE FUNCTION public.handle_reward_claim_status_change();

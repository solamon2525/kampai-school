-- Migration 081: Better Reward Stock Trigger (Reservation-based Stock Management)

CREATE OR REPLACE FUNCTION public.handle_reward_claim_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. ON INSERT: Deduct stock if a claim is created with 'pending' or 'approved' status
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN GREATEST(0, stock - 1)
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    END IF;
  
  -- 2. ON UPDATE: Handle status transitions
  ELSIF TG_OP = 'UPDATE' THEN
    -- Transitioning from active (pending/approved) to inactive (rejected) -> Restore stock (+1)
    IF OLD.status IN ('pending', 'approved') AND NEW.status = 'rejected' THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN stock + 1
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    
    -- Transitioning from inactive (rejected) to active (pending/approved) -> Deduct stock (-1)
    ELSIF OLD.status = 'rejected' AND NEW.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN GREATEST(0, stock - 1)
                    ELSE NULL 
                  END
      WHERE id = NEW.reward_id;
    END IF;

  -- 3. ON DELETE: Restore stock (+1) if an active claim is deleted
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('pending', 'approved') THEN
      UPDATE public.rewards
      SET stock = CASE 
                    WHEN stock IS NOT NULL THEN stock + 1
                    ELSE NULL 
                  END
      WHERE id = OLD.reward_id;
    END IF;
  END IF;

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Drop and recreate the trigger to also cover DELETE operations
DROP TRIGGER IF EXISTS trg_reward_claim_status_change ON public.reward_claims;
CREATE TRIGGER trg_reward_claim_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.reward_claims
FOR EACH ROW
EXECUTE FUNCTION public.handle_reward_claim_status_change();

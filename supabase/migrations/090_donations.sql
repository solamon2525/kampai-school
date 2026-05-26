-- ===============================================================
-- Migration 090: Donations & Fundraising (PromptPay QR)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  target_amount numeric(12, 2),
  raised_amount numeric(12, 2) NOT NULL DEFAULT 0,
  promptpay_id text NOT NULL,
  promptpay_owner_name text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_active ON public.donation_campaigns(is_active, is_featured DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
  donor_name text NOT NULL,
  donor_phone text,
  donor_email text,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  payment_slip_url text,
  receipt_number text,
  donated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_donations_campaign ON public.donations(campaign_id, donated_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_unverified ON public.donations(is_verified) WHERE is_verified = false;

ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_campaigns" ON public.donation_campaigns;
CREATE POLICY "public_read_campaigns" ON public.donation_campaigns
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_campaigns" ON public.donation_campaigns;
CREATE POLICY "admin_manage_campaigns" ON public.donation_campaigns
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_verified_donations" ON public.donations;
CREATE POLICY "public_read_verified_donations" ON public.donations
  FOR SELECT USING (is_verified = true);

DROP POLICY IF EXISTS "public_submit_donation" ON public.donations;
CREATE POLICY "public_submit_donation" ON public.donations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_donations" ON public.donations;
CREATE POLICY "admin_manage_donations" ON public.donations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.recalc_campaign_raised() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.campaign_id IS NOT NULL THEN
    UPDATE public.donation_campaigns
    SET raised_amount = (
      SELECT COALESCE(SUM(amount), 0) FROM public.donations
      WHERE campaign_id = NEW.campaign_id AND is_verified = true
    )
    WHERE id = NEW.campaign_id;
  END IF;
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.campaign_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.campaign_id != COALESCE(NEW.campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
    UPDATE public.donation_campaigns
    SET raised_amount = (
      SELECT COALESCE(SUM(amount), 0) FROM public.donations
      WHERE campaign_id = OLD.campaign_id AND is_verified = true
    )
    WHERE id = OLD.campaign_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_donation_change ON public.donations;
CREATE TRIGGER on_donation_change
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.recalc_campaign_raised();

COMMENT ON TABLE public.donation_campaigns IS 'Public fundraising campaigns with PromptPay QR for donations';
COMMENT ON TABLE public.donations IS 'Individual donation records — must be verified by admin to count toward raised_amount';

/**
 * donations.service.ts
 * Public donations with PromptPay QR. Admin verifies before counting raised_amount.
 */
import { supabase } from '@/integrations/supabase/client';

export type DonationCampaign = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  target_amount: number | null;
  raised_amount: number;
  promptpay_id: string;
  promptpay_owner_name: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

export type Donation = {
  id: string;
  campaign_id: string | null;
  donor_name: string;
  donor_phone: string | null;
  donor_email: string | null;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  is_verified: boolean;
  payment_slip_url: string | null;
  receipt_number: string | null;
  donated_at: string;
  notes: string | null;
};

export const donationsService = {
  async listCampaigns(): Promise<DonationCampaign[]> {
    const { data, error } = await supabase
      .from('donation_campaigns' as any)
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DonationCampaign[];
  },

  async getCampaign(id: string): Promise<DonationCampaign | null> {
    const { data, error } = await supabase
      .from('donation_campaigns' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as DonationCampaign | null;
  },

  async createCampaign(c: Omit<DonationCampaign, 'id' | 'raised_amount' | 'created_at'>): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase.from('donation_campaigns' as any).insert({
      ...c,
      created_by: userResp.user?.id,
    });
    if (error) throw error;
  },

  async updateCampaign(id: string, patch: Partial<DonationCampaign>): Promise<void> {
    const { error } = await supabase.from('donation_campaigns' as any).update(patch).eq('id', id);
    if (error) throw error;
  },

  async listDonations(campaignId?: string, verifiedOnly = false): Promise<Donation[]> {
    let q = supabase.from('donations' as any).select('*').order('donated_at', { ascending: false });
    if (campaignId) q = q.eq('campaign_id', campaignId);
    if (verifiedOnly) q = q.eq('is_verified', true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Donation[];
  },

  async submitDonation(d: Omit<Donation, 'id' | 'is_verified' | 'donated_at' | 'receipt_number'>): Promise<void> {
    const { error } = await supabase.from('donations' as any).insert(d);
    if (error) throw error;
  },

  async verifyDonation(id: string, notes?: string): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('donations' as any)
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: userResp.user?.id,
        notes: notes ?? null,
      })
      .eq('id', id);
    if (error) throw error;
  },
};

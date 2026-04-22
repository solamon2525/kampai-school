/**
 * waste-bank.service.ts
 * Supabase queries for the Items + Points waste bank system (no more kg / ฿)
 * Includes: categories, transactions, summary view, rewards, reward claims
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────
export type WasteCategory = {
  id: string;
  name: string;
  points_per_item: number;
  icon: string | null;
  color: string | null;
  is_active: boolean | null;
  order_position: number | null;
};

export type WasteTransaction = {
  id: string;
  student_id: string | null;
  student_name: string;
  student_class: string | null;
  category_id: string;
  quantity: number;
  points_earned: number;
  transaction_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  waste_categories?: { name: string; icon: string | null; color: string | null } | null;
  students?: { photo_url: string | null } | null;
};

export type WasteStudentSummary = {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  total_items: number | null;
  total_points_earned: number | null;
  total_points_spent: number | null;
  available_points: number | null;
  total_transactions: number | null;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean | null;
  order_position: number | null;
  created_at?: string;
  updated_at?: string;
};

export type RewardClaimStatus = 'pending' | 'approved' | 'rejected';

export type RewardClaim = {
  id: string;
  student_id: string;
  reward_id: string;
  reward_name: string;
  points_used: number;
  status: RewardClaimStatus;
  claimed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  rewards?: { image_url: string | null } | null;
  students?: { name: string; class: string; photo_url: string | null } | null;
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const wasteCategoriesService = {
  getAll: () =>
    supabase
      .from('waste_categories')
      .select('*')
      .order('order_position', { ascending: true }),

  getActive: () =>
    supabase
      .from('waste_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true }),

  insert: (data: Omit<WasteCategory, 'id'>) =>
    supabase.from('waste_categories').insert(data as never),

  update: (id: string, data: Partial<WasteCategory>) =>
    supabase.from('waste_categories').update(data as never).eq('id', id),

  deactivate: (id: string) =>
    supabase.from('waste_categories').update({ is_active: false } as never).eq('id', id),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const wasteTransactionsService = {
  getRecent: (limit = 50) =>
    supabase
      .from('waste_transactions')
      .select('*, waste_categories(name, icon, color), students(photo_url)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),

  getByStudent: (studentId: string) =>
    supabase
      .from('waste_transactions')
      .select('*, waste_categories(name, icon, color)')
      .eq('student_id', studentId)
      .order('transaction_date', { ascending: false }),

  insert: (
    data: Omit<WasteTransaction, 'id' | 'created_at' | 'points_earned' | 'waste_categories' | 'students'> & {
      points_earned: number;
    },
  ) => supabase.from('waste_transactions').insert(data as never),

  update: (
    id: string,
    data: Partial<Omit<WasteTransaction, 'id' | 'created_at' | 'waste_categories' | 'students'>>,
  ) => supabase.from('waste_transactions').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('waste_transactions').delete().eq('id', id),
};

// ─── Summary VIEW ─────────────────────────────────────────────────────────────
export const wasteSummaryService = {
  getAll: () => supabase.from('waste_student_summary').select('*'),
  getForStudent: (studentId: string) =>
    supabase.from('waste_student_summary').select('*').eq('student_id', studentId).maybeSingle(),
};

// ─── Rewards ──────────────────────────────────────────────────────────────────
export const rewardsService = {
  getAll: () =>
    supabase.from('rewards').select('*').order('order_position', { ascending: true }),

  getActive: () =>
    supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true }),

  insert: (data: Omit<Reward, 'id' | 'created_at' | 'updated_at'>) =>
    supabase.from('rewards').insert(data as never),

  update: (id: string, data: Partial<Reward>) =>
    supabase
      .from('rewards')
      .update({ ...data, updated_at: new Date().toISOString() } as never)
      .eq('id', id),

  delete: (id: string) => supabase.from('rewards').delete().eq('id', id),

  uploadImage: async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('rewards').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('rewards').getPublicUrl(fileName);
    return data.publicUrl;
  },
};

// ─── Reward Claims ────────────────────────────────────────────────────────────
export const rewardClaimsService = {
  listPending: () =>
    supabase
      .from('reward_claims')
      .select('*, rewards(image_url), students(name, class, photo_url)')
      .eq('status', 'pending')
      .order('claimed_at', { ascending: false }),

  listAll: () =>
    supabase
      .from('reward_claims')
      .select('*, rewards(image_url), students(name, class, photo_url)')
      .order('claimed_at', { ascending: false }),

  listForStudent: (studentId: string) =>
    supabase
      .from('reward_claims')
      .select('*, rewards(image_url)')
      .eq('student_id', studentId)
      .order('claimed_at', { ascending: false }),

  create: (data: {
    student_id: string;
    reward_id: string;
    reward_name: string;
    points_used: number;
  }) => supabase.from('reward_claims').insert(data as never),

  approve: (id: string, reviewedBy: string) =>
    supabase
      .from('reward_claims')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
      } as never)
      .eq('id', id),

  reject: (id: string, reviewedBy: string, reason?: string) =>
    supabase
      .from('reward_claims')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        rejection_reason: reason ?? null,
      } as never)
      .eq('id', id),
};

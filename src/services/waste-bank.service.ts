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
  recorded_by_staff_id: string | null;
  recorded_by_administrator_id: string | null;
  created_at: string;
  waste_categories?: { name: string; icon: string | null; color: string | null } | null;
  students?: { photo_url: string | null } | null;
};

export type WasteStudentSummary = {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  photo_url: string | null;
  student_code: string | null;
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
  category: string | null;
  owner_staff_id: string | null;
  owner_administrator_id: string | null;
  created_at?: string;
  updated_at?: string;
  // joined display labels (optional)
  staff?: { name: string } | null;
  administrators?: { name: string } | null;
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
  academic_year: string | null;
  semester: string | null;
  balance_after: number | null;
  approved_by_staff_id: string | null;
  approved_by_administrator_id: string | null;
  rewards?: { image_url: string | null; owner_staff_id: string | null; owner_administrator_id: string | null } | null;
  students?: { name: string; class: string; photo_url: string | null } | null;
};

export type StudentBalanceLookup = {
  student_id: string;
  full_name: string;
  class_name: string | null;
  photo_url: string | null;
  available_points: number;
};

export type StudentHistoryRow = {
  claim_id: string;
  reward_name: string;
  reward_image: string | null;
  points_used: number;
  balance_after: number | null;
  status: RewardClaimStatus;
  claimed_at: string;
  academic_year: string | null;
  semester: string | null;
};

export type ActiveTerm = { year: string; sem: string };

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

  getInDateRange: (startISO: string, endISO: string) =>
    supabase
      .from('waste_transactions')
      .select('id, category_id, quantity, transaction_date')
      .gte('transaction_date', startISO)
      .lte('transaction_date', endISO)
      .order('transaction_date', { ascending: false }),

  insert: (
    data: Omit<WasteTransaction, 'id' | 'created_at' | 'points_earned' | 'waste_categories' | 'students'> & {
      points_earned: number;
    },
  ) => supabase.from('waste_transactions').insert(data as never),

  /** Batch insert — atomic (ทั้ง batch ผ่านหรือพร้อมกัน fail) */
  insertMany: (
    rows: Array<
      Omit<WasteTransaction, 'id' | 'created_at' | 'waste_categories' | 'students'> & {
        points_earned: number;
      }
    >,
  ) => supabase.from('waste_transactions').insert(rows as never),

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
const REWARDS_SELECT_WITH_OWNER =
  '*, staff:owner_staff_id(name), administrators:owner_administrator_id(name)';

export const rewardsService = {
  getAll: () =>
    supabase
      .from('rewards')
      .select(REWARDS_SELECT_WITH_OWNER)
      .order('order_position', { ascending: true }),

  /** Admin → ทุกอัน; ครู/แอดมินคนหนึ่ง → เห็นรางวัลของตัวเอง + รางวัลกลาง (owner=NULL) */
  getMineAndCentral: (params: {
    isAdmin: boolean;
    staffId: string | null;
    administratorId: string | null;
  }) => {
    if (params.isAdmin) {
      return supabase
        .from('rewards')
        .select(REWARDS_SELECT_WITH_OWNER)
        .order('order_position', { ascending: true });
    }
    // ต้องการ owner_staff_id=me OR owner_administrator_id=me OR ทั้งคู่ NULL
    const orParts: string[] = ['and(owner_staff_id.is.null,owner_administrator_id.is.null)'];
    if (params.staffId) orParts.push(`owner_staff_id.eq.${params.staffId}`);
    if (params.administratorId) orParts.push(`owner_administrator_id.eq.${params.administratorId}`);
    return supabase
      .from('rewards')
      .select(REWARDS_SELECT_WITH_OWNER)
      .or(orParts.join(','))
      .order('order_position', { ascending: true });
  },

  getActive: () =>
    supabase
      .from('rewards')
      .select(REWARDS_SELECT_WITH_OWNER)
      .eq('is_active', true)
      .order('order_position', { ascending: true }),

  insert: (data: Omit<Reward, 'id' | 'created_at' | 'updated_at' | 'staff' | 'administrators'>) =>
    supabase.from('rewards').insert(data as never),

  update: (id: string, data: Partial<Omit<Reward, 'staff' | 'administrators'>>) =>
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
const CLAIMS_SELECT =
  '*, rewards(image_url, owner_staff_id, owner_administrator_id), students(name, class, photo_url)';

export const rewardClaimsService = {
  listPending: () =>
    supabase
      .from('reward_claims')
      .select(CLAIMS_SELECT)
      .eq('status', 'pending')
      .order('claimed_at', { ascending: false }),

  listAll: () =>
    supabase
      .from('reward_claims')
      .select(CLAIMS_SELECT)
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

  approve: (
    id: string,
    reviewedBy: string,
    approver: { staffId: string | null; administratorId: string | null },
  ) =>
    supabase
      .from('reward_claims')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        approved_by_staff_id: approver.staffId,
        approved_by_administrator_id: approver.administratorId,
      } as never)
      .eq('id', id),

  reject: (
    id: string,
    reviewedBy: string,
    reason: string | undefined,
    approver: { staffId: string | null; administratorId: string | null },
  ) =>
    supabase
      .from('reward_claims')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        rejection_reason: reason ?? null,
        approved_by_staff_id: approver.staffId,
        approved_by_administrator_id: approver.administratorId,
      } as never)
      .eq('id', id),

  // Public RPC: lookup student balance by student_code (no auth)
  lookupStudent: (code: string) =>
    supabase
      .rpc('lookup_student_balance' as never, { p_code: code } as never)
      .returns<StudentBalanceLookup[]>(),

  // Public RPC: create a pending claim by student_code (no auth)
  claimByCode: (code: string, rewardId: string) =>
    supabase.rpc('claim_reward' as never, { p_code: code, p_reward_id: rewardId } as never),

  // Public RPC: get history list by student_code (no auth)
  getStudentHistory: (code: string, limit = 50) =>
    supabase
      .rpc('get_student_history' as never, { p_code: code, p_limit: limit } as never)
      .returns<StudentHistoryRow[]>(),
};

// ─── Active term (school_settings keys) ──────────────────────────────────────
export const termService = {
  /** อ่านเทอมปัจจุบันจาก school_settings — return null ถ้ายังไม่ได้ตั้งค่า */
  getActive: async (): Promise<ActiveTerm | null> => {
    const { data, error } = await supabase
      .from('school_settings')
      .select('key, value')
      .in('key', ['active_academic_year', 'active_semester']);
    if (error || !data) return null;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    if (!map.active_academic_year || !map.active_semester) return null;
    return { year: map.active_academic_year, sem: map.active_semester };
  },

  /** อัพเดต active_academic_year + active_semester — admin only (RLS guard) */
  advance: async (year: string, sem: '1' | '2') => {
    const updates = [
      supabase
        .from('school_settings')
        .update({ value: year, updated_at: new Date().toISOString() } as never)
        .eq('key', 'active_academic_year'),
      supabase
        .from('school_settings')
        .update({ value: sem, updated_at: new Date().toISOString() } as never)
        .eq('key', 'active_semester'),
    ];
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error)?.error;
    return { error: err ?? null };
  },
};

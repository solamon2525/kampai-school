/**
 * waste-bank.service.ts
 * Supabase queries for the Items + Points waste bank system (no more kg / ฿)
 * Includes: categories, transactions, summary view, rewards, reward claims
 */
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/utils/imageUtils';

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

export type WastePromotion = {
  id: string;
  title: string;
  description: string | null;
  banner_type: string;
  multiplier: number;
  bonus_points: number;
  category_ids: string[] | null;
  days_of_week: number[] | null;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  badge_text: string | null;
  order_position: number;
  created_at: string;
  updated_at: string;
};

export type WasteLuckySpin = {
  id: string;
  student_id: string;
  student_name: string;
  student_class: string | null;
  transaction_id: string | null;
  spin_result: string;
  bonus_points_awarded: number;
  spun_at: string;
  recorded_by: string | null;
};

export type WasteClassroomRanking = {
  class_name: string;
  student_count: number;
  participating_students: number;
  total_items: number;
  total_points: number;
  items_per_student: number;
  points_per_student: number;
  rank: number;
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
  waste_points_cost: number;
  virtue_points_cost: number;
  stock: number | null;
  is_active: boolean | null;
  order_position: number | null;
  category: string | null;
  owner_staff_id: string | null;
  owner_administrator_id: string | null;
  created_at?: string;
  updated_at?: string;
  // joined display labels (optional)
  staff?: { name: string; photo_url: string | null } | null;
  administrators?: { name: string; photo_url: string | null } | null;
};

export type RewardClaimStatus = 'pending' | 'approved' | 'rejected';

export type RewardClaim = {
  id: string;
  student_id: string;
  reward_id: string;
  reward_name: string;
  points_used: number;
  waste_points_used: number;
  virtue_points_used: number;
  status: RewardClaimStatus;
  claimed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  academic_year: string | null;
  semester: string | null;
  balance_after: number | null;
  waste_balance_after: number | null;
  virtue_balance_after: number | null;
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
  waste_points_earned: number;
  waste_points_available: number;
  virtue_points_earned: number;
  virtue_points_spent: number;
  virtue_points_available: number;
  virtue_academic_year: string;
};

export type StudentHistoryRow = {
  claim_id: string;
  reward_name: string;
  reward_image: string | null;
  points_used: number;
  waste_points_used: number;
  virtue_points_used: number;
  /** จำนวนชิ้นที่แลกในครั้งนั้น (default 1, มาจาก migration 099) */
  quantity: number;
  balance_after: number | null;
  waste_balance_after: number | null;
  virtue_balance_after: number | null;
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
  '*, staff:owner_staff_id(name, photo_url), administrators:owner_administrator_id(name, photo_url)';

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

  /**
   * Admin-only: ตั้ง stock ใหม่ตรงๆ (สำหรับ reconcile drift)
   * NULL ไม่รองรับใน RPC นี้ — ถ้าอยากตั้ง unlimited ใช้ update(id, { stock: null }) แทน
   * RPC: admin_set_reward_stock (migration 100, requires is_admin())
   */
  setStock: (rewardId: string, newStock: number) =>
    supabase.rpc('admin_set_reward_stock' as never, {
      p_reward_id: rewardId,
      p_new_stock: newStock,
    } as never),

  /**
   * Inventory health: remaining stock vs pending claims (drift if pending > stock).
   */
  stockDriftReport: async (): Promise<
    Array<{
      id: string;
      name: string;
      stock: number | null;
      pendingQty: number;
      flagged: boolean;
    }>
  > => {
    const { data: rewards, error: rErr } = await supabase
      .from('rewards')
      .select('id, name, stock')
      .not('stock', 'is', null)
      .order('name');
    if (rErr) throw rErr;
    const { data: claims, error: cErr } = await supabase
      .from('reward_claims')
      .select('reward_id, quantity, status')
      .eq('status', 'pending');
    if (cErr) throw cErr;
    const pendingByReward = new Map<string, number>();
    for (const c of claims ?? []) {
      const qty = Number((c as { quantity?: number }).quantity ?? 1);
      const rid = (c as { reward_id: string }).reward_id;
      pendingByReward.set(rid, (pendingByReward.get(rid) ?? 0) + qty);
    }
    return (rewards ?? []).map((r) => {
      const stock = r.stock as number | null;
      const pendingQty = pendingByReward.get(r.id) ?? 0;
      const flagged = stock !== null && (stock <= 0 || pendingQty > stock);
      return { id: r.id, name: r.name, stock, pendingQty, flagged };
    });
  },

  uploadImage: async (file: File): Promise<string> => {
    // Compress to WebP (max 800x800, quality 0.8) on client before upload
    let uploadPayload: Blob | File = file;
    let fileName = `${crypto.randomUUID()}.webp`;
    let contentType = 'image/webp';
    try {
      uploadPayload = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
    } catch {
      // Fallback to original file if canvas compression fails
      const ext = file.name.split('.').pop() || 'png';
      fileName = `${crypto.randomUUID()}.${ext}`;
      contentType = file.type || 'image/png';
    }

    const { error } = await supabase.storage.from('rewards').upload(fileName, uploadPayload, {
      cacheControl: '3600',
      upsert: false,
      contentType,
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
  getById: (id: string) =>
    supabase
      .from('reward_claims')
      .select(CLAIMS_SELECT)
      .eq('id', id)
      .maybeSingle(),

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

  /**
   * Approve a pending claim. RPC derives reviewer + approver id from auth.uid().
   * pending → approved: stock ไม่เปลี่ยน (หักไปแล้วตอน claim_reward INSERT).
   * Idempotent: ถ้า status='approved' อยู่แล้ว → no-op.
   */
  approve: (claimId: string) =>
    supabase.rpc('approve_reward_claim' as never, { p_claim_id: claimId } as never),

  /**
   * Reject a claim + คืน stock (ถ้า OLD status เป็น active).
   * Idempotent: ถ้า status='rejected' อยู่แล้ว → no-op (กัน double-restore).
   */
  reject: (claimId: string, reason?: string) =>
    supabase.rpc('reject_reward_claim' as never, {
      p_claim_id: claimId,
      p_reason: reason ?? null,
    } as never),

  // Public RPC: lookup student balance by student_code (no auth)
  lookupStudent: (code: string) =>
    supabase
      .rpc('lookup_student_balance' as never, { p_code: code } as never)
      .returns<StudentBalanceLookup[]>(),

  // Public RPC: create a pending claim by student_code (no auth)
  // quantity default = 1 (backward compat) — RPC validates: balance >= cost*qty, stock >= qty
  claimByCode: (code: string, rewardId: string, quantity = 1) =>
    supabase.rpc('claim_reward' as never, {
      p_code: code,
      p_reward_id: rewardId,
      p_quantity: quantity,
    } as never),

  // Public RPC: get history list by student_code (no auth)
  getStudentHistory: (code: string, limit = 50) =>
    supabase
      .rpc('get_student_history' as never, { p_code: code, p_limit: limit } as never)
      .returns<StudentHistoryRow[]>(),

  // Admin/Teacher RPC: claim and approve in one atomic step (deducts stock, waste points & virtue points)
  adminClaimAndApprove: (code: string, rewardId: string, quantity = 1) =>
    supabase.rpc('admin_claim_and_approve_reward' as never, {
      p_code: code,
      p_reward_id: rewardId,
      p_quantity: quantity,
    } as never),
};

// ─── View Preference (school_settings) ───────────────────────────────────────
export type WasteSummaryViewMode = 'table' | 'grid' | 'by-class';
export type WasteSummarySortBy = 'points' | 'earned' | 'items' | 'transactions' | 'class' | 'name';

const WASTE_PREF_VIEW_KEY = 'waste_summary_view_mode';
const WASTE_PREF_SORT_KEY = 'waste_summary_sort_by';

export const wasteViewPreferenceService = {
  load: async (): Promise<{ viewMode: WasteSummaryViewMode; sortBy: WasteSummarySortBy }> => {
    const { data } = await supabase
      .from('school_settings')
      .select('key, value')
      .in('key', [WASTE_PREF_VIEW_KEY, WASTE_PREF_SORT_KEY]);
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value as string]));
    return {
      viewMode: (map[WASTE_PREF_VIEW_KEY] as WasteSummaryViewMode) ?? 'table',
      sortBy:   (map[WASTE_PREF_SORT_KEY] as WasteSummarySortBy)   ?? 'points',
    };
  },
  save: (pref: { viewMode: WasteSummaryViewMode; sortBy: WasteSummarySortBy }) =>
    Promise.all([
      supabase.from('school_settings').upsert(
        { key: WASTE_PREF_VIEW_KEY, value: pref.viewMode, category: 'waste', description: 'waste summary view mode' },
        { onConflict: 'key' },
      ),
      supabase.from('school_settings').upsert(
        { key: WASTE_PREF_SORT_KEY, value: pref.sortBy, category: 'waste', description: 'waste summary sort' },
        { onConflict: 'key' },
      ),
    ]),
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

// ─── Waste Promotions & Campaigns ─────────────────────────────────────────────
export const wastePromotionsService = {
  getAll: () =>
    supabase
      .from('waste_promotions')
      .select('*')
      .order('order_position', { ascending: true })
      .order('created_at', { ascending: false }),

  getActive: () =>
    supabase
      .rpc('get_active_waste_promotions')
      .returns<WastePromotion[]>(),

  insert: (data: Omit<WastePromotion, 'id' | 'created_at' | 'updated_at'>) =>
    supabase.from('waste_promotions').insert(data as never),

  update: (id: string, data: Partial<Omit<WastePromotion, 'id' | 'created_at' | 'updated_at'>>) =>
    supabase
      .from('waste_promotions')
      .update({ ...data, updated_at: new Date().toISOString() } as never)
      .eq('id', id),

  delete: (id: string) =>
    supabase.from('waste_promotions').delete().eq('id', id),

  toggleActive: (id: string, is_active: boolean) =>
    supabase
      .from('waste_promotions')
      .update({ is_active, updated_at: new Date().toISOString() } as never)
      .eq('id', id),

  seedDefaultCampaigns: async () => {
    const defaults = [
      {
        title: 'วันศุกร์สีเขียว (Green Friday)',
        description: 'ทุกวันศุกร์ ส่งขยะรีไซเคิลทุกประเภท รับแต้มสะสมเพิ่มเป็น 2 เท่า (x2)',
        banner_type: 'green_friday',
        multiplier: 2.00,
        bonus_points: 0,
        days_of_week: [5],
        start_time: null,
        end_time: null,
        is_active: true,
        badge_text: '🔥 แต้ม x2 ทุกวันศุกร์',
        order_position: 1,
      },
      {
        title: 'แฮปปี้อาวร์ พักเที่ยงรักษ์โลก (Lunch Break)',
        description: 'ช่วงพักกลางวัน 12:00 - 12:45 น. นำขวดน้ำหรือกล่องนมมาส่ง รับแต้มโบนัสพิเศษทันที +5 แต้ม',
        banner_type: 'happy_hour',
        multiplier: 1.00,
        bonus_points: 5,
        days_of_week: [1, 2, 3, 4, 5],
        start_time: '12:00:00',
        end_time: '12:45:00',
        is_active: true,
        badge_text: '⭐ โบนัส +5 แต้มช่วงพักเที่ยง',
        order_position: 2,
      },
      {
        title: 'สัปดาห์กล่องนมกู้โลก (Milk Carton Week)',
        description: 'นำกล่องนมโรงเรียนที่ล้างสะอาดและพับแบนมาส่ง รับแต้มสะสมพิเศษ 3 เท่า (x3)',
        banner_type: 'target_item',
        multiplier: 3.00,
        bonus_points: 0,
        days_of_week: null,
        start_time: null,
        end_time: null,
        is_active: true,
        badge_text: '🥛 กล่องนมพับแบนแต้ม x3',
        order_position: 3,
      },
      {
        title: 'ภารกิจคลีนบ้านส่งโรงเรียน (Home-to-School Quest)',
        description: 'รวบรวมขยะรีไซเคิลจากบ้านใส่ถุงมาส่งทุกเช้าวันจันทร์ ลุ้นรางวัลพิเศษและถ้วยเกียรติยศห้องเรียน',
        banner_type: 'home_quest',
        multiplier: 1.50,
        bonus_points: 10,
        days_of_week: [1],
        start_time: '07:30:00',
        end_time: '08:30:00',
        is_active: true,
        badge_text: '🏡 คลีนบ้านรับโบนัส +10 แต้ม',
        order_position: 4,
      },
    ];
    return supabase.from('waste_promotions').insert(defaults as never);
  },
};

// ─── Waste Lucky Spins (หมุนวงล้อเสี่ยงโชค) ──────────────────────────────────
export const wasteLuckySpinsService = {
  getRecent: (limit = 30) =>
    supabase
      .from('waste_lucky_spins')
      .select('*')
      .order('spun_at', { ascending: false })
      .limit(limit),

  getByStudent: (studentId: string) =>
    supabase
      .from('waste_lucky_spins')
      .select('*')
      .eq('student_id', studentId)
      .order('spun_at', { ascending: false }),

  recordSpin: (data: Omit<WasteLuckySpin, 'id' | 'spun_at'>) =>
    supabase.from('waste_lucky_spins').insert(data as never),
};

// ─── Classroom Waste League (ศึกลีกห้องเรียนรักษ์โลก) ─────────────────────────
export const wasteClassroomLeagueService = {
  getRankings: (params?: {
    academic_year?: string;
    semester?: string;
    month?: number;
    year?: number;
  }) =>
    supabase
      .rpc('get_classroom_waste_rankings', {
        p_academic_year: params?.academic_year ?? null,
        p_semester: params?.semester ?? null,
        p_month: params?.month ?? null,
        p_year: params?.year ?? null,
      })
      .returns<WasteClassroomRanking[]>(),
};


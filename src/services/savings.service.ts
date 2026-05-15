/**
 * savings.service.ts
 * Supabase queries for ระบบ "ธนาคารพอเพียง" (Savings Bank)
 * — ฝาก/ถอนเงินจริง (บาท) สำหรับนักเรียนประถม
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────
export type SavingsTransactionType = 'deposit' | 'withdraw';

export type SavingsTransaction = {
  id: string;
  student_id: string | null;
  student_name: string;
  student_class: string | null;
  transaction_type: SavingsTransactionType;
  amount: number;
  balance_after: number | null;
  transaction_date: string;
  notes: string | null;
  recorded_by: string | null;
  recorded_by_staff_id: string | null;
  recorded_by_administrator_id: string | null;
  academic_year: string | null;
  semester: string | null;
  created_at: string;
  students?: { photo_url: string | null } | null;
};

export type SavingsStudentSummary = {
  student_id: string | null;
  full_name: string | null;
  class_name: string | null;
  photo_url: string | null;
  student_code: string | null;
  total_transactions: number | null;
  deposit_count: number | null;
  withdraw_count: number | null;
  total_deposits: number | null;
  total_withdrawals: number | null;
  current_balance: number | null;
};

export type SaverTier = 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Beginner';

export const SAVER_TIER_THRESHOLDS: Array<{ tier: SaverTier; min: number }> = [
  { tier: 'Diamond', min: 100 },
  { tier: 'Platinum', min: 50 },
  { tier: 'Gold', min: 25 },
  { tier: 'Silver', min: 10 },
  { tier: 'Bronze', min: 3 },
  { tier: 'Beginner', min: 1 },
];

export const getSaverTier = (depositCount: number | null | undefined): SaverTier | null => {
  const c = Number(depositCount ?? 0);
  if (c < 1) return null;
  for (const { tier, min } of SAVER_TIER_THRESHOLDS) {
    if (c >= min) return tier;
  }
  return null;
};

export type StudentSavingsLookup = {
  student_id: string;
  full_name: string;
  class_name: string | null;
  photo_url: string | null;
  current_balance: number;
};

export type SavingsHistoryRow = {
  txn_id: string;
  transaction_type: SavingsTransactionType;
  amount: number;
  balance_after: number | null;
  transaction_date: string;
  notes: string | null;
  recorded_by: string | null;
  academic_year: string | null;
  semester: string | null;
  created_at: string;
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const savingsTransactionsService = {
  getRecent: (limit = 50) =>
    supabase
      .from('savings_transactions')
      .select('*, students(photo_url)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),

  getByStudent: (studentId: string) =>
    supabase
      .from('savings_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),

  getInDateRange: (startISO: string, endISO: string) =>
    supabase
      .from('savings_transactions')
      .select('id, transaction_type, amount, transaction_date, student_id')
      .gte('transaction_date', startISO)
      .lte('transaction_date', endISO)
      .order('transaction_date', { ascending: false }),

  insert: (
    data: Omit<SavingsTransaction, 'id' | 'created_at' | 'students'>,
  ) => supabase.from('savings_transactions').insert(data as never),

  insertMany: (
    rows: Array<Omit<SavingsTransaction, 'id' | 'created_at' | 'students'>>,
  ) => supabase.from('savings_transactions').insert(rows as never),

  update: (
    id: string,
    data: Partial<Omit<SavingsTransaction, 'id' | 'created_at' | 'students'>>,
  ) => supabase.from('savings_transactions').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('savings_transactions').delete().eq('id', id),
};

// ─── Summary VIEW ─────────────────────────────────────────────────────────────
export const savingsSummaryService = {
  getAll: () =>
    supabase
      .from('savings_student_summary')
      .select('*')
      .order('current_balance', { ascending: false, nullsFirst: false }),

  getForStudent: (studentId: string) =>
    supabase
      .from('savings_student_summary')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle(),

  /**
   * Public leaderboard — sort by deposit_count DESC (จัดอันดับโดยจำนวนครั้งฝาก)
   * ❌ ห้ามแสดงตัวเลขเงินในที่สาธารณะ (privacy)
   */
  getLeaderboard: (limit?: number) => {
    const q = supabase
      .from('savings_student_summary')
      .select('student_id, full_name, class_name, photo_url, student_code, deposit_count, withdraw_count, total_transactions')
      .gt('deposit_count', 0)
      .order('deposit_count', { ascending: false })
      .order('total_transactions', { ascending: false });
    return limit ? q.limit(limit) : q;
  },
};

// ─── Public RPC lookups (by student_code, no auth) ────────────────────────────
export const savingsLookupService = {
  lookupStudent: (code: string) =>
    supabase
      .rpc('lookup_savings_balance' as never, { p_code: code } as never)
      .returns<StudentSavingsLookup[]>(),

  getStudentHistory: (code: string, limit = 50) =>
    supabase
      .rpc('get_savings_history' as never, { p_code: code, p_limit: limit } as never)
      .returns<SavingsHistoryRow[]>(),
};

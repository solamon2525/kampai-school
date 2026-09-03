/**
 * savings.service.ts
 * Supabase queries for ระบบ "ธนาคารพอเพียง" (Savings Bank)
 * — ฝาก/ถอนเงินจริง (บาท) สำหรับนักเรียนประถม
 */
import { supabase } from '@/integrations/supabase/client';
import { buildSavingsStatement } from '@/lib/savings-statement';

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

  /**
   * Admin history must not silently stop at the most recent rows. Supabase's
   * API has a per-request row limit, so fetch the complete ledger in pages.
   */
  getAll: async () => {
    const pageSize = 1000;
    const rows: SavingsTransaction[] = [];

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*, students(photo_url)')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) return { data: null, error };

      const page = (data ?? []) as unknown as SavingsTransaction[];
      rows.push(...page);
      if (page.length < pageSize) break;
    }

    return { data: rows, error: null };
  },

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
/** Read-only admin statement. No partial page is returned on failure. */
export const savingsStatementService = {
  get: async (studentId: string, signal?: AbortSignal) => {
    const query = () => supabase.from('savings_transactions')
      .select('*, recorder_staff:staff!recorded_by_staff_id(photo_url), recorder_admin:administrators!recorded_by_administrator_id(photo_url)')
      .eq('student_id', studentId)
      .order('transaction_date').order('created_at', { nullsFirst: true }).order('id');
    type Row = NonNullable<Awaited<ReturnType<typeof query>>['data']>[number];
    const rows: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const request = query().range(from, from + 999);
      const { data, error } = await (signal ? request.abortSignal(signal) : request);
      if (error) throw error;
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 1000) break;
    }
    const request = supabase.from('savings_student_summary').select('*').eq('student_id', studentId);
    const { data: student, error } = await (signal ? request.abortSignal(signal) : request).single();
    if (error) throw error;
    const ledger = buildSavingsStatement(rows);
    const equalMoney = (a: number, b: number | null) => Math.round(a * 100) === Math.round(Number(b ?? 0) * 100);
    if (new Set(rows.map(row => row.id)).size !== rows.length ||
      !equalMoney(ledger.current, student.current_balance) ||
      !equalMoney(ledger.deposits, student.total_deposits) ||
      !equalMoney(ledger.withdrawals, student.total_withdrawals) ||
      rows.length !== Number(student.total_transactions ?? 0)) {
      throw new Error('ยอดประวัติไม่ตรงกับยอดสรุป อาจมีการบันทึกพร้อมกัน กรุณาโหลดใหม่ก่อนออกรายงาน');
    }
    return { student, rows };
  },
};

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

// ─── Recorder Summary (per teacher who recorded transactions) ─────────────────
export type SavingsRecorderSummary = {
  recorder_name: string;
  recorded_by_staff_id: string | null;
  photo_url: string | null;
  deposit_count: number;
  withdraw_count: number;
  total_deposits: number;
  total_withdrawals: number;
};

export const savingsRecorderService = {
  getSummary: async (): Promise<{ data: SavingsRecorderSummary[] | null; error: unknown }> => {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select(
        'recorded_by, recorded_by_staff_id, recorded_by_administrator_id, transaction_type, amount, staff!recorded_by_staff_id(photo_url)',
      )
      .not('recorded_by', 'is', null);

    if (error || !data) return { data: null, error };

    const map = new Map<string, SavingsRecorderSummary>();
    for (const txn of data as unknown as Array<{
      recorded_by: string | null;
      recorded_by_staff_id: string | null;
      recorded_by_administrator_id: string | null;
      transaction_type: string;
      amount: number;
      staff: { photo_url: string | null } | null;
    }>) {
      const key =
        txn.recorded_by_staff_id ??
        txn.recorded_by_administrator_id ??
        txn.recorded_by ??
        'unknown';
      if (!map.has(key)) {
        map.set(key, {
          recorder_name: txn.recorded_by ?? 'ไม่ระบุ',
          recorded_by_staff_id: txn.recorded_by_staff_id ?? null,
          photo_url: txn.staff?.photo_url ?? null,
          deposit_count: 0,
          withdraw_count: 0,
          total_deposits: 0,
          total_withdrawals: 0,
        });
      }
      const rec = map.get(key)!;
      if (txn.transaction_type === 'deposit') {
        rec.deposit_count++;
        rec.total_deposits += Number(txn.amount ?? 0);
      } else {
        rec.withdraw_count++;
        rec.total_withdrawals += Number(txn.amount ?? 0);
      }
    }

    const result = Array.from(map.values()).sort(
      (a, b) => b.deposit_count + b.withdraw_count - (a.deposit_count + a.withdraw_count),
    );
    return { data: result, error: null };
  },
};

// ─── Summary view preference (admin lock, persisted in school_settings) ──────
export type SavingsSummaryViewMode = 'table' | 'grid' | 'by-class';
export type SavingsSummarySortBy =
  | 'balance'
  | 'deposits'
  | 'deposit_count'
  | 'withdrawals'
  | 'transactions'
  | 'class'
  | 'name';

export type SavingsSummaryPreference = {
  viewMode: SavingsSummaryViewMode;
  sortBy: SavingsSummarySortBy;
};

const PREF_VIEW_KEY = 'savings_summary_view_mode';
const PREF_SORT_KEY = 'savings_summary_sort_by';
const DEFAULT_PREF: SavingsSummaryPreference = { viewMode: 'table', sortBy: 'balance' };

export const savingsViewPreferenceService = {
  load: async (): Promise<SavingsSummaryPreference> => {
    const { data } = await supabase
      .from('school_settings')
      .select('key, value')
      .in('key', [PREF_VIEW_KEY, PREF_SORT_KEY]);
    if (!data) return DEFAULT_PREF;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value as string]));
    return {
      viewMode: (map[PREF_VIEW_KEY] as SavingsSummaryViewMode) ?? DEFAULT_PREF.viewMode,
      sortBy: (map[PREF_SORT_KEY] as SavingsSummarySortBy) ?? DEFAULT_PREF.sortBy,
    };
  },
  save: (pref: SavingsSummaryPreference) =>
    Promise.all([
      supabase.from('school_settings').upsert(
        { key: PREF_VIEW_KEY, value: pref.viewMode, category: 'savings', description: 'savings summary default view mode' },
        { onConflict: 'key' },
      ),
      supabase.from('school_settings').upsert(
        { key: PREF_SORT_KEY, value: pref.sortBy, category: 'savings', description: 'savings summary default sort' },
        { onConflict: 'key' },
      ),
    ]),
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

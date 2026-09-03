import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'savings_transactions'>;
const cents = (value: number) => Math.round(Number(value) * 100);

/** Rebuild the ledger before filtering; stored balance_after is only a snapshot. */
export function buildSavingsStatement<T extends Transaction>(transactions: T[], start = '', end = '') {
  let balance = 0;
  let opening = 0;
  let deposits = 0;
  let withdrawals = 0;
  let depositCount = 0;
  let withdrawCount = 0;
  const rows: Array<T & { ledgerBalance: number }> = [];
  const ordered = [...transactions].sort((a, b) =>
    a.transaction_date.localeCompare(b.transaction_date) ||
    (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id));
  for (const row of ordered) {
    if (!['deposit', 'withdraw'].includes(row.transaction_type) || !Number.isFinite(Number(row.amount))) {
      throw new Error('พบรายการที่ประเภทหรือจำนวนเงินไม่ถูกต้อง กรุณาตรวจสอบประวัติ');
    }
    const amount = cents(row.amount);
    const delta = row.transaction_type === 'deposit' ? amount : -amount;
    balance += delta;
    if (start && row.transaction_date < start) opening += delta;
    if ((!start || row.transaction_date >= start) && (!end || row.transaction_date <= end)) {
      if (row.transaction_type === 'deposit') { deposits += amount; depositCount++; }
      else { withdrawals += amount; withdrawCount++; }
      rows.push({ ...row, ledgerBalance: balance / 100 });
    }
  }
  return { rows, opening: opening / 100, deposits: deposits / 100, withdrawals: withdrawals / 100,
    depositCount, withdrawCount, closing: (opening + deposits - withdrawals) / 100, current: balance / 100 };
}

/** Preserve numeric cells; neutralize spreadsheet formulas in untrusted text. */
export const safeStatementCell = (value: string | number) =>
  typeof value === 'string' && /^[\s\uFEFF]*[=+@-]/u.test(value) ? `'${value}` : value;

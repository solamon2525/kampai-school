import { addDays, addMonths, format, parseISO, startOfMonth, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import type { BankActivity, BankStudent } from '@/services/bank-dashboard.service';

export const thaiBankToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);
export const bankNumber = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('th-TH', { maximumFractionDigits: 2 });
export const bankDate = (value: string) => format(parseISO(value.includes('T') ? thaiBankToday(new Date(value)) : value.slice(0, 10)), 'd MMM yy', { locale: th });
export type BankFilter = { period: 'today' | 'month' | 'all' | 'custom'; start: string; end: string; className: string; category: string; search: string };
export const defaultBankFilter = (): BankFilter => ({ period: 'month', start: thaiBankToday().slice(0, 7) + '-01', end: thaiBankToday(), className: 'all', category: 'all', search: '' });
export function bankRange(filter: BankFilter) {
  const today = thaiBankToday();
  return filter.period === 'all' ? { start: '', end: '' } : filter.period === 'today' ? { start: today, end: today }
    : filter.period === 'month' ? { start: today.slice(0, 7) + '-01', end: today.slice(0, 7) + '-31' }
      : { start: filter.start, end: filter.end };
}
export function filterBankActivities(activities: BankActivity[], students: BankStudent[], filter: BankFilter) {
  const { start, end } = bankRange(filter);
  const people = new Map(students.map(s => [s.student_id, s]));
  const search = filter.search.trim().toLocaleLowerCase('th-TH');
  return activities.filter(t => {
    const person = people.get(t.studentId);
    return (!start || t.date >= start) && (!end || t.date <= end)
      && (filter.className === 'all' || (person?.class_name ?? t.className) === filter.className)
      && (filter.category === 'all' || t.categoryId === filter.category)
      && (!search || `${person?.full_name ?? t.name ?? ''} ${person?.student_code ?? ''}`.toLocaleLowerCase('th-TH').includes(search));
  });
}
export function bankTotals(rows: BankActivity[]) {
  return rows.reduce((sum, row) => ({ incoming: sum.incoming + row.incoming, outgoing: sum.outgoing + row.outgoing,
    points: sum.points + row.points, count: sum.count + row.count }), { incoming: 0, outgoing: 0, points: 0, count: 0 });
}
export function bankTrend(rows: BankActivity[], filter: BankFilter) {
  const { start, end } = bankRange(filter);
  const sortedDates = rows.map(t => t.date).sort();
  const first = start || sortedDates[0];
  const last = (end.endsWith('-31') ? format(addDays(addMonths(parseISO(end.slice(0, 7) + '-01'), 1), -1), 'yyyy-MM-dd') : end) || sortedDates.at(-1);
  if (!first || !last || first > last) return [];
  const monthly = differenceInDays(parseISO(last), parseISO(first)) > 90;
  const buckets = new Map<string, ReturnType<typeof bankTotals>>();
  for (const row of rows) {
    const key = monthly ? row.date.slice(0, 7) : row.date;
    const total = buckets.get(key) ?? { incoming: 0, outgoing: 0, points: 0, count: 0 };
    total.incoming += row.incoming; total.outgoing += row.outgoing; total.points += row.points; total.count += row.count;
    buckets.set(key, total);
  }
  const result = [];
  for (let day = monthly ? startOfMonth(parseISO(first)) : parseISO(first); day <= parseISO(last); day = monthly ? addMonths(day, 1) : addDays(day, 1)) {
    const key = format(day, monthly ? 'yyyy-MM' : 'yyyy-MM-dd');
    result.push({ date: key, label: format(day, monthly ? 'MMM yy' : 'd MMM', { locale: th }), ...(buckets.get(key) ?? { incoming: 0, outgoing: 0, points: 0, count: 0 }) });
  }
  return result;
}

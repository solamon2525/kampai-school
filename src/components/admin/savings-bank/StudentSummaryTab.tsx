import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  LayoutGrid,
  LayoutList,
  Layers,
  Pin,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import {
  savingsViewPreferenceService,
  type SavingsSummarySortBy,
  type SavingsSummaryViewMode,
  type SavingsStudentSummary,
} from '@/services/savings.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StudentStatementDialog } from './StudentStatementDialog';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
const CLASS_ORDER = Object.fromEntries(CLASSES.map((c, i) => [c, i]));

const fmtBaht = (n: number) =>
  n.toLocaleString('th-TH', { maximumFractionDigits: 0 }) + ' ฿';

const SORT_LABELS: Record<SavingsSummarySortBy, string> = {
  balance: 'ยอดคงเหลือ (มาก→น้อย)',
  deposits: 'ยอดฝากรวม (มาก→น้อย)',
  deposit_count: 'จำนวนครั้งฝาก (มาก→น้อย)',
  withdrawals: 'ยอดถอนรวม (มาก→น้อย)',
  transactions: 'ธุรกรรมรวม (มาก→น้อย)',
  class: 'รายห้องเรียน + คงเหลือ',
  name: 'ชื่อ ก–ฮ',
};

interface Props {
  summaries: SavingsStudentSummary[];
}

const applySortFn = (
  a: SavingsStudentSummary,
  b: SavingsStudentSummary,
  sortBy: SavingsSummarySortBy,
): number => {
  switch (sortBy) {
    case 'balance':
      return Number(b.current_balance ?? 0) - Number(a.current_balance ?? 0);
    case 'deposits':
      return Number(b.total_deposits ?? 0) - Number(a.total_deposits ?? 0);
    case 'deposit_count':
      return Number(b.deposit_count ?? 0) - Number(a.deposit_count ?? 0);
    case 'withdrawals':
      return Number(b.total_withdrawals ?? 0) - Number(a.total_withdrawals ?? 0);
    case 'transactions':
      return Number(b.total_transactions ?? 0) - Number(a.total_transactions ?? 0);
    case 'class': {
      const ca = CLASS_ORDER[a.class_name ?? ''] ?? 99;
      const cb = CLASS_ORDER[b.class_name ?? ''] ?? 99;
      if (ca !== cb) return ca - cb;
      return Number(b.current_balance ?? 0) - Number(a.current_balance ?? 0);
    }
    case 'name':
      return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'th');
  }
};

export const StudentSummaryTab = ({ summaries }: Props) => {
  const [statementStudentId, setStatementStudentId] = useState<string | null>(null);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<SavingsSummaryViewMode>('table');
  const [sortBy, setSortBy] = useState<SavingsSummarySortBy>('balance');
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [prefLoading, setPrefLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    savingsViewPreferenceService.load().then((pref) => {
      setViewMode(pref.viewMode);
      setSortBy(pref.sortBy);
      setPrefLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return summaries.filter((s) => {
      if (classFilter !== 'all' && s.class_name !== classFilter) return false;
      if (term && !s.full_name?.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [summaries, classFilter, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => applySortFn(a, b, sortBy)),
    [filtered, sortBy],
  );

  const byClass = useMemo(() => {
    const innerSort: SavingsSummarySortBy = sortBy === 'class' ? 'balance' : sortBy;
    const map = new Map<string, SavingsStudentSummary[]>();
    for (const s of sorted) {
      const key = s.class_name ?? 'ไม่ระบุชั้น';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    map.forEach((rows, cls) => {
      map.set(cls, [...rows].sort((a, b) => applySortFn(a, b, innerSort)));
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const oa = CLASS_ORDER[a] ?? 99;
      const ob = CLASS_ORDER[b] ?? 99;
      return oa - ob;
    });
  }, [sorted, sortBy]);

  const handleLock = async () => {
    setSaving(true);
    await savingsViewPreferenceService.save({ viewMode, sortBy });
    setSaving(false);
    toast({ title: 'บันทึกค่าเริ่มต้นแล้ว', description: `วิว: ${viewMode === 'table' ? 'ตาราง' : viewMode === 'grid' ? 'การ์ด' : 'รายห้อง'} · เรียง: ${SORT_LABELS[sortBy]}` });
  };

  const handleExportCSV = () => {
    downloadCSV(
      'savings-summary.csv',
      ['ชื่อ', 'ชั้น', 'รหัส', 'ครั้งฝาก', 'ยอดฝากรวม', 'ครั้งถอน', 'ยอดถอนรวม', 'ยอดคงเหลือ', 'ธุรกรรม'],
      sorted.map((s) => [
        s.full_name ?? '',
        s.class_name ?? '',
        s.student_code ?? '',
        String(s.deposit_count ?? 0),
        String(Math.round(Number(s.total_deposits ?? 0))),
        String(s.withdraw_count ?? 0),
        String(Math.round(Number(s.total_withdrawals ?? 0))),
        String(Math.round(Number(s.current_balance ?? 0))),
        String(s.total_transactions ?? 0),
      ]),
    );
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) return;
    const totalBalance = sorted.reduce((sum, s) => sum + Number(s.current_balance ?? 0), 0);
    const totalSavers = sorted.filter((s) => Number(s.current_balance ?? 0) > 0).length;
    const totalDeposits = sorted.reduce((sum, s) => sum + Number(s.total_deposits ?? 0), 0);
    const totalWithdrawals = sorted.reduce((sum, s) => sum + Number(s.total_withdrawals ?? 0), 0);
    const rowsHtml = sorted
      .map(
        (s, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td style="text-align:center">${s.student_code || '—'}</td>
        <td style="font-weight:600">${s.full_name || '—'}</td>
        <td style="text-align:center">${s.class_name || '—'}</td>
        <td class="num">${Number(s.total_deposits ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</td>
        <td class="num">${Number(s.total_withdrawals ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</td>
        <td class="num" style="font-weight:700">${Number(s.current_balance ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</td>
        <td style="text-align:center">${s.total_transactions ?? 0}</td>
      </tr>`,
      )
      .join('');
    w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"/>
<title>รายงานสรุปยอดเงินฝากสะสมธนาคารพอเพียง</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Sarabun',sans-serif;padding:40px;color:#1e293b;background:#fff;line-height:1.5}
.header{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:30px;border-bottom:2px solid #e2e8f0;padding-bottom:20px}
.title-area{text-align:center}h1{font-size:20px;font-weight:800;color:#0f172a;margin-bottom:4px}.subtitle{font-size:13px;color:#64748b;font-weight:500}
.kpi-container{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px}
.kpi-card{border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#f8fafc}.kpi-card.hero{background:#fffbeb;border-color:#fde68a}
.kpi-label{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.kpi-value{font-size:18px;font-weight:800;color:#0f172a}.kpi-value .unit{font-size:12px;font-weight:500;color:#64748b;margin-left:4px}
table{width:100%;border-collapse:collapse;margin-bottom:40px;font-size:12px}th,td{border:1px solid #cbd5e1;padding:10px 12px}
th{background:#f1f5f9;font-weight:700;color:#334155;text-align:center}td.num{text-align:right;font-family:monospace;font-size:12px}
tr:nth-child(even){background:#f8fafc}
.signatures{display:grid;grid-template-columns:repeat(2,1fr);gap:60px;margin-top:50px;page-break-inside:avoid}
.sig-block{text-align:center;font-size:13px}.sig-line{margin-bottom:8px;color:#64748b}.sig-title{font-weight:600;color:#334155;margin-top:4px}
.footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;page-break-inside:avoid}
@media print{body{padding:0}.kpi-card,.kpi-card.hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}}
</style></head><body>
<div class="header"><span style="font-size:40px">🐷</span><div class="title-area"><h1>รายงานสารสนเทศยอดเงินออมสะสม ธนาคารพอเพียง</h1>
<div class="subtitle">โรงเรียนบ้านคำไผ่ · ข้อมูลอัปเดต ณ วันที่ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div></div>
<div class="kpi-container">
<div class="kpi-card"><div class="kpi-label">จำนวนผู้ออมทั้งหมด</div><div class="kpi-value">${totalSavers}<span class="unit">คน</span></div></div>
<div class="kpi-card"><div class="kpi-label">ยอดเงินฝากรวม</div><div class="kpi-value">${totalDeposits.toLocaleString('th-TH', { maximumFractionDigits: 0 })}<span class="unit">฿</span></div></div>
<div class="kpi-card"><div class="kpi-label">ยอดเงินถอนรวม</div><div class="kpi-value">${totalWithdrawals.toLocaleString('th-TH', { maximumFractionDigits: 0 })}<span class="unit">฿</span></div></div>
<div class="kpi-card hero"><div class="kpi-label" style="color:#92400e">ยอดเงินออมคงเหลือสุทธิ</div><div class="kpi-value" style="color:#92400e">${totalBalance.toLocaleString('th-TH', { maximumFractionDigits: 0 })}<span class="unit" style="color:#92400e">฿</span></div></div>
</div>
<table><thead><tr><th style="width:50px">ลำดับ</th><th style="width:100px">รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th style="width:80px">ชั้นเรียน</th>
<th style="width:120px">ยอดฝากรวม (บาท)</th><th style="width:120px">ยอดถอนรวม (บาท)</th><th style="width:130px">ยอดคงเหลือสุทธิ (บาท)</th><th style="width:100px">จำนวนธุรกรรม</th>
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="signatures">
<div class="sig-block"><div class="sig-line">ลงชื่อ............................................................ ผู้จัดทำรายงาน</div><div class="sig-title">(ครูผู้บันทึกข้อมูล)</div></div>
<div class="sig-block"><div class="sig-line">ลงชื่อ............................................................ ผู้อนุมัติรายงาน</div><div class="sig-title">(ผู้อำนวยการโรงเรียนบ้านคำไผ่)</div></div>
</div>
<div class="footer"><span>พิมพ์ด้วยระบบอัตโนมัติธนาคารพอเพียง</span><span>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' })} น.</span></div>
</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  if (prefLoading) {
    return <p className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด…</p>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
      {/* Header */}
      <div className="px-5 md:px-6 py-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="text-base font-extrabold text-slate-900">ยอดเงินคงเหลือรายคน</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View mode toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              {(
                [
                  { mode: 'table' as const, icon: <LayoutList className="w-3.5 h-3.5" />, label: 'ตาราง' },
                  { mode: 'grid' as const, icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'การ์ด' },
                  { mode: 'by-class' as const, icon: <Layers className="w-3.5 h-3.5" />, label: 'รายห้อง' },
                ] as const
              ).map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    viewMode === mode
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SavingsSummarySortBy)}>
              <SelectTrigger className="h-8 text-xs border-slate-200 min-w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SORT_LABELS) as [SavingsSummarySortBy, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lock preference */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              disabled={saving}
              className="border-slate-300 text-slate-700 font-bold gap-1 h-8 text-xs"
              title="ล็อกวิวและการเรียงนี้เป็นค่าเริ่มต้น"
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ล็อกค่าเริ่มต้น</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-300 text-slate-700 font-bold gap-1 h-8 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-slate-300 text-slate-700 font-bold gap-1 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mt-4">
          {viewMode !== 'by-class' && (
            <div className="space-y-1 min-w-36">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชั้น</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="border-slate-300 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้น</SelectItem>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1 flex-1 min-w-40">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">ค้นหาชื่อ</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อ..."
              className="border-slate-300 h-8 text-xs"
            />
          </div>
          <p className="text-xs text-slate-500 pb-1">
            {sorted.length.toLocaleString('th-TH')} คน
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {sorted.length === 0 && (
          <p className="text-center py-12 text-slate-500 font-medium text-sm">ไม่มีข้อมูล</p>
        )}

        {/* ── Table view ── */}
        {viewMode === 'table' && sorted.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">#</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">นักเรียน</th>
                  <th className="p-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">ชั้น</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">ครั้งฝาก</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">ยอดฝาก</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">ยอดถอน</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">คงเหลือ</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">ธุรกรรม</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => (
                  <tr
                    key={s.student_id ?? s.full_name}
                    className={cn('border-t border-slate-100', idx % 2 === 1 && 'bg-slate-50/40')}
                  >
                    <td className="p-3 text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="sm" />
                        <span className="font-bold text-slate-900">{s.full_name}</span>
                      </div>
                      <Button variant="outline" size="sm" disabled={!s.student_id} onClick={() => setStatementStudentId(s.student_id)} aria-label={`ดูรายละเอียด ${s.full_name ?? 'นักเรียน'}`} className={cn('mt-2')}>ดูรายละเอียด</Button>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {s.class_name ?? '—'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold text-emerald-700">
                      {Number(s.deposit_count ?? 0).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-amber-700">
                      {fmtBaht(Number(s.total_deposits ?? 0))}
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-rose-700">
                      {fmtBaht(Number(s.total_withdrawals ?? 0))}
                    </td>
                    <td className="p-3 text-right tabular-nums font-extrabold text-slate-900">
                      {fmtBaht(Number(s.current_balance ?? 0))}
                    </td>
                    <td className="p-3 text-right tabular-nums text-slate-500">
                      {s.total_transactions ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Grid / Card view ── */}
        {viewMode === 'grid' && sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sorted.map((s) => {
              const balance = Number(s.current_balance ?? 0);
              const hasSavings = balance > 0;
              return (
                <div
                  key={s.student_id ?? s.full_name}
                  className={cn(
                    'rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-shadow hover:shadow-md',
                    hasSavings
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="md" />
                  <div className="w-full">
                    <p className="text-xs font-bold text-slate-900 truncate">{s.full_name}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-semibold mt-1',
                        hasSavings ? 'border-emerald-300 text-emerald-700' : 'border-slate-300 text-slate-500',
                      )}
                    >
                      {s.class_name ?? '—'}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      'text-base font-extrabold tabular-nums leading-none',
                      hasSavings ? 'text-emerald-700' : 'text-slate-400',
                    )}
                  >
                    {fmtBaht(balance)}
                  </p>
                  <div className="w-full flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>ฝาก {Number(s.deposit_count ?? 0)} ครั้ง</span>
                    <span>ถอน {Number(s.withdraw_count ?? 0)} ครั้ง</span>
                  </div>
                  <Button variant="outline" size="sm" disabled={!s.student_id} onClick={() => setStatementStudentId(s.student_id)} aria-label={`ดูรายละเอียด ${s.full_name ?? 'นักเรียน'}`}>ดูรายละเอียด</Button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── By-class view ── */}
        {viewMode === 'by-class' && byClass.length > 0 && (
          <div className="space-y-5">
            {byClass.map(([className, students]) => {
              const classBalance = students.reduce((sum, s) => sum + Number(s.current_balance ?? 0), 0);
              const classDeposits = students.reduce((sum, s) => sum + Number(s.total_deposits ?? 0), 0);
              return (
                <div key={className} className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Section header */}
                  <div className="px-4 py-3 bg-slate-900 flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">{className}</span>
                      <Badge className="bg-white/20 text-white text-xs border-0">
                        {students.length} คน
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/80 font-medium">
                      <span>ฝากรวม {fmtBaht(classDeposits)}</span>
                      <span className="text-amber-300 font-bold">คงเหลือ {fmtBaht(classBalance)}</span>
                    </div>
                  </div>
                  {/* Students table */}
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2.5 text-left text-xs font-bold text-slate-500 pl-4">นักเรียน</th>
                        <th className="p-2.5 text-right text-xs font-bold text-slate-500">ครั้งฝาก</th>
                        <th className="p-2.5 text-right text-xs font-bold text-slate-500">ยอดฝาก</th>
                        <th className="p-2.5 text-right text-xs font-bold text-slate-500">ยอดถอน</th>
                        <th className="p-2.5 text-right text-xs font-bold text-slate-500 pr-4">คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <tr
                          key={s.student_id ?? s.full_name}
                          className={cn('border-t border-slate-100', idx % 2 === 1 && 'bg-slate-50/40')}
                        >
                          <td className="p-2.5 pl-4">
                            <div className="flex items-center gap-2">
                              <PersonAvatar name={s.full_name ?? '?'} photoUrl={s.photo_url} size="xs" />
                              <span className="font-semibold text-slate-900 text-xs">{s.full_name}</span>
                            </div>
                            <Button variant="outline" size="sm" disabled={!s.student_id} onClick={() => setStatementStudentId(s.student_id)} aria-label={`ดูรายละเอียด ${s.full_name ?? 'นักเรียน'}`} className={cn('mt-2')}>ดูรายละเอียด</Button>
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums text-emerald-700 font-semibold">
                            {Number(s.deposit_count ?? 0).toLocaleString('th-TH')}
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums font-bold text-amber-700">
                            {fmtBaht(Number(s.total_deposits ?? 0))}
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums font-bold text-rose-700">
                            {fmtBaht(Number(s.total_withdrawals ?? 0))}
                          </td>
                          <td className="p-2.5 text-right text-xs tabular-nums font-extrabold text-slate-900 pr-4">
                            {fmtBaht(Number(s.current_balance ?? 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {statementStudentId && <StudentStatementDialog key={statementStudentId} studentId={statementStudentId} open onOpenChange={open => { if (!open) setStatementStudentId(null); }} />}
    </div>
  );
};

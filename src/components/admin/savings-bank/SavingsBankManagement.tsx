import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, List, Users, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  savingsTransactionsService,
  savingsSummaryService,
  studentsService,
  termService,
} from '@/services';
import type {
  SavingsTransaction,
  SavingsStudentSummary,
  SavingsTransactionType,
} from '@/services/savings.service';
import { TermBanner } from '@/components/admin/waste-bank/TermBanner';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '@/components/admin/shared/RecorderSelect';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

type ActiveTab = 'record' | 'summary' | 'history';

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '—';
  return `${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

export const SavingsBankManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const { toast } = useToast();

  // ─── Form state (Tab 1) ────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    transaction_type: 'deposit' as SavingsTransactionType,
    student_class: '',
    student_id: '',
    student_name: '',
    amount: '',
    transaction_date: today,
    notes: '',
  });
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Data ──────────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [summaries, setSummaries] = useState<SavingsStudentSummary[]>([]);

  // ─── Filters (Tab 2 / 3) ───────────────────────────────────────────────────
  const [summaryClassFilter, setSummaryClassFilter] = useState('all');
  const [summarySearch, setSummarySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | SavingsTransactionType>('all');

  useEffect(() => {
    fetchTransactions();
    fetchSummaries();
  }, []);

  useEffect(() => {
    if (!form.student_class) {
      setStudentOptions([]);
      setForm((p) => ({ ...p, student_id: '', student_name: '' }));
      return;
    }
    (async () => {
      const { data } = await studentsService.getByClass(form.student_class);
      setStudentOptions(
        (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          class: s.class,
          photo_url: s.photo_url ?? null,
        })),
      );
    })();
    setForm((p) => ({ ...p, student_id: '', student_name: '' }));
  }, [form.student_class]);

  const fetchTransactions = async () => {
    const { data, error } = await savingsTransactionsService.getRecent(100);
    if (error) {
      toast({ title: 'โหลดรายการไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    setTransactions((data ?? []) as unknown as SavingsTransaction[]);
  };

  const fetchSummaries = async () => {
    const { data, error } = await savingsSummaryService.getAll();
    if (error) {
      toast({ title: 'โหลดยอดสะสมไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    setSummaries((data ?? []) as unknown as SavingsStudentSummary[]);
  };

  // ─── Submit deposit/withdraw ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.student_id) {
      toast({ title: 'กรุณาเลือกนักเรียน', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'จำนวนเงินไม่ถูกต้อง', variant: 'destructive' });
      return;
    }
    if (!recorder.staffId && !recorder.administratorId) {
      toast({ title: 'กรุณาเลือกผู้บันทึก', variant: 'destructive' });
      return;
    }

    // ตรวจยอดคงเหลือก่อนถอน
    if (form.transaction_type === 'withdraw') {
      const { data: summary } = await savingsSummaryService.getForStudent(form.student_id);
      const current = summary?.current_balance ?? 0;
      if (amount > Number(current)) {
        toast({
          title: 'ถอนไม่ได้',
          description: `ยอดคงเหลือเพียง ${fmtBaht(Number(current))} — ถอนเกินยอด`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // คำนวณ balance_after (snapshot — source of truth ยังคงเป็น view SUM)
      const { data: summaryBefore } = await savingsSummaryService.getForStudent(form.student_id);
      const before = Number(summaryBefore?.current_balance ?? 0);
      const balance_after =
        form.transaction_type === 'deposit' ? before + amount : before - amount;

      // ดึงเทอมปัจจุบันมา tag
      const term = await termService.getActive();

      const studentOpt = studentOptions.find((s) => s.id === form.student_id);
      const { error } = await savingsTransactionsService.insert({
        student_id: form.student_id,
        student_name: studentOpt?.name ?? form.student_name,
        student_class: form.student_class,
        transaction_type: form.transaction_type,
        amount,
        balance_after,
        transaction_date: form.transaction_date,
        notes: form.notes || null,
        recorded_by: recorder.name,
        recorded_by_staff_id: recorder.staffId,
        recorded_by_administrator_id: recorder.administratorId,
        academic_year: term?.year ?? null,
        semester: term?.sem ?? null,
      });

      if (error) throw error;

      toast({
        title: form.transaction_type === 'deposit' ? 'ฝากเงินสำเร็จ' : 'ถอนเงินสำเร็จ',
        description: `${studentOpt?.name} — ${fmtBaht(amount)} (คงเหลือ ${fmtBaht(balance_after)})`,
      });

      // reset
      setForm((p) => ({
        ...p,
        student_id: '',
        student_name: '',
        amount: '',
        notes: '',
      }));
      await Promise.all([fetchTransactions(), fetchSummaries()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบรายการนี้? — ยอดเงินคงเหลือจะถูกคำนวณใหม่')) return;
    const { error } = await savingsTransactionsService.delete(id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'ลบรายการแล้ว' });
    await Promise.all([fetchTransactions(), fetchSummaries()]);
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  const filteredSummaries = useMemo(() => {
    const term = summarySearch.trim().toLowerCase();
    return summaries.filter((s) => {
      if (summaryClassFilter !== 'all' && s.class_name !== summaryClassFilter) return false;
      if (term && !(s.full_name?.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [summaries, summaryClassFilter, summarySearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (historyTypeFilter !== 'all' && t.transaction_type !== historyTypeFilter) return false;
      return true;
    });
  }, [transactions, historyTypeFilter]);

  const schoolTotals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        deposits: acc.deposits + Number(s.total_deposits ?? 0),
        withdrawals: acc.withdrawals + Number(s.total_withdrawals ?? 0),
        balance: acc.balance + Number(s.current_balance ?? 0),
        savers: acc.savers + (Number(s.total_transactions ?? 0) > 0 ? 1 : 0),
      }),
      { deposits: 0, withdrawals: 0, balance: 0, savers: 0 },
    );
  }, [summaries]);

  const exportSummaryCSV = () => {
    downloadCSV(
      'savings-summary.csv',
      ['ชื่อ', 'ชั้น', 'ยอดฝากรวม', 'ยอดถอนรวม', 'ยอดคงเหลือ', 'จำนวนธุรกรรม'],
      filteredSummaries.map((s) => [
        s.full_name ?? '',
        s.class_name ?? '',
        Number(s.total_deposits ?? 0).toFixed(2),
        Number(s.total_withdrawals ?? 0).toFixed(2),
        Number(s.current_balance ?? 0).toFixed(2),
        String(s.total_transactions ?? 0),
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ธนาคารพอเพียง</h2>
        <p className="text-sm text-muted-foreground">
          ระบบฝาก/ถอนเงินสำหรับนักเรียน — สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
        </p>
      </div>

      <TermBanner />

      {/* School totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="ผู้ออม" value={schoolTotals.savers.toLocaleString('th-TH')} icon={<Users className="w-4 h-4" />} />
        <StatCard label="ยอดฝากรวม" value={fmtBaht(schoolTotals.deposits)} accent="emerald" />
        <StatCard label="ยอดถอนรวม" value={fmtBaht(schoolTotals.withdrawals)} accent="orange" />
        <StatCard label="ยอดเงินคงเหลือ" value={fmtBaht(schoolTotals.balance)} accent="primary" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <TabButton active={activeTab === 'record'} onClick={() => setActiveTab('record')} icon={<ArrowDownToLine className="w-4 h-4" />}>
          บันทึกธุรกรรม
        </TabButton>
        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={<Users className="w-4 h-4" />}>
          สรุปยอดรายคน
        </TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<List className="w-4 h-4" />}>
          ประวัติธุรกรรม
        </TabButton>
      </div>

      {/* ─── Tab 1: Record ─────────────────────────────────────────────── */}
      {activeTab === 'record' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">บันทึกฝาก/ถอนเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, transaction_type: 'deposit' }))}
                className={cn(
                  'rounded-lg border p-3 text-sm font-medium transition flex items-center justify-center gap-2',
                  form.transaction_type === 'deposit'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-muted-foreground hover:border-foreground/30',
                )}
              >
                <ArrowDownToLine className="w-4 h-4" /> ฝากเงิน
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, transaction_type: 'withdraw' }))}
                className={cn(
                  'rounded-lg border p-3 text-sm font-medium transition flex items-center justify-center gap-2',
                  form.transaction_type === 'withdraw'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                    : 'border-border text-muted-foreground hover:border-foreground/30',
                )}
              >
                <ArrowUpFromLine className="w-4 h-4" /> ถอนเงิน
              </button>
            </div>

            {/* Class + Student */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ชั้น</Label>
                <Select value={form.student_class} onValueChange={(v) => setForm((p) => ({ ...p, student_class: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>นักเรียน</Label>
                <Select
                  value={form.student_id}
                  onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}
                  disabled={!form.student_class}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.student_class ? 'เลือกนักเรียน' : 'เลือกชั้นก่อน'} />
                  </SelectTrigger>
                  <SelectContent>
                    {studentOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              {s.name.slice(0, 1)}
                            </div>
                          )}
                          <span>{s.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>จำนวนเงิน (บาท)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => setForm((p) => ({ ...p, transaction_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>หมายเหตุ (ถ้ามี)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="เช่น ฝากประจำสัปดาห์"
              />
            </div>

            {/* Recorder */}
            <RecorderSelect value={recorder} onChange={setRecorder} required />

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting
                ? 'กำลังบันทึก...'
                : form.transaction_type === 'deposit'
                  ? 'บันทึกฝากเงิน'
                  : 'บันทึกถอนเงิน'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Tab 2: Summary ──────────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ยอดเงินคงเหลือรายคน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1 min-w-40">
                <Label>ชั้น</Label>
                <Select value={summaryClassFilter} onValueChange={setSummaryClassFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกชั้น</SelectItem>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-40">
                <Label>ค้นหาชื่อ</Label>
                <Input
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  placeholder="พิมพ์ชื่อ..."
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportSummaryCSV} className="gap-1">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">ชื่อ</th>
                    <th className="text-left p-2">ชั้น</th>
                    <th className="text-right p-2">ฝากรวม</th>
                    <th className="text-right p-2">ถอนรวม</th>
                    <th className="text-right p-2">คงเหลือ</th>
                    <th className="text-right p-2">ธุรกรรม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">ไม่มีข้อมูล</td></tr>
                  )}
                  {filteredSummaries.map((s) => (
                    <tr key={s.student_id ?? s.full_name} className="border-t border-border">
                      <td className="p-2">{s.full_name}</td>
                      <td className="p-2">{s.class_name}</td>
                      <td className="p-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                        {fmtBaht(Number(s.total_deposits ?? 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums text-orange-700 dark:text-orange-400">
                        {fmtBaht(Number(s.total_withdrawals ?? 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums font-semibold">
                        {fmtBaht(Number(s.current_balance ?? 0))}
                      </td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">
                        {s.total_transactions ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tab 3: History ──────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ประวัติธุรกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">กรอง:</Label>
              <Select value={historyTypeFilter} onValueChange={(v) => setHistoryTypeFilter(v as 'all' | SavingsTransactionType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="deposit">ฝาก</SelectItem>
                  <SelectItem value="withdraw">ถอน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">วันที่</th>
                    <th className="text-left p-2">นักเรียน</th>
                    <th className="text-left p-2">ชั้น</th>
                    <th className="text-center p-2">ประเภท</th>
                    <th className="text-right p-2">จำนวน</th>
                    <th className="text-right p-2">คงเหลือหลังทำ</th>
                    <th className="text-left p-2">ผู้บันทึก</th>
                    <th className="text-center p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 && (
                    <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">ไม่มีรายการ</td></tr>
                  )}
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-2 whitespace-nowrap">{t.transaction_date}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {t.students?.photo_url ? (
                            <img src={t.students.photo_url} alt={t.student_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-[11px] font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                              {t.student_name.slice(0, 1)}
                            </div>
                          )}
                          <span>{t.student_name}</span>
                        </div>
                      </td>
                      <td className="p-2">{t.student_class}</td>
                      <td className="p-2 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            t.transaction_type === 'deposit'
                              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30'
                              : 'border-orange-500/40 text-orange-700 dark:text-orange-300 bg-orange-50/50 dark:bg-orange-950/30',
                          )}
                        >
                          {t.transaction_type === 'deposit' ? 'ฝาก' : 'ถอน'}
                        </Badge>
                      </td>
                      <td className="p-2 text-right tabular-nums font-medium">
                        {fmtBaht(Number(t.amount))}
                      </td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">
                        {fmtBaht(Number(t.balance_after))}
                      </td>
                      <td className="p-2 text-muted-foreground">{t.recorded_by ?? '—'}</td>
                      <td className="p-2 text-center">
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 w-7">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const TabButton = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 transition',
      active
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    )}
  >
    {icon}
    {children}
  </button>
);

const StatCard = ({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: 'emerald' | 'orange' | 'primary';
}) => {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400'
      : accent === 'orange'
        ? 'text-orange-700 dark:text-orange-400'
        : accent === 'primary'
          ? 'text-primary'
          : 'text-foreground';
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </div>
        <div className={cn('text-lg font-bold tabular-nums mt-1', accentClass)}>{value}</div>
      </CardContent>
    </Card>
  );
};

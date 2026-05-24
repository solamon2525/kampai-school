import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  List,
  Users,
  Download,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingUp,
  QrCode,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import { BackupsTabContent } from './BackupsTabContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  RecorderSelect,
  EMPTY_RECORDER,
  type RecorderValue,
} from '@/components/admin/shared/RecorderSelect';
import { StudentQRScanner } from '@/components/shared/StudentQRScanner';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

type ActiveTab = 'record' | 'summary' | 'history' | 'backups';

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '—';
  return `${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

const fmtCount = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('th-TH');

export const SavingsBankManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const { toast } = useToast();

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [quickRepeat, setQuickRepeat] = useState(false);

  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [summaries, setSummaries] = useState<SavingsStudentSummary[]>([]);

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
      const opts = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        photo_url: s.photo_url ?? null,
      }));
      setStudentOptions(opts);
      // เก็บ student_id เดิมไว้ถ้ายังอยู่ในชั้นใหม่ (กรณี QR scan ที่ set ทั้ง class+id พร้อมกัน)
      setForm((p) => {
        const stillValid = p.student_id && opts.some((o) => o.id === p.student_id);
        if (stillValid) return p;
        return { ...p, student_id: '', student_name: '' };
      });
    })();
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

  const handleQRScanned = async (studentId: string) => {
    setScannerOpen(false);
    const { data, error } = await studentsService.getById(studentId);
    if (error || !data) {
      toast({
        title: 'ไม่พบนักเรียน',
        description: 'QR ไม่ถูกต้องหรือนักเรียนถูกลบ',
        variant: 'destructive',
      });
      return;
    }
    // โหลด options ของชั้นก่อน แล้วค่อย set student — เลี่ยง useEffect reset student_id
    const { data: classmates } = await studentsService.getByClass(data.class);
    setStudentOptions(
      (classmates || []).map((s) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        photo_url: s.photo_url ?? null,
      })),
    );
    setForm((p) => ({
      ...p,
      student_class: data.class,
      student_id: data.id,
      student_name: data.name,
    }));
    toast({ title: `เลือก: ${data.name} (${data.class})` });
  };

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
      const { data: summaryBefore } = await savingsSummaryService.getForStudent(form.student_id);
      const before = Number(summaryBefore?.current_balance ?? 0);
      const balance_after =
        form.transaction_type === 'deposit' ? before + amount : before - amount;

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

      setForm((p) => ({
        ...p,
        student_id: '',
        student_name: '',
        amount: '',
        notes: '',
      }));
      await Promise.all([fetchTransactions(), fetchSummaries()]);
      if (quickRepeat) {
        setScannerOpen(true);
      }
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

  // Derived data
  const filteredSummaries = useMemo(() => {
    const term = summarySearch.trim().toLowerCase();
    return summaries.filter((s) => {
      if (summaryClassFilter !== 'all' && s.class_name !== summaryClassFilter) return false;
      if (term && !s.full_name?.toLowerCase().includes(term)) return false;
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-1">
          ระบบบริการ
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <PiggyBank className="w-7 h-7 text-amber-500" />
          ธนาคารพอเพียง
        </h2>
        <p className="text-sm text-slate-600 font-medium mt-1">
          ระบบฝาก/ถอนเงินสำหรับนักเรียน — สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
        </p>
      </div>

      <TermBanner />

      {/* School totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="ผู้ออม"
          value={fmtCount(schoolTotals.savers)}
          unit="คน"
          icon={<Users className="w-5 h-5 text-slate-500" />}
          accentBar="bg-slate-900"
        />
        <KpiCard
          label="ยอดฝากรวม"
          value={fmtBaht(schoolTotals.deposits)}
          icon={<ArrowDownToLine className="w-5 h-5 text-amber-500" />}
          accentBar="bg-amber-500"
        />
        <KpiCard
          label="ยอดถอนรวม"
          value={fmtBaht(schoolTotals.withdrawals)}
          icon={<ArrowUpFromLine className="w-5 h-5 text-rose-500" />}
          accentBar="bg-rose-500"
        />
        <KpiHero
          label="ยอดเงินคงเหลือ"
          value={fmtBaht(schoolTotals.balance)}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {/* Tab navigation — pill style */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl flex-wrap gap-1">
        <PillTab
          active={activeTab === 'record'}
          onClick={() => setActiveTab('record')}
          icon={<TrendingUp className="w-4 h-4" />}
        >
          บันทึกธุรกรรม
        </PillTab>
        <PillTab
          active={activeTab === 'summary'}
          onClick={() => setActiveTab('summary')}
          icon={<Users className="w-4 h-4" />}
        >
          สรุปยอดรายคน
        </PillTab>
        <PillTab
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={<List className="w-4 h-4" />}
        >
          ประวัติธุรกรรม
        </PillTab>
        <PillTab
          active={activeTab === 'backups'}
          onClick={() => setActiveTab('backups')}
          icon={<Database className="w-4 h-4" />}
        >
          ระบบสำรองข้อมูล
        </PillTab>
      </div>

      {/* ─── Tab 1: Record ────────────────────────────────────────────── */}
      {activeTab === 'record' && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
          <div className="px-5 md:px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">บันทึกฝาก/ถอนเงิน</h3>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* Type toggle — SOLID HIGH CONTRAST */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, transaction_type: 'deposit' }))}
                className={cn(
                  'rounded-xl py-4 text-base font-extrabold transition flex items-center justify-center gap-2 active:translate-y-px',
                  form.transaction_type === 'deposit'
                    ? 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                <ArrowDownToLine className="w-5 h-5" /> ฝากเงิน
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, transaction_type: 'withdraw' }))}
                className={cn(
                  'rounded-xl py-4 text-base font-extrabold transition flex items-center justify-center gap-2 active:translate-y-px',
                  form.transaction_type === 'withdraw'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                <ArrowUpFromLine className="w-5 h-5" /> ถอนเงิน
              </button>
            </div>

            {/* QR Scanner shortcut */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setScannerOpen(true)}
                className="w-full gap-2 border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-500"
              >
                <QrCode className="w-5 h-5" />
                สแกน QR นักเรียน
              </Button>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quickRepeat}
                  onChange={(e) => setQuickRepeat(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-semibold">โหมดต่อเนื่อง</span> — หลังบันทึกเปิดสแกนต่อทันที (เหมาะกับช่วงเช้านักเรียนต่อแถว)
                </span>
              </label>
            </div>

            {/* Class + Student */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชั้น</Label>
                <Select
                  value={form.student_class}
                  onValueChange={(v) => setForm((p) => ({ ...p, student_class: v }))}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="เลือกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">นักเรียน</Label>
                <Select
                  value={form.student_id}
                  onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}
                  disabled={!form.student_class}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder={form.student_class ? 'เลือกนักเรียน' : 'เลือกชั้นก่อน'} />
                  </SelectTrigger>
                  <SelectContent>
                    {studentOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
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
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  จำนวนเงิน (บาท)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="border-slate-300 font-bold tabular-nums text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">วันที่</Label>
                <ThaiDatePicker
                  value={form.transaction_date}
                  onChange={(v) => setForm((p) => ({ ...p, transaction_date: v }))}
                  dateFormat="full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                หมายเหตุ (ถ้ามี)
              </Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="เช่น ฝากประจำสัปดาห์"
                className="border-slate-300"
              />
            </div>

            <RecorderSelect value={recorder} onChange={setRecorder} required />

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className={cn(
                'w-full text-base font-extrabold shadow-lg active:translate-y-px',
                form.transaction_type === 'deposit'
                  ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/30'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30',
              )}
            >
              {isSubmitting
                ? 'กำลังบันทึก...'
                : form.transaction_type === 'deposit'
                  ? 'บันทึกฝากเงิน'
                  : 'บันทึกถอนเงิน'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Tab 2: Summary ────────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
          <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3 justify-between">
            <h3 className="text-base font-extrabold text-slate-900">ยอดเงินคงเหลือรายคน</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={exportSummaryCSV}
              className="border-slate-300 text-slate-700 font-bold gap-1"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>

          <div className="p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 min-w-40">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชั้น</Label>
                <Select value={summaryClassFilter} onValueChange={setSummaryClassFilter}>
                  <SelectTrigger className="border-slate-300">
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
              <div className="space-y-1.5 flex-1 min-w-40">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">ค้นหาชื่อ</Label>
                <Input
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  placeholder="พิมพ์ชื่อ..."
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <Th className="text-left">ชื่อ</Th>
                    <Th className="text-left">ชั้น</Th>
                    <Th className="text-right">ฝากรวม</Th>
                    <Th className="text-right">ถอนรวม</Th>
                    <Th className="text-right">คงเหลือ</Th>
                    <Th className="text-right">ธุรกรรม</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-medium">
                        ไม่มีข้อมูล
                      </td>
                    </tr>
                  )}
                  {filteredSummaries.map((s, idx) => (
                    <tr
                      key={s.student_id ?? s.full_name}
                      className={cn(
                        'border-t border-slate-100',
                        idx % 2 === 1 && 'bg-slate-50/40',
                      )}
                    >
                      <td className="p-3 font-bold text-slate-900">{s.full_name}</td>
                      <td className="p-3 text-slate-700 font-medium">{s.class_name}</td>
                      <td className="p-3 text-right tabular-nums font-bold text-amber-700">
                        {fmtBaht(Number(s.total_deposits ?? 0))}
                      </td>
                      <td className="p-3 text-right tabular-nums font-bold text-rose-700">
                        {fmtBaht(Number(s.total_withdrawals ?? 0))}
                      </td>
                      <td className="p-3 text-right tabular-nums font-extrabold text-slate-900">
                        {fmtBaht(Number(s.current_balance ?? 0))}
                      </td>
                      <td className="p-3 text-right tabular-nums text-slate-600 font-medium">
                        {s.total_transactions ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 3: History ────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
          <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex items-center gap-3 justify-between">
            <h3 className="text-base font-extrabold text-slate-900">ประวัติธุรกรรมล่าสุด</h3>
            <div className="flex items-center gap-2">
              <FilterChip
                active={historyTypeFilter === 'all'}
                onClick={() => setHistoryTypeFilter('all')}
              >
                ทั้งหมด
              </FilterChip>
              <FilterChip
                active={historyTypeFilter === 'deposit'}
                onClick={() => setHistoryTypeFilter('deposit')}
                accent="amber"
              >
                ฝาก
              </FilterChip>
              <FilterChip
                active={historyTypeFilter === 'withdraw'}
                onClick={() => setHistoryTypeFilter('withdraw')}
                accent="rose"
              >
                ถอน
              </FilterChip>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <Th className="text-left">วันที่</Th>
                    <Th className="text-left">นักเรียน</Th>
                    <Th className="text-left">ชั้น</Th>
                    <Th className="text-center">ประเภท</Th>
                    <Th className="text-right">จำนวน</Th>
                    <Th className="text-right">คงเหลือหลัง</Th>
                    <Th className="text-left">ผู้บันทึก</Th>
                    <Th className="text-center"></Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 font-medium">
                        ไม่มีรายการ
                      </td>
                    </tr>
                  )}
                  {filteredTransactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={cn(
                        'border-t border-slate-100',
                        idx % 2 === 1 && 'bg-slate-50/40',
                      )}
                    >
                      <td className="p-3 whitespace-nowrap text-slate-700 font-medium">
                        {formatThaiDateMedium(t.transaction_date)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {t.students?.photo_url ? (
                            <img
                              src={t.students.photo_url}
                              alt={t.student_name}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700 flex-shrink-0">
                              {t.student_name.slice(0, 1)}
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{t.student_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{t.student_class}</td>
                      <td className="p-3 text-center">
                        {t.transaction_type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-bold shadow-sm">
                            <ArrowDownToLine className="w-3 h-3" /> ฝาก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm">
                            <ArrowUpFromLine className="w-3 h-3" /> ถอน
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums font-extrabold text-slate-900">
                        {fmtBaht(Number(t.amount))}
                      </td>
                      <td className="p-3 text-right tabular-nums text-slate-600 font-semibold">
                        {fmtBaht(Number(t.balance_after))}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{t.recorded_by ?? '—'}</td>
                      <td className="p-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(t.id)}
                          className="h-7 w-7 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 4: Backups ────────────────────────────────────────────── */}
      {activeTab === 'backups' && (
        <BackupsTabContent summaries={summaries} fetchSummaries={fetchSummaries} />
      )}

      {/* QR Scanner Dialog */}
      <StudentQRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleQRScanned}
      />
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Th = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={cn(
      'p-3 text-xs font-bold uppercase tracking-wider text-slate-700',
      className,
    )}
  >
    {children}
  </th>
);

const KpiCard = ({
  label,
  value,
  unit,
  icon,
  accentBar,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  accentBar: string;
}) => (
  <div
    className={cn(
      'bg-white rounded-xl p-4 ring-1 ring-slate-200 border-l-4 hover:shadow-md transition',
      accentBar.replace('bg-', 'border-l-'),
    )}
  >
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
      {icon}
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
        {value}
      </span>
      {unit && <span className="text-sm font-bold text-slate-600">{unit}</span>}
    </div>
  </div>
);

const KpiHero = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 shadow-lg ring-1 ring-amber-500/20">
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
      {icon}
      {label}
    </div>
    <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-white tabular-nums tracking-tight">
      {value}
    </div>
  </div>
);

const PillTab = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition active:translate-y-px',
      active
        ? 'bg-slate-900 text-white shadow-md'
        : 'text-slate-600 hover:text-slate-900',
    )}
  >
    {icon}
    {children}
  </button>
);

const FilterChip = ({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent?: 'amber' | 'rose';
  children: React.ReactNode;
}) => {
  const activeClass =
    accent === 'amber'
      ? 'bg-amber-500 text-amber-950 shadow-sm'
      : accent === 'rose'
        ? 'bg-rose-500 text-white shadow-sm'
        : 'bg-slate-900 text-white shadow-sm';
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-bold transition active:translate-y-px',
        active ? activeClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      )}
    >
      {children}
    </button>
  );
};

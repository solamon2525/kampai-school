import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  List,
  Users,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingUp,
  QrCode,
  Database,
  UserCheck,
  LayoutGrid,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { QuickStudentPicker } from '@/components/admin/waste-bank/QuickStudentPicker';
import { cn } from '@/lib/utils';
import { BackupsTabContent } from './BackupsTabContent';
import { TeacherSummaryTab } from './TeacherSummaryTab';
import { StudentSummaryTab } from './StudentSummaryTab';
import { ClassroomBatchDepositTab } from './ClassroomBatchDepositTab';
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
  savingsErrorMessage,
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
import { formatThaiDateMedium, getBangkokTodayIso } from '@/lib/thaiDate';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { getFirstName, speakThai, thaiNumberToWords } from '@/lib/thaiSpeech';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100] as const;

interface StudentOption {
  id: string;
  name: string;
  class: string;
  photo_url: string | null;
}

interface DepositConfirmation {
  studentName: string;
  photoUrl: string | null;
  amount: number;
  balanceAfter: number;
  transactionType: SavingsTransactionType;
}

type ActiveTab = 'record' | 'batch' | 'summary' | 'history' | 'backups' | 'teachers';

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '—';
  return `${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿`;
};

const fmtCount = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('th-TH');

export const SavingsBankManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = getBangkokTodayIso();
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
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [quickMode, setQuickMode] = useState(
    () => localStorage.getItem('savings_quick_mode') === '1'
  );
  const toggleQuickMode = () =>
    setQuickMode((prev) => {
      const next = !prev;
      localStorage.setItem('savings_quick_mode', next ? '1' : '0');
      return next;
    });
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [quickRepeat, setQuickRepeat] = useState(false);
  const [depositConfirmation, setDepositConfirmation] = useState<DepositConfirmation | null>(null);
  const [speechComplete, setSpeechComplete] = useState(false);
  const speechRequestRef = useRef(0);

  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [summaries, setSummaries] = useState<SavingsStudentSummary[]>([]);

  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | SavingsTransactionType>('all');
  const [historyClassFilter, setHistoryClassFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

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
    setLoadingStudents(true);
    (async () => {
      const { data } = await studentsService.getByClass(form.student_class);
      const opts = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        class: s.class,
        photo_url: s.photo_url ?? null,
      }));
      setStudentOptions(opts);
      setLoadingStudents(false);
      // เก็บ student_id เดิมไว้ถ้ายังอยู่ในชั้นใหม่ (กรณี QR scan ที่ set ทั้ง class+id พร้อมกัน)
      setForm((p) => {
        const stillValid = p.student_id && opts.some((o) => o.id === p.student_id);
        if (stillValid) return p;
        return { ...p, student_id: '', student_name: '' };
      });
    })();
  }, [form.student_class]);

  useEffect(() => {
    if (!depositConfirmation || !speechComplete) return;
    const timer = window.setTimeout(() => {
      setDepositConfirmation(null);
      if (quickRepeat) setScannerOpen(true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [depositConfirmation, quickRepeat, speechComplete]);

  const closeDepositConfirmation = () => {
    speechRequestRef.current += 1;
    setDepositConfirmation(null);
    if (quickRepeat) setScannerOpen(true);
  };

  const fetchTransactions = async () => {
    const { data, error } = await savingsTransactionsService.getAll();
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

  const invalidateSavingsCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['savings-student-summaries'] }),
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['savings-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['savings-bank'] }),
      queryClient.invalidateQueries({ queryKey: ['savings-statement'] }),
      queryClient.invalidateQueries({ queryKey: ['student-three-banks'] }),
    ]);
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTransactions(), fetchSummaries(), invalidateSavingsCaches()]);
    setIsRefreshing(false);
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
    if (submitLockRef.current || isSubmitting) return;
    if (!form.student_id) {
      toast({ title: 'กรุณาเลือกนักเรียน', variant: 'destructive' });
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isInteger(amount) || amount <= 0 || amount >= 100000000) {
      toast({ title: 'กรุณากรอกจำนวนเต็ม (ไม่มีทศนิยม)', variant: 'destructive' });
      return;
    }
    if (!recorder.name || (!recorder.staffId && !recorder.administratorId)) {
      toast({ title: 'กรุณาเลือกผู้บันทึก', variant: 'destructive' });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    try {
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

      const term = await termService.getActive();

      const studentOpt = studentOptions.find((s) => s.id === form.student_id);
      const { data: saved, error } = await savingsTransactionsService.insert({
        student_id: form.student_id,
        student_name: studentOpt?.name ?? form.student_name,
        student_class: form.student_class,
        transaction_type: form.transaction_type,
        amount,
        transaction_date: form.transaction_date,
        notes: form.notes || null,
        recorded_by: recorder.name,
        recorded_by_staff_id: recorder.staffId,
        recorded_by_administrator_id: recorder.administratorId,
        academic_year: term?.year ?? null,
        semester: term?.sem ?? null,
      });

      if (error) throw error;
      if (!saved?.[0]) throw new Error('ไม่ได้รับการยืนยันจากระบบ กรุณาตรวจสอบประวัติก่อนบันทึกซ้ำ');
      const balance_after = Number(saved[0].balance_after);

      toast({
        title: form.transaction_type === 'deposit' ? 'ฝากเงินสำเร็จ' : 'ถอนเงินสำเร็จ',
        description: `${studentOpt?.name} — ${fmtBaht(amount)} (คงเหลือ ${fmtBaht(balance_after)})`,
      });

      const studentName = studentOpt?.name ?? form.student_name;
      const transactionType = form.transaction_type;
      setDepositConfirmation({
        studentName,
        photoUrl: studentOpt?.photo_url ?? null,
        amount,
        balanceAfter: balance_after,
        transactionType,
      });
      setSpeechComplete(false);
      const speechRequest = ++speechRequestRef.current;
      void speakThai([
        `${transactionType === 'deposit' ? 'ฝาก' : 'ถอน'}เงินสำเร็จ`,
        `ชื่อ ${getFirstName(studentName)}`,
        `${transactionType === 'deposit' ? 'ฝาก' : 'ถอน'} ${thaiNumberToWords(amount)} บาท`,
        `ยอดคงเหลือ ${thaiNumberToWords(balance_after)} บาท`,
      ]).then(({ spoken }) => {
        if (speechRequest !== speechRequestRef.current) return;
        if (spoken) setSpeechComplete(true);
        else window.setTimeout(() => {
          if (speechRequest === speechRequestRef.current) setSpeechComplete(true);
        }, 5000);
      });

      setForm((p) => ({
        ...p,
        student_id: '',
        student_name: '',
        amount: '',
        notes: '',
      }));
      await Promise.all([fetchTransactions(), fetchSummaries(), invalidateSavingsCaches()]);
    } catch (err) {
      const msg = savingsErrorMessage(err);
      toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTransactionId(id);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    const id = deleteTransactionId;
    setDeleteTransactionId(null);
    const { error } = await savingsTransactionsService.delete(id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: savingsErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'ลบรายการแล้ว' });
    await Promise.all([fetchTransactions(), fetchSummaries(), invalidateSavingsCaches()]);
  };

  // Derived data
  const filteredTransactions = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLocaleLowerCase('th-TH');
    return transactions.filter((t) => {
      if (historyTypeFilter !== 'all' && t.transaction_type !== historyTypeFilter) return false;
      if (historyClassFilter !== 'all' && t.student_class !== historyClassFilter) return false;
      if (normalizedSearch && !t.student_name.toLocaleLowerCase('th-TH').includes(normalizedSearch)) return false;
      return true;
    });
  }, [transactions, historyTypeFilter, historyClassFilter, historySearch]);

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


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-1">
          ระบบบริการ
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <PiggyBank className="w-7 h-7 text-amber-500" />
          ธนาคารพอเพียง
        </h2>
        <p className="text-sm text-muted-foreground font-medium mt-1">
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
          icon={<Users className="w-5 h-5 text-muted-foreground" />}
          accentBar="bg-primary"
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
          icon={<ArrowUpFromLine className="w-5 h-5 text-destructive" />}
          accentBar="bg-destructive"
        />
        <KpiHero
          label="ยอดเงินคงเหลือ"
          value={fmtBaht(schoolTotals.balance)}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {/* Tab navigation — pill style */}
      <div className={cn('inline-flex p-1 bg-muted rounded-xl flex-wrap gap-1')}>
        <PillTab
          active={activeTab === 'record'}
          onClick={() => setActiveTab('record')}
          icon={<TrendingUp className="w-4 h-4" />}
        >
          บันทึกธุรกรรม
        </PillTab>
        <PillTab
          active={activeTab === 'batch'}
          onClick={() => setActiveTab('batch')}
          icon={<Coins className="w-4 h-4" />}
        >
          บันทึกประจำชั้น
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
        <PillTab
          active={activeTab === 'teachers'}
          onClick={() => setActiveTab('teachers')}
          icon={<UserCheck className="w-4 h-4" />}
        >
          สรุปรายครู
        </PillTab>
      </div>

      {/* ─── Tab 1: Record ────────────────────────────────────────────── */}
      {activeTab === 'record' && (
        <div className={cn('bg-card rounded-2xl shadow-sm ring-1 ring-border')}>
          <div className="px-5 md:px-6 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-extrabold text-foreground">บันทึกฝาก/ถอนเงิน</h3>
            <button
              type="button"
              onClick={toggleQuickMode}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                quickMode
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              โหมดเลือกเร็ว
            </button>
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
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
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
                    ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 ring-2 ring-destructive/40'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
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
                className={cn(
                  'w-full gap-2 border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-500',
                )}
              >
                <QrCode className="w-5 h-5" />
                สแกน QR นักเรียน
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={quickRepeat}
                  onChange={(e) => setQuickRepeat(e.target.checked)}
                  className="rounded border-border text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-semibold">โหมดต่อเนื่อง</span> — หลังบันทึกเปิดสแกนต่อทันที (เหมาะกับช่วงเช้านักเรียนต่อแถว)
                </span>
              </label>
            </div>

            {/* Class + Student */}
            {quickMode ? (
              <QuickStudentPicker
                classes={CLASSES}
                selectedClass={form.student_class}
                onClassChange={(v) => setForm((p) => ({ ...p, student_class: v }))}
                students={studentOptions}
                loadingStudents={loadingStudents}
                selectedStudentId={form.student_id}
                onStudentSelect={(id, name) =>
                  setForm((p) => ({ ...p, student_id: id, student_name: name }))
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ชั้น</Label>
                  <Select
                    value={form.student_class}
                    onValueChange={(v) => setForm((p) => ({ ...p, student_class: v }))}
                  >
                    <SelectTrigger className="border-border">
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
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">นักเรียน</Label>
                  <Select
                    value={form.student_id}
                    onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}
                    disabled={!form.student_class}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder={form.student_class ? 'เลือกนักเรียน' : 'เลือกชั้นก่อน'} />
                    </SelectTrigger>
                    <SelectContent>
                      {studentOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                            <span>{s.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Amount + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  จำนวนเงิน (บาท)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0"
                  className={cn('border-border font-bold tabular-nums text-base')}
                />
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, amount: String(v) }))}
                      className={cn(
                        'px-2.5 py-1 rounded-md border text-sm font-bold tabular-nums transition-colors',
                        form.amount === String(v)
                          ? 'border-amber-500 bg-amber-100 text-amber-900'
                          : 'border-border text-foreground hover:bg-amber-50 hover:border-amber-400',
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">วันที่</Label>
                <ThaiDatePicker
                  value={form.transaction_date}
                  onChange={(v) => setForm((p) => ({ ...p, transaction_date: v }))}
                  dateFormat="full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                หมายเหตุ (ถ้ามี)
              </Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="เช่น ฝากประจำสัปดาห์"
                className="border-border"
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
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/30',
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

      <Dialog
        open={depositConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && depositConfirmation) closeDepositConfirmation();
        }}
      >
        <DialogContent className="max-w-2xl border-border bg-card px-5 py-8 text-center sm:px-10 sm:py-10">
          {depositConfirmation && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="mb-2 flex items-center gap-3">
                  <PersonAvatar
                    name={depositConfirmation.studentName}
                    photoUrl={depositConfirmation.photoUrl}
                    size="lg"
                    className="ring-4 ring-amber-200"
                  />
                  <div className="text-left">
                    <DialogTitle className="text-xl font-extrabold text-foreground sm:text-2xl">
                      {depositConfirmation.transactionType === 'deposit' ? 'ฝากเงินสำเร็จ' : 'ถอนเงินสำเร็จ'}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-base font-semibold text-foreground/75 sm:text-lg">
                      {depositConfirmation.studentName}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                  <p className="text-sm font-bold text-amber-900 sm:text-base">
                    {depositConfirmation.transactionType === 'deposit' ? 'ยอดฝากล่าสุด' : 'ยอดถอนล่าสุด'}
                  </p>
                  <p className="mt-2 text-4xl font-black tabular-nums text-amber-950 sm:text-5xl">
                    {fmtBaht(depositConfirmation.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-bold sm:text-base">ยอดเงินสะสม</p>
                  <p className="mt-2 text-4xl font-black tabular-nums sm:text-5xl">
                    {fmtBaht(depositConfirmation.balanceAfter)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {speechComplete ? 'อ่านข้อมูลเรียบร้อยแล้ว' : 'กำลังอ่านข้อมูลยืนยันรายการ...'}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Tab Batch: Classroom Batch Deposit ────────────────────────── */}
      {activeTab === 'batch' && <ClassroomBatchDepositTab onSuccess={refreshAll} />}

      {/* ─── Tab 2: Summary ────────────────────────────────────────────── */}
      {activeTab === 'summary' && <StudentSummaryTab summaries={summaries} />}

      {/* ─── Tab 3: History ────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className={cn('bg-card rounded-2xl shadow-sm ring-1 ring-border')}>
          <div className="px-5 md:px-6 py-4 border-b border-border flex items-center gap-3 justify-between flex-wrap">
            <div>
              <h3 className="text-base font-extrabold text-foreground">ประวัติธุรกรรมทั้งหมด</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                แสดง {filteredTransactions.length.toLocaleString('th-TH')} จาก {transactions.length.toLocaleString('th-TH')} รายการ
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'กำลังอัปเดต' : 'อัปเดตข้อมูล'}
            </Button>
          </div>

          <div className="px-5 md:px-6 pt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[360px]">
              <Select value={historyClassFilter} onValueChange={setHistoryClassFilter}>
                <SelectTrigger className="sm:w-32">
                  <SelectValue placeholder="ทุกชั้น" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้น</SelectItem>
                  {CLASSES.map((className) => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="ค้นหาชื่อนักเรียน"
                className="sm:flex-1"
              />
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <Th className="text-left">วันที่</Th>
                    <Th className="text-left">นักเรียน</Th>
                    <Th className="text-left">ชั้น</Th>
                    <Th className="text-center">ประเภท</Th>
                    <Th className="text-right">จำนวน</Th>
                    <Th className="text-right">คงเหลือหลัง</Th>
                    <Th className="text-left">ผู้บันทึก</Th>
                    <Th className="text-center">จัดการ</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground font-medium">
                        ไม่มีรายการ
                      </td>
                    </tr>
                  )}
                  {filteredTransactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={cn(
                        'border-t border-border',
                        idx % 2 === 1 && 'bg-muted/30',
                      )}
                    >
                      <td className="p-3 whitespace-nowrap text-muted-foreground font-medium">
                        <div>{formatThaiDateMedium(t.transaction_date)}</div>
                        <div className="text-[10px] text-muted-foreground/80 font-semibold mt-0.5">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }) + ' น.' : '—'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <PersonAvatar
                            name={t.student_name}
                            photoUrl={t.students?.photo_url}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <span className="font-bold text-foreground">{t.student_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">{t.student_class}</td>
                      <td className="p-3 text-center">
                        {t.transaction_type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-bold shadow-sm">
                            <ArrowDownToLine className="w-3 h-3" /> ฝาก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-sm">
                            <ArrowUpFromLine className="w-3 h-3" /> ถอน
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums font-extrabold text-foreground">
                        {fmtBaht(Number(t.amount))}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground font-semibold">
                        {fmtBaht(Number(t.balance_after))}
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">
                        {t.recorded_by ? (
                          <div className="flex items-center gap-2">
                            <PersonAvatar
                              name={t.recorded_by}
                              photoUrl={t.recorder_staff?.photo_url ?? t.recorder_admin?.photo_url}
                              size="xs"
                              className="flex-shrink-0"
                            />
                            <span>{t.recorded_by}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(t.id)}
                          className="h-7 w-7 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
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

      {/* ─── Tab 5: Teacher recorder summary ────────────────────────────── */}
      {activeTab === 'teachers' && <TeacherSummaryTab />}

      {/* QR Scanner Dialog */}
      <StudentQRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleQRScanned}
      />

      <ConfirmDialog
        open={deleteTransactionId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTransactionId(null);
        }}
        onConfirm={confirmDeleteTransaction}
        title="ลบรายการนี้?"
        description="ยอดเงินคงเหลือจะถูกคำนวณใหม่"
        confirmText="ลบรายการ"
        variant="destructive"
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
      'p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground',
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
      'bg-card rounded-xl p-4 ring-1 ring-border border-l-4 hover:shadow-md transition',
      accentBar.replace('bg-', 'border-l-'),
    )}
  >
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
      {icon}
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
        {value}
      </span>
      {unit && <span className="text-sm font-bold text-muted-foreground">{unit}</span>}
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
  <div className={cn('bg-gradient-to-br from-primary to-primary/90 rounded-xl p-4 shadow-lg ring-1 ring-amber-500/20')}>
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
      {icon}
      {label}
    </div>
    <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-primary-foreground tabular-nums tracking-tight">
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
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:text-foreground',
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
        ? 'bg-destructive text-destructive-foreground shadow-sm'
        : 'bg-primary text-primary-foreground shadow-sm';
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-bold transition active:translate-y-px',
        active ? activeClass : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
    >
      {children}
    </button>
  );
};

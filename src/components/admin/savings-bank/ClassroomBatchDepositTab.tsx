import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Coins,
  Send,
  Trash2,
  AlertCircle,
  Monitor,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  type SavingsStudentSummary,
} from '@/services';
import {
  RecorderSelect,
  EMPTY_RECORDER,
  type RecorderValue,
} from '@/components/admin/shared/RecorderSelect';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ClassroomProjectorView, type ProjectorStudent } from './ClassroomProjectorView';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
const PRESET_AMOUNTS = [5, 10, 20, 50, 100] as const;

interface StudentRowState {
  id: string;
  name: string;
  class: string;
  class_number: number | null;
  photo_url: string | null;
  current_balance: number;
  amount: string; // empty string means not depositing today
  notes: string;
}

interface Props {
  onSuccess: () => void;
}

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0 ฿';
  return `${Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿`;
};

export const ClassroomBatchDepositTab = ({ onSuccess }: Props) => {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [selectedClass, setSelectedClass] = useState<string>('ป.1');
  const [transactionDate, setTransactionDate] = useState<string>(today);
  const [batchNotes, setBatchNotes] = useState<string>('ฝากเงินประจำชั้นโฮมรูม');
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<StudentRowState[]>([]);
  const [projectorOpen, setProjectorOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState<{
    count: number;
    total: number;
    className: string;
    date: string;
  } | null>(null);

  const draftKey = `savings_batch_draft_${selectedClass}`;

  // Load students and balances when class changes
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!selectedClass) return;
      setLoading(true);
      try {
        const [studentsRes, summariesRes] = await Promise.all([
          studentsService.getByClass(selectedClass),
          savingsSummaryService.getAll(),
        ]);

        if (!active) return;

        const summaryMap = new Map<string, SavingsStudentSummary>();
        for (const s of (summariesRes.data ?? []) as unknown as SavingsStudentSummary[]) {
          if (s.student_id) summaryMap.set(s.student_id, s);
        }

        // Check if there is an existing draft for this class
        let draftAmounts: Record<string, string> = {};
        try {
          const raw = localStorage.getItem(`savings_batch_draft_${selectedClass}`);
          if (raw) {
            draftAmounts = JSON.parse(raw);
          }
        } catch {
          draftAmounts = {};
        }

        const hasAnyDraft = Object.keys(draftAmounts).length > 0;
        setHasDraft(hasAnyDraft);

        const rows: StudentRowState[] = (studentsRes.data ?? []).map((s) => {
          const sum = summaryMap.get(s.id);
          const draftedAmount = draftAmounts[s.id] || '';
          return {
            id: s.id,
            name: s.name,
            class: s.class,
            class_number: s.class_number,
            photo_url: s.photo_url ?? null,
            current_balance: Number(sum?.current_balance ?? 0),
            amount: draftedAmount,
            notes: '',
          };
        });

        // Sort by class_number ascending
        rows.sort((a, b) => (a.class_number ?? 99) - (b.class_number ?? 99));
        setStudents(rows);
      } catch (err) {
        toast({
          title: 'โหลดข้อมูลนักเรียนไม่สำเร็จ',
          description: err instanceof Error ? err.message : 'กรุณาลองใหม่',
          variant: 'destructive',
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [selectedClass, toast]);

  // Persist draft whenever amounts change
  useEffect(() => {
    if (students.length === 0) return;
    const draftMap: Record<string, string> = {};
    let count = 0;
    students.forEach((s) => {
      if (s.amount && parseInt(s.amount, 10) > 0) {
        draftMap[s.id] = s.amount;
        count++;
      }
    });

    try {
      if (count > 0) {
        localStorage.setItem(draftKey, JSON.stringify(draftMap));
        setHasDraft(true);
      } else {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
      }
    } catch {
      // storage unavailable
    }
  }, [students, draftKey]);

  const handleAmountChange = (studentId: string, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, amount: clean } : s)),
    );
  };

  const handleQuickAdd = (studentId: string, delta: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const current = parseInt(s.amount || '0', 10);
        const next = current + delta;
        return { ...s, amount: String(next) };
      }),
    );
  };

  const handleClearStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, amount: '', notes: '' } : s)),
    );
  };

  // Keyboard navigation: Enter / Down Arrow -> next student; Up Arrow -> previous student
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`batch-deposit-input-${index + 1}`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`batch-deposit-input-${index - 1}`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Bulk tools for the whole class
  const handleBulkFillAmount = (amount: number) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, amount: String(amount) })),
    );
    toast({
      title: 'กำหนดเงินเท่ากันทุกคน',
      description: `ใส่วันนี้ ${amount} บาท ให้ทุกคนในห้อง ${selectedClass}`,
    });
  };

  const handleClearAll = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, amount: '', notes: '' })));
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch {}
  };

  // Calculations
  const activeDeposits = useMemo(() => {
    return students
      .filter((s) => {
        const amt = parseInt(s.amount, 10);
        return !isNaN(amt) && amt > 0;
      })
      .map((s) => ({
        student_id: s.id,
        amount: parseInt(s.amount, 10),
        notes: s.notes || undefined,
      }));
  }, [students]);

  const totalAmount = useMemo(() => {
    return activeDeposits.reduce((sum, d) => sum + d.amount, 0);
  }, [activeDeposits]);

  const participationRate = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round((activeDeposits.length / students.length) * 100);
  }, [activeDeposits, students]);

  // Submit batch
  const handleSubmitBatch = async () => {
    if (activeDeposits.length === 0) {
      toast({
        title: 'ไม่มีรายการฝาก',
        description: 'กรุณากรอกยอดเงินฝากอย่างน้อย 1 คน',
        variant: 'destructive',
      });
      return;
    }
    if (!recorder.name) {
      toast({
        title: 'กรุณาเลือกผู้บันทึก',
        description: 'เลือกครูประจำชั้นหรือผู้ดูแลก่อนบันทึกยอด',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentTerm = await termService.getCurrentTerm();
      const academicYear = currentTerm?.academic_year ?? null;
      const semester = currentTerm?.semester ?? null;

      const { data, error } = await savingsTransactionsService.recordBatch({
        deposits: activeDeposits,
        transaction_date: transactionDate,
        recorded_by: recorder.name,
        recorded_by_staff_id: recorder.staffId,
        recorded_by_administrator_id: recorder.administratorId,
        academic_year: academicYear,
        semester: semester,
        notes: batchNotes || undefined,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : null;
      const count = result?.success_count ?? activeDeposits.length;
      const sum = result?.total_amount ?? totalAmount;

      toast({
        title: 'บันทึกฝากเงินประจำชั้นสำเร็จ! 🎉',
        description: `บันทึกนักเรียน ${count} คน ยอดเงินรวม ${fmtBaht(sum)}`,
      });

      // Clear draft storage
      try {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
      } catch {}

      setLastBatchResult({
        count,
        total: Number(sum),
        className: selectedClass,
        date: transactionDate,
      });

      // Clear input amounts
      setStudents((prev) =>
        prev.map((s) => {
          const dep = activeDeposits.find((d) => d.student_id === s.id);
          const added = dep ? dep.amount : 0;
          return {
            ...s,
            current_balance: s.current_balance + added,
            amount: '',
            notes: '',
          };
        }),
      );

      onSuccess();
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: err instanceof Error ? err.message : 'กรุณาตรวจสอบยอดและลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Projector Fullscreen Modal ─────────────────────────────── */}
      {projectorOpen && (
        <ClassroomProjectorView
          className={selectedClass}
          transactionDate={transactionDate}
          students={students as ProjectorStudent[]}
          onClose={() => setProjectorOpen(false)}
        />
      )}

      {/* ─── Control Bar ────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-foreground text-lg">
              บันทึกฝากเงินประจำชั้น (Batch Deposit)
            </h3>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-300">
              เร็วและสะดวก
            </Badge>
          </div>

          {/* Projector Trigger */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 font-bold border-amber-400/60 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 gap-1.5 shadow-xs"
              onClick={() => setProjectorOpen(true)}
            >
              <Monitor className="w-4 h-4 text-amber-600" />
              ฉายจอห้องเรียน (Smartboard) 🖥️
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Class Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">ระดับชั้นเรียน</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full font-bold">
                <SelectValue placeholder="เลือกระดับชั้น" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls} className="font-medium">
                    ห้อง {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">วันที่ทำรายการ</Label>
            <ThaiDatePicker
              value={transactionDate}
              onChange={setTransactionDate}
              className="w-full"
            />
          </div>

          {/* Recorder Select */}
          <div className="space-y-1.5">
            <RecorderSelect
              value={recorder}
              onChange={setRecorder}
              label="ครูประจำชั้น / ผู้บันทึก"
              required
            />
          </div>

          {/* Batch Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">หมายเหตุรวม</Label>
            <Input
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="เช่น ฝากเงินประจำวันจันทร์"
              className="text-xs"
            />
          </div>
        </div>

        {/* Bulk Action Buttons & Draft Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              ใส่ยอดทุกคนเท่ากัน:
            </span>
            {PRESET_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 font-bold hover:border-amber-400 hover:bg-amber-500/10"
                onClick={() => handleBulkFillAmount(amt)}
              >
                +{amt} ฿
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
              onClick={handleClearAll}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              ล้างยอด
            </Button>

            {hasDraft && (
              <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20 gap-1">
                <RotateCcw className="w-3 h-3" />
                จำยอดที่กรอกค้างไว้ในเครื่อง
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            นักเรียนในห้องทั้งหมด <span className="font-bold text-foreground">{students.length}</span> คน
            <span className="text-[11px] text-muted-foreground ml-2 hidden lg:inline">
              (กด Enter หรือ ↓ เพื่อเลื่อนไปคนถัดไป)
            </span>
          </div>
        </div>
      </div>

      {/* ─── Last Batch Success Banner ───────────────────────────────── */}
      {lastBatchResult && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-500/10 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">
                บันทึกยอดเงินห้อง {lastBatchResult.className} ล่าสุดสำเร็จ
              </p>
              <p className="text-xs text-emerald-700">
                ฝาก {lastBatchResult.count} คน · ยอดรวม {fmtBaht(lastBatchResult.total)} บาท · วันที่ {lastBatchResult.date}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-emerald-400 bg-card hover:bg-emerald-50"
            onClick={() => setLastBatchResult(null)}
          >
            ปิด
          </Button>
        </div>
      )}

      {/* ─── Summary Overview Card ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">ยอดฝากรวมทั้งห้อง</p>
              <p className="text-xl font-extrabold text-foreground tabular-nums">
                {fmtBaht(totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">จำนวนคนที่ฝากวันนี้</p>
              <p className="text-xl font-extrabold text-foreground tabular-nums">
                {activeDeposits.length} <span className="text-xs font-normal text-muted-foreground">/ {students.length} คน</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">สัดส่วนการมีส่วนร่วม</p>
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums">
                {participationRate}%
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center p-2">
          <Button
            size="lg"
            className="w-full h-full font-bold shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950"
            disabled={isSubmitting || activeDeposits.length === 0}
            onClick={handleSubmitBatch}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                บันทึกยอดทั้งห้อง ({activeDeposits.length} คน)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Students Table ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">
            รายชื่อนักเรียน ชั้น {selectedClass}
          </span>
          <span className="text-xs text-muted-foreground">
            ใส่เฉพาะนักเรียนที่นำเงินมาฝาก (กด Enter หรือ ↓ เลื่อนไปคนถัดไป)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p className="text-sm">กำลังโหลดข้อมูลนักเรียน...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p>ไม่พบนักเรียนในชั้น {selectedClass}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b border-border text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3 text-center w-14">เลขที่</th>
                  <th className="p-3 text-left">นักเรียน</th>
                  <th className="p-3 text-right w-36">ยอดคงเหลือเดิม</th>
                  <th className="p-3 text-left w-72">ยอดฝากวันนี้ (บาท)</th>
                  <th className="p-3 text-left w-52">หมายเหตุเฉพาะคน</th>
                  <th className="p-3 text-center w-14"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {students.map((st, index) => {
                  const hasAmount = Boolean(st.amount && parseInt(st.amount, 10) > 0);
                  return (
                    <tr
                      key={st.id}
                      className={cn(
                        'transition-colors',
                        hasAmount ? 'bg-amber-500/5 font-medium' : 'hover:bg-muted/20',
                      )}
                    >
                      {/* Class Number */}
                      <td className="p-3 text-center font-bold text-xs text-muted-foreground tabular-nums">
                        {st.class_number ?? '—'}
                      </td>

                      {/* Student Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <PersonAvatar
                            name={st.name}
                            photoUrl={st.photo_url}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs md:text-sm truncate">
                              {st.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Current Balance */}
                      <td className="p-3 text-right tabular-nums text-xs md:text-sm text-muted-foreground">
                        {fmtBaht(st.current_balance)}
                      </td>

                      {/* Deposit Input + Keyboard Nav + Quick Buttons */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Input
                            id={`batch-deposit-input-${index}`}
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={st.amount}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onChange={(e) => handleAmountChange(st.id, e.target.value)}
                            className={cn(
                              'w-24 h-8 text-right font-extrabold tabular-nums text-sm',
                              hasAmount
                                ? 'border-amber-400 bg-amber-500/10 text-amber-900 focus-visible:ring-amber-400'
                                : 'text-foreground',
                            )}
                          />
                          <div className="flex items-center gap-1">
                            {PRESET_AMOUNTS.slice(0, 3).map((amt) => (
                              <Button
                                key={amt}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                                onClick={() => handleQuickAdd(st.id, amt)}
                              >
                                +{amt}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Individual Note */}
                      <td className="p-3">
                        <Input
                          type="text"
                          placeholder="หมายเหตุ (ถ้ามี)"
                          value={st.notes}
                          onChange={(e) =>
                            setStudents((prev) =>
                              prev.map((s) =>
                                s.id === st.id ? { ...s, notes: e.target.value } : s,
                              ),
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </td>

                      {/* Clear Button */}
                      <td className="p-3 text-center">
                        {hasAmount && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleClearStudent(st.id)}
                            title="ล้างยอดของคนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar when scrolled (Light mode semantic tokens) */}
      {activeDeposits.length > 0 && (
        <div className="sticky bottom-4 z-20 bg-card text-foreground rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 border border-border ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                พร้อมบันทึกห้อง <span className="font-bold text-foreground">{selectedClass}</span>
              </p>
              <p className="text-base font-extrabold text-amber-600 tabular-nums">
                {activeDeposits.length} คน · รวม {fmtBaht(totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:bg-muted text-xs"
              onClick={handleClearAll}
            >
              ล้างทั้งหมด
            </Button>
            <Button
              size="sm"
              className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs shadow-sm"
              disabled={isSubmitting}
              onClick={handleSubmitBatch}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกยอดทันที'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

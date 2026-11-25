import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Flame,
  Minus,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  studentsService,
  type StudentMin,
} from '@/services/students.service';
import {
  wasteCategoriesService,
  wastePromotionsService,
  wasteSummaryService,
  wasteTransactionsService,
  type WasteCategory,
  type WastePromotion,
  type WasteStudentSummary,
} from '@/services/waste-bank.service';
import {
  RecorderSelect,
  EMPTY_RECORDER,
  type RecorderValue,
} from '@/components/admin/shared/RecorderSelect';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { computeRowPromotionPoints } from '@/lib/wasteBankHelpers';
import { speakThai, thaiNumberToWords } from '@/lib/thaiSpeech';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'] as const;

const getLocalTodayIso = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

type BatchInsertRow = Parameters<typeof wasteTransactionsService.insertMany>[0][number];

interface Props {
  categories?: WasteCategory[];
  categoriesLoading?: boolean;
  activePromos?: WastePromotion[];
  onSuccess?: () => void;
}

export const ClassroomWasteBatchTab = ({
  categories: propCategories,
  categoriesLoading = false,
  activePromos: propPromos,
  onSuccess,
}: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<string>('ป.1');
  const [transactionDate, setTransactionDate] = useState<string>(getLocalTodayIso);
  const [batchNotes, setBatchNotes] = useState<string>('');
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [lastBatchResult, setLastBatchResult] = useState<{
    className: string;
    studentCount: number;
    totalItems: number;
    totalPoints: number;
    date: string;
  } | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['waste-batch-students', selectedClass],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(selectedClass);
      if (error) throw error;
      const list = (data ?? []) as StudentMin[];
      return [...list].sort(
        (a, b) =>
          (a.class_number ?? 999) - (b.class_number ?? 999) ||
          a.name.localeCompare(b.name, 'th'),
      );
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['waste-categories', 'active'],
    enabled: propCategories === undefined,
    queryFn: async () => {
      const { data, error } = await wasteCategoriesService.getActive();
      if (error) throw error;
      return (data ?? []) as WasteCategory[];
    },
  });

  const promosQuery = useQuery({
    queryKey: ['waste-promotions', 'active'],
    enabled: propPromos === undefined,
    queryFn: async () => {
      const { data, error } = await wastePromotionsService.getActive();
      if (error) throw error;
      return (data ?? []) as WastePromotion[];
    },
  });

  const summariesQuery = useQuery({
    queryKey: ['waste-student-summaries'],
    queryFn: async () => {
      const { data, error } = await wasteSummaryService.getAll();
      if (error) throw error;
      return (data ?? []) as WasteStudentSummary[];
    },
  });

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const activeCategories = useMemo(() => {
    const raw = propCategories ?? categoriesQuery.data ?? [];
    return raw.filter((c) => c.is_active !== false);
  }, [propCategories, categoriesQuery.data]);

  const activePromos = useMemo(
    () => propPromos ?? promosQuery.data ?? [],
    [propPromos, promosQuery.data],
  );

  const summaryByStudentId = useMemo(() => {
    const map = new Map<string, WasteStudentSummary>();
    for (const s of summariesQuery.data ?? []) {
      if (s.student_id) map.set(s.student_id, s);
    }
    return map;
  }, [summariesQuery.data]);

  const handleClassChange = (nextClass: string) => {
    setSelectedClass(nextClass);
    setQuantities({});
    setLastBatchResult(null);
  };

  const setCellQuantity = (studentId: string, categoryId: string, nextQty: number) => {
    const clamped = Math.max(0, Math.trunc(Number.isFinite(nextQty) ? nextQty : 0));
    setQuantities((prev) => {
      const prevStudent = prev[studentId] ?? {};
      if (clamped === 0) {
        const restStudent = { ...prevStudent };
        delete restStudent[categoryId];
        if (Object.keys(restStudent).length === 0) {
          const restAll = { ...prev };
          delete restAll[studentId];
          return restAll;
        }
        return { ...prev, [studentId]: restStudent };
      }
      return {
        ...prev,
        [studentId]: {
          ...prevStudent,
          [categoryId]: clamped,
        },
      };
    });
  };

  const stepCellQuantity = (studentId: string, categoryId: string, delta: number) => {
    const current = quantities[studentId]?.[categoryId] ?? 0;
    setCellQuantity(studentId, categoryId, current + delta);
  };

  const clearStudentQuantities = (studentId: string) => {
    setQuantities((prev) => {
      if (!(studentId in prev)) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const clearAllQuantities = () => {
    setQuantities({});
  };

  const previewByStudent = useMemo(() => {
    const now = new Date();
    const map = new Map<
      string,
      {
        totalItems: number;
        totalPoints: number;
        hasPromo: boolean;
        cells: Record<string, { qty: number; finalPoints: number; promoLabels: string[] }>;
      }
    >();

    for (const student of students) {
      const studentMap = quantities[student.id] ?? {};
      let totalItems = 0;
      let totalPoints = 0;
      let hasPromo = false;
      const cells: Record<string, { qty: number; finalPoints: number; promoLabels: string[] }> = {};

      for (const cat of activeCategories) {
        const qty = studentMap[cat.id] ?? 0;
        if (qty <= 0) continue;
        const result = computeRowPromotionPoints({
          quantity: qty,
          pointsPerItem: cat.points_per_item,
          categoryId: cat.id,
          promotions: activePromos,
          now,
        });
        const promoLabels = result.appliedPromotions.map((p) => p.badge_text || p.title);
        if (promoLabels.length > 0) hasPromo = true;
        totalItems += qty;
        totalPoints += result.finalPoints;
        cells[cat.id] = {
          qty,
          finalPoints: result.finalPoints,
          promoLabels,
        };
      }

      map.set(student.id, { totalItems, totalPoints, hasPromo, cells });
    }
    return map;
  }, [students, activeCategories, quantities, activePromos]);

  const batchSummary = useMemo(() => {
    let participatingStudents = 0;
    let totalItems = 0;
    let totalPoints = 0;
    let promoCells = 0;

    for (const entry of previewByStudent.values()) {
      if (entry.totalItems > 0) {
        participatingStudents += 1;
        totalItems += entry.totalItems;
        totalPoints += entry.totalPoints;
        for (const cell of Object.values(entry.cells)) {
          if (cell.promoLabels.length > 0) promoCells += 1;
        }
      }
    }
    const participationRate =
      students.length > 0 ? Math.round((participatingStudents / students.length) * 100) : 0;

    return { participatingStudents, totalItems, totalPoints, promoCells, participationRate };
  }, [previewByStudent, students.length]);

  const submitMutation = useMutation({
    mutationFn: async (payload: BatchInsertRow[]) => {
      const { error } = await wasteTransactionsService.insertMany(payload);
      if (error) throw error;
    },
    onSuccess: (_data, payload) => {
      const totalPts = payload.reduce((sum, row) => sum + row.points_earned, 0);
      const totalQty = payload.reduce((sum, row) => sum + row.quantity, 0);
      const studentCount = new Set(payload.map((row) => row.student_id)).size;

      toast({
        title: 'บันทึกขยะทั้งห้องสำเร็จ',
        description: `ชั้น ${selectedClass} · ${studentCount} คน · ${totalQty.toLocaleString('th-TH')} ชิ้น · รวม ${totalPts.toLocaleString('th-TH')} แต้ม`,
      });

      setLastBatchResult({
        className: selectedClass,
        studentCount,
        totalItems: totalQty,
        totalPoints: totalPts,
        date: transactionDate,
      });
      setQuantities({});

      void queryClient.invalidateQueries({ queryKey: ['waste-student-summaries'] });
      void queryClient.invalidateQueries({ queryKey: ['waste-student-statement'] });
      void queryClient.invalidateQueries({ queryKey: ['waste-transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['waste-classroom-league'] });
      void queryClient.invalidateQueries({ queryKey: ['waste-bank-showcase', 'public-results'] });
      onSuccess?.();

      void speakThai([
        `บันทึกขยะห้อง ${selectedClass} สำเร็จ`,
        `${thaiNumberToWords(studentCount)} คน`,
        `รวม ${thaiNumberToWords(totalQty)} ชิ้น`,
        `${thaiNumberToWords(totalPts)} แต้ม`,
      ]);
    },
    onError: (err) => {
      toast({
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: err instanceof Error ? err.message : 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitBatch = () => {
    if (!transactionDate) {
      toast({
        title: 'กรุณาเลือกวันที่ทำรายการ',
        variant: 'destructive',
      });
      return;
    }
    if (!recorder.name) {
      toast({
        title: 'กรุณาเลือกผู้บันทึก',
        description: 'เลือกครูประจำชั้นหรือผู้ดูแลก่อนบันทึกยอดทั้งห้อง',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    const userNote = batchNotes.trim();
    const payload: BatchInsertRow[] = [];

    for (const student of students) {
      const rowMap = quantities[student.id];
      if (!rowMap) continue;
      for (const cat of activeCategories) {
        const qty = Math.max(0, Math.trunc(rowMap[cat.id] ?? 0));
        if (qty <= 0) continue;
        const { finalPoints, appliedPromotions } = computeRowPromotionPoints({
          quantity: qty,
          pointsPerItem: cat.points_per_item,
          categoryId: cat.id,
          promotions: activePromos,
          now,
        });
        const promoLabels = appliedPromotions.map((p) => p.badge_text || p.title);
        const promoPrefix = promoLabels.length > 0 ? `[${promoLabels.join(', ')}] ` : '';
        const rowNotes = userNote ? `${promoPrefix}${userNote}` : (promoPrefix.trim() || null);

        payload.push({
          student_name: student.name.trim(),
          student_class: student.class || selectedClass,
          student_id: student.id,
          category_id: cat.id,
          quantity: qty,
          points_earned: finalPoints,
          transaction_date: transactionDate,
          notes: rowNotes,
          recorded_by: recorder.name || null,
          recorded_by_staff_id: recorder.staffId,
          recorded_by_administrator_id: recorder.administratorId,
        });
      }
    }

    if (payload.length === 0) {
      toast({
        title: 'ยังไม่ได้กรอกจำนวนขยะ',
        description: 'กรุณากรอกจำนวนขยะอย่างน้อย 1 คน / 1 ประเภท',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate(payload);
  };

  const isLoadingData =
    studentsQuery.isLoading ||
    (propCategories === undefined
      ? categoriesQuery.isLoading
      : Boolean(categoriesLoading && activeCategories.length === 0));

  return (
    <div className="space-y-5">
      {/* Active Promotions Banner */}
      {activePromos.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-primary/10 border border-amber-400/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <div className="font-bold text-sm text-foreground flex flex-wrap items-center gap-1.5">
                <span>โปรโมชั่นที่กำลังเปิดใช้:</span>
                {activePromos.map((p) => (
                  <Badge key={p.id} className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                    {p.badge_text || p.title}
                    {p.category_ids && p.category_ids.length > 0 ? ' (เฉพาะประเภท)' : ''}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                คำนวณตัวคูณและโบนัสแยกตามประเภทขยะที่ร่วมรายการให้อัตโนมัติแบบเรียลไทม์
              </p>
            </div>
          </div>
          {batchSummary.promoCells > 0 && (
            <div className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg self-start sm:self-auto flex items-center gap-1.5 shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>ใช้โปรโมชั่นกับ {batchSummary.promoCells} ช่อง</span>
            </div>
          )}
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="w-5 h-5 text-primary shrink-0" />
            <h3 className="font-bold text-foreground text-base md:text-lg truncate">
              บันทึกส่งขยะทั้งห้อง (Classroom Batch)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {batchSummary.totalItems > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllQuantities}
                className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างทั้งหมด
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">ระดับชั้นเรียน</Label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full font-bold">
                <SelectValue placeholder="เลือกชั้น" />
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">วันที่ทำรายการ</Label>
            <ThaiDatePicker
              value={transactionDate}
              onChange={setTransactionDate}
              dateFormat="full"
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <RecorderSelect
              value={recorder}
              onChange={setRecorder}
              label="ครูประจำชั้น / ผู้บันทึก"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">หมายเหตุรวม (ถ้ามี)</Label>
            <Input
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="เช่น ส่งขยะเช้าวันศุกร์"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Last Batch Success Banner */}
      {lastBatchResult && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm text-emerald-900">
                บันทึกยอดขยะห้อง {lastBatchResult.className} สำเร็จแล้ว
              </p>
              <p className="text-xs text-emerald-700">
                ส่งขยะ {lastBatchResult.studentCount} คน · รวม {lastBatchResult.totalItems.toLocaleString('th-TH')} ชิ้น · {lastBatchResult.totalPoints.toLocaleString('th-TH')} แต้ม · วันที่ {lastBatchResult.date}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs border-emerald-400 bg-card hover:bg-emerald-100"
            onClick={() => setLastBatchResult(null)}
          >
            ปิด
          </Button>
        </div>
      )}

      {/* Summary Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground truncate">นักเรียนที่ส่งวันนี้</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums">
                {batchSummary.participatingStudents}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ {students.length} คน</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground truncate">จำนวนชิ้นรวม</p>
              <p className="text-lg font-extrabold text-foreground tabular-nums">
                {batchSummary.totalItems.toLocaleString('th-TH')}{' '}
                <span className="text-xs font-normal text-muted-foreground">ชิ้น</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground truncate">แต้มรวมทั้งห้อง</p>
              <p className="text-lg font-extrabold text-amber-700 tabular-nums">
                +{batchSummary.totalPoints.toLocaleString('th-TH')}{' '}
                <span className="text-xs font-normal text-muted-foreground">แต้ม</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-2 lg:col-span-1 flex items-stretch">
          <Button
            type="button"
            size="lg"
            className="w-full h-full min-h-12 px-4 whitespace-normal text-center font-bold shadow-sm"
            disabled={submitMutation.isPending || batchSummary.totalItems === 0}
            onClick={handleSubmitBatch}
          >
            {submitMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                บันทึกทั้งห้อง ({batchSummary.participatingStudents} คน)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Students List / Batch Grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-sm text-foreground">
            รายชื่อนักเรียน ชั้น {selectedClass} ({students.length} คน)
          </span>
          <span className="text-xs text-muted-foreground">
            กรอกจำนวนชิ้นเฉพาะประเภทที่นักเรียนนำมาส่ง (คำนวณโปรโมชั่นอัตโนมัติ)
          </span>
        </div>

        {isLoadingData ? (
          <div className="p-10 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-sm">กำลังโหลดข้อมูลนักเรียนและประเภทขยะ...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">ไม่พบนักเรียนในชั้น {selectedClass}</p>
          </div>
        ) : activeCategories.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">ยังไม่มีประเภทขยะที่เปิดใช้งาน</p>
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (< md) */}
            <div className="md:hidden divide-y divide-border">
              {students.map((student) => {
                const preview = previewByStudent.get(student.id);
                const summary = summaryByStudentId.get(student.id);
                const hasItems = (preview?.totalItems ?? 0) > 0;

                return (
                  <div
                    key={student.id}
                    className={cn(
                      'p-3.5 space-y-3 transition-colors',
                      hasItems ? 'bg-emerald-50/50' : 'bg-card',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums w-5 text-center shrink-0">
                          {student.class_number ?? '—'}
                        </span>
                        <PersonAvatar
                          name={student.name}
                          photoUrl={student.photo_url}
                          size="sm"
                          className="aspect-square shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            แต้มคงเหลือ {Number(summary?.available_points ?? 0).toLocaleString('th-TH')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasItems && (
                          <>
                            <Badge className="bg-emerald-600 text-primary-foreground font-bold tabular-nums text-xs">
                              +{preview?.totalPoints ?? 0} แต้ม
                              {preview?.hasPromo ? ' ✨' : ''}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => clearStudentQuantities(student.id)}
                              aria-label={`ล้างรายการของ ${student.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {activeCategories.map((cat) => {
                        const qty = quantities[student.id]?.[cat.id] ?? 0;
                        const cell = preview?.cells[cat.id];
                        return (
                          <div
                            key={cat.id}
                            className={cn(
                              'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2',
                              qty > 0 ? 'border-emerald-300 bg-card' : 'border-border bg-muted/20',
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                                <span className="shrink-0">{cat.icon || '♻️'}</span>
                                <span className="truncate">{cat.name}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span>{cat.points_per_item} แต้ม/ชิ้น</span>
                                {cell && cell.finalPoints > 0 && (
                                  <span className="font-bold text-emerald-700 tabular-nums">
                                    → +{cell.finalPoints}
                                    {cell.promoLabels.length > 0 ? ` (${cell.promoLabels.join(', ')})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={qty <= 0}
                                onClick={() => stepCellQuantity(student.id, cat.id, -1)}
                                aria-label={`ลด ${cat.name} ของ ${student.name}`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                placeholder="0"
                                value={qty > 0 ? qty : ''}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) =>
                                  setCellQuantity(
                                    student.id,
                                    cat.id,
                                    e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                                  )
                                }
                                aria-label={`${student.name} ${cat.name}`}
                                className="w-14 h-8 text-center font-bold tabular-nums px-1 text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => stepCellQuantity(student.id, cat.id, 1)}
                                aria-label={`เพิ่ม ${cat.name} ของ ${student.name}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Compact Grid (md+) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-2.5 text-center w-12 font-semibold">#</th>
                    <th className="p-2.5 text-left min-w-[190px] font-semibold">นักเรียน</th>
                    {activeCategories.map((cat) => (
                      <th key={cat.id} className="p-2.5 text-center min-w-[128px] font-semibold">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base leading-none">{cat.icon || '♻️'}</span>
                          <span className="text-foreground font-bold line-clamp-1">{cat.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {cat.points_per_item} แต้ม/ชิ้น
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-2.5 text-right min-w-[110px] font-semibold">รวมวันนี้</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {students.map((student) => {
                    const preview = previewByStudent.get(student.id);
                    const summary = summaryByStudentId.get(student.id);
                    const hasItems = (preview?.totalItems ?? 0) > 0;

                    return (
                      <tr
                        key={student.id}
                        className={cn(
                          'transition-colors',
                          hasItems ? 'bg-emerald-50/40' : 'hover:bg-muted/20',
                        )}
                      >
                        <td className="p-2.5 text-center font-bold text-muted-foreground tabular-nums">
                          {student.class_number ?? '—'}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <PersonAvatar
                              name={student.name}
                              photoUrl={student.photo_url}
                              size="sm"
                              className="aspect-square shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-xs truncate">
                                {student.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                คงเหลือ {Number(summary?.available_points ?? 0).toLocaleString('th-TH')} แต้ม
                              </p>
                            </div>
                          </div>
                        </td>
                        {activeCategories.map((cat) => {
                          const qty = quantities[student.id]?.[cat.id] ?? 0;
                          const cell = preview?.cells[cat.id];
                          return (
                            <td key={cat.id} className="p-2 align-middle">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    disabled={qty <= 0}
                                    onClick={() => stepCellQuantity(student.id, cat.id, -1)}
                                    aria-label={`ลด ${cat.name} ของ ${student.name}`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={qty > 0 ? qty : ''}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) =>
                                      setCellQuantity(
                                        student.id,
                                        cat.id,
                                        e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                                      )
                                    }
                                    aria-label={`${student.name} ${cat.name}`}
                                    className={cn(
                                      'w-12 h-7 text-center font-bold tabular-nums px-1 text-xs',
                                      qty > 0 && 'border-emerald-400 bg-emerald-50 text-emerald-900',
                                    )}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    onClick={() => stepCellQuantity(student.id, cat.id, 1)}
                                    aria-label={`เพิ่ม ${cat.name} ของ ${student.name}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                {cell && cell.finalPoints > 0 && (
                                  <span
                                    className="text-[10px] font-bold text-emerald-700 tabular-nums"
                                    title={cell.promoLabels.join(', ')}
                                  >
                                    +{cell.finalPoints}
                                    {cell.promoLabels.length > 0 ? ' ✨' : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right tabular-nums">
                          {hasItems ? (
                            <div>
                              <span className="font-extrabold text-emerald-700 text-sm">
                                +{preview?.totalPoints ?? 0}
                                {preview?.hasPromo ? ' ✨' : ''}
                              </span>
                              <div className="text-[10px] text-muted-foreground">
                                {preview?.totalItems ?? 0} ชิ้น
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {hasItems && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => clearStudentQuantities(student.id)}
                              title="ล้างรายการของคนนี้"
                              aria-label={`ล้างรายการของ ${student.name}`}
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
          </>
        )}
      </div>

      {/* Floating Bottom Submit Bar */}
      {batchSummary.totalItems > 0 && (
        <div className="sticky bottom-3 z-20 bg-card text-foreground rounded-2xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 border border-border ring-1 ring-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                พร้อมบันทึกห้อง <span className="font-bold text-foreground">{selectedClass}</span> ({batchSummary.participationRate}%)
              </p>
              <p className="text-sm font-extrabold text-emerald-700 tabular-nums">
                {batchSummary.participatingStudents} คน · {batchSummary.totalItems.toLocaleString('th-TH')} ชิ้น · +{batchSummary.totalPoints.toLocaleString('th-TH')} แต้ม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={clearAllQuantities}
            >
              ล้างทั้งหมด
            </Button>
            <Button
              type="button"
              size="sm"
              className="font-bold text-xs"
              disabled={submitMutation.isPending}
              onClick={handleSubmitBatch}
            >
              {submitMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกยอดทั้งห้อง'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

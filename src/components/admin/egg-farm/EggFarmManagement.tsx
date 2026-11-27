import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Edit2,
  Egg,
  Loader2,
  Plus,
  Settings2,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RecorderSelect,
  EMPTY_RECORDER,
  type RecorderValue,
} from '@/components/admin/shared/RecorderSelect';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { formatThaiDateMedium, getBangkokTodayIso } from '@/lib/thaiDate';
import {
  calculateSaleSummary,
  computeEggStockSummary,
} from '@/lib/eggFarmHelpers';
import {
  eggFarmService,
  type EggCollection,
  type EggSale,
} from '@/services/egg-farm.service';
import { EggPriceDialog } from './EggPriceDialog';
import { EggReportTab } from './EggReportTab';
import { cn } from '@/lib/utils';

const collectionSchema = z
  .object({
    collected_date: z.string().min(1, 'กรุณาเลือกวันที่'),
    period: z.enum(['เช้า', 'บ่าย', 'ทั้งวัน']),
    good_eggs: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(0, 'ต้องไม่ติดลบ'),
    cracked_eggs: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(0, 'ต้องไม่ติดลบ'),
    spoiled_eggs: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(0, 'ต้องไม่ติดลบ'),
    note: z.string().optional(),
  })
  .refine((v) => v.good_eggs + v.cracked_eggs + v.spoiled_eggs > 0, {
    message: 'กรุณากรอกจำนวนไข่อย่างน้อย 1 ฟอง',
    path: ['good_eggs'],
  });

type CollectionFormValues = z.infer<typeof collectionSchema>;

const saleSchema = z.object({
  sale_date: z.string().min(1, 'กรุณาเลือกวันที่'),
  unit_type: z.enum(['ฟอง', 'แผง']),
  quantity: z.coerce.number().int('ต้องเป็นจำนวนเต็ม').min(1, 'จำนวนต้องมากกว่า 0'),
  unit_price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  buyer_name: z.string().optional(),
  payment_method: z.enum(['เงินสด', 'โอนเงิน', 'ค้างชำระ']),
  note: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const PAYMENT_BADGE: Record<string, string> = {
  เงินสด: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  โอนเงิน: 'bg-sky-50 text-sky-800 border-sky-200',
  ค้างชำระ: 'bg-amber-50 text-amber-800 border-amber-200',
};

const QUICK_GOOD_EGGS = [10, 20, 30, 60];
const QUICK_SALE_TRAYS = [1, 2, 3, 5];
const QUICK_SALE_EGGS = [5, 10, 15, 20];

export function EggFarmManagement() {
  const qc = useQueryClient();
  const todayIso = getBangkokTodayIso();

  const [activeTab, setActiveTab] = useState<'collect' | 'sell' | 'report'>('sell');
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const [editingCollection, setEditingCollection] = useState<EggCollection | null>(null);
  const [editingSale, setEditingSale] = useState<EggSale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'collection' | 'sale'; id: string; label: string } | null
  >(null);

  const { data: settings } = useQuery({
    queryKey: ['egg-settings'],
    queryFn: () => eggFarmService.getSettings(),
  });

  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ['egg-collections'],
    queryFn: () => eggFarmService.listCollections(),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['egg-sales'],
    queryFn: () => eggFarmService.listSales(),
  });

  const pricePerEgg = settings?.price_per_egg ?? 5;
  const pricePerTray = settings?.price_per_tray ?? 150;
  const eggsPerTray = settings?.eggs_per_tray ?? 30;
  const flockSize = settings?.flock_size ?? 0;

  const stock = useMemo(
    () => computeEggStockSummary(collections, sales),
    [collections, sales],
  );

  const todayStats = useMemo(() => {
    const todayCols = collections.filter((c) => c.collected_date === todayIso);
    const todayGood = todayCols.reduce((s, c) => s + (c.good_eggs || 0), 0);
    const todayTotal = todayCols.reduce(
      (s, c) => s + (c.good_eggs || 0) + (c.cracked_eggs || 0) + (c.spoiled_eggs || 0),
      0,
    );
    const todaySales = sales.filter((s) => s.sale_date === todayIso);
    const todayRevenue = todaySales.reduce((s, r) => s + (r.total_amount || 0), 0);
    const layingRate =
      flockSize > 0 ? Math.round((todayTotal / flockSize) * 1000) / 10 : null;
    return { todayGood, todayTotal, todayRevenue, layingRate };
  }, [collections, sales, todayIso, flockSize]);

  // ── Collection Form ────────────────────────────────────────────────────────
  const collectionForm = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      collected_date: todayIso,
      period: 'เช้า',
      good_eggs: 0,
      cracked_eggs: 0,
      spoiled_eggs: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (editingCollection) {
      collectionForm.reset({
        collected_date: editingCollection.collected_date,
        period: editingCollection.period,
        good_eggs: editingCollection.good_eggs,
        cracked_eggs: editingCollection.cracked_eggs,
        spoiled_eggs: editingCollection.spoiled_eggs,
        note: editingCollection.note ?? '',
      });
    }
  }, [editingCollection, collectionForm]);

  const saveCollection = useMutation({
    mutationFn: async (values: CollectionFormValues) => {
      if (!recorder.name) {
        throw new Error('กรุณาเลือกครูผู้บันทึก');
      }
      const payload = {
        collected_date: values.collected_date,
        period: values.period,
        good_eggs: values.good_eggs,
        cracked_eggs: values.cracked_eggs,
        spoiled_eggs: values.spoiled_eggs,
        note: values.note?.trim() || null,
        recorder_staff_id: recorder.staffId,
        recorder_administrator_id: recorder.administratorId,
        recorder_name: recorder.name,
      };
      if (editingCollection) {
        return eggFarmService.updateCollection(editingCollection.id, payload);
      }
      return eggFarmService.createCollection(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egg-collections'] });
      toast.success(
        editingCollection ? 'อัปเดตบันทึกเก็บไข่แล้ว' : 'บันทึกเก็บไข่เข้าเล้าแล้ว',
      );
      setEditingCollection(null);
      collectionForm.reset({
        collected_date: todayIso,
        period: 'เช้า',
        good_eggs: 0,
        cracked_eggs: 0,
        spoiled_eggs: 0,
        note: '',
      });
    },
    onError: (err: Error) => toast.error(err.message || 'บันทึกไม่สำเร็จ'),
  });

  // ── Sale Form ──────────────────────────────────────────────────────────────
  const saleForm = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_date: todayIso,
      unit_type: 'แผง',
      quantity: 1,
      unit_price: pricePerTray,
      buyer_name: '',
      payment_method: 'เงินสด',
      note: '',
    },
  });

  const watchedUnitType = saleForm.watch('unit_type');
  const watchedQuantity = saleForm.watch('quantity');
  const watchedUnitPrice = saleForm.watch('unit_price');

  useEffect(() => {
    if (!editingSale) {
      saleForm.setValue(
        'unit_price',
        watchedUnitType === 'แผง' ? pricePerTray : pricePerEgg,
      );
    }
  }, [watchedUnitType, pricePerEgg, pricePerTray, editingSale, saleForm]);

  useEffect(() => {
    if (editingSale) {
      saleForm.reset({
        sale_date: editingSale.sale_date,
        unit_type: editingSale.unit_type,
        quantity: editingSale.quantity,
        unit_price: editingSale.unit_price,
        buyer_name: editingSale.buyer_name ?? '',
        payment_method: editingSale.payment_method,
        note: editingSale.note ?? '',
      });
    }
  }, [editingSale, saleForm]);

  const liveSalePreview = useMemo(() => {
    const qty = Number(watchedQuantity) || 0;
    const price = Number(watchedUnitPrice);
    if (qty <= 0 || !Number.isFinite(price) || price < 0) {
      return { eggsCount: 0, unitPrice: 0, totalAmount: 0 };
    }
    return calculateSaleSummary({
      unitType: watchedUnitType,
      quantity: qty,
      pricePerEgg,
      pricePerTray,
      eggsPerTray,
      overrideUnitPrice: price,
    });
  }, [watchedUnitType, watchedQuantity, watchedUnitPrice, pricePerEgg, pricePerTray, eggsPerTray]);

  const stockWarning =
    !editingSale && liveSalePreview.eggsCount > Math.max(0, stock.remainingGoodEggs);

  const saveSale = useMutation({
    mutationFn: async (values: SaleFormValues) => {
      if (!recorder.name) {
        throw new Error('กรุณาเลือกครูผู้บันทึก');
      }
      const computed = calculateSaleSummary({
        unitType: values.unit_type,
        quantity: values.quantity,
        pricePerEgg,
        pricePerTray,
        eggsPerTray,
        overrideUnitPrice: values.unit_price,
      });
      const payload = {
        sale_date: values.sale_date,
        unit_type: values.unit_type,
        quantity: values.quantity,
        eggs_count: computed.eggsCount,
        unit_price: computed.unitPrice,
        total_amount: computed.totalAmount,
        buyer_name: values.buyer_name?.trim() || null,
        payment_method: values.payment_method,
        note: values.note?.trim() || null,
        recorder_staff_id: recorder.staffId,
        recorder_administrator_id: recorder.administratorId,
        recorder_name: recorder.name,
      };
      if (editingSale) {
        return eggFarmService.updateSale(editingSale.id, payload);
      }
      return eggFarmService.createSale(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egg-sales'] });
      toast.success(
        editingSale ? 'อัปเดตรายการขายไข่แล้ว' : 'บันทึกยอดขายไข่แล้ว',
      );
      setEditingSale(null);
      saleForm.reset({
        sale_date: todayIso,
        unit_type: 'แผง',
        quantity: 1,
        unit_price: pricePerTray,
        buyer_name: '',
        payment_method: 'เงินสด',
        note: '',
      });
    },
    onError: (err: Error) => toast.error(err.message || 'บันทึกการขายไม่สำเร็จ'),
  });

  const confirmDelete = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'collection') {
        await eggFarmService.deleteCollection(deleteTarget.id);
      } else {
        await eggFarmService.deleteSale(deleteTarget.id);
      }
    },
    onSuccess: () => {
      if (deleteTarget?.type === 'collection') {
        qc.invalidateQueries({ queryKey: ['egg-collections'] });
      } else {
        qc.invalidateQueries({ queryKey: ['egg-sales'] });
      }
      toast.success('ลบรายการแล้ว');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'ลบรายการไม่สำเร็จ'),
  });

  const availableGood = Math.max(0, stock.remainingGoodEggs);
  const availableTrays = Math.floor(availableGood / eggsPerTray);
  const looseEggs = availableGood % eggsPerTray;

  return (
    <div className="space-y-6">
      {/* Coop Ledger Header Strip — Focal Point */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-amber-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Egg className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                สมุดบันทึกฟาร์มไก่ไข่โรงเรียน
              </h1>
              <p className="text-sm text-muted-foreground">
                บันทึกเก็บไข่ ขายไข่ ตั้งราคา และสรุปรายงานประจำวัน
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-amber-200 bg-background px-3 py-1.5 text-xs text-foreground">
              ราคากลาง: <span className="font-semibold">ฟองละ ฿{pricePerEgg}</span> /{' '}
              <span className="font-semibold">แผงละ ฿{pricePerTray}</span> ({eggsPerTray} ฟอง)
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPriceDialogOpen(true)}
            >
              <Settings2 className="w-4 h-4 mr-1.5" />
              ตั้งราคาไข่
            </Button>
          </div>
        </div>

        {/* Unified Ledger Strip (4 columns separated by hairline rules instead of 4 generic cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">ไข่ดีคงเหลือพร้อมขาย</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={cn(
                  'text-2xl sm:text-3xl font-bold tabular-nums',
                  stock.remainingGoodEggs < 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                {stock.remainingGoodEggs.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">ฟอง</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stock.remainingGoodEggs >= 0
                ? `${availableTrays.toLocaleString()} แผง กับ ${looseEggs} ฟอง`
                : 'ยอดขายเกินสต็อกที่บันทึกไว้'}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">เก็บไข่ได้วันนี้</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {todayStats.todayTotal.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">ฟอง</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              ไข่ดี {todayStats.todayGood.toLocaleString()} ฟอง
              {todayStats.layingRate !== null ? ` (${todayStats.layingRate}% ของแม่ไก่)` : ''}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">ยอดขายวันนี้</p>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-primary">
                ฿{todayStats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ขายสะสม {stock.totalSoldEggs.toLocaleString()} ฟอง
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted-foreground">รายได้รวมทั้งหมด</p>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                ฿{stock.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {flockSize > 0
                ? `แม่ไก่ในเล้า ${flockSize.toLocaleString()} ตัว`
                : 'ยังไม่ระบุจำนวนแม่ไก่'}
            </p>
          </div>
        </div>
      </section>

      {/* Primary Workflow Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'collect' | 'sell' | 'report')}
        className="space-y-4"
      >
        <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 h-10">
          <TabsTrigger value="sell" className="gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            ขายไข่ไก่
          </TabsTrigger>
          <TabsTrigger value="collect" className="gap-1.5">
            <Egg className="w-4 h-4" />
            เก็บไข่เข้าเล้า
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            รายงาน &amp; Export
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: ขายไข่ไก่ (Action Desk + Sales Ledger) ── */}
        <TabsContent value="sell" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Action Desk */}
            <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {editingSale ? 'แก้ไขรายการขายไข่' : 'บันทึกรายการขาย'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    เลือกหน่วยและจำนวน ระบบคำนวณยอดเงินให้อัตโนมัติ
                  </p>
                </div>
                {editingSale && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSale(null);
                      saleForm.reset({
                        sale_date: todayIso,
                        unit_type: 'แผง',
                        quantity: 1,
                        unit_price: pricePerTray,
                        buyer_name: '',
                        payment_method: 'เงินสด',
                        note: '',
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" /> ยกเลิก
                  </Button>
                )}
              </div>

              <Form {...saleForm}>
                <form
                  onSubmit={saleForm.handleSubmit((v) => saveSale.mutate(v))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={saleForm.control}
                      name="sale_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วันที่ขาย</FormLabel>
                          <FormControl>
                            <ThaiDatePicker value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={saleForm.control}
                      name="unit_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หน่วยที่ขาย</FormLabel>
                          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border p-1 bg-muted/40">
                            {(['แผง', 'ฟอง'] as const).map((unit) => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => field.onChange(unit)}
                                className={cn(
                                  'py-1.5 text-sm font-medium rounded-md transition-colors',
                                  field.value === unit
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                                )}
                              >
                                {unit === 'แผง' ? `แผง (${eggsPerTray})` : 'ฟอง'}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quick-tap presets + exact input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        เลือกด่วน ({watchedUnitType})
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(watchedUnitType === 'แผง' ? QUICK_SALE_TRAYS : QUICK_SALE_EGGS).map(
                          (preset) => (
                            <Button
                              key={preset}
                              type="button"
                              variant={Number(watchedQuantity) === preset ? 'default' : 'outline'}
                              size="sm"
                              className="h-7 px-2.5 text-xs tabular-nums"
                              onClick={() =>
                                saleForm.setValue('quantity', preset, { shouldValidate: true })
                              }
                            >
                              {preset}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={saleForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จำนวน ({watchedUnitType})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                className="text-lg font-bold tabular-nums"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={saleForm.control}
                        name="unit_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ราคาต่อ{watchedUnitType} (บาท)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                className="text-lg font-bold tabular-nums"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Live receipt strip */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-900">ยอดเงินที่ต้องรับ</p>
                      <p className="text-xs text-amber-800/80 tabular-nums">
                        จำนวนรวม {liveSalePreview.eggsCount.toLocaleString()} ฟอง
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      ฿{liveSalePreview.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {stockWarning && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        ขาย {liveSalePreview.eggsCount} ฟอง มากกว่าคงเหลือในระบบ ({stock.remainingGoodEggs} ฟอง) — บันทึกต่อได้หากยังไม่ได้ลงยอดเก็บไข่ล่าสุด
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={saleForm.control}
                      name="buyer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ผู้ซื้อ</FormLabel>
                          <FormControl>
                            <Input placeholder="เช่น โรงอาหาร / ผู้ปกครอง" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={saleForm.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วิธีชำระเงิน</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="เงินสด">เงินสด</SelectItem>
                              <SelectItem value="โอนเงิน">โอนเงิน</SelectItem>
                              <SelectItem value="ค้างชำระ">ค้างชำระ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <RecorderSelect
                    value={recorder}
                    onChange={setRecorder}
                    label="ครูผู้บันทึก"
                    required
                  />

                  <FormField
                    control={saleForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>หมายเหตุ</FormLabel>
                        <FormControl>
                          <Input placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-10" disabled={saveSale.isPending}>
                    {saveSale.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 mr-2" />
                    )}
                    {editingSale ? 'อัปเดตรายการขายไข่' : 'บันทึกยอดขายไข่'}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Right Sales Ledger */}
            <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">สมุดรายการขายล่าสุด</h2>
                <span className="text-xs text-muted-foreground tabular-nums">{sales.length} รายการ</span>
              </div>
              <div className="overflow-x-auto">
                {loadingSales ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sales.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    ยังไม่มีรายการขายไข่ — เลือกจำนวนด้านซ้ายแล้วกด &ldquo;บันทึกยอดขายไข่&rdquo; ได้เลย
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                        <th className="text-left font-medium py-2.5 px-4">วันที่ / ผู้ซื้อ</th>
                        <th className="text-right font-medium py-2.5 px-2">จำนวน</th>
                        <th className="text-right font-medium py-2.5 px-2">ยอดเงิน</th>
                        <th className="text-left font-medium py-2.5 px-2">ชำระ</th>
                        <th className="text-left font-medium py-2.5 px-3">ครูผู้บันทึก</th>
                        <th className="text-right font-medium py-2.5 px-3">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 30).map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-foreground">
                              {formatThaiDateMedium(row.sale_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {row.buyer_name || 'ลูกค้าทั่วไป'}
                              {row.note ? ` · ${row.note}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums">
                            <div className="font-medium">
                              {row.quantity} {row.unit_type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {row.eggs_count} ฟอง
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-primary tabular-nums">
                            ฿{row.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-2">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', PAYMENT_BADGE[row.payment_method] ?? '')}
                            >
                              {row.payment_method}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <PersonAvatar
                                name={row.staff?.name ?? row.administrator?.name ?? row.recorder_name}
                                photoUrl={row.staff?.photo_url ?? row.administrator?.photo_url}
                                size="xs"
                              />
                              <span className="truncate max-w-[100px] text-xs">
                                {row.recorder_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingSale(row)}
                                aria-label="แก้ไขรายการขาย"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'sale',
                                    id: row.id,
                                    label: `${formatThaiDateMedium(row.sale_date)} (฿${row.total_amount})`,
                                  })
                                }
                                aria-label="ลบรายการขาย"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: เก็บไข่เข้าเล้า ── */}
        <TabsContent value="collect" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {editingCollection ? 'แก้ไขบันทึกเก็บไข่' : 'บันทึกเก็บไข่ประจำวัน'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    แยกจำนวนไข่ดี ไข่ร้าว และไข่เสียในแต่ละรอบ
                  </p>
                </div>
                {editingCollection && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCollection(null);
                      collectionForm.reset({
                        collected_date: todayIso,
                        period: 'เช้า',
                        good_eggs: 0,
                        cracked_eggs: 0,
                        spoiled_eggs: 0,
                        note: '',
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" /> ยกเลิก
                  </Button>
                )}
              </div>

              <Form {...collectionForm}>
                <form
                  onSubmit={collectionForm.handleSubmit((v) => saveCollection.mutate(v))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={collectionForm.control}
                      name="collected_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วันที่เก็บไข่</FormLabel>
                          <FormControl>
                            <ThaiDatePicker value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={collectionForm.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รอบเก็บ</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="เช้า">รอบเช้า</SelectItem>
                              <SelectItem value="บ่าย">รอบบ่าย</SelectItem>
                              <SelectItem value="ทั้งวัน">รวมทั้งวัน</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quick-tap preset buttons for good eggs */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      เติมด่วน (ไข่ดี)
                    </span>
                    <div className="flex items-center gap-1.5">
                      {QUICK_GOOD_EGGS.map((n) => (
                        <Button
                          key={n}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs tabular-nums"
                          onClick={() => {
                            const cur = Number(collectionForm.getValues('good_eggs')) || 0;
                            collectionForm.setValue('good_eggs', cur + n, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          +{n}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={collectionForm.control}
                      name="good_eggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-700">ไข่ดี (ฟอง)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="text-lg font-bold tabular-nums"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={collectionForm.control}
                      name="cracked_eggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-amber-700">ไข่ร้าว (ฟอง)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="text-lg font-bold tabular-nums"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={collectionForm.control}
                      name="spoiled_eggs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-destructive">ไข่เสีย (ฟอง)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="text-lg font-bold tabular-nums"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <RecorderSelect
                    value={recorder}
                    onChange={setRecorder}
                    label="ครูผู้บันทึก"
                    required
                  />

                  <FormField
                    control={collectionForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>หมายเหตุ</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น เปลือกบาง 2 ฟอง, ให้อาหารเสริม" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-10" disabled={saveCollection.isPending}>
                    {saveCollection.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {editingCollection ? 'อัปเดตบันทึกเก็บไข่' : 'บันทึกเก็บไข่เข้าเล้า'}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">ประวัติการเก็บไข่ล่าสุด</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {collections.length} รายการ
                </span>
              </div>
              <div className="overflow-x-auto">
                {loadingCollections ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : collections.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    ยังไม่มีบันทึกเก็บไข่ — กรอกจำนวนไข่ด้านซ้ายแล้วกด &ldquo;บันทึกเก็บไข่เข้าเล้า&rdquo; ได้เลย
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                        <th className="text-left font-medium py-2.5 px-4">วันที่ / รอบ</th>
                        <th className="text-right font-medium py-2.5 px-2">ดี</th>
                        <th className="text-right font-medium py-2.5 px-2">ร้าว</th>
                        <th className="text-right font-medium py-2.5 px-2">เสีย</th>
                        <th className="text-right font-medium py-2.5 px-2">รวม</th>
                        <th className="text-left font-medium py-2.5 px-3">ครูผู้บันทึก</th>
                        <th className="text-right font-medium py-2.5 px-3">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.slice(0, 30).map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-foreground">
                              {formatThaiDateMedium(row.collected_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              รอบ{row.period}
                              {row.note ? ` · ${row.note}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-emerald-700 tabular-nums">
                            {row.good_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-700 tabular-nums">
                            {row.cracked_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right text-destructive tabular-nums">
                            {row.spoiled_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold tabular-nums">
                            {row.total_eggs ?? row.good_eggs + row.cracked_eggs + row.spoiled_eggs}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <PersonAvatar
                                name={row.staff?.name ?? row.administrator?.name ?? row.recorder_name}
                                photoUrl={row.staff?.photo_url ?? row.administrator?.photo_url}
                                size="xs"
                              />
                              <span className="truncate max-w-[110px] text-xs">
                                {row.recorder_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingCollection(row)}
                                aria-label="แก้ไขบันทึกเก็บไข่"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'collection',
                                    id: row.id,
                                    label: `${formatThaiDateMedium(row.collected_date)} (${row.good_eggs} ฟอง)`,
                                  })
                                }
                                aria-label="ลบบันทึกเก็บไข่"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: รายงาน & Export ── */}
        <TabsContent value="report">
          <EggReportTab collections={collections} sales={sales} />
        </TabsContent>
      </Tabs>

      <EggPriceDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        settings={settings}
        recorder={recorder}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ยืนยันการลบรายการ"
        description={
          deleteTarget
            ? `ต้องการลบรายการ "${deleteTarget.label}" ใช่หรือไม่?`
            : undefined
        }
        confirmText="ลบรายการ"
        onConfirm={() => confirmDelete.mutate()}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Coins,
  Edit2,
  Egg,
  Loader2,
  PackageCheck,
  Plus,
  Settings2,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  เงินสด: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  โอนเงิน: 'bg-sky-100 text-sky-800 border-sky-200',
  ค้างชำระ: 'bg-amber-100 text-amber-800 border-amber-200',
};

export function EggFarmManagement() {
  const qc = useQueryClient();
  const todayIso = getBangkokTodayIso();

  const [activeTab, setActiveTab] = useState<'collect' | 'sell' | 'report'>('collect');
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
        throw new Error('กรุณาเลือกผู้บันทึก (ครู/ผู้บริหาร)');
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
        editingCollection ? 'แก้ไขบันทึกการเก็บไข่แล้ว' : 'บันทึกการเก็บไข่เรียบร้อย',
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
        throw new Error('กรุณาเลือกผู้บันทึก (ครู/ผู้บริหาร)');
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
        editingSale ? 'แก้ไขรายการขายไข่แล้ว' : 'บันทึกการขายไข่เรียบร้อย',
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
      toast.success('ลบรายการเรียบร้อย');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'ลบรายการไม่สำเร็จ'),
  });

  const availableTraysApprox = Math.floor(Math.max(0, stock.remainingGoodEggs) / eggsPerTray);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Egg className="w-6 h-6 text-primary" />
            ระบบฟาร์มไก่ไข่โรงเรียน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            บันทึกการเก็บไข่ประจำวัน บันทึกการขาย ตั้งราคาไข่ และรายงานสรุปผลรายวัน/รายสัปดาห์/รายเดือน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 text-xs bg-card border-border">
            ราคาปัจจุบัน: ฟองละ ฿{pricePerEgg} · แผงละ ฿{pricePerTray} ({eggsPerTray} ฟอง)
          </Badge>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">เก็บไข่ได้วันนี้</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {todayStats.todayTotal.toLocaleString()} <span className="text-sm font-normal">ฟอง</span>
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                ไข่ดี {todayStats.todayGood.toLocaleString()} ฟอง
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Egg className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">ไข่ดีคงเหลือพร้อมขาย</p>
              <p
                className={cn(
                  'text-2xl font-bold mt-1',
                  stock.remainingGoodEggs < 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                {stock.remainingGoodEggs.toLocaleString()} <span className="text-sm font-normal">ฟอง</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ประมาณ {availableTraysApprox.toLocaleString()} แผง (สะสม {stock.totalGood.toLocaleString()} ฟอง)
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">ยอดขายสะสม</p>
              <p className="text-2xl font-bold text-primary mt-1">
                ฿{stock.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ขายแล้ว {stock.totalSoldEggs.toLocaleString()} ฟอง (วันนี้ ฿{todayStats.todayRevenue.toLocaleString()})
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">อัตราการวางไข่วันนี้</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {todayStats.layingRate !== null ? `${todayStats.layingRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {flockSize > 0
                  ? `แม่ไก่ ${flockSize.toLocaleString()} ตัว`
                  : 'กด "ตั้งราคาไข่" เพื่อระบุจำนวนแม่ไก่'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'collect' | 'sell' | 'report')}
        className="space-y-4"
      >
        <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3">
          <TabsTrigger value="collect" className="gap-1.5">
            <Egg className="w-4 h-4" />
            บันทึกเก็บไข่
          </TabsTrigger>
          <TabsTrigger value="sell" className="gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            บันทึกขายไข่
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            รายงาน &amp; Export
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: บันทึกเก็บไข่ ── */}
        <TabsContent value="collect" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-5 bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {editingCollection ? 'แก้ไขบันทึกเก็บไข่' : 'บันทึกการเก็บไข่'}
                </CardTitle>
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
                    <X className="w-4 h-4 mr-1" /> ยกเลิกแก้ไข
                  </Button>
                )}
              </CardHeader>
              <CardContent>
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
                            <FormLabel>ช่วงเวลา</FormLabel>
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

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={collectionForm.control}
                        name="good_eggs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-emerald-700">ไข่ดี (ฟอง)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" className="text-lg font-semibold" {...field} />
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
                              <Input type="number" min="0" step="1" className="text-lg font-semibold" {...field} />
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
                              <Input type="number" min="0" step="1" className="text-lg font-semibold" {...field} />
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
                          <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                          <FormControl>
                            <Input placeholder="เช่น เปลือกบาง 2 ฟอง, ให้อาหารเสริม" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={saveCollection.isPending}>
                      {saveCollection.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {editingCollection ? 'อัปเดตบันทึกเก็บไข่' : 'บันทึกการเก็บไข่'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">ประวัติการเก็บไข่ล่าสุด</CardTitle>
                <span className="text-xs text-muted-foreground">{collections.length} รายการ</span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {loadingCollections ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : collections.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ยังไม่มีรายการเก็บไข่ เริ่มบันทึกได้จากฟอร์มด้านซ้าย
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/40 text-muted-foreground">
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
                        <tr key={row.id} className="border-b border-border hover:bg-muted/20">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-foreground">
                              {formatThaiDateMedium(row.collected_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              รอบ{row.period}
                              {row.note ? ` · ${row.note}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-emerald-700">
                            {row.good_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right text-amber-700">
                            {row.cracked_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right text-destructive">
                            {row.spoiled_eggs}
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold">
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
                                aria-label="แก้ไข"
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
                                aria-label="ลบ"
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 2: บันทึกขายไข่ ── */}
        <TabsContent value="sell" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-5 bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {editingSale ? 'แก้ไขรายการขายไข่' : 'บันทึกรายการขายไข่'}
                </CardTitle>
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
                    <X className="w-4 h-4 mr-1" /> ยกเลิกแก้ไข
                  </Button>
                )}
              </CardHeader>
              <CardContent>
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
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="แผง">แผง ({eggsPerTray} ฟอง)</SelectItem>
                                <SelectItem value="ฟอง">ฟอง</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={saleForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จำนวน ({watchedUnitType})</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="1" className="text-lg font-semibold" {...field} />
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
                              <Input type="number" min="0" step="0.5" className="text-lg font-semibold" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">ยอดขายรวมอัตโนมัติ</p>
                        <p className="text-xs text-muted-foreground">
                          คิดเป็น {liveSalePreview.eggsCount.toLocaleString()} ฟอง
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        ฿{liveSalePreview.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {stockWarning && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          จำนวนที่ขาย ({liveSalePreview.eggsCount} ฟอง) มากกว่าไข่ดีคงเหลือปัจจุบัน ({stock.remainingGoodEggs} ฟอง) — สามารถบันทึกได้ หากยังไม่ได้ลงบันทึกเก็บไข่รอบล่าสุด
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={saleForm.control}
                        name="buyer_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ผู้ซื้อ (ถ้ามี)</FormLabel>
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
                          <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                          <FormControl>
                            <Input placeholder="รายละเอียดเพิ่มเติม" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={saveSale.isPending}>
                      {saveSale.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 mr-2" />
                      )}
                      {editingSale ? 'อัปเดตรายการขาย' : 'บันทึกรายการขาย'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">รายการขายไข่ล่าสุด</CardTitle>
                <span className="text-xs text-muted-foreground">{sales.length} รายการ</span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {loadingSales ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sales.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ยังไม่มีรายการขายไข่ เริ่มบันทึกได้จากฟอร์มด้านซ้าย
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/40 text-muted-foreground">
                        <th className="text-left font-medium py-2.5 px-4">วันที่ / ผู้ซื้อ</th>
                        <th className="text-right font-medium py-2.5 px-2">จำนวน</th>
                        <th className="text-right font-medium py-2.5 px-2">ยอดขาย</th>
                        <th className="text-left font-medium py-2.5 px-2">ชำระ</th>
                        <th className="text-left font-medium py-2.5 px-3">ครูผู้บันทึก</th>
                        <th className="text-right font-medium py-2.5 px-3">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 30).map((row) => (
                        <tr key={row.id} className="border-b border-border hover:bg-muted/20">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-foreground">
                              {formatThaiDateMedium(row.sale_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {row.buyer_name || 'ไม่ระบุผู้ซื้อ'}
                              {row.note ? ` · ${row.note}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <div className="font-medium">
                              {row.quantity} {row.unit_type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({row.eggs_count} ฟอง)
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-primary">
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
                                aria-label="แก้ไข"
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
                                aria-label="ลบ"
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 3: รายงาน & Export ── */}
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

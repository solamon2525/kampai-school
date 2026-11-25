import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Flame,
  Clock,
  Calendar,
  Gift,
  RotateCcw,
  Zap,
  Tag,
} from 'lucide-react';
import {
  wasteCategoriesService,
  wastePromotionsService,
  wasteLuckySpinsService,
  type WasteCategory,
  type WastePromotion,
  type WasteLuckySpin,
} from '@/services/waste-bank.service';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { formatThaiDateFull, formatThaiDateShort } from '@/lib/thaiDate';
import { hasPromotionTargetScope } from '@/lib/wasteBankHelpers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WEEKDAYS: ReadonlyArray<{ value: number; short: string; label: string }> = [
  { value: 0, short: 'อา.', label: 'อาทิตย์' },
  { value: 1, short: 'จ.', label: 'จันทร์' },
  { value: 2, short: 'อ.', label: 'อังคาร' },
  { value: 3, short: 'พ.', label: 'พุธ' },
  { value: 4, short: 'พฤ.', label: 'พฤหัสบดี' },
  { value: 5, short: 'ศ.', label: 'ศุกร์' },
  { value: 6, short: 'ส.', label: 'เสาร์' },
];

const promotionSchema = z
  .object({
    title: z.string().trim().min(1, 'กรุณาระบุชื่อโปรโมชั่น'),
    description: z.string(),
    banner_type: z.string().min(1, 'กรุณาเลือกรูปแบบแบนเนอร์'),
    multiplier: z.string(),
    bonus_points: z.string(),
    badge_text: z.string(),
    category_ids: z.array(z.string()),
    days_of_week: z.array(z.number().int().min(0).max(6)),
    start_date: z.string(),
    end_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const multRaw = values.multiplier.trim();
    const mult = multRaw === '' ? 1 : Number(multRaw);
    if (!Number.isFinite(mult) || mult < 1 || mult > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['multiplier'],
        message: 'ตัวคูณแต้มต้องอยู่ระหว่าง 1 ถึง 10',
      });
    }

    const bonusRaw = values.bonus_points.trim();
    const bonus = bonusRaw === '' ? 0 : Number(bonusRaw);
    if (!Number.isInteger(bonus) || bonus < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bonus_points'],
        message: 'แต้มโบนัสต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป',
      });
    }

    if (values.start_date && values.end_date && values.start_date > values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม',
      });
    }

    if (values.end_time && !values.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_time'],
        message: 'กรุณาระบุเวลาเริ่มเมื่อกำหนดเวลาสิ้นสุด',
      });
    }

    if (values.start_time && values.end_time && values.start_time > values.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่ม',
      });
    }

    const isBoosted = mult > 1 || bonus > 0;
    if (values.is_active && isBoosted) {
      const hasScope = hasPromotionTargetScope({
        category_ids: values.category_ids.length > 0 ? values.category_ids : null,
        days_of_week: values.days_of_week.length > 0 ? values.days_of_week : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        start_time: values.start_time || null,
      });
      if (!hasScope) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category_ids'],
          message:
            'แคมเปญที่เปิดใช้งานและมีตัวคูณ/โบนัส ต้องกำหนดเป้าหมายอย่างน้อย 1 เงื่อนไข (ประเภทขยะ, วันในสัปดาห์, ช่วงวันที่ หรือเวลาเริ่ม)',
        });
      }
    }
  });

type PromotionFormValues = z.infer<typeof promotionSchema>;

const EMPTY_PROMOTION: PromotionFormValues = {
  title: '',
  description: '',
  banner_type: 'green_friday',
  multiplier: '2.0',
  bonus_points: '0',
  badge_text: '🔥 แต้ม x2',
  category_ids: [],
  days_of_week: [5],
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  is_active: true,
};

function formatDaysOfWeek(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.every((d, idx) => d === idx + 1)) {
    return 'จันทร์–ศุกร์';
  }
  return sorted
    .map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? String(d))
    .join(', ');
}

export const PromotionsManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'spins'>('campaigns');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<WastePromotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WastePromotion | null>(null);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: EMPTY_PROMOTION,
  });

  const { data: promotions = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['waste-promotions'],
    queryFn: async () => {
      const { data, error } = await wastePromotionsService.getAll();
      if (error) throw error;
      return (data ?? []) as WastePromotion[];
    },
  });

  const { data: spins = [] } = useQuery({
    queryKey: ['waste-lucky-spins'],
    queryFn: async () => {
      const { data, error } = await wasteLuckySpinsService.getRecent(40);
      if (error) throw error;
      return (data ?? []) as WasteLuckySpin[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['waste-categories', 'active'],
    queryFn: async () => {
      const { data, error } = await wasteCategoriesService.getActive();
      if (error) throw error;
      return (data ?? []) as WasteCategory[];
    },
  });

  const categoryNameById = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories],
  );

  const invalidatePromotionQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['waste-promotions'] });
    void queryClient.invalidateQueries({ queryKey: ['waste-promotions', 'active'] });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await wastePromotionsService.toggleActive(id, next);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      invalidatePromotionQueries();
      toast({ title: next ? 'เปิดใช้งานแคมเปญแล้ว' : 'ปิดใช้งานแคมเปญแล้ว' });
    },
    onError: (err: Error) => {
      toast({ title: 'ไม่สามารถเปลี่ยนสถานะได้', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await wastePromotionsService.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePromotionQueries();
      setDeleteTarget(null);
      toast({ title: 'ลบโปรโมชั่นเรียบร้อยแล้ว' });
    },
    onError: (err: Error) => {
      toast({ title: 'ลบไม่สำเร็จ', description: err.message, variant: 'destructive' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PromotionFormValues) => {
      const mult = values.multiplier.trim() === '' ? 1.0 : parseFloat(values.multiplier);
      const bonus = values.bonus_points.trim() === '' ? 0 : parseInt(values.bonus_points, 10);

      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        banner_type: values.banner_type,
        multiplier: mult,
        bonus_points: bonus,
        badge_text: values.badge_text.trim() || null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        is_active: values.is_active,
        category_ids: values.category_ids.length > 0 ? values.category_ids : null,
        days_of_week:
          values.days_of_week.length > 0 ? [...values.days_of_week].sort((a, b) => a - b) : null,
        order_position: editingPromo ? editingPromo.order_position : promotions.length + 1,
      };

      if (editingPromo) {
        const { error } = await wastePromotionsService.update(editingPromo.id, payload);
        if (error) throw error;
        return true;
      }
      const { error } = await wastePromotionsService.insert(payload);
      if (error) throw error;
      return false;
    },
    onSuccess: (wasEditing) => {
      invalidatePromotionQueries();
      setIsDialogOpen(false);
      toast({ title: wasEditing ? 'แก้ไขโปรโมชั่นเรียบร้อยแล้ว' : 'สร้างโปรโมชั่นใหม่สำเร็จ' });
    },
    onError: (err: Error) => {
      toast({
        title: editingPromo ? 'บันทึกไม่สำเร็จ' : 'สร้างไม่สำเร็จ',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await wastePromotionsService.seedDefaultCampaigns();
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePromotionQueries();
      setSeedConfirmOpen(false);
      toast({ title: 'เพิ่มแคมเปญมาตรฐานเรียบร้อยแล้ว' });
    },
    onError: (err: Error) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    },
  });

  const handleOpenAdd = () => {
    setEditingPromo(null);
    form.reset(EMPTY_PROMOTION);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: WastePromotion) => {
    setEditingPromo(promo);
    form.reset({
      title: promo.title,
      description: promo.description || '',
      banner_type: promo.banner_type,
      multiplier: String(promo.multiplier),
      bonus_points: String(promo.bonus_points),
      badge_text: promo.badge_text || '',
      category_ids: promo.category_ids ?? [],
      days_of_week: promo.days_of_week ?? [],
      start_date: promo.start_date || '',
      end_date: promo.end_date || '',
      start_time: promo.start_time ? promo.start_time.slice(0, 5) : '',
      end_time: promo.end_time ? promo.end_time.slice(0, 5) : '',
      is_active: promo.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = (promo: WastePromotion) => {
    const next = !promo.is_active;
    const isBoosted = (Number(promo.multiplier) || 1) > 1 || (Number(promo.bonus_points) || 0) > 0;
    if (next && isBoosted && !hasPromotionTargetScope(promo)) {
      toast({
        title: 'กรุณาตั้งค่าเงื่อนไขก่อนเปิดใช้งาน',
        description: 'แคมเปญที่มีตัวคูณหรือโบนัสต้องเลือกประเภทขยะ วัน ช่วงวันที่ หรือเวลาอย่างน้อย 1 อย่าง',
        variant: 'destructive',
      });
      return;
    }
    toggleMutation.mutate({ id: promo.id, next });
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={activeSubTab === 'campaigns' ? 'default' : 'outline'}
            className={cn(
              'h-9 text-xs font-semibold rounded-xl',
              activeSubTab === 'campaigns'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
            onClick={() => setActiveSubTab('campaigns')}
          >
            <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            <span>จัดการโปรโมชั่น &amp; แคมเปญ ({promotions.length})</span>
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === 'spins' ? 'default' : 'outline'}
            className={cn(
              'h-9 text-xs font-semibold rounded-xl',
              activeSubTab === 'spins'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
            onClick={() => setActiveSubTab('spins')}
          >
            <Gift className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            <span>ประวัติหมุนวงล้อเสี่ยงโชค ({spins.length})</span>
          </Button>
        </div>

        {activeSubTab === 'campaigns' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSeedConfirmOpen(true)}
              className="h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>แคมเปญมาตรฐาน</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>สร้างโปรโมชั่นใหม่</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tab 1: Campaigns List */}
      {activeSubTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingPromos && promotions.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
              กำลังโหลดข้อมูลแคมเปญ...
            </div>
          ) : (
            promotions.map((promo) => (
              <Card
                key={promo.id}
                className={cn(
                  'border transition-all bg-card text-foreground',
                  promo.is_active ? 'border-primary/40 shadow-sm' : 'border-border opacity-70',
                )}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          className={cn(
                            'text-xs px-2 py-0.5 font-bold border-none',
                            promo.multiplier > 1
                              ? 'bg-amber-600 text-primary-foreground'
                              : 'bg-primary text-primary-foreground',
                          )}
                        >
                          {promo.badge_text ||
                            (promo.multiplier > 1
                              ? `แต้ม x${promo.multiplier}`
                              : `โบนัส +${promo.bonus_points}`)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[11px] text-muted-foreground border-border"
                        >
                          {promo.banner_type === 'green_friday'
                            ? 'วันศุกร์สีเขียว'
                            : promo.banner_type === 'happy_hour'
                              ? 'แฮปปี้อาวร์'
                              : promo.banner_type === 'target_item'
                                ? 'ไอเทมเฉพาะกิจ'
                                : promo.banner_type === 'home_quest'
                                  ? 'ภารกิจบ้าน'
                                  : promo.banner_type === 'flash_sale'
                                    ? 'แฟลชเซลล์'
                                    : 'ทั่วไป'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promo.is_active}
                          disabled={toggleMutation.isPending}
                          onCheckedChange={() => handleToggleActive(promo)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-foreground">{promo.title}</h4>
                      {promo.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {promo.description}
                        </p>
                      )}
                    </div>

                    {/* Conditions Details */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                      {promo.category_ids && promo.category_ids.length > 0 && (
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-primary/70 shrink-0" />
                          <span>
                            {promo.category_ids
                              .map((id) => categoryNameById.get(id) ?? 'ประเภทขยะเฉพาะ')
                              .join(', ')}
                          </span>
                        </span>
                      )}
                      {promo.days_of_week && promo.days_of_week.length > 0 && (
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                          <span>ทุกวัน{formatDaysOfWeek(promo.days_of_week)}</span>
                        </span>
                      )}
                      {(promo.start_date || promo.end_date) && (
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                          <span>
                            {promo.start_date ? formatThaiDateShort(promo.start_date) : 'ไม่กำหนด'}
                            {' – '}
                            {promo.end_date ? formatThaiDateShort(promo.end_date) : 'ไม่กำหนด'}
                          </span>
                        </span>
                      )}
                      {promo.start_time && (
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-primary/70 shrink-0" />
                          <span>
                            {promo.start_time.slice(0, 5)}
                            {promo.end_time ? ` - ${promo.end_time.slice(0, 5)}` : ''} น.
                          </span>
                        </span>
                      )}
                      {promo.multiplier > 1 && (
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                          <Zap className="w-3 h-3 text-amber-500" />
                          ตัวคูณ x{promo.multiplier}
                        </span>
                      )}
                      {promo.bonus_points > 0 && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          โบนัส +{promo.bonus_points} แต้ม
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(promo)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      <span>แก้ไข</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(promo)}
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>ลบ</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Lucky Spins History */}
      {activeSubTab === 'spins' && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <span>ประวัติการหมุนวงล้อเสี่ยงโชค (ล่าสุด {spins.length} รายการ)</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              บันทึกรางวัลที่นักเรียนได้รับจากการส่งขยะครบ 20 ชิ้น
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {spins.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                ยังไม่มีประวัติการหมุนวงล้อเสี่ยงโชค
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {spins.map((spin) => (
                  <div
                    key={spin.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonAvatar
                        name={spin.student_name}
                        photoUrl={null}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground flex flex-wrap items-center gap-2">
                          <span className="truncate">{spin.student_name}</span>
                          {spin.student_class && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 text-muted-foreground"
                            >
                              {spin.student_class}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatThaiDateFull(spin.spun_at.slice(0, 10))} · เวลา{' '}
                          {new Date(spin.spun_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          น.
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">{spin.spin_result}</div>
                      {spin.bonus_points_awarded > 0 && (
                        <div className="text-xs text-amber-600 font-semibold">
                          +{spin.bonus_points_awarded} แต้มสะสม
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Promotion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPromo ? 'แก้ไขแคมเปญโปรโมชั่น' : 'สร้างแคมเปญโปรโมชั่นใหม่'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              กำหนดกติกา ตัวคูณแต้ม โบนัสพิเศษ และขอบเขตเงื่อนไขของแคมเปญ
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-4 py-2"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">ชื่อโปรโมชั่น *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น วันศุกร์สีเขียว (Green Friday)"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">คำอธิบายกติกา</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น ส่งขยะทุกประเภท รับแต้มสะสมเพิ่ม 2 เท่า"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="banner_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">รูปแบบแบนเนอร์</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="green_friday">
                            วันศุกร์สีเขียว (Green Friday)
                          </SelectItem>
                          <SelectItem value="happy_hour">
                            แฮปปี้อาวร์ (Lunch Break)
                          </SelectItem>
                          <SelectItem value="target_item">สัปดาห์ไอเทมเฉพาะกิจ</SelectItem>
                          <SelectItem value="home_quest">ภารกิจบ้านสู่โรงเรียน</SelectItem>
                          <SelectItem value="flash_sale">แฟลชเซลล์ลดแต้ม</SelectItem>
                          <SelectItem value="custom">กำหนดเอง (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="badge_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">ข้อความ Badge</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น 🔥 แต้ม x2"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="multiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        ตัวคูณแต้ม (Multiplier)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          placeholder="1.0 - 10.0"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonus_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        แต้มโบนัสบวกเพิ่ม (Bonus Points)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0, 5, 10"
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Target Scope Section */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                <FormField
                  control={form.control}
                  name="category_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        ประเภทขยะที่ร่วมรายการ (ไม่เลือก = ใช้ได้ทุกประเภทเมื่อมีเงื่อนไขเวลา/วัน)
                      </FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {categories.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            ไม่พบประเภทขยะที่เปิดใช้งาน
                          </p>
                        ) : (
                          categories.map((cat) => {
                            const checked = field.value.includes(cat.id);
                            return (
                              <label
                                key={cat.id}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs cursor-pointer transition-colors',
                                  checked
                                    ? 'border-primary bg-primary/10 text-foreground font-semibold'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    const next = isChecked
                                      ? [...field.value, cat.id]
                                      : field.value.filter((id) => id !== cat.id);
                                    field.onChange(next);
                                  }}
                                />
                                <span className="shrink-0">{cat.icon || '♻️'}</span>
                                <span className="truncate">{cat.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="days_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        วันในสัปดาห์ (ถ้ามี)
                      </FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAYS.map((day) => {
                          const selected = field.value.includes(day.value);
                          return (
                            <Button
                              key={day.value}
                              type="button"
                              size="sm"
                              variant={selected ? 'default' : 'outline'}
                              aria-pressed={selected}
                              onClick={() => {
                                const next = selected
                                  ? field.value.filter((v) => v !== day.value)
                                  : [...field.value, day.value];
                                field.onChange(next);
                                if (form.formState.errors.category_ids) {
                                  form.clearErrors('category_ids');
                                }
                              }}
                              className="h-8 px-2.5 text-xs"
                            >
                              {day.short}
                            </Button>
                          );
                        })}
                      </div>
                      <FormDescription className="text-[11px]">
                        หากเปิดใช้งานแคมเปญที่มีตัวคูณหรือโบนัส ต้องระบุอย่างน้อย 1 เงื่อนไขด้านบนหรือด้านล่าง
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          วันที่เริ่ม (ถ้ามี)
                        </FormLabel>
                        <FormControl>
                          <ThaiDatePicker
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              if (form.formState.errors.category_ids) {
                                form.clearErrors('category_ids');
                              }
                            }}
                            placeholder="ไม่จำกัดวันเริ่ม"
                            dateFormat="short"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          วันที่สิ้นสุด (ถ้ามี)
                        </FormLabel>
                        <FormControl>
                          <ThaiDatePicker
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              if (form.formState.errors.category_ids) {
                                form.clearErrors('category_ids');
                              }
                            }}
                            placeholder="ไม่จำกัดวันสิ้นสุด"
                            dateFormat="short"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          เวลาเริ่ม (ถ้ามี)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="h-9 text-sm"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (form.formState.errors.category_ids) {
                                form.clearErrors('category_ids');
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          เวลาสิ้นสุด (ถ้ามี)
                        </FormLabel>
                        <FormControl>
                          <Input type="time" className="h-9 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-semibold">เปิดใช้งานทันที</FormLabel>
                      <FormDescription className="text-[11px]">
                        ปิดไว้ชั่วคราวได้หากต้องการเตรียมแคมเปญล่วงหน้า
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-9 text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-9 text-xs bg-primary text-primary-foreground"
                >
                  {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกแคมเปญ'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="ลบโปรโมชั่นนี้ใช่หรือไม่?"
        description={
          deleteTarget
            ? `ต้องการลบแคมเปญ "${deleteTarget.title}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
            : undefined
        }
        confirmText="ลบโปรโมชั่น"
        variant="destructive"
      />

      {/* Seed Default Campaigns Confirmation Dialog */}
      <ConfirmDialog
        open={seedConfirmOpen}
        onOpenChange={setSeedConfirmOpen}
        onConfirm={() => seedMutation.mutate()}
        title="เพิ่มชุดแคมเปญมาตรฐาน?"
        description="ต้องการเพิ่มชุดแคมเปญมาตรฐาน 4 แคมเปญ (วันศุกร์สีเขียว x2, พักเที่ยงโบนัส +5, สัปดาห์กล่องนม x3, ภารกิจบ้านสู่โรงเรียน)?"
        confirmText="เพิ่มแคมเปญ"
        variant="default"
      />
    </div>
  );
};

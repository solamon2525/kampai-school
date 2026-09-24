import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ImagePlus, Gift, Globe2, User, Pencil, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { rewardsService } from '@/services/waste-bank.service';
import type { Reward } from '@/services/waste-bank.service';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RewardCostDisplay } from '@/components/rewards/RewardCostDisplay';

const rewardSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อรางวัล'),
  description: z.string(),
  image_url: z.string(),
  payment_type: z.enum(['waste', 'virtue', 'mixed']),
  waste_points_cost: z.string(),
  virtue_points_cost: z.string(),
  stock: z.string(),
  is_active: z.boolean(),
  category: z.string(),
  is_central: z.boolean(),
}).superRefine((values, ctx) => {
  const waste = Number(values.waste_points_cost || 0);
  const virtue = Number(values.virtue_points_cost || 0);
  if (!Number.isInteger(waste) || waste < 0 || !Number.isInteger(virtue) || virtue < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['waste_points_cost'], message: 'คะแนนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป' });
  }
  if (values.payment_type === 'waste' && waste <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['waste_points_cost'], message: 'กรุณากำหนดแต้มขยะ' });
  if (values.payment_type === 'virtue' && virtue <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['virtue_points_cost'], message: 'กรุณากำหนดคะแนนความดี' });
  if (values.payment_type === 'mixed' && (waste <= 0 || virtue <= 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['virtue_points_cost'], message: 'แบบผสมต้องกำหนดคะแนนทั้งสองประเภท' });
});

type RewardFormValues = z.infer<typeof rewardSchema>;
const EMPTY_REWARD: RewardFormValues = {
  name: '', description: '', image_url: '', payment_type: 'waste', waste_points_cost: '',
  virtue_points_cost: '', stock: '', is_active: true, category: '', is_central: false,
};

export const RewardsManagement = () => {
  const { toast } = useToast();
  const { isAdmin, staffId, administratorId } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: EMPTY_REWARD,
  });
  const paymentType = form.watch('payment_type');
  const imageUrl = form.watch('image_url');

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, staffId, administratorId]);

  const fetchAll = async () => {
    const { data, error } = await rewardsService.getMineAndCentral({
      isAdmin,
      staffId,
      administratorId,
    });
    if (!error && data) setRewards(data as Reward[]);
  };

  const isMine = (r: Reward) =>
    (!!staffId && r.owner_staff_id === staffId) ||
    (!!administratorId && r.owner_administrator_id === administratorId);
  const isCentral = (r: Reward) => !r.owner_staff_id && !r.owner_administrator_id;
  const canEdit = (r: Reward) => isAdmin || isMine(r);

  const { data: stockReport } = useQuery({
    queryKey: ['rewards-stock-drift'],
    enabled: isAdmin,
    queryFn: () => rewardsService.stockDriftReport(),
  });
  const flaggedStock = (stockReport ?? []).filter((r) => r.flagged);
  const lowStock = (stockReport ?? []).filter((r) => r.stock !== null && r.stock <= 3);

  const openAdd = () => {
    setEditing(null);
    form.reset(EMPTY_REWARD);
    setShowForm(true);
  };

  const openEdit = (r: Reward) => {
    if (!canEdit(r)) {
      toast({ title: 'ไม่มีสิทธิ์แก้รางวัลนี้', description: 'รางวัลนี้เป็นของครูคนอื่น', variant: 'destructive' });
      return;
    }
    setEditing(r);
    form.reset({
      name: r.name,
      description: r.description ?? '',
      image_url: r.image_url ?? '',
      payment_type: r.waste_points_cost > 0 && r.virtue_points_cost > 0 ? 'mixed' : r.virtue_points_cost > 0 ? 'virtue' : 'waste',
      waste_points_cost: r.waste_points_cost > 0 ? String(r.waste_points_cost) : '',
      virtue_points_cost: r.virtue_points_cost > 0 ? String(r.virtue_points_cost) : '',
      stock: r.stock !== null && r.stock !== undefined ? String(r.stock) : '',
      is_active: r.is_active ?? true,
      category: r.category ?? '',
      is_central: isCentral(r),
    });
    setShowForm(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await rewardsService.uploadImage(file);
      form.setValue('image_url', url, { shouldDirty: true });
      toast({ title: 'อัพโหลดรูปสำเร็จ' });
    } catch (err) {
      toast({ title: 'อัพโหลดไม่สำเร็จ', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (values: RewardFormValues) => {
    const wasteCost = values.payment_type === 'virtue' ? 0 : Number(values.waste_points_cost || 0);
    const virtueCost = values.payment_type === 'waste' ? 0 : Number(values.virtue_points_cost || 0);
    const stock = values.stock === '' ? null : parseInt(values.stock, 10);
    if (stock !== null && (isNaN(stock) || stock < 0)) {
      toast({ title: 'จำนวนคงเหลือไม่ถูกต้อง', variant: 'destructive' });
      return;
    }

    // ownership: anyone (teachers and admins) can toggle central
    const willBeCentral = values.is_central;
    const owner_staff_id = willBeCentral ? null : (staffId ?? null);
    const owner_administrator_id = willBeCentral ? null : (staffId ? null : administratorId);

    setSaving(true);
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      image_url: values.image_url || null,
      points_cost: wasteCost + virtueCost,
      waste_points_cost: wasteCost,
      virtue_points_cost: virtueCost,
      stock,
      is_active: values.is_active,
      order_position: editing?.order_position ?? 99,
      category: values.category.trim() || null,
    };

    const { error } = editing
      ? await rewardsService.update(editing.id, {
          ...payload,
          owner_staff_id,
          owner_administrator_id,
        })
      : await rewardsService.insert({ ...payload, owner_staff_id, owner_administrator_id });
    setSaving(false);

    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มรางวัลสำเร็จ' });
      setShowForm(false);
      fetchAll();
    }
  };

  const handleDelete = async (r: Reward) => {
    if (!canEdit(r)) return;
    if (!confirm(`ต้องการลบรางวัล "${r.name}"?`)) return;
    const { error } = await rewardsService.delete(r.id);
    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบสำเร็จ' });
      fetchAll();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Gift className="w-4 h-4" /> รางวัลที่นักเรียนสามารถแลกได้
          {!isAdmin && (
            <span className="text-xs text-muted-foreground/80">— เห็นเฉพาะของฉัน + รางวัลกลาง</span>
          )}
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> เพิ่มรางวัล
        </Button>
      </div>

      {isAdmin && (flaggedStock.length > 0 || lowStock.length > 0) && (
        <Card className={cn(flaggedStock.length > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5')}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              สต็อกรางวัล
              {flaggedStock.length > 0
                ? ` · ${flaggedStock.length} รายการผิดปกติ (หมดหรือ pending > stock)`
                : ` · ${lowStock.length} รายการใกล้หมด (≤3)`}
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {(flaggedStock.length > 0 ? flaggedStock : lowStock).slice(0, 8).map((r) => (
                <li key={r.id}>
                  {r.name}: คงเหลือ {r.stock} · รออนุมัติ {r.pendingQty}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">{editing ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>ชื่อรางวัล</FormLabel><FormControl><Input placeholder="เช่น สมุดโน้ต, ขนมปัง, ปากกา" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="payment_type" render={({ field }) => (
                    <FormItem><FormLabel>ประเภทคะแนนที่ใช้</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="waste">แต้มธนาคารขยะล้วน</SelectItem><SelectItem value="virtue">คะแนนความดีล้วน</SelectItem><SelectItem value="mixed">ใช้ทั้งสองส่วนผสมกัน</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  {paymentType !== 'virtue' ? (
                    <FormField control={form.control} name="waste_points_cost" render={({ field }) => (
                      <FormItem><FormLabel>แต้มธนาคารขยะต่อชิ้น</FormLabel><FormControl><Input type="number" min="1" step="1" inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  ) : null}
                  {paymentType !== 'waste' ? (
                    <FormField control={form.control} name="virtue_points_cost" render={({ field }) => (
                      <FormItem><FormLabel>คะแนนความดีต่อชิ้น</FormLabel><FormControl><Input type="number" min="1" step="1" inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  ) : null}
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>จำนวนคงเหลือ (ว่าง = ไม่จำกัด)</FormLabel><FormControl><Input type="number" min="0" step="1" inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem><FormLabel>สถานะ</FormLabel><div className="flex h-10 items-center gap-2"><input id="is_active" type="checkbox" checked={field.value} onChange={field.onChange} /><label htmlFor="is_active" className="text-sm">เปิดให้แลก</label></div></FormItem>
                  )} />
              {(isAdmin || staffId || administratorId) && (
                <div className="space-y-1 md:col-span-2">
                  <Label>เจ้าของรางวัล</Label>
                  <div className="flex items-center gap-2 h-10">
                    <input type="checkbox" id="is_central" {...form.register('is_central')} className="w-4 h-4" />
                    <label htmlFor="is_central" className="text-sm flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5" />
                      เป็นรางวัลกลาง — ครูทุกคนอนุมัติได้
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ไม่ติ๊ก = เป็นของฉันเท่านั้น นักเรียนต้องแลกและรับอนุมัติจากฉัน
                  </p>
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <Label>ประเภทรางวัล (สำหรับ chip filter ในหน้าสาธารณะ)</Label>
                <Input
                  list="reward-category-suggestions"
                  placeholder="เช่น เครื่องเขียน, ขนมและเครื่องดื่ม"
                  {...form.register('category')}
                />
                <datalist id="reward-category-suggestions">
                  <option value="เครื่องเขียน" />
                  <option value="ขนมและเครื่องดื่ม" />
                  <option value="อุปกรณ์กีฬา" />
                  <option value="ของเล่น" />
                  <option value="อื่นๆ" />
                </datalist>
                <p className="text-xs text-muted-foreground">เว้นว่างได้ — รางวัลจะอยู่ใน &quot;ทั้งหมด&quot; แต่ไม่ขึ้น chip</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>คำอธิบาย</Label>
                <Textarea
                  placeholder="รายละเอียดเพิ่มเติม..."
                  {...form.register('description')}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>รูปภาพ</Label>
                <div className="flex items-center gap-3">
                  {imageUrl && (
                    <img src={imageUrl} alt="ตัวอย่างรางวัล" className="w-20 h-20 object-cover rounded-md border border-border" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-md hover:border-primary transition-colors">
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-sm">{uploading ? 'กำลังอัพโหลด...' : (imageUrl ? 'เปลี่ยนรูป' : 'เลือกรูป')}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                  </label>
                </div>
              </div>
                </div>
                <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 mr-1" /> ยกเลิก
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rewards.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            ยังไม่มีรางวัล — คลิก &quot;เพิ่มรางวัล&quot; เพื่อเริ่มต้น
          </div>
        ) : (
          rewards.map((r) => {
            const ownerName = r.staff?.name ?? r.administrators?.name ?? null;
            const central = isCentral(r);
            const mine = isMine(r);
            return (
              <Card key={r.id} className={!r.is_active ? 'opacity-60' : ''}>
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Gift className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    {!r.is_active && <Badge variant="outline">ปิด</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {central ? (
                      <Badge variant="outline" className="gap-1 text-xs border-sky-300 text-sky-700 dark:text-sky-300">
                        <Globe2 className="w-3 h-3" /> รางวัลกลาง
                      </Badge>
                    ) : mine ? (
                      <Badge variant="outline" className="gap-1 text-xs border-emerald-300 text-emerald-700 dark:text-emerald-300">
                        <User className="w-3 h-3" /> ของฉัน
                      </Badge>
                    ) : ownerName ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <User className="w-3 h-3" /> ของ {ownerName}
                      </Badge>
                    ) : null}
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <RewardCostDisplay waste={r.waste_points_cost} virtue={r.virtue_points_cost} />
                    {isAdmin ? (
                      <StockResetPopover reward={r} onSaved={fetchAll} />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.stock === null ? 'ไม่จำกัด' : `คงเหลือ ${r.stock}`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(r)}
                      disabled={!canEdit(r)}
                      title={canEdit(r) ? undefined : 'รางวัลของครูคนอื่น แก้ไม่ได้'}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> แก้ไข
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDelete(r)}
                      disabled={!canEdit(r)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── StockResetPopover (admin only) ─────────────────────────────────────────
// คลิก stock badge → popover ที่กรอกตัวเลขใหม่ → call admin_set_reward_stock RPC
// ใช้สำหรับ reconcile drift (เช่นกรณี trigger หาย active claims > stock)
function StockResetPopover({ reward, onSaved }: { reward: Reward; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(reward.stock === null ? '' : String(reward.stock));
  const [saving, setSaving] = useState(false);

  // resync ค่าทุกครั้งที่ popover เปิด (เผื่อ stock ถูก update จากที่อื่น)
  useEffect(() => {
    if (open) setValue(reward.stock === null ? '' : String(reward.stock));
  }, [open, reward.stock]);

  const handleSave = async () => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) {
      toast({ title: 'ค่าไม่ถูกต้อง', description: 'กรอกตัวเลขจำนวนเต็ม ≥ 0', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await rewardsService.setStock(reward.id, n);
    setSaving(false);
    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'ปรับ stock แล้ว', description: `${reward.name}: ${reward.stock ?? '∞'} → ${n}` });
    setOpen(false);
    onSaved();
  };

  const handleSetUnlimited = async () => {
    setSaving(true);
    // ใช้ update() ตรงๆ เพื่อ set NULL — admin RLS อนุญาตอยู่แล้ว
    const { error } = await rewardsService.update(reward.id, { stock: null });
    setSaving(false);
    if (error) {
      toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'ตั้งเป็นไม่จำกัดแล้ว', description: reward.name });
    setOpen(false);
    onSaved();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/60"
          title="คลิกเพื่อปรับ stock (admin only)"
        >
          {reward.stock === null ? 'ไม่จำกัด' : `คงเหลือ ${reward.stock}`}
          <Pencil className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="end">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">ปรับ stock ของ "{reward.name}"</Label>
          <p className="text-[10px] text-muted-foreground">
            ตั้งค่าตรงๆ — ใช้สำหรับ reconcile หาก stock ไม่ตรงสต๊อกจริง
          </p>
        </div>
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
          placeholder="จำนวนคงเหลือ"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={saving} className="flex-1">
            ยกเลิก
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-1">
            <Save className="w-3.5 h-3.5" />
            บันทึก
          </Button>
        </div>
        <button
          type="button"
          onClick={handleSetUnlimited}
          disabled={saving}
          className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1 border border-dashed rounded transition-colors flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          ตั้งเป็นไม่จำกัด (NULL)
        </button>
      </PopoverContent>
    </Popover>
  );
}

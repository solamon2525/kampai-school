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

export const RewardsManagement = () => {
  const { toast } = useToast();
  const { isAdmin, staffId, administratorId } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    image_url: '',
    points_cost: '',
    stock: '',
    is_active: true,
    category: '',
    is_central: false, // admin-only: mark as รางวัลกลาง (owner=NULL)
  });

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
    setForm({
      name: '',
      description: '',
      image_url: '',
      points_cost: '',
      stock: '',
      is_active: true,
      category: '',
      is_central: false,
    });
    setShowForm(true);
  };

  const openEdit = (r: Reward) => {
    if (!canEdit(r)) {
      toast({ title: 'ไม่มีสิทธิ์แก้รางวัลนี้', description: 'รางวัลนี้เป็นของครูคนอื่น', variant: 'destructive' });
      return;
    }
    setEditing(r);
    setForm({
      name: r.name,
      description: r.description ?? '',
      image_url: r.image_url ?? '',
      points_cost: String(r.points_cost),
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
      setForm((p) => ({ ...p, image_url: url }));
      toast({ title: 'อัพโหลดรูปสำเร็จ' });
    } catch (err) {
      toast({ title: 'อัพโหลดไม่สำเร็จ', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.points_cost) {
      toast({ title: 'กรุณากรอกชื่อและจำนวนแต้ม', variant: 'destructive' });
      return;
    }
    const cost = parseInt(form.points_cost, 10);
    if (isNaN(cost) || cost <= 0) {
      toast({ title: 'แต้มต้องเป็นตัวเลขมากกว่า 0', variant: 'destructive' });
      return;
    }
    const stock = form.stock === '' ? null : parseInt(form.stock, 10);
    if (stock !== null && (isNaN(stock) || stock < 0)) {
      toast({ title: 'จำนวนคงเหลือไม่ถูกต้อง', variant: 'destructive' });
      return;
    }

    // ownership: anyone (teachers and admins) can toggle central
    const willBeCentral = form.is_central;
    const owner_staff_id = willBeCentral ? null : (staffId ?? null);
    const owner_administrator_id = willBeCentral ? null : (staffId ? null : administratorId);

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      points_cost: cost,
      stock,
      is_active: form.is_active,
      order_position: editing?.order_position ?? 99,
      category: form.category.trim() || null,
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>ชื่อรางวัล <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="เช่น สมุดโน้ต, ขนมปัง, ปากกา"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>จำนวนแต้มที่ต้องใช้ <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="1" min="1"
                  placeholder="10"
                  value={form.points_cost}
                  onChange={(e) => setForm((p) => ({ ...p, points_cost: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>จำนวนคงเหลือ (เว้นว่าง = ไม่จำกัด)</Label>
                <Input
                  type="number" step="1" min="0"
                  placeholder="เว้นว่างถ้าไม่จำกัด"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>สถานะ</Label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">เปิดให้แลก</label>
                </div>
              </div>
              {(isAdmin || staffId || administratorId) && (
                <div className="space-y-1 md:col-span-2">
                  <Label>เจ้าของรางวัล</Label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="is_central"
                      checked={form.is_central}
                      onChange={(e) => setForm((p) => ({ ...p, is_central: e.target.checked }))}
                      className="w-4 h-4"
                    />
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
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
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
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>รูปภาพ</Label>
                <div className="flex items-center gap-3">
                  {form.image_url && (
                    <img src={form.image_url} alt="preview" className="w-20 h-20 object-cover rounded-md border border-border" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-md hover:border-primary transition-colors">
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-sm">{uploading ? 'กำลังอัพโหลด...' : (form.image_url ? 'เปลี่ยนรูป' : 'เลือกรูป')}</span>
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
              <Button variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 mr-1" /> ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
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
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20">
                      {r.points_cost} แต้ม
                    </Badge>
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

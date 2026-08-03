import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Check, X, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { suppliesService, type SupplyItem } from '@/services/supplies.service';
import { cn } from '@/lib/utils';

export const SuppliesManagement = () => {
  const qc = useQueryClient();
  const [itemOpen, setItemOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyItem | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'วัสดุสำนักงาน', unit: 'ชิ้น', stock: '0', min_stock: '0', location: '', note: '',
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['supply-items', 'all'],
    queryFn: () => suppliesService.listItems(false),
  });

  const { data: pending = [], isLoading: reqLoading } = useQuery({
    queryKey: ['supply-requests', 'pending'],
    queryFn: () => suppliesService.listRequests({ status: 'รออนุมัติ' }),
  });

  const { data: returnPending = [] } = useQuery({
    queryKey: ['supply-requests', 'return-pending'],
    queryFn: () => suppliesService.listRequests({ status: 'ขอคืน' }),
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['supply-requests', 'recent'],
    queryFn: () => suppliesService.listRequests(),
  });

  const saveItem = useMutation({
    mutationFn: () =>
      suppliesService.upsertItem({
        ...(editing ? { id: editing.id } : {}),
        name: form.name.trim(),
        category: form.category.trim() || 'วัสดุสำนักงาน',
        unit: form.unit.trim() || 'ชิ้น',
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 0,
        location: form.location.trim() || null,
        note: form.note.trim() || null,
        is_active: editing?.is_active ?? true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-items'] });
      setItemOpen(false);
      setEditing(null);
      toast.success(editing ? 'บันทึกรายการแล้ว' : 'เพิ่มวัสดุแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (id: string) => suppliesService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      qc.invalidateQueries({ queryKey: ['supply-items'] });
      toast.success('อนุมัติและตัดสต็อกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => suppliesService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('ไม่อนุมัติคำขอแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmReturn = useMutation({
    mutationFn: (id: string) => suppliesService.confirmReturn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      qc.invalidateQueries({ queryKey: ['supply-items'] });
      toast.success('รับคืนและเติมสต็อกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      suppliesService.setActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply-items'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: 'วัสดุสำนักงาน', unit: 'ชิ้น', stock: '0', min_stock: '0', location: '', note: '' });
    setItemOpen(true);
  };

  const openEdit = (item: SupplyItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: String(item.stock),
      min_stock: String(item.min_stock),
      location: item.location ?? '',
      note: item.note ?? '',
    });
    setItemOpen(true);
  };

  const lowStock = items.filter((i) => i.is_active && Number(i.stock) <= Number(i.min_stock));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            พัสดุ / วัสดุพื้นฐาน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ทะเบียนวัสดุ · เบิก–จ่าย · คืนของ · แจ้งเตือนสต็อกต่ำ
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> เพิ่มวัสดุ
        </Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-500/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              สต็อกต่ำ {lowStock.length} รายการ — ควรจัดซื้อเพิ่ม
            </p>
            <ul className="flex flex-wrap gap-2">
              {lowStock.map((i) => (
                <Badge key={i.id} variant="outline" className="text-xs border-amber-300 text-amber-800">
                  {i.name}: {i.stock}/{i.min_stock} {i.unit}
                </Badge>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-4 gap-3">
        <Kpi label="รายการวัสดุ" value={items.filter((i) => i.is_active).length} />
        <Kpi label="คำขอรออนุมัติ" value={pending.length} warn={pending.length > 0} />
        <Kpi label="รอรับคืน" value={returnPending.length} warn={returnPending.length > 0} />
        <Kpi label="สต็อกต่ำ" value={lowStock.length} warn={lowStock.length > 0} />
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">คำขอเบิก ({pending.length})</TabsTrigger>
          <TabsTrigger value="returns">รับคืน ({returnPending.length})</TabsTrigger>
          <TabsTrigger value="items">ทะเบียนวัสดุ</TabsTrigger>
          <TabsTrigger value="history">ประวัติ</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {reqLoading ? (
            <Loading />
          ) : pending.length === 0 ? (
            <Empty text="ไม่มีคำขอรออนุมัติ" />
          ) : (
            pending.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PersonAvatar name={r.staff?.name ?? 'ครู'} photoUrl={r.staff?.photo_url} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.staff?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ขอ {r.item?.name} · {r.quantity} {r.item?.unit}
                        {r.purpose ? ` · ${r.purpose}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(r.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> อนุมัติจ่าย
                    </Button>
                    <Button size="sm" variant="outline" disabled={reject.isPending} onClick={() => reject.mutate(r.id)}>
                      <X className="h-3.5 w-3.5 mr-1" /> ไม่อนุมัติ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="returns" className="space-y-3 mt-4">
          {returnPending.length === 0 ? (
            <Empty text="ไม่มีคำขอคืนรอรับ" />
          ) : (
            returnPending.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <PersonAvatar name={r.staff?.name ?? 'ครู'} photoUrl={r.staff?.photo_url} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.staff?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        คืน {r.item?.name} · {r.quantity} {r.item?.unit}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={confirmReturn.isPending}
                    onClick={() => confirmReturn.mutate(r.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> รับคืน + เติมสต็อก
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          {itemsLoading ? (
            <Loading />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>หมวด</TableHead>
                    <TableHead className="text-right">คงเหลือ</TableHead>
                    <TableHead>ที่เก็บ</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const low = Number(item.stock) <= Number(item.min_stock);
                    return (
                      <TableRow key={item.id} className={cn(!item.is_active && 'opacity-50')}>
                        <TableCell className="font-medium">
                          {item.name}
                          {low && item.is_active && (
                            <Badge variant="outline" className="ml-2 text-[10px] text-amber-700 border-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-0.5" /> ต่ำ
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item.category}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.stock} {item.unit}
                          <span className="text-[10px] text-muted-foreground ml-1">(min {item.min_stock})</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location ?? '—'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>แก้</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActive.mutate({ id: item.id, is_active: !item.is_active })}
                          >
                            {item.is_active ? 'ปิด' : 'เปิด'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {recent.slice(0, 40).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <PersonAvatar name={r.staff?.name ?? 'ครู'} photoUrl={r.staff?.photo_url} size="sm" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{r.staff?.name}</span>
                <span className="text-muted-foreground"> · {r.item?.name} × {r.quantity}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{r.status}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุ'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Field label="ชื่อ">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="หมวด">
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
              <Field label="หน่วย">
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="คงเหลือ">
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </Field>
              <Field label="ขั้นต่ำแจ้งเตือน">
                <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </Field>
            </div>
            <Field label="ที่เก็บ">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>ยกเลิก</Button>
            <Button disabled={!form.name.trim() || saveItem.isPending} onClick={() => saveItem.mutate()}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Kpi({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <Card className={cn(warn && 'border-amber-200 bg-amber-500/5')}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
      <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground p-6 text-center border border-dashed rounded-lg">{text}</p>;
}

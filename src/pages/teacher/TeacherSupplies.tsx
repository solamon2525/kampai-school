import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { suppliesService } from '@/services/supplies.service';
import { LayoutDashboard, FolderOpen, Gift, Package as PackageIcon } from 'lucide-react';

const MENU = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/teacher' },
  { id: 'supplies', label: 'เบิกพัสดุ', icon: PackageIcon, path: '/teacher/supplies' },
  { id: 'edu-hub', label: 'คลังสื่อของฉัน', icon: FolderOpen, path: '/teacher/edu-hub' },
  { id: 'rewards', label: 'อนุมัติรางวัล', icon: Gift, path: '/teacher/rewards-approval' },
];

export default function TeacherSupplies() {
  const qc = useQueryClient();
  const { data: link } = useLinkedRecord();
  const staffId = link?.staff_id ?? null;
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [purpose, setPurpose] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['supply-items', 'active'],
    queryFn: () => suppliesService.listItems(true),
  });

  const { data: mine = [], isLoading } = useQuery({
    queryKey: ['supply-requests', 'mine', staffId],
    enabled: !!staffId,
    queryFn: () => suppliesService.listRequests({ staffId: staffId! }),
  });

  const create = useMutation({
    mutationFn: () =>
      suppliesService.createRequest({
        item_id: itemId,
        staff_id: staffId!,
        quantity: Number(qty) || 1,
        purpose: purpose.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      setOpen(false);
      setItemId('');
      setQty('1');
      setPurpose('');
      toast.success('ส่งคำขอเบิกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => suppliesService.cancelMine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('ยกเลิกคำขอแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestReturn = useMutation({
    mutationFn: (id: string) => suppliesService.requestReturn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-requests'] });
      toast.success('ส่งคำขอคืนแล้ว — รอธุรการรับคืน');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <RolePortalLayout title="Portal ครู" subtitle="เบิกพัสดุ" menu={MENU} accent="teacher">
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              เบิกพัสดุ / วัสดุ
            </h1>
            <p className="text-sm text-muted-foreground mt-1">ส่งคำขอออนไลน์ — รอธุรการอนุมัติและจ่าย</p>
          </div>
          <Button disabled={!staffId} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> ขอเบิก
          </Button>
        </div>

        {!staffId && (
          <Card>
            <CardContent className="p-4 text-sm text-amber-700">
              บัญชียังไม่เชื่อมบุคลากร — ติดต่อผู้ดูแลระบบก่อนเบิกพัสดุ
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">คำขอของฉัน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...
              </div>
            ) : mine.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีคำขอ</p>
            ) : (
              mine.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.item?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.quantity} {r.item?.unit}
                      {r.purpose ? ` · ${r.purpose}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>
                  {r.status === 'รออนุมัติ' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => cancel.mutate(r.id)}>
                      ยกเลิก
                    </Button>
                  )}
                  {r.status === 'จ่ายแล้ว' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={requestReturn.isPending}
                      onClick={() => requestReturn.mutate(r.id)}
                    >
                      ขอคืน
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ขอเบิกวัสดุ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label className="text-xs">รายการ</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวัสดุ" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} (เหลือ {i.stock} {i.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">จำนวน</Label>
                <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">วัตถุประสงค์</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="เช่น สอนป.4" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button disabled={!itemId || !staffId || create.isPending} onClick={() => create.mutate()}>
                ส่งคำขอ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RolePortalLayout>
  );
}

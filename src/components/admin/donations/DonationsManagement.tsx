import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Heart, Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { donationsService, type DonationCampaign } from '@/services/donations.service';

export const DonationsManagement = () => {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    promptpay_id: '',
    promptpay_owner_name: '',
    is_featured: false,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => donationsService.listCampaigns(),
  });

  const { data: allDonations = [] } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => donationsService.listDonations(undefined, false),
  });

  const create = useMutation({
    mutationFn: () =>
      donationsService.createCampaign({
        title: form.title,
        description: form.description,
        cover_image_url: null,
        target_amount: form.target_amount ? Number(form.target_amount) : null,
        promptpay_id: form.promptpay_id,
        promptpay_owner_name: form.promptpay_owner_name || null,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: null,
        is_active: true,
        is_featured: form.is_featured,
      } as Omit<DonationCampaign, 'id' | 'raised_amount' | 'created_at'>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
      setNewOpen(false);
      setForm({ title: '', description: '', target_amount: '', promptpay_id: '', promptpay_owner_name: '', is_featured: false });
      toast.success('สร้างแคมเปญสำเร็จ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: (id: string) => donationsService.verifyDonation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-donations'] });
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] });
      toast.success('ยืนยันแล้ว — เพิ่มเข้ายอดระดมทุน');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      donationsService.updateCampaign(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-campaigns'] }),
  });

  const pendingDonations = allDonations.filter((d) => !d.is_verified);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" />
            ระดมทุนและบริจาค
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            จัดการแคมเปญรับบริจาค (PromptPay QR) + ตรวจสลิปและออกใบเสร็จ
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              แคมเปญใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างแคมเปญรับบริจาค</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ชื่อแคมเปญ</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น สร้างห้องสมุดใหม่" />
              </div>
              <div>
                <Label>รายละเอียด</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>เป้าหมาย (บาท)</Label>
                  <Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="100000" />
                </div>
                <div>
                  <Label>PromptPay ID</Label>
                  <Input value={form.promptpay_id} onChange={(e) => setForm({ ...form, promptpay_id: e.target.value })} placeholder="081-XXX-XXXX หรือ x-xxxx-xxxxx-xx-x" />
                </div>
              </div>
              <div>
                <Label>ชื่อบัญชี PromptPay</Label>
                <Input value={form.promptpay_owner_name} onChange={(e) => setForm({ ...form, promptpay_owner_name: e.target.value })} placeholder="โรงเรียนบ้านคำไผ่" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="featured" checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label htmlFor="featured">แคมเปญเด่น (แสดงเป็นค่าเริ่มต้น)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => create.mutate()} disabled={!form.title || !form.promptpay_id || create.isPending}>
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">แคมเปญ ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="pending">
            รอตรวจสลิป
            {pendingDonations.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1.5">{pendingDonations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">รายการทั้งหมด ({allDonations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-3 space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold">{c.title}</p>
                      {c.is_featured && <Badge variant="default">เด่น</Badge>}
                      {!c.is_active && <Badge variant="secondary">ปิด</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                    {c.target_amount && (
                      <>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-muted-foreground">
                            ฿{Number(c.raised_amount).toLocaleString()} / ฿{Number(c.target_amount).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {((Number(c.raised_amount) / Number(c.target_amount)) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(Number(c.raised_amount) / Number(c.target_amount)) * 100} className="h-2 mt-1" />
                      </>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      PromptPay: {c.promptpay_id} {c.promptpay_owner_name && `· ${c.promptpay_owner_name}`}
                    </p>
                  </div>
                  <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: c.id, is_active: v })} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-3 space-y-2">
          {!pendingDonations.length && (
            <p className="text-center text-sm text-muted-foreground py-8">ไม่มีรายการรอตรวจ</p>
          )}
          {pendingDonations.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {d.is_anonymous ? 'ไม่ประสงค์ออกนาม' : d.donor_name}
                    <span className="ml-2 text-rose-600 font-bold">฿{Number(d.amount).toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(d.donated_at), 'd MMM yyyy HH:mm', { locale: th })}
                    {d.donor_phone && ` · ${d.donor_phone}`}
                  </p>
                  {d.message && <p className="text-xs italic mt-1">"{d.message}"</p>}
                </div>
                <Button size="sm" onClick={() => verify.mutate(d.id)} disabled={verify.isPending}>
                  <Check className="w-4 h-4 mr-1.5" />
                  ยืนยันสลิป
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="mt-3 space-y-2">
          {allDonations.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Badge variant={d.is_verified ? 'default' : 'outline'}>
                  {d.is_verified ? 'ยืนยันแล้ว' : 'รอตรวจ'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {d.is_anonymous ? 'ไม่ประสงค์ออกนาม' : d.donor_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(d.donated_at), 'd MMM yyyy', { locale: th })}
                  </p>
                </div>
                <span className="text-rose-600 font-bold">฿{Number(d.amount).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ShieldCheck, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { pdpaService, SCOPE_LABELS, type ConsentScope } from '@/services/pdpa.service';
import { useActiveChild } from '@/hooks/useActiveChild';

const ALL_SCOPES: ConsentScope[] = [
  'photo_public',
  'photo_news',
  'line_msg',
  'push_notify',
  'data_sharing_moe',
  'data_sharing_thirdparty',
];

export const PdpaSelfView = () => {
  const qc = useQueryClient();
  const { activeChild } = useActiveChild();

  const { data: consents = [] } = useQuery({
    queryKey: ['pdpa-my-consents'],
    queryFn: () => pdpaService.myConsents(),
  });

  // Map: latest consent per scope
  const consentMap = new Map<ConsentScope, boolean>();
  for (const c of consents) {
    // First occurrence wins (sorted desc by granted_at)
    if (!consentMap.has(c.scope)) consentMap.set(c.scope, c.granted);
  }

  const { data: requests = [] } = useQuery({
    queryKey: ['pdpa-my-erasure'],
    queryFn: () => pdpaService.listErasureRequests(),
  });

  const setConsent = useMutation({
    mutationFn: ({ scope, granted }: { scope: ConsentScope; granted: boolean }) =>
      pdpaService.setConsent(scope, granted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdpa-my-consents'] });
      toast.success('บันทึกความยินยอม');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [eraseScope, setEraseScope] = useState<'photos' | 'attendance' | 'scores' | 'all'>('photos');
  const [eraseReason, setEraseReason] = useState('');
  const submitErasure = useMutation({
    mutationFn: () =>
      pdpaService.submitErasure({
        scope: eraseScope,
        reason: eraseReason || undefined,
        target_student_id: activeChild?.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdpa-my-erasure'] });
      setEraseReason('');
      toast.success('ส่งคำขอแล้ว — รอผู้ดูแลระบบพิจารณา');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          ความเป็นส่วนตัวของฉัน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          จัดการความยินยอม (consent) และส่งคำขอลบข้อมูล (right to erasure) ตาม พ.ร.บ. PDPA
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ความยินยอม (Consent)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ALL_SCOPES.map((scope) => {
            const granted = consentMap.get(scope) ?? false;
            return (
              <div key={scope} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`c-${scope}`} className="text-sm font-medium cursor-pointer">
                    {SCOPE_LABELS[scope]}
                  </Label>
                </div>
                <Switch
                  id={`c-${scope}`}
                  checked={granted}
                  onCheckedChange={(v) => setConsent.mutate({ scope, granted: v })}
                  disabled={setConsent.isPending}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            ขอให้ลบข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            ส่งคำขอลบข้อมูลของบุตร {activeChild?.name && `(${activeChild.name})`}. ผู้ดูแลระบบจะพิจารณาภายใน 30 วันตามที่ พ.ร.บ. กำหนด
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label>ขอบเขต</Label>
              <Select value={eraseScope} onValueChange={(v) => setEraseScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photos">รูปภาพ</SelectItem>
                  <SelectItem value="attendance">ประวัติการเข้าเรียน</SelectItem>
                  <SelectItem value="scores">ผลการเรียน</SelectItem>
                  <SelectItem value="all">ข้อมูลทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>เหตุผล (ไม่บังคับ)</Label>
            <Textarea rows={3} value={eraseReason} onChange={(e) => setEraseReason(e.target.value)} placeholder="เช่น ย้ายโรงเรียน, ต้องการความเป็นส่วนตัว" />
          </div>
          <Button variant="destructive" onClick={() => submitErasure.mutate()} disabled={submitErasure.isPending}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            ส่งคำขอ
          </Button>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">คำขอของฉัน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card text-sm">
                <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'outline'}>
                  {r.status === 'pending' ? 'รอพิจารณา' : r.status === 'approved' ? 'อนุมัติ' : r.status === 'rejected' ? 'ปฏิเสธ' : 'เสร็จสิ้น'}
                </Badge>
                <Badge variant="outline">{r.scope}</Badge>
                <span className="flex-1 text-xs text-muted-foreground">
                  {format(new Date(r.created_at), 'd MMM yyyy', { locale: th })}
                </span>
                {r.status === 'completed' && <Check className="w-4 h-4 text-green-600" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

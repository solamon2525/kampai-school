import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ShieldCheck, FileX, History, Check, X, AlertCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { pdpaService, type ErasureRequest } from '@/services/pdpa.service';

const STATUS_VARIANT: Record<ErasureRequest['status'], 'outline' | 'default' | 'secondary' | 'destructive'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  completed: 'secondary',
};

const SCOPE_LABEL: Record<string, string> = {
  photos: 'รูปภาพ',
  attendance: 'การเข้าเรียน',
  scores: 'คะแนน',
  all: 'ทั้งหมด',
};

export const PdpaDashboard = () => {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<ErasureRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: erasureRequests = [] } = useQuery({
    queryKey: ['pdpa-erasure-requests'],
    queryFn: () => pdpaService.listErasureRequests(),
  });

  const { data: accessLogs = [] } = useQuery({
    queryKey: ['pdpa-access-logs'],
    queryFn: () => pdpaService.listAccessLogs({ limit: 100 }),
  });

  const reviewMut = useMutation({
    mutationFn: (status: 'approved' | 'rejected' | 'completed') =>
      pdpaService.reviewErasure(reviewing!.id, status, reviewNotes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdpa-erasure-requests'] });
      setReviewing(null);
      setReviewNotes('');
      toast.success('บันทึกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingCount = erasureRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          PDPA Compliance Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล 2562 — บริหารคำขอลบข้อมูล + audit trail การเข้าถึงข้อมูล
        </p>
      </div>

      <Tabs defaultValue="erasure">
        <TabsList>
          <TabsTrigger value="erasure">
            <FileX className="w-3.5 h-3.5 mr-1.5" />
            คำขอลบข้อมูล
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1.5">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="w-3.5 h-3.5 mr-1.5" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="guide">
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
            แนวปฏิบัติ
          </TabsTrigger>
        </TabsList>

        {/* ───── Erasure requests ───── */}
        <TabsContent value="erasure" className="mt-3 space-y-2">
          {!erasureRequests.length && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                ยังไม่มีคำขอลบข้อมูล
              </CardContent>
            </Card>
          )}
          {erasureRequests.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    <Badge variant="outline">{SCOPE_LABEL[r.scope]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: th })}
                    </span>
                  </div>
                  {r.reason && <p className="text-sm">{r.reason}</p>}
                  {r.review_notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💬 หมายเหตุการพิจารณา: {r.review_notes}
                    </p>
                  )}
                </div>
                {r.status === 'pending' && (
                  <Button size="sm" onClick={() => setReviewing(r)}>
                    พิจารณา
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ───── Audit log ───── */}
        <TabsContent value="audit" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">100 รายการล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-3 font-medium text-muted-foreground">เวลา</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Actor</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Action</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Resource</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map((l) => (
                      <tr key={l.id} className="border-b border-border/40">
                        <td className="py-1.5 pr-3 whitespace-nowrap">
                          {format(new Date(l.created_at), 'd MMM HH:mm:ss', { locale: th })}
                        </td>
                        <td className="py-1.5 pr-3">
                          <Badge variant="outline" className="text-[10px]">{l.actor_role ?? '-'}</Badge>
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-[11px]">{l.action}</td>
                        <td className="py-1.5 pr-3">{l.resource_type}</td>
                        <td className="py-1.5 pr-3 font-mono text-[10px] text-muted-foreground">
                          {l.subject_student_id?.slice(0, 8) ?? l.subject_user_id?.slice(0, 8) ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!accessLogs.length && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    ยังไม่มี audit log — ใช้ <code className="text-xs bg-muted px-1 rounded">log_data_access()</code> RPC จากโค้ดที่อ่านข้อมูลละเอียดอ่อน
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Guide ───── */}
        <TabsContent value="guide" className="mt-3">
          <Card>
            <CardContent className="p-6 text-sm space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                หน้าที่ของโรงเรียนภายใต้ PDPA
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>เก็บข้อมูลเท่าที่จำเป็น (data minimization) — ลบเมื่อหมดความจำเป็น</li>
                <li>ขอ <strong>ความยินยอม</strong> (consent) ก่อนใช้รูป/ข้อมูลในเว็บไซต์, สื่อ, third party</li>
                <li>เปิดเผยรายการการเข้าถึงข้อมูล (audit trail) เมื่อมีคำขอ</li>
                <li>รองรับ <strong>สิทธิ์ลบข้อมูล</strong> (right to erasure) — ทำได้จริงภายใน 30 วัน</li>
                <li>แต่งตั้ง DPO (Data Protection Officer) ในโรงเรียนขนาดใหญ่</li>
                <li>มีนโยบายความเป็นส่วนตัว (privacy notice) บนเว็บไซต์ — link จาก footer</li>
              </ul>
              <h3 className="font-semibold pt-3">โทษถ้าไม่ปฏิบัติ</h3>
              <p className="text-muted-foreground">
                ปรับสูงสุด <strong>5 ล้านบาท</strong> + ค่าเสียหายเชิงลงโทษ 2 เท่า (พ.ร.บ.มาตรา 83)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewing} onOpenChange={(v) => !v && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>พิจารณาคำขอลบข้อมูล</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-md text-sm">
                <p><strong>Scope:</strong> {SCOPE_LABEL[reviewing.scope]}</p>
                {reviewing.reason && <p className="mt-1"><strong>เหตุผล:</strong> {reviewing.reason}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">หมายเหตุการพิจารณา</label>
                <Textarea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="อธิบายเหตุผล (เช่น อนุมัติ จะดำเนินการภายใน 30 วัน)" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => reviewMut.mutate('rejected')} disabled={reviewMut.isPending}>
              <X className="w-4 h-4 mr-1.5" />
              ปฏิเสธ
            </Button>
            <Button onClick={() => reviewMut.mutate('approved')} disabled={reviewMut.isPending}>
              <Check className="w-4 h-4 mr-1.5" />
              อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

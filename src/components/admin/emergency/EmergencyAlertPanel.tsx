import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { AlertTriangle, Send, Loader2, Megaphone, History } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  emergencyService,
  SEVERITY_LABEL,
  SEVERITY_PREFIX,
  type Severity,
  type Audience,
  type EmergencyPayload,
} from '@/services/emergency.service';

const SEVERITY_STYLE: Record<Severity, string> = {
  info: 'bg-blue-50 border-blue-300 text-blue-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-900',
  critical: 'bg-red-50 border-red-400 text-red-900',
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  all_parents: 'ผู้ปกครองทั้งหมด',
  all_staff: 'ครู/บุคลากรทั้งหมด',
  all_users: 'ทุกคน (ผู้ปกครอง + บุคลากร)',
  class_specific: 'เฉพาะห้องเรียน',
};

export const EmergencyAlertPanel = () => {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payload, setPayload] = useState<EmergencyPayload>({
    severity: 'warning',
    title: '',
    body: '',
    target_audience: 'all_parents',
  });

  const { data: history = [] } = useQuery({
    queryKey: ['emergency-history'],
    queryFn: () => emergencyService.listRecent(20),
  });

  const send = useMutation({
    mutationFn: () => emergencyService.send(payload),
    onSuccess: (r) => {
      toast.success(`ส่งแล้ว — Push ${r.pushSent} · LINE ${r.lineSent} (จาก ${r.totalTargets} ผู้รับ)`);
      qc.invalidateQueries({ queryKey: ['emergency-history'] });
      setPayload({ severity: 'warning', title: '', body: '', target_audience: 'all_parents' });
      setConfirmOpen(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConfirmOpen(false);
    },
  });

  const valid = payload.title.trim().length > 0 && payload.body.trim().length > 0;

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-red-600" />
          แจ้งเตือนฉุกเฉิน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ส่งข้อความฉุกเฉินผ่าน Push + LINE OA พร้อมกัน — ใช้กรณีปิดเรียน, อุบัติเหตุ, หรือเหตุการณ์ที่ผู้ปกครองต้องทราบทันที
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ข้อความใหม่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>ระดับความรุนแรง</Label>
              <Select value={payload.severity} onValueChange={(v) => setPayload({ ...payload, severity: v as Severity })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['info', 'warning', 'critical'] as Severity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_PREFIX[s]} {SEVERITY_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>กลุ่มผู้รับ</Label>
              <Select value={payload.target_audience} onValueChange={(v) => setPayload({ ...payload, target_audience: v as Audience })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['all_parents', 'all_staff', 'all_users', 'class_specific'] as Audience[]).map((a) => (
                    <SelectItem key={a} value={a}>{AUDIENCE_LABEL[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {payload.target_audience === 'class_specific' && (
            <div>
              <Label>ระบุห้องเรียน</Label>
              <Input
                placeholder="เช่น ป.4/1"
                value={payload.target_class ?? ''}
                onChange={(e) => setPayload({ ...payload, target_class: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>หัวข้อ</Label>
            <Input
              placeholder="เช่น ปิดเรียนกรณีฉุกเฉิน"
              value={payload.title}
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>

          <div>
            <Label>เนื้อหา</Label>
            <Textarea
              rows={4}
              placeholder="เช่น โรงเรียนปิดทำการวันที่ 27 พ.ค. เนื่องจากเหตุพายุฝน รถรับ-ส่งงดบริการ"
              value={payload.body}
              onChange={(e) => setPayload({ ...payload, body: e.target.value })}
            />
          </div>

          <div>
            <Label>ลิงก์เพิ่มเติม (ไม่บังคับ)</Label>
            <Input
              placeholder="https://kampai-school.vercel.app/news/..."
              value={payload.url ?? ''}
              onChange={(e) => setPayload({ ...payload, url: e.target.value })}
            />
          </div>

          {/* Preview */}
          {valid && (
            <div className={`p-4 rounded-lg border-2 ${SEVERITY_STYLE[payload.severity]}`}>
              <p className="text-xs font-semibold opacity-70">ตัวอย่าง</p>
              <p className="font-bold mt-1">
                {SEVERITY_PREFIX[payload.severity]} {payload.title}
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{payload.body}</p>
              {payload.url && <p className="text-xs mt-1 underline opacity-80">{payload.url}</p>}
            </div>
          )}

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!valid || send.isPending}
            variant={payload.severity === 'critical' ? 'destructive' : 'default'}
          >
            {send.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            ส่งแจ้งเตือน
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            ประวัติการส่ง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!history.length && (
            <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีประวัติ</p>
          )}
          {history.map((h: any) => (
            <div key={h.id} className={`p-3 rounded-lg border ${SEVERITY_STYLE[h.severity as Severity]}`}>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge variant="outline">{SEVERITY_PREFIX[h.severity as Severity]} {SEVERITY_LABEL[h.severity as Severity]}</Badge>
                <Badge variant="outline">{AUDIENCE_LABEL[h.target_audience as Audience]}</Badge>
                <span className="opacity-70">{format(new Date(h.sent_at), 'd MMM yyyy HH:mm', { locale: th })}</span>
              </div>
              <p className="font-bold mt-1.5">{h.title}</p>
              <p className="text-sm mt-0.5">{h.body}</p>
              <p className="text-[11px] opacity-70 mt-1">
                Push {h.push_sent_count ?? 0} · LINE {h.line_sent_count ?? 0} / {h.total_targets ?? 0} ผู้รับ
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              ยืนยันการส่งแจ้งเตือน
            </AlertDialogTitle>
            <AlertDialogDescription>
              ระบบจะส่งข้อความ "{payload.title}" ไปยัง <strong>{AUDIENCE_LABEL[payload.target_audience]}</strong> ผ่าน Push + LINE OA ทันที — ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); send.mutate(); }}
              className={payload.severity === 'critical' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              ยืนยันส่ง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

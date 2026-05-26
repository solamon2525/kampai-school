import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ClipboardList, Send, Loader2, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useActiveChild } from '@/hooks/useActiveChild';
import { assignmentsService } from '@/services/assignments.service';
import { cn } from '@/lib/utils';

export const ParentAssignments = () => {
  const { activeChild } = useActiveChild();
  const qc = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [body, setBody] = useState('');

  const { data: assignments = [] } = useQuery({
    queryKey: ['parent-assignments', activeChild?.class, activeChild?.room],
    enabled: !!activeChild,
    queryFn: () => assignmentsService.listByClass(activeChild?.class ?? undefined),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['parent-submissions', activeChild?.id],
    enabled: !!activeChild,
    queryFn: () => assignmentsService.listForStudent(activeChild!.id),
  });

  const submitMut = useMutation({
    mutationFn: () =>
      assignmentsService.submit({
        assignment_id: activeAssignmentId!,
        student_id: activeChild!.id,
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-submissions', activeChild?.id] });
      setSubmitOpen(false);
      setBody('');
      toast.success('ส่งงานแล้ว — รอครูตรวจ');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submissionByAssignment = new Map(submissions.map((s) => [s.assignment_id, s]));

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        เลือกบุตรในแถบด้านบนก่อน
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          การบ้านของ {activeChild.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeChild.class}{activeChild.room ? `/${activeChild.room}` : ''}
        </p>
      </div>

      {!assignments.length && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            ยังไม่มีการบ้านในห้องนี้
          </CardContent>
        </Card>
      )}

      {assignments.map((a) => {
        const sub = submissionByAssignment.get(a.id);
        const submitted = !!sub;
        const graded = !!sub?.graded_at;
        const overdue = new Date(a.due_date) < new Date() && !submitted;
        return (
          <Card key={a.id} className={cn(overdue && 'border-red-300 bg-red-50/30')}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    {a.subject && <span>{a.subject} · </span>}
                    <Calendar className="w-3 h-3" />
                    ครบกำหนด {format(new Date(a.due_date), 'd MMM yyyy', { locale: th })}
                  </p>
                </div>
                {graded ? (
                  <Badge variant="default">
                    <Check className="w-3 h-3 mr-1" />
                    {sub?.score}/{a.max_score}
                  </Badge>
                ) : submitted ? (
                  <Badge variant="secondary">ส่งแล้ว — รอตรวจ</Badge>
                ) : overdue ? (
                  <Badge variant="destructive">เลยกำหนด</Badge>
                ) : (
                  <Badge variant="outline">ยังไม่ส่ง</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.description && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{a.description}</p>}

              {sub?.body && (
                <div className="p-3 bg-muted/40 rounded-md">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">งานที่ส่ง</p>
                  <p className="text-sm whitespace-pre-wrap">{sub.body}</p>
                </div>
              )}

              {sub?.teacher_comment && (
                <div className="p-3 bg-primary/5 rounded-md border-l-2 border-primary">
                  <p className="text-[10px] font-semibold text-primary mb-1">ความเห็นครู</p>
                  <p className="text-sm">{sub.teacher_comment}</p>
                </div>
              )}

              {!graded && (
                <Button
                  size="sm"
                  variant={submitted ? 'outline' : 'default'}
                  onClick={() => {
                    setActiveAssignmentId(a.id);
                    setBody(sub?.body ?? '');
                    setSubmitOpen(true);
                  }}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submitted ? 'แก้ไขการส่ง' : 'ส่งงาน'}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ส่งงาน</DialogTitle>
          </DialogHeader>
          <div>
            <Label>เนื้อหา / คำตอบ</Label>
            <Textarea
              rows={8}
              placeholder="พิมพ์คำตอบ หรือบรรยายงานที่ทำ — กรณีงานเป็นไฟล์/รูป ให้ส่งครูใน LINE หรือ chat ระบบ"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => submitMut.mutate()} disabled={!body.trim() || submitMut.isPending}>
              {submitMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              ส่งงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

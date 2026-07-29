import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ClipboardList, Plus, Trash2, ChevronRight, Loader2, Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignmentsService, type Assignment } from '@/services/assignments.service';
import { studentsService } from '@/services/students.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';

export const AssignmentManagement = () => {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    room: '',
    due_date: '',
    max_score: '10',
    attachment_url: '',
  });

  useEffect(() => {
    const attach = searchParams.get('attach');
    const title = searchParams.get('title');
    const subject = searchParams.get('subject');
    if (!attach && !title) return;
    setForm((f) => ({
      ...f,
      attachment_url: attach ?? f.attachment_url,
      title: title ? `ใบงาน: ${title}` : f.title,
      subject: subject || f.subject,
      description: attach
        ? `พิมพ์และส่งใบงานจากชุดเรียน\n${attach}`
        : f.description,
    }));
    setNewOpen(true);
  }, [searchParams]);

  const { data: assignments = [] } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => assignmentsService.listMine(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-by-class', activeAssignment?.class, activeAssignment?.room],
    enabled: !!activeAssignment,
    queryFn: async () => {
      if (!activeAssignment) return [];
      const r = await studentsService.getByClass(activeAssignment.class);
      return r.data ?? [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['assignment-submissions', activeAssignment?.id],
    enabled: !!activeAssignment,
    queryFn: () => assignmentsService.listSubmissions(activeAssignment!.id),
  });

  const create = useMutation({
    mutationFn: () =>
      assignmentsService.create({
        title: form.title,
        description: form.description || null,
        subject: form.subject || null,
        class: form.class,
        room: form.room || null,
        due_date: form.due_date,
        max_score: Number(form.max_score) || 10,
        attachment_url: form.attachment_url.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      setNewOpen(false);
      setForm({ title: '', description: '', subject: '', class: '', room: '', due_date: '', max_score: '10', attachment_url: '' });
      toast.success('สร้างการบ้านแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => assignmentsService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      toast.success('ลบการบ้านแล้ว');
    },
  });

  const grade = useMutation({
    mutationFn: ({ id, score, comment }: { id: string; score: number; comment: string }) =>
      assignmentsService.grade(id, score, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment-submissions', activeAssignment?.id] });
      toast.success('บันทึกคะแนนแล้ว');
    },
  });

  const submissionMap = new Map(submissions.map((s) => [s.student_id, s]));

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            จัดการการบ้าน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            สร้างการบ้านให้ห้อง · ตรวจงาน · ให้คะแนน — sync กับ {assignments.length} รายการ
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              สร้างการบ้าน
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>การบ้านใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ชื่อการบ้าน</Label>
                <Input placeholder="เช่น แบบฝึกหัดเรื่องเศษส่วน บทที่ 3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>คำอธิบาย</Label>
                <Textarea rows={3} placeholder="รายละเอียดงาน, หัวข้อ, ข้อกำหนด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>รายวิชา</Label>
                  <Input placeholder="คณิตศาสตร์" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label>คะแนนเต็ม</Label>
                  <Input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
                </div>
                <div>
                  <Label>ชั้น</Label>
                  <Input placeholder="ป.4" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
                </div>
                <div>
                  <Label>ห้อง (ไม่บังคับ)</Label>
                  <Input placeholder="1" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>กำหนดส่ง</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>ลิงก์ใบงาน / สื่อ (ไม่บังคับ)</Label>
                  <Input
                    placeholder="/games/...-worksheet.html"
                    value={form.attachment_url}
                    onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ผู้ปกครองเห็นปุ่มเปิดใบงานจากชุดเรียนได้
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => create.mutate()} disabled={!form.title || !form.class || !form.due_date || create.isPending}>
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Assignment list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">การบ้านของฉัน</CardTitle>
          </CardHeader>
          <CardContent className="p-2 max-h-[70vh] overflow-y-auto space-y-1">
            {!assignments.length && (
              <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีการบ้าน</p>
            )}
            {assignments.map((a) => {
              const overdue = new Date(a.due_date) < new Date();
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveAssignment(a)}
                  className={`w-full text-left p-3 rounded-md transition flex items-start gap-2 ${
                    activeAssignment?.id === a.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.class}{a.room ? `/${a.room}` : ''} · ครบกำหนด {format(new Date(a.due_date), 'd MMM', { locale: th })}
                      {overdue && <Badge variant="destructive" className="ml-1 text-[9px] h-3.5 px-1">เลย</Badge>}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 mt-1 text-muted-foreground" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Detail */}
        {!activeAssignment ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              เลือกการบ้านเพื่อดูการส่ง
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{activeAssignment.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeAssignment.subject} · {activeAssignment.class}{activeAssignment.room ? `/${activeAssignment.room}` : ''}
                      · กำหนดส่ง {format(new Date(activeAssignment.due_date), 'd MMM yyyy', { locale: th })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => archive.mutate(activeAssignment.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {activeAssignment.description && (
                <CardContent className="text-sm whitespace-pre-wrap">{activeAssignment.description}</CardContent>
              )}
              {activeAssignment.attachment_url && (
                <CardContent className="pt-0">
                  <a
                    href={activeAssignment.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    เปิดใบงานที่แนบ
                  </a>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  ผลการส่ง ({submissions.length}/{students.length} คน)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {students.map((s: any) => {
                  const sub = submissionMap.get(s.id);
                  const submitted = !!sub;
                  const graded = !!sub?.graded_at;
                  return (
                    <SubmissionRow
                      key={s.id}
                      student={s}
                      submission={sub}
                      submitted={submitted}
                      graded={graded}
                      maxScore={activeAssignment.max_score ?? 10}
                      onGrade={(score, comment) => grade.mutate({ id: sub!.id, score, comment })}
                    />
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const SubmissionRow = ({
  student,
  submission,
  submitted,
  graded,
  maxScore,
  onGrade,
}: any) => {
  const [score, setScore] = useState<string>(submission?.score?.toString() ?? '');
  const [comment, setComment] = useState<string>(submission?.teacher_comment ?? '');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-md bg-card">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-2 flex items-center gap-2 hover:bg-muted/30"
      >
        <PersonAvatar name={student.name} photoUrl={student.photo_url} size="xs" />
        <span className="text-sm flex-1 text-left truncate">{student.name}</span>
        {graded ? (
          <Badge variant="default" className="text-[10px]">
            {submission?.score}/{maxScore}
          </Badge>
        ) : submitted ? (
          <Badge variant="outline" className="text-[10px]">ส่งแล้ว</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]"><X className="w-2.5 h-2.5 mr-0.5" />ยังไม่ส่ง</Badge>
        )}
      </button>
      {expanded && submitted && (
        <div className="p-3 border-t border-border space-y-2 text-sm bg-muted/20">
          {submission?.body && <p className="whitespace-pre-wrap">{submission.body}</p>}
          {submission?.attachment_url && (
            <a href={submission.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              ดูไฟล์แนบ
            </a>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              type="number"
              max={maxScore}
              placeholder={`/${maxScore}`}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-24"
            />
            <Input
              placeholder="ความเห็น (ไม่บังคับ)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={() => score && onGrade(Number(score), comment)} disabled={!score}>
              <Check className="w-3.5 h-3.5 mr-1" />
              {graded ? 'อัปเดต' : 'ให้คะแนน'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

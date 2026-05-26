import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ClipboardList, Plus, Loader2, BarChart3, Trash2, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { surveysService, type QuestionType, type SurveyQuestion } from '@/services/surveys.service';
import { Link } from 'react-router-dom';

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  text: 'ข้อความ',
  radio: 'เลือกตอบ 1 ข้อ',
  checkbox: 'เลือกตอบหลายข้อ',
  rating_5: 'ให้คะแนน 1-5',
  rating_10: 'ให้คะแนน 1-10',
  nps: 'NPS (0-10 + ความเห็น)',
};

type DraftQuestion = Omit<SurveyQuestion, 'id' | 'survey_id'>;

export const SurveyManagement = () => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', audience: 'parents' as any, is_anonymous: true });
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const { data: surveys = [] } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: () => surveysService.listAll(),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['survey-responses', activeSurveyId],
    enabled: !!activeSurveyId,
    queryFn: () => surveysService.listResponses(activeSurveyId!),
  });

  const create = useMutation({
    mutationFn: () =>
      surveysService.create({
        title: form.title,
        description: form.description || undefined,
        audience: form.audience,
        is_anonymous: form.is_anonymous,
        questions: questions.map((q, idx) => ({ ...q, order_index: idx + 1 })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-surveys'] });
      setCreateOpen(false);
      setForm({ title: '', description: '', audience: 'parents' as any, is_anonymous: true });
      setQuestions([]);
      toast.success('สร้างสำเร็จ — กดเปิดเผยแพร่');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      surveysService.togglePublish(id, is_published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-surveys'] }),
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { order_index: questions.length + 1, question_text: '', type: 'text', options: null, is_required: false },
    ]);
  };

  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next);
  };

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            จัดการแบบสำรวจ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            สร้างแบบสำรวจสำหรับผู้ปกครอง/บุคลากร — รองรับ NPS, satisfaction, custom
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              แบบสำรวจใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>สร้างแบบสำรวจ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>หัวข้อ</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ความพึงพอใจต่อระบบ Kampai" />
              </div>
              <div>
                <Label>คำอธิบาย</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>กลุ่มเป้าหมาย</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกคน (Public)</SelectItem>
                      <SelectItem value="parents">ผู้ปกครอง</SelectItem>
                      <SelectItem value="staff">บุคลากร</SelectItem>
                      <SelectItem value="students">นักเรียน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <Switch id="anon" checked={form.is_anonymous} onCheckedChange={(v) => setForm({ ...form, is_anonymous: v })} />
                  <Label htmlFor="anon" className="ml-2 text-sm">ไม่ระบุตัวตน</Label>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label>คำถาม ({questions.length})</Label>
                  <Button size="sm" variant="outline" onClick={addQuestion}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    เพิ่มคำถาม
                  </Button>
                </div>
                {questions.map((q, i) => (
                  <div key={i} className="border border-border rounded-md p-3 space-y-2 mb-2 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">ข้อ {i + 1}</Badge>
                      <Select value={q.type} onValueChange={(v) => {
                        const next = [...questions];
                        next[i] = { ...q, type: v as QuestionType, options: ['radio', 'checkbox'].includes(v) ? [] : null };
                        setQuestions(next);
                      }}>
                        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                            <SelectItem key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => moveQuestion(i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      placeholder="คำถาม..."
                      value={q.question_text}
                      onChange={(e) => {
                        const next = [...questions];
                        next[i] = { ...q, question_text: e.target.value };
                        setQuestions(next);
                      }}
                    />
                    {['radio', 'checkbox'].includes(q.type) && (
                      <Textarea
                        rows={3}
                        placeholder="ตัวเลือก (1 ตัวเลือกต่อบรรทัด)"
                        value={(q.options ?? []).join('\n')}
                        onChange={(e) => {
                          const next = [...questions];
                          next[i] = { ...q, options: e.target.value.split('\n').filter(Boolean) };
                          setQuestions(next);
                        }}
                      />
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={q.is_required}
                        onCheckedChange={(v) => {
                          const next = [...questions];
                          next[i] = { ...q, is_required: v };
                          setQuestions(next);
                        }}
                      />
                      <span>บังคับตอบ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
              <Button
                onClick={() => create.mutate()}
                disabled={!form.title || !questions.length || create.isPending}
              >
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">รายการ ({surveys.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
            {!surveys.length && <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มี</p>}
            {surveys.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSurveyId(s.id)}
                className={`w-full text-left p-3 rounded-md transition ${
                  activeSurveyId === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate flex-1">{s.title}</p>
                  {s.is_published ? <Badge variant="default" className="text-[9px]">เผยแพร่</Badge> : <Badge variant="outline" className="text-[9px]">ร่าง</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.response_count} คำตอบ · {format(new Date(s.created_at), 'd MMM', { locale: th })}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {!activeSurvey ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              เลือกแบบสำรวจเพื่อดูคำตอบ
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{activeSurvey.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeSurvey.audience} · {activeSurvey.is_anonymous ? 'ไม่ระบุตัวตน' : 'ระบุตัวตน'} · {activeSurvey.response_count} คำตอบ
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/surveys/${activeSurvey.id}`} target="_blank">
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        ดูตัวอย่าง
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant={activeSurvey.is_published ? 'default' : 'outline'}
                      onClick={() => togglePublish.mutate({ id: activeSurvey.id, is_published: !activeSurvey.is_published })}
                    >
                      {activeSurvey.is_published ? 'ปิดเผยแพร่' : 'เปิดเผยแพร่'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  คำตอบ ({responses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!responses.length && (
                  <p className="text-center text-sm text-muted-foreground py-12">ยังไม่มีคำตอบ</p>
                )}
                <div className="space-y-2">
                  {responses.map((r) => (
                    <div key={r.id} className="border border-border rounded-md p-3 text-sm bg-card">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {format(new Date(r.submitted_at), 'd MMM yyyy HH:mm', { locale: th })}
                      </p>
                      {Object.entries(r.answers).map(([qid, val]) => (
                        <div key={qid} className="text-xs">
                          <span className="text-muted-foreground">Q{qid.slice(0, 8)}:</span> {String(val)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, GitMerge, KeyRound, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { integratedPlanService, type IntegratedPlanTopic, type TopicStatus } from '@/services/integrated-plan.service';
import { CURRICULUM_SUBJECTS, subjectLabel } from '@/lib/curriculumSubjects';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const STATUS: Record<TopicStatus, { label: string; className: string }> = {
  not_started: { label: 'ยังไม่สอน', className: 'border-border text-muted-foreground' },
  in_progress: { label: 'กำลังสอน', className: 'border-primary/30 bg-primary/10 text-primary' },
  taught: { label: 'สอนแล้ว', className: 'border-accent/40 bg-accent/10 text-foreground' },
};

const topicSchema = z.object({
  subject_key: z.string().min(1, 'กรุณาเลือกวิชา'),
  title: z.string().trim().min(1, 'กรุณาใส่ชื่อเรื่อง').max(180),
  essential_concept: z.string().trim().min(1, 'กรุณาใส่สาระสำคัญ'),
  keywords: z.string().optional(),
  note: z.string().optional(),
});
type TopicForm = z.infer<typeof topicSchema>;

const unitSchema = z.object({
  title: z.string().trim().min(1, 'กรุณาใส่ชื่อหน่วย').max(180),
  note: z.string().optional(),
});
type UnitForm = z.infer<typeof unitSchema>;

const cycleStatus = (status: TopicStatus): TopicStatus =>
  status === 'not_started' ? 'in_progress' : status === 'in_progress' ? 'taught' : 'not_started';

const tokenize = (topic: IntegratedPlanTopic) => {
  const stop = new Set(['และ', 'หรือ', 'ของ', 'จาก', 'เพื่อ', 'การ', 'ความ', 'เป็น', 'ที่', 'ใน', 'ได้', 'ให้']);
  return new Set(
    [...topic.keywords, topic.title, topic.essential_concept]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9ก-๙]+/)
      .filter((word) => word.length >= 3 && !stop.has(word)),
  );
};

const PinGate = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const { toast } = useToast();
  const status = useQuery({ queryKey: ['integrated-plan', 'pin-status'], queryFn: integratedPlanService.pinStatus });
  const submit = useMutation({
    mutationFn: async () => {
      if (!/^\d{6}$/.test(pin)) throw new Error('กรุณากรอก PIN ตัวเลข 6 หลัก');
      if (!status.data?.has_pin) {
        await integratedPlanService.setPin(pin);
        return { ok: true };
      }
      return integratedPlanService.verifyPin(pin);
    },
    onSuccess: (result) => {
      if (result.ok) onUnlock();
      else toast({ title: result.reason === 'locked' ? 'ถูกล็อกชั่วคราว 15 นาที' : 'PIN ไม่ถูกต้อง', variant: 'destructive' });
      setPin('');
    },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });
  const reset = useMutation({
    mutationFn: () => integratedPlanService.setPin(pin),
    onSuccess: () => { toast({ title: 'ตั้ง PIN ใหม่แล้ว' }); onUnlock(); },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center"><KeyRound className="mx-auto h-10 w-10 text-primary" /><CardTitle>{status.data?.has_pin ? 'ปลดล็อกแผนส่วนตัว' : 'ตั้ง PIN สำหรับอุปกรณ์นี้'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">{status.data?.has_pin ? 'กรอก PIN ตัวเลข 6 หลัก' : 'ใช้หลังจากกดรูปครู 5 ครั้งในครั้งถัดไป'}</p>
          <Input aria-label="PIN 6 หลัก" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-[0.45em]" onKeyDown={(e) => e.key === 'Enter' && submit.mutate()} />
          <Button className="w-full" disabled={submit.isPending || status.isLoading} onClick={() => submit.mutate()}>{submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}ปลดล็อก</Button>
          {status.data?.has_pin && <Button variant="ghost" className="w-full text-xs" disabled={!/^\d{6}$/.test(pin) || reset.isPending} onClick={() => reset.mutate()}>ลืม PIN — ตั้งใหม่ด้วยบัญชีที่ล็อกอินอยู่</Button>}
          <Button asChild variant="outline" className="w-full"><Link to="/teacher"><ArrowLeft className="mr-2 h-4 w-4" />กลับหน้าครู</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherIntegratedPlan = () => {
  const { user, staffId } = useAuth();
  const unlockKey = `integrated-plan-unlocked:${user?.id ?? ''}`;
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(unlockKey) === 'yes');
  const [subject, setSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [topicOpen, setTopicOpen] = useState(false);
  const [editing, setEditing] = useState<IntegratedPlanTopic | null>(null);
  const [unitTopicIds, setUnitTopicIds] = useState<string[]>([]);
  const [unitOpen, setUnitOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const topicsQuery = useQuery({
    queryKey: ['integrated-plan', staffId, 'ป.4', 'topics'],
    enabled: unlocked && !!staffId,
    queryFn: async () => { await integratedPlanService.initialize(); return integratedPlanService.listTopics(); },
  });
  const unitsQuery = useQuery({ queryKey: ['integrated-plan', staffId, 'units'], enabled: unlocked && !!staffId, queryFn: integratedPlanService.listUnits });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['integrated-plan', staffId] });

  const statusMutation = useMutation({ mutationFn: ({ id, value }: { id: string; value: TopicStatus }) => integratedPlanService.updateStatus(id, value), onSuccess: invalidate });
  const deleteTopic = useMutation({ mutationFn: integratedPlanService.deleteTopic, onSuccess: () => { invalidate(); toast({ title: 'ลบหัวข้อแล้ว' }); } });
  const deleteUnit = useMutation({ mutationFn: integratedPlanService.deleteUnit, onSuccess: () => { invalidate(); toast({ title: 'ยกเลิกหน่วยบูรณาการแล้ว' }); } });

  const topicForm = useForm<TopicForm>({ resolver: zodResolver(topicSchema), defaultValues: { subject_key: 'thai', title: '', essential_concept: '', keywords: '', note: '' } });
  const unitForm = useForm<UnitForm>({ resolver: zodResolver(unitSchema), defaultValues: { title: '', note: '' } });
  const saveTopic = useMutation({
    mutationFn: async (values: TopicForm) => {
      if (!staffId) throw new Error('ไม่พบบัญชีบุคลากร');
      const input = { ...values, keywords: (values.keywords ?? '').split(',').map((x) => x.trim()).filter(Boolean) };
      if (editing) await integratedPlanService.updateTopic(editing.id, input);
      else await integratedPlanService.createTopic(staffId, input);
    },
    onSuccess: () => { invalidate(); setTopicOpen(false); setEditing(null); topicForm.reset(); toast({ title: 'บันทึกหัวข้อแล้ว' }); },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });
  const saveUnit = useMutation({
    mutationFn: (values: UnitForm) => integratedPlanService.createUnit(staffId!, values.title, values.note ?? '', unitTopicIds),
    onSuccess: () => { invalidate(); setUnitOpen(false); setUnitTopicIds([]); unitForm.reset(); toast({ title: 'สร้างหน่วยบูรณาการแล้ว' }); },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });

  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);
  const filtered = topics.filter((t) => (subject === 'all' || t.subject_key === subject) && (statusFilter === 'all' || t.status === statusFilter) && `${t.title} ${t.essential_concept}`.toLowerCase().includes(search.toLowerCase()));
  const taught = topics.filter((t) => t.status === 'taught').length;
  const stats = CURRICULUM_SUBJECTS.map((s) => { const rows = topics.filter((t) => t.subject_key === s.key); return { ...s, total: rows.length, taught: rows.filter((t) => t.status === 'taught').length }; });
  const suggestions = useMemo(() => {
    const pairs: Array<{ a: IntegratedPlanTopic; b: IntegratedPlanTopic; shared: string[] }> = [];
    for (let i = 0; i < topics.length; i += 1) for (let j = i + 1; j < topics.length; j += 1) {
      if (topics[i].subject_key === topics[j].subject_key) continue;
      const aWords = tokenize(topics[i]);
      const shared = [...tokenize(topics[j])].filter((word) => aWords.has(word));
      if (shared.length) pairs.push({ a: topics[i], b: topics[j], shared: shared.slice(0, 3) });
    }
    return pairs.sort((a, b) => b.shared.length - a.shared.length).slice(0, 8);
  }, [topics]);

  if (!unlocked) return <PinGate onUnlock={() => { sessionStorage.setItem(unlockKey, 'yes'); setUnlocked(true); }} />;
  if (!staffId) return <div className="min-h-screen bg-background p-8 text-center text-muted-foreground">บัญชีนี้ยังไม่ได้ผูกกับข้อมูลครู จึงไม่สามารถเปิดแผนส่วนตัวได้</div>;

  const openEdit = (topic: IntegratedPlanTopic) => { setEditing(topic); topicForm.reset({ subject_key: topic.subject_key, title: topic.title, essential_concept: topic.essential_concept, keywords: topic.keywords.join(', '), note: topic.note ?? '' }); setTopicOpen(true); };
  const openCreate = () => { setEditing(null); topicForm.reset({ subject_key: subject === 'all' ? 'thai' : subject, title: '', essential_concept: '', keywords: '', note: '' }); setTopicOpen(true); };
  const openSuggestedUnit = (ids: string[], title: string) => { setUnitTopicIds(ids); unitForm.reset({ title, note: '' }); setUnitOpen(true); };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><div><Button asChild variant="ghost" size="sm" className="mb-1"><Link to="/teacher"><ArrowLeft className="mr-1 h-4 w-4" />หน้าครู</Link></Button><h1 className="text-xl font-bold sm:text-2xl">แผนการสอนบูรณาการ ป.4</h1><p className="text-sm text-muted-foreground">Do List ส่วนตัว · 8 กลุ่มสาระ</p></div><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />เพิ่มหัวข้อ</Button></div></header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">ความคืบหน้ารวม</p><p className="text-3xl font-bold">{topics.length ? Math.round(taught / topics.length * 100) : 0}%</p><Progress value={topics.length ? taught / topics.length * 100 : 0} className="mt-3" /></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">สอนแล้ว</p><p className="text-3xl font-bold">{taught}<span className="ml-1 text-base font-normal text-muted-foreground">/ {topics.length} หัวข้อ</span></p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">กำลังสอน</p><p className="text-3xl font-bold">{topics.filter((t) => t.status === 'in_progress').length}</p></CardContent></Card></section>
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{stats.map((s) => <button key={s.key} onClick={() => setSubject(s.key)} className={cn('rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted', subject === s.key && 'ring-2 ring-primary')}><p className="line-clamp-2 text-xs font-semibold">{s.label}</p><p className="mt-2 text-xs text-muted-foreground">{s.taught}/{s.total}</p><Progress value={s.total ? s.taught / s.total * 100 : 0} className="mt-1 h-1.5" /></button>)}</section>
        <section className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาหัวข้อหรือสาระสำคัญ" className="pl-9" /></div><Select value={subject} onValueChange={setSubject}><SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกวิชา</SelectItem>{CURRICULUM_SUBJECTS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกสถานะ</SelectItem>{Object.entries(STATUS).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}</SelectItem>)}</SelectContent></Select></section>
        {topicsQuery.isLoading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div> : topicsQuery.isError ? <Card><CardContent className="py-10 text-center text-destructive">โหลดข้อมูลไม่สำเร็จ: {(topicsQuery.error as Error).message}</CardContent></Card> : <section className="space-y-3">{filtered.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">ไม่พบหัวข้อที่ตรงกับตัวกรอง</CardContent></Card>}{filtered.map((topic) => { const indicators = topic.integrated_plan_topic_indicators.map((x) => x.curriculum_indicators).filter(Boolean) as NonNullable<(typeof topic.integrated_plan_topic_indicators)[number]['curriculum_indicators']>[]; return <Card key={topic.id}><CardContent className="flex gap-3 p-4"><button aria-label={`เปลี่ยนสถานะ ${topic.title}`} onClick={() => statusMutation.mutate({ id: topic.id, value: cycleStatus(topic.status) })} className="mt-1 h-10 w-10 shrink-0 rounded-full border border-border flex items-center justify-center hover:bg-muted">{topic.status === 'taught' ? <CheckCircle2 className="h-6 w-6 text-primary" /> : topic.status === 'in_progress' ? <BookOpen className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{subjectLabel(topic.subject_key)}</Badge><Badge variant="outline" className={STATUS[topic.status].className}>{STATUS[topic.status].label}</Badge>{topic.is_custom && <Badge variant="secondary">เพิ่มเอง</Badge>}</div><h2 className="mt-2 font-semibold">{topic.title}</h2><p className="mt-1 text-sm text-muted-foreground">{topic.essential_concept}</p>{indicators.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{indicators.map((indicator) => <Badge key={indicator.id} variant="secondary" title={indicator.description}>{indicator.indicator_code}</Badge>)}</div>}{topic.note && <p className="mt-2 text-xs text-muted-foreground">บันทึก: {topic.note}</p>}</div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="แก้ไขหัวข้อ" onClick={() => openEdit(topic)}><Pencil className="h-4 w-4" /></Button>{topic.is_custom && <Button size="icon" variant="ghost" aria-label="ลบหัวข้อ" onClick={() => deleteTopic.mutate(topic.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></CardContent></Card>; })}</section>}
        <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitMerge className="h-5 w-5 text-primary" />คำแนะนำบูรณาการ</CardTitle></CardHeader><CardContent className="space-y-3">{suggestions.length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่พบคำสำคัญร่วม ลองเพิ่มคำสำคัญในหัวข้อ</p> : suggestions.map((pair) => <div key={`${pair.a.id}-${pair.b.id}`} className="rounded-lg border border-border p-3"><div className="flex flex-wrap gap-1"><Badge>{subjectLabel(pair.a.subject_key)}</Badge><Badge variant="secondary">{subjectLabel(pair.b.subject_key)}</Badge></div><p className="mt-2 text-sm font-medium">{pair.a.title} × {pair.b.title}</p><p className="mt-1 text-xs text-muted-foreground">สัมพันธ์จากคำว่า “{pair.shared.join(' · ')}”</p><Button size="sm" variant="outline" className="mt-2" onClick={() => openSuggestedUnit([pair.a.id, pair.b.id], `${pair.a.title} × ${pair.b.title}`)}>ยืนยันการบูรณาการ</Button></div>)}</CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">หน่วยบูรณาการของฉัน</CardTitle><Button size="sm" variant="outline" onClick={() => { setUnitTopicIds([]); unitForm.reset(); setUnitOpen(true); }}><Plus className="mr-1 h-4 w-4" />สร้างเอง</Button></div></CardHeader><CardContent className="space-y-3">{(unitsQuery.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มีหน่วยที่ยืนยันแล้ว</p> : unitsQuery.data?.map((unit) => <div key={unit.id} className="flex items-start justify-between rounded-lg border border-border p-3"><div><p className="font-medium">{unit.title}</p><p className="text-xs text-muted-foreground">{unit.integrated_plan_unit_topics.length} หัวข้อ{unit.note ? ` · ${unit.note}` : ''}</p></div><Button size="icon" variant="ghost" aria-label="ลบหน่วย" onClick={() => deleteUnit.mutate(unit.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</CardContent></Card></section>
      </div>

      <Dialog open={topicOpen} onOpenChange={setTopicOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อส่วนตัว'}</DialogTitle></DialogHeader><Form {...topicForm}><form onSubmit={topicForm.handleSubmit((v) => saveTopic.mutate(v))} className="space-y-4"><FormField control={topicForm.control} name="subject_key" render={({ field }) => <FormItem><FormLabel>วิชา</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CURRICULUM_SUBJECTS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="title" render={({ field }) => <FormItem><FormLabel>เรื่อง</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="essential_concept" render={({ field }) => <FormItem><FormLabel>สาระสำคัญ</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="keywords" render={({ field }) => <FormItem><FormLabel>คำสำคัญ (คั่นด้วยจุลภาค)</FormLabel><FormControl><Input placeholder="สิ่งแวดล้อม, น้ำ, ชุมชน" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="note" render={({ field }) => <FormItem><FormLabel>บันทึกส่วนตัว</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="button" variant="outline" onClick={() => setTopicOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={saveTopic.isPending}>บันทึก</Button></DialogFooter></form></Form></DialogContent></Dialog>
      <Dialog open={unitOpen} onOpenChange={setUnitOpen}><DialogContent><DialogHeader><DialogTitle>สร้างหน่วยบูรณาการ</DialogTitle></DialogHeader><Form {...unitForm}><form onSubmit={unitForm.handleSubmit((v) => unitTopicIds.length >= 2 ? saveUnit.mutate(v) : toast({ title: 'กรุณาเลือกอย่างน้อย 2 หัวข้อจากต่างวิชา', variant: 'destructive' }))} className="space-y-4"><FormField control={unitForm.control} name="title" render={({ field }) => <FormItem><FormLabel>ชื่อหน่วย</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={unitForm.control} name="note" render={({ field }) => <FormItem><FormLabel>แนวทางการสอน</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} /><FormItem><FormLabel>เลือกหัวข้อจากอย่างน้อย 2 วิชา</FormLabel><div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">{topics.map((topic) => <label key={topic.id} className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-muted"><input type="checkbox" className="mt-1" checked={unitTopicIds.includes(topic.id)} onChange={(e) => setUnitTopicIds((ids) => e.target.checked ? [...ids, topic.id] : ids.filter((id) => id !== topic.id))} /><span className="text-sm"><strong>{subjectLabel(topic.subject_key)}</strong> · {topic.title}</span></label>)}</div></FormItem><DialogFooter><Button type="button" variant="outline" onClick={() => setUnitOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={saveUnit.isPending}>บันทึกหน่วย</Button></DialogFooter></form></Form></DialogContent></Dialog>
    </main>
  );
};

export default TeacherIntegratedPlan;

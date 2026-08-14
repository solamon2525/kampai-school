import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GitMerge, KeyRound, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { IntegratedPlanCurriculumList, TaughtTopicsSummary } from '@/components/teacher/integrated-plan/IntegratedPlanCurriculumList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CURRICULUM_SUBJECTS, subjectLabel } from '@/lib/curriculumSubjects';
import { cn } from '@/lib/utils';
import { integratedPlanService, type IntegratedPlanTopic, type TopicStatus } from '@/services/integrated-plan.service';

const STATUS: Record<TopicStatus, string> = { not_started: 'ยังไม่สอน', in_progress: 'กำลังสอน', taught: 'สอนแล้ว' };
const topicSchema = z.object({ subject_key: z.string().min(1), title: z.string().trim().min(1).max(180), essential_concept: z.string().trim().min(1), keywords: z.string().optional(), note: z.string().optional() });
const unitSchema = z.object({ title: z.string().trim().min(1, 'กรุณาใส่ชื่อหน่วย').max(180), note: z.string().optional() });
type TopicForm = z.infer<typeof topicSchema>;
type UnitForm = z.infer<typeof unitSchema>;
const cycleStatus = (status: TopicStatus): TopicStatus => status === 'not_started' ? 'in_progress' : status === 'in_progress' ? 'taught' : 'not_started';

const tokenize = (topic: IntegratedPlanTopic) => {
  const stop = new Set(['และ', 'หรือ', 'ของ', 'จาก', 'เพื่อ', 'การ', 'ความ', 'เป็น', 'ที่', 'ใน', 'ได้', 'ให้']);
  return new Set([...topic.keywords, topic.title, topic.essential_concept].join(' ').toLowerCase().split(/[^a-z0-9ก-๙]+/).filter((word) => word.length >= 3 && !stop.has(word)));
};

const PinGate = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const { toast } = useToast();
  const status = useQuery({ queryKey: ['integrated-plan', 'pin-status'], queryFn: integratedPlanService.pinStatus });
  const submit = useMutation({
    mutationFn: async () => {
      if (!/^\d{6}$/.test(pin)) throw new Error('กรุณากรอก PIN ตัวเลข 6 หลัก');
      if (!status.data?.has_pin) { await integratedPlanService.setPin(pin); return { ok: true }; }
      return integratedPlanService.verifyPin(pin);
    },
    onSuccess: (result) => {
      if (result.ok) onUnlock();
      else toast({ title: result.reason === 'locked' ? 'ถูกล็อกชั่วคราว 15 นาที' : 'PIN ไม่ถูกต้อง', variant: 'destructive' });
      setPin('');
    },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });
  const reset = useMutation({ mutationFn: () => integratedPlanService.setPin(pin), onSuccess: () => { toast({ title: 'ตั้ง PIN ใหม่แล้ว' }); onUnlock(); }, onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }) });
  return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md border-border"><CardHeader className="text-center"><KeyRound className="mx-auto h-10 w-10 text-primary" /><CardTitle>{status.data?.has_pin ? 'ปลดล็อกแผนส่วนตัว' : 'ตั้ง PIN สำหรับอุปกรณ์นี้'}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-center text-sm text-muted-foreground">{status.data?.has_pin ? 'กรอก PIN ตัวเลข 6 หลัก' : 'ใช้หลังจากกดรูปครู 5 ครั้งในครั้งถัดไป'}</p><Input aria-label="PIN 6 หลัก" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-[0.45em]" onKeyDown={(event) => event.key === 'Enter' && submit.mutate()} /><Button className="w-full" disabled={submit.isPending || status.isLoading} onClick={() => submit.mutate()}>{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}ปลดล็อก</Button>{status.data?.has_pin ? <Button variant="ghost" className="w-full text-xs" disabled={!/^\d{6}$/.test(pin) || reset.isPending} onClick={() => reset.mutate()}>ลืม PIN — ตั้งใหม่ด้วยบัญชีที่ล็อกอินอยู่</Button> : null}<Button asChild variant="outline" className="w-full"><Link to="/teacher"><ArrowLeft className="mr-2 h-4 w-4" />กลับหน้าครู</Link></Button></CardContent></Card></div>;
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
  const topicsKey = ['integrated-plan', staffId, 'ป.4', 'topics'] as const;
  const topicsQuery = useQuery({ queryKey: topicsKey, enabled: unlocked && !!staffId, queryFn: async () => { await integratedPlanService.initialize(); return integratedPlanService.listTopics(); } });
  const unitsQuery = useQuery({ queryKey: ['integrated-plan', staffId, 'units'], enabled: unlocked && !!staffId, queryFn: integratedPlanService.listUnits });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['integrated-plan', staffId] });
  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: TopicStatus }) => integratedPlanService.updateStatus(id, value),
    onMutate: async ({ id, value }) => { await queryClient.cancelQueries({ queryKey: topicsKey }); const previous = queryClient.getQueryData<IntegratedPlanTopic[]>(topicsKey); queryClient.setQueryData<IntegratedPlanTopic[]>(topicsKey, (current = []) => current.map((topic) => topic.id === id ? { ...topic, status: value } : topic)); return { previous }; },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(topicsKey, context.previous); toast({ title: 'เปลี่ยนสถานะไม่สำเร็จ', variant: 'destructive' }); },
    onSettled: invalidate,
  });
  const deleteTopic = useMutation({ mutationFn: integratedPlanService.deleteTopic, onSuccess: () => { invalidate(); toast({ title: 'ลบหัวข้อแล้ว' }); } });
  const deleteUnit = useMutation({ mutationFn: integratedPlanService.deleteUnit, onSuccess: () => { invalidate(); toast({ title: 'ยกเลิกหน่วยบูรณาการแล้ว' }); } });
  const topicForm = useForm<TopicForm>({ resolver: zodResolver(topicSchema), defaultValues: { subject_key: 'thai', title: '', essential_concept: '', keywords: '', note: '' } });
  const unitForm = useForm<UnitForm>({ resolver: zodResolver(unitSchema), defaultValues: { title: '', note: '' } });
  const saveTopic = useMutation({
    mutationFn: async (values: TopicForm) => {
      if (!staffId) throw new Error('ไม่พบบัญชีบุคลากร');
      const input = { ...values, keywords: (values.keywords ?? '').split(',').map((word) => word.trim()).filter(Boolean) };
      if (editing) await integratedPlanService.updateTopic(editing.id, editing.is_custom ? input : { note: values.note ?? '' });
      else await integratedPlanService.createTopic(staffId, input);
    },
    onSuccess: () => { invalidate(); setTopicOpen(false); setEditing(null); topicForm.reset(); toast({ title: 'บันทึกหัวข้อแล้ว' }); },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });
  const saveUnit = useMutation({ mutationFn: (values: UnitForm) => integratedPlanService.createUnit(staffId!, values.title, values.note ?? '', unitTopicIds), onSuccess: () => { invalidate(); setUnitOpen(false); setUnitTopicIds([]); unitForm.reset(); toast({ title: 'สร้างหน่วยบูรณาการแล้ว' }); }, onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }) });
  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);
  const filtered = topics.filter((topic) => {
    const indicators = topic.integrated_plan_topic_indicators.map((row) => row.curriculum_indicators).filter(Boolean);
    const searchable = `${topic.title} ${topic.essential_concept} ${indicators.map((indicator) => `${indicator?.indicator_code} ${indicator?.standard_code} ${indicator?.strand_title} ${indicator?.description}`).join(' ')}`.toLowerCase();
    return (subject === 'all' || topic.subject_key === subject) && (statusFilter === 'all' || topic.status === statusFilter) && searchable.includes(search.toLowerCase());
  });
  const taught = topics.filter((topic) => topic.status === 'taught').length;
  const stats = CURRICULUM_SUBJECTS.map((item) => { const rows = topics.filter((topic) => topic.subject_key === item.key); return { ...item, total: rows.length, taught: rows.filter((topic) => topic.status === 'taught').length }; });
  const suggestions = useMemo(() => {
    const pairs: Array<{ a: IntegratedPlanTopic; b: IntegratedPlanTopic; shared: string[] }> = [];
    for (let first = 0; first < topics.length; first += 1) for (let second = first + 1; second < topics.length; second += 1) {
      if (topics[first].subject_key === topics[second].subject_key) continue;
      const firstWords = tokenize(topics[first]);
      const shared = [...tokenize(topics[second])].filter((word) => firstWords.has(word));
      if (shared.length) pairs.push({ a: topics[first], b: topics[second], shared: shared.slice(0, 3) });
    }
    return pairs.sort((a, b) => b.shared.length - a.shared.length).slice(0, 8);
  }, [topics]);
  if (!unlocked) return <PinGate onUnlock={() => { sessionStorage.setItem(unlockKey, 'yes'); setUnlocked(true); }} />;
  if (!staffId) return <div className="min-h-screen bg-background p-8 text-center text-muted-foreground">บัญชีนี้ยังไม่ได้ผูกกับข้อมูลครู จึงไม่สามารถเปิดแผนส่วนตัวได้</div>;
  const openEdit = (topic: IntegratedPlanTopic) => { setEditing(topic); topicForm.reset({ subject_key: topic.subject_key, title: topic.title, essential_concept: topic.essential_concept, keywords: topic.keywords.join(', '), note: topic.note ?? '' }); setTopicOpen(true); };
  const openCreate = () => { setEditing(null); topicForm.reset({ subject_key: subject === 'all' ? 'thai' : subject, title: '', essential_concept: '', keywords: '', note: '' }); setTopicOpen(true); };
  const openSuggestedUnit = (ids: string[], title: string) => { setUnitTopicIds(ids); unitForm.reset({ title, note: '' }); setUnitOpen(true); };
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><div><Button asChild variant="ghost" size="sm" className="mb-1"><Link to="/teacher"><ArrowLeft className="mr-1 h-4 w-4" />หน้าครู</Link></Button><h1 className="text-xl font-bold sm:text-2xl">แผนการสอนบูรณาการ ป.4</h1><p className="text-sm text-muted-foreground">รายการตัวชี้วัดรายข้อ · 8 กลุ่มสาระ</p></div><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />เพิ่มหัวข้อ</Button></div></header>
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">ความคืบหน้ารวม</p><p className="text-3xl font-bold">{topics.length ? Math.round(taught / topics.length * 100) : 0}%</p><Progress value={topics.length ? taught / topics.length * 100 : 0} className="mt-3" /></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">สอนแล้ว</p><p className="text-3xl font-bold">{taught}<span className="ml-1 text-base font-normal text-muted-foreground">/ {topics.length} รายการ</span></p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">กำลังสอน</p><p className="text-3xl font-bold">{topics.filter((topic) => topic.status === 'in_progress').length}</p></CardContent></Card></section>
      <TaughtTopicsSummary topics={topics} />
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{stats.map((item) => <button type="button" key={item.key} onClick={() => setSubject(item.key)} className={cn('rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted', subject === item.key && 'ring-2 ring-primary')}><p className="line-clamp-2 text-xs font-semibold">{item.label}</p><p className="mt-2 text-xs text-muted-foreground">{item.taught}/{item.total}</p><Progress value={item.total ? item.taught / item.total * 100 : 0} className="mt-1 h-1.5" /></button>)}</section>
      <section className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหารหัสตัวชี้วัด สาระ มาตรฐาน หรือเนื้อหา" className="pl-9" /></div><Select value={subject} onValueChange={setSubject}><SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกวิชา</SelectItem>{CURRICULUM_SUBJECTS.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกสถานะ</SelectItem>{Object.entries(STATUS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></section>
      {topicsQuery.isLoading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div> : topicsQuery.isError ? <Card><CardContent className="py-10 text-center text-destructive">โหลดข้อมูลไม่สำเร็จ: {(topicsQuery.error as Error).message}</CardContent></Card> : <IntegratedPlanCurriculumList topics={filtered} onStatusChange={(topic) => statusMutation.mutate({ id: topic.id, value: cycleStatus(topic.status) })} onEdit={openEdit} onDelete={(topic) => deleteTopic.mutate(topic.id)} />}
      <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitMerge className="h-5 w-5 text-primary" />คำแนะนำบูรณาการ</CardTitle></CardHeader><CardContent className="space-y-3">{suggestions.length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่พบคำสำคัญร่วม</p> : suggestions.map((pair) => <div key={`${pair.a.id}-${pair.b.id}`} className="rounded-lg border border-border p-3"><div className="flex flex-wrap gap-1"><Badge>{subjectLabel(pair.a.subject_key)}</Badge><Badge variant="secondary">{subjectLabel(pair.b.subject_key)}</Badge></div><p className="mt-2 text-sm font-medium">{pair.a.title} × {pair.b.title}</p><p className="mt-1 text-xs text-muted-foreground">สัมพันธ์จาก “{pair.shared.join(' · ')}”</p><Button size="sm" variant="outline" className="mt-2" onClick={() => openSuggestedUnit([pair.a.id, pair.b.id], `${pair.a.title} × ${pair.b.title}`)}>ยืนยันการบูรณาการ</Button></div>)}</CardContent></Card><Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">หน่วยบูรณาการของฉัน</CardTitle><Button size="sm" variant="outline" onClick={() => { setUnitTopicIds([]); unitForm.reset(); setUnitOpen(true); }}><Plus className="mr-1 h-4 w-4" />สร้างเอง</Button></div></CardHeader><CardContent className="space-y-3">{(unitsQuery.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มีหน่วยที่ยืนยันแล้ว</p> : unitsQuery.data?.map((unit) => <div key={unit.id} className="flex items-start justify-between rounded-lg border border-border p-3"><div><p className="font-medium">{unit.title}</p><p className="text-xs text-muted-foreground">{unit.integrated_plan_unit_topics.length} รายการ{unit.note ? ` · ${unit.note}` : ''}</p></div><Button size="icon" variant="ghost" aria-label="ลบหน่วย" onClick={() => deleteUnit.mutate(unit.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</CardContent></Card></section>
    </div>
    <Dialog open={topicOpen} onOpenChange={setTopicOpen}><DialogContent><DialogHeader><DialogTitle>{editing?.is_custom === false ? 'บันทึกโน้ตตัวชี้วัด' : editing ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อส่วนตัว'}</DialogTitle></DialogHeader><Form {...topicForm}><form onSubmit={topicForm.handleSubmit((values) => saveTopic.mutate(values))} className="space-y-4">{editing?.is_custom === false ? <div className="rounded-md border border-border bg-muted p-3"><p className="text-sm font-semibold">{editing.title}</p><p className="mt-1 text-sm text-muted-foreground">{editing.essential_concept}</p></div> : <><FormField control={topicForm.control} name="subject_key" render={({ field }) => <FormItem><FormLabel>วิชา</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CURRICULUM_SUBJECTS.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="title" render={({ field }) => <FormItem><FormLabel>เรื่อง</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="essential_concept" render={({ field }) => <FormItem><FormLabel>สาระสำคัญ</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={topicForm.control} name="keywords" render={({ field }) => <FormItem><FormLabel>คำสำคัญ (คั่นด้วยจุลภาค)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /></>}<FormField control={topicForm.control} name="note" render={({ field }) => <FormItem><FormLabel>บันทึกส่วนตัว</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="button" variant="outline" onClick={() => setTopicOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={saveTopic.isPending}>บันทึก</Button></DialogFooter></form></Form></DialogContent></Dialog>
    <Dialog open={unitOpen} onOpenChange={setUnitOpen}><DialogContent><DialogHeader><DialogTitle>สร้างหน่วยบูรณาการ</DialogTitle></DialogHeader><Form {...unitForm}><form onSubmit={unitForm.handleSubmit((values) => unitTopicIds.length >= 2 ? saveUnit.mutate(values) : toast({ title: 'กรุณาเลือกอย่างน้อย 2 รายการจากต่างวิชา', variant: 'destructive' }))} className="space-y-4"><FormField control={unitForm.control} name="title" render={({ field }) => <FormItem><FormLabel>ชื่อหน่วย</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={unitForm.control} name="note" render={({ field }) => <FormItem><FormLabel>แนวทางการสอน</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} /><FormItem><FormLabel>เลือกจากอย่างน้อย 2 วิชา</FormLabel><div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">{topics.map((topic) => <label key={topic.id} className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-muted"><input type="checkbox" className="mt-1" checked={unitTopicIds.includes(topic.id)} onChange={(event) => setUnitTopicIds((ids) => event.target.checked ? [...ids, topic.id] : ids.filter((id) => id !== topic.id))} /><span className="text-sm"><strong>{subjectLabel(topic.subject_key)}</strong> · {topic.title}</span></label>)}</div></FormItem><DialogFooter><Button type="button" variant="outline" onClick={() => setUnitOpen(false)}>ยกเลิก</Button><Button type="submit" disabled={saveUnit.isPending}>บันทึกหน่วย</Button></DialogFooter></form></Form></DialogContent></Dialog>
  </main>;
};

export default TeacherIntegratedPlan;

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dices, History, Trophy } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from './teacher-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { studentsService, type StudentMin } from '@/services/students.service';
import { classroomCompetitionService } from '@/services/classroom-competition.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  className: z.string().min(1),
  activityKey: z.enum(['math24', 'improper_to_mixed', 'mixed_to_improper', 'fraction_add_sub', 'mixed']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionDistribution: z.enum(['shared', 'equivalent']),
  questionCount: z.coerce.number().refine((value) => [10, 20, 30].includes(value)),
  durationMinutes: z.coerce.number().min(1).max(120),
});
type FormValues = z.infer<typeof schema>;

const activityLabels = {
  math24: 'เกม 24', improper_to_mixed: 'เศษเกินเป็นจำนวนคละ', mixed_to_improper: 'จำนวนคละเป็นเศษเกิน',
  fraction_add_sub: 'บวก/ลบเศษส่วนตัวส่วนเท่ากัน', mixed: 'ผสม 4 รูปแบบ',
};

function seededShuffle<T>(items: T[], seed: number) {
  let state = seed >>> 0;
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

export default function TeacherClassroomCompetitions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<[StudentMin[], StudentMin[]]>([[], []]);
  const [seed, setSeed] = useState(() => Date.now() % 2147483647);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState({ className: '', activityKey: '', dateFrom: '', dateTo: '' });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { className: 'ป.4', activityKey: 'math24', difficulty: 'medium', questionDistribution: 'shared', questionCount: 10, durationMinutes: 15 },
  });
  const className = form.watch('className');
  const { data: students = [] } = useQuery({
    queryKey: ['students', 'classroom-competition', className],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(className);
      if (error) throw error;
      return (data ?? []) as StudentMin[];
    },
  });
  const { data: history } = useQuery({
    queryKey: ['classroom-competitions', 'history', historyFilters],
    queryFn: () => classroomCompetitionService.getHistory({
      className: historyFilters.className || undefined,
      activityKey: historyFilters.activityKey || undefined,
      dateFrom: historyFilters.dateFrom ? `${historyFilters.dateFrom}T00:00:00+07:00` : undefined,
      dateTo: historyFilters.dateTo ? `${historyFilters.dateTo}T23:59:59+07:00` : undefined,
    }),
  });
  useEffect(() => { setPresentIds(students.map((student) => student.id)); setTeams([[], []]); }, [students]);

  const randomize = () => {
    const nextSeed = seed + 1;
    const selected = students.filter((student) => presentIds.includes(student.id));
    const shuffled = seededShuffle(selected, nextSeed);
    setTeams([shuffled.filter((_, index) => index % 2 === 0), shuffled.filter((_, index) => index % 2 === 1)]);
    setSeed(nextSeed);
  };
  const moveDragged = (target: 0 | 1) => {
    if (!draggedStudentId) return;
    const student = teams.flat().find((item) => item.id === draggedStudentId);
    if (!student) return;
    setTeams([teams[0].filter((item) => item.id !== student.id), teams[1].filter((item) => item.id !== student.id)].map((list, index) => index === target ? [...list, student] : list) as [StudentMin[], StudentMin[]]);
    setDraggedStudentId(null);
  };
  const createMutation = useMutation({
    mutationFn: (values: FormValues) => classroomCompetitionService.create({
      config: { ...values, questionCount: values.questionCount as 10 | 20 | 30, durationSeconds: values.durationMinutes * 60, seed },
      teams: [{ name: 'ทีมน้ำเงิน', studentIds: teams[0].map((student) => student.id) }, { name: 'ทีมทอง', studentIds: teams[1].map((student) => student.id) }],
    }),
    onSuccess: ({ competition }) => {
      void queryClient.invalidateQueries({ queryKey: ['classroom-competitions'] });
      navigate(`/teacher/classroom-competitions/${competition.id}/host`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <RolePortalLayout title="แข่งใบงานสด" subtitle="ป.4 คณิตศาสตร์" menu={TEACHER_MENU} accent="teacher">
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div><h1 className="text-3xl font-bold">สนามแข่งขันในห้องเรียน</h1><p className="text-muted-foreground">จัดทีม เปิดห้อง และดูสถิติย้อนหลังในจุดเดียว</p></div>
          <Tabs defaultValue="create">
            <TabsList><TabsTrigger value="create"><Trophy className="mr-2 h-4 w-4" />สร้างการแข่งขัน</TabsTrigger><TabsTrigger value="history"><History className="mr-2 h-4 w-4" />ประวัติและสถิติ</TabsTrigger></TabsList>
            <TabsContent value="create" className="mt-5">
              <Form {...form}><form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card><CardHeader><CardTitle>1. ตั้งค่าการแข่งขัน</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="className" render={({ field }) => <FormItem><FormLabel>ห้องเรียน</FormLabel><FormControl><Input {...field} placeholder="ป.4" /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="activityKey" render={({ field }) => <FormItem><FormLabel>หัวข้อ</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(activityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="difficulty" render={({ field }) => <FormItem><FormLabel>ระดับ</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="easy">ง่าย</SelectItem><SelectItem value="medium">กลาง</SelectItem><SelectItem value="hard">ยาก</SelectItem></SelectContent></Select></FormItem>} />
                  <FormField control={form.control} name="questionDistribution" render={({ field }) => <FormItem><FormLabel>ชุดโจทย์</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="shared">ชุดเดียวกัน</SelectItem><SelectItem value="equivalent">คนละชุด ระดับเท่ากัน</SelectItem></SelectContent></Select></FormItem>} />
                  <FormField control={form.control} name="questionCount" render={({ field }) => <FormItem><FormLabel>จำนวนข้อ</FormLabel><Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{[10, 20, 30].map((count) => <SelectItem key={count} value={String(count)}>{count} ข้อ</SelectItem>)}</SelectContent></Select></FormItem>} />
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => <FormItem><FormLabel>เวลารวม (นาที)</FormLabel><FormControl><Input type="number" min={1} max={120} {...field} /></FormControl></FormItem>} />
                  <div className="sm:col-span-2"><p className="mb-3 font-medium">นักเรียนที่มาเรียน ({presentIds.length})</p><div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-border p-3">{students.map((student) => <label key={student.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"><Checkbox checked={presentIds.includes(student.id)} onCheckedChange={(checked) => setPresentIds((current) => checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /><PersonAvatar name={student.name} photoUrl={student.photo_url} size="sm" /><span>{student.class_number}. {student.name}</span></label>)}</div></div>
                  <Button type="button" variant="secondary" className="sm:col-span-2" onClick={randomize} disabled={presentIds.length < 2}><Dices className="mr-2 h-4 w-4" />สุ่มทีมใหม่</Button>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>2. ตรวจและสลับสมาชิก</CardTitle></CardHeader><CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">ลากการ์ดนักเรียนข้ามฝั่งได้ก่อนล็อกรายชื่อ</p>
                  <div className="grid gap-4 sm:grid-cols-2">{teams.map((team, teamIndex) => <div key={teamIndex} onDragOver={(event) => event.preventDefault()} onDrop={() => moveDragged(teamIndex as 0 | 1)} className={cn('min-h-72 rounded-2xl border-2 border-dashed p-3', teamIndex === 0 ? 'border-primary/40 bg-primary/5' : 'border-accent/60 bg-accent/10')}><h3 className="mb-3 font-bold">{teamIndex === 0 ? 'ทีมน้ำเงิน' : 'ทีมทอง'} ({team.length})</h3>{team.map((student) => <div key={student.id} draggable onDragStart={() => setDraggedStudentId(student.id)} className="mb-2 flex cursor-grab items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm"><PersonAvatar name={student.name} photoUrl={student.photo_url} size="sm" /><span className="text-sm font-medium">{student.name}</span></div>)}</div>)}</div>
                  <Button type="submit" size="lg" className="h-14 w-full" disabled={createMutation.isPending || teams.some((team) => team.length === 0)}>{createMutation.isPending ? 'กำลังสร้างห้อง...' : 'ล็อกรายชื่อและเปิดห้อง'}</Button>
                </CardContent></Card>
              </form></Form>
            </TabsContent>
            <TabsContent value="history" className="mt-5 space-y-5">
              <Card><CardHeader><CardTitle>ตัวกรองประวัติ</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input aria-label="กรองชั้นเรียน" placeholder="ชั้น/ห้อง เช่น ป.4" value={historyFilters.className} onChange={(event) => setHistoryFilters((current) => ({ ...current, className: event.target.value }))} />
                <Select value={historyFilters.activityKey || 'all'} onValueChange={(value) => setHistoryFilters((current) => ({ ...current, activityKey: value === 'all' ? '' : value }))}><SelectTrigger><SelectValue placeholder="ทุกหัวข้อ" /></SelectTrigger><SelectContent><SelectItem value="all">ทุกหัวข้อ</SelectItem>{Object.entries(activityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                <Select value="math" disabled><SelectTrigger aria-label="วิชา"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="math">คณิตศาสตร์</SelectItem></SelectContent></Select>
                <Input aria-label="วันที่เริ่มต้น" type="date" value={historyFilters.dateFrom} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
                <Input aria-label="วันที่สิ้นสุด" type="date" value={historyFilters.dateTo} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateTo: event.target.value }))} />
              </CardContent></Card>
              <Tabs defaultValue="teams">
                <TabsList><TabsTrigger value="teams">รายทีม</TabsTrigger><TabsTrigger value="individual">รายบุคคล</TabsTrigger></TabsList>
                <TabsContent value="teams" className="mt-4"><Card><CardHeader><CardTitle>ผลทีมแต่ละแมตช์</CardTitle></CardHeader><CardContent className="space-y-4">{history?.matches.length ? history.matches.map((match) => <div key={match.id} className="rounded-2xl border border-border p-4"><button onClick={() => navigate(`/teacher/classroom-competitions/${match.id}/host`)} className="flex w-full items-center justify-between text-left"><div><p className="font-bold">{activityLabels[match.activity_key]} · {match.class_name}</p><p className="text-sm text-muted-foreground">{new Date(match.created_at).toLocaleString('th-TH')}</p></div><Badge variant={match.status === 'finished' ? 'default' : 'secondary'}>{match.status}</Badge></button><div className="mt-4 grid gap-3 md:grid-cols-2">{match.classroom_competition_teams?.map((team) => { const result = team.classroom_competition_results?.[0]; return <div key={team.id} className="rounded-xl bg-muted/60 p-3"><div className="flex items-center justify-between"><p className="font-bold">{team.name} · {team.score} คะแนน</p>{result && <Badge variant={result.outcome === 'winner' ? 'default' : 'secondary'}>{result.outcome === 'winner' ? 'ชนะ' : 'แพ้'} +{result.league_points}</Badge>}</div><div className="mt-3 flex -space-x-2">{team.classroom_competition_members?.map((member) => <PersonAvatar key={member.students.id} name={member.students.name} photoUrl={member.students.photo_url} size="sm" className="ring-2 ring-muted" />)}</div></div>; })}</div></div>) : <p className="text-muted-foreground">ไม่พบประวัติตามตัวกรอง</p>}</CardContent></Card></TabsContent>
                <TabsContent value="individual" className="mt-4"><Card><CardHeader><CardTitle>สถิติรายบุคคล แยกวิชา</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{history?.individual.map((row) => { const total = row.wins + row.losses; const winRate = total ? Math.round(row.wins / total * 100) : 0; return <div key={`${row.student.id}-${row.subjectKey}`} className="flex items-center gap-3 rounded-xl border border-border p-3"><PersonAvatar name={row.student.name} photoUrl={row.student.photo_url} /><div className="min-w-0 flex-1"><p className="font-bold">{row.student.name}</p><p className="text-sm text-muted-foreground">ชนะ {row.wins} · แพ้ {row.losses} · {row.leaguePoints} แต้ม</p></div><div className="text-right"><p className="font-bold">{winRate}% / {100 - winRate}%</p><p className="text-xs text-muted-foreground">ชนะ / แพ้</p></div></div>; })}</CardContent></Card></TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </RolePortalLayout>
  );
}

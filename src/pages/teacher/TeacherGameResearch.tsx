/**
 * TeacherGameResearch — หน้าวิจัยการเล่นเกมแยกจากวิเคราะห์คะแนนทั่วไป
 * Route: /teacher/game-research
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical,
  Gamepad2,
  Copy,
  FileText,
  Download,
  Loader2,
  Link2,
  CalendarRange,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { educationalHubService, type EduHubItem } from '@/services/educational-hub.service';
import { studentsService } from '@/services/students.service';
import { staffService } from '@/services/staff.service';
import {
  gameResearchService,
  GAME_MODE_OPTIONS,
  DEFAULT_GAME_MODES,
  buildResearchEntryUrl,
  modeLabel,
  researchPhaseLabel,
  type GameResearchStudy,
  type ResearchPhase,
} from '@/services/game-research.service';
import { printClassroomResearchDoc } from '@/components/teacher/game-analytics/printClassroomResearchDoc';
import { ResearchStudyQR } from '@/components/teacher/game-research/ResearchStudyQR';

const MENU = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: FlaskConical, path: '/teacher' },
  { id: 'game-research', label: 'วิจัยเกม', icon: FlaskConical, path: '/teacher/game-research' },
  { id: 'edu-hub', label: 'คลังสื่อของฉัน', icon: Gamepad2, path: '/teacher/edu-hub' },
];

const CLASS_OPTIONS = [
  'อ.1', 'อ.2', 'อ.3',
  'ป.1', 'ป.2', 'ป.3',
  'ป.4', 'ป.5', 'ป.6',
  'ม.1', 'ม.2', 'ม.3',
  'ม.4', 'ม.5', 'ม.6',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const studySchema = z.object({
  title: z.string().min(3, 'กรุณาระบุชื่อโครงการ'),
  game_slug: z.string().min(1, 'เลือกเกม'),
  game_mode: z.string().min(1, 'เลือกโหมด'),
  class_name: z.string().min(1, 'เลือกชั้นเรียน'),
  pretest_start: z.string().min(1),
  pretest_end: z.string().min(1),
  posttest_start: z.string().min(1),
  posttest_end: z.string().min(1),
  max_rounds_per_day: z.coerce.number().min(1).max(20),
  consent_confirmed: z.boolean().refine((v) => v, 'ต้องยืนยันความยินยอม'),
  show_on_homepage: z.boolean().default(true),
});

type StudyFormValues = z.infer<typeof studySchema>;

const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
const stddev = (arr: number[]) => {
  if (!arr.length) return 0;
  const m = avg(arr);
  return Math.sqrt(avg(arr.map((x) => (x - m) ** 2)));
};

type SessionPhaseInput = {
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

function getSessionResearchPhase(s: SessionPhaseInput, study: GameResearchStudy): ResearchPhase | null {
  const phase = s.metadata?.research_phase;
  if (phase === 'pretest' || phase === 'posttest') return phase;

  const t = new Date(s.created_at).getTime();
  const preStart = new Date(`${study.pretest_start}T00:00:00`).getTime();
  const preEnd = new Date(`${study.pretest_end}T23:59:59`).getTime();
  const postStart = new Date(`${study.posttest_start}T00:00:00`).getTime();
  const postEnd = new Date(`${study.posttest_end}T23:59:59`).getTime();
  const inPretest = t >= preStart && t <= preEnd;
  const inPosttest = t >= postStart && t <= postEnd;

  if (inPretest && !inPosttest) return 'pretest';
  if (inPosttest && !inPretest) return 'posttest';
  return null;
}

function exportSessionsCsv(
  study: GameResearchStudy,
  sessions: Awaited<ReturnType<typeof gameResearchService.getSessions>>['data'],
) {
  const rows = sessions ?? [];
  const header = ['วันที่', 'เวลา', 'ช่วงวิจัย', 'รหัสนักเรียน', 'ชื่อ', 'เลขที่', 'คะแนน', 'โหมด', 'ระยะเวลา(วิ)', 'รอบในวัน'];
  const byStudentDay = new Map<string, number>();

  const lines = rows.map((s) => {
    const st = s.students;
    const day = s.created_at.slice(0, 10);
    const key = `${s.student_id}|${day}`;
    const round = (byStudentDay.get(key) ?? 0) + 1;
    byStudentDay.set(key, round);
    const phase = getSessionResearchPhase(s, study);
    return [
      day,
      new Date(s.created_at).toLocaleTimeString('th-TH'),
      phase ? researchPhaseLabel(phase) : '',
      st.student_code ?? '',
      st.name,
      String(st.class_number ?? ''),
      String(s.score),
      s.mode ?? '',
      s.duration_sec != null ? String(s.duration_sec) : '',
      String(round),
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-${study.game_slug}-${study.class_name}-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherGameResearch() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: link } = useLinkedRecord();
  const staffId = link?.staff_id ?? null;
  const { settings: schoolSettings } = useSchoolSettings();

  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docProblem, setDocProblem] = useState('');
  const [docObjectives, setDocObjectives] = useState('');
  const [docConclusion, setDocConclusion] = useState('');

  const myGamesQuery = useQuery({
    queryKey: ['edu-hub', 'items', 'mine', 'tracked', staffId],
    queryFn: async () => {
      const { data, error } = await educationalHubService.listMyItems(staffId!);
      if (error) throw error;
      return ((data ?? []) as EduHubItem[]).filter((g) => g.tracked_game && g.game_slug);
    },
    enabled: !!staffId,
  });

  const studiesQuery = useQuery({
    queryKey: ['game-research-studies', staffId],
    queryFn: async () => {
      const { data, error } = await gameResearchService.listByOwner(staffId!);
      if (error) throw error;
      return (data ?? []) as GameResearchStudy[];
    },
    enabled: !!staffId,
  });

  const activeStudy = useMemo(() => {
    const list = studiesQuery.data ?? [];
    if (!list.length) return null;
    if (selectedStudyId) return list.find((s) => s.id === selectedStudyId) ?? list[0];
    return list[0];
  }, [studiesQuery.data, selectedStudyId]);

  const studentsQuery = useQuery({
    queryKey: ['research-students', activeStudy?.class_name],
    queryFn: async () => {
      const { data } = await studentsService.getByClass(activeStudy!.class_name);
      return data ?? [];
    },
    enabled: !!activeStudy?.class_name,
  });

  const sessionsQuery = useQuery({
    queryKey: ['research-sessions', activeStudy?.id, activeStudy?.class_name],
    queryFn: async () => {
      const { data, error } = await gameResearchService.getSessions(
        activeStudy!.id,
        activeStudy!.class_name,
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeStudy?.id,
  });

  const staffQuery = useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      const { data } = await staffService.getById(staffId!);
      return data;
    },
    enabled: !!staffId,
  });

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      title: 'การพัฒนาทักษะสูตรคูณด้วยเกมแข่งสูตรคูณ',
      game_slug: 'multiply-race',
      game_mode: 'normal',
      class_name: 'ป.4',
      pretest_start: todayIso(),
      pretest_end: todayIso(),
      posttest_start: todayIso(),
      posttest_end: todayIso(),
      max_rounds_per_day: 4,
      consent_confirmed: true,
      show_on_homepage: true,
    },
  });

  const watchedGame = form.watch('game_slug');
  const modeOptions = GAME_MODE_OPTIONS[watchedGame] ?? DEFAULT_GAME_MODES;

  const createMutation = useMutation({
    mutationFn: async (values: StudyFormValues) => {
      const game = (myGamesQuery.data ?? []).find((g) => g.game_slug === values.game_slug);
      const { data, error } = await gameResearchService.create({
        owner_staff_id: staffId!,
        edu_hub_item_id: game?.id ?? null,
        title: values.title,
        game_slug: values.game_slug,
        game_mode: values.game_mode,
        class_name: values.class_name,
        pretest_start: values.pretest_start,
        pretest_end: values.pretest_end,
        posttest_start: values.posttest_start,
        posttest_end: values.posttest_end,
        max_rounds_per_day: values.max_rounds_per_day,
        consent_confirmed: values.consent_confirmed,
        show_on_homepage: values.show_on_homepage,
        is_active: true,
      });
      if (error) throw error;
      return data as GameResearchStudy;
    },
    onSuccess: (study) => {
      qc.invalidateQueries({ queryKey: ['game-research-studies'] });
      qc.invalidateQueries({ queryKey: ['research-studies-public'] });
      setSelectedStudyId(study.id);
      toast({ title: 'สร้างโครงการวิจัยแล้ว', description: 'คัดลอกลิงก์ให้นักเรียนได้เลย' });
    },
    onError: (e: Error) => {
      toast({ title: 'สร้างไม่สำเร็จ', description: e.message, variant: 'destructive' });
    },
  });

  const assignmentLink = useMemo(() => {
    if (!activeStudy) return '';
    return buildResearchEntryUrl(activeStudy.id);
  }, [activeStudy]);

  const homepageToggleMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      const { error } = await gameResearchService.update(activeStudy!.id, { show_on_homepage: checked });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game-research-studies'] });
      qc.invalidateQueries({ queryKey: ['research-studies-public'] });
    },
  });

  const researchResult = useMemo(() => {
    if (!activeStudy) return null;
    const sessions = sessionsQuery.data ?? [];
    const students = studentsQuery.data ?? [];

    const byStudent = new Map<string, { pre: number[]; post: number[] }>();
    sessions.forEach((s) => {
      const phase = getSessionResearchPhase(s, activeStudy);
      if (!phase) return;
      const entry = byStudent.get(s.student_id) ?? { pre: [], post: [] };
      if (phase === 'pretest') entry.pre.push(s.score);
      if (phase === 'posttest') entry.post.push(s.score);
      byStudent.set(s.student_id, entry);
    });

    const rows = students
      .map((student) => {
        const entry = byStudent.get(student.id);
        const pretestMean = entry && entry.pre.length > 0 ? avg(entry.pre) : null;
        const posttestMean = entry && entry.post.length > 0 ? avg(entry.post) : null;
        const gain = pretestMean !== null && posttestMean !== null ? posttestMean - pretestMean : null;
        return { student, pretestMean, posttestMean, gain, preRounds: entry?.pre.length ?? 0, postRounds: entry?.post.length ?? 0 };
      })
      .sort((a, b) => (a.student.class_number ?? 999) - (b.student.class_number ?? 999));

    const comparable = rows.filter((r) => r.gain !== null);
    const n = comparable.length;
    const meanPretest = n > 0 ? avg(comparable.map((r) => r.pretestMean!)) : 0;
    const meanPosttest = n > 0 ? avg(comparable.map((r) => r.posttestMean!)) : 0;
    const meanGain = meanPosttest - meanPretest;
    const sdPretest = n > 0 ? stddev(comparable.map((r) => r.pretestMean!)) : 0;
    const sdPosttest = n > 0 ? stddev(comparable.map((r) => r.posttestMean!)) : 0;
    const percentImproved = n > 0 ? (comparable.filter((r) => r.gain! > 0).length / n) * 100 : 0;

    const chartData = [
      { name: 'ก่อนเรียน', mean: meanPretest, sd: sdPretest },
      { name: 'หลังเรียน', mean: meanPosttest, sd: sdPosttest },
    ];

    const todayStr = todayIso();
    const todaySessions = sessions.filter((s) => s.created_at.startsWith(todayStr));
    const todayByStudent = new Map<string, typeof sessions>();
    todaySessions.forEach((s) => {
      const arr = todayByStudent.get(s.student_id) ?? [];
      arr.push(s);
      todayByStudent.set(s.student_id, arr);
    });

    return { rows, n, meanPretest, meanPosttest, meanGain, sdPretest, sdPosttest, percentImproved, chartData, todayByStudent, totalSessions: sessions.length };
  }, [activeStudy, sessionsQuery.data, studentsQuery.data]);

  const gameTitle = useMemo(() => {
    if (!activeStudy) return '';
    const g = (myGamesQuery.data ?? []).find((x) => x.game_slug === activeStudy.game_slug);
    return g?.title ?? activeStudy.game_slug;
  }, [activeStudy, myGamesQuery.data]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(assignmentLink);
      toast({ title: 'คัดลอกลิงก์แล้ว', description: 'ส่งให้นักเรียนในชั้นที่กำหนด' });
    } catch {
      toast({ title: 'คัดลอกไม่สำเร็จ', description: assignmentLink, variant: 'destructive' });
    }
  };

  const handlePrintDoc = () => {
    if (!activeStudy || !researchResult || researchResult.n === 0) {
      toast({ title: 'ยังไม่มีข้อมูลเพียงพอ', description: 'ต้องมีนักเรียนที่เล่นทั้งช่วงก่อนและหลังเรียน', variant: 'destructive' });
      return;
    }
    printClassroomResearchDoc({
      title: docTitle || activeStudy.title,
      problemStatement: docProblem,
      objectives: docObjectives.split('\n').map((o) => o.trim()).filter(Boolean),
      conclusion: docConclusion,
      teacherName: staffQuery.data?.name ?? 'ครูผู้สอน',
      className: activeStudy.class_name,
      gameTitle,
      pretestRange: { start: activeStudy.pretest_start, end: activeStudy.pretest_end },
      posttestRange: { start: activeStudy.posttest_start, end: activeStudy.posttest_end },
      rows: researchResult.rows.map((r) => ({
        name: r.student.name,
        studentCode: r.student.student_code,
        classNumber: r.student.class_number,
        pretestMean: r.pretestMean,
        posttestMean: r.posttestMean,
        gain: r.gain,
        preRounds: r.preRounds,
        postRounds: r.postRounds,
      })),
      stats: {
        n: researchResult.n,
        meanPretest: researchResult.meanPretest,
        meanPosttest: researchResult.meanPosttest,
        meanGain: researchResult.meanGain,
        sdPretest: researchResult.sdPretest,
        sdPosttest: researchResult.sdPosttest,
        percentImproved: researchResult.percentImproved,
      },
      school: {
        name: schoolSettings.school_name,
        logoUrl: schoolSettings.school_logo_url,
        academicYear: schoolSettings.academic_year,
      },
    });
  };

  return (
    <RolePortalLayout title="Portal ครู" subtitle="วิจัยการเล่นเกม" menu={MENU} accent="teacher">
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary" />
            วิจัยการเล่นเกมในชั้นเรียน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            กำหนดเกม · โหมด · ชั้นเรียน · ทำก่อนเรียนและหลังเรียนได้ในวันเดียว · รายงานมาตรฐานวิจัย
          </p>
        </div>

        {!staffId ? (
          <Card>
            <CardContent className="p-6 text-sm text-amber-600">
              บัญชีของคุณยังไม่ได้เชื่อมกับข้อมูลบุคลากร
            </CardContent>
          </Card>
        ) : studiesQuery.isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !activeStudy ? (
          <Card>
            <CardHeader>
              <CardTitle>สร้างโครงการวิจัยใหม่</CardTitle>
              <CardDescription>
                เลือกเกมที่คุณเป็นเจ้าของ · เริ่มต้นแนะนำ multiply-race โหมดแข่งเร็ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(myGamesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีเกมที่เปิดติดตามคะแนนในคลังของคุณ — ไปตั้งค่า tracked_game ใน{' '}
                  <a href="/teacher/edu-hub" className="text-primary underline">คลังสื่อของฉัน</a>
                </p>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4 max-w-lg">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อโครงการวิจัย</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="game_slug" render={({ field }) => (
                      <FormItem>
                        <FormLabel>เกม</FormLabel>
                        <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue('game_mode', (GAME_MODE_OPTIONS[v] ?? DEFAULT_GAME_MODES)[0]?.value ?? 'normal'); }}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(myGamesQuery.data ?? []).map((g) => (
                              <SelectItem key={g.game_slug!} value={g.game_slug!}>{g.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="game_mode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>โหมดที่นับเป็นข้อมูลวิจัย</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modeOptions.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          multiply-race โหมดแข่งเร็ว = ค่า normal ในระบบ
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชั้นเรียน</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CLASS_OPTIONS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="pretest_start" render={({ field }) => (
                        <FormItem><FormLabel>ก่อนเรียน เริ่ม</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="pretest_end" render={({ field }) => (
                        <FormItem><FormLabel>ก่อนเรียน สิ้นสุด</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="posttest_start" render={({ field }) => (
                        <FormItem><FormLabel>หลังเรียน เริ่ม</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="posttest_end" render={({ field }) => (
                        <FormItem><FormLabel>หลังเรียน สิ้นสุด</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="max_rounds_per_day" render={({ field }) => (
                      <FormItem>
                        <FormLabel>รอบสูงสุดต่อคนต่อวัน</FormLabel>
                        <FormControl><Input type="number" min={1} max={20} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="consent_confirmed" render={({ field }) => (
                      <FormItem className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal text-sm leading-snug">
                          ยืนยันว่าได้รับความยินยอมจากผู้ปกครองแล้ว และใช้ข้อมูลภายในโรงเรียนเท่านั้น
                        </FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="show_on_homepage" render={({ field }) => (
                      <FormItem className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal text-sm leading-snug">
                          แสดงบนหน้าแรกโรงเรียน (โซนงานวิจัย + รายการ /research)
                        </FormLabel>
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      เริ่มโครงการวิจัย
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {(studiesQuery.data ?? []).length > 1 && (
                <Select value={activeStudy.id} onValueChange={setSelectedStudyId}>
                  <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(studiesQuery.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge variant="outline">{activeStudy.class_name}</Badge>
              <Badge variant="secondary">{gameTitle}</Badge>
              <Badge variant="secondary">{modeLabel(activeStudy.game_slug, activeStudy.game_mode)}</Badge>
            </div>

            <Tabs defaultValue="dashboard">
              <TabsList>
                <TabsTrigger value="dashboard">แดชบอร์ด</TabsTrigger>
                <TabsTrigger value="report">รายงานวิจัย</TabsTrigger>
                <TabsTrigger value="link">ลิงก์นักเรียน</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryCard icon={<Users className="h-4 w-4" />} label="นักเรียนในชั้น" value={String(studentsQuery.data?.length ?? 0)} />
                  <SummaryCard icon={<Gamepad2 className="h-4 w-4" />} label="รอบที่บันทึกแล้ว" value={String(researchResult?.totalSessions ?? 0)} />
                  <SummaryCard icon={<CalendarRange className="h-4 w-4" />} label="รอบวันนี้รวม" value={String(researchResult?.todayByStudent ? [...researchResult.todayByStudent.values()].flat().length : 0)} />
                  <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="n เปรียบเทียบได้" value={String(researchResult?.n ?? 0)} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">รอบวันนี้ (สูงสุด {activeStudy.max_rounds_per_day} รอบ/คน)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>นักเรียน</TableHead>
                          {Array.from({ length: Math.min(activeStudy.max_rounds_per_day, 8) }, (_, i) => (
                            <TableHead key={i} className="text-center">รอบ {i + 1}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(studentsQuery.data ?? []).map((st) => {
                          const rounds = (researchResult?.todayByStudent.get(st.id) ?? [])
                            .sort((a, b) => a.created_at.localeCompare(b.created_at));
                          return (
                            <TableRow key={st.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <PersonAvatar name={st.name} photoUrl={st.photo_url} size="sm" />
                                  <span className="text-sm">{st.name}</span>
                                </div>
                              </TableCell>
                              {Array.from({ length: Math.min(activeStudy.max_rounds_per_day, 8) }, (_, i) => {
                                const round = rounds[i];
                                const phase = round ? getSessionResearchPhase(round, activeStudy) : null;
                                return (
                                  <TableCell key={i} className="text-center text-sm">
                                    {round ? (
                                      <div className="space-y-0.5">
                                        <div className="font-medium">{round.score.toLocaleString()}</div>
                                        {phase && <div className="text-[11px] text-muted-foreground">{researchPhaseLabel(phase)}</div>}
                                      </div>
                                    ) : '—'}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {researchResult && researchResult.n > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">เปรียบเทียบคะแนนเฉลี่ย ก่อน–หลังเรียน</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={researchResult.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="mean" name="คะแนนเฉลี่ย" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="report" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ตารางผลวิจัยรายบุคคล</CardTitle>
                    <CardDescription>
                      คะแนนเฉลี่ยแยกจากปุ่มก่อนเรียน/หลังเรียน · fallback ตามวันที่สำหรับข้อมูลเก่า · ก่อน {activeStudy.pretest_start}–{activeStudy.pretest_end} · หลัง {activeStudy.posttest_start}–{activeStudy.posttest_end}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportSessionsCsv(activeStudy, sessionsQuery.data)}>
                        <Download className="h-4 w-4 mr-1" /> Export CSV รายรอบ
                      </Button>
                      <Button size="sm" onClick={handlePrintDoc} disabled={!researchResult?.n}>
                        <FileText className="h-4 w-4 mr-1" /> พิมพ์รายงาน 5 บท
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="ชื่อเรื่องวิจัย (ถ้าไม่ใส่ใช้ชื่อโครงการ)" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                      <Textarea placeholder="ปัญหา/ที่มา" value={docProblem} onChange={(e) => setDocProblem(e.target.value)} rows={2} />
                      <Textarea placeholder="วัตถุประสงค์ (บรรทัดละข้อ)" value={docObjectives} onChange={(e) => setDocObjectives(e.target.value)} rows={2} />
                      <Textarea placeholder="สรุปผล/ข้อเสนอแนะ" value={docConclusion} onChange={(e) => setDocConclusion(e.target.value)} rows={2} />
                    </div>
                    {researchResult && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <StatBox label="n" value={researchResult.n} />
                          <StatBox label="ค่าเฉลี่ยก่อน" value={researchResult.meanPretest.toFixed(1)} />
                          <StatBox label="ค่าเฉลี่ยหลัง" value={researchResult.meanPosttest.toFixed(1)} />
                          <StatBox label="% ดีขึ้น" value={`${researchResult.percentImproved.toFixed(0)}%`} />
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>เลขที่</TableHead>
                              <TableHead>นักเรียน</TableHead>
                              <TableHead className="text-center">รอบก่อน</TableHead>
                              <TableHead className="text-center">เฉลี่ยก่อน</TableHead>
                              <TableHead className="text-center">รอบหลัง</TableHead>
                              <TableHead className="text-center">เฉลี่ยหลัง</TableHead>
                              <TableHead className="text-center">Gain</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {researchResult.rows.map((r) => (
                              <TableRow key={r.student.id}>
                                <TableCell>{r.student.class_number ?? '—'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <PersonAvatar name={r.student.name} photoUrl={r.student.photo_url} size="sm" />
                                    {r.student.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{r.preRounds || '—'}</TableCell>
                                <TableCell className="text-center">{r.pretestMean?.toFixed(1) ?? '—'}</TableCell>
                                <TableCell className="text-center">{r.postRounds || '—'}</TableCell>
                                <TableCell className="text-center">{r.posttestMean?.toFixed(1) ?? '—'}</TableCell>
                                <TableCell className="text-center font-medium">
                                  {r.gain !== null ? `${r.gain >= 0 ? '+' : ''}${r.gain.toFixed(1)}` : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="link" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> ลิงก์ให้นักเรียน (หน้าบ้าน)
                    </CardTitle>
                    <CardDescription>
                      ส่งลิงก์นี้ให้นักเรียนชั้น {activeStudy.class_name} — กรอกรหัสยืนยันตัวเอง · โหมด{' '}
                      <strong>{modeLabel(activeStudy.game_slug, activeStudy.game_mode)}</strong> ถูกกำหนดให้แล้ว ·{' '}
                      {activeStudy.max_rounds_per_day} รอบ/วัน · เลือกปุ่มก่อนเรียน/หลังเรียนได้ในวันเดียว
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ResearchStudyQR
                      url={assignmentLink}
                      title={activeStudy.title}
                      subtitle={`ชั้น ${activeStudy.class_name} · ${modeLabel(activeStudy.game_slug, activeStudy.game_mode)}`}
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input readOnly value={assignmentLink} className="font-mono text-xs" />
                      <Button onClick={copyLink} className="shrink-0">
                        <Copy className="h-4 w-4 mr-1" /> คัดลอกลิงก์
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      นักเรียนเปิดลิงก์หรือสแกน QR → กรอกรหัส → เริ่มเล่นทันที (ไม่ต้องเลือกโหมดในเกม)
                      {activeStudy.show_on_homepage !== false && (
                        <> · แสดงบน <Link to="/research" className="text-primary underline">หน้ารายการงานวิจัย</Link></>
                      )}
                    </p>
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      <Switch
                        id="show-homepage"
                        checked={activeStudy.show_on_homepage !== false}
                        disabled={homepageToggleMutation.isPending}
                        onCheckedChange={(v) => homepageToggleMutation.mutate(v)}
                      />
                      <Label htmlFor="show-homepage" className="text-sm font-normal cursor-pointer">
                        แสดงบนหน้าแรกโรงเรียน
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </RolePortalLayout>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon} {label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

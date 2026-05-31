import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Gamepad2,
  Trophy,
  Users,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  Settings,
  HelpCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Divide,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  gamePlayService,
  trackedGamesService,
  levelFromXp,
  type LevelInfo,
} from '@/services/game-play.service';
import { studentsService } from '@/services/students.service';

const CLASS_OPTIONS = [
  'อ.1', 'อ.2', 'อ.3',
  'ป.1', 'ป.2', 'ป.3',
  'ป.4', 'ป.5', 'ป.6',
  'ม.1', 'ม.2', 'ม.3',
  'ม.4', 'ม.5', 'ม.6',
];

interface SyncLogItem {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export default function TeacherGameAnalytics({ staffId }: { staffId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // State selections
  const [selectedGame, setSelectedGame] = useState<string>('pizza-master-chef');
  const [selectedClass, setSelectedClass] = useState<string>('ป.4');

  // Curve and Grading State
  const [syncTarget, setSyncTarget] = useState<'best' | 'latest'>('best');
  const [scoringCurve, setScoringCurve] = useState<'linear' | 'level'>('linear');
  const [maxGameScore, setMaxGameScore] = useState<number>(10000);
  const [targetLevel, setTargetLevel] = useState<number>(5);
  const [maxGradebookScore, setMaxGradebookScore] = useState<number>(10);
  const [scoreType, setScoreType] = useState<'เก็บ' | 'กลางภาค' | 'ปลายภาค'>('เก็บ');
  const [semester, setSemester] = useState<'1' | '2'>(
    new Date().getMonth() < 5 ? '2' : '1'
  );
  const [academicYear, setAcademicYear] = useState<string>(
    String(new Date().getFullYear() + 543 - (new Date().getMonth() < 4 ? 1 : 0))
  );

  // Bulk Sync Management
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  // 1. Fetch Tracked Games
  const trackedGamesQuery = useQuery({
    queryKey: ['teacher-tracked-games'],
    queryFn: async () => {
      const { data } = await trackedGamesService.listTracked();
      return data ?? [];
    },
  });

  // 2. Fetch All Students in Selected Class
  const studentsQuery = useQuery({
    queryKey: ['teacher-students', selectedClass],
    queryFn: async () => {
      const { data } = await studentsService.getByClass(selectedClass);
      return data ?? [];
    },
    enabled: !!selectedClass,
  });

  // 3. Fetch Game Sessions for Selected Game and Class
  const sessionsQuery = useQuery({
    queryKey: ['teacher-game-sessions', selectedGame, selectedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*, students!inner(id, name, student_code, class, class_number, photo_url)')
        .eq('game_slug', selectedGame)
        .eq('students.class', selectedClass);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedGame && !!selectedClass,
  });

  // Derived Data: Combine student records with their session statistics
  const studentStatsMap = useMemo(() => {
    const students = studentsQuery.data ?? [];
    const sessions = sessionsQuery.data ?? [];

    const map = new Map<string, {
      student: typeof students[0];
      playsCount: number;
      totalXp: number;
      bestScore: number;
      bestSessionId: string | null;
      bestSessionPushed: string | null;
      latestScore: number;
      latestSessionId: string | null;
      latestSessionPushed: string | null;
      levelInfo: LevelInfo;
    }>();

    // Initialize map with empty records for all students in the class
    students.forEach((std) => {
      map.set(std.id, {
        student: std,
        playsCount: 0,
        totalXp: 0,
        bestScore: 0,
        bestSessionId: null,
        bestSessionPushed: null,
        latestScore: 0,
        latestSessionId: null,
        latestSessionPushed: null,
        levelInfo: levelFromXp(0),
      });
    });

    // Group sessions by student and aggregate statistics
    const studentSessions = new Map<string, typeof sessions>();
    sessions.forEach((sess) => {
      if (sess.student_id) {
        const arr = studentSessions.get(sess.student_id) ?? [];
        arr.push(sess);
        studentSessions.set(sess.student_id, arr);
      }
    });

    studentSessions.forEach((sessList, studentId) => {
      const entry = map.get(studentId);
      if (!entry) return;

      // Calculate Plays Count and Total XP
      entry.playsCount = sessList.length;
      entry.totalXp = sessList.reduce((sum, s) => sum + (s.xp_earned ?? 0), 0);
      entry.levelInfo = levelFromXp(entry.totalXp);

      // Find Best Session (Highest Score)
      const sortedByScore = [...sessList].sort((a, b) => b.score - a.score);
      if (sortedByScore.length > 0) {
        entry.bestScore = sortedByScore[0].score;
        entry.bestSessionId = sortedByScore[0].id;
        entry.bestSessionPushed = sortedByScore[0].pushed_to_score_record_id;
      }

      // Find Latest Session
      const sortedByDate = [...sessList].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      if (sortedByDate.length > 0) {
        entry.latestScore = sortedByDate[0].score;
        entry.latestSessionId = sortedByDate[0].id;
        entry.latestSessionPushed = sortedByDate[0].pushed_to_score_record_id;
      }
    });

    return map;
  }, [studentsQuery.data, sessionsQuery.data]);

  const studentStatsList = useMemo(() => {
    return Array.from(studentStatsMap.values()).sort(
      (a, b) => (a.student.class_number ?? 999) - (b.student.class_number ?? 999)
    );
  }, [studentStatsMap]);

  // Aggregate Key Performance Indicators (KPIs)
  const kpis = useMemo(() => {
    const totalStudents = studentStatsList.length;
    if (totalStudents === 0) return { engagementRate: 0, averageScore: 0, highestScore: 0, totalPlays: 0 };

    const playedStudents = studentStatsList.filter((s) => s.playsCount > 0);
    const engagementRate = (playedStudents.length / totalStudents) * 100;
    const totalPlays = studentStatsList.reduce((sum, s) => sum + s.playsCount, 0);

    const highestScore = playedStudents.length > 0
      ? Math.max(...playedStudents.map((s) => s.bestScore))
      : 0;

    const averageScore = playedStudents.length > 0
      ? playedStudents.reduce((sum, s) => sum + s.bestScore, 0) / playedStudents.length
      : 0;

    return {
      engagementRate,
      averageScore,
      highestScore,
      totalPlays,
    };
  }, [studentStatsList]);

  // Recharts: Score Distribution Bins
  const scoreDistributionData = useMemo(() => {
    const bins = [
      { name: '0', count: 0 },
      { name: '1-2k', count: 0 },
      { name: '2k-4k', count: 0 },
      { name: '4k-6k', count: 0 },
      { name: '6k-8k', count: 0 },
      { name: '8k-10k', count: 0 },
      { name: '10k+', count: 0 },
    ];

    studentStatsList.forEach((s) => {
      if (s.playsCount === 0 || s.bestScore === 0) {
        bins[0].count += 1;
      } else if (s.bestScore <= 2000) {
        bins[1].count += 1;
      } else if (s.bestScore <= 4000) {
        bins[2].count += 1;
      } else if (s.bestScore <= 6000) {
        bins[3].count += 1;
      } else if (s.bestScore <= 8000) {
        bins[4].count += 1;
      } else if (s.bestScore <= 10000) {
        bins[5].count += 1;
      } else {
        bins[6].count += 1;
      }
    });

    return bins;
  }, [studentStatsList]);

  // Recharts: Practice Activity (Plays Count vs Level)
  const activityData = useMemo(() => {
    return studentStatsList.map((s) => ({
      name: s.student.name.split(' ')[0], // Use first name for chart spacing
      plays: s.playsCount,
      level: s.levelInfo.level,
      xp: s.totalXp,
    }));
  }, [studentStatsList]);

  // C3: รวม miss_log จาก metadata ทุก session → เศษส่วนที่นักเรียนพลาดบ่อย
  const fractionDiagnostic = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const reduceFrac = (key: string) => {
      const parts = String(key).split('/').map(Number);
      const n = parts[0], d = parts[1];
      if (!n || !d) return key;
      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
      const k = gcd(n, d) || 1;
      return `${n / k}/${d / k}`;
    };
    const missByFrac = new Map<string, { misses: number; students: Set<string> }>();
    const gradeBands = { lower: 0, upper: 0 };
    sessions.forEach((s: any) => {
      const meta = (s.metadata ?? {}) as Record<string, unknown>;
      if (meta.grade_band === 'lower') gradeBands.lower += 1;
      else if (meta.grade_band === 'upper') gradeBands.upper += 1;
      const ml = meta.miss_log;
      if (ml && typeof ml === 'object') {
        Object.entries(ml as Record<string, number>).forEach(([k, cnt]) => {
          const f = reduceFrac(k);
          const e = missByFrac.get(f) ?? { misses: 0, students: new Set<string>() };
          e.misses += Number(cnt) || 0;
          if (s.student_id) e.students.add(s.student_id);
          missByFrac.set(f, e);
        });
      }
    });
    const rows = Array.from(missByFrac.entries())
      .map(([frac, e]) => ({ frac, misses: e.misses, students: e.students.size }))
      .sort((a, b) => b.misses - a.misses);
    return { rows, gradeBands, hasData: rows.length > 0 };
  }, [sessionsQuery.data]);

  // Score Calculator Helper
  const calculateGradeScore = (entry: typeof studentStatsList[0]) => {
    const rawScore = syncTarget === 'best' ? entry.bestScore : entry.latestScore;
    if (scoringCurve === 'linear') {
      if (rawScore <= 0) return 0;
      const score = (rawScore / maxGameScore) * maxGradebookScore;
      return Math.min(maxGradebookScore, Number(score.toFixed(1)));
    } else {
      // Level-Based: (Level / Target Level) * Max Score
      const level = entry.levelInfo.level;
      const score = (level / targetLevel) * maxGradebookScore;
      return Math.min(maxGradebookScore, Number(score.toFixed(1)));
    }
  };

  // Multi-Select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const set = new Set<string>();
      studentStatsList.forEach((s) => {
        const hasSession = syncTarget === 'best' ? !!s.bestSessionId : !!s.latestSessionId;
        if (hasSession) {
          set.add(s.student.id);
        }
      });
      setSelectedStudentIds(set);
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const next = new Set(selectedStudentIds);
    if (checked) {
      next.add(studentId);
    } else {
      next.delete(studentId);
    }
    setSelectedStudentIds(next);
  };

  // Automated Sequential Parallel Sync
  const handleBulkSync = async () => {
    const idsToSync = Array.from(selectedStudentIds);
    if (idsToSync.length === 0) {
      toast({ title: 'กรุณาเลือกนักเรียนที่ต้องการโอนคะแนน', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);

    const initialLogs = idsToSync.map((id) => {
      const entry = studentStatsMap.get(id)!;
      return {
        id,
        name: entry.student.name,
        status: 'pending' as const,
        message: 'รอการโอน...',
      };
    });
    setSyncLogs(initialLogs);

    let completed = 0;
    const total = idsToSync.length;

    // We process sequentially or in batches to allow visual progress logs
    for (let i = 0; i < idsToSync.length; i++) {
      const id = idsToSync[i];
      const entry = studentStatsMap.get(id)!;
      const sessionId = syncTarget === 'best' ? entry.bestSessionId : entry.latestSessionId;
      const normalizedScore = calculateGradeScore(entry);

      if (!sessionId) {
        setSyncLogs((prev) =>
          prev.map((log) =>
            log.id === id
              ? { ...log, status: 'error', message: 'ไม่พบประวัติการเล่นเกม' }
              : log
          )
        );
        completed++;
        setSyncProgress(Math.round((completed / total) * 100));
        continue;
      }

      try {
        await gamePlayService.pushToScoreRecord({
          sessionId,
          scoreType,
          maxScore: maxGradebookScore,
          normalizedScore,
          semester,
          academicYear,
        });

        setSyncLogs((prev) =>
          prev.map((log) =>
            log.id === id
              ? { ...log, status: 'success', message: `โอนสำเร็จ (${normalizedScore}/${maxGradebookScore} คะแนน)` }
              : log
          )
        );
      } catch (err: any) {
        const msg = err.message ?? 'ล้มเหลว';
        const prettyMsg = msg.includes('already_pushed')
          ? 'คะแนนนี้ถูกส่งเข้าสมุดเกรดเรียบร้อยแล้ว'
          : msg;

        setSyncLogs((prev) =>
          prev.map((log) =>
            log.id === id
              ? { ...log, status: 'error', message: prettyMsg }
              : log
          )
        );
      }

      completed++;
      setSyncProgress(Math.round((completed / total) * 100));
      // Small artificial delay to keep the interface organic and smooth
      await new Promise((r) => setTimeout(r, 400));
    }

    // Finished
    toast({ title: `ประมวลผลการโอนคะแนนสำเร็จ (${total} คน)` });
    // Invalidate queries to refresh columns (pushed status)
    await qc.invalidateQueries({ queryKey: ['teacher-game-sessions', selectedGame, selectedClass] });
    setSelectedStudentIds(new Set());
  };

  const selectedGameTitle = useMemo(() => {
    return trackedGamesQuery.data?.find((g) => g.game_slug === selectedGame)?.title ?? selectedGame;
  }, [trackedGamesQuery.data, selectedGame]);

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">เกมการศึกษาที่เลือก</Label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกเกม..." />
              </SelectTrigger>
              <SelectContent>
                {trackedGamesQuery.isLoading ? (
                  <SelectItem value="loading" disabled>กำลังโหลดเกม...</SelectItem>
                ) : (
                  (trackedGamesQuery.data ?? []).map((g) => (
                    <SelectItem key={g.game_slug} value={g.game_slug ?? ''}>
                      {g.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">ชั้นเรียนวิเคราะห์</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกห้องเรียน..." />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    ชั้น {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border flex items-start gap-2 h-10 align-middle items-center">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>พบบัญชีผู้เล่นในระบบห้องนี้ {studentsQuery.data?.length ?? 0} คน</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Board */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-emerald-500/10">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <Percent className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">การเข้ามีส่วนร่วม (เล่นแล้ว)</p>
              <p className="text-2xl font-bold text-emerald-500">
                {kpis.engagementRate.toFixed(0)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/10">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">คะแนนเฉลี่ยห้อง (Best)</p>
              <p className="text-2xl font-bold text-blue-500">
                {kpis.averageScore.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-amber-500/10">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">คะแนนสถิติสูงสุด</p>
              <p className="text-2xl font-bold text-amber-500">
                {kpis.highestScore.toLocaleString('th-TH')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-violet-500/10">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-violet-500/10 p-2.5">
              <Gamepad2 className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">รอบสะสมการฝึกฝน</p>
              <p className="text-2xl font-bold text-violet-500">
                {kpis.totalPlays.toLocaleString('th-TH')} ครั้ง
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="grading" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="grading" className="gap-2">
            <UserCheck className="h-4 w-4" />
            สมุดโอนเกรดอัจฉริยะ
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <Sparkles className="h-4 w-4" />
            วิเคราะห์สถิติและการแจกแจง
          </TabsTrigger>
          <TabsTrigger value="fractions" className="gap-2">
            <Divide className="h-4 w-4" />
            วิเคราะห์เศษส่วน
          </TabsTrigger>
        </TabsList>

        {/* ────────── Tab 1: Smart Gradebook Sync ────────── */}
        <TabsContent value="grading" className="space-y-6 mt-4">
          {/* Curve Configuration Panel */}
          <Card className="border border-border/80 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  เกณฑ์การคำนวณและแปลงคะแนนเกรดดิบ (Scoring Curve Configurations)
                </CardTitle>
                <CardDescription>
                  ตั้งเกณฑ์แปลงสัดส่วนคะแนนสะสมของการเล่นเกม เข้าสัญญาสมุดคะแนนวิชาการปกติ
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">1. โหมดแปลงคะแนน</Label>
                <Select
                  value={scoringCurve}
                  onValueChange={(v) => setScoringCurve(v as 'linear' | 'level')}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear Scale (สัดส่วนคะแนน)</SelectItem>
                    <SelectItem value="level">XP Milestone Level (ตามระดับตัวละคร)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">2. ผลลัพธ์ที่โอน</Label>
                <Select value={syncTarget} onValueChange={(v) => setSyncTarget(v as 'best' | 'latest')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best">คะแนนสูงสุด (Best Play Session)</SelectItem>
                    <SelectItem value="latest">คะแนนล่าสุด (Last Play Session)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scoringCurve === 'linear' ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    3. คะแนนดิบเต็ม 100%
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-pointer" title="คะแนนสูงสุดที่จะแปลงเป็นคะแนนเต็มห้อง" />
                  </Label>
                  <Input
                    type="number"
                    value={maxGameScore}
                    onChange={(e) => setMaxGameScore(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    3. เลเวลสะสมเป้าหมาย (เต็ม 100%)
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-pointer" title="ระดับ Level ของตัวละครที่จะได้คะแนนเต็ม" />
                  </Label>
                  <Input
                    type="number"
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(Number(e.target.value))}
                    className="h-9"
                    min={1}
                    max={10}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold">4. คะแนนเก็บเต็มที่ต้องการ (ในสมุดเกรด)</Label>
                <Input
                  type="number"
                  value={maxGradebookScore}
                  onChange={(e) => setMaxGradebookScore(Number(e.target.value))}
                  className="h-9"
                />
              </div>

              {/* Advanced grading record target options */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">ประเภทคะแนน</Label>
                <Select value={scoreType} onValueChange={(v) => setScoreType(v as any)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="เก็บ">คะแนนเก็บ</SelectItem>
                    <SelectItem value="กลางภาค">คะแนนกลางภาค</SelectItem>
                    <SelectItem value="ปลายภาค">คะแนนปลายภาค</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">ภาคเรียน</Label>
                <Select value={semester} onValueChange={(v) => setSemester(v as any)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                    <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">ปีการศึกษา</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Dynamic Rule Summary Alert */}
              <div className="md:col-span-4 bg-primary/5 rounded-lg border border-primary/10 p-3.5 text-xs text-primary/95 flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-primary" />
                <span>
                  สูตรคณิตศาสตร์: {scoringCurve === 'linear' ? (
                    `คะแนนที่จะถูกบันทึก = (คะแนนจากเกมดิบ / ${maxGameScore.toLocaleString()}) * ${maxGradebookScore} [ปัดเศษ 1 ตำแหน่ง, สูงสุดไม่เกิน ${maxGradebookScore}]`
                  ) : (
                    `คะแนนที่จะถูกบันทึก = (เลเวลตัวละคร / ${targetLevel}) * ${maxGradebookScore} [ปัดเศษ 1 ตำแหน่ง, สูงสุดไม่เกิน ${maxGradebookScore}]`
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Student Sync Table */}
          <Card className="border border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="py-4 px-6 border-b border-border flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base font-bold">บันทึกสถิติรายบุคคล (ชั้น {selectedClass})</CardTitle>
                <CardDescription>
                  เลือกนักเรียนที่ต้องการโอน เพื่อส่งคะแนนเข้าวิชาสะกดของ Kampai-School
                </CardDescription>
              </div>
              <Button
                onClick={handleBulkSync}
                disabled={selectedStudentIds.size === 0}
                className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-medium shadow-md shadow-primary/10 select-none animate-shimmer"
              >
                <Send className="h-4 w-4" />
                โอนเข้าสมุดคะแนนแบบกลุ่ม ({selectedStudentIds.size} คน)
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {studentsQuery.isLoading || sessionsQuery.isLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">กำลังประมวลผลคะแนนห้อง...</span>
                </div>
              ) : studentStatsList.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground text-sm">ไม่พบบันทึกนักเรียนในห้องเรียนนี้</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={
                            studentStatsList.filter(
                              (s) => syncTarget === 'best' ? !!s.bestSessionId : !!s.latestSessionId
                            ).length > 0 &&
                            studentStatsList
                              .filter((s) => syncTarget === 'best' ? !!s.bestSessionId : !!s.latestSessionId)
                              .every((s) => selectedStudentIds.has(s.student.id))
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-14 text-center">เลขที่</TableHead>
                      <TableHead>นักเรียน</TableHead>
                      <TableHead className="w-28 text-center">ระดับ</TableHead>
                      <TableHead className="w-24 text-right">จำนวนรอบ</TableHead>
                      <TableHead className="w-32 text-right">คะแนนเกมดิบ</TableHead>
                      <TableHead className="w-32 text-right text-primary font-semibold">คะแนนคำนวณ</TableHead>
                      <TableHead className="w-32 text-center">สถานะการส่ง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentStatsList.map((row) => {
                      const hasPlayed = row.playsCount > 0;
                      const rawScore = syncTarget === 'best' ? row.bestScore : row.latestScore;
                      const hasSession = syncTarget === 'best' ? !!row.bestSessionId : !!row.latestSessionId;
                      const isPushed = syncTarget === 'best' ? !!row.bestSessionPushed : !!row.latestSessionPushed;
                      const gradeScore = calculateGradeScore(row);

                      return (
                        <TableRow key={row.student.id} className="hover:bg-muted/20">
                          <TableCell className="text-center">
                            <Checkbox
                              disabled={!hasSession}
                              checked={selectedStudentIds.has(row.student.id)}
                              onCheckedChange={(checked) =>
                                handleSelectStudent(row.student.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium text-muted-foreground">
                            {row.student.class_number ?? '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PersonAvatar
                                name={row.student.name}
                                photoUrl={row.student.photo_url}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-semibold">{row.student.name}</p>
                                <p className="text-xs text-muted-foreground">รหัส: {row.student.student_code ?? '—'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-primary text-xs font-semibold px-2 py-0.5">
                              Lv.{row.levelInfo.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {row.playsCount.toLocaleString('th-TH')} ครั้ง
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-foreground">
                            {hasPlayed ? rawScore.toLocaleString('th-TH') : '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-primary">
                            {gradeScore} / {maxGradebookScore}
                          </TableCell>
                          <TableCell className="text-center">
                            {!hasPlayed ? (
                              <Badge variant="secondary" className="text-xs font-medium text-muted-foreground bg-muted">
                                ยังไม่ได้เล่น
                              </Badge>
                            ) : isPushed ? (
                              <Badge variant="outline" className="text-xs font-medium border-emerald-500/30 bg-emerald-500/5 text-emerald-500 gap-1 select-none">
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                โอนแล้ว
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs font-medium border-blue-500/30 bg-blue-500/5 text-blue-600 gap-1 animate-pulse select-none">
                                พร้อมโอน
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────── Tab 2: Graphs & Statistics ────────── */}
        <TabsContent value="charts" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Score Distribution Chart */}
            <Card className="border border-border bg-card/60 backdrop-blur-md">
              <CardHeader className="py-4 px-6 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4.5 w-4.5 text-primary" />
                  แผนภาพแจกแจงคะแนนของห้องเรียน (Score Binned Distribution)
                </CardTitle>
                <CardDescription>
                  แสดงจำนวนนักเรียนจำแนกตามคะแนนสูงสุด (Best Score)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-72">
                  {studentStatsList.length === 0 ? (
                    <p className="text-center py-20 text-muted-foreground text-sm">ไม่พบประวัติการเล่น</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            fontFamily: 'inherit',
                          }}
                        />
                        <Bar dataKey="count" name="จำนวนคน" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engagement & Play Activity Chart */}
            <Card className="border border-border bg-card/60 backdrop-blur-md">
              <CardHeader className="py-4 px-6 border-b border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-violet-500" />
                  ดัชนีความเพียรพยายามและการฝึกฝนรายบุคคล
                </CardTitle>
                <CardDescription>
                  วิเคราะห์จำนวนรอบที่เข้ามาทบทวนคู่ขนานกับ Level ความก้าวหน้า
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-72">
                  {studentStatsList.length === 0 ? (
                    <p className="text-center py-20 text-muted-foreground text-sm">ไม่พบประวัติการเล่น</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="plays" name="จำนวนครั้งที่เล่น" stroke="hsl(var(--primary))" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="level" name="เลเวลปัจจุบัน" stroke="hsl(var(--accent))" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ────────── Tab 3: Fraction Diagnostic (C3) ────────── */}
        <TabsContent value="fractions" className="space-y-6 mt-4">
          <Card className="border border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="py-4 px-6 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <Divide className="h-4.5 w-4.5 text-rose-500" />
                เศษส่วนที่นักเรียนตอบผิดบ่อย (จุดที่ควรเน้นสอน)
              </CardTitle>
              <CardDescription>
                รวมจากการเล่นจริงของชั้น {selectedClass} · เศษส่วนแสดงแบบลดรูป · ยิ่งสูง = ยิ่งควรทบทวน
                {fractionDiagnostic.gradeBands.lower + fractionDiagnostic.gradeBands.upper > 0 && (
                  <span className="ml-1">(เล่นระดับ ป.1-3: {fractionDiagnostic.gradeBands.lower} · ป.4-6: {fractionDiagnostic.gradeBands.upper} รอบ)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!fractionDiagnostic.hasData ? (
                <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <span>ยังไม่มีข้อมูล — ข้อมูลจะปรากฏเมื่อนักเรียนเล่นเกมเศษส่วน (เช่น Pizza Master Chef) แล้วตอบผิด</span>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fractionDiagnostic.rows.slice(0, 10)} layout="vertical" margin={{ left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="frac" width={48} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 13, fontWeight: 700 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }}
                          formatter={(v: number) => [`${v} ครั้ง`, 'พลาด']}
                        />
                        <Bar dataKey="misses" name="จำนวนครั้งที่พลาด" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>เศษส่วน</TableHead>
                          <TableHead className="text-right">พลาด (ครั้ง)</TableHead>
                          <TableHead className="text-right">นักเรียนที่พลาด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fractionDiagnostic.rows.slice(0, 12).map((r) => (
                          <TableRow key={r.frac} className="hover:bg-muted/20">
                            <TableCell className="font-bold text-base">{r.frac}</TableCell>
                            <TableCell className="text-right font-semibold text-destructive">{r.misses}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{r.students} คน</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ───── Parallel Synchronize Processing Progress Dialog ───── */}
      <Dialog open={isSyncing} onOpenChange={(open) => !open && !isSyncing && setIsSyncing(false)}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              กำลังนำส่งคะแนนเข้าระบบ (Synchronizing Grades...)
            </DialogTitle>
            <DialogDescription>
              ระบบกำลังเชื่อมโยงการเล่นเกม {selectedGameTitle} ของนักเรียนชั้น {selectedClass} เข้าสู่สมุดคะแนน Kampai-School
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>ความก้าวหน้าการดำเนินการ</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-2.5 bg-muted" />
            </div>

            {/* Sync Progress Status Logs */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 h-52 overflow-y-auto space-y-2 text-xs font-mono">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="font-semibold truncate max-w-[150px]">{log.name}</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {log.status === 'pending' && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                        {log.message}
                      </span>
                    )}
                    {log.status === 'success' && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {log.message}
                      </span>
                    )}
                    {log.status === 'error' && (
                      <span className="text-destructive flex items-center gap-1" title={log.message}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        {log.message.slice(0, 24)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsSyncing(false)}
              disabled={syncProgress < 100}
              className="w-full"
            >
              {syncProgress < 100 ? 'กรุณารอสักครู่...' : 'เรียบร้อย (ปิดหน้าต่าง)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

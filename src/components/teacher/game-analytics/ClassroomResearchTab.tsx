import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FlaskConical,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { staffService } from '@/services/staff.service';
import { printClassroomResearchDoc } from './printClassroomResearchDoc';

interface SessionLite {
  student_id: string | null;
  score: number;
  created_at: string;
}

interface StudentLite {
  id: string;
  name: string;
  student_code: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface ClassroomResearchTabProps {
  sessions: SessionLite[];
  students: StudentLite[];
  selectedGameTitle: string;
  selectedClass: string;
  staffId: string;
  isLoading: boolean;
}

const avg = (arr: number[]) => arr.reduce((sum, n) => sum + n, 0) / arr.length;

const stddev = (arr: number[]) => {
  const m = avg(arr);
  return Math.sqrt(avg(arr.map((x) => (x - m) ** 2)));
};

export default function ClassroomResearchTab({
  sessions,
  students,
  selectedGameTitle,
  selectedClass,
  staffId,
  isLoading,
}: ClassroomResearchTabProps) {
  const [pretestStart, setPretestStart] = useState('');
  const [pretestEnd, setPretestEnd] = useState('');
  const [posttestStart, setPosttestStart] = useState('');
  const [posttestEnd, setPosttestEnd] = useState('');

  const [isDocOpen, setIsDocOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objectivesText, setObjectivesText] = useState('');
  const [conclusion, setConclusion] = useState('');

  const staffQuery = useQuery({
    queryKey: ['staff', staffId, 'name'],
    queryFn: async () => {
      const { data } = await staffService.getById(staffId);
      return data ?? null;
    },
    enabled: isDocOpen,
  });
  const { settings: schoolSettings } = useSchoolSettings();

  const datesReady = !!pretestStart && !!pretestEnd && !!posttestStart && !!posttestEnd;

  const result = useMemo(() => {
    if (!datesReady) return null;

    const preStart = new Date(`${pretestStart}T00:00:00`).getTime();
    const preEnd = new Date(`${pretestEnd}T23:59:59`).getTime();
    const postStart = new Date(`${posttestStart}T00:00:00`).getTime();
    const postEnd = new Date(`${posttestEnd}T23:59:59`).getTime();

    const byStudent = new Map<string, { pre: number[]; post: number[] }>();
    sessions.forEach((s) => {
      if (!s.student_id) return;
      const t = new Date(s.created_at).getTime();
      const entry = byStudent.get(s.student_id) ?? { pre: [], post: [] };
      if (t >= preStart && t <= preEnd) entry.pre.push(s.score);
      if (t >= postStart && t <= postEnd) entry.post.push(s.score);
      byStudent.set(s.student_id, entry);
    });

    const rows = students
      .map((student) => {
        const entry = byStudent.get(student.id);
        const pretestMean = entry && entry.pre.length > 0 ? avg(entry.pre) : null;
        const posttestMean = entry && entry.post.length > 0 ? avg(entry.post) : null;
        const gain = pretestMean !== null && posttestMean !== null ? posttestMean - pretestMean : null;
        return { student, pretestMean, posttestMean, gain };
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

    return { rows, n, meanPretest, meanPosttest, meanGain, sdPretest, sdPosttest, percentImproved };
  }, [sessions, students, datesReady, pretestStart, pretestEnd, posttestStart, posttestEnd]);

  const handleGenerateDoc = () => {
    if (!result || result.n === 0) return;

    printClassroomResearchDoc({
      title,
      problemStatement,
      objectives: objectivesText
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean),
      conclusion,
      teacherName: staffQuery.data?.name ?? 'ครูผู้สอน',
      className: selectedClass,
      gameTitle: selectedGameTitle,
      pretestRange: { start: pretestStart, end: pretestEnd },
      posttestRange: { start: posttestStart, end: posttestEnd },
      rows: result.rows.map((r) => ({
        name: r.student.name,
        studentCode: r.student.student_code,
        classNumber: r.student.class_number,
        pretestMean: r.pretestMean,
        posttestMean: r.posttestMean,
        gain: r.gain,
      })),
      stats: {
        n: result.n,
        meanPretest: result.meanPretest,
        meanPosttest: result.meanPosttest,
        meanGain: result.meanGain,
        sdPretest: result.sdPretest,
        sdPosttest: result.sdPosttest,
        percentImproved: result.percentImproved,
      },
      school: {
        name: schoolSettings.school_name,
        logoUrl: schoolSettings.school_logo_url,
        academicYear: schoolSettings.academic_year,
      },
    });
    setIsDocOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Date range selection */}
      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="py-4 px-6 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRange className="h-4.5 w-4.5 text-primary" />
            เลือกช่วงเวลาเปรียบเทียบ (ก่อนเรียน vs หลังเรียน)
          </CardTitle>
          <CardDescription>
            ระบบจะหาคะแนนเฉลี่ยของนักเรียนแต่ละคนในช่วงเวลาที่เลือก จากข้อมูลการเล่นเกม "{selectedGameTitle}" ที่มีอยู่แล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">ช่วงก่อนเรียน (Pretest)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={pretestStart} onChange={(e) => setPretestStart(e.target.value)} className="h-9" />
              <Input type="date" value={pretestEnd} onChange={(e) => setPretestEnd(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">ช่วงหลังเรียน (Posttest)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={posttestStart} onChange={(e) => setPosttestStart(e.target.value)} className="h-9" />
              <Input type="date" value={posttestEnd} onChange={(e) => setPosttestEnd(e.target.value)} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">กำลังโหลดข้อมูลห้องเรียน...</span>
        </div>
      ) : !datesReady ? (
        <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
          <CalendarRange className="h-8 w-8 opacity-40" />
          <span>เลือกช่วงเวลาทั้ง 2 ช่วงให้ครบ เพื่อดูผลเปรียบเทียบ</span>
        </div>
      ) : result && result.n === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 opacity-40" />
          <span>ไม่พบนักเรียนที่มีข้อมูลการเล่นเกมครบทั้งช่วงก่อนและหลังในช่วงเวลาที่เลือก</span>
        </div>
      ) : result ? (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 backdrop-blur-sm border-blue-500/10">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">คะแนนเฉลี่ยก่อนเรียน</p>
                  <p className="text-2xl font-bold text-blue-500">{result.meanPretest.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-emerald-500/10">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">คะแนนเฉลี่ยหลังเรียน</p>
                  <p className="text-2xl font-bold text-emerald-500">{result.meanPosttest.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-amber-500/10">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  {result.meanGain >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ผลต่างเฉลี่ย</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {result.meanGain >= 0 ? '+' : ''}{result.meanGain.toFixed(1)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-violet-500/10">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-lg bg-violet-500/10 p-2.5">
                  <FlaskConical className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">นักเรียนที่คะแนนดีขึ้น</p>
                  <p className="text-2xl font-bold text-violet-500">{result.percentImproved.toFixed(0)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-student table */}
          <Card className="border border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="py-4 px-6 border-b border-border flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base font-bold">ผลเปรียบเทียบรายบุคคล (ชั้น {selectedClass})</CardTitle>
                <CardDescription>
                  ใช้ข้อมูล {result.n} คนที่มีบันทึกการเล่นครบทั้ง 2 ช่วง (SD ก่อนเรียน {result.sdPretest.toFixed(1)} · หลังเรียน {result.sdPosttest.toFixed(1)})
                </CardDescription>
              </div>
              <Button onClick={() => setIsDocOpen(true)} disabled={result.n === 0} className="gap-2">
                <FileText className="h-4 w-4" />
                สร้างเอกสารวิจัย
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-14 text-center">เลขที่</TableHead>
                    <TableHead>นักเรียน</TableHead>
                    <TableHead className="w-28 text-right">ก่อนเรียน</TableHead>
                    <TableHead className="w-28 text-right">หลังเรียน</TableHead>
                    <TableHead className="w-28 text-right">ผลต่าง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((r) => {
                    const hasBoth = r.pretestMean !== null && r.posttestMean !== null;
                    return (
                      <TableRow key={r.student.id} className="hover:bg-muted/20">
                        <TableCell className="text-center text-sm font-medium text-muted-foreground">
                          {r.student.class_number ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={r.student.name} photoUrl={r.student.photo_url} size="sm" />
                            <p className="text-sm font-semibold">{r.student.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {r.pretestMean !== null ? r.pretestMean.toFixed(1) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {r.posttestMean !== null ? r.posttestMean.toFixed(1) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold">
                          {!hasBoth ? (
                            <Badge variant="secondary" className="text-xs font-medium text-muted-foreground bg-muted">
                              ไม่มีข้อมูล
                            </Badge>
                          ) : (
                            <span
                              className={
                                r.gain! > 0
                                  ? 'text-emerald-600 inline-flex items-center gap-1'
                                  : r.gain! < 0
                                    ? 'text-destructive inline-flex items-center gap-1'
                                    : 'text-muted-foreground inline-flex items-center gap-1'
                              }
                            >
                              {r.gain! > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : r.gain! < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                              {r.gain! >= 0 ? '+' : ''}{r.gain!.toFixed(1)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Document generation dialog */}
      <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              สร้างเอกสารวิจัยในชั้นเรียนฉบับสมบูรณ์
            </DialogTitle>
            <DialogDescription>
              บทที่ 3 และ 4 จะถูกเติมข้อมูลอัตโนมัติจากผลการวิเคราะห์ — กรุณากรอกส่วนที่เหลือ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ชื่อเรื่องวิจัย</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น การพัฒนาทักษะการบวกเลขด้วยเกม..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">บทที่ 1: ความสำคัญและที่มาของปัญหา</Label>
              <Textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">บทที่ 2: วัตถุประสงค์ของการวิจัย (1 ข้อต่อบรรทัด)</Label>
              <Textarea value={objectivesText} onChange={(e) => setObjectivesText(e.target.value)} rows={3} placeholder={'เพื่อ...\nเพื่อ...'} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">บทที่ 5: สรุปและข้อเสนอแนะ</Label>
              <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleGenerateDoc} disabled={staffQuery.isLoading} className="gap-2">
              {staffQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              สร้างเอกสาร
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

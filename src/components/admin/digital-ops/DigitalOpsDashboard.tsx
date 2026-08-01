import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Gauge, Download, ClipboardList, Clock, FileText, Trophy, BookOpen,
  Loader2, ExternalLink, Package, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { digitalOpsService } from '@/services/digital-ops.service';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { downloadDigitalOpsReportDocx } from '@/lib/docx/digitalOpsReportDocx';
import { downloadDigitalOpsReportPdf } from '@/lib/pdf/digital-ops/DigitalOpsReportPdf';
import { cn } from '@/lib/utils';

const CLINIC_CHECKLIST = [
  { label: 'ลาออนไลน์แทนใบลากระดาษ', href: '/admin/dashboard/leave' },
  { label: 'รับ–ส่งหนังสือผ่านสารบรรณ', href: '/admin/dashboard/saraban' },
  { label: 'อัปสื่อ/ใบงานในคลังของฉัน', href: '/teacher/edu-hub' },
  { label: 'มอบหมายและตรวจการบ้านออนไลน์', href: '/teacher/assignments' },
  { label: 'เบิกพัสดุออนไลน์', href: '/teacher/supplies' },
];

const DEFAULT_WORKFLOWS = [
  { key: 'leave', label: 'ขออนุมัติการลา' },
  { key: 'letter', label: 'จัดทำ/ส่งหนังสือราชการ' },
  { key: 'report', label: 'สรุปรายงานผลรายเดือน' },
  { key: 'supply', label: 'เบิกวัสดุสำนักงาน' },
  { key: 'media', label: 'เตรียมสื่อการสอน' },
];

export const DigitalOpsDashboard = () => {
  const qc = useQueryClient();
  const { data: link } = useLinkedRecord();
  const staffId = link?.staff_id ?? null;

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['digital-ops-kpi'],
    queryFn: () => digitalOpsService.kpiSummary(30),
  });

  const { data: baselines = [] } = useQuery({
    queryKey: ['digital-ops-baselines'],
    queryFn: () => digitalOpsService.listBaselines(),
  });

  const { data: paperLogs = [] } = useQuery({
    queryKey: ['digital-ops-paper'],
    queryFn: () => digitalOpsService.listPaperLogs(),
  });

  const { data: models = [] } = useQuery({
    queryKey: ['digital-ops-role-models'],
    queryFn: () => digitalOpsService.roleModels(12),
  });

  const [wfKey, setWfKey] = useState(DEFAULT_WORKFLOWS[0].key);
  const [before, setBefore] = useState('30');
  const [after, setAfter] = useState('10');
  const [paperYear, setPaperYear] = useState(String(new Date().getFullYear() + 543));
  const [paperMonth, setPaperMonth] = useState(String(new Date().getMonth() + 1));
  const [paperSheets, setPaperSheets] = useState('0');

  const saveBaseline = useMutation({
    mutationFn: () => {
      const wf = DEFAULT_WORKFLOWS.find((w) => w.key === wfKey)!;
      return digitalOpsService.upsertBaseline({
        workflow_key: wf.key,
        workflow_label: wf.label,
        minutes_before: Number(before) || 0,
        minutes_after: Number(after) || 0,
        recorded_by: staffId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['digital-ops-baselines'] });
      qc.invalidateQueries({ queryKey: ['digital-ops-kpi'] });
      toast.success('บันทึกตัวชี้วัดเวลาแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePaper = useMutation({
    mutationFn: () =>
      digitalOpsService.upsertPaperLog({
        year_be: Number(paperYear),
        month: Number(paperMonth),
        sheets_used: Number(paperSheets) || 0,
        recorded_by: staffId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['digital-ops-paper'] });
      qc.invalidateQueries({ queryKey: ['digital-ops-kpi'] });
      toast.success('บันทึกการใช้กระดาษแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportMd = useMutation({
    mutationFn: () => digitalOpsService.buildReportMarkdown(),
    onSuccess: (md) => {
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `รายงานลดภาระครู-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด Markdown แล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportDocx = useMutation({
    mutationFn: async () => {
      const data = await digitalOpsService.buildReportPayload();
      downloadDigitalOpsReportDocx(data);
    },
    onSuccess: () => toast.success('ดาวน์โหลด DOCX แล้ว'),
    onError: (e: Error) => toast.error(e.message),
  });

  const exportPdf = useMutation({
    mutationFn: async () => {
      const data = await digitalOpsService.buildReportPayload();
      await downloadDigitalOpsReportPdf(data);
    },
    onSuccess: () => toast.success('ดาวน์โหลด PDF แล้ว'),
    onError: (e: Error) => toast.error(e.message),
  });

  const baselineMap = useMemo(
    () => new Map(baselines.map((b) => [b.workflow_key, b])),
    [baselines],
  );

  const timeChartData = useMemo(
    () =>
      baselines.map((b) => ({
        name: b.workflow_label.length > 12 ? `${b.workflow_label.slice(0, 12)}…` : b.workflow_label,
        ก่อน: Number(b.minutes_before),
        หลัง: Number(b.minutes_after),
      })),
    [baselines],
  );

  const currentYearBe = new Date().getFullYear() + 543;
  const paperChartData = useMemo(
    () =>
      [...paperLogs]
        .filter((p) => p.year_be === currentYearBe || paperLogs.length <= 12)
        .sort((a, b) => (a.year_be !== b.year_be ? a.year_be - b.year_be : a.month - b.month))
        .map((p) => ({
          name: `${p.month}/${String(p.year_be).slice(2)}`,
          แผ่น: p.sheets_used,
        })),
    [paperLogs, currentYearBe],
  );

  const exporting = exportMd.isPending || exportDocx.isPending || exportPdf.isPending;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            ลดภาระครู — Digital Ops
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            แดชบอร์ด PDCA · ตัวชี้วัดเวลา/กระดาษ · Role Model · รายงานนวัตกรรม
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kpi?.surveyId && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/surveys/${kpi.surveyId}`} target="_blank" rel="noreferrer">
                แบบสำรวจความพึงพอใจ
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          )}
          <Button size="sm" disabled={exporting} onClick={() => exportMd.mutate()}>
            <Download className="h-3.5 w-3.5 mr-1" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {kpiLoading || !kpi ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด KPI...
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiTile label="ระบบดิจิทัลหลัก" value={`${kpi.digitalSystemsInUse}`} hint="สารบรรณ · นักเรียน · สื่อ · ลา · พัสดุ" />
          <KpiTile
            label="เวลาเฉลี่ยที่ลดได้"
            value={kpi.avgTimeSavedPct != null ? `${kpi.avgTimeSavedPct}%` : '—'}
            hint={`${kpi.baselinesCount} งานที่บันทึก baseline`}
          />
          <KpiTile
            label="ครูใช้งานดิจิทัล"
            value={`${kpi.adoptionPct}%`}
            hint={`${kpi.activeTeachers}/${kpi.staffTotal} คน · 30 วัน`}
          />
          <KpiTile
            label="ครูอัปสื่อ (30 วัน)"
            value={String(kpi.teacherUploaders)}
            hint={`การบ้านส่ง ${kpi.homeworkSubmissions} · ลา ${kpi.leaveRequests}`}
          />
          <KpiTile
            label="ความพึงพอใจ"
            value={`${kpi.surveyResponses}`}
            hint={`ตอบแบบสำรวจ · หนังสือ ${kpi.letters} ฉบับ`}
          />
        </div>
      )}

      <Tabs defaultValue="metrics">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="metrics"><Clock className="h-3.5 w-3.5 mr-1" />เวลา / กระดาษ</TabsTrigger>
          <TabsTrigger value="roles"><Trophy className="h-3.5 w-3.5 mr-1" />Role Model</TabsTrigger>
          <TabsTrigger value="clinic"><BookOpen className="h-3.5 w-3.5 mr-1" />Digital Clinic</TabsTrigger>
          <TabsTrigger value="report"><FileText className="h-3.5 w-3.5 mr-1" />รายงาน</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">กราฟ Time-Saving (นาทีก่อน/หลัง)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {timeChartData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-16">ยังไม่มี baseline</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="ก่อน" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="หลัง" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">กราฟ Paper-Saving (แผ่น/เดือน)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {paperChartData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-16">ยังไม่มีบันทึกกระดาษ</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paperChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="แผ่น" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Time-Saving baseline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">งาน</Label>
                  <select
                    className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
                    value={wfKey}
                    onChange={(e) => {
                      setWfKey(e.target.value);
                      const existing = baselineMap.get(e.target.value);
                      if (existing) {
                        setBefore(String(existing.minutes_before));
                        setAfter(String(existing.minutes_after));
                      }
                    }}
                  >
                    {DEFAULT_WORKFLOWS.map((w) => (
                      <option key={w.key} value={w.key}>{w.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">นาทีก่อน</Label>
                  <Input type="number" value={before} onChange={(e) => setBefore(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">นาทีหลัง</Label>
                  <Input type="number" value={after} onChange={(e) => setAfter(e.target.value)} />
                </div>
              </div>
              <Button size="sm" disabled={saveBaseline.isPending} onClick={() => saveBaseline.mutate()}>
                บันทึก
              </Button>
              <ul className="space-y-1.5 pt-2 border-t border-border">
                {baselines.map((b) => {
                  const pct =
                    Number(b.minutes_before) > 0
                      ? Math.round((1 - Number(b.minutes_after) / Number(b.minutes_before)) * 100)
                      : 0;
                  return (
                    <li key={b.id} className="flex justify-between text-sm gap-2">
                      <span>{b.workflow_label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {b.minutes_before}→{b.minutes_after} นาที (−{pct}%)
                      </span>
                    </li>
                  );
                })}
                {baselines.length === 0 && (
                  <li className="text-xs text-muted-foreground">ยังไม่มีข้อมูล — กรอก baseline เพื่อวัดผล</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Paper-Saving log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ปี พ.ศ.</Label>
                  <Input value={paperYear} onChange={(e) => setPaperYear(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เดือน</Label>
                  <Input type="number" min={1} max={12} value={paperMonth} onChange={(e) => setPaperMonth(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">แผ่นกระดาษ</Label>
                  <Input type="number" value={paperSheets} onChange={(e) => setPaperSheets(e.target.value)} />
                </div>
              </div>
              <Button size="sm" disabled={savePaper.isPending} onClick={() => savePaper.mutate()}>
                บันทึกเดือนนี้
              </Button>
              {kpi?.paperDelta != null && (
                <p className="text-xs text-muted-foreground">
                  เทียบเดือนก่อน: {kpi.paperDelta <= 0 ? 'ลด' : 'เพิ่ม'} {Math.abs(kpi.paperDelta)} แผ่น
                </p>
              )}
              <ul className="space-y-1.5 pt-2 border-t border-border max-h-48 overflow-y-auto">
                {paperLogs.slice(0, 12).map((p) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span>{p.month}/{p.year_be}</span>
                    <span className="tabular-nums text-muted-foreground">{p.sheets_used} แผ่น</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Digital Role Model (90 วัน)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  ยังไม่มีคะแนน adoption — ชวนครูอัปสื่อ / ลาออนไลน์ / ตรวจการบ้าน / เบิกพัสดุ
                </p>
              ) : (
                <ul className="space-y-3">
                  {models.map((m, idx) => (
                    <li key={m.staffId} className="flex items-center gap-3">
                      <span className="w-6 text-sm font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                      <PersonAvatar name={m.name} photoUrl={m.photoUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {m.badges.map((b) => (
                            <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{m.score}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinic" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Digital Clinic — checklist งานธุรการดิจิทัล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                ใช้เป็นคู่มืออบรมสั้น / Coaching ให้ครูทุกคนทำแทนกระดาษ
              </p>
              {CLINIC_CHECKLIST.map((c) => (
                <Link
                  key={c.href}
                  to={c.href}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">{c.label}</span>
                </Link>
              ))}
              <div className="pt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/dashboard/supplies">
                    <Package className="h-3.5 w-3.5 mr-1" /> จัดการพัสดุ
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/dashboard/surveys">
                    <ClipboardList className="h-3.5 w-3.5 mr-1" /> แบบสำรวจทั้งหมด
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">รายงานลดภาระงานครูด้วยดิจิทัล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                สร้างร่างรายงานโครงสร้างคล้ายแนวทาง BAYAO Smart Office (หลักการ → วัตถุประสงค์ → PDCA → ผล → เผยแพร่)
                โดยดึงตัวเลขจากแดชบอร์ดนี้โดยอัตโนมัติ
              </p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={exporting} onClick={() => exportMd.mutate()}>
                  <Download className="h-4 w-4 mr-1" />
                  Markdown
                </Button>
                <Button variant="outline" disabled={exporting} onClick={() => exportDocx.mutate()}>
                  <Download className="h-4 w-4 mr-1" />
                  DOCX
                </Button>
                <Button variant="outline" disabled={exporting} onClick={() => exportPdf.mutate()}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
              {kpi && (
                <div className={cn('rounded-lg border border-border bg-secondary/30 p-3 text-xs space-y-1')}>
                  <p>ระบบหลัก {kpi.digitalSystemsInUse} · ลดเวลาเฉลี่ย {kpi.avgTimeSavedPct ?? '—'}% · ครูใช้งาน {kpi.adoptionPct}%</p>
                  <p>ครูอัปสื่อ {kpi.teacherUploaders} · ตอบแบบสำรวจ {kpi.surveyResponses}</p>
                  <p>คำขอพัสดุรออนุมัติ {kpi.pendingSupplies} · สต็อกต่ำ {kpi.lowStockCount}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function KpiTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
      </CardContent>
    </Card>
  );
}

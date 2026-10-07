/**
 * PaporDiagnosticCenter.tsx
 * ศูนย์ตรวจสอบและดีบักระบบออกเกรดและเอกสาร ปพ.5 - ปพ.6 สพฐ.
 * - ตรวจสุขภาพข้อมูล 5 มิติ
 * - ปุ่มซ่อมแซมอัตโนมัติ (Auto-Healing)
 * - Raw JSON Inspector ตรวจสอบข้อมูลดิบรายบุคคล
 * - ส่งออกรายงานดีบัก (Export Diagnostics JSON)
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Download,
  Users,
  BookOpen,
  Award,
  CheckCheck,
  FileCode2,
  Copy,
  ChevronRight,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  paporDiagnosticsService,
  type DiagnosticSummary,
  type DiagnosticIssue,
} from '@/services/papor-diagnostics.service';
import { cn } from '@/lib/utils';

interface Props {
  selectedClass?: string;
  academicYear?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const PaporDiagnosticCenter: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2569',
  onNavigateToTab,
}) => {
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Diagnostic Query
  const {
    data: report,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<DiagnosticSummary>({
    queryKey: ['papor-diagnostics', selectedClass, academicYear],
    queryFn: () => paporDiagnosticsService.runClassDiagnostics(selectedClass, academicYear),
    staleTime: 10_000,
  });

  // Repair Mutations
  const enrollMutation = useMutation({
    mutationFn: () => paporDiagnosticsService.repairMissingEnrollments(selectedClass, academicYear),
    onSuccess: (res) => {
      toast.success(`ดึงนักเรียนตกหล่นเรียบร้อย (${res.enrolledCount} คน)`);
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['papor-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['papor-grades'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการซิงค์นักเรียน';
      toast.error(msg);
    },
  });

  const evaluationsMutation = useMutation({
    mutationFn: () => paporDiagnosticsService.repairDefaultEvaluations(selectedClass, academicYear, 'excellent'),
    onSuccess: (res) => {
      toast.success(`เติมผลการประเมิน 4 ด้านมาตรฐานเรียบร้อย (${res.updatedCount} คน)`);
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['papor-evaluations'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเติมผลการประเมิน';
      toast.error(msg);
    },
  });

  const promotionsMutation = useMutation({
    mutationFn: () => paporDiagnosticsService.repairRecalculatePromotions(selectedClass, academicYear),
    onSuccess: (res) => {
      toast.success(`คำนวณและปรับผลเลื่อนชั้นตามเกณฑ์จริงเรียบร้อย (${res.recalculatedCount} คน)`);
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['papor-promotions'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปรับผลเลื่อนชั้น';
      toast.error(msg);
    },
  });

  const filteredIssues = (report?.issues || []).filter((issue) => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const rawStudents = (report?.rawDebugPayload?.students as Array<{ id: string; name: string }>) || [];
  const currentInspectStudent = rawStudents.find((s) => s.id === selectedStudentId) || rawStudents[0];

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('คัดลอกข้อมูลดิบ JSON เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Header Health Summary Card */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-muted/40 via-card to-card">
          <div className="flex items-start md:items-center gap-5">
            {/* Score Ring Gauge */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-muted/60 border border-border shadow-inner shrink-0">
              <div className="text-center">
                <span
                  className={cn(
                    'text-3xl font-black tracking-tight',
                    (report?.overallScore ?? 100) >= 90
                      ? 'text-emerald-600'
                      : (report?.overallScore ?? 100) >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                  )}
                >
                  {isLoading ? '...' : report?.overallScore ?? 100}
                </span>
                <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                  Health %
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    report?.status === 'perfect' || report?.status === 'healthy'
                      ? 'default'
                      : report?.status === 'warning'
                      ? 'outline'
                      : 'destructive'
                  }
                  className="gap-1 font-semibold text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {report?.status === 'perfect'
                    ? 'สมบูรณ์แบบ 100%'
                    : report?.status === 'healthy'
                    ? 'ข้อมูลพร้อมใช้งาน'
                    : report?.status === 'warning'
                    ? 'มีรายการต้องตรวจสอบ'
                    : 'ต้องแก้ไขข้อมูลเร่งด่วน'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ตรวจล่าสุด: {report ? new Date(report.checkedAt).toLocaleTimeString('th-TH') : '-'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" />
                ศูนย์ตรวจสอบ & ดีบักระบบออกเกรด (Diagnostics)
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                ระดับชั้น {selectedClass} · ปีการศึกษา {academicYear} · ตรวจสอบความถูกต้องและสอดคล้อง 5 มิติ
              </p>
            </div>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', (isLoading || isRefetching) && 'animate-spin')} />
              ตรวจซ้ำ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => report && paporDiagnosticsService.exportDiagnosticReport(report)}
              disabled={!report}
              className="gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              ส่งออก JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInspectorOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
              ดูข้อมูลดิบ
            </Button>
          </div>
        </div>

        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-muted/20 border-t border-border text-center">
          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-blue-600" /> นักเรียนทั้งหมด
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.studentCount ?? 0} คน
            </span>
          </div>

          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <CheckCheck className="w-3 h-3 text-emerald-600" /> เชื่อมโยงใน ปพ.
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.enrolledCount ?? 0} คน
            </span>
          </div>

          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-600" /> จำนวนวิชา
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.subjectCount ?? 0} วิชา
            </span>
          </div>

          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-amber-600" /> รวมหน่วยกิต/ชม.
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.totalCredits ?? 0} นก. ({report?.metrics.totalHours ?? 0} ชม.)
            </span>
          </div>

          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" /> ประเมิน 4 ด้าน
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.evaluationsCompletedPct ?? 0}%
            </span>
          </div>

          <div className="bg-card p-2.5 rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" /> ตัดสินเลื่อนชั้น
            </span>
            <span className="text-base font-bold text-foreground">
              {report?.metrics.promotionsCompletedPct ?? 0}%
            </span>
          </div>
        </div>
      </Card>

      {/* Auto-Healing Toolbar (ปุ่มซ่อมแซมอัตโนมัติใน 1 คลิก) */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Wrench className="w-4 h-4 text-primary" />
            เครื่องมือซ่อมแซมอัตโนมัติ (1-Click Auto-Healing Actions)
          </CardTitle>
          <CardDescription className="text-xs">
            ช่วยแก้ไขข้อผิดพลาดที่พบบ่อยโดยอัตโนมัติ เพื่อเตรียมความพร้อมสำหรับการตัดเกรดและพิมพ์ใบ ปพ.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="gap-1.5 text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              {enrollMutation.isPending ? 'กำลังซิงค์...' : '1. ซิงค์นักเรียนที่ตกหล่น (Sync Students)'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => evaluationsMutation.mutate()}
              disabled={evaluationsMutation.isPending}
              className="gap-1.5 text-xs font-semibold hover:border-amber-500 hover:text-amber-600"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              {evaluationsMutation.isPending ? 'กำลังเติม...' : '2. เติมผลประเมิน 4 มิติมาตรฐาน (Fill Missing Evals)'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => promotionsMutation.mutate()}
              disabled={promotionsMutation.isPending}
              className="gap-1.5 text-xs font-semibold hover:border-purple-500 hover:text-purple-600"
            >
              <CheckCheck className="w-3.5 h-3.5 text-purple-600" />
              {promotionsMutation.isPending ? 'กำลังคำนวณ...' : '3. คำนวณผลเลื่อนชั้นตามเกณฑ์จริง (Recalculate Promo)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues & Diagnostic Audit Log */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              รายการผลการตรวจวินิจฉัย ({report?.totalIssues ?? 0} รายการ)
            </CardTitle>
            <CardDescription className="text-xs">
              ข้อผิดพลาด คำเตือน และข้อเสนอแนะในการปรับปรุงข้อมูลให้พร้อมสำหรับระดับ Production
            </CardDescription>
          </div>

          <Tabs
            value={filterSeverity}
            onValueChange={(v) => setFilterSeverity(v as 'all' | 'error' | 'warning' | 'info')}
          >
            <TabsList className="h-8 bg-muted/60 p-0.5">
              <TabsTrigger value="all" className="text-xs px-2.5 h-7">
                ทั้งหมด ({report?.totalIssues ?? 0})
              </TabsTrigger>
              <TabsTrigger value="error" className="text-xs px-2.5 h-7 text-red-600">
                ข้อผิดพลาด ({report?.errorCount ?? 0})
              </TabsTrigger>
              <TabsTrigger value="warning" className="text-xs px-2.5 h-7 text-amber-600">
                คำเตือน ({report?.warningCount ?? 0})
              </TabsTrigger>
              <TabsTrigger value="info" className="text-xs px-2.5 h-7 text-blue-600">
                แนะนำ ({report?.infoCount ?? 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="font-semibold text-foreground text-sm">ไม่พบข้อผิดพลาดในหมวดหมู่นี้</p>
              <p className="text-xs mt-1">ข้อมูลในชั้นเรียนนี้มีความถูกต้องและพร้อมสำหรับการทำงาน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    'p-3.5 rounded-xl border flex items-start justify-between gap-4 transition-colors',
                    issue.severity === 'error'
                      ? 'bg-red-50/40 border-red-200'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-blue-50/40 border-blue-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {issue.severity === 'error' ? (
                        <AlertOctagon className="w-5 h-5 text-red-600" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{issue.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                          {issue.category}
                        </Badge>
                        {issue.studentName && (
                          <Badge variant="secondary" className="text-[11px] py-0">
                            {issue.studentName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 mt-1">{issue.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground/70">ผลกระทบ:</span> {issue.impact}
                      </p>
                    </div>
                  </div>

                  {issue.category === 'student' && onNavigateToTab && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToTab('gradebook')}
                      className="text-xs gap-1 shrink-0 h-8 text-primary"
                    >
                      ดูสมุดคะแนน <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {issue.category === 'curriculum' && onNavigateToTab && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToTab('subjects')}
                      className="text-xs gap-1 shrink-0 h-8 text-primary"
                    >
                      แก้ไขวิชา <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw JSON Inspector Dialog */}
      <Dialog open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCode2 className="w-5 h-5 text-blue-600" />
              Raw Data Inspector (ตรวจสอบข้อมูลดิบเรียลไทม์)
            </DialogTitle>
            <DialogDescription className="text-xs">
              ส่องข้อมูลโครงสร้างดิบจากฐานข้อมูล Supabase สำหรับการตรวจสอบและดีบักเจาะลึก
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">เลือกนักเรียน:</span>
              <Select
                value={selectedStudentId || currentInspectStudent?.id}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger className="h-8 w-48 text-xs font-medium">
                  <SelectValue placeholder="เลือกนักเรียน" />
                </SelectTrigger>
                <SelectContent>
                  {rawStudents.map((st) => (
                    <SelectItem key={st.id} value={st.id} className="text-xs">
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyJson(report?.rawDebugPayload)}
              className="h-8 gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5" /> คัดลอก JSON ทั้งหมด
            </Button>
          </div>

          <ScrollArea className="flex-1 mt-3 p-4 bg-muted/60 rounded-xl border border-border font-mono text-xs overflow-auto">
            <pre className="text-foreground whitespace-pre-wrap">
              {JSON.stringify(report?.rawDebugPayload || {}, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

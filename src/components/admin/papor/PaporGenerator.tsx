import { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Loader2,
  FileSpreadsheet,
  BookOpen,
  Award,
  CheckCircle2,
  FileBox,
  Printer,
  Settings2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paporService, type Semester, type PaporStudentData } from '@/services/papor.service';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { PaporFive } from '@/lib/pdf/papor/PaporFive';
import { PaporSix } from '@/lib/pdf/papor/PaporSix';
import { PaporExcelSync } from './PaporExcelSync';
import { PaporGradebookGrid } from './PaporGradebookGrid';
import { PaporEvaluationsManager } from './PaporEvaluationsManager';
import { PaporPromotionManager } from './PaporPromotionManager';
import { PaporSixViewer } from './PaporSixViewer';
import { PaporSubjectManager } from './PaporSubjectManager';
import { PaporReportsCenter } from './PaporReportsCenter';

type MainSection = 'gradebook' | 'subjects' | 'evaluations' | 'promotions' | 'reports' | 'booklet' | 'excel' | 'pdf';
type Doc = 'papor5' | 'papor6';

const PRIMARY_CLASSES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

function thaiYearOptions(): string[] {
  const currentCE = new Date().getFullYear();
  const baseTH = currentCE + 543;
  return [baseTH, baseTH - 1, baseTH - 2, baseTH - 3, baseTH - 4].map(String);
}

export const PaporGenerator = () => {
  const { settings } = useSchoolSettings();
  const [section, setSection] = useState<MainSection>('gradebook');
  const [doc, setDoc] = useState<Doc>('papor5');
  const [academicYear, setAcademicYear] = useState<string>('2568');
  const [semester, setSemester] = useState<Semester>('1');
  const [className, setClassName] = useState<string>('ป.5');
  const [studentId, setStudentId] = useState<string>('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: classes = PRIMARY_CLASSES } = useQuery({
    queryKey: ['papor-classes'],
    queryFn: async () => {
      const apiClasses = await paporService.listClasses();
      const combined = Array.from(new Set([...PRIMARY_CLASSES, ...apiClasses]));
      return combined.sort();
    },
    staleTime: 60_000,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['papor-students', className],
    enabled: !!className,
    queryFn: () => paporService.listStudentsInClass(className),
  });

  // Single-student aggregated data for preview
  const { data: term1Data, isLoading: loading1 } = useQuery<PaporStudentData | null>({
    queryKey: ['papor-data', studentId, academicYear, '1'],
    enabled: !!studentId && !!academicYear,
    queryFn: () => paporService.forStudentTerm(studentId, academicYear, '1'),
  });
  const { data: term2Data, isLoading: loading2 } = useQuery<PaporStudentData | null>({
    queryKey: ['papor-data', studentId, academicYear, '2'],
    enabled: !!studentId && !!academicYear && doc === 'papor6',
    queryFn: () => paporService.forStudentTerm(studentId, academicYear, '2'),
  });

  const previewData = doc === 'papor5' ? (semester === '1' ? term1Data : term2Data) : null;
  const previewBusy = doc === 'papor5' ? (semester === '1' ? loading1 : loading2) : loading1 || loading2;

  const studentChoice = useMemo(() => students.find((s: { id: string; name: string }) => s.id === studentId), [students, studentId]);

  const pdfDoc = useMemo(() => {
    const schoolName = settings?.school_name || 'โรงเรียนบ้านคำไผ่';
    if (doc === 'papor5' && previewData) {
      return <PaporFive data={previewData} schoolName={schoolName} />;
    }
    if (doc === 'papor6' && (term1Data || term2Data)) {
      return <PaporSix term1={term1Data ?? null} term2={term2Data ?? null} schoolName={schoolName} />;
    }
    return null;
  }, [doc, previewData, term1Data, term2Data, settings?.school_name]);

  const fileName = useMemo(() => {
    const namePart = studentChoice ? studentChoice.name.replace(/\s+/g, '_') : 'student';
    if (doc === 'papor5') return `papor5_${namePart}_${academicYear}_t${semester}.pdf`;
    return `papor6_${namePart}_${academicYear}.pdf`;
  }, [doc, studentChoice, academicYear, semester]);

  const handleBulk = async () => {
    if (!students.length) return;
    setBulkBusy(true);
    const toastId = toast.loading(`กำลังสร้าง ${doc === 'papor5' ? 'ปพ.5' : 'ปพ.6'} ของทั้งห้อง... (0/${students.length})`);

    try {
      const schoolName = settings?.school_name || 'โรงเรียนบ้านคำไผ่';
      let done = 0;

      for (const s of students) {
        const t1 = await paporService.forStudentTerm(s.id, academicYear, '1');
        const t2 = doc === 'papor6' ? await paporService.forStudentTerm(s.id, academicYear, '2') : null;
        const target =
          doc === 'papor5'
            ? semester === '1' ? t1 : t2 ?? await paporService.forStudentTerm(s.id, academicYear, '2')
            : null;

        const el =
          doc === 'papor5' && target
            ? <PaporFive data={target} schoolName={schoolName} />
            : doc === 'papor6' && (t1 || t2)
            ? <PaporSix term1={t1} term2={t2} schoolName={schoolName} />
            : null;

        if (!el) continue;

        const blob = await pdf(el).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = s.name.replace(/\s+/g, '_');
        a.download = doc === 'papor5'
          ? `papor5_${safeName}_${academicYear}_t${semester}.pdf`
          : `papor6_${safeName}_${academicYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        done += 1;
        toast.loading(`สร้าง ${doc === 'papor5' ? 'ปพ.5' : 'ปพ.6'}... (${done}/${students.length})`, { id: toastId });
        await new Promise((r) => setTimeout(r, 200));
      }

      toast.success(`ดาวน์โหลด ${done} ไฟล์เรียบร้อยแล้ว`, { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('เกิดข้อผิดพลาดในการสร้าง bulk PDF: ' + msg, { id: toastId });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            ระบบออกเกรดและเอกสาร ปพ.5 - ปพ.6 สพฐ.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ระบบเว็บเบส 100% จัดการรายวิชา บันทึกคะแนน ประเมิน 4 มิติ และออกรายงานสั่งพิมพ์มาตรฐานกระทรวงศึกษาธิการ
          </p>
        </div>

        {/* Global Selectors: Class & Academic Year */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-2 rounded-xl border border-border">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">ระดับชั้น:</Label>
            <Select value={className} onValueChange={(v) => { setClassName(v); setStudentId(''); }}>
              <SelectTrigger className="h-8 w-24 bg-card font-semibold text-xs">
                <SelectValue placeholder="เลือกชั้น" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: string) => (
                  <SelectItem key={c} value={c} className="text-xs font-medium">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">ปีการศึกษา:</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="h-8 w-24 bg-card font-semibold text-xs">
                <SelectValue placeholder="เลือกปี" />
              </SelectTrigger>
              <SelectContent>
                {thaiYearOptions().map((y) => (
                  <SelectItem key={y} value={y} className="text-xs font-medium">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="text-[11px] bg-card hidden sm:inline-flex">
            นักเรียน {students.length} คน
          </Badge>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <Tabs value={section} onValueChange={(v) => setSection(v as MainSection)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-muted/60">
          <TabsTrigger value="gradebook" className="gap-1.5 py-2 text-xs md:text-sm">
            <BookOpen className="w-4 h-4 text-blue-600" /> สมุดคะแนน ปพ.5
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5 py-2 text-xs md:text-sm">
            <Settings2 className="w-4 h-4 text-emerald-600" /> โครงสร้างรายวิชา
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-1.5 py-2 text-xs md:text-sm">
            <Award className="w-4 h-4 text-amber-600" /> ประเมิน 4 ด้าน
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5 py-2 text-xs md:text-sm">
            <CheckCircle2 className="w-4 h-4 text-purple-600" /> ตัดสินเลื่อนชั้น
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 py-2 text-xs md:text-sm font-semibold text-primary">
            <Printer className="w-4 h-4 text-primary" /> พิมพ์รายงาน A4
          </TabsTrigger>
          <TabsTrigger value="booklet" className="gap-1.5 py-2 text-xs md:text-sm">
            <FileBox className="w-4 h-4 text-indigo-600" /> สมุดพก 10 หน้า
          </TabsTrigger>
          <TabsTrigger value="excel" className="gap-1.5 py-2 text-xs md:text-sm">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" /> นำเข้า Excel
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Online Gradebook Grid */}
        <TabsContent value="gradebook" className="pt-4">
          <PaporGradebookGrid
            selectedClass={className}
            academicYear={academicYear}
            onNavigateToSubjects={() => setSection('subjects')}
          />
        </TabsContent>

        {/* Tab 2: Dynamic Subject Manager */}
        <TabsContent value="subjects" className="pt-4">
          <PaporSubjectManager
            selectedClass={className}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* Tab 3: 4-Dimension Evaluations */}
        <TabsContent value="evaluations" className="pt-4">
          <PaporEvaluationsManager
            selectedClass={className}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* Tab 4: Promotions & Decisions */}
        <TabsContent value="promotions" className="pt-4">
          <PaporPromotionManager
            selectedClass={className}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* Tab 5: Printable Reports Hub (A4 Portrait & Landscape) */}
        <TabsContent value="reports" className="pt-4">
          <PaporReportsCenter
            selectedClass={className}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* Tab 6: 10-Page Official Booklet */}
        <TabsContent value="booklet" className="pt-4">
          <PaporSixViewer
            selectedClass={className}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* Tab 7: Excel Import / Export Sync */}
        <TabsContent value="excel" className="pt-4">
          <PaporExcelSync />
        </TabsContent>
      </Tabs>
    </div>
  );
};

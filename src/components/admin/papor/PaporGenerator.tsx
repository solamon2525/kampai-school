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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

type MainSection = 'excel' | 'gradebook' | 'evaluations' | 'promotions' | 'booklet' | 'pdf';
type Doc = 'papor5' | 'papor6';

function thaiYearOptions(): string[] {
  const currentCE = new Date().getFullYear();
  const baseTH = currentCE + 543;
  return [baseTH, baseTH - 1, baseTH - 2, baseTH - 3, baseTH - 4].map(String);
}

export const PaporGenerator = () => {
  const { settings } = useSchoolSettings();
  const [section, setSection] = useState<MainSection>('excel');
  const [doc, setDoc] = useState<Doc>('papor5');
  const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear() + 543));
  const [semester, setSemester] = useState<Semester>('1');
  const [className, setClassName] = useState<string>('ป.5');
  const [studentId, setStudentId] = useState<string>('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ['papor-classes'],
    queryFn: () => paporService.listClasses(),
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

  const studentChoice = useMemo(() => students.find((s: any) => s.id === studentId), [students, studentId]);

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
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาดในการสร้าง bulk PDF: ' + (e?.message ?? ''), { id: toastId });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            ระบบ ปพ.5 / ปพ.6 สพฐ. ออนไลน์
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) และสมุดรายงานประจำตัวนักเรียน (ปพ.6) โรงเรียนบ้านคำไผ่
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            สพฐ. 2551 (ปรับปรุง 2560)
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ปีการศึกษา {academicYear}
          </Badge>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <Tabs value={section} onValueChange={(v) => setSection(v as MainSection)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60">
          <TabsTrigger value="excel" className="gap-1.5 py-2 text-xs md:text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> นำเข้า Excel
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="gap-1.5 py-2 text-xs md:text-sm">
            <BookOpen className="w-4 h-4 text-blue-600" /> คะแนนรายวิชา
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-1.5 py-2 text-xs md:text-sm">
            <Award className="w-4 h-4 text-amber-600" /> ประเมิน 4 ด้าน
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5 py-2 text-xs md:text-sm">
            <CheckCircle2 className="w-4 h-4 text-purple-600" /> ตัดสินเลื่อนชั้น
          </TabsTrigger>
          <TabsTrigger value="booklet" className="gap-1.5 py-2 text-xs md:text-sm">
            <FileBox className="w-4 h-4 text-primary" /> สมุดพก 10 หน้า
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-1.5 py-2 text-xs md:text-sm">
            <Download className="w-4 h-4" /> ส่งออก PDF
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Excel Import / Export Sync */}
        <TabsContent value="excel" className="pt-4">
          <PaporExcelSync />
        </TabsContent>

        {/* Tab 2: Online Gradebook Grid */}
        <TabsContent value="gradebook" className="pt-4">
          <PaporGradebookGrid selectedClass={className} academicYear={academicYear} />
        </TabsContent>

        {/* Tab 3: 4-Dimension Evaluations */}
        <TabsContent value="evaluations" className="pt-4">
          <PaporEvaluationsManager selectedClass={className} academicYear={academicYear} />
        </TabsContent>

        {/* Tab 4: Promotions & Decisions */}
        <TabsContent value="promotions" className="pt-4">
          <PaporPromotionManager selectedClass={className} academicYear={academicYear} />
        </TabsContent>

        {/* Tab 5: 10-Page Official Booklet */}
        <TabsContent value="booklet" className="pt-4">
          <PaporSixViewer selectedClass={className} academicYear={academicYear} />
        </TabsContent>

        {/* Tab 6: PDF Generator & Bulk Export */}
        <TabsContent value="pdf" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ตัวเลือกสร้างเอกสาร PDF</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ชนิดเอกสาร</Label>
                  <Select value={doc} onValueChange={(v) => setDoc(v as Doc)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="papor5">ปพ.5 (รายภาคเรียน)</SelectItem>
                      <SelectItem value="papor6">ปพ.6 (รายปี)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ปีการศึกษา</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {thaiYearOptions().map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {doc === 'papor5' && (
                  <div className="space-y-2">
                    <Label>ภาคเรียน</Label>
                    <Select value={semester} onValueChange={(v) => setSemester(v as Semester)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                        <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>ชั้นเรียน</Label>
                  <Select value={className} onValueChange={(v) => { setClassName(v); setStudentId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกชั้นเรียน" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c: string) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>นักเรียน</Label>
                  <Select value={studentId} onValueChange={setStudentId} disabled={!className}>
                    <SelectTrigger>
                      <SelectValue placeholder={className ? 'เลือกนักเรียน' : 'เลือกชั้นเรียนก่อน'} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.class_number ? `เลขที่ ${s.class_number} · ` : ''}{s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 space-y-2">
                  {pdfDoc && studentChoice ? (
                    <PDFDownloadLink document={pdfDoc} fileName={fileName}>
                      {({ loading }) => (
                        <Button className="w-full" disabled={loading}>
                          {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังสร้าง...</>
                          ) : (
                            <><Download className="w-4 h-4 mr-2" />ดาวน์โหลด {doc === 'papor5' ? 'ปพ.5' : 'ปพ.6'}</>
                          )}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  ) : (
                    <Button className="w-full" disabled>เลือกนักเรียนก่อน</Button>
                  )}

                  <Button variant="outline" className="w-full" onClick={handleBulk} disabled={!className || bulkBusy}>
                    {bulkBusy ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังสร้าง...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" />ดาวน์โหลดทั้งห้อง ({students.length} คน)</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle className="text-base">ตัวอย่างเอกสาร (PDF Preview)</CardTitle>
              </CardHeader>
              <CardContent>
                {!studentId ? (
                  <p className="text-sm text-muted-foreground text-center py-16">
                    เลือกชั้นเรียน + นักเรียนเพื่อดูตัวอย่าง
                  </p>
                ) : previewBusy ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pdfDoc ? (
                  <div className="w-full h-[70vh] border border-border rounded-md overflow-hidden">
                    <PDFViewer width="100%" height="100%" showToolbar={false} key={`${doc}-${studentId}-${academicYear}-${semester}`}>
                      {pdfDoc}
                    </PDFViewer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">ไม่มีข้อมูลเพียงพอ</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

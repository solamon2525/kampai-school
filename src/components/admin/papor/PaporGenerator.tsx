import { useMemo, useState } from 'react';
import { FileText, Download, Loader2, FileBox } from 'lucide-react';
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

type Doc = 'papor5' | 'papor6';

function thaiYearOptions(): string[] {
  // Current Thai year + previous 4
  const currentCE = new Date().getFullYear();
  const baseTH = currentCE + 543;
  return [baseTH, baseTH - 1, baseTH - 2, baseTH - 3, baseTH - 4].map(String);
}

export const PaporGenerator = () => {
  const { settings } = useSchoolSettings();
  const [doc, setDoc] = useState<Doc>('papor5');
  const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear() + 543));
  const [semester, setSemester] = useState<Semester>('1');
  const [className, setClassName] = useState<string>('');
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
    if (doc === 'papor5' && previewData) {
      return <PaporFive data={previewData} schoolName={settings.school_name} />;
    }
    if (doc === 'papor6' && (term1Data || term2Data)) {
      return <PaporSix term1={term1Data ?? null} term2={term2Data ?? null} schoolName={settings.school_name} />;
    }
    return null;
  }, [doc, previewData, term1Data, term2Data, settings.school_name]);

  const fileName = useMemo(() => {
    const namePart = studentChoice?.name?.replace(/\s+/g, '_') ?? 'student';
    if (doc === 'papor5') return `papor5_${namePart}_${academicYear}_t${semester}.pdf`;
    return `papor6_${namePart}_${academicYear}.pdf`;
  }, [doc, studentChoice, academicYear, semester]);

  /** Generate PDFs for every student in the chosen class, save individually. */
  const handleBulk = async () => {
    if (!className || !students.length) {
      toast.error('เลือกชั้นเรียนก่อน');
      return;
    }
    setBulkBusy(true);
    try {
      let done = 0;
      for (const s of students as any[]) {
        const t1 = await paporService.forStudentTerm(s.id, academicYear, '1');
        const t2 = doc === 'papor6' ? await paporService.forStudentTerm(s.id, academicYear, '2') : null;
        const target =
          doc === 'papor5'
            ? semester === '1' ? t1 : t2 ?? await paporService.forStudentTerm(s.id, academicYear, '2')
            : null;

        const docEl =
          doc === 'papor5' && target
            ? <PaporFive data={target} schoolName={settings.school_name} />
            : doc === 'papor6' && (t1 || t2)
              ? <PaporSix term1={t1} term2={t2} schoolName={settings.school_name} />
              : null;
        if (!docEl) continue;

        const blob = await pdf(docEl).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = s.name?.replace(/\s+/g, '_') ?? 'student';
        a.download = doc === 'papor5'
          ? `papor5_${safeName}_${academicYear}_t${semester}.pdf`
          : `papor6_${safeName}_${academicYear}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        done += 1;
        // Tiny pause so browser actually queues downloads
        await new Promise((r) => setTimeout(r, 150));
      }
      toast.success(`สร้างเอกสารแล้ว ${done} ฉบับ`);
    } catch (e: any) {
      toast.error('สร้างเอกสารบางรายการล้มเหลว: ' + (e?.message ?? e));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FileBox className="w-7 h-7 text-primary" />
          เอกสาร ปพ.5 / ปพ.6 (Auto-gen)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          สร้าง PDF จากข้อมูลคะแนน + การมาเรียน + ความประพฤติ — ปรับตามรูปแบบ สพฐ. ตรวจทานก่อนส่ง
        </p>
      </div>

      <Tabs value={doc} onValueChange={(v) => setDoc(v as Doc)}>
        <TabsList>
          <TabsTrigger value="papor5">ปพ.5 (รายภาคเรียน)</TabsTrigger>
          <TabsTrigger value="papor6">ปพ.6 (รายปี)</TabsTrigger>
        </TabsList>

        <TabsContent value={doc} className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                เลือกข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>ปีการศึกษา (พ.ศ.)</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {thaiYearOptions().map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {doc === 'papor5' && (
                <div className="space-y-1.5">
                  <Label>ภาคเรียน</Label>
                  <Select value={semester} onValueChange={(v) => setSemester(v as Semester)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                      <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>ชั้นเรียน</Label>
                <Select value={className} onValueChange={(v) => { setClassName(v); setStudentId(''); }}>
                  <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>นักเรียน</Label>
                <Select value={studentId} onValueChange={setStudentId} disabled={!students.length}>
                  <SelectTrigger><SelectValue placeholder={className ? 'เลือกนักเรียน' : 'เลือกชั้นก่อน'} /></SelectTrigger>
                  <SelectContent>
                    {students.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        เลขที่ {s.class_number ?? '-'} · {s.name}
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

              <p className="text-[11px] text-muted-foreground pt-2">
                ⚠ เกรดคำนวณตามเกณฑ์ สพฐ. 4-point (80=4 / 75=3.5 / 70=3 / ...). กรุณาตรวจสอบก่อนส่ง
              </p>
            </CardContent>
          </Card>

          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle className="text-base">ตัวอย่างเอกสาร</CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

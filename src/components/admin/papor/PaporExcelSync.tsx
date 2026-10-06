import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  parsePaporWorkbook,
  syncPaporWorkbookToDatabase,
  exportPaporWorkbookToBlob,
  type PaporWorkbookParsedData,
} from '@/services/papor-evaluation.service';

interface Props {
  onSyncComplete?: (data: PaporWorkbookParsedData) => void;
}

export const PaporExcelSync: React.FC<Props> = ({ onSyncComplete }) => {
  const { toast } = useToast();
  const [isParsing, setIsParsing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStepText, setSyncStepText] = useState('');
  const [parsedData, setParsedData] = useState<PaporWorkbookParsedData | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = parsePaporWorkbook(buffer);
      setParsedData(result);
      toast({
        title: 'อ่านไฟล์ Excel สำเร็จ',
        description: `พบข้อมูลนักเรียน ${result.students.length} คน, ${result.subjects.length} รายวิชา (ปีการศึกษา ${result.schoolInfo.academicYear})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'รูปแบบไฟล์ไม่ตรงตามโครงสร้าง ปพ.5/ปพ.6 สพฐ.';
      toast({
        variant: 'destructive',
        title: 'อ่านไฟล์ไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Quick load Kru Tum's pre-configured file from server/local
  const handleLoadKruTumFile = async () => {
    setIsParsing(true);
    setFileName('ปพ-5-ปพ-6-ป 5 ปี68---ครูตุ้ม-Final.xlsm');
    try {
      // In development or local server, fetch from local route or public if copied,
      // or we can invoke our API / fetch if served.
      const res = await fetch('/เกรด/ปพ-5-ปพ-6-ป 5 ปี68---ครูตุ้ม-Final.xlsm');
      if (!res.ok) {
        throw new Error('ไม่พบไฟล์ที่พาธ /เกรด กรุณาลากวางไฟล์โดยตรง');
      }
      const buffer = await res.arrayBuffer();
      const result = parsePaporWorkbook(buffer);
      setParsedData(result);
      toast({
        title: 'โหลดไฟล์ครูตุ้มสำเร็จ',
        description: `พบข้อมูล ป.5 ปี 2568 นักเรียน ${result.students.length} คน ครบถ้วน`,
      });
    } catch {
      // Fallback: prompt to drop file
      toast({
        title: 'คำแนะนำ',
        description: 'กรุณาคลิก "เลือกไฟล์จากเครื่อง" แล้วเลือกไฟล์ ปพ-5-ปพ-6-ป 5 ปี68---ครูตุ้ม-Final.xlsm ในโฟลเดอร์ เกรด',
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Sync to database
  const handleSyncToDatabase = async () => {
    if (!parsedData) return;
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStepText('กำลังเริ่มบันทึกข้อมูล...');

    try {
      const audit = await syncPaporWorkbookToDatabase(parsedData, (step, pct) => {
        setSyncStepText(step);
        setSyncProgress(pct);
      });

      if (audit.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'บันทึกสำเร็จบางส่วน',
          description: audit.errors.join(', '),
        });
      } else {
        toast({
          title: 'บันทึกเข้าสู่ระบบโรงเรียนสำเร็จ 🎉',
          description: `จับคู่นักเรียน ${audit.studentsMatched} คน, บันทึกคะแนน ${audit.scoresInserted} รายการ, การประเมิน 4 ด้าน ${audit.evaluationsInserted} รายการ`,
        });
      }

      onSyncComplete?.(parsedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถบันทึกลงฐานข้อมูลได้';
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: msg,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export back to Excel
  const handleExportExcel = () => {
    if (!parsedData) return;
    try {
      const blob = exportPaporWorkbookToBlob(parsedData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ปพ-5-ปพ-6_${parsedData.schoolInfo.gradeLevel}_ปี${parsedData.schoolInfo.academicYear}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'ส่งออกไฟล์ Excel สำเร็จ',
        description: 'ดาวน์โหลดไฟล์ผลการเรียนมาตรฐาน สพฐ. เรียบร้อย',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งออก';
      toast({
        variant: 'destructive',
        title: 'ส่งออกไม่สำเร็จ',
        description: msg,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="border-dashed border-2 border-primary/30 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <FileSpreadsheet className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold">นำเข้าไฟล์ Excel ปพ.5 / ปพ.6 สพฐ.</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              รองรับไฟล์สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (.xlsm หรือ .xlsx) เช่น ไฟล์ของครูประจำชั้น
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsm,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isParsing || isSyncing}
              />
              <Button asChild variant="default" disabled={isParsing || isSyncing}>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isParsing ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์จากเครื่อง (.xlsm / .xlsx)'}
                </span>
              </Button>
            </label>

            <Button
              variant="outline"
              onClick={handleLoadKruTumFile}
              disabled={isParsing || isSyncing}
              className="border-primary/40 hover:bg-primary/5"
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              โหลดไฟล์ครูตุ้ม ป.5 ปี 2568
            </Button>
          </div>

          {fileName && (
            <Badge variant="secondary" className="mt-2 text-xs">
              ไฟล์ที่เลือก: {fileName}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Sync Progress Bar */}
      {isSyncing && (
        <Card className="border-primary/40 bg-card">
          <CardContent className="pt-6 space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{syncStepText}</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {parsedData && (
        <div className="space-y-6">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ชั้นเรียน & ปีการศึกษา</div>
                  <div className="text-lg font-bold">
                    {parsedData.schoolInfo.gradeLevel} (ปี {parsedData.schoolInfo.academicYear})
                  </div>
                  <div className="text-xs text-muted-foreground">{parsedData.schoolInfo.schoolName}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">จำนวนนักเรียน</div>
                  <div className="text-lg font-bold">{parsedData.students.length} คน</div>
                  <div className="text-xs text-muted-foreground">ครูประจำชั้น: {parsedData.schoolInfo.teacherName}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">รายวิชาทั้งหมด</div>
                  <div className="text-lg font-bold">{parsedData.subjects.length} วิชา</div>
                  <div className="text-xs text-muted-foreground">พื้นฐาน 8 + เพิ่มเติม 2</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">การตัดสินเลื่อนชั้น</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {parsedData.promotions.filter(p => p.promotionDecision === 'promoted').length} / {parsedData.promotions.length} คน
                  </div>
                  <div className="text-xs text-muted-foreground">ผ่านเกณฑ์ สพฐ. 6 ข้อ</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>ตรวจพบข้อมูลพร้อมซิงค์เข้าสู่ฐานข้อมูลระบบโรงเรียน</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportExcel} disabled={isSyncing}>
                <Download className="w-4 h-4 mr-2" />
                ส่งออกเป็น Excel (.xlsx)
              </Button>

              <Button variant="default" onClick={handleSyncToDatabase} disabled={isSyncing} className="shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isSyncing ? 'กำลังบันทึก...' : 'ซิงค์ข้อมูลเข้าสู่ระบบเว็บ'}
              </Button>
            </div>
          </div>

          {/* Student Roster Preview Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>รายชื่อนักเรียนและผลการเรียนเฉลี่ย (พรีวิวจากไฟล์)</span>
                <Badge variant="outline">{parsedData.students.length} คน</Badge>
              </CardTitle>
              <CardDescription>
                ข้อมูลจะถูกเชื่อมโยงกับรหัสประจำตัวนักเรียนและบันทึกลงในสมุดเกรดออนไลน์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="py-2 px-3 text-center w-12">เลขที่</th>
                      <th className="py-2 px-3 text-left">นักเรียน</th>
                      <th className="py-2 px-3 text-center">รหัสนักเรียน</th>
                      <th className="py-2 px-3 text-center">GPA</th>
                      <th className="py-2 px-3 text-center">เวลาเรียน</th>
                      <th className="py-2 px-3 text-center">สมรรถนะ</th>
                      <th className="py-2 px-3 text-center">คุณลักษณะ</th>
                      <th className="py-2 px-3 text-center">อ่านคิดวิเคราะห์</th>
                      <th className="py-2 px-3 text-center">กิจกรรม</th>
                      <th className="py-2 px-3 text-center">ผลการตัดสิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.promotions.map((p, idx) => {
                      const st = parsedData.students[idx];
                      return (
                        <tr key={p.studentNo} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium">{p.studentNo}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <PersonAvatar name={p.studentName} photoUrl={null} className="w-7 h-7 text-xs" />
                              <span className="font-medium">{p.studentName}</span>
                              {st?.nickname && (
                                <span className="text-xs text-muted-foreground">({st.nickname})</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground">{p.studentCode}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-primary">
                            {p.gpa.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={p.attendancePass ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}
                            >
                              {p.attendancePct}%
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant="secondary">{p.competencyGrade}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant="secondary">{p.characterGrade}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant="secondary">{p.readingGrade}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={p.activitiesPass ? 'text-emerald-700' : 'text-red-700'}
                            >
                              {p.activitiesPass ? 'ผ่าน' : 'ไม่ผ่าน'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              variant={p.promotionDecision === 'promoted' ? 'default' : 'destructive'}
                              className={p.promotionDecision === 'promoted' ? 'bg-emerald-600 text-white' : ''}
                            >
                              {p.promotionDecision === 'promoted' ? 'เลื่อนชั้น' : 'ไม่เลื่อนชั้น'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

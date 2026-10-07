/**
 * PaporReportsCenter.tsx
 * ศูนย์ออกรายงานและสั่งพิมพ์เอกสารทางการ (สพฐ.) มาตรฐาน A4 ครบวงจร
 * - 6 โหมดรายงาน:
 *   1. ปพ.6 รายบุคคล (A4 แนวตั้ง)
 *   2. ปพ.6 พิมพ์ทั้งห้องในคลิกเดียว (1-Click Batch Print พร้อม page-break อัตโนมัติ)
 *   3. ปพ.5-ป สรุปทั้งชั้น (A4 แนวนอน)
 *   4. สลิปแจ้งผลการเรียนสำหรับผู้ปกครอง (Parent Grade Slip)
 *   5. ใบรับรองผลการศึกษา ปพ.7 (Transcript / Academic Certificate)
 *   6. แดชบอร์ดวิเคราะห์ผลสัมฤทธิ์ทางการเรียน (Academic Performance Analytics)
 * - แถบปรับแต่งตัวเลือกการพิมพ์แบบเรียลไทม์ (Print Customizer Toolbar): ตราโรงเรียน, รูปถ่าย, ลายเซ็น, QR Code
 * - แสตมป์ Digital QR Verification ยืนยันผลการเรียนดิจิทัล
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Printer,
  FileText,
  LayoutGrid,
  Loader2,
  SlidersHorizontal,
  BarChart3,
  Award,
  Layers,
  Receipt,
  QrCode,
  Image as ImageIcon,
  PenTool,
} from 'lucide-react';
import {
  curriculumSubjectsService,
  type ObecGradeSubjectRow,
} from '@/services/curriculum-subjects.service';
import {
  paporGradebookService,
  type GradebookStudent,
} from '@/services/papor-gradebook.service';
import { teacherClassAssignmentService } from '@/services/teacher-class-assignment.service';
import {
  PrintableStudentReportCard,
  type ReportCardStudent,
  type ReportCardSubjectScore,
  type ReportCardEvaluations,
} from './PrintableStudentReportCard';
import {
  PrintableClassSummaryReport,
  type ClassSummaryStudentRow,
} from './PrintableClassSummaryReport';
import { PrintableBatchStudentReportCards } from './PrintableBatchStudentReportCards';
import { PrintableParentGradeSlip } from './PrintableParentGradeSlip';
import { PrintableAcademicCertificate } from './PrintableAcademicCertificate';
import { PaporAcademicAnalyticsDashboard } from './PaporAcademicAnalyticsDashboard';

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

export type ReportMode =
  | 'individual'
  | 'batch_individual'
  | 'class_summary'
  | 'parent_slip'
  | 'certificate'
  | 'analytics';

function scoreToGrade(score: number): string {
  if (score >= 80) return '4';
  if (score >= 75) return '3.5';
  if (score >= 70) return '3';
  if (score >= 65) return '2.5';
  if (score >= 60) return '2';
  if (score >= 55) return '1.5';
  if (score >= 50) return '1';
  return '0';
}

export const PaporReportsCenter: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2569',
}) => {
  const [reportMode, setReportMode] = useState<ReportMode>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Print Customizer Toolbar Options
  const [showSchoolCrest, setShowSchoolCrest] = useState(true);
  const [showStudentPhoto, setShowStudentPhoto] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showQrVerification, setShowQrVerification] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);

  // 1. Fetch Subjects via TanStack Query
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<ObecGradeSubjectRow[]>({
    queryKey: ['curriculum-subjects', selectedClass, academicYear],
    queryFn: () => curriculumSubjectsService.listSubjects(selectedClass, academicYear),
    staleTime: 60_000,
  });

  // 2. Fetch Students via paporGradebookService
  const { data: rawStudents = [], isLoading: loadingStudents } = useQuery<GradebookStudent[]>({
    queryKey: ['papor-students', selectedClass],
    queryFn: () => paporGradebookService.getStudentsInClass(selectedClass),
    staleTime: 60_000,
  });

  // 2.1 Fetch Homeroom Teacher Info
  const { data: homeroomTeacherInfo } = useQuery({
    queryKey: ['papor-homeroom-teacher', selectedClass, academicYear],
    queryFn: () => teacherClassAssignmentService.getClassHomeroomTeacher(selectedClass, academicYear),
    staleTime: 60_000,
  });

  const homeroomTeacherName = homeroomTeacherInfo?.name || 'ครูประจำชั้น';

  const students: ReportCardStudent[] = useMemo(
    () =>
      rawStudents.map((st) => ({
        id: st.id,
        name: st.name,
        student_code: st.student_code,
        class: selectedClass,
        class_number: st.class_number,
        photo_url: st.photo_url,
      })),
    [rawStudents, selectedClass]
  );

  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  // Keep first student selected
  const activeStudentId = useMemo(() => {
    if (students.length === 0) return '';
    const exists = students.some((s) => s.id === selectedStudentId);
    return exists ? selectedStudentId : students[0].id;
  }, [students, selectedStudentId]);

  // 3. Fetch Scores for all students in class
  const { data: scoreRecords = [], isLoading: loadingScores } = useQuery({
    queryKey: ['papor-class-scores', selectedClass, academicYear],
    enabled: studentIds.length > 0,
    queryFn: () => paporGradebookService.getScoresForClass(academicYear, studentIds),
    staleTime: 30_000,
  });

  // 4. Fetch Promotion & Evaluation Records for all students in class
  const { data: promotionRecords = [], isLoading: loadingPromotions } = useQuery({
    queryKey: ['papor-reports-promotions', selectedClass, academicYear],
    enabled: studentIds.length > 0,
    queryFn: () => paporGradebookService.getPromotionsForClass(academicYear, studentIds),
    staleTime: 30_000,
  });

  // Map scores by studentId -> key
  const allScores = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const norm = (str: string) => (str || '').trim().toLowerCase().replace(/\s*[๑-๖1-6]$/, '');

    scoreRecords.forEach((sc) => {
      if (!map[sc.student_id]) map[sc.student_id] = {};
      const sub = subjects.find(
        (s) =>
          s.subject_name === sc.subject ||
          s.subject_code === sc.subject ||
          norm(s.subject_name) === norm(sc.subject)
      );
      const key = sub ? sub.subject_code : sc.subject;
      map[sc.student_id][`${key}_${sc.semester}_${sc.score_type}`] = sc.score;
      if (sub) {
        map[sc.student_id][`${sub.subject_code}_${sc.semester}_${sc.score_type}`] = sc.score;
      }
    });
    return map;
  }, [scoreRecords, subjects]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) || students[0],
    [students, activeStudentId]
  );

  // Helper to build ReportCardSubjectScore array for any student
  const getStudentScores = useMemo(() => {
    return (studentId: string): ReportCardSubjectScore[] => {
      if (subjects.length === 0) return [];
      const stScores = allScores[studentId] || {};

      return subjects.map((sub) => {
        // ดึงคะแนนตาม score_type จริงในฐานข้อมูล (เก็บ, กลางภาค, ปลายภาค)
        const f1 = stScores[`${sub.subject_code}_1_เก็บ`] ?? 0;
        const m1 = stScores[`${sub.subject_code}_1_กลางภาค`] ?? 0;
        const s1 = stScores[`${sub.subject_code}_1_ปลายภาค`] ?? 0;

        const f2 = stScores[`${sub.subject_code}_2_เก็บ`] ?? 0;
        const m2 = stScores[`${sub.subject_code}_2_กลางภาค`] ?? 0;
        const s2 = stScores[`${sub.subject_code}_2_ปลายภาค`] ?? 0;

        const t1 = f1 + m1 + s1;
        const t2 = f2 + m2 + s2;
        const totalScore = (t1 > 0 && t2 > 0) ? Math.round((t1 + t2) / 2) : (t1 || t2);
        const grade = scoreToGrade(totalScore);

        return {
          subject: sub,
          formativeScore: f1 + f2,
          summativeScore: (m1 + s1) + (m2 + s2),
          totalScore,
          grade,
          isPassed: parseFloat(grade) >= 1.0,
        };
      });
    };
  }, [subjects, allScores]);

  // Compute individual subject scores for active student
  const individualSubjectScores: ReportCardSubjectScore[] = useMemo(() => {
    if (!selectedStudent) return [];
    return getStudentScores(selectedStudent.id);
  }, [selectedStudent, getStudentScores]);

  // Map of all student scores for batch print
  const studentScoresMap = useMemo(() => {
    const map: Record<string, ReportCardSubjectScore[]> = {};
    students.forEach((st) => {
      map[st.id] = getStudentScores(st.id);
    });
    return map;
  }, [students, getStudentScores]);

  // Compute class summary rows
  const classSummaryRows: ClassSummaryStudentRow[] = useMemo(() => {
    if (students.length === 0 || subjects.length === 0) return [];

    const rowsWithGpa = students.map((st) => {
      const stScores = allScores[st.id] || {};
      const subjectGrades: Record<string, string> = {};
      let totalPts = 0;
      let totalCredits = 0;

      subjects.forEach((sub) => {
        const f1 = stScores[`${sub.subject_code}_1_เก็บ`] ?? 0;
        const m1 = stScores[`${sub.subject_code}_1_กลางภาค`] ?? 0;
        const s1 = stScores[`${sub.subject_code}_1_ปลายภาค`] ?? 0;

        const f2 = stScores[`${sub.subject_code}_2_เก็บ`] ?? 0;
        const m2 = stScores[`${sub.subject_code}_2_กลางภาค`] ?? 0;
        const s2 = stScores[`${sub.subject_code}_2_ปลายภาค`] ?? 0;

        const t1 = f1 + m1 + s1;
        const t2 = f2 + m2 + s2;
        const total = (t1 > 0 && t2 > 0) ? Math.round((t1 + t2) / 2) : (t1 || t2);
        const grade = scoreToGrade(total);

        subjectGrades[sub.subject_code] = grade;

        const cr = Number(sub.credit_units || 1);
        const gNum = parseFloat(grade) || 0;
        totalPts += gNum * cr;
        totalCredits += cr;
      });

      const gpa = totalCredits > 0 ? Number((totalPts / totalCredits).toFixed(2)) : 0;

      return {
        studentId: st.id,
        classNumber: st.class_number,
        studentCode: st.student_code,
        name: st.name,
        subjectGrades,
        totalGradePoints: totalPts,
        totalCredits,
        gpa,
        rank: 1,
        decision: 'ผ่าน (เลื่อนชั้น)',
      };
    });

    // Compute ranks by GPA with proper tie-breaking
    const sorted = [...rowsWithGpa].sort((a, b) => b.gpa - a.gpa);
    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0 && item.gpa < sorted[idx - 1].gpa) {
        currentRank = idx + 1;
      }
      item.rank = currentRank;
    });

    return rowsWithGpa;
  }, [students, subjects, allScores]);

  const defaultEvaluations: ReportCardEvaluations = {
    characterGrade: 'ดีเยี่ยม',
    competencyGrade: 'ดีเยี่ยม',
    readingGrade: 'ดีเยี่ยม',
    activityGrade: 'ผ่าน',
    attendanceDays: 200,
    attendanceTotal: 200,
    attendancePct: 100,
  };

  const studentEvaluationsMap = useMemo(() => {
    const map: Record<string, ReportCardEvaluations> = {};
    const promoMap = new Map(promotionRecords.map((p) => [p.student_id, p]));

    const toFull = (g?: string | null) =>
      g === 'ดย' ? 'ดีเยี่ยม' : g === 'ด' ? 'ดี' : g === 'ผ' ? 'ผ่าน' : g || 'ดีเยี่ยม';

    students.forEach((st) => {
      const p = promoMap.get(st.id);
      if (!p) {
        map[st.id] = defaultEvaluations;
        return;
      }

      map[st.id] = {
        characterGrade: toFull(p.character_grade),
        competencyGrade: toFull(p.competency_grade),
        readingGrade: toFull(p.reading_grade),
        activityGrade: p.activities_status === false ? 'ไม่ผ่าน' : 'ผ่าน',
        attendanceDays: Math.round(((p.attendance_percent || 100) / 100) * 200),
        attendanceTotal: 200,
        attendancePct: p.attendance_percent || 100,
      };
    });
    return map;
  }, [students, promotionRecords]);

  const activeStudentEvaluations = useMemo(() => {
    if (!selectedStudent) return defaultEvaluations;
    return studentEvaluationsMap[selectedStudent.id] || defaultEvaluations;
  }, [selectedStudent, studentEvaluationsMap]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loadingSubjects || loadingStudents || loadingScores || loadingPromotions;

  return (
    <div className="space-y-6 print:space-y-0 print:p-0 print:m-0">
      {/* Print Controls Header - Hidden during print */}
      <Card className="bg-card print:hidden shadow-sm border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  ศูนย์ออกรายงานและสั่งพิมพ์เอกสารทางการ (สพฐ.)
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  A4 มาตรฐาน
                </Badge>
              </div>
              <CardDescription className="mt-1">
                สร้างเอกสาร ปพ.5, ปพ.6, ปพ.7, สลิปผู้ปกครอง และแดชบอร์ดวิเคราะห์ผลสัมฤทธิ์ สั่งพิมพ์หรือเซฟเป็น PDF ได้ในคลิกเดียว
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowToolbar(!showToolbar)}
                className="gap-1.5 text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showToolbar ? 'ซ่อนตัวเลือกพิมพ์' : 'ปรับแต่งการพิมพ์'}
              </Button>
              <Button onClick={handlePrint} className="gap-2 shadow-sm font-semibold">
                <Printer className="w-4 h-4" /> สั่งพิมพ์ / บันทึก PDF
              </Button>
            </div>
          </div>

          {/* Collapsible Print Customizer Toolbar */}
          {showToolbar && (
            <div className="mt-4 p-3.5 bg-muted/40 rounded-lg border border-border flex flex-wrap items-center gap-6 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> ตัวเลือกพิมพ์:
              </span>
              <div className="flex items-center space-x-2">
                <Switch
                  id="crest-toggle"
                  checked={showSchoolCrest}
                  onCheckedChange={setShowSchoolCrest}
                />
                <Label htmlFor="crest-toggle" className="cursor-pointer">
                  ตราโรงเรียน
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="photo-toggle"
                  checked={showStudentPhoto}
                  onCheckedChange={setShowStudentPhoto}
                />
                <Label htmlFor="photo-toggle" className="cursor-pointer flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> รูปถ่ายนักเรียน
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sig-toggle"
                  checked={showSignatures}
                  onCheckedChange={setShowSignatures}
                />
                <Label htmlFor="sig-toggle" className="cursor-pointer flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5" /> ช่องลายมือชื่อ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="qr-toggle"
                  checked={showQrVerification}
                  onCheckedChange={setShowQrVerification}
                />
                <Label htmlFor="qr-toggle" className="cursor-pointer flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> QR Code ตรวจสอบ
                </Label>
              </div>
            </div>
          )}

          {/* 6 Report Mode Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2">
            <Tabs value={reportMode} onValueChange={(v) => setReportMode(v as ReportMode)}>
              <TabsList className="bg-muted/60 flex-wrap h-auto p-1 gap-1">
                <TabsTrigger value="individual" className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> ๑. ปพ.6 รายบุคคล
                </TabsTrigger>
                <TabsTrigger value="batch_individual" className="gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> ๒. พิมพ์ทั้งห้อง 1-Click
                </TabsTrigger>
                <TabsTrigger value="class_summary" className="gap-1.5 text-xs">
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" /> ๓. ปพ.5-ป สรุปทั้งชั้น
                </TabsTrigger>
                <TabsTrigger value="parent_slip" className="gap-1.5 text-xs">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" /> ๔. สลิปผู้ปกครอง
                </TabsTrigger>
                <TabsTrigger value="certificate" className="gap-1.5 text-xs">
                  <Award className="w-3.5 h-3.5 text-violet-600" /> ๕. ใบรับรอง ปพ.7
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-pink-600" /> ๖. แดชบอร์ดวิเคราะห์
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Student Selector for Individual Modes */}
            {(reportMode === 'individual' || reportMode === 'parent_slip' || reportMode === 'certificate') &&
              students.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-medium text-foreground">นักเรียน:</span>
                  <Select value={activeStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="w-[230px] h-9 text-xs">
                      <SelectValue placeholder="เลือกนักเรียน" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.class_number ? `เลขที่ ${s.class_number} · ` : ''}{s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
          </div>
        </CardHeader>
      </Card>

      {/* Printable Paper Document Container */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">กำลังจัดเตรียมเอกสารสำหรับสั่งพิมพ์...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl">
          <p className="text-base font-semibold text-foreground">
            ยังไม่มีนักเรียนในชั้น {selectedClass} สำหรับออกรายงาน
          </p>
          <p className="text-sm text-muted-foreground">
            กรุณาใช้ปุ่ม "ดึงนักเรียนปัจจุบัน" ในแท็บสมุดคะแนน ปพ.5 เพื่อนำเข้าข้อมูลนักเรียน
          </p>
        </div>
      ) : (
        <div className="report-paper-wrapper bg-muted/40 p-2 md:p-6 rounded-xl border border-border flex justify-center print:p-0 print:m-0 print:bg-transparent print:border-none print:w-full">
          {/* Mode 1: ปพ.6 รายบุคคล */}
          {reportMode === 'individual' && selectedStudent && (
            <div className="bg-card rounded shadow-md border border-border print:shadow-none print:border-none w-full max-w-[210mm] print:max-w-none print:w-full print:m-0 print:p-0">
              <PrintableStudentReportCard
                student={selectedStudent}
                academicYear={academicYear}
                selectedClass={selectedClass}
                scores={individualSubjectScores}
                evaluations={defaultEvaluations}
                homeroomTeacher={homeroomTeacherName}
                directorName="นายสมพิศ แรงน้อย"
                academicHeadName="นางสาวมะลิวัลย์ จรุงพันธ์"
                showSchoolCrest={showSchoolCrest}
                showStudentPhoto={showStudentPhoto}
                showSignatures={showSignatures}
                showQrVerification={showQrVerification}
              />
            </div>
          )}

          {/* Mode 2: ปพ.6 พิมพ์ทั้งห้อง 1-Click Batch Print */}
          {reportMode === 'batch_individual' && (
            <div className="w-full max-w-[210mm] print:max-w-none print:w-full print:m-0 print:p-0">
              <PrintableBatchStudentReportCards
                students={students}
                academicYear={academicYear}
                selectedClass={selectedClass}
                studentScoresMap={studentScoresMap}
                studentEvaluationsMap={studentEvaluationsMap}
                homeroomTeacher={homeroomTeacherName}
                directorName="นายสมพิศ แรงน้อย"
              />
            </div>
          )}

          {/* Mode 3: ปพ.5-ป สรุปทั้งชั้น (A4 แนวนอน) */}
          {reportMode === 'class_summary' && (
            <div className="bg-card rounded shadow-md border border-border print:shadow-none print:border-none w-full max-w-[297mm] print:max-w-none print:w-full print:m-0 print:p-0">
              <PrintableClassSummaryReport
                selectedClass={selectedClass}
                academicYear={academicYear}
                subjects={subjects}
                studentRows={classSummaryRows}
                homeroomTeacher={homeroomTeacherName}
                academicHead="นางสาวมะลิวัลย์ จรุงพันธ์"
                directorName="นายสมพิศ แรงน้อย"
              />
            </div>
          )}

          {/* Mode 4: สลิปแจ้งผลการเรียนสำหรับผู้ปกครอง */}
          {reportMode === 'parent_slip' && selectedStudent && (
            <div className="w-full max-w-[210mm] print:max-w-none print:w-full print:m-0 print:p-0">
              <PrintableParentGradeSlip
                student={selectedStudent}
                academicYear={academicYear}
                selectedClass={selectedClass}
                scores={individualSubjectScores}
                evaluations={activeStudentEvaluations}
                homeroomTeacher={homeroomTeacherName}
                showPhoto={showStudentPhoto}
                showQrVerification={showQrVerification}
              />
            </div>
          )}

          {/* Mode 5: ใบรับรองผลการศึกษา ปพ.7 */}
          {reportMode === 'certificate' && selectedStudent && (
            <div className="bg-card rounded shadow-md border border-border print:shadow-none print:border-none w-full max-w-[210mm] print:max-w-none print:w-full print:m-0 print:p-0">
              <PrintableAcademicCertificate
                student={selectedStudent}
                academicYear={academicYear}
                selectedClass={selectedClass}
                scores={individualSubjectScores}
                evaluations={activeStudentEvaluations}
                directorName="นายสมพิศ แรงน้อย"
                showSchoolCrest={showSchoolCrest}
                showQrVerification={showQrVerification}
              />
            </div>
          )}

          {/* Mode 6: แดชบอร์ดวิเคราะห์ผลสัมฤทธิ์ทางการเรียน */}
          {reportMode === 'analytics' && (
            <div className="w-full">
              <PaporAcademicAnalyticsDashboard
                selectedClass={selectedClass}
                academicYear={academicYear}
                subjects={subjects}
                studentRows={classSummaryRows}
              />
            </div>
          )}
        </div>
      )}

      {/* Print Instructions Callout - Hidden on print */}
      <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between text-xs text-muted-foreground print:hidden">
        <div>
          <span className="font-semibold text-foreground">💡 คำแนะนำการสั่งพิมพ์: </span>
          ในหน้าต่างพิมพ์ของเบราว์เซอร์ ให้เลือกขนาดกระดาษ <strong>A4</strong> และตั้งค่า <strong>Margins: Default / None</strong> และติ๊ก <strong>Background graphics</strong> เพื่อให้เอกสารคมชัดสวยงามสมบูรณ์แบบ
        </div>
        <Badge variant="outline" className="font-mono text-[11px]">
          สพฐ. กระดาษ A4
        </Badge>
      </div>
    </div>
  );
};

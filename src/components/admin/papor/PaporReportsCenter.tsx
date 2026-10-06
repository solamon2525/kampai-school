/**
 * PaporReportsCenter.tsx
 * ศูนย์ออกรายงานและสั่งพิมพ์เอกสารทางการ (สพฐ.) มาตรฐาน A4
 * - สลับดูใบ ปพ.6 รายบุคคล (A4 แนวตั้ง) และ ปพ.5-ป สรุปทั้งชั้น (A4 แนวนอน)
 * - แถบควบคุมตัวเลือกการพิมพ์ (Print Options Toolbar)
 * - สไตล์การพิมพ์ @media print คมชัด ไร้ขอบส่วนเกิน ประหยัดหมึก
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, FileText, LayoutGrid, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  curriculumSubjectsService,
  type ObecGradeSubjectRow,
} from '@/services/curriculum-subjects.service';
import {
  paporGradebookService,
  type GradebookStudent,
} from '@/services/papor-gradebook.service';
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

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

type ReportMode = 'individual' | 'class_summary';

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
  academicYear = '2568',
}) => {
  const [reportMode, setReportMode] = useState<ReportMode>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

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

  const students: ReportCardStudent[] = useMemo(
    () =>
      rawStudents.map((st) => ({
        id: st.id,
        name: st.name,
        student_code: st.student_code,
        class_number: st.class_number,
        photo_url: st.photo_url,
      })),
    [rawStudents]
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('score_records')
        .select('*')
        .eq('academic_year', academicYear)
        .in('student_id', studentIds);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Map scores by studentId -> key
  const allScores = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    scoreRecords.forEach((sc) => {
      if (!map[sc.student_id]) map[sc.student_id] = {};
      const sub = subjects.find((s) => s.subject_name === sc.subject);
      const key = sub ? sub.subject_code : sc.subject;
      map[sc.student_id][`${key}_${sc.semester}_${sc.score_type}`] = sc.score;
    });
    return map;
  }, [scoreRecords, subjects]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) || students[0],
    [students, activeStudentId]
  );

  // Compute individual subject scores
  const individualSubjectScores: ReportCardSubjectScore[] = useMemo(() => {
    if (!selectedStudent || subjects.length === 0) return [];

    const stScores = allScores[selectedStudent.id] || {};

    return subjects.map((sub) => {
      const f1 = stScores[`${sub.subject_code}_1_ระหว่างเรียน_T1`] ?? 0;
      const s1 = stScores[`${sub.subject_code}_1_ปลายภาค_T1`] ?? 0;
      const f2 = stScores[`${sub.subject_code}_2_ระหว่างเรียน_T2`] ?? 0;
      const s2 = stScores[`${sub.subject_code}_2_ปลายภาค_T2`] ?? 0;

      const t1 = f1 + s1;
      const t2 = f2 + s2;
      const yearly = Math.round((t1 + t2) / 2);
      const totalScore = yearly > 0 ? yearly : t1 || t2;
      const grade = scoreToGrade(totalScore);

      return {
        code: sub.subject_code,
        name: sub.subject_name,
        creditUnits: Number(sub.credit_units || 1),
        creditHours: sub.credit_hours,
        type: sub.subject_type === 'เพิ่มเติม' ? 'additional' : 'core',
        formativeScore: f1 + f2,
        summativeScore: s1 + s2,
        totalScore,
        grade,
      };
    });
  }, [selectedStudent, subjects, allScores]);

  // Compute class summary rows
  const classSummaryRows: ClassSummaryStudentRow[] = useMemo(() => {
    if (students.length === 0 || subjects.length === 0) return [];

    const rowsWithGpa = students.map((st) => {
      const stScores = allScores[st.id] || {};
      const subjectGrades: Record<string, string> = {};
      let totalPts = 0;
      let totalCredits = 0;
      let totalAnnualScore = 0;

      subjects.forEach((sub) => {
        const f1 = stScores[`${sub.subject_code}_1_ระหว่างเรียน_T1`] ?? 0;
        const s1 = stScores[`${sub.subject_code}_1_ปลายภาค_T1`] ?? 0;
        const f2 = stScores[`${sub.subject_code}_2_ระหว่างเรียน_T2`] ?? 0;
        const s2 = stScores[`${sub.subject_code}_2_ปลายภาค_T2`] ?? 0;

        const t1 = f1 + s1;
        const t2 = f2 + s2;
        const yearly = Math.round((t1 + t2) / 2);
        const total = yearly > 0 ? yearly : t1 || t2;
        const grade = scoreToGrade(total);

        subjectGrades[sub.subject_code] = grade;
        totalAnnualScore += total;

        const cr = Number(sub.credit_units || 1);
        const gNum = parseFloat(grade) || 0;
        totalPts += gNum * cr;
        totalCredits += cr;
      });

      const gpa = totalCredits > 0 ? Number((totalPts / totalCredits).toFixed(2)) : 0;

      return {
        id: st.id,
        studentNo: st.class_number || 0,
        studentCode: st.student_code || '-',
        studentName: st.name,
        photoUrl: st.photo_url,
        subjectGrades,
        totalScore: totalAnnualScore,
        gpa,
        rank: 1,
        evaluationsSummary: 'ดีเยี่ยม',
        promotionDecision: 'ผ่าน (เลื่อนชั้น)',
      };
    });

    // Compute ranks by GPA
    const sorted = [...rowsWithGpa].sort((a, b) => b.gpa - a.gpa);
    sorted.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return rowsWithGpa;
  }, [students, subjects, allScores]);

  const defaultEvaluations: ReportCardEvaluations = {
    characterScore: 'ดีเยี่ยม (3)',
    competencyScore: 'ดีเยี่ยม (3)',
    readingScore: 'ดีเยี่ยม (3)',
    activitiesScore: 'ผ่าน (ผ)',
    attendanceDays: 200,
    attendanceTotal: 200,
    attendancePct: 100,
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loadingSubjects || loadingStudents || loadingScores;

  return (
    <div className="space-y-6">
      {/* Print Controls Header - Hidden during print */}
      <Card className="bg-card print:hidden shadow-sm border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  ศูนย์ออกรายงานและสั่งพิมพ์เอกสารทางการ (สพฐ.)
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                สร้างเอกสารแบบพิมพ์กระดาษ A4 มาตรฐาน พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ผ่านเบราว์เซอร์ได้ทันที
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
              <Button onClick={handlePrint} className="gap-2 shadow-sm font-semibold">
                <Printer className="w-4 h-4" /> สั่งพิมพ์ / บันทึก PDF (Print)
              </Button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2">
            <Tabs value={reportMode} onValueChange={(v) => setReportMode(v as ReportMode)}>
              <TabsList className="bg-muted/60">
                <TabsTrigger value="individual" className="gap-2 text-xs md:text-sm">
                  <FileText className="w-4 h-4 text-blue-600" /> ใบรายงานรายบุคคล (ปพ.6)
                </TabsTrigger>
                <TabsTrigger value="class_summary" className="gap-2 text-xs md:text-sm">
                  <LayoutGrid className="w-4 h-4 text-emerald-600" /> ใบสรุปผลประจำชั้น (ปพ.5-ป)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {reportMode === 'individual' && students.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">เลือกนักเรียน:</span>
                <Select value={activeStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="เลือกนักเรียน" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
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
        <div className="report-paper-wrapper bg-muted/40 p-2 md:p-6 rounded-xl border border-border flex justify-center print:p-0 print:m-0 print:bg-transparent print:border-none">
          {reportMode === 'individual' && selectedStudent && (
            <div className="bg-white rounded shadow-md border border-neutral-200 print:shadow-none print:border-none w-full max-w-[210mm]">
              <PrintableStudentReportCard
                student={selectedStudent}
                academicYear={academicYear}
                selectedClass={selectedClass}
                scores={individualSubjectScores}
                evaluations={defaultEvaluations}
              />
            </div>
          )}

          {reportMode === 'class_summary' && (
            <div className="bg-white rounded shadow-md border border-neutral-200 print:shadow-none print:border-none w-full max-w-[297mm]">
              <PrintableClassSummaryReport
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
          ในหน้าต่างพิมพ์ของเบราว์เซอร์ ให้เลือกขนาดกระดาษ <strong>A4</strong> และตั้งค่า <strong>Margins: Default / None</strong> เพื่อให้เส้นขอบและตัวอักษรคมชัดพอดีหน้ากระดาษ
        </div>
        <Badge variant="outline" className="font-mono text-[11px]">
          สพฐ. กระดาษ A4
        </Badge>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [subjects, setSubjects] = useState<ObecGradeSubjectRow[]>([]);
  const [students, setStudents] = useState<ReportCardStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [allScores, setAllScores] = useState<Record<string, Record<string, number>>>({}); // studentId -> subject_code -> score
  const [isLoading, setIsLoading] = useState(false);

  // Load subjects and students
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, academicYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjList, stList] = await Promise.all([
        curriculumSubjectsService.listSubjects(selectedClass, academicYear),
        supabase
          .from('students')
          .select('id, name, student_code, class, class_number, photo_url')
          .eq('is_active', true)
          .eq('class', selectedClass)
          .order('class_number', { ascending: true })
          .order('student_code', { ascending: true }),
      ]);

      setSubjects(subjList);
      const studentItems = (stList.data || []) as ReportCardStudent[];
      setStudents(studentItems);

      if (studentItems.length > 0) {
        setSelectedStudentId((prev) => {
          const exists = studentItems.some((s) => s.id === prev);
          return exists ? prev : studentItems[0].id;
        });

        // Fetch scores for all students in this class
        const sIds = studentItems.map((s) => s.id);
        const { data: scoreRecords } = await supabase
          .from('score_records')
          .select('*')
          .eq('academic_year', academicYear)
          .in('student_id', sIds);

        // Group scores
        const map: Record<string, Record<string, number>> = {};
        scoreRecords?.forEach((sc) => {
          if (!map[sc.student_id]) map[sc.student_id] = {};
          // Find subject_code for subject_name
          const sub = subjList.find((s) => s.subject_name === sc.subject);
          const key = sub ? sub.subject_code : sc.subject;
          map[sc.student_id][`${key}_${sc.semester}_${sc.score_type}`] = sc.score;
        });
        setAllScores(map);
      } else {
        setSelectedStudentId('');
        setAllScores({});
      }
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  // Compute individual scores for selected student
  const individualSubjectScores: ReportCardSubjectScore[] = useMemo(() => {
    if (!selectedStudent) return [];
    const stScoreData = allScores[selectedStudent.id] || {};

    return subjects.map((sub) => {
      const f1 = stScoreData[`${sub.subject_code}_1_ระหว่างเรียน_T1`] ?? 0;
      const s1 = stScoreData[`${sub.subject_code}_1_ปลายภาค_T1`] ?? 0;
      const f2 = stScoreData[`${sub.subject_code}_2_ระหว่างเรียน_T2`] ?? 0;
      const s2 = stScoreData[`${sub.subject_code}_2_ปลายภาค_T2`] ?? 0;

      const t1 = f1 + s1;
      const t2 = f2 + s2;
      const total = Math.round((t1 + t2) / 2) || t1 || t2;
      const grade = scoreToGrade(total);

      return {
        subject: sub,
        formativeScore: f1 + f2,
        summativeScore: s1 + s2,
        totalScore: total,
        grade,
        isPassed: total >= (sub.passing_score || 50),
      };
    });
  }, [selectedStudent, subjects, allScores]);

  // Compute class summary student rows
  const classSummaryRows: ClassSummaryStudentRow[] = useMemo(() => {
    const rows = students.map((st) => {
      const stScoreData = allScores[st.id] || {};
      const subjectGrades: Record<string, string> = {};
      let totalGradePoints = 0;
      let totalCredits = 0;

      subjects.forEach((sub) => {
        const f1 = stScoreData[`${sub.subject_code}_1_ระหว่างเรียน_T1`] ?? 0;
        const s1 = stScoreData[`${sub.subject_code}_1_ปลายภาค_T1`] ?? 0;
        const f2 = stScoreData[`${sub.subject_code}_2_ระหว่างเรียน_T2`] ?? 0;
        const s2 = stScoreData[`${sub.subject_code}_2_ปลายภาค_T2`] ?? 0;

        const t1 = f1 + s1;
        const t2 = f2 + s2;
        const total = Math.round((t1 + t2) / 2) || t1 || t2;
        const grade = scoreToGrade(total);
        subjectGrades[sub.subject_code] = grade;

        const w = Number(sub.credit_units) || 0;
        totalGradePoints += (parseFloat(grade) || 0) * w;
        totalCredits += w;
      });

      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      return {
        studentId: st.id,
        classNumber: st.class_number,
        studentCode: st.student_code,
        name: st.name,
        subjectGrades,
        totalGradePoints,
        totalCredits,
        gpa,
        rank: 0,
        decision: 'อนุมัติเลื่อนชั้น',
      };
    });

    // Calculate ranks by GPA descending
    const sorted = [...rows].sort((a, b) => b.gpa - a.gpa);
    sorted.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rows;
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Controls Header - Hidden during print */}
      <Card className="bg-card print:hidden">
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
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
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

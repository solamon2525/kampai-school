import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  Save,
  Loader2,
  RefreshCw,
  Users,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  curriculumSubjectsService,
  type ObecGradeSubjectRow,
} from '@/services/curriculum-subjects.service';

interface StudentItem {
  id: string;
  name: string;
  student_code: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface GradeRow {
  student: StudentItem;
  formativeT1: number;
  summativeT1: number;
  formativeT2: number;
  summativeT2: number;
  totalT1: number;
  totalT2: number;
  yearlyTotal: number;
  grade: string;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
  onNavigateToSubjects?: () => void;
}

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

export const PaporGradebookGrid: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
  onNavigateToSubjects,
}) => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<ObecGradeSubjectRow[]>([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Load Subjects for current class
  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, academicYear]);

  const loadSubjects = async () => {
    try {
      const list = await curriculumSubjectsService.listSubjects(selectedClass, academicYear);
      setSubjects(list);
      if (list.length > 0) {
        // Keep selected if exists, else pick first
        setSelectedSubjectCode((prev) => {
          const match = list.find((s) => s.subject_code === prev);
          return match ? match.subject_code : list[0].subject_code;
        });
      } else {
        setSelectedSubjectCode('');
      }
    } catch (e) {
      console.error('Failed to load subjects:', e);
    }
  };

  const currentSubject = subjects.find((s) => s.subject_code === selectedSubjectCode);

  // Load students and scores when subject or class changes
  useEffect(() => {
    if (selectedSubjectCode) {
      loadClassData();
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubjectCode, academicYear]);

  const loadClassData = async () => {
    if (!currentSubject) return;
    setIsLoading(true);
    try {
      // 1. Get students for class strictly from students table
      const { data: stList } = await supabase
        .from('students')
        .select('id, name, student_code, class, class_number, photo_url')
        .eq('is_active', true)
        .eq('class', selectedClass)
        .order('class_number', { ascending: true })
        .order('student_code', { ascending: true });

      const filteredStudents = stList || [];
      setStudents(filteredStudents);

      if (filteredStudents.length === 0) {
        setRows([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch existing scores for current subject and academic year
      const sIds = filteredStudents.map((s) => s.id);
      const { data: existingScores } = await supabase
        .from('score_records')
        .select('*')
        .eq('academic_year', academicYear)
        .eq('subject', currentSubject.subject_name)
        .in('student_id', sIds);

      const scoreMap: Record<string, Record<string, number>> = {};
      existingScores?.forEach((sc) => {
        if (!scoreMap[sc.student_id]) scoreMap[sc.student_id] = {};
        scoreMap[sc.student_id][`${sc.semester}_${sc.score_type}`] = sc.score;
      });

      // 3. Construct rows
      const initialRows: GradeRow[] = filteredStudents.map((st) => {
        const sData = scoreMap[st.id] || {};
        const f1 = sData['1_ระหว่างเรียน_T1'] ?? 0;
        const s1 = sData['1_ปลายภาค_T1'] ?? 0;
        const f2 = sData['2_ระหว่างเรียน_T2'] ?? 0;
        const s2 = sData['2_ปลายภาค_T2'] ?? 0;

        const t1 = f1 + s1;
        const t2 = f2 + s2;
        const yearly = Math.round((t1 + t2) / 2);
        const grade = scoreToGrade(yearly > 0 ? yearly : t1 || t2);

        return {
          student: st,
          formativeT1: f1,
          summativeT1: s1,
          formativeT2: f2,
          summativeT2: s2,
          totalT1: t1,
          totalT2: t2,
          yearlyTotal: yearly,
          grade,
        };
      });

      setRows(initialRows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดคะแนน';
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลคะแนนไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auto-enroll from DB
  const handleAutoEnroll = async () => {
    setIsEnrolling(true);
    try {
      const res = await curriculumSubjectsService.enrollClassStudents(academicYear, selectedClass);
      toast({
        title: 'เชื่อมโยงนักเรียนสำเร็จ',
        description: `ดึงข้อมูลนักเรียนชั้น ${selectedClass} จำนวน ${res.enrolled_count} คน เข้าสู่ระบบเรียบร้อย`,
      });
      loadClassData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน';
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: msg,
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle cell input change
  const handleScoreChange = (
    index: number,
    field: 'formativeT1' | 'summativeT1' | 'formativeT2' | 'summativeT2',
    val: string
  ) => {
    const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
    setRows((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: num };

      target.totalT1 = target.formativeT1 + target.summativeT1;
      target.totalT2 = target.formativeT2 + target.summativeT2;
      target.yearlyTotal = Math.round((target.totalT1 + target.totalT2) / 2);
      target.grade = scoreToGrade(target.yearlyTotal > 0 ? target.yearlyTotal : target.totalT1 || target.totalT2);

      next[index] = target;
      return next;
    });
  };

  // Save all changed scores to score_records
  const handleSaveAll = async () => {
    if (!currentSubject) return;
    setIsSaving(true);
    try {
      const recordsToUpsert: Array<{
        student_id: string;
        subject: string;
        score_type: string;
        score: number;
        max_score: number;
        semester: string;
        academic_year: string;
        recorded_by: string;
      }> = [];

      rows.forEach((r) => {
        recordsToUpsert.push(
          {
            student_id: r.student.id,
            subject: currentSubject.subject_name,
            score_type: 'ระหว่างเรียน_T1',
            score: r.formativeT1,
            max_score: currentSubject.formative_weight,
            semester: '1',
            academic_year: academicYear,
            recorded_by: 'ระบบ ปพ.5 ออนไลน์',
          },
          {
            student_id: r.student.id,
            subject: currentSubject.subject_name,
            score_type: 'ปลายภาค_T1',
            score: r.summativeT1,
            max_score: currentSubject.summative_weight,
            semester: '1',
            academic_year: academicYear,
            recorded_by: 'ระบบ ปพ.5 ออนไลน์',
          },
          {
            student_id: r.student.id,
            subject: currentSubject.subject_name,
            score_type: 'ระหว่างเรียน_T2',
            score: r.formativeT2,
            max_score: currentSubject.formative_weight,
            semester: '2',
            academic_year: academicYear,
            recorded_by: 'ระบบ ปพ.5 ออนไลน์',
          },
          {
            student_id: r.student.id,
            subject: currentSubject.subject_name,
            score_type: 'ปลายภาค_T2',
            score: r.summativeT2,
            max_score: currentSubject.summative_weight,
            semester: '2',
            academic_year: academicYear,
            recorded_by: 'ระบบ ปพ.5 ออนไลน์',
          }
        );
      });

      const { error } = await supabase.from('score_records').upsert(recordsToUpsert as never[], {
        onConflict: 'student_id,subject,score_type,semester,academic_year',
      });

      if (error) throw error;

      toast({
        title: 'บันทึกคะแนนเรียบร้อย',
        description: `บันทึกคะแนนวิชา ${currentSubject.subject_name} จำนวน ${rows.length} คน เรียบร้อยแล้ว`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกคะแนน';
      toast({
        variant: 'destructive',
        title: 'บันทึกคะแนนไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) — ชั้น {selectedClass}
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              บันทึกคะแนนระหว่างเรียนและคะแนนปลายภาค คำนวณตัดเกรด 8 ระดับ (0–4) ตามหลักสูตรแกนกลาง สพฐ.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto Enroll Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoEnroll}
              disabled={isEnrolling}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              ดึงนักเรียนปัจจุบัน ({students.length} คน)
            </Button>

            {/* Save Button */}
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={isSaving || rows.length === 0}
              className="gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              บันทึกคะแนน
            </Button>
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">เลือกรายวิชา:</span>
            {subjects.length > 0 ? (
              <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="เลือกวิชา" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.subject_code}>
                      {s.subject_code} · {s.subject_name} ({s.subject_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600 bg-amber-50">
                  ยังไม่มีรายวิชาสำหรับชั้นนี้
                </Badge>
                {onNavigateToSubjects && (
                  <Button variant="ghost" size="sm" onClick={onNavigateToSubjects} className="gap-1 text-xs">
                    ไปที่โครงสร้างรายวิชา <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {currentSubject && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono">
                หน่วยกิต: {Number(currentSubject.credit_units).toFixed(1)} ({currentSubject.credit_hours} ชม.)
              </Badge>
              <Badge variant="secondary">
                อัตราส่วน: {currentSubject.formative_weight}:{currentSubject.summative_weight}
              </Badge>
              <Badge variant="outline">
                {currentSubject.subject_group}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">กำลังโหลดรายชื่อนักเรียนและคะแนน...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground/60 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {subjects.length === 0
                ? `ยังไม่มีรายวิชาในชั้น ${selectedClass} กรุณาเพิ่มรายวิชาในแท็บ "โครงสร้างรายวิชา" ก่อน`
                : `ไม่พบนักเรียนในชั้น ${selectedClass} หรือยังไม่ได้เชื่อมโยงข้อมูล`}
            </p>
            {subjects.length > 0 && (
              <Button onClick={handleAutoEnroll} variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> ดึงรายชื่อนักเรียนในชั้น {selectedClass} ทันที
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                  <th rowSpan={2} className="p-3 w-12 text-center border-r border-border">#</th>
                  <th rowSpan={2} className="p-3 min-w-[200px] text-left border-r border-border">นักเรียน</th>
                  <th colSpan={3} className="p-2 border-b border-border border-r bg-blue-500/5">
                    ภาคเรียนที่ 1 ({currentSubject?.formative_weight}:{currentSubject?.summative_weight})
                  </th>
                  <th colSpan={3} className="p-2 border-b border-border border-r bg-emerald-500/5">
                    ภาคเรียนที่ 2 ({currentSubject?.formative_weight}:{currentSubject?.summative_weight})
                  </th>
                  <th colSpan={2} className="p-2 border-b border-border bg-amber-500/5">
                    สรุปผลปลายปี
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/20 text-xs text-muted-foreground text-center">
                  <th className="p-2 w-20">เก็บ ({currentSubject?.formative_weight})</th>
                  <th className="p-2 w-20">สอบ ({currentSubject?.summative_weight})</th>
                  <th className="p-2 w-16 border-r border-border font-bold text-foreground">รวม</th>
                  <th className="p-2 w-20">เก็บ ({currentSubject?.formative_weight})</th>
                  <th className="p-2 w-20">สอบ ({currentSubject?.summative_weight})</th>
                  <th className="p-2 w-16 border-r border-border font-bold text-foreground">รวม</th>
                  <th className="p-2 w-20 font-bold text-foreground">คะแนนเฉลี่ย</th>
                  <th className="p-2 w-20 font-bold text-primary">เกรด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, idx) => (
                  <tr key={row.student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border">
                      {row.student.class_number || idx + 1}
                    </td>
                    <td className="p-3 border-r border-border">
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          name={row.student.name}
                          photoUrl={row.student.photo_url}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium text-foreground">{row.student.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {row.student.student_code ? `รหัส ${row.student.student_code}` : 'ไม่มีรหัส'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Term 1 */}
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min="0"
                        max={currentSubject?.formative_weight || 70}
                        value={row.formativeT1 || ''}
                        onChange={(e) => handleScoreChange(idx, 'formativeT1', e.target.value)}
                        className="h-8 w-16 text-center mx-auto text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min="0"
                        max={currentSubject?.summative_weight || 30}
                        value={row.summativeT1 || ''}
                        onChange={(e) => handleScoreChange(idx, 'summativeT1', e.target.value)}
                        className="h-8 w-16 text-center mx-auto text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-center border-r border-border font-mono font-semibold text-foreground">
                      {row.totalT1}
                    </td>

                    {/* Term 2 */}
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min="0"
                        max={currentSubject?.formative_weight || 70}
                        value={row.formativeT2 || ''}
                        onChange={(e) => handleScoreChange(idx, 'formativeT2', e.target.value)}
                        className="h-8 w-16 text-center mx-auto text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min="0"
                        max={currentSubject?.summative_weight || 30}
                        value={row.summativeT2 || ''}
                        onChange={(e) => handleScoreChange(idx, 'summativeT2', e.target.value)}
                        className="h-8 w-16 text-center mx-auto text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 text-center border-r border-border font-mono font-semibold text-foreground">
                      {row.totalT2}
                    </td>

                    {/* Final Yearly */}
                    <td className="p-2 text-center font-mono font-bold text-foreground">
                      {row.yearlyTotal}
                    </td>
                    <td className="p-2 text-center font-mono font-bold">
                      <Badge
                        variant={row.grade === '4' ? 'default' : row.grade === '0' ? 'destructive' : 'secondary'}
                        className="px-2 py-0.5 text-xs"
                      >
                        {row.grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

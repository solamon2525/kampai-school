/**
 * PaporGradebookGrid.tsx
 * สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียนออนไลน์ (ปพ.5)
 * - สถาปัตยกรรมระดับ Production (paporGradebookService + TanStack Query)
 * - ระบบนำทางแป้นพิมพ์ระดับ Excel (Arrow keys, Enter, Tab)
 * - ระบบ Range Enforcer ตรวจจับคะแนนเกินค่าน้ำหนักแบบเรียลไทม์
 * - ระบบบันทึกร่าง LocalStorage อัตโนมัติ ป้องกันข้อมูลสูญหาย 100%
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
  FileCheck,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  curriculumSubjectsService,
  type ObecGradeSubjectRow,
} from '@/services/curriculum-subjects.service';
import {
  paporGradebookService,
  paporDraftManager,
  type GradebookStudent,
  type ScoreItemPayload,
  type StudentGradeRecordPayload,
} from '@/services/papor-gradebook.service';
import { cn } from '@/lib/utils';

interface GradeRow {
  student: GradebookStudent;
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
  const queryClient = useQueryClient();
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // References for Excel-like keyboard navigation: grid of [studentIndex][fieldIndex]
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  // 1. Fetch Subjects via TanStack Query
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<ObecGradeSubjectRow[]>({
    queryKey: ['curriculum-subjects', selectedClass, academicYear],
    queryFn: () => curriculumSubjectsService.listSubjects(selectedClass, academicYear),
    staleTime: 60_000,
  });

  // Keep first subject selected when list loads or changes
  useEffect(() => {
    if (subjects.length > 0) {
      const match = subjects.find((s) => s.subject_code === selectedSubjectCode);
      if (!match) {
        setSelectedSubjectCode(subjects[0].subject_code);
      }
    } else {
      setSelectedSubjectCode('');
    }
  }, [subjects, selectedSubjectCode]);

  const currentSubject = useMemo(
    () => subjects.find((s) => s.subject_code === selectedSubjectCode),
    [subjects, selectedSubjectCode]
  );

  // 2. Fetch Students via paporGradebookService
  const { data: students = [], isLoading: loadingStudents } = useQuery<GradebookStudent[]>({
    queryKey: ['papor-students', selectedClass],
    queryFn: () => paporGradebookService.getStudentsInClass(selectedClass),
    staleTime: 60_000,
  });

  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  // 3. Fetch Scores for current subject
  const { data: existingScores = [], isLoading: loadingScores } = useQuery({
    queryKey: ['papor-scores', selectedClass, academicYear, currentSubject?.subject_name],
    enabled: !!currentSubject && studentIds.length > 0,
    queryFn: () =>
      paporGradebookService.getScoresForSubject(
        academicYear,
        currentSubject?.subject_name || '',
        studentIds
      ),
    staleTime: 30_000,
  });

  const draftKey = useMemo(
    () => paporDraftManager.getDraftKey(academicYear, selectedClass, selectedSubjectCode),
    [academicYear, selectedClass, selectedSubjectCode]
  );

  // Construct or Restore rows when data loads
  useEffect(() => {
    if (!currentSubject || students.length === 0) {
      setRows([]);
      return;
    }

    // Check if there is an uncommitted local draft
    const draft = paporDraftManager.getDraft<GradeRow[]>(draftKey);

    const scoreMap: Record<string, Record<string, number>> = {};
    existingScores.forEach((sc) => {
      if (!scoreMap[sc.student_id]) scoreMap[sc.student_id] = {};
      scoreMap[sc.student_id][`${sc.semester}_${sc.score_type}`] = sc.score;
    });

    const initialRows: GradeRow[] = students.map((st) => {
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

    // If draft exists and has data for this exact student roster
    if (draft && draft.data && draft.data.length === students.length) {
      setRows(draft.data);
      setIsDirty(true);
    } else {
      setRows(initialRows);
      setIsDirty(false);
    }
  }, [students, existingScores, currentSubject, draftKey]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentSubject) return;

      const recordsToUpsert: ScoreItemPayload[] = [];
      const gradesToUpsert: StudentGradeRecordPayload[] = [];

      rows.forEach((r) => {
        // Raw scores per semester
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

        // Computed annual student grade
        gradesToUpsert.push({
          student_id: r.student.id,
          subject_code: currentSubject.subject_code,
          subject_name: currentSubject.subject_name,
          credit_units: Number(currentSubject.credit_units) || 1,
          formative_score: r.formativeT1 + r.formativeT2,
          summative_score: r.summativeT1 + r.summativeT2,
          total_score: r.yearlyTotal,
          grade_level: r.grade,
          semester: '2',
          academic_year: academicYear,
        });
      });

      await paporGradebookService.saveScoresBatch(recordsToUpsert, gradesToUpsert);
    },
    onSuccess: () => {
      toast.success(`บันทึกคะแนนวิชา ${currentSubject?.subject_name} สำเร็จ`);
      paporDraftManager.clearDraft(draftKey);
      setIsDirty(false);
      setLastSavedTime(new Date().toLocaleTimeString('th-TH'));
      queryClient.invalidateQueries({ queryKey: ['papor-scores'] });
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกคะแนน';
      toast.error(msg);
    },
  });

  // Auto Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: () => curriculumSubjectsService.enrollStudentsFromClass(academicYear, selectedClass),
    onSuccess: (res) => {
      toast.success(`ดึงนักเรียนชั้น ${selectedClass} จำนวน ${res.enrolled_count} คน เข้าสู่ระบบเรียบร้อย`);
      queryClient.invalidateQueries({ queryKey: ['papor-students'] });
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน';
      toast.error(msg);
    },
  });

  // Handle cell input change & auto-save to LocalStorage draft
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

      // Debounced local draft save
      paporDraftManager.saveDraft(draftKey, next);
      setIsDirty(true);
      return next;
    });
  };

  // Keyboard navigation handler for rapid Excel-like entry
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    // colIndex mapping:
    // 0: formativeT1, 1: summativeT1, 2: formativeT2, 3: summativeT2
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < rows.length && inputRefs.current[nextRow]?.[colIndex]) {
        inputRefs.current[nextRow][colIndex]?.focus();
        inputRefs.current[nextRow][colIndex]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0 && inputRefs.current[prevRow]?.[colIndex]) {
        inputRefs.current[prevRow][colIndex]?.focus();
        inputRefs.current[prevRow][colIndex]?.select();
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      // If cursor is at the end or all text selected
      if (input.selectionEnd === input.value.length || input.selectionStart === 0) {
        const nextCol = colIndex + 1;
        if (nextCol <= 3 && inputRefs.current[rowIndex]?.[nextCol]) {
          e.preventDefault();
          inputRefs.current[rowIndex][nextCol]?.focus();
          inputRefs.current[rowIndex][nextCol]?.select();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        const prevCol = colIndex - 1;
        if (prevCol >= 0 && inputRefs.current[rowIndex]?.[prevCol]) {
          e.preventDefault();
          inputRefs.current[rowIndex][prevCol]?.focus();
          inputRefs.current[rowIndex][prevCol]?.select();
        }
      }
    }
  };

  const isLoading = loadingSubjects || loadingStudents || loadingScores;

  return (
    <Card className="bg-card shadow-sm border-border">
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
              บันทึกคะแนนระหว่างเรียนและปลายภาค คำนวณตัดเกรด 8 ระดับ (0–4) ตามหลักสูตรแกนกลาง สพฐ.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Pill */}
            {isDirty ? (
              <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-200 gap-1 text-xs">
                <AlertCircle className="w-3 h-3 text-amber-600" /> มีร่างในเครื่อง (ยังไม่บันทึก)
              </Badge>
            ) : lastSavedTime ? (
              <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-200 gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> บันทึกแล้ว ({lastSavedTime})
              </Badge>
            ) : null}

            {/* Auto Enroll Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              {enrollMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              ดึงนักเรียนปัจจุบัน ({students.length} คน)
            </Button>

            {/* Save Button */}
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || rows.length === 0}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
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
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="font-mono">
                หน่วยกิต: {Number(currentSubject.credit_units).toFixed(1)} ({currentSubject.credit_hours} ชม.)
              </Badge>
              <Badge variant="secondary">
                อัตราส่วน: {currentSubject.formative_weight}:{currentSubject.summative_weight}
              </Badge>
              <Badge variant="outline">{currentSubject.subject_group}</Badge>
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
              <Button
                onClick={() => enrollMutation.mutate()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" /> ดึงรายชื่อนักเรียนในชั้น {selectedClass} ทันที
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                  <th rowSpan={2} className="p-3 w-12 text-center border-r border-border sticky left-0 bg-muted/90 z-20">
                    #
                  </th>
                  <th rowSpan={2} className="p-3 min-w-[200px] text-left border-r border-border sticky left-12 bg-muted/90 z-20">
                    นักเรียน
                  </th>
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
                {rows.map((row, idx) => {
                  if (!inputRefs.current[idx]) {
                    inputRefs.current[idx] = [];
                  }

                  const f1Over = currentSubject && row.formativeT1 > currentSubject.formative_weight;
                  const s1Over = currentSubject && row.summativeT1 > currentSubject.summative_weight;
                  const f2Over = currentSubject && row.formativeT2 > currentSubject.formative_weight;
                  const s2Over = currentSubject && row.summativeT2 > currentSubject.summative_weight;

                  return (
                    <tr key={row.student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                        {row.student.class_number || idx + 1}
                      </td>
                      <td className="p-3 border-r border-border sticky left-12 bg-card z-10">
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
                          ref={(el) => { inputRefs.current[idx][0] = el; }}
                          type="number"
                          min="0"
                          max={currentSubject?.formative_weight || 70}
                          value={row.formativeT1 || ''}
                          onChange={(e) => handleScoreChange(idx, 'formativeT1', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 0)}
                          className={cn(
                            'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                            f1Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                          )}
                          title={f1Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.formative_weight})` : undefined}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Input
                          ref={(el) => { inputRefs.current[idx][1] = el; }}
                          type="number"
                          min="0"
                          max={currentSubject?.summative_weight || 30}
                          value={row.summativeT1 || ''}
                          onChange={(e) => handleScoreChange(idx, 'summativeT1', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                          className={cn(
                            'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                            s1Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                          )}
                          title={s1Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.summative_weight})` : undefined}
                        />
                      </td>
                      <td className="p-2 text-center border-r border-border font-mono font-semibold text-foreground">
                        {row.totalT1}
                      </td>

                      {/* Term 2 */}
                      <td className="p-2 text-center">
                        <Input
                          ref={(el) => { inputRefs.current[idx][2] = el; }}
                          type="number"
                          min="0"
                          max={currentSubject?.formative_weight || 70}
                          value={row.formativeT2 || ''}
                          onChange={(e) => handleScoreChange(idx, 'formativeT2', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                          className={cn(
                            'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                            f2Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                          )}
                          title={f2Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.formative_weight})` : undefined}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Input
                          ref={(el) => { inputRefs.current[idx][3] = el; }}
                          type="number"
                          min="0"
                          max={currentSubject?.summative_weight || 30}
                          value={row.summativeT2 || ''}
                          onChange={(e) => handleScoreChange(idx, 'summativeT2', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                          className={cn(
                            'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                            s2Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                          )}
                          title={s2Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.summative_weight})` : undefined}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

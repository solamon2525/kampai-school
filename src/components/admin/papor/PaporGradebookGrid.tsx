/**
 * PaporGradebookGrid.tsx
 * สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียนออนไลน์ (ปพ.5)
 * - สถาปัตยกรรมระดับ Production (paporGradebookService + TanStack Query)
 * - Live Analytics Header: สถิติค่านิยม Mean, Max, Min, Pass Rate (%) สดเหนือตาราง
 * - Grade Distribution Capsule Pills: แถบแคปซูลแสดงจำนวนนักเรียนเกรด 8 ระดับ (0 - 4) พร้อมคลิกกรอง
 * - Smart Search & Filter Toolbar: ค้นหาด่วนตามชื่อ/เลขที่ + ตัวกรองกลุ่มเสี่ยง/ยังไม่กรอก/ดีเยี่ยม
 * - Distraction-Free Zen / Focus Mode: โหมดขยายตารางเต็มจอ เพิ่มพื้นที่กรอกคะแนน
 * - Batch Fill Actions & Export: กรอกคะแนนเท่ากันทั้งห้องใน 1 คลิก + ส่งออก Excel ทันที
 * - ระบบนำทางแป้นพิมพ์ระดับ Excel (Arrow keys, Enter, Tab)
 * - ระบบ Range Enforcer ตรวจจับคะแนนเกินค่าน้ำหนักแบบเรียลไทม์
 * - ระบบบันทึกร่าง LocalStorage อัตโนมัติ ป้องกันข้อมูลสูญหาย 100%
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Download,
  SlidersHorizontal,
  Flame,
  Award,
  AlertTriangle,
  X,
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

export interface GradeRow {
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
  academicYear = '2569',
  onNavigateToSubjects,
}) => {
  const queryClient = useQueryClient();
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // New UX/UI states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'unfilled' | 'at_risk' | 'excellent'>('all');
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);

  // References for Excel-like keyboard navigation: grid of [rowIndex][fieldIndex]
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

  // Handle cell input change by student ID (immune to filtering indexing)
  const handleScoreChange = (
    studentId: string,
    field: 'formativeT1' | 'summativeT1' | 'formativeT2' | 'summativeT2',
    val: string
  ) => {
    const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.student.id !== studentId) return r;
        const target = { ...r, [field]: num };
        target.totalT1 = target.formativeT1 + target.summativeT1;
        target.totalT2 = target.formativeT2 + target.summativeT2;
        target.yearlyTotal = Math.round((target.totalT1 + target.totalT2) / 2);
        target.grade = scoreToGrade(
          target.yearlyTotal > 0 ? target.yearlyTotal : target.totalT1 || target.totalT2
        );
        return target;
      });

      // Debounced local draft save
      paporDraftManager.saveDraft(draftKey, next);
      setIsDirty(true);
      return next;
    });
  };

  // Batch Fill Helper: Set formative score for everyone
  const handleBatchFillFormative = (score: number) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        const target = {
          ...r,
          formativeT1: score,
          formativeT2: score,
        };
        target.totalT1 = target.formativeT1 + target.summativeT1;
        target.totalT2 = target.formativeT2 + target.summativeT2;
        target.yearlyTotal = Math.round((target.totalT1 + target.totalT2) / 2);
        target.grade = scoreToGrade(
          target.yearlyTotal > 0 ? target.yearlyTotal : target.totalT1 || target.totalT2
        );
        return target;
      });
      paporDraftManager.saveDraft(draftKey, next);
      setIsDirty(true);
      return next;
    });
    toast.success(`เติมคะแนนระหว่างเรียน ${score} คะแนน ให้ทุกคนเรียบร้อย`);
  };

  // Export Subject to Excel
  const handleExportExcel = () => {
    if (!currentSubject || rows.length === 0) return;
    const exportData = rows.map((r, i) => ({
      'เลขที่': r.student.class_number || i + 1,
      'รหัสนักเรียน': r.student.student_code || '-',
      'ชื่อ-นามสกุล': r.student.name,
      'คะแนนเก็บ ภาค 1': r.formativeT1,
      'สอบปลายภาค 1': r.summativeT1,
      'รวม ภาค 1': r.totalT1,
      'คะแนนเก็บ ภาค 2': r.formativeT2,
      'สอบปลายภาค 2': r.summativeT2,
      'รวม ภาค 2': r.totalT2,
      'คะแนนรวมทั้งปี': r.yearlyTotal,
      'ระดับผลการเรียน (เกรด)': r.grade,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentSubject.subject_code);
    XLSX.writeFile(wb, `${currentSubject.subject_code}_${selectedClass}_คะแนน_${academicYear}.xlsx`);
    toast.success(`ส่งออกคะแนนวิชา ${currentSubject.subject_name} สำเร็จ`);
  };

  // Keyboard navigation handler for rapid Excel-like entry
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    displayedIndex: number,
    colIndex: number,
    totalDisplayed: number
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextRow = displayedIndex + 1;
      if (nextRow < totalDisplayed && inputRefs.current[nextRow]?.[colIndex]) {
        inputRefs.current[nextRow][colIndex]?.focus();
        inputRefs.current[nextRow][colIndex]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = displayedIndex - 1;
      if (prevRow >= 0 && inputRefs.current[prevRow]?.[colIndex]) {
        inputRefs.current[prevRow][colIndex]?.focus();
        inputRefs.current[prevRow][colIndex]?.select();
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionEnd === input.value.length || input.selectionStart === 0) {
        const nextCol = colIndex + 1;
        if (nextCol <= 3 && inputRefs.current[displayedIndex]?.[nextCol]) {
          e.preventDefault();
          inputRefs.current[displayedIndex][nextCol]?.focus();
          inputRefs.current[displayedIndex][nextCol]?.select();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        const prevCol = colIndex - 1;
        if (prevCol >= 0 && inputRefs.current[displayedIndex]?.[prevCol]) {
          e.preventDefault();
          inputRefs.current[displayedIndex][prevCol]?.focus();
          inputRefs.current[displayedIndex][prevCol]?.select();
        }
      }
    }
  };

  // 4. Live Analytics & Grade Distribution
  const analytics = useMemo(() => {
    if (rows.length === 0) {
      return {
        mean: '0.0',
        max: 0,
        min: 0,
        passRate: 0,
        gradedCount: 0,
        gradeCounts: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 } as Record<string, number>,
      };
    }
    const totals = rows.map((r) => r.yearlyTotal);
    const gradedRows = rows.filter((r) => r.yearlyTotal > 0 || r.totalT1 > 0 || r.totalT2 > 0);
    const gradedCount = gradedRows.length;
    const sum = totals.reduce((a, b) => a + b, 0);
    const mean = gradedCount > 0 ? (sum / gradedCount).toFixed(1) : '0.0';
    const max = Math.max(...totals);
    const min = gradedCount > 0 ? Math.min(...gradedRows.map((r) => r.yearlyTotal)) : 0;
    const passed = rows.filter((r) => parseFloat(r.grade) >= 1.0 && (r.yearlyTotal > 0 || r.totalT1 > 0 || r.totalT2 > 0)).length;
    const passRate = gradedCount > 0 ? Math.round((passed / gradedCount) * 100) : 0;

    const gradeCounts: Record<string, number> = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0,
    };
    rows.forEach((r) => {
      if (gradeCounts[r.grade] !== undefined) {
        gradeCounts[r.grade] += 1;
      }
    });

    return { mean, max, min, passRate, gradedCount, gradeCounts };
  }, [rows]);

  // 5. Filtered Rows for display
  const displayedRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.student.name.toLowerCase().includes(q);
        const matchCode = (r.student.student_code || '').toLowerCase().includes(q);
        const matchNum = String(r.student.class_number || '').includes(q);
        if (!matchName && !matchCode && !matchNum) return false;
      }

      // 2. Grade Capsule Filter
      if (gradeFilter && r.grade !== gradeFilter) {
        return false;
      }

      // 3. Category Filter
      if (filterCategory === 'unfilled') {
        return r.yearlyTotal === 0 && r.totalT1 === 0 && r.totalT2 === 0;
      }
      if (filterCategory === 'at_risk') {
        return r.yearlyTotal < 50 && (r.yearlyTotal > 0 || r.totalT1 > 0 || r.totalT2 > 0);
      }
      if (filterCategory === 'excellent') {
        return r.grade === '4' || r.grade === '3.5';
      }

      return true;
    });
  }, [rows, searchQuery, gradeFilter, filterCategory]);

  const isLoading = loadingSubjects || loadingStudents || loadingScores;

  return (
    <div className={cn('space-y-4 transition-all duration-200', isFocusMode && 'fixed inset-0 z-50 bg-background overflow-auto p-4 md:p-6')}>
      <Card className="bg-card shadow-sm border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) — ชั้น {selectedClass}
                </CardTitle>
                {isFocusMode && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    Zen Focus Mode
                  </Badge>
                )}
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

              {/* Focus / Zen Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="gap-1.5 text-xs"
                title={isFocusMode ? 'ออกจากโหมดเต็มจอ' : 'ขยายเต็มจอ (Zen Mode)'}
              >
                {isFocusMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" /> ย่อหน้าต่าง
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" /> เต็มจอ (Focus)
                  </>
                )}
              </Button>

              {/* Batch Actions & Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> จัดการคะแนนด่วน
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>เครื่องมือช่วยกรอกคะแนน</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBatchFillFormative(currentSubject?.formative_weight || 70)}
                    disabled={!currentSubject || rows.length === 0}
                  >
                    กรอกคะแนนเก็บเต็ม ({currentSubject?.formative_weight || 70}) ทั้งห้อง
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBatchFillFormative(Math.round((currentSubject?.formative_weight || 70) * 0.8))}
                    disabled={!currentSubject || rows.length === 0}
                  >
                    กรอกคะแนนเก็บ 80% ({Math.round((currentSubject?.formative_weight || 70) * 0.8)}) ทั้งห้อง
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportExcel} disabled={!currentSubject || rows.length === 0}>
                    <Download className="w-3.5 h-3.5 mr-2" /> ส่งออก Excel (.xlsx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auto Enroll Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
              >
                {enrollMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                ดึงนักเรียน ({students.length} คน)
              </Button>

              {/* Save Button */}
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || rows.length === 0}
                className="gap-2 text-xs font-semibold"
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-medium text-foreground">เลือกรายวิชา:</span>
              {subjects.length > 0 ? (
                <Select value={selectedSubjectCode} onValueChange={setSelectedSubjectCode}>
                  <SelectTrigger className="w-[280px] h-9 text-xs">
                    <SelectValue placeholder="เลือกวิชา" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.subject_code} className="text-xs">
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

          {/* Live Analytics Bar */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-2 border-t border-border">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium">คะแนนเฉลี่ยวิชา (Mean)</div>
                  <div className="text-lg font-bold text-primary font-mono">{analytics.mean} / 100</div>
                </div>
                <Flame className="w-4 h-4 text-primary opacity-60" />
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium">ผ่านเกณฑ์ (Pass Rate)</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono">{analytics.passRate}%</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 opacity-60" />
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium">คะแนนสูงสุด / ต่ำสุด</div>
                  <div className="text-lg font-bold text-foreground font-mono">{analytics.max} / {analytics.min}</div>
                </div>
                <Award className="w-4 h-4 text-amber-500 opacity-60" />
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium">สถานะการกรอกคะแนน</div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {analytics.gradedCount} / {rows.length} คน
                  </div>
                </div>
                <Users className="w-4 h-4 text-muted-foreground opacity-60" />
              </div>
            </div>
          )}

          {/* Grade Distribution Capsule Pills */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">สถิติเกรด:</span>
              {(['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'] as const).map((lvl) => {
                const count = analytics.gradeCounts[lvl] || 0;
                const isSelected = gradeFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setGradeFilter(isSelected ? null : lvl)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-mono font-medium transition-all border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary'
                        : count > 0
                        ? 'bg-muted/60 text-foreground border-border hover:bg-muted'
                        : 'bg-muted/20 text-muted-foreground/60 border-transparent'
                    )}
                  >
                    เกรด {lvl}: <strong>{count}</strong>
                  </button>
                );
              })}
              {gradeFilter && (
                <button
                  type="button"
                  onClick={() => setGradeFilter(null)}
                  className="text-[11px] text-primary hover:underline ml-2 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> ล้างตัวกรองเกรด
                </button>
              )}
            </div>
          )}

          {/* Search & Filter Toolbar */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ หรือเลขที่..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Button
                  variant={filterCategory === 'all' && !gradeFilter ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setFilterCategory('all');
                    setGradeFilter(null);
                  }}
                  className="h-7 text-xs px-2.5"
                >
                  ทั้งหมด ({rows.length})
                </Button>
                <Button
                  variant={filterCategory === 'unfilled' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterCategory('unfilled')}
                  className="h-7 text-xs px-2.5"
                >
                  ยังไม่กรอก
                </Button>
                <Button
                  variant={filterCategory === 'at_risk' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterCategory('at_risk')}
                  className="h-7 text-xs px-2.5 text-amber-600"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" /> กลุ่มเสี่ยง (&lt;50)
                </Button>
                <Button
                  variant={filterCategory === 'excellent' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterCategory('excellent')}
                  className="h-7 text-xs px-2.5 text-emerald-600"
                >
                  <Award className="w-3 h-3 mr-1" /> ผลการเรียนดีเยี่ยม (≥3.5)
                </Button>
              </div>
            </div>
          )}
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
          ) : displayedRows.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Filter className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-medium text-foreground">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</p>
              <p className="text-xs text-muted-foreground">ลองล้างการค้นหาหรือเลือกดูนักเรียนทั้งหมด</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setGradeFilter(null);
                }}
                className="mt-2 text-xs"
              >
                ล้างตัวกรองทั้งหมด
              </Button>
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
                      นักเรียน ({displayedRows.length} คน)
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
                  {displayedRows.map((row, displayedIdx) => {
                    if (!inputRefs.current[displayedIdx]) {
                      inputRefs.current[displayedIdx] = [];
                    }

                    const f1Over = currentSubject && row.formativeT1 > currentSubject.formative_weight;
                    const s1Over = currentSubject && row.summativeT1 > currentSubject.summative_weight;
                    const f2Over = currentSubject && row.formativeT2 > currentSubject.formative_weight;
                    const s2Over = currentSubject && row.summativeT2 > currentSubject.summative_weight;

                    return (
                      <tr key={row.student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                          {row.student.class_number || displayedIdx + 1}
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
                            ref={(el) => { inputRefs.current[displayedIdx][0] = el; }}
                            type="number"
                            min="0"
                            max={currentSubject?.formative_weight || 70}
                            value={row.formativeT1 || ''}
                            onChange={(e) => handleScoreChange(row.student.id, 'formativeT1', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, displayedIdx, 0, displayedRows.length)}
                            className={cn(
                              'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                              f1Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                            )}
                            title={f1Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.formative_weight})` : undefined}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            ref={(el) => { inputRefs.current[displayedIdx][1] = el; }}
                            type="number"
                            min="0"
                            max={currentSubject?.summative_weight || 30}
                            value={row.summativeT1 || ''}
                            onChange={(e) => handleScoreChange(row.student.id, 'summativeT1', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, displayedIdx, 1, displayedRows.length)}
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
                            ref={(el) => { inputRefs.current[displayedIdx][2] = el; }}
                            type="number"
                            min="0"
                            max={currentSubject?.formative_weight || 70}
                            value={row.formativeT2 || ''}
                            onChange={(e) => handleScoreChange(row.student.id, 'formativeT2', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, displayedIdx, 2, displayedRows.length)}
                            className={cn(
                              'h-8 w-16 text-center mx-auto text-xs font-mono transition-colors',
                              f2Over && 'border-red-500 bg-red-50/50 text-red-600 font-bold'
                            )}
                            title={f2Over ? `คะแนนเกินพิกัด (เต็ม ${currentSubject?.formative_weight})` : undefined}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            ref={(el) => { inputRefs.current[displayedIdx][3] = el; }}
                            type="number"
                            min="0"
                            max={currentSubject?.summative_weight || 30}
                            value={row.summativeT2 || ''}
                            onChange={(e) => handleScoreChange(row.student.id, 'summativeT2', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, displayedIdx, 3, displayedRows.length)}
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
    </div>
  );
};

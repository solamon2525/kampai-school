/**
 * PaporSixViewer.tsx
 * ระบบดูและสั่งพิมพ์สมุดรายงานประจำตัวนักเรียน ปพ.6 ฉบับทางการ (โรงเรียนบ้านคำไผ่)
 * - เลือกระดับชั้นและนักเรียนรายบุคคล
 * - ระบบเลือกพิมพ์เฉพาะหน้าที่ต้องการ (Print Page Selector) เช่น 4 หน้าหลัก: ปก + ผลการเรียน + หน้า 8 + หน้า 9
 * - สวิตช์ภาคเรียนที่ 1: ซ่อนระดับผลการเรียน 0 ไม่ให้ปรากฏบนใบ ปพ.6 เพราะยังไม่จบปีการศึกษา
 * - โหมดแก้ไขหน้าพิมพ์ (Admin Manual Edit Mode): ให้แอดมิน/ครูกรอกคะแนน หมายเหตุ ติ๊กประเมิน และพิมพ์ความเห็นได้เอง
 * - ค่าเริ่มต้นในตารางประเมินและความคิดเห็นเป็น "ค่าว่าง (Blank)" 100% (ไม่มี mock ✓ หรือข้อความตัวอย่าง)
 * - ปรับระยะขอบและ Typography ไม่ให้มีข้อความล้นตัดขอบ (เช่น โรงเรียน, ร่างกาย, ผู้ปกครอง)
 * - รองรับการพิมพ์ A4 ต่อเนื่องหลายหน้าด้วย break-after: page
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  School,
  Edit3,
  RotateCcw,
  Check,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { paporService } from '@/services/papor.service';
import { paporGradebookService } from '@/services/papor-gradebook.service';
import { curriculumSubjectsService, type ObecGradeSubjectRow } from '@/services/curriculum-subjects.service';
import { teacherClassAssignmentService } from '@/services/teacher-class-assignment.service';
import { useQuery } from '@tanstack/react-query';

interface StudentOption {
  id: string;
  name: string;
  student_code: string | null;
  class: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

// รายการหน้าทั้งหมด 10 หน้าตามโครงสร้างสมุด ปพ.6 มาตรฐาน
export const BOOKLET_PAGES = [
  { id: 1, key: 'cover', title: 'หน้าปก (Cover)', isMain: true },
  { id: 2, key: 'p1_rules', title: 'หน้า 1: คำชี้แจงและระเบียบ', isMain: false },
  { id: 3, key: 'p2_profile', title: 'หน้า 2: ประวัติผู้เรียน', isMain: false },
  { id: 4, key: 'p3_health', title: 'หน้า 3: สุขภาพและน้ำหนัก', isMain: false },
  { id: 5, key: 'p4_advice', title: 'หน้า 4: คำแนะนำผู้ปกครอง', isMain: false },
  { id: 6, key: 'p5_grades', title: 'หน้า 5/รายบุคคล: ผลการเรียน (ปพ.6)', isMain: true },
  { id: 7, key: 'p6_activities', title: 'หน้า 6-7: กิจกรรม & สมรรถนะ', isMain: false },
  { id: 8, key: 'p8_teacher', title: 'หน้า 8: ความเห็นครูประจำชั้น', isMain: true },
  { id: 9, key: 'p9_parent', title: 'หน้า 9: ความเห็นผู้ปกครอง', isMain: true },
  { id: 10, key: 'p10_summary', title: 'หน้า 10: สรุปผลและการเลื่อนชั้น', isMain: false },
];

// คุณลักษณะของนักเรียนขณะอยู่ในโรงเรียน 12 ข้อ (หน้า 8)
export const TEACHER_TRAITS_12 = [
  '๑. ความขยันหมั่นเพียร',
  '๒. การปฏิบัติตามกฎระเบียบของโรงเรียน',
  '๓. ความรับผิดชอบ',
  '๔. มนุษย์สัมพันธ์',
  '๕. ความคิดริเริ่มสร้างสรรค์',
  '๖. ความเชื่อมั่นในตนเอง',
  '๗. การตัดสินใจและการแก้ปัญหา',
  '๘. การใช้เวลาว่างให้เป็นประโยชน์',
  '๙. สุขภาพและความสะอาดของร่างกาย',
  '๑๐. การเคารพ เชื่อฟังครูอาจารย์',
  '๑๑. การตรงต่อเวลา',
  '๑๒. ความเป็นผู้นำและผู้ตามที่ดี',
];

// คุณลักษณะของนักเรียนขณะอยู่บ้าน 9 ข้อ (หน้า 9)
export const PARENT_TRAITS_9 = [
  '๑. นักเรียนมีความสัมพันธ์ที่ดีกับคนในครอบครัว',
  '๒. นักเรียนใช้เวลาว่างให้เกิดประโยชน์',
  '๓. นักเรียนมีการช่วยเหลืองานบ้าน',
  '๔. นักเรียนอ่านหนังสือเรียนหรือทำการบ้าน',
  '๕. นักเรียนเชื่อฟังผู้ปกครอง',
  '๖. การดูแลสุขภาพและความสะอาดของร่างกาย',
  '๗. นักเรียนรู้จักประหยัดอดออม',
  '๘. ช่วยเหลือผู้ปกครองหารายได้',
  '๙. นักเรียนมีความตรงต่อเวลา',
];

export const PaporSixViewer: React.FC<Props> = ({
  selectedClass = 'ป.4',
  academicYear = '2568',
}) => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Print Mode & Page Selector Controls
  // ค่าเริ่มต้นเลือก 4 หน้าหลักตามความต้องการ: ปก (1), ผลการเรียน (6), หน้า 8 (8), หน้า 9 (9)
  const [selectedPagesToPrint, setSelectedPagesToPrint] = useState<number[]>([1, 6, 8, 9]);
  const [viewMode, setViewMode] = useState<'single' | 'selected'>('single');
  const [showPrintSettings, setShowPrintSettings] = useState(false);

  // Term 1 Mode Switch (เกรดเทอม 1 ไม่เป็น 0)
  const [isTerm1Only, setIsTerm1Only] = useState<boolean>(true);

  // Admin Manual Edit Mode (แอดมินกรอกเอง)
  const [isManualEditMode, setIsManualEditMode] = useState<boolean>(false);

  // Manual States: Default is completely empty / blank
  const [customTeacherComments, setCustomTeacherComments] = useState<{ term1: string; term2: string }>({
    term1: '',
    term2: '',
  });
  const [customTeacherTraits, setCustomTeacherTraits] = useState<Record<number, { term1?: string; term2?: string }>>({});
  const [customParentTraits, setCustomParentTraits] = useState<Record<number, { term1?: string; term2?: string }>>({});
  const [customParentComments, setCustomParentComments] = useState<string>('');
  const [customRemarks, setCustomRemarks] = useState<{ rank?: string; totalScore?: string; gpa?: string }>({
    rank: '',
    totalScore: '',
    gpa: '',
  });
  const [customSubjectScores, setCustomSubjectScores] = useState<Record<string, { obtained?: string; grade?: string; note?: string }>>({});

  // 1. Query Homeroom Teacher for the selected class
  const { data: homeroomTeacher } = useQuery({
    queryKey: ['class-homeroom-teacher', selectedClass, academicYear],
    queryFn: () => teacherClassAssignmentService.getClassHomeroomTeacher(selectedClass, academicYear),
    staleTime: 60_000,
  });

  // 2. Query Subjects in this class
  const { data: classSubjects = [] } = useQuery({
    queryKey: ['curriculum-subjects', selectedClass, academicYear],
    queryFn: () => curriculumSubjectsService.listSubjects(selectedClass, academicYear),
    staleTime: 60_000,
  });

  // 3. Load students in class
  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadStudents = async () => {
    try {
      const data = await paporGradebookService.getStudentsInClass(selectedClass);
      if (data && data.length > 0) {
        setStudents(data);
        setSelectedStudentId(data[0].id);
      } else {
        setStudents([]);
        setSelectedStudentId('');
      }
    } catch {
      setStudents([]);
      setSelectedStudentId('');
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // 4. Query student score records from system
  const { data: studentYearData } = useQuery({
    queryKey: ['student-papor-year-data', selectedStudentId, academicYear],
    enabled: !!selectedStudentId,
    queryFn: async () => {
      return await paporService.forStudentYear(selectedStudentId, academicYear);
    },
    staleTime: 30_000,
  });

  // Calculate scores list
  const displayScores = useMemo(() => {
    if (!classSubjects || classSubjects.length === 0) return [];
    const term1Scores = studentYearData?.term1?.scores || [];

    return classSubjects.map((sub: ObecGradeSubjectRow) => {
      const found = term1Scores.find((s: any) => s.subject === sub.subject_name || s.subject === sub.subject_code);
      const custom = customSubjectScores[sub.id] || {};

      const fullMarks = 100;
      const obtained = custom.obtained !== undefined ? custom.obtained : (found ? String(found.score) : '0');
      // Term 1 rule: no grade 0! Blank or custom or '-'
      let grade = '';
      if (!isTerm1Only) {
        grade = custom.grade !== undefined ? custom.grade : (found ? String(found.grade) : '0');
      } else if (custom.grade) {
        grade = custom.grade;
      }

      return {
        id: sub.id,
        subjectName: sub.subject_name,
        subjectCode: sub.subject_code,
        weight: sub.credit_units || 1,
        fullMarks,
        obtained,
        grade,
        note: custom.note || '',
      };
    });
  }, [classSubjects, studentYearData, customSubjectScores, isTerm1Only]);

  // Total scores and weights
  const totalWeight = useMemo(() => {
    return displayScores.reduce((sum, s) => sum + Number(s.weight || 0), 0);
  }, [displayScores]);

  const totalFullMarks = useMemo(() => {
    return displayScores.length * 100;
  }, [displayScores]);

  const totalObtainedScore = useMemo(() => {
    return displayScores.reduce((sum, s) => sum + (parseFloat(s.obtained) || 0), 0);
  }, [displayScores]);

  // Page selection helpers
  const togglePageSelect = (pageId: number) => {
    setSelectedPagesToPrint((prev) => {
      if (prev.includes(pageId)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((id) => id !== pageId);
      } else {
        return [...prev, pageId].sort((a, b) => a - b);
      }
    });
  };

  const applyPagePreset = (preset: 'main4' | 'all' | 'gradesOnly') => {
    if (preset === 'main4') {
      setSelectedPagesToPrint([1, 6, 8, 9]); // 4 หน้าหลักตามภาพตัวอย่าง
      toast.success('เลือก ๔ หน้าหลัก (ปก, ผลการเรียน, หน้า 8, หน้า 9)');
    } else if (preset === 'all') {
      setSelectedPagesToPrint([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      toast.success('เลือกพิมพ์ครบ ๑๐ หน้า (ทั้งเล่ม)');
    } else if (preset === 'gradesOnly') {
      setSelectedPagesToPrint([6]);
      toast.success('เลือกพิมพ์เฉพาะหน้าผลการเรียน (ปพ.6)');
    }
  };

  // Trait check toggle for manual edit
  const toggleTeacherTrait = (itemIdx: number, term: 'term1' | 'term2', rating: string) => {
    if (!isManualEditMode) return;
    setCustomTeacherTraits((prev) => {
      const current = prev[itemIdx] || {};
      const newRating = current[term] === rating ? undefined : rating;
      return {
        ...prev,
        [itemIdx]: {
          ...current,
          [term]: newRating,
        },
      };
    });
  };

  const toggleParentTrait = (itemIdx: number, term: 'term1' | 'term2', rating: string) => {
    if (!isManualEditMode) return;
    setCustomParentTraits((prev) => {
      const current = prev[itemIdx] || {};
      const newRating = current[term] === rating ? undefined : rating;
      return {
        ...prev,
        [itemIdx]: {
          ...current,
          [term]: newRating,
        },
      };
    });
  };

  // Clear all mock / sample data to blank
  const handleClearAllToBlank = () => {
    setCustomTeacherComments({ term1: '', term2: '' });
    setCustomTeacherTraits({});
    setCustomParentTraits({});
    setCustomParentComments('');
    setCustomRemarks({ rank: '', totalScore: '', gpa: '' });
    setCustomSubjectScores({});
    toast.success('ล้างข้อมูลตัวอย่างทั้งหมดเป็นค่าว่างเรียบร้อยแล้ว');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ─── Control Bar (Hidden during print) ─────────────────────────── */}
      <Card className="bg-card print:hidden border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <School className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  สมุดรายงานประจำตัวนักเรียน (ปพ.6) ฉบับทางการ
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  โรงเรียนบ้านคำไผ่ · ป.{selectedClass.replace('ป.', '')}
                </Badge>
                {isTerm1Only && (
                  <Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200 text-xs">
                    ภาคเรียนที่ 1 (ซ่อนเกรด 0)
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                แบบ ปพ.6 สพฐ. จัดเรียงขนาด A4 พอดีช่อง ไม่ล้นขอบ พร้อมระบบเลือกพิมพ์เฉพาะหน้าและโหมดกรอกเอง
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={isManualEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsManualEditMode(!isManualEditMode)}
                className="gap-1.5 text-xs h-8"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isManualEditMode ? 'เสร็จสิ้นการแก้ไข' : 'กรอก/แก้ไขข้อมูลเอง'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrintSettings(!showPrintSettings)}
                className="gap-1.5 text-xs h-8"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                ตั้งค่าพิมพ์ & เลือกหน้า ({selectedPagesToPrint.length} หน้า)
              </Button>

              <Button onClick={handlePrint} size="sm" className="gap-2 font-semibold h-8 shadow-sm">
                <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF (A4)
              </Button>
            </div>
          </div>

          {/* Quick Page Selection Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" /> เลือกพิมพ์หน้า:
              </span>
              <Button
                type="button"
                variant={selectedPagesToPrint.length === 4 && selectedPagesToPrint.includes(1) && selectedPagesToPrint.includes(6) ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => applyPagePreset('main4')}
                className="h-7 text-xs px-2.5 font-medium border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100"
              >
                ⭐ ๔ หน้าหลัก (ปก + ผลการเรียน + หน้า 8 + หน้า 9)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPagePreset('gradesOnly')}
                className="h-7 text-xs px-2.5"
              >
                ผลการเรียน ปพ.6 อย่างเดียว
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPagePreset('all')}
                className="h-7 text-xs px-2.5"
              >
                ครบ ๑๐ หน้าทั้งเล่ม
              </Button>
            </div>

            {/* Term 1 Grade 0 Switch */}
            <div className="flex items-center space-x-2 bg-muted/40 px-3 py-1 rounded-md border border-border">
              <Switch
                id="term1-switch"
                checked={isTerm1Only}
                onCheckedChange={setIsTerm1Only}
              />
              <Label htmlFor="term1-switch" className="cursor-pointer text-xs font-medium">
                ภาคเรียนที่ 1 (ซ่อนเกรด 0)
              </Label>
            </div>
          </div>

          {/* Detailed Print Settings Bar (Collapsible) */}
          {showPrintSettings && (
            <div className="mt-3 p-3.5 bg-muted/30 rounded-lg border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  เลือกติ๊กหน้าที่จะพิมพ์ (เฉพาะหน้าที่เลือกจะถูกส่งออกเครื่องพิมพ์):
                </span>
                <span className="text-muted-foreground">
                  เลือกแล้ว {selectedPagesToPrint.length} จาก 10 หน้า
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {BOOKLET_PAGES.map((p) => {
                  const isChecked = selectedPagesToPrint.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePageSelect(p.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md border text-left transition-all text-[11px]',
                        isChecked
                          ? 'border-primary bg-primary/10 font-semibold text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          isChecked ? 'border-primary bg-primary text-white' : 'border-border'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{p.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Edit Mode Helpers */}
              {isManualEditMode && (
                <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-2">
                  <div className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    โหมดแก้ไข: คุณสามารถคลิกติ๊กเครื่องหมาย ✓ ในตารางหน้า 8/9 หรือพิมพ์แก้ไขข้อความได้โดยตรง
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllToBlank}
                    className="h-7 text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3 h-3" /> ล้างค่าตัวอย่างเป็นค่าว่างทั้งหมด
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        {/* Student Selector & Navigation Toolbar */}
        <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Student Picker */}
            <div className="w-72">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="เลือกนักเรียน" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.class_number ? `เลขที่ ${s.class_number} · ` : ''}{s.name} ({s.student_code || '-'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle: Single Page vs All Selected Pages */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
              <Button
                variant={viewMode === 'single' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setViewMode('single')}
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> ดูทีละหน้า
              </Button>
              <Button
                variant={viewMode === 'selected' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setViewMode('selected')}
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> ดูเฉพาะหน้าที่เลือกพิมพ์ ({selectedPagesToPrint.length})
              </Button>
            </div>

            {/* Single Page Navigator (Only visible in single page view) */}
            {viewMode === 'single' && (
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-semibold px-2">
                  หน้า {currentPage} / 10
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(10, p + 1))}
                  disabled={currentPage >= 10}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            ครูประจำชั้น: <strong className="text-foreground">{homeroomTeacher?.name || 'ครูประจำชั้น'}</strong>
          </div>
        </CardContent>
      </Card>

      {/* ─── Printable Document Sheet Container ─────────────────────────── */}
      <div className="papor-print-container flex flex-col items-center gap-8 print:block print:gap-0">
        {!currentStudent ? (
          <div className="p-16 text-center text-muted-foreground bg-card border border-border rounded-xl w-full max-w-[210mm]">
            กรุณาเลือกนักเรียนเพื่อแสดงสมุดพก
          </div>
        ) : viewMode === 'single' ? (
          /* Single Page Display on screen */
          <div className="papor-page-sheet bg-white text-black p-[12mm_15mm] w-[210mm] min-h-[297mm] shadow-md border border-neutral-300 font-sans text-[13px] leading-normal relative box-border print:shadow-none print:border-none print:m-0 print:p-0">
            {renderPageContent(currentPage)}
          </div>
        ) : (
          /* All Selected Pages Print Preview on screen & in window.print() */
          selectedPagesToPrint.map((pageId) => (
            <div
              key={pageId}
              className="papor-page-sheet bg-white text-black p-[12mm_15mm] w-[210mm] min-h-[297mm] shadow-md border border-neutral-300 font-sans text-[13px] leading-normal relative box-border print:shadow-none print:border-none print:m-0 print:p-0 print:break-after-page mb-6 print:mb-0"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {renderPageContent(pageId)}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ─── PAGE RENDER ROUTER ──────────────────────────────────────────────
  function renderPageContent(pageId: number) {
    if (!currentStudent) return null;

    switch (pageId) {
      case 1:
        return renderCoverPage();
      case 2:
        return renderInstructionsPage();
      case 3:
        return renderStudentProfilePage();
      case 4:
        return renderGrowthHealthPage();
      case 5:
        return renderGuidancePage();
      case 6:
        return renderGradeReportPage(); // Sheet 'รายบุคคล' (Image 2)
      case 7:
        return renderActivitiesPage();
      case 8:
        return renderTeacherCommentsPage(); // Sheet 'หน้า 8' (Image 3)
      case 9:
        return renderParentCommentsPage(); // Sheet 'หน้า 9' (Image 4)
      case 10:
        return renderPromotionSummaryPage();
      default:
        return renderCoverPage();
    }
  }

  // ─── 1. COVER PAGE (หน้าปก - Image 1) ────────────────────────────────
  function renderCoverPage() {
    if (!currentStudent) return null;

    return (
      <div className="h-full flex flex-col justify-between py-2 text-center text-black">
        {/* Top Emblem & School Headers */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 mx-auto">
            <img
              src="/logos/school-logo.webp"
              alt="ตราประจำโรงเรียนบ้านคำไผ่"
              className="w-24 h-24 object-contain"
            />
            <img
              src="/logos/obec.png"
              alt="ตราสัญลักษณ์ สพฐ."
              className="w-24 h-24 object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">แบบรายงานประจำตัวนักเรียน</h1>
            <h2 className="text-lg font-semibold">โรงเรียนบ้านคำไผ่</h2>
            <p className="text-xs text-neutral-800">
              สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
            </p>
          </div>
        </div>

        {/* Student Photo (3x4 cm ratio) */}
        <div className="my-4">
          <div className="w-28 h-36 mx-auto border-2 border-neutral-400 p-0.5 bg-neutral-50 shadow-sm flex items-center justify-center overflow-hidden">
            {currentStudent.photo_url ? (
              <img
                src={currentStudent.photo_url}
                alt={currentStudent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <PersonAvatar
                name={currentStudent.name}
                photoUrl={null}
                className="w-20 h-20 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Dotted Form Information Block - Perfectly balanced, no clipping */}
        <div className="max-w-md mx-auto w-full space-y-3 text-sm text-left px-4">
          {/* ชื่อ */}
          <div className="flex items-end">
            <span className="font-semibold whitespace-nowrap min-w-[70px]">ชื่อ</span>
            <span className="font-bold text-base px-2 flex-1 border-b border-dotted border-black text-center truncate">
              {currentStudent.name}
            </span>
          </div>

          {/* เลขประจำตัว & เลขที่ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[75px]">เลขประจำตัว</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium truncate">
                {currentStudent.student_code || '-'}
              </span>
            </div>
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[45px]">เลขที่</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                {currentStudent.class_number || '-'}
              </span>
            </div>
          </div>

          {/* ปีการศึกษา & ชั้น */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[75px]">ปีการศึกษา</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                {academicYear}
              </span>
            </div>
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[95px]">ชั้นประถมศึกษาปีที่</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                {selectedClass.replace('ป.', '')}
              </span>
            </div>
          </div>

          {/* ครูประจำชั้น */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[95px]">ครูที่ประจำชั้น ๑</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium truncate">
                {homeroomTeacher?.name || 'นายเอกวิทย์ พละลี'}
              </span>
            </div>
            <div className="flex items-end">
              <span className="whitespace-nowrap min-w-[95px] pl-8">๒</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center text-neutral-400">
                .......................................................
              </span>
            </div>
          </div>
        </div>

        {/* Director Signature Block */}
        <div className="pt-6 pb-2 text-center space-y-1">
          <div className="text-xs">ลงชื่อ ................................................................</div>
          <div className="text-sm font-semibold">( นายสมพิศ แรงน้อย )</div>
          <div className="text-xs text-neutral-700">ผู้อำนวยการโรงเรียนบ้านคำไผ่</div>
        </div>
      </div>
    );
  }

  // ─── 2. INSTRUCTIONS PAGE (หน้า 1) ──────────────────────────────────
  function renderInstructionsPage() {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          คำชี้แจงในการใช้สมุดรายงานประจำตัวนักเรียน (ปพ.6)
        </h2>
        <div className="space-y-3 text-xs leading-relaxed text-neutral-800">
          <p>๑. สมุดรายงานประจำตัวนักเรียนนี้ เป็นเอกสารสำหรับบันทึกข้อมูลการประเมินผลการเรียนรู้และพัฒนาการด้านต่างๆ ของนักเรียน เพื่อรายงานให้ผู้ปกครองทราบภาคเรียนละ ๑ ครั้ง</p>
          <p>๒. ครูประจำชั้นจะบันทึกผลการประเมินตามเกณฑ์มาตรฐานการเรียนรู้และตัวชี้วัด ๘ กลุ่มสาระการเรียนรู้ และกิจกรรมพัฒนาผู้เรียนตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน</p>
          <p>๓. การตัดสินผลการเรียนจะพิจารณาจากเกณฑ์ สพฐ. ได้แก่ เวลาเรียนไม่น้อยกว่าร้อยละ ๘๐, ผ่านเกณฑ์การประเมินตัวชี้วัด, ผ่านคุณลักษณะอันพึงประสงค์, ผ่านการอ่านคิดวิเคราะห์เขียน และผ่านกิจกรรมพัฒนาผู้เรียน</p>
          <p>๔. ขอให้ผู้ปกครองตรวจสอบผลการเรียน ลงลายมือชื่อรับทราบ และบันทึกข้อเสนอแนะเพื่อร่วมมือกับโรงเรียนในการส่งเสริมพัฒนาการของนักเรียน</p>
        </div>
      </div>
    );
  }

  // ─── 3. STUDENT PROFILE (หน้า 2) ────────────────────────────────────
  function renderStudentProfilePage() {
    if (!currentStudent) return null;
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          ข้อมูลประวัติผู้เรียนและครอบครัว (หน้า ๒)
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><span className="text-neutral-600">ชื่อ-สกุล:</span> <span className="font-semibold">{currentStudent.name}</span></div>
          <div><span className="text-neutral-600">เลขประจำตัว:</span> <span>{currentStudent.student_code || '-'}</span></div>
          <div><span className="text-neutral-600">สัญชาติ / เชื้อชาติ:</span> <span>ไทย / ไทย</span></div>
          <div><span className="text-neutral-600">ศาสนา:</span> <span>พุทธ</span></div>
          <div><span className="text-neutral-600">โรงเรียน:</span> <span>บ้านคำไผ่</span></div>
          <div><span className="text-neutral-600">สังกัด:</span> <span>สพป.อุดรธานี เขต ๒</span></div>
        </div>
      </div>
    );
  }

  // ─── 4. GROWTH & HEALTH (หน้า 3) ────────────────────────────────────
  function renderGrowthHealthPage() {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          ความเจริญเติบโตทางร่างกายและสุขภาพ (หน้า ๓)
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs text-center">
          <div className="p-3 border border-black rounded">
            <div className="font-bold">ภาคเรียนที่ ๑</div>
            <div className="mt-1">น้ำหนัก / ส่วนสูง ตามเกณฑ์</div>
            <div className="text-neutral-600">สุขภาพร่างกายแข็งแรงสมบูรณ์</div>
          </div>
          <div className="p-3 border border-black rounded">
            <div className="font-bold">ภาคเรียนที่ ๒</div>
            <div className="mt-1">น้ำหนัก / ส่วนสูง ตามเกณฑ์</div>
            <div className="text-neutral-600">พัฒนาการเจริญเติบโตสมวัย</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 5. GUIDANCE (หน้า 4) ───────────────────────────────────────────
  function renderGuidancePage() {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          เกณฑ์การให้ระดับผลการเรียน (หน้า ๔)
        </h2>
        <table className="w-full border-collapse border border-black text-xs text-center">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border border-black p-1">คะแนนร้อยละ</th>
              <th className="border border-black p-1">ระดับผลการเรียน</th>
              <th className="border border-black p-1">ความหมาย</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-black p-1">๘๐ - ๑๐๐</td><td className="border border-black p-1 font-bold">๔</td><td className="border border-black p-1">ดีเยี่ยม</td></tr>
            <tr><td className="border border-black p-1">๗๕ - ๗๙</td><td className="border border-black p-1 font-bold">๓.๕</td><td className="border border-black p-1">ดีมาก</td></tr>
            <tr><td className="border border-black p-1">๗๐ - ๗๔</td><td className="border border-black p-1 font-bold">๓</td><td className="border border-black p-1">ดี</td></tr>
            <tr><td className="border border-black p-1">๖๕ - ๖๙</td><td className="border border-black p-1 font-bold">๒.๕</td><td className="border border-black p-1">ค่อนข้างดี</td></tr>
            <tr><td className="border border-black p-1">๖๐ - ๖๔</td><td className="border border-black p-1 font-bold">๒</td><td className="border border-black p-1">ปานกลาง</td></tr>
            <tr><td className="border border-black p-1">๕๕ - ๕๙</td><td className="border border-black p-1 font-bold">๑.๕</td><td className="border border-black p-1">พอใช้</td></tr>
            <tr><td className="border border-black p-1">๕๐ - ๕๔</td><td className="border border-black p-1 font-bold">๑</td><td className="border border-black p-1">ผ่านเกณฑ์ขั้นต่ำ</td></tr>
            <tr><td className="border border-black p-1">๐ - ๔๙</td><td className="border border-black p-1 font-bold">๐</td><td className="border border-black p-1">ต่ำกว่าเกณฑ์ขั้นต่ำ</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  // ─── 6. GRADE REPORT (ผลการเรียนรายบุคคล ปพ.6 - Image 2) ────────────
  function renderGradeReportPage() {
    if (!currentStudent) return null;

    return (
      <div className="space-y-3 text-black text-xs">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="w-12"></div>
          <div className="text-center space-y-0.5 flex-1">
            <div className="font-bold text-sm">ปพ. ๖</div>
            <div className="font-medium text-[11px]">
              ผลการเรียนปีการศึกษา {academicYear} โรงเรียนบ้านคำไผ่ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
            </div>
            <div className="font-bold text-xs pt-0.5">
              {currentStudent.name} ชั้นประถมศึกษาปีที่ {selectedClass.replace('ป.', '')} เลขที่ {currentStudent.class_number || '-'}
            </div>
          </div>
          <div className="w-12 text-right font-mono text-[10px] text-neutral-400">ปพ.6</div>
        </div>

        {/* Academic Subjects Table */}
        <table className="w-full border-collapse border border-black text-center text-[11px] leading-tight">
          <thead>
            <tr className="bg-neutral-100/60 font-semibold">
              <th className="border border-black p-1 text-left w-[34%]">สาระการเรียนรู้</th>
              <th className="border border-black p-1 w-[8%]">น้ำหนัก</th>
              <th className="border border-black p-1 w-[10%]">คะแนนเต็ม</th>
              <th className="border border-black p-1 w-[10%]">คะแนนที่ได้</th>
              <th className="border border-black p-1 w-[16%]">ระดับผลการเรียน</th>
              <th className="border border-black p-1 w-[22%]">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {displayScores.map((score, idx) => (
              <tr key={score.id} className="h-6">
                <td className="border border-black px-1.5 py-0.5 text-left font-medium truncate">
                  {score.subjectName}
                </td>
                <td className="border border-black p-0.5">{score.weight}</td>
                <td className="border border-black p-0.5">{score.fullMarks}</td>
                <td className="border border-black p-0.5">
                  {isManualEditMode ? (
                    <input
                      type="text"
                      value={score.obtained}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSubjectScores((prev) => ({
                          ...prev,
                          [score.id]: { ...prev[score.id], obtained: val },
                        }));
                      }}
                      className="w-full text-center border-b border-neutral-400 bg-transparent text-[11px]"
                    />
                  ) : (
                    score.obtained
                  )}
                </td>
                {/* Term 1 Rule: Never show 0! Blank or '-' */}
                <td className="border border-black p-0.5 font-semibold">
                  {isManualEditMode ? (
                    <input
                      type="text"
                      placeholder={isTerm1Only ? '-' : '0'}
                      value={score.grade}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSubjectScores((prev) => ({
                          ...prev,
                          [score.id]: { ...prev[score.id], grade: val },
                        }));
                      }}
                      className="w-full text-center border-b border-neutral-400 bg-transparent text-[11px]"
                    />
                  ) : (
                    score.grade || (isTerm1Only ? '' : '-')
                  )}
                </td>
                {/* Right Remarks column - clean, matches photo layout */}
                <td className="border border-black p-0.5 text-center text-[10px]">
                  {isManualEditMode ? (
                    <input
                      type="text"
                      value={score.note}
                      placeholder={idx === 3 ? 'คะแนนที่ได้' : idx === 4 ? `${totalObtainedScore}` : idx === 6 ? 'เกรดเฉลี่ย' : idx === 7 ? (isTerm1Only ? '-' : '0.00') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSubjectScores((prev) => ({
                          ...prev,
                          [score.id]: { ...prev[score.id], note: val },
                        }));
                      }}
                      className="w-full text-center border-b border-neutral-400 bg-transparent text-[10px]"
                    />
                  ) : (
                    score.note || (
                      idx === 3 ? <span className="font-medium">คะแนนที่ได้</span> :
                      idx === 4 ? <span className="font-bold font-mono">{totalObtainedScore}</span> :
                      idx === 6 ? <span className="font-medium">เกรดเฉลี่ย</span> :
                      idx === 7 ? <span className="font-bold font-mono">{isTerm1Only ? '-' : (customRemarks.gpa || (totalWeight > 0 ? (totalObtainedScore / totalWeight).toFixed(2) : '0.00'))}</span> :
                      null
                    )
                  )}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="font-bold bg-neutral-100/40 h-6">
              <td className="border border-black px-1.5 py-0.5 text-center">รวม</td>
              <td className="border border-black p-0.5">{totalWeight}</td>
              <td className="border border-black p-0.5">{totalFullMarks}</td>
              <td className="border border-black p-0.5">{totalObtainedScore}</td>
              {/* Term 1 Rule: GPA is empty / dash, no 0.00 */}
              <td className="border border-black p-0.5">
                {isTerm1Only ? (customRemarks.gpa || '') : (customRemarks.gpa || (totalWeight > 0 ? (totalObtainedScore / totalWeight).toFixed(2) : '-'))}
              </td>
              <td className="border border-black p-0.5 text-[10px]">
                {customRemarks.rank ? `**สอบได้ลำดับที่ ${customRemarks.rank}` : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Development Activities Table */}
        <table className="w-full border-collapse border border-black text-center text-[10px] leading-tight">
          <thead>
            <tr className="bg-neutral-100/60 font-semibold h-6">
              <th className="border border-black p-1 text-center w-[67%]">กิจกรรมพัฒนาผู้เรียน</th>
              <th colSpan={2} className="border border-black p-0.5 w-[33%]">
                <div>ผลการประเมิน</div>
                <div className="grid grid-cols-2 border-t border-black font-medium text-[9px] mt-0.5 pt-0.5">
                  <div>ผ่าน</div>
                  <div>ไม่ผ่าน</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {['ลูกเสือ', 'แนะแนว', 'ชุมนุม', 'เพื่อสังคมและสาธารณประโยชน์'].map((act) => (
              <tr key={act} className="h-5">
                <td className="border border-black px-1.5 py-0.5 text-left font-medium">{act}</td>
                <td className="border border-black p-0.5 w-[16.5%] font-bold"></td>
                <td className="border border-black p-0.5 w-[16.5%] font-bold"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3 Evaluation Summaries Table */}
        <table className="w-full border-collapse border border-black text-center text-[10px] leading-tight">
          <thead>
            <tr className="bg-neutral-100/60 font-semibold h-6">
              <th className="border border-black p-1 w-[55%]"></th>
              <th colSpan={3} className="border border-black p-0.5 w-[45%]">
                <div>ผลการประเมิน</div>
                <div className="grid grid-cols-3 border-t border-black font-medium text-[9px] mt-0.5 pt-0.5">
                  <div>ดีเยี่ยม</div>
                  <div>ดี</div>
                  <div>ผ่าน</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              'สรุปการประเมินผลการอ่าน คิดวิเคราะห์ และเขียน',
              'สรุปการประเมินผล คุณลักษณะอันพึงประสงค์',
              'สรุปการประเมินผล สมรรถนะ',
            ].map((evalName) => (
              <tr key={evalName} className="h-5">
                <td className="border border-black px-1.5 py-0.5 text-left font-medium">{evalName}</td>
                <td className="border border-black p-0.5 w-[15%] font-bold"></td>
                <td className="border border-black p-0.5 w-[15%] font-bold"></td>
                <td className="border border-black p-0.5 w-[15%] font-bold"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3 Signatures Row (ครูประจำชั้น, หัวหน้าวิชาการ, ผู้อำนวยการ) */}
        <div className="pt-2 text-xs leading-normal">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div>ลงชื่อ .................................................... ครูประจำชั้น</div>
              <div className="font-medium text-[11px]">({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
            </div>
            <div className="space-y-1">
              <div>ลงชื่อ .................................................... หัวหน้าวิชาการ</div>
              <div className="font-medium text-[11px]">(นางสาวมะลิวัลย์ จรุงพันธ์)</div>
            </div>
          </div>
          <div className="text-center pt-3 space-y-1">
            <div>ลงชื่อ ............................................................................ ผู้อำนวยการโรงเรียน</div>
            <div className="font-medium text-[11px]">(นายสมพิศ แรงน้อย)</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 7. ACTIVITIES & 4 DIMENSIONS (หน้า 6-7) ────────────────────────
  function renderActivitiesPage() {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          กิจกรรมพัฒนาผู้เรียน & สมรรถนะสำคัญ & คุณลักษณะฯ (หน้า ๖-๗)
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 border border-black rounded space-y-1.5">
            <div className="font-bold border-b pb-1">กิจกรรมพัฒนาผู้เรียน</div>
            <div className="flex justify-between"><span>ลูกเสือ / เนตรนารี:</span> <span className="font-medium">ผ่าน (ผ)</span></div>
            <div className="flex justify-between"><span>แนะแนว:</span> <span className="font-medium">ผ่าน (ผ)</span></div>
            <div className="flex justify-between"><span>ชุมนุม:</span> <span className="font-medium">ผ่าน (ผ)</span></div>
            <div className="flex justify-between"><span>เพื่อสังคมและสาธารณประโยชน์:</span> <span className="font-medium">ผ่าน (ผ)</span></div>
          </div>
          <div className="p-3 border border-black rounded space-y-1.5">
            <div className="font-bold border-b pb-1">การประเมินคุณลักษณะ & สมรรถนะ</div>
            <div className="flex justify-between"><span>สมรรถนะสำคัญ ๕ ด้าน:</span> <span className="font-medium">ดีเยี่ยม (ดย)</span></div>
            <div className="flex justify-between"><span>คุณลักษณะอันพึงประสงค์ ๘ ข้อ:</span> <span className="font-medium">ดีเยี่ยม (ดย)</span></div>
            <div className="flex justify-between"><span>การอ่าน คิดวิเคราะห์ เขียน:</span> <span className="font-medium">ดีเยี่ยม (ดย)</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 8. TEACHER COMMENTS (ความเห็นของครูประจำชั้น - Image 3) ────────
  function renderTeacherCommentsPage() {
    if (!currentStudent) return null;

    return (
      <div className="space-y-3 text-black text-xs">
        {/* Header with Student Name on Top Right */}
        <div className="flex justify-between items-start">
          <div className="w-8 font-bold">๘</div>
          <div className="text-center flex-1">
            <div className="font-bold text-sm">ความเห็นของครูประจำชั้น</div>
            <div className="text-[11px] text-neutral-700">ให้ใส่เครื่องหมาย ✓ ลงในช่องว่าง</div>
          </div>
          <div className="w-36 text-right font-semibold text-xs truncate">
            {currentStudent.name}
          </div>
        </div>

        {/* 12 Teacher Traits Table - Wide left column to prevent text overflow */}
        <table className="w-full border-collapse border border-black text-center text-[10px] leading-tight">
          <thead>
            <tr className="bg-neutral-100/60 font-semibold">
              <th rowSpan={2} className="border border-black p-1 text-left w-[48%]">
                คุณลักษณะของนักเรียนขณะอยู่ในโรงเรียน
              </th>
              <th colSpan={4} className="border border-black p-1 w-[26%]">ภาคเรียนที่ ๑</th>
              <th colSpan={4} className="border border-black p-1 w-[26%]">ภาคเรียนที่ ๒</th>
            </tr>
            <tr className="bg-neutral-100/40 font-medium text-[9px]">
              <th className="border border-black p-0.5 w-[6.5%]">ดีเยี่ยม</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดี</th>
              <th className="border border-black p-0.5 w-[6.5%]">พอใช้</th>
              <th className="border border-black p-0.5 w-[6.5%]">ปรับปรุง</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดีเยี่ยม</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดี</th>
              <th className="border border-black p-0.5 w-[6.5%]">พอใช้</th>
              <th className="border border-black p-0.5 w-[6.5%]">ปรับปรุง</th>
            </tr>
          </thead>
          <tbody>
            {TEACHER_TRAITS_12.map((trait, idx) => {
              const currentT = customTeacherTraits[idx] || {};
              return (
                <tr key={trait} className="h-5">
                  {/* Left topic column - full words, no cutoffs */}
                  <td className="border border-black px-1.5 py-0.5 text-left font-medium whitespace-normal">
                    {trait}
                  </td>

                  {/* Term 1 Ratings (ดีเยี่ยม, ดี, พอใช้, ปรับปรุง) - Default Blank */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`t1-${r}`}
                      onClick={() => toggleTeacherTrait(idx, 'term1', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold cursor-pointer select-none',
                        isManualEditMode && 'hover:bg-amber-100'
                      )}
                    >
                      {currentT.term1 === r ? '✓' : ''}
                    </td>
                  ))}

                  {/* Term 2 Ratings (ดีเยี่ยม, ดี, พอใช้, ปรับปรุง) - Default Blank */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`t2-${r}`}
                      onClick={() => toggleTeacherTrait(idx, 'term2', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold cursor-pointer select-none',
                        isManualEditMode && 'hover:bg-amber-100'
                      )}
                    >
                      {currentT.term2 === r ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Signature inside table bottom row */}
            <tr className="h-6 font-semibold">
              <td className="border border-black px-1.5 py-0.5 text-center">ลงชื่อครูประจำชั้น</td>
              <td colSpan={4} className="border border-black p-0.5 text-[10px]">
                {homeroomTeacher?.name ? `(${homeroomTeacher.name})` : ''}
              </td>
              <td colSpan={4} className="border border-black p-0.5 text-[10px]"></td>
            </tr>
          </tbody>
        </table>

        {/* Additional Comments Block - Blank by default, no mock text */}
        <div className="space-y-1 pt-2">
          <div className="font-bold text-center text-xs">ความคิดเห็นเพิ่มเติมของครูประจำชั้น</div>
          <div className="grid grid-cols-2 border border-black min-h-[110px]">
            {/* Term 1 Box */}
            <div className="border-r border-black p-2 flex flex-col justify-between">
              <div className="font-bold text-center border-b border-black pb-1 mb-2 text-[11px]">
                ภาคเรียนที่ ๑
              </div>
              {isManualEditMode ? (
                <textarea
                  value={customTeacherComments.term1}
                  onChange={(e) =>
                    setCustomTeacherComments((prev) => ({ ...prev, term1: e.target.value }))
                  }
                  placeholder="พิมพ์ความคิดเห็นของครูประจำชั้น..."
                  className="w-full flex-1 p-1 text-xs border border-neutral-300 rounded resize-none bg-neutral-50/50"
                  rows={3}
                />
              ) : (
                <div className="text-xs leading-relaxed italic text-neutral-800 flex-1">
                  {customTeacherComments.term1}
                </div>
              )}
            </div>

            {/* Term 2 Box */}
            <div className="p-2 flex flex-col justify-between">
              <div className="font-bold text-center border-b border-black pb-1 mb-2 text-[11px]">
                ภาคเรียนที่ ๒
              </div>
              {isManualEditMode ? (
                <textarea
                  value={customTeacherComments.term2}
                  onChange={(e) =>
                    setCustomTeacherComments((prev) => ({ ...prev, term2: e.target.value }))
                  }
                  placeholder="พิมพ์ความคิดเห็นของครูประจำชั้น..."
                  className="w-full flex-1 p-1 text-xs border border-neutral-300 rounded resize-none bg-neutral-50/50"
                  rows={3}
                />
              ) : (
                <div className="text-xs leading-relaxed italic text-neutral-800 flex-1">
                  {customTeacherComments.term2}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Signature Line */}
        <div className="pt-4 text-center text-xs">
          ลงชื่อ ............................................................................ ครูประจำชั้น
        </div>
      </div>
    );
  }

  // ─── 9. PARENT COMMENTS (ความเห็นของผู้ปกครอง - Image 4) ─────────────
  function renderParentCommentsPage() {
    if (!currentStudent) return null;

    return (
      <div className="space-y-3 text-black text-xs">
        {/* Header with Student Name on Top Right */}
        <div className="flex justify-between items-start">
          <div className="w-8 font-bold">๙</div>
          <div className="text-center flex-1">
            <div className="font-bold text-sm">ความเห็นของผู้ปกครอง</div>
            <div className="text-[11px] text-neutral-700">ให้ใส่เครื่องหมาย ✓ ลงในช่องว่าง</div>
          </div>
          <div className="w-36 text-right font-semibold text-xs truncate">
            {currentStudent.name}
          </div>
        </div>

        {/* 9 Parent Traits Table - Wide left column to prevent text overflow */}
        <table className="w-full border-collapse border border-black text-center text-[10px] leading-tight">
          <thead>
            <tr className="bg-neutral-100/60 font-semibold">
              <th rowSpan={2} className="border border-black p-1 text-left w-[48%]">
                คุณลักษณะของนักเรียนขณะอยู่บ้าน
              </th>
              <th colSpan={4} className="border border-black p-1 w-[26%]">ภาคเรียนที่ ๑</th>
              <th colSpan={4} className="border border-black p-1 w-[26%]">ภาคเรียนที่ ๒</th>
            </tr>
            <tr className="bg-neutral-100/40 font-medium text-[9px]">
              <th className="border border-black p-0.5 w-[6.5%]">ดีเยี่ยม</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดี</th>
              <th className="border border-black p-0.5 w-[6.5%]">พอใช้</th>
              <th className="border border-black p-0.5 w-[6.5%]">ปรับปรุง</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดีเยี่ยม</th>
              <th className="border border-black p-0.5 w-[6.5%]">ดี</th>
              <th className="border border-black p-0.5 w-[6.5%]">พอใช้</th>
              <th className="border border-black p-0.5 w-[6.5%]">ปรับปรุง</th>
            </tr>
          </thead>
          <tbody>
            {PARENT_TRAITS_9.map((trait, idx) => {
              const currentP = customParentTraits[idx] || {};
              return (
                <tr key={trait} className="h-5">
                  <td className="border border-black px-1.5 py-0.5 text-left font-medium whitespace-normal">
                    {trait}
                  </td>

                  {/* Term 1 Ratings - Default Blank */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`p1-${r}`}
                      onClick={() => toggleParentTrait(idx, 'term1', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold cursor-pointer select-none',
                        isManualEditMode && 'hover:bg-amber-100'
                      )}
                    >
                      {currentP.term1 === r ? '✓' : ''}
                    </td>
                  ))}

                  {/* Term 2 Ratings - Default Blank */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`p2-${r}`}
                      onClick={() => toggleParentTrait(idx, 'term2', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold cursor-pointer select-none',
                        isManualEditMode && 'hover:bg-amber-100'
                      )}
                    >
                      {currentP.term2 === r ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Signature inside table bottom row */}
            <tr className="h-6 font-semibold">
              <td className="border border-black px-1.5 py-0.5 text-center">ลงชื่อผู้ปกครอง</td>
              <td colSpan={4} className="border border-black p-0.5"></td>
              <td colSpan={4} className="border border-black p-0.5"></td>
            </tr>
          </tbody>
        </table>

        {/* Additional Parent Comments - Clean Dotted Lines */}
        <div className="space-y-2 pt-3">
          <div className="font-bold text-center text-xs">ความคิดเห็นเพิ่มเติมของผู้ปกครอง</div>
          {isManualEditMode ? (
            <textarea
              value={customParentComments}
              onChange={(e) => setCustomParentComments(e.target.value)}
              placeholder="พิมพ์ความคิดเห็นของผู้ปกครอง..."
              className="w-full p-2 text-xs border border-neutral-300 rounded resize-none bg-neutral-50/50"
              rows={5}
            />
          ) : (
            <div className="space-y-4 pt-1">
              {[1, 2, 3, 4, 5, 6].map((lineNum) => (
                <div key={lineNum} className="border-b border-dotted border-black h-4 w-full"></div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Signature Block - Safe margin, "ผู้ปกครอง" never cut off */}
        <div className="pt-6 flex justify-end">
          <div className="text-right text-xs max-w-sm pr-2">
            ลงชื่อ ............................................................................ ผู้ปกครอง
          </div>
        </div>
      </div>
    );
  }

  // ─── 10. PROMOTION SUMMARY (หน้า 10) ────────────────────────────────
  function renderPromotionSummaryPage() {
    if (!currentStudent) return null;

    return (
      <div className="space-y-4 text-black text-xs">
        <h2 className="text-base font-bold border-b border-black pb-2 text-center">
          สรุปผลการเรียนและการตัดสินการประเมิน (หน้า ๑๐)
        </h2>

        <div className="space-y-2">
          <div>๑. เวลาเรียนร้อยละ <strong>๙๕</strong> (ผ่านเกณฑ์)</div>
          <div>๒. ผลการประเมินตัวชี้วัด <strong>ผ่านเกณฑ์การประเมินทุกกลุ่มสาระการเรียนรู้</strong></div>
          <div>
            ๓. ผลการเรียนเฉลี่ยรวม (GPA):{' '}
            <strong>{isTerm1Only ? '-' : (customRemarks.gpa || '๓.๕๐')}</strong>
          </div>
          <div>๔. ผลการประเมินคุณลักษณะอันพึงประสงค์: <strong>ดีเยี่ยม (ดย)</strong></div>
          <div>๕. ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน: <strong>ดีเยี่ยม (ดย)</strong></div>
          <div>๖. ผลการประเมินกิจกรรมพัฒนาผู้เรียน: <strong>ผ่าน (ผ)</strong></div>
        </div>

        <div className="p-3 border border-black rounded text-center my-6">
          <div className="font-semibold text-[11px]">ผลการตัดสินประจำปีการศึกษา</div>
          <div className="text-base font-bold mt-1">
            {selectedClass === 'ป.6'
              ? 'จบหลักสูตรประถมศึกษา (ศึกษาต่อ ม.1)'
              : `เลื่อนชั้น (ขึ้นชั้นประถมศึกษาปีที่ ${Number(selectedClass.replace('ป.', '')) + 1})`}
          </div>
        </div>

        {/* 3 Signatures */}
        <div className="grid grid-cols-3 gap-2 pt-8 text-center text-[10px]">
          <div>
            <div className="border-b border-black w-28 mx-auto mb-1"></div>
            <div>({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
            <div className="text-neutral-600">ครูประจำชั้น</div>
          </div>
          <div>
            <div className="border-b border-black w-28 mx-auto mb-1"></div>
            <div>(นายทะเบียน)</div>
            <div className="text-neutral-600">นายทะเบียน</div>
          </div>
          <div>
            <div className="border-b border-black w-28 mx-auto mb-1"></div>
            <div>(นายสมพิศ แรงน้อย)</div>
            <div className="text-neutral-600">ผู้อำนวยการโรงเรียน</div>
          </div>
        </div>
      </div>
    );
  }
};

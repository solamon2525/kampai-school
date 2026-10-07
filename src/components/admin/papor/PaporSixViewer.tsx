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
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Save,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { paporService } from '@/services/papor.service';
import { paporGradebookService } from '@/services/papor-gradebook.service';
import { scoresService } from '@/services/scores.service';
import { curriculumSubjectsService, type ObecGradeSubjectRow } from '@/services/curriculum-subjects.service';
import { teacherClassAssignmentService } from '@/services/teacher-class-assignment.service';
import { healthService } from '@/services/health.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TablesInsert } from '@/integrations/supabase/types';

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

// กิจกรรมพัฒนาผู้เรียน ๔ รายการ (หน้า ๖ และหน้า ๗)
export const ACTIVITIES_LIST = [
  { id: 'scout', name: 'ลูกเสือ' },
  { id: 'guidance', name: 'แนะแนว' },
  { id: 'club', name: 'ชุมนุม' },
  { id: 'social', name: 'เพื่อสังคมและสาธารณประโยชน์' },
] as const;

/**
 * ฟังก์ชันแปลงตัวเลขอารบิกเป็นตัวเลขไทยเฉพาะหน้าปก ปพ.6
 */
export function toThaiNumerals(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(val).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = toThaiNumerals(d.getDate());
    const month = THAI_MONTHS[d.getMonth()];
    const year = toThaiNumerals(d.getFullYear() + 543);
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

export function formatThaiNationalId(idStr: string | null | undefined): string {
  if (!idStr) return '-';
  const clean = idStr.replace(/[^0-9]/g, '');
  if (clean.length !== 13) return toThaiNumerals(idStr);
  const formatted = `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean[12]}`;
  return toThaiNumerals(formatted);
}

export function calculateThaiAge(birthDateStr: string | null | undefined, academicYear: string): string {
  if (!birthDateStr) return '-';
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return '-';
    const targetYearCE = parseInt(academicYear, 10) - 543;
    const refDate = new Date(targetYearCE, 4, 16);
    let years = refDate.getFullYear() - birth.getFullYear();
    let months = refDate.getMonth() - birth.getMonth();
    if (refDate.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years < 0) return '-';
    if (months === 0) return `${toThaiNumerals(years)} ปี`;
    return `${toThaiNumerals(years)} ปี ${toThaiNumerals(months)} เดือน`;
  } catch {
    return '-';
  }
}

export const PaporSixViewer: React.FC<Props> = ({
  selectedClass = 'ป.4',
  academicYear = '2569',
}) => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('papor6_active_student') || '';
    } catch {
      return '';
    }
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('papor6_active_page');
      const parsed = saved ? parseInt(saved, 10) : 1;
      return parsed >= 1 && parsed <= 10 ? parsed : 1;
    } catch {
      return 1;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Print Mode & Page Selector Controls
  // ค่าเริ่มต้นเลือก 4 หน้าหลักตามความต้องการ: ปก (1), ผลการเรียน (6), หน้า 8 (8), หน้า 9 (9)
  const [selectedPagesToPrint, setSelectedPagesToPrint] = useState<number[]>([1, 6, 8, 9]);
  const [viewMode, setViewMode] = useState<'single' | 'selected'>(() => {
    try {
      const saved = sessionStorage.getItem('papor6_view_mode');
      return saved === 'selected' ? 'selected' : 'single';
    } catch {
      return 'single';
    }
  });
  const [showPrintSettings, setShowPrintSettings] = useState(false);

  const handleSetCurrentPage = (page: number) => {
    setCurrentPage(page);
    try {
      sessionStorage.setItem('papor6_active_page', String(page));
    } catch {}
  };

  const handleSetViewMode = (mode: 'single' | 'selected') => {
    setViewMode(mode);
    try {
      sessionStorage.setItem('papor6_view_mode', mode);
    } catch {}
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    try {
      sessionStorage.setItem('papor6_active_student', id);
    } catch {}
  };

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
  const [customGrowth, setCustomGrowth] = useState<{
    weight1: string;
    height1: string;
    weight2: string;
    height2: string;
  }>({ weight1: '', height1: '', weight2: '', height2: '' });
  const [customEvaluations, setCustomEvaluations] = useState<Record<string, string>>({});
  const [customActivities, setCustomActivities] = useState<Record<string, 'pass' | 'fail' | ''>>({});

  const handleToggleEval = (key: string, grade: string) => {
    setCustomEvaluations((prev) => ({
      ...prev,
      [key]: prev[key] === grade ? '' : grade,
    }));
  };

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
        const savedStudent = sessionStorage.getItem('papor6_active_student');
        if (savedStudent && data.some((s) => s.id === savedStudent)) {
          setSelectedStudentId(savedStudent);
        } else {
          setSelectedStudentId(data[0].id);
        }
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

  // Helper: ดึงสถานะผลการประเมินเริ่มต้นของกิจกรรมพัฒนาผู้เรียนจากฐานข้อมูล
  const getInitialActivityStatus = useCallback(
    (actId: string): 'pass' | 'fail' | '' => {
      // 1. ตรวจสอบจาก student_obec_evaluations
      const evals = studentYearData?.evaluations || [];
      const found = evals.find(
        (e: any) => e.evaluation_type === 'activity' && e.category_key === actId
      );
      if (found) {
        if (found.status === 'ผ' || found.status === 'pass') return 'pass';
        if (found.status === 'มผ' || found.status === 'fail') return 'fail';
        return '';
      }

      // 2. Fallback ตรวจสอบจาก promotion.activities_status
      const promoStatus = studentYearData?.promotion?.activities_status;
      if (promoStatus === true) return 'pass';
      if (promoStatus === false) return 'fail';
      return 'pass';
    },
    [studentYearData]
  );

  // Toggle กิจกรรมพัฒนาผู้เรียน: ผ่าน -> ยังไม่ติ๊ก, ไม่ผ่าน -> ยังไม่ติ๊ก, หรือสลับระหว่างผ่าน/ไม่ผ่าน
  const handleToggleActivity = (actId: string, targetStatus: 'pass' | 'fail') => {
    if (!isManualEditMode) return;
    setCustomActivities((prev) => {
      const current = prev[actId] !== undefined ? prev[actId] : getInitialActivityStatus(actId);
      const nextStatus = current === targetStatus ? '' : targetStatus;
      return {
        ...prev,
        [actId]: nextStatus,
      };
    });
  };

  // Reset and rehydrate manual draft states when student changes or new studentYearData arrives
  useEffect(() => {
    setCustomSubjectScores({});
    setCustomTeacherTraits({});
    setCustomParentTraits({});
    setCustomRemarks({ rank: '', totalScore: '', gpa: '' });
    setCustomGrowth({ weight1: '', height1: '', weight2: '', height2: '' });
    setCustomEvaluations({});
    setCustomActivities({});
    setCustomTeacherComments({
      term1: studentYearData?.promotion?.teacher_comment_term1 || '',
      term2: studentYearData?.promotion?.teacher_comment_term2 || '',
    });
    setCustomParentComments(studentYearData?.promotion?.parent_comment || '');
  }, [selectedStudentId, studentYearData]);

  // Calculate scores list
  const displayScores = useMemo(() => {
    if (!classSubjects || classSubjects.length === 0) return [];
    const term1Scores = studentYearData?.term1?.scores || [];

    return classSubjects.map((sub: ObecGradeSubjectRow) => {
      const norm = (str: string) => (str || '').trim().toLowerCase().replace(/\s*[๑-๖1-6]$/, '');
      const found = term1Scores.find(
        (s: any) =>
          s.subject === sub.subject_name ||
          s.subject === sub.subject_code ||
          norm(s.subject) === norm(sub.subject_name)
      );
      const custom = customSubjectScores[sub.id] || {};

      const fullMarks = 100;
      const rawObtained = found
        ? (found.total !== undefined ? String(found.total) : (found.score !== undefined ? String(found.score) : ''))
        : '';
      const obtained = custom.obtained !== undefined ? custom.obtained : rawObtained;
      // Term 1 rule: no grade 0! Blank or custom or '-'
      let grade = '';
      if (!isTerm1Only) {
        grade = custom.grade !== undefined ? custom.grade : (found ? String(found.grade ?? '') : '');
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

  const queryClient = useQueryClient();

  // Mutation: บันทึกคะแนนและกิจกรรมพัฒนาผู้เรียนของนักเรียนคนปัจจุบันลงฐานข้อมูล
  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error('กรุณาเลือกนักเรียน');
      const validScores = displayScores
        .filter((s) => s.obtained !== '' && !isNaN(parseFloat(s.obtained)))
        .map((s) => ({
          subject: s.subjectName,
          score: parseFloat(s.obtained),
          maxScore: 50,
          notes: s.note || undefined,
        }));

      // 1. บันทึกคะแนนสอบ (หากมี)
      if (validScores.length > 0) {
        await scoresService.saveMidtermScoresForStudent(
          selectedStudentId,
          academicYear,
          '1',
          validScores,
          'ผู้ดูแลระบบ (ระบบ ปพ.6)'
        );
      }

      // 2. บันทึกผลประเมินกิจกรรมพัฒนาผู้เรียน ๔ รายการลง student_obec_evaluations
      const actRows: TablesInsert<'student_obec_evaluations'>[] = ACTIVITIES_LIST.map((act) => {
        const st = customActivities[act.id] !== undefined
          ? customActivities[act.id]
          : getInitialActivityStatus(act.id);
        return {
          student_id: selectedStudentId,
          academic_year: academicYear,
          semester: 'all',
          evaluation_type: 'activity',
          category_key: act.id,
          item_key: 'main',
          score: 40,
          status: st === 'pass' ? 'ผ' : st === 'fail' ? 'มผ' : '',
          notes: st === 'pass' ? 'ผ่าน' : st === 'fail' ? 'ไม่ผ่าน' : 'ยังไม่ประเมิน',
        };
      });

      const allPass = ACTIVITIES_LIST.every((act) => {
        const st = customActivities[act.id] !== undefined ? customActivities[act.id] : getInitialActivityStatus(act.id);
        return st === 'pass';
      });

      actRows.push({
        student_id: selectedStudentId,
        academic_year: academicYear,
        semester: 'all',
        evaluation_type: 'activity',
        category_key: 'summary',
        item_key: 'main',
        score: 120,
        status: allPass ? 'ผ' : 'มผ',
        notes: allPass ? 'ผ่าน' : 'ไม่ผ่าน',
      });

      await paporGradebookService.saveEvaluationsBatch(actRows);

      // 3. ซิงค์สถานะ activities_status ไปยัง student_term_promotion_records
      await paporGradebookService.syncDimensionToPromotions(academicYear, [
        {
          student_id: selectedStudentId,
          activities_status: allPass,
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-papor-year-data', selectedStudentId, academicYear] });
      queryClient.invalidateQueries({ queryKey: ['papor-student-year'] });
      queryClient.invalidateQueries({ queryKey: ['papor-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['papor-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['score_records'] });
      queryClient.invalidateQueries({ queryKey: ['papor-scores'] });
      queryClient.invalidateQueries({ queryKey: ['papor-class-scores'] });
      setCustomSubjectScores({});
      toast.success(`บันทึกคะแนนและกิจกรรมของ ${currentStudent?.name || 'นักเรียน'} ลงฐานข้อมูลเรียบร้อยแล้ว`);
    },
    onError: (err: any) => {
      toast.error('ไม่สามารถบันทึกข้อมูลได้: ' + (err.message || 'ข้อผิดพลาดระบบ'));
    },
  });

  // Mutation: เติมคะแนนเฉพาะวิชาที่ว่างให้เพื่อนร่วมชั้นทุกคน (Safe Batch Fill)
  const batchFillMutation = useMutation({
    mutationFn: async () => {
      const templateScores = displayScores
        .filter((s) => s.obtained !== '' && !isNaN(parseFloat(s.obtained)))
        .map((s) => ({
          subject: s.subjectName,
          score: parseFloat(s.obtained),
          maxScore: 50,
        }));

      if (templateScores.length === 0) {
        throw new Error('กรุณากรอกคะแนนอย่างน้อย 1 วิชาก่อนใช้งานคำสั่งนี้');
      }

      return await scoresService.batchFillEmptySubjectsForClass(
        selectedClass,
        academicYear,
        '1',
        templateScores,
        'ผู้ดูแลระบบ (ระบบ ปพ.6 เติมทั้งห้อง)'
      );
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['student-papor-year-data'] });
      queryClient.invalidateQueries({ queryKey: ['papor-student-year'] });
      queryClient.invalidateQueries({ queryKey: ['score_records'] });
      queryClient.invalidateQueries({ queryKey: ['papor-scores'] });
      queryClient.invalidateQueries({ queryKey: ['papor-class-scores'] });
      toast.success(
        `เติมคะแนนวิชาที่ว่างให้เพื่อนร่วมชั้น ${selectedClass} เรียบร้อยแล้ว (เพิ่มใหม่ ${result.insertedCount} รายการ ใน ${result.studentCount} คน)`
      );
    },
    onError: (err: any) => {
      toast.error('เกิดข้อผิดพลาดในการเติมคะแนนทั้งห้อง: ' + (err.message || 'ข้อผิดพลาดระบบ'));
    },
  });

  // Mutation: บันทึกความคิดเห็นครูและผู้ปกครองลง student_term_promotion_records
  const saveCommentsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error('กรุณาเลือกนักเรียน');
      await paporGradebookService.savePromotionsBatch([
        {
          student_id: selectedStudentId,
          academic_year: academicYear,
          teacher_comment_term1: customTeacherComments.term1,
          teacher_comment_term2: customTeacherComments.term2,
          parent_comment: customParentComments,
          approved_at: new Date().toISOString(),
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-papor-year-data', selectedStudentId, academicYear] });
      queryClient.invalidateQueries({ queryKey: ['papor-student-year'] });
      queryClient.invalidateQueries({ queryKey: ['papor-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['papor-reports-promotions'] });
      toast.success(`บันทึกความคิดเห็นของ ${currentStudent?.name || 'นักเรียน'} เรียบร้อยแล้ว`);
    },
    onError: (err: any) => {
      toast.error('ไม่สามารถบันทึกความคิดเห็นได้: ' + (err.message || 'ข้อผิดพลาดระบบ'));
    },
  });

  // บันทึกข้อมูลสุขภาพ (น้ำหนัก-ส่วนสูง) ลง student_growth_measurements
  const handleSaveGrowth = async () => {
    if (!selectedStudentId) {
      toast.error('กรุณาเลือกนักเรียนก่อนบันทึก');
      return;
    }
    try {
      const yearCE = parseInt(academicYear, 10) - 543;
      const w1 = parseFloat(customGrowth.weight1 || '32.0');
      const h1 = parseFloat(customGrowth.height1 || '135.0');
      await healthService.addGrowth({
        student_id: selectedStudentId,
        measured_at: `${yearCE}-06-15`,
        weight_kg: isNaN(w1) ? 32.0 : w1,
        height_cm: isNaN(h1) ? 135.0 : h1,
        notes: 'บันทึกผ่านระบบ ปพ.6 (ภาคเรียนที่ ๑)',
      });

      if (customGrowth.weight2 && customGrowth.height2) {
        const w2 = parseFloat(customGrowth.weight2);
        const h2 = parseFloat(customGrowth.height2);
        if (!isNaN(w2) && !isNaN(h2)) {
          await healthService.addGrowth({
            student_id: selectedStudentId,
            measured_at: `${yearCE + 1}-02-15`,
            weight_kg: w2,
            height_cm: h2,
            notes: 'บันทึกผ่านระบบ ปพ.6 (ภาคเรียนที่ ๒)',
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['student-papor-year-data'] });
      toast.success('บันทึกข้อมูลน้ำหนัก-ส่วนสูงลงฐานข้อมูลเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error('ไม่สามารถบันทึกข้อมูลสุขภาพได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    }
  };

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
    setCustomActivities({ scout: '', guidance: '', club: '', social: '' });
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
              <Select value={selectedStudentId} onValueChange={handleSelectStudent}>
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
                onClick={() => handleSetViewMode('single')}
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> ดูทีละหน้า
              </Button>
              <Button
                variant={viewMode === 'selected' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => handleSetViewMode('selected')}
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
                  onClick={() => handleSetCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => handleSetCurrentPage(Math.min(10, currentPage + 1))}
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

    const thaiStudentCode = toThaiNumerals(currentStudent.student_code) || '-';
    const thaiClassNumber = currentStudent.class_number ? toThaiNumerals(currentStudent.class_number) : '-';
    const thaiAcademicYear = toThaiNumerals(academicYear);
    const thaiGradeLevel = toThaiNumerals(selectedClass.replace(/[^0-9]/g, '')) || '๔';

    return (
      <div className="min-h-[265mm] flex flex-col justify-between py-6 px-4 text-center text-black box-border">
        {/* ─── 1. ตราโรงเรียนบ้านคำไผ่ (เดี่ยว) + หัวเรื่องขนาดใหญ่ ─── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-center mx-auto">
            <img
              src="/logos/school-logo.webp"
              alt="ตราประจำโรงเรียนบ้านคำไผ่"
              className="w-32 h-32 object-contain drop-shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              แบบรายงานประจำตัวนักเรียน
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-800">
              โรงเรียนบ้านคำไผ่
            </h2>
            <p className="text-base sm:text-lg font-medium text-neutral-700">
              สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
            </p>
          </div>
        </div>

        {/* ─── 2. รูปถ่ายนักเรียน (ขยายขนาด 3x4 นิ้ว สวยงาม) ─── */}
        <div className="my-8 sm:my-10">
          <div className="w-36 h-48 mx-auto border-2 border-neutral-400 p-0.5 bg-neutral-50 shadow-md flex items-center justify-center overflow-hidden">
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
                className="w-24 h-24 rounded-full"
              />
            )}
          </div>
        </div>

        {/* ─── 3. ช่องกรอกข้อมูลเส้นประ (กระจายช่องไฟ, ฟอนต์ใหญ่, ตัวเลขไทย) ─── */}
        <div className="max-w-lg mx-auto w-full space-y-6 text-base sm:text-lg text-left px-4">
          {/* ชื่อ */}
          <div className="flex items-end">
            <span className="font-bold whitespace-nowrap min-w-[80px]">ชื่อ</span>
            <span className="font-bold text-xl px-3 flex-1 border-b border-dotted border-black text-center truncate">
              {currentStudent.name}
            </span>
          </div>

          {/* เลขประจำตัว & เลขที่ (เลขไทย) */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-end">
              <span className="whitespace-nowrap font-semibold min-w-[100px]">เลขประจำตัว</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold text-lg truncate">
                {thaiStudentCode}
              </span>
            </div>
            <div className="flex items-end">
              <span className="whitespace-nowrap font-semibold min-w-[55px]">เลขที่</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold text-lg">
                {thaiClassNumber}
              </span>
            </div>
          </div>

          {/* ปีการศึกษา & ชั้น (เลขไทย) */}
          <div className="grid grid-cols-2 gap-6 pt-1">
            <div className="flex items-end">
              <span className="whitespace-nowrap font-semibold min-w-[100px]">ปีการศึกษา</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold text-lg">
                {thaiAcademicYear}
              </span>
            </div>
            <div className="flex items-end">
              <span className="whitespace-nowrap font-semibold min-w-[140px]">ชั้นประถมศึกษาปีที่</span>
              <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold text-lg">
                {thaiGradeLevel}
              </span>
            </div>
          </div>

          {/* ครูประจำชั้น (บรรทัดเดียว ไม่มีเลข 1 หรือ 2) */}
          <div className="flex items-end pt-1">
            <span className="whitespace-nowrap font-semibold min-w-[110px]">ครูประจำชั้น</span>
            <span className="px-3 flex-1 border-b border-dotted border-black text-center font-bold text-lg truncate">
              {homeroomTeacher?.name || 'ครูประจำชั้น'}
            </span>
          </div>
        </div>

        {/* ─── 4. บล็อกลายมือชื่อผู้อำนวยการโรงเรียน ─── */}
        <div className="pt-12 sm:pt-16 pb-6 text-center space-y-2.5">
          <div className="text-base tracking-wider">ลงชื่อ ................................................................</div>
          <div className="text-lg sm:text-xl font-bold">( นายสมพิศ แรงน้อย )</div>
          <div className="text-base font-semibold text-neutral-800">ผู้อำนวยการโรงเรียนบ้านคำไผ่</div>
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

  // ─── 3. STUDENT PROFILE (หน้า 2 ในเล่ม - ข้อมูลประวัติผู้เรียนและครอบครัว) ───
  function renderStudentProfilePage() {
    if (!currentStudent) return null;
    const studentProfile = studentYearData?.term1?.student;
    const thaiStudentCode = toThaiNumerals(studentProfile?.student_code || currentStudent.student_code) || '-';
    const thaiClassNumber = toThaiNumerals(studentProfile?.class_number || currentStudent.class_number) || '-';
    const thaiNationalId = formatThaiNationalId(studentProfile?.national_id);
    const thaiBirthDate = formatThaiDate(studentProfile?.birth_date);
    const thaiAge = calculateThaiAge(studentProfile?.birth_date, academicYear);
    const thaiGradeLevel = toThaiNumerals(selectedClass.replace(/[^0-9]/g, '')) || '๔';
    const thaiAcademicYear = toThaiNumerals(academicYear);

    // Address
    const houseNo = toThaiNumerals(studentProfile?.current_house_no) || '';
    const moo = toThaiNumerals(studentProfile?.current_moo) || '';
    const road = studentProfile?.current_road || '';
    const tambon = studentProfile?.current_tambon || 'คำไผ่';
    const amphoe = studentProfile?.current_amphoe || 'วังสามหมอ';
    const province = studentProfile?.current_province || 'อุดรธานี';

    // Family
    const fatherName = studentProfile?.father_name || '';
    const motherName = studentProfile?.mother_name || '';
    const guardianName = studentProfile?.guardian_name || studentProfile?.parent_name || motherName || fatherName || '';
    const guardianRelation = studentProfile?.guardian_relation || (guardianName === motherName ? 'มารดา' : (guardianName === fatherName ? 'บิดา' : 'ผู้ปกครอง'));
    const parentPhone = toThaiNumerals(studentProfile?.parent_phone) || '';

    return (
      <div className="space-y-4 text-black text-xs leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-2">
          <div className="w-8 font-bold text-sm">๒</div>
          <div className="text-center flex-1 space-y-0.5">
            <h2 className="text-base font-bold">ข้อมูลประวัติผู้เรียนและครอบครัว</h2>
            <p className="text-[11px] text-neutral-700">
              โรงเรียนบ้านคำไผ่ สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
            </p>
          </div>
          <div className="w-8 text-right font-bold text-sm">ปพ.๖</div>
        </div>

        {/* 1. General Profile */}
        <div className="border border-black p-3 rounded space-y-2.5 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            ๑. ข้อมูลทั่วไปของผู้เรียน
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap min-w-[70px]">ชื่อ - สกุล:</span>
              <span className="font-bold text-sm px-2 flex-1 border-b border-dotted border-black">
                {currentStudent.name}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">เลขประจำตัว:</span>
              <span className="font-bold px-2 min-w-[60px] text-center border-b border-dotted border-black">
                {thaiStudentCode}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">เลขที่:</span>
              <span className="font-bold px-2 min-w-[35px] text-center border-b border-dotted border-black">
                {thaiClassNumber}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap min-w-[150px]">เลขประจำตัวประชาชน (๑๓ หลัก):</span>
              <span className="font-bold tracking-wider px-2 flex-1 border-b border-dotted border-black text-center">
                {thaiNationalId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[75px]">เกิดวันที่:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black font-medium text-center">
                  {thaiBirthDate}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[130px]">อายุ (ณ ๑๖ พ.ค. {thaiAcademicYear}):</span>
                <span className="px-2 flex-1 border-b border-dotted border-black font-medium text-center">
                  {thaiAge}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-0.5">
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[50px]">สัญชาติ:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                  {studentProfile?.nationality || 'ไทย'}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[50px]">เชื้อชาติ:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                  {studentProfile?.nationality || 'ไทย'}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[45px]">ศาสนา:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black text-center font-medium">
                  {studentProfile?.religion || 'พุทธ'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[110px]">ชั้นประถมศึกษาปีที่:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold">
                  {thaiGradeLevel}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap min-w-[70px]">ปีการศึกษา:</span>
                <span className="px-2 flex-1 border-b border-dotted border-black text-center font-bold">
                  {thaiAcademicYear}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Student Address */}
        <div className="border border-black p-3 rounded space-y-2 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            ๒. ที่อยู่ตามทะเบียนบ้านและที่พักอาศัยปัจจุบัน
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap min-w-[65px]">บ้านเลขที่:</span>
              <span className="px-2 min-w-[70px] text-center border-b border-dotted border-black">
                {houseNo || '..........'}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">หมู่ที่:</span>
              <span className="px-2 min-w-[50px] text-center border-b border-dotted border-black">
                {moo || '..........'}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">ถนน/ซอย:</span>
              <span className="px-2 flex-1 text-center border-b border-dotted border-black truncate">
                {road || '....................'}
              </span>
            </div>
            <div className="flex items-baseline pt-0.5">
              <span className="font-semibold whitespace-nowrap min-w-[65px]">ตำบล/แขวง:</span>
              <span className="px-2 flex-1 text-center border-b border-dotted border-black">
                {tambon}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">อำเภอ/เขต:</span>
              <span className="px-2 flex-1 text-center border-b border-dotted border-black">
                {amphoe}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">จังหวัด:</span>
              <span className="px-2 flex-1 text-center border-b border-dotted border-black">
                {province}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Family and Guardians */}
        <div className="border border-black p-3 rounded space-y-2.5 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            ๓. ข้อมูลครอบครัวและผู้ปกครอง
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap min-w-[85px]">ชื่อ - สกุลบิดา:</span>
              <span className="px-2 flex-1 border-b border-dotted border-black font-medium">
                {fatherName || '....................................................................................'}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">สัญชาติ:</span>
              <span className="px-2 min-w-[50px] text-center border-b border-dotted border-black">ไทย</span>
              <span className="font-semibold whitespace-nowrap px-2">ศาสนา:</span>
              <span className="px-2 min-w-[50px] text-center border-b border-dotted border-black">พุทธ</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap min-w-[85px]">ชื่อ - สกุลมารดา:</span>
              <span className="px-2 flex-1 border-b border-dotted border-black font-medium">
                {motherName || '....................................................................................'}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">สัญชาติ:</span>
              <span className="px-2 min-w-[50px] text-center border-b border-dotted border-black">ไทย</span>
              <span className="font-semibold whitespace-nowrap px-2">ศาสนา:</span>
              <span className="px-2 min-w-[50px] text-center border-b border-dotted border-black">พุทธ</span>
            </div>

            <div className="flex items-baseline pt-0.5">
              <span className="font-semibold whitespace-nowrap min-w-[105px]">ชื่อ - สกุลผู้ปกครอง:</span>
              <span className="px-2 flex-1 border-b border-dotted border-black font-medium truncate">
                {guardianName || '....................................................................................'}
              </span>
              <span className="font-semibold whitespace-nowrap px-2">เกี่ยวข้องเป็น:</span>
              <span className="px-2 min-w-[80px] text-center border-b border-dotted border-black">
                {guardianRelation}
              </span>
            </div>

            <div className="flex items-baseline pt-0.5">
              <span className="font-semibold whitespace-nowrap min-w-[130px]">หมายเลขโทรศัพท์ติดต่อ:</span>
              <span className="px-2 flex-1 border-b border-dotted border-black font-medium">
                {parentPhone || '....................................................................................'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Notes & Changes */}
        <div className="border border-black p-3 rounded space-y-2 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            ๔. บันทึกการเปลี่ยนแปลงประวัติและพัฒนาการสำคัญ
          </div>
          <div className="space-y-3 pt-1">
            <div className="border-b border-dotted border-black h-4 w-full"></div>
            <div className="border-b border-dotted border-black h-4 w-full"></div>
            <div className="border-b border-dotted border-black h-4 w-full"></div>
          </div>
        </div>

        {/* Signature */}
        <div className="pt-2 flex justify-end">
          <div className="text-center text-xs space-y-1">
            <div>ลงชื่อ ................................................................ ครูประจำชั้น</div>
            <div className="font-semibold">({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 4. GROWTH & HEALTH (หน้า 3 ในเล่ม - สุขภาพและน้ำหนัก-ส่วนสูง) ──────
  function renderGrowthHealthPage() {
    if (!currentStudent) return null;
    const growthList = studentYearData?.growth || [];
    const t1Growth = growthList[0];
    const t2Growth = growthList[1];

    // Standard baseline for Grade 4 if not in DB yet
    const displayW1 = customGrowth.weight1 || (t1Growth?.weight_kg ? String(t1Growth.weight_kg) : '32.0');
    const displayH1 = customGrowth.height1 || (t1Growth?.height_cm ? String(t1Growth.height_cm) : '135.0');
    const displayW2 = customGrowth.weight2 || (t2Growth?.weight_kg ? String(t2Growth.weight_kg) : '33.5');
    const displayH2 = customGrowth.height2 || (t2Growth?.height_cm ? String(t2Growth.height_cm) : '137.0');

    return (
      <div className="space-y-4 text-black text-xs leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-2">
          <div className="w-8 font-bold text-sm">๓</div>
          <div className="text-center flex-1 space-y-0.5">
            <h2 className="text-base font-bold">ความเจริญเติบโตทางร่างกายและสุขภาพ</h2>
            <p className="text-[11px] text-neutral-700">
              เกณฑ์อ้างอิงการเจริญเติบโตของเด็กไทย (กรมอนามัย กระทรวงสาธารณสุข)
            </p>
          </div>
          <div className="w-8 text-right font-bold text-sm">ปพ.๖</div>
        </div>

        {/* Edit notice / Save button */}
        {isManualEditMode && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded flex items-center justify-between print:hidden">
            <div className="text-xs text-amber-900 font-medium">
              โหมดแก้ไข: ท่านสามารถปรับปรุงค่าน้ำหนักและส่วนสูงของนักเรียนคนนี้ และกดบันทึกลงฐานข้อมูลได้
            </div>
            <Button
              size="sm"
              onClick={handleSaveGrowth}
              className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกน้ำหนัก-ส่วนสูง
            </Button>
          </div>
        )}

        {/* 2 Semesters Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Term 1 */}
          <div className="border border-black p-3.5 rounded space-y-3 bg-white">
            <div className="font-bold text-sm border-b border-black pb-1.5 text-center bg-neutral-50 -mx-3.5 -mt-3.5 p-2 rounded-t">
              ภาคเรียนที่ ๑ (มิถุนายน)
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">น้ำหนัก:</span>
                {isManualEditMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={customGrowth.weight1 || (t1Growth?.weight_kg ? String(t1Growth.weight_kg) : '32.0')}
                      onChange={(e) => setCustomGrowth((p) => ({ ...p, weight1: e.target.value }))}
                      className="w-20 h-7 text-xs text-right font-bold"
                    />
                    <span>กก.</span>
                  </div>
                ) : (
                  <span className="font-bold text-sm">
                    {toThaiNumerals(displayW1)} กิโลกรัม
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">ส่วนสูง:</span>
                {isManualEditMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      value={customGrowth.height1 || (t1Growth?.height_cm ? String(t1Growth.height_cm) : '135.0')}
                      onChange={(e) => setCustomGrowth((p) => ({ ...p, height1: e.target.value }))}
                      className="w-20 h-7 text-xs text-right font-bold"
                    />
                    <span>ซม.</span>
                  </div>
                ) : (
                  <span className="font-bold text-sm">
                    {toThaiNumerals(displayH1)} เซนติเมตร
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-dashed border-neutral-300">
                <span className="font-semibold">การแปลผล:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  ตามเกณฑ์ (สมส่วน)
                </span>
              </div>

              <div className="pt-2 text-[11px] text-neutral-700 leading-normal">
                ภาวะโภชนาการ: น้ำหนักตามเกณฑ์ส่วนสูง และส่วนสูงตามเกณฑ์อายุ ร่างกายเจริญเติบโตสมบูรณ์ตามวัย
              </div>
            </div>
          </div>

          {/* Term 2 */}
          <div className="border border-black p-3.5 rounded space-y-3 bg-white">
            <div className="font-bold text-sm border-b border-black pb-1.5 text-center bg-neutral-50 -mx-3.5 -mt-3.5 p-2 rounded-t">
              ภาคเรียนที่ ๒ (กุมภาพันธ์)
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">น้ำหนัก:</span>
                {isTerm1Only ? (
                  <span className="font-bold text-sm text-neutral-500">-</span>
                ) : isManualEditMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={customGrowth.weight2 || (t2Growth?.weight_kg ? String(t2Growth.weight_kg) : '33.5')}
                      onChange={(e) => setCustomGrowth((p) => ({ ...p, weight2: e.target.value }))}
                      className="w-20 h-7 text-xs text-right font-bold"
                    />
                    <span>กก.</span>
                  </div>
                ) : (
                  <span className="font-bold text-sm">
                    {toThaiNumerals(displayW2)} กิโลกรัม
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">ส่วนสูง:</span>
                {isTerm1Only ? (
                  <span className="font-bold text-sm text-neutral-500">-</span>
                ) : isManualEditMode ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      value={customGrowth.height2 || (t2Growth?.height_cm ? String(t2Growth.height_cm) : '137.0')}
                      onChange={(e) => setCustomGrowth((p) => ({ ...p, height2: e.target.value }))}
                      className="w-20 h-7 text-xs text-right font-bold"
                    />
                    <span>ซม.</span>
                  </div>
                ) : (
                  <span className="font-bold text-sm">
                    {toThaiNumerals(displayH2)} เซนติเมตร
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-dashed border-neutral-300">
                <span className="font-semibold">การแปลผล:</span>
                {isTerm1Only ? (
                  <span className="font-bold text-neutral-500">-</span>
                ) : (
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    ตามเกณฑ์ (สมส่วน)
                  </span>
                )}
              </div>

              <div className="pt-2 text-[11px] text-neutral-700 leading-normal">
                {isTerm1Only
                  ? 'จะทำการประเมินและชั่งน้ำหนัก-วัดส่วนสูงอีกครั้งในช่วงปลายภาคเรียนที่ ๒'
                  : 'ภาวะโภชนาการ: พัฒนาการความเจริญเติบโตด้านร่างกายต่อเนื่องเป็นปกติสมวัย'}
              </div>
            </div>
          </div>
        </div>

        {/* Growth Reference Table */}
        <div className="border border-black p-3 rounded space-y-2 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            เกณฑ์อ้างอิงการเจริญเติบโตของเด็กไทย อายุ ๙ - ๑๐ ปี (กรมอนามัย)
          </div>
          <table className="w-full border-collapse border border-black text-center text-[11px]">
            <thead className="bg-neutral-100 font-semibold">
              <tr>
                <th className="border border-black p-1">เพศ</th>
                <th className="border border-black p-1">น้ำหนักตามเกณฑ์ (กก.)</th>
                <th className="border border-black p-1">ส่วนสูงตามเกณฑ์ (ซม.)</th>
                <th className="border border-black p-1">เกณฑ์การแปลผล</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 font-medium">ชาย</td>
                <td className="border border-black p-1">๒๗.๕ - ๓๘.๕</td>
                <td className="border border-black p-1">๑๒๘.๕ - ๑๔๑.๕</td>
                <td className="border border-black p-1">น้ำหนักและส่วนสูงตามเกณฑ์</td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-medium">หญิง</td>
                <td className="border border-black p-1">๒๗.๐ - ๓๙.๐</td>
                <td className="border border-black p-1">๑๒๘.๐ - ๑๔๒.๐</td>
                <td className="border border-black p-1">น้ำหนักและส่วนสูงตามเกณฑ์</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Signature */}
        <div className="pt-2 flex justify-end">
          <div className="text-center text-xs space-y-1">
            <div>ลงชื่อ ................................................................ ครูประจำชั้น</div>
            <div className="font-semibold">({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
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

        {/* Action Toolbar for Manual Edit Mode: Save to Database & Safe Batch Fill */}
        {isManualEditMode && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 print:hidden shadow-xs">
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>โหมดแก้ไขคะแนน & กิจกรรม: พิมพ์คะแนน หรือคลิกผลประเมินกิจกรรม (ผ่าน / ไม่ผ่าน / ยังไม่ติ๊ก) แล้วบันทึกลงฐานข้อมูล</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const validCount = displayScores.filter((s) => s.obtained !== '' && !isNaN(parseFloat(s.obtained))).length;
                  if (validCount === 0) {
                    toast.warning('กรุณากรอกคะแนนวิชาที่ต้องการเติมให้เพื่อนก่อน');
                    return;
                  }
                  if (window.confirm(`ยืนยันการนำคะแนนวิชาที่กรอกไว้ ไปเติมให้กับเพื่อนร่วมชั้น ${selectedClass} ทุกคนที่ยังไม่มีคะแนนหรือไม่?\n\n(ระบบ Safe Mode จะเติมเฉพาะวิชาที่ว่างอยู่ โดยไม่แตะต้องคะแนนสอบเดิม 8 วิชาของเพื่อน)`)) {
                    batchFillMutation.mutate();
                  }
                }}
                disabled={batchFillMutation.isPending || saveStudentMutation.isPending}
                className="h-8 text-xs gap-1.5 border-primary/30 hover:bg-primary/10"
              >
                {batchFillMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                <span>ใช้คะแนนช่องที่ว่างกับเพื่อนทั้งห้อง</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => saveStudentMutation.mutate()}
                disabled={saveStudentMutation.isPending || batchFillMutation.isPending}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {saveStudentMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>💾 บันทึกคะแนน/กิจกรรม (คนปัจจุบัน)</span>
              </Button>
            </div>
          </div>
        )}

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
                      idx === 4 ? <span className="font-bold font-mono">{totalObtainedScore > 0 ? totalObtainedScore : ''}</span> :
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
              <td className="border border-black p-0.5">{totalObtainedScore > 0 ? totalObtainedScore : ''}</td>
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
            {ACTIVITIES_LIST.map((act) => {
              const currentStatus = customActivities[act.id] !== undefined
                ? customActivities[act.id]
                : getInitialActivityStatus(act.id);
              const isPass = currentStatus === 'pass';
              const isFail = currentStatus === 'fail';

              return (
                <tr key={act.id} className="h-5">
                  <td className="border border-black px-1.5 py-0.5 text-left font-medium">{act.name}</td>
                  <td
                    onClick={() => handleToggleActivity(act.id, 'pass')}
                    title={isManualEditMode ? 'คลิกเพื่อติ๊ก ผ่าน (คลิกซ้ำเพื่อยกเลิก)' : undefined}
                    className={cn(
                      'border border-black p-0.5 w-[16.5%] font-bold',
                      isManualEditMode && 'cursor-pointer hover:bg-amber-100 select-none'
                    )}
                  >
                    {isPass ? '✓' : ''}
                  </td>
                  <td
                    onClick={() => handleToggleActivity(act.id, 'fail')}
                    title={isManualEditMode ? 'คลิกเพื่อติ๊ก ไม่ผ่าน (คลิกซ้ำเพื่อยกเลิก)' : undefined}
                    className={cn(
                      'border border-black p-0.5 w-[16.5%] font-bold',
                      isManualEditMode && 'cursor-pointer hover:bg-amber-100 select-none'
                    )}
                  >
                    {isFail ? '✓' : ''}
                  </td>
                </tr>
              );
            })}
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
              {
                id: 'reading',
                name: 'สรุปการประเมินผลการอ่าน คิดวิเคราะห์ และเขียน',
                grade: studentYearData?.promotion?.reading_grade || 'ดีเยี่ยม',
              },
              {
                id: 'character',
                name: 'สรุปการประเมินผล คุณลักษณะอันพึงประสงค์',
                grade: studentYearData?.promotion?.character_grade || 'ดีเยี่ยม',
              },
              {
                id: 'competency',
                name: 'สรุปการประเมินผล สมรรถนะ',
                grade: studentYearData?.promotion?.competency_grade || 'ดีเยี่ยม',
              },
            ].map((item) => {
              const currentGrade = customEvaluations[item.id] || item.grade;
              const isExcellent = currentGrade === 'ดีเยี่ยม' || currentGrade === 'ดย' || currentGrade === '3';
              const isGood = currentGrade === 'ดี' || currentGrade === 'ด' || currentGrade === '2';
              const isPass = currentGrade === 'ผ่าน' || currentGrade === 'ผ' || currentGrade === '1';

              return (
                <tr key={item.id} className="h-5">
                  <td className="border border-black px-1.5 py-0.5 text-left font-medium">{item.name}</td>
                  <td
                    onClick={() => isManualEditMode && handleToggleEval(item.id, 'ดีเยี่ยม')}
                    className={cn(
                      'border border-black p-0.5 w-[15%] font-bold',
                      isManualEditMode && 'cursor-pointer hover:bg-amber-100 select-none'
                    )}
                  >
                    {isExcellent ? '✓' : ''}
                  </td>
                  <td
                    onClick={() => isManualEditMode && handleToggleEval(item.id, 'ดี')}
                    className={cn(
                      'border border-black p-0.5 w-[15%] font-bold',
                      isManualEditMode && 'cursor-pointer hover:bg-amber-100 select-none'
                    )}
                  >
                    {isGood ? '✓' : ''}
                  </td>
                  <td
                    onClick={() => isManualEditMode && handleToggleEval(item.id, 'ผ่าน')}
                    className={cn(
                      'border border-black p-0.5 w-[15%] font-bold',
                      isManualEditMode && 'cursor-pointer hover:bg-amber-100 select-none'
                    )}
                  >
                    {isPass ? '✓' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 3 Signatures Row (ครูประจำชั้น, หัวหน้าวิชาการ, ผู้อำนวยการ) จัดชื่อตรงกึ่งกลางใต้เส้นประ */}
        <div className="pt-2 text-xs leading-normal">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex items-start justify-center">
              <span className="whitespace-nowrap">ลงชื่อ</span>
              <div className="flex flex-col items-center mx-1">
                <span>....................................................</span>
                <span className="font-medium text-[11px] mt-1">({homeroomTeacher?.name || 'ครูประจำชั้น'})</span>
              </div>
              <span className="whitespace-nowrap">ครูประจำชั้น</span>
            </div>
            <div className="flex items-start justify-center">
              <span className="whitespace-nowrap">ลงชื่อ</span>
              <div className="flex flex-col items-center mx-1">
                <span>....................................................</span>
                <span className="font-medium text-[11px] mt-1">(นางสาวมะลิวัลย์ จรุงพันธ์)</span>
              </div>
              <span className="whitespace-nowrap">หัวหน้าวิชาการ</span>
            </div>
          </div>
          <div className="flex items-start justify-center pt-3">
            <span className="whitespace-nowrap">ลงชื่อ</span>
            <div className="flex flex-col items-center mx-1">
              <span>............................................................................</span>
              <span className="font-medium text-[11px] mt-1">(นายสมพิศ แรงน้อย)</span>
            </div>
            <span className="whitespace-nowrap">ผู้อำนวยการโรงเรียน</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── 7. ACTIVITIES & 4 DIMENSIONS (หน้า 6-7 ในเล่ม - กิจกรรม & สมรรถนะ) ────
  function renderActivitiesPage() {
    if (!currentStudent) return null;
    const classNum = selectedClass.replace(/[^0-9]/g, '') || '๔';
    const thaiClassNum = toThaiNumerals(classNum);
    const thaiAcademicYear = toThaiNumerals(academicYear);

    const actStatus = studentYearData?.promotion?.activities_status !== false;
    const charGrade = studentYearData?.promotion?.character_grade || 'ดีเยี่ยม';
    const charGradeDisplay = charGrade === 'ดย' ? 'ดีเยี่ยม (ดย)' : charGrade;
    const compGrade = studentYearData?.promotion?.competency_grade || 'ดีเยี่ยม';
    const compGradeDisplay = compGrade === 'ดย' ? 'ดีเยี่ยม (ดย)' : compGrade;
    const readGrade = studentYearData?.promotion?.reading_grade || 'ดีเยี่ยม';
    const readGradeDisplay = readGrade === 'ดย' ? 'ดีเยี่ยม (ดย)' : readGrade;

    return (
      <div className="space-y-3.5 text-black text-xs leading-normal">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-1.5">
          <div className="w-8 font-bold text-sm">๗</div>
          <div className="text-center flex-1 space-y-0.5">
            <h2 className="text-base font-bold">กิจกรรมพัฒนาผู้เรียนและผลการประเมิน ๔ มิติ</h2>
            <p className="text-[11px] text-neutral-700">
              โรงเรียนบ้านคำไผ่ ชั้นประถมศึกษาปีที่ {thaiClassNum} ปีการศึกษา {thaiAcademicYear}
            </p>
          </div>
          <div className="w-44 text-right font-semibold text-xs truncate">
            {currentStudent.name}
          </div>
        </div>

        {/* 1. Development Activities Table */}
        <div className="border border-black rounded p-2.5 space-y-1.5 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1">
            ๑. กิจกรรมพัฒนาผู้เรียน (ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน)
          </div>
          <table className="w-full border-collapse border border-black text-center text-[11px]">
            <thead className="bg-neutral-100 font-semibold">
              <tr>
                <th className="border border-black p-1 text-left w-[50%]">กิจกรรม</th>
                <th className="border border-black p-1 w-[20%]">เวลาเรียน (ชม.)</th>
                <th className="border border-black p-1 w-[15%]">เกณฑ์เวลาเรียน</th>
                <th className="border border-black p-1 w-[15%]">ผลการประเมิน</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'guidance', name: '๑. กิจกรรมแนะแนว', hours: '๔๐', req: 'ร้อยละ ๘๐' },
                { id: 'scout', name: '๒. กิจกรรมนักเรียน (ลูกเสือ / เนตรนารี)', hours: '๔๐', req: 'ร้อยละ ๘๐' },
                { id: 'club', name: '๓. กิจกรรมนักเรียน (ชุมนุม / ชมรม)', hours: '๓๐', req: 'ร้อยละ ๘๐' },
                { id: 'social', name: '๔. กิจกรรมเพื่อสังคมและสาธารณประโยชน์', hours: '๑๐', req: 'ร้อยละ ๘๐' },
              ].map((act) => {
                const st = customActivities[act.id] !== undefined
                  ? customActivities[act.id]
                  : getInitialActivityStatus(act.id);
                const display = st === 'pass' ? 'ผ่าน (ผ)' : st === 'fail' ? 'ไม่ผ่าน (มผ)' : '-';
                return (
                  <tr key={act.id} className="h-6">
                    <td className="border border-black px-2 py-0.5 text-left font-medium">{act.name}</td>
                    <td className="border border-black p-0.5">{act.hours}</td>
                    <td className="border border-black p-0.5 text-[10px]">{act.req}</td>
                    <td
                      className={cn(
                        'border border-black p-0.5 font-bold',
                        st === 'pass' ? 'text-emerald-800' : st === 'fail' ? 'text-red-700' : 'text-neutral-500'
                      )}
                    >
                      {display}
                    </td>
                  </tr>
                );
              })}
              {(() => {
                const allPass = ACTIVITIES_LIST.every(
                  (act) => (customActivities[act.id] !== undefined ? customActivities[act.id] : getInitialActivityStatus(act.id)) === 'pass'
                );
                return (
                  <tr className="bg-neutral-50 font-bold h-6">
                    <td className="border border-black px-2 py-0.5 text-center">สรุปผลการประเมินกิจกรรมพัฒนาผู้เรียน</td>
                    <td className="border border-black p-0.5">๑๒๐</td>
                    <td className="border border-black p-0.5 text-[10px]">ผ่านเกณฑ์</td>
                    <td className={cn('border border-black p-0.5', allPass ? 'text-emerald-900 bg-emerald-50' : 'text-red-800 bg-red-50')}>
                      {allPass ? 'ผ่าน (ผ)' : 'ไม่ผ่าน (มผ)'}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* 2 & 3. Character Traits & Core Competencies (2-column layout) */}
        <div className="grid grid-cols-2 gap-3">
          {/* 2. Character Traits */}
          <div className="border border-black rounded p-2.5 space-y-1.5 bg-white">
            <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1 flex justify-between">
              <span>๒. คุณลักษณะอันพึงประสงค์ ๘ ประการ</span>
              <span className="text-emerald-800">{charGradeDisplay}</span>
            </div>
            <div className="space-y-1 text-[11px] pt-0.5">
              {[
                '๑. รักชาติ ศาสน์ กษัตริย์',
                '๒. ซื่อสัตย์สุจริต',
                '๓. มีวินัย',
                '๔. ใฝ่เรียนรู้',
                '๕. อยู่อย่างพอเพียง',
                '๖. มุ่งมั่นในการทำงาน',
                '๗. รักความเป็นไทย',
                '๘. มีจิตสาธารณะ',
              ].map((trait) => (
                <div key={trait} className="flex justify-between items-center py-0.5 border-b border-dotted border-neutral-200">
                  <span className="text-neutral-800">{trait}</span>
                  <span className="font-semibold text-emerald-700">ดีเยี่ยม</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Core Competencies */}
          <div className="border border-black rounded p-2.5 space-y-1.5 bg-white">
            <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1 flex justify-between">
              <span>๓. สมรรถนะสำคัญของผู้เรียน ๕ ด้าน</span>
              <span className="text-emerald-800">{compGradeDisplay}</span>
            </div>
            <div className="space-y-1 text-[11px] pt-0.5">
              {[
                '๑. ความสามารถในการสื่อสาร',
                '๒. ความสามารถในการคิด',
                '๓. ความสามารถในการแก้ปัญหา',
                '๔. ความสามารถในการใช้ทักษะชีวิต',
                '๕. ความสามารถในการใช้เทคโนโลยี',
              ].map((comp) => (
                <div key={comp} className="flex justify-between items-center py-0.5 border-b border-dotted border-neutral-200">
                  <span className="text-neutral-800">{comp}</span>
                  <span className="font-semibold text-emerald-700">ดีเยี่ยม</span>
                </div>
              ))}
            </div>
            {/* 4. Reading, Analytical Thinking and Writing inside box */}
            <div className="pt-2 border-t border-black/30 mt-2">
              <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1 flex justify-between">
                <span>๔. การอ่าน คิดวิเคราะห์ และเขียน</span>
                <span className="text-emerald-800">{readGradeDisplay}</span>
              </div>
              <div className="text-[10px] text-neutral-600 pt-1 leading-relaxed">
                ประเมินตามตัวชี้วัดการอ่านเพื่อการเรียนรู้ การคิดวิเคราะห์สรุปใจความสำคัญ และการถ่ายทอดความคิดผ่านการเขียน
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Signature */}
        <div className="pt-2 flex justify-end">
          <div className="text-center text-xs space-y-1">
            <div>ลงชื่อ ................................................................ ครูประจำชั้น</div>
            <div className="font-semibold">({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 8. TEACHER COMMENTS (ความเห็นของครูประจำชั้น - Image 3) ────────
  function renderTeacherCommentsPage() {
    if (!currentStudent) return null;

    return (
      <div className="space-y-3.5 text-black font-sans text-sm leading-normal">
        {/* Header with Student Name on Top Right */}
        <div className="flex justify-between items-start pb-1">
          <div className="w-8 font-bold text-base">๘</div>
          <div className="text-center flex-1">
            <div className="font-bold text-lg">ความเห็นของครูประจำชั้น</div>
            <div className="text-sm text-neutral-800">ให้ใส่เครื่องหมาย ✓ ลงในช่องว่าง</div>
          </div>
          <div className="w-48 text-right font-semibold text-sm">
            {currentStudent.name}
          </div>
        </div>

        {/* Edit notice / Save button */}
        {isManualEditMode && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded flex items-center justify-between print:hidden">
            <div className="text-xs text-amber-900 font-medium">
              โหมดแก้ไข: ท่านสามารถพิมพ์ความคิดเห็นเพิ่มเติมของครูประจำชั้น และกดบันทึกลงฐานข้อมูลได้
            </div>
            <Button
              size="sm"
              onClick={() => saveCommentsMutation.mutate()}
              disabled={saveCommentsMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs flex items-center gap-1.5"
            >
              {saveCommentsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              บันทึกความคิดเห็น
            </Button>
          </div>
        )}

        {/* 12 Teacher Traits Table - Proportional font and balanced padding */}
        <table className="w-full border-collapse border border-black text-center text-sm leading-normal">
          <thead>
            <tr className="bg-neutral-100/70 font-bold">
              <th rowSpan={2} className="border border-black p-1.5 text-left w-[46%] text-sm font-bold">
                คุณลักษณะของนักเรียนขณะอยู่ในโรงเรียน
              </th>
              <th colSpan={4} className="border border-black p-1 w-[27%] text-sm font-bold">ภาคเรียนที่ ๑</th>
              <th colSpan={4} className="border border-black p-1 w-[27%] text-sm font-bold">ภาคเรียนที่ ๒</th>
            </tr>
            <tr className="bg-neutral-100/50 font-semibold text-xs">
              <th className="border border-black p-1 w-[6.75%]">ดีเยี่ยม</th>
              <th className="border border-black p-1 w-[6.75%]">ดี</th>
              <th className="border border-black p-1 w-[6.75%]">พอใช้</th>
              <th className="border border-black p-1 w-[6.75%]">ปรับปรุง</th>
              <th className="border border-black p-1 w-[6.75%]">ดีเยี่ยม</th>
              <th className="border border-black p-1 w-[6.75%]">ดี</th>
              <th className="border border-black p-1 w-[6.75%]">พอใช้</th>
              <th className="border border-black p-1 w-[6.75%]">ปรับปรุง</th>
            </tr>
          </thead>
          <tbody>
            {TEACHER_TRAITS_12.map((trait, idx) => {
              const currentT = customTeacherTraits[idx] || {};
              return (
                <tr key={trait} className="h-[30px]">
                  {/* Left topic column - generous padding, clear text */}
                  <td className="border border-black px-3 py-0.5 text-left font-medium text-[13.5px] whitespace-normal">
                    {trait}
                  </td>

                  {/* Term 1 Ratings */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`t1-${r}`}
                      onClick={() => toggleTeacherTrait(idx, 'term1', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold text-sm cursor-pointer select-none',
                        isManualEditMode && 'hover:bg-amber-100'
                      )}
                    >
                      {currentT.term1 === r ? '✓' : ''}
                    </td>
                  ))}

                  {/* Term 2 Ratings */}
                  {(['ดีเยี่ยม', 'ดี', 'พอใช้', 'ปรับปรุง'] as const).map((r) => (
                    <td
                      key={`t2-${r}`}
                      onClick={() => toggleTeacherTrait(idx, 'term2', r)}
                      className={cn(
                        'border border-black p-0.5 font-bold text-sm cursor-pointer select-none',
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
            <tr className="h-[32px] font-semibold">
              <td className="border border-black px-3 py-1 text-center text-sm font-bold">ลงชื่อครูประจำชั้น</td>
              <td colSpan={4} className="border border-black p-1 text-[13px] font-medium text-center">
                {homeroomTeacher?.name ? `(${homeroomTeacher.name})` : ''}
              </td>
              <td colSpan={4} className="border border-black p-1 text-[13px] font-medium text-center"></td>
            </tr>
          </tbody>
        </table>

        {/* Additional Comments Block - Balanced height ~255px */}
        <div className="space-y-1 pt-1">
          <div className="font-bold text-center text-sm">ความคิดเห็นเพิ่มเติมของครูประจำชั้น</div>
          <div className="grid grid-cols-2 border border-black min-h-[255px]">
            {/* Term 1 Box */}
            <div className="border-r border-black p-3 flex flex-col justify-between">
              <div className="font-bold text-center border-b border-black pb-1 mb-2 text-sm">
                ภาคเรียนที่ ๑
              </div>
              {isManualEditMode ? (
                <textarea
                  value={customTeacherComments.term1}
                  onChange={(e) =>
                    setCustomTeacherComments((prev) => ({ ...prev, term1: e.target.value }))
                  }
                  placeholder="พิมพ์ความคิดเห็นของครูประจำชั้น..."
                  className="w-full flex-1 p-2.5 text-sm border border-neutral-300 rounded resize-none bg-neutral-50/50 min-h-[180px]"
                  rows={6}
                />
              ) : (
                <div className="text-sm leading-relaxed italic text-neutral-800 flex-1 whitespace-pre-wrap">
                  {customTeacherComments.term1}
                </div>
              )}
            </div>

            {/* Term 2 Box */}
            <div className="p-3 flex flex-col justify-between">
              <div className="font-bold text-center border-b border-black pb-1 mb-2 text-sm">
                ภาคเรียนที่ ๒
              </div>
              {isManualEditMode ? (
                <textarea
                  value={customTeacherComments.term2}
                  onChange={(e) =>
                    setCustomTeacherComments((prev) => ({ ...prev, term2: e.target.value }))
                  }
                  placeholder="พิมพ์ความคิดเห็นของครูประจำชั้น..."
                  className="w-full flex-1 p-2.5 text-sm border border-neutral-300 rounded resize-none bg-neutral-50/50 min-h-[180px]"
                  rows={6}
                />
              ) : (
                <div className="text-sm leading-relaxed italic text-neutral-800 flex-1 whitespace-pre-wrap">
                  {customTeacherComments.term2}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Signature Line - Clear, dignified, fully visible */}
        <div className="pt-3 pb-1 text-center text-sm font-medium">
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

        {/* Edit notice / Save button */}
        {isManualEditMode && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded flex items-center justify-between print:hidden">
            <div className="text-xs text-amber-900 font-medium">
              โหมดแก้ไข: ท่านสามารถพิมพ์ความคิดเห็นเพิ่มเติมของผู้ปกครอง และกดบันทึกลงฐานข้อมูลได้
            </div>
            <Button
              size="sm"
              onClick={() => saveCommentsMutation.mutate()}
              disabled={saveCommentsMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs flex items-center gap-1.5"
            >
              {saveCommentsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              บันทึกความคิดเห็น
            </Button>
          </div>
        )}

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
          ) : customParentComments ? (
            <div className="text-xs leading-relaxed italic text-neutral-800 p-2 min-h-[90px] whitespace-pre-wrap">
              {customParentComments}
            </div>
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
  // ─── 10. PROMOTION SUMMARY (หน้า 10 ในเล่ม - สรุปผลและการตัดสิน) ────
  function renderPromotionSummaryPage() {
    if (!currentStudent) return null;

    const promo = studentYearData?.promotion;
    const rawAttendance = promo?.attendance_percent ?? (studentYearData?.term1?.attendance?.presentPercent || 100);
    const attendancePctThai = toThaiNumerals(rawAttendance);
    const isAttendancePass = rawAttendance >= 80;

    const rawGpa = (promo?.gpa && promo.gpa > 0) ? promo.gpa.toFixed(2) : customRemarks.gpa;
    const gpaDisplay = isTerm1Only ? '-' : (rawGpa ? toThaiNumerals(rawGpa) : '-');

    const charGradeRaw = promo?.character_grade || 'ดีเยี่ยม';
    const charGradeDisplay = charGradeRaw === 'ดย' ? 'ดีเยี่ยม (ดย)' : charGradeRaw;

    const readGradeRaw = promo?.reading_grade || 'ดีเยี่ยม';
    const readGradeDisplay = readGradeRaw === 'ดย' ? 'ดีเยี่ยม (ดย)' : readGradeRaw;

    const actStatusDisplay = promo?.activities_status !== false ? 'ผ่าน (ผ)' : 'ไม่ผ่าน (มผ)';

    const classNum = parseInt(selectedClass.replace(/[^0-9]/g, ''), 10) || 4;
    const nextClassThai = toThaiNumerals(classNum + 1);
    const decisionText = selectedClass === 'ป.6'
      ? 'จบหลักสูตรการศึกษาระดับประถมศึกษา (ศึกษาต่อ ม.๑)'
      : `เลื่อนชั้น (ขึ้นชั้นประถมศึกษาปีที่ ${nextClassThai})`;

    const academicYearThai = toThaiNumerals(academicYear);

    return (
      <div className="space-y-6 text-black text-xs leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-2">
          <div className="w-8 font-bold text-sm">๑๐</div>
          <div className="text-center flex-1 space-y-0.5">
            <h2 className="text-base font-bold">สรุปผลการเรียนและการตัดสินการประเมิน</h2>
            <p className="text-[11px] text-neutral-700">
              โรงเรียนบ้านคำไผ่ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
            </p>
          </div>
          <div className="w-8 text-right font-bold text-sm">ปพ.๖</div>
        </div>

        {/* 6 Criteria List */}
        <div className="border border-black p-4 rounded space-y-3 bg-white">
          <div className="font-bold text-xs text-neutral-900 border-b border-black/40 pb-1.5">
            เกณฑ์การประเมินและการตัดสินผลการเรียนตามหลักสูตรแกนกลางฯ
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-baseline justify-between">
              <span>๑. เวลาเรียนตลอดปีการศึกษา:</span>
              <span className="font-bold text-sm">
                ร้อยละ {attendancePctThai} ({isAttendancePass ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'})
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span>๒. ผลการประเมินรายวิชาตามตัวชี้วัด:</span>
              <span className="font-bold text-emerald-800">
                ผ่านเกณฑ์การประเมินทุกกลุ่มสาระการเรียนรู้
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span>๓. ผลการเรียนเฉลี่ยรวม (GPA):</span>
              <span className="font-bold text-sm font-mono">
                {gpaDisplay}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span>๔. ผลการประเมินคุณลักษณะอันพึงประสงค์:</span>
              <span className="font-bold text-emerald-800">
                {charGradeDisplay}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span>๕. ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน:</span>
              <span className="font-bold text-emerald-800">
                {readGradeDisplay}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span>๖. ผลการประเมินกิจกรรมพัฒนาผู้เรียน:</span>
              <span className="font-bold text-emerald-800">
                {actStatusDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Decision Banner Box */}
        <div className="p-5 border-2 border-black rounded text-center my-6 bg-neutral-50/50 shadow-sm space-y-1.5">
          <div className="font-semibold text-xs text-neutral-700">
            ผลการตัดสินประจำปีการศึกษา {academicYearThai}
          </div>
          <div className="text-lg sm:text-xl font-bold text-neutral-900">
            {decisionText}
          </div>
        </div>

        {/* 3 Signatures */}
        <div className="grid grid-cols-3 gap-3 pt-8 text-center text-xs">
          {/* Homeroom Teacher */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-full text-center">ลงชื่อ ....................................................</div>
            <div className="font-semibold text-[11px]">({homeroomTeacher?.name || 'ครูประจำชั้น'})</div>
            <div className="text-neutral-700 font-medium text-[11px]">ครูประจำชั้น</div>
          </div>

          {/* Registrar */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-full text-center">ลงชื่อ ....................................................</div>
            <div className="font-semibold text-[11px]">( .................................................... )</div>
            <div className="text-neutral-700 font-medium text-[11px]">นายทะเบียน</div>
          </div>

          {/* Director */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-full text-center">ลงชื่อ ....................................................</div>
            <div className="font-semibold text-[11px]">( นายสมพิศ แรงน้อย )</div>
            <div className="text-neutral-700 font-medium text-[11px]">ผู้อำนวยการโรงเรียนบ้านคำไผ่</div>
          </div>
        </div>
      </div>
    );
  }
};

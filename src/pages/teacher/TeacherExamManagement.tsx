/**
 * TeacherExamManagement.tsx
 * ระบบบริหารจัดการข้อสอบ คลังข้อสอบ และการตรวจ OMR สำหรับครูและบุคลากร
 * รองรับ: AI ออกข้อสอบ, คลังข้อสอบ, จัดชุดข้อสอบ, พิมพ์ A4/OMR, สแกนด้วยกล้องมือถือ, และรายงานผลสอบ
 */
import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Camera, Printer, BarChart3, Trash2, CheckCircle2,
  Sparkles, CheckSquare, RefreshCw, Download, Layers, UserCheck,
  Shuffle, Eye, ListFilter, CheckCheck, Clock, Pencil, Zap, AlertTriangle, AlertCircle, X, PlusCircle,
  Lightbulb, Filter, FileText, FileSpreadsheet, Split, Target, Brain, PenLine, Image as ImageIcon, XCircle
} from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from './teacher-menu';
import {
  examService,
  type ExamSetRow,
  type ExamSubmissionRow,
  type QuestionType,
  type QuestionDifficulty,
  type BloomLevel,
  type EssayRubric
} from '@/services/exam.service';
import { curriculumService, type CurriculumIndicator } from '@/services/curriculum.service';
import { studentsService } from '@/services/students.service';
import { omrScannerService, type OMRGradingSummary, type QuestionToGrade } from '@/services/omr-scanner.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { PrintableExamPaper } from '@/components/exam/PrintableExamPaper';
import { PrintableOMRSheet } from '@/components/exam/PrintableOMRSheet';
import { ExamAnswerKeyMatrix } from '@/components/exam/ExamAnswerKeyMatrix';
import { ExamItemAnalysisView } from '@/components/exam/ExamItemAnalysisView';
import { ExamStudentDiagnosticModal } from '@/components/exam/ExamStudentDiagnosticModal';
import { ExamClassCompetencyView } from '@/components/exam/ExamClassCompetencyView';
import { BatchOMRScannerModal } from '@/components/exam/BatchOMRScannerModal';
import { downloadExamDocx } from '@/lib/docx/examDocxGenerator';
import { exportExamResultsToExcel } from '@/lib/excel/examExcelGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/export';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

interface AIParsedQuestion {
  question_type?: 'mcq' | 'fillin' | 'essay';
  question_text: string;
  options?: string[];
  answer: number | string;
  accepted_answers?: string[];
  rubric?: EssayRubric;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  bloom_level?: BloomLevel;
  indicator_code?: string;
  topic?: string;
}

export interface SubjectConfigItem {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  badgeClass: string;
  activeColor: string;
  suggestedTopics: string[];
}

export const SUBJECT_MAP: Record<string, SubjectConfigItem> = {
  'คณิตศาสตร์': {
    id: 'math',
    name: 'คณิตศาสตร์',
    icon: '📐',
    colorClass: 'border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300/60',
    activeColor: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    suggestedTopics: ['เศษส่วน', 'ทศนิยม', 'การบวก ลบ คูณ หารระคน', 'เรขาคณิตและมุม', 'สมการอย่างง่าย', 'การหารยาว'],
  },
  'ภาษาไทย': {
    id: 'thai',
    name: 'ภาษาไทย',
    icon: '📖',
    colorClass: 'border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100/60',
    badgeClass: 'bg-amber-500/10 text-amber-800 border-amber-300/60',
    activeColor: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    suggestedTopics: ['สำนวนและสุภาษิตไทย', 'คำราชาศัพท์', 'มาตราตัวสะกด', 'คำควบกล้ำและอักษรนำ', 'การอ่านจับใจความ'],
  },
  'วิทยาศาสตร์': {
    id: 'science',
    name: 'วิทยาศาสตร์',
    icon: '🔬',
    colorClass: 'border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60',
    badgeClass: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60',
    activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    suggestedTopics: ['ระบบสุริยะและดวงดาว', 'สถานะของสาร', 'วงจรไฟฟ้าอย่างง่าย', 'ห่วงโซ่อาหารและสิ่งแวดล้อม', 'แรงและการเคลื่อนที่'],
  },
  'ภาษาอังกฤษ': {
    id: 'english',
    name: 'ภาษาอังกฤษ',
    icon: '🔤',
    colorClass: 'border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60',
    badgeClass: 'bg-indigo-500/10 text-indigo-800 border-indigo-300/60',
    activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
    suggestedTopics: ['Present Simple vs Continuous', 'Past Simple Tense', 'Daily Vocabulary', 'Classroom Expressions', 'Reading Comprehension'],
  },
  'สังคมศึกษา': {
    id: 'social',
    name: 'สังคมศึกษา',
    icon: '🌏',
    colorClass: 'border-teal-300 text-teal-700 bg-teal-50/50 hover:bg-teal-100/60',
    badgeClass: 'bg-teal-500/10 text-teal-800 border-teal-300/60',
    activeColor: 'bg-teal-600 text-white border-teal-600 shadow-sm',
    suggestedTopics: ['ศาสนา ศีลธรรม และวันสำคัญ', 'หน้าที่พลเมืองและกฎหมาย', 'เศรษฐศาสตร์ในชีวิตประจำวัน', 'ภูมิศาสตร์และแผนที่'],
  },
  'ประวัติศาสตร์': {
    id: 'history',
    name: 'ประวัติศาสตร์',
    icon: '📜',
    colorClass: 'border-orange-300 text-orange-700 bg-orange-50/50 hover:bg-orange-100/60',
    badgeClass: 'bg-orange-500/10 text-orange-800 border-orange-300/60',
    activeColor: 'bg-orange-600 text-white border-orange-600 shadow-sm',
    suggestedTopics: ['ยุคสมัยทางประวัติศาสตร์ไทย', 'อาณาจักรสุโขทัยและอยุธยา', 'บุคคลสำคัญของชาติ', 'แหล่งอารยธรรมท้องถิ่น'],
  },
  'สุขศึกษา': {
    id: 'health',
    name: 'สุขศึกษา',
    icon: '🏃',
    colorClass: 'border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60',
    badgeClass: 'bg-rose-500/10 text-rose-800 border-rose-300/60',
    activeColor: 'bg-rose-600 text-white border-rose-600 shadow-sm',
    suggestedTopics: ['การเจริญเติบโตของร่างกาย', 'สุขอนามัยส่วนบุคคล', 'อาหารหลัก 5 หมู่และโภชนาการ', 'การปฐมพยาบาลเบื้องต้น'],
  },
  'ศิลปะ': {
    id: 'art',
    name: 'ศิลปะ',
    icon: '🎨',
    colorClass: 'border-pink-300 text-pink-700 bg-pink-50/50 hover:bg-pink-100/60',
    badgeClass: 'bg-pink-500/10 text-pink-800 border-pink-300/60',
    activeColor: 'bg-pink-600 text-white border-pink-600 shadow-sm',
    suggestedTopics: ['ทัศนศิลป์และสีคู่ตรงข้าม', 'เครื่องดนตรีไทยและสากล', 'นาฏศิลป์ไทยและการละเล่น', 'รูปทรงและงานปั้น'],
  },
  'การงานอาชีพ': {
    id: 'career',
    name: 'การงานอาชีพ',
    icon: '🛠️',
    colorClass: 'border-cyan-300 text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100/60',
    badgeClass: 'bg-cyan-500/10 text-cyan-800 border-cyan-300/60',
    activeColor: 'bg-cyan-600 text-white border-cyan-600 shadow-sm',
    suggestedTopics: ['การดูแลรักษาของใช้ส่วนตัว', 'งานเกษตรและการปลูกผักสวนครัว', 'งานประดิษฐ์จากวัสดุเหลือใช้', 'ความปลอดภัยในการทำงานช่าง'],
  },
  'ต้านทุจริต': {
    id: 'anti-corruption',
    name: 'ต้านทุจริต',
    icon: '⚖️',
    colorClass: 'border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-100/60',
    badgeClass: 'bg-slate-500/10 text-slate-800 border-slate-300/60',
    activeColor: 'bg-slate-700 text-white border-slate-700 shadow-sm',
    suggestedTopics: ['ความซื่อสัตย์สุจริต', 'ประโยชน์ส่วนตนและประโยชน์ส่วนรวม', 'จิตพอเพียงต้านทุจริต', 'ความละอายต่อการทุจริต'],
  },
};

const SUBJECT_LIST = Object.keys(SUBJECT_MAP);

const GRADE_LIST = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function TeacherExamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'bank' | 'sets' | 'print' | 'scanner' | 'results'>('bank');

  // Filter states: Default to first subject (คณิตศาสตร์) for clean subject separation
  const [selectedSubject, setSelectedSubject] = useState<string>('คณิตศาสตร์');
  const [targetSubject, setTargetSubject] = useState<string>('คณิตศาสตร์');
  const [selectedGrade, setSelectedGrade] = useState<string>('ป.4');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Question Type & Indicator Filter state for Bank
  const [selectedQTypeFilter, setSelectedQTypeFilter] = useState<'all' | 'mcq' | 'fillin' | 'essay'>('all');
  const [selectedIndicatorFilter, setSelectedIndicatorFilter] = useState<string>('all');

  // AI Generator expanded state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiBloom, setAiBloom] = useState<string>('auto');
  const [aiQuestionFormat, setAiQuestionFormat] = useState<'mixed' | 'mcq' | 'fillin' | 'essay'>('mixed');
  const [aiIndicatorCode, setAiIndicatorCode] = useState<string>('all');
  const [aiSelectedMediaId, setAiSelectedMediaId] = useState<string>('none');

  // Manual Question expanded state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQType, setNewQType] = useState<QuestionType>('mcq');
  const [newQDifficulty, setNewQDifficulty] = useState<QuestionDifficulty>('medium');
  const [newQBloom, setNewQBloom] = useState<BloomLevel>('L2');
  const [newQIndicatorCode, setNewQIndicatorCode] = useState<string>('');
  const [newQIndicatorDesc, setNewQIndicatorDesc] = useState<string>('');
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQAns, setNewQAns] = useState<number>(0);
  const [newQFillinAns, setNewQFillinAns] = useState<string>('');
  const [newQAcceptedAlts, setNewQAcceptedAlts] = useState<string>('');
  const [newQEssayScore, setNewQEssayScore] = useState<number>(5);
  const [newQEssayKeySol, setNewQEssayKeySol] = useState<string>('');
  const [newQEssayKeywords, setNewQEssayKeywords] = useState<string>('');
  const [newQMediaId, setNewQMediaId] = useState<string>('none');
  const [newQImageUrl, setNewQImageUrl] = useState<string>('');
  const [newQImageTitle, setNewQImageTitle] = useState<string>('');

  // Target question count states
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(20);
  const [isCustomTarget, setIsCustomTarget] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>('20');

  // Editing existing set state
  const [editingExamSetId, setEditingExamSetId] = useState<string | null>(null);
  const [deleteSetConfirmId, setDeleteSetConfirmId] = useState<string | null>(null);
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState<boolean>(false);
  const [customQuestionsCache, setCustomQuestionsCache] = useState<Record<string, any>>({});

  // Selected questions for building set
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [showCartReview, setShowCartReview] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetTime, setNewSetTime] = useState(60);
  const [newSetPin, setNewSetPin] = useState('');

  // Print Preview state
  const [previewExamSet, setPreviewExamSet] = useState<ExamSetRow | null>(null);
  const [printMode, setPrintMode] = useState<'paper' | 'omr'>('paper');
  const [printVersion, setPrintVersion] = useState<'A' | 'B' | 'key'>('A');

  // Results & Item Analysis view state
  const [resultsViewMode, setResultsViewMode] = useState<'list' | 'analysis' | 'competency'>('list');
  const [selectedAnalysisSetId, setSelectedAnalysisSetId] = useState<string>('');

  // Diagnostic & Batch Scanner state
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [diagnosticSubmission, setDiagnosticSubmission] = useState<ExamSubmissionRow | null>(null);
  const [diagnosticExamSet, setDiagnosticExamSet] = useState<ExamSetRow | null>(null);
  const [batchScannerOpen, setBatchScannerOpen] = useState(false);

  // Essay Grading Dialog state
  const [essayGradingModalOpen, setEssayGradingModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmissionRow | null>(null);
  const [gradingExamSet, setGradingExamSet] = useState<ExamSetRow | null>(null);
  const [essayScores, setEssayScores] = useState<Record<number, number>>({});
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [isSavingGrading, setIsSavingGrading] = useState(false);

  // OMR Scanner state
  const [scannerExamSetId, setScannerExamSetId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzingOMR, setAnalyzingOMR] = useState(false);
  const [omrSummary, setOmrSummary] = useState<OMRGradingSummary | null>(null);
  const [scannedStudentNo, setScannedStudentNo] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [omrStudentClass, setOmrStudentClass] = useState<string>('ป.4');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // ── Queries ──
  const { data: questions = [], isLoading: loadingQ } = useQuery({
    queryKey: ['exam_questions', selectedSubject, selectedGrade, searchQuery],
    queryFn: () =>
      examService.listQuestions({
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        grade: selectedGrade !== 'all' ? selectedGrade : undefined,
        search: searchQuery || undefined,
      }),
  });

  // Query live question counts for each subject in current grade
  const { data: subjectCounts = {} } = useQuery({
    queryKey: ['exam_subject_counts', selectedGrade],
    queryFn: () => examService.getQuestionCountsBySubject(selectedGrade),
  });

  const selectedSubjectConfig = selectedSubject !== 'all' ? SUBJECT_MAP[selectedSubject] : null;

  // Query curriculum indicators for current subject and grade
  const currentSubjectKey = selectedSubjectConfig?.id || '';
  const { data: curriculumIndicators = [] } = useQuery({
    queryKey: ['curriculum_indicators', currentSubjectKey, selectedGrade],
    queryFn: async () => {
      if (!currentSubjectKey || selectedGrade === 'all') return [];
      const { data, error } = await curriculumService.listIndicators(currentSubjectKey, selectedGrade);
      if (error) throw error;
      return (data || []) as CurriculumIndicator[];
    },
    enabled: !!currentSubjectKey && selectedGrade !== 'all',
  });

  // Query educational hub media items for reference in exams
  const { data: mediaItems = [] } = useQuery({
    queryKey: ['exam_media_items', selectedSubject, selectedGrade],
    queryFn: () => examService.listMediaForExam(selectedSubject, selectedGrade),
    enabled: selectedSubject !== 'all',
  });

  // Extract unique topics for filter
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Extract unique indicators from questions for filter
  const availableIndicatorsInQuestions = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((q) => {
      if (q.indicator_code) {
        map.set(q.indicator_code, q.indicator_desc || q.indicator_code);
      }
    });
    return Array.from(map.entries()).map(([code, desc]) => ({ code, desc }));
  }, [questions]);

  // Filter questions by topic, question type, and indicator
  const displayedQuestions = useMemo(() => {
    let result = questions;
    if (selectedTopic !== 'all') {
      result = result.filter((q) => q.topic === selectedTopic);
    }
    if (selectedQTypeFilter !== 'all') {
      result = result.filter((q) => (q.question_type || 'mcq') === selectedQTypeFilter);
    }
    if (selectedIndicatorFilter !== 'all') {
      result = result.filter((q) => q.indicator_code === selectedIndicatorFilter);
    }
    return result;
  }, [questions, selectedTopic, selectedQTypeFilter, selectedIndicatorFilter]);

  // Selected questions details & difficulty breakdown
  const selectedQuestionsDetails = useMemo(() => {
    return questions.filter((q) => selectedQIds.includes(q.id));
  }, [questions, selectedQIds]);

  // Cross-subject detection and breakdown
  const selectedSubjectsBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedQuestionsDetails.forEach((q) => {
      const subj = q.subject || 'ไม่ระบุ';
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [selectedQuestionsDetails]);

  const uniqueSelectedSubjects = useMemo(() => Object.keys(selectedSubjectsBreakdown), [selectedSubjectsBreakdown]);
  const isCrossSubject = uniqueSelectedSubjects.length > 1;

  const handleKeepOnlySubject = (subjToKeep: string) => {
    const filteredIds = selectedQuestionsDetails
      .filter((q) => q.subject === subjToKeep)
      .map((q) => q.id);
    setSelectedQIds(filteredIds);
    setTargetSubject(subjToKeep);
    setNewSetTitle(`แบบทดสอบวิชา${subjToKeep} ${selectedGrade} (${filteredIds.length} ข้อ)`);
    toast({
      title: `กรองเก็บเฉพาะวิชา ${subjToKeep}`,
      description: `ตัดข้อสอบวิชาอื่นออกแล้ว เหลือข้อสอบวิชา ${subjToKeep} จำนวน ${filteredIds.length} ข้อ`,
    });
  };

  const difficultyStats = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    selectedQuestionsDetails.forEach((q) => {
      if (q.difficulty in counts) {
        counts[q.difficulty as keyof typeof counts]++;
      } else {
        counts.medium++;
      }
    });
    return counts;
  }, [selectedQuestionsDetails]);

  // Filter change handlers that reset topic
  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    setSelectedTopic('all');
    if (val !== 'all') {
      setTargetSubject(val);
    }
  };

  const handleGradeChange = (val: string) => {
    setSelectedGrade(val);
    setSelectedTopic('all');
  };

  // Bulk selection actions
  const handleSelectAll = () => {
    const displayedIds = displayedQuestions.map((q) => q.id);
    const union = Array.from(new Set([...selectedQIds, ...displayedIds]));
    setSelectedQIds(union);
    const activeSubj = selectedSubject !== 'all' ? selectedSubject : targetSubject || 'ทั่วไป';
    setTargetSubject(activeSubj);
    if (!newSetTitle) {
      setNewSetTitle(`แบบทดสอบวิชา${activeSubj} ${selectedGrade} (${union.length} ข้อ)`);
    }
    toast({
      title: `เลือกข้อสอบทั้งหมดในวิชา ${activeSubj}`,
      description: `เพิ่มข้อสอบ ${displayedIds.length} ข้อเข้าชุดแล้ว (รวมทั้งหมด ${union.length} ข้อ)`,
    });
  };

  const handleDeselectAll = () => {
    const displayedIds = new Set(displayedQuestions.map((q) => q.id));
    setSelectedQIds(selectedQIds.filter((id) => !displayedIds.has(id)));
    toast({
      title: 'ยกเลิกการเลือก',
      description: 'นำข้อสอบในหน้านี้ออกจากชุดข้อสอบแล้ว',
    });
  };

  const handleTargetCountSelect = (count: number) => {
    setTargetQuestionCount(count);
    setIsCustomTarget(false);
    setCustomTargetInput(String(count));
  };

  const handleCustomTargetApply = () => {
    const val = parseInt(customTargetInput, 10);
    if (!isNaN(val) && val > 0 && val <= 100) {
      setTargetQuestionCount(val);
      toast({
        title: `ตั้งเป้าหมาย ${val} ข้อ`,
        description: `ชุดข้อสอบนี้มีเป้าหมายจำนวน ${val} ข้อ`,
      });
    } else {
      toast({
        title: 'จำนวนข้อไม่ถูกต้อง',
        description: 'กรุณาระบุจำนวนข้อระหว่าง 1 ถึง 100 ข้อ',
        variant: 'destructive',
      });
    }
  };

  const handleRandomSelect = (count: number) => {
    setTargetQuestionCount(count);
    setIsCustomTarget(false);
    setCustomTargetInput(String(count));

    const pool = [...displayedQuestions];
    if (pool.length === 0) {
      toast({
        title: 'ไม่มีข้อสอบให้สุ่ม',
        description: `ไม่พบข้อสอบในวิชา ${selectedSubject} ระดับชั้น ${selectedGrade}`,
        variant: 'destructive',
      });
      return;
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, Math.min(count, pool.length));
    const pickedIds = picked.map((q) => q.id);
    setSelectedQIds(pickedIds);

    // Cache picked question objects
    const cacheUpdate: Record<string, any> = {};
    picked.forEach((q) => { cacheUpdate[q.id] = q; });
    setCustomQuestionsCache((prev) => ({ ...prev, ...cacheUpdate }));

    const activeSubj = selectedSubject !== 'all' ? selectedSubject : targetSubject || 'ทั่วไป';
    setTargetSubject(activeSubj);
    setNewSetTitle(`แบบทดสอบวิชา${activeSubj} ${selectedGrade} (${picked.length} ข้อ)`);
    toast({
      title: `สุ่มเลือก ${picked.length} ข้อสำเร็จ!`,
      description: `ระบบเลือกข้อสอบวิชา ${activeSubj} สุ่มจำนวน ${picked.length} ข้อลงในชุดเรียบร้อยแล้ว`,
    });
  };

  // Smart Auto-Fill Remaining to reach targetQuestionCount
  const handleFillRemaining = () => {
    const currentCount = selectedQIds.length;
    const needed = targetQuestionCount - currentCount;

    if (needed <= 0) {
      toast({
        title: 'ข้อสอบครบตามเป้าหมายแล้ว',
        description: `เลือกไว้ ${currentCount} ข้อ (เป้าหมาย ${targetQuestionCount} ข้อ)`,
      });
      return;
    }

    // Try finding unselected from displayedQuestions first
    let pool = displayedQuestions.filter((q) => !selectedQIds.includes(q.id));

    // If not enough in displayedQuestions (e.g. topic filter is active), fallback to all subject/grade questions
    if (pool.length < needed) {
      const morePool = questions.filter((q) => !selectedQIds.includes(q.id) && !pool.some((p) => p.id === q.id));
      pool = [...pool, ...morePool];
    }

    if (pool.length === 0) {
      toast({
        title: 'ไม่มีข้อสอบอื่นให้สุ่มเติม',
        description: 'กรุณาปลดตัวกรองหัวข้อหรือเปลี่ยนระดับชั้นเพื่อเลือกข้อสอบเพิ่มเติม',
        variant: 'destructive',
      });
      return;
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const picked = pool.slice(0, needed);
    const pickedIds = picked.map((q) => q.id);
    const updatedIds = [...selectedQIds, ...pickedIds];
    setSelectedQIds(updatedIds);

    // Update custom cache
    const cacheUpdate: Record<string, any> = {};
    picked.forEach((q) => { cacheUpdate[q.id] = q; });
    setCustomQuestionsCache((prev) => ({ ...prev, ...cacheUpdate }));

    if (!newSetTitle || newSetTitle.startsWith('แบบทดสอบ')) {
      setNewSetTitle(`แบบทดสอบ${selectedSubject !== 'all' ? selectedSubject : ''} ${selectedGrade} (${updatedIds.length} ข้อ)`);
    }

    toast({
      title: `⚡ สุ่มเติมเพิ่ม ${picked.length} ข้อสำเร็จ!`,
      description: `ชุดข้อสอบมีทั้งหมด ${updatedIds.length} / ${targetQuestionCount} ข้อตามเป้าหมายแล้ว`,
    });
  };

  // Start editing existing exam set
  const handleStartEditSet = (set: ExamSetRow) => {
    setEditingExamSetId(set.id);
    setNewSetTitle(set.title);
    setNewSetTime(set.time_limit_minutes || 60);
    setNewSetPin(set.pin_code || '');
    if (set.subject) {
      if (SUBJECT_LIST.includes(set.subject)) setSelectedSubject(set.subject);
      setTargetSubject(set.subject);
    }
    if (set.grade && GRADE_LIST.includes(set.grade)) setSelectedGrade(set.grade);

    const existingQuestions = Array.isArray(set.questions) ? (set.questions as Array<any>) : [];
    const ids = existingQuestions.map((q) => (typeof q === 'string' ? q : q?.id)).filter(Boolean) as string[];

    // Save existing question objects to cache so they aren't lost across filters
    const cacheUpdate: Record<string, any> = {};
    existingQuestions.forEach((q) => {
      if (q && typeof q === 'object' && q.id) {
        cacheUpdate[q.id] = q;
      }
    });
    setCustomQuestionsCache((prev) => ({ ...prev, ...cacheUpdate }));

    setSelectedQIds(ids);
    setTargetQuestionCount(Math.max(ids.length > 0 ? ids.length : 20, 20));
    setCustomTargetInput(String(Math.max(ids.length > 0 ? ids.length : 20, 20)));
    setActiveTab('bank');

    toast({
      title: `✏️ กำลังแก้ไข: ${set.title}`,
      description: `โหลดข้อสอบเดิม ${ids.length} ข้อเข้าตะกร้าแล้ว สามารถเลือกเพิ่มหรือสุ่มเติมให้ครบได้ทันที`,
    });
  };

  const handleCancelEdit = () => {
    setEditingExamSetId(null);
    setSelectedQIds([]);
    setNewSetTitle('');
    setNewSetPin('');
    toast({
      title: 'ยกเลิกการแก้ไข',
      description: 'ออกจากโหมดแก้ไขชุดข้อสอบแล้ว',
    });
  };

  const { data: examSets = [], isLoading: loadingSets } = useQuery({
    queryKey: ['exam_sets', selectedSubject, selectedGrade],
    queryFn: () =>
      examService.listExamSets({
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        grade: selectedGrade !== 'all' ? selectedGrade : undefined,
      }),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students_class', omrStudentClass],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(omrStudentClass);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['exam_submissions'],
    queryFn: () => examService.listSubmissions(),
  });

  // กรองเฉพาะชุดข้อสอบที่เปิดใช้งาน (is_active === true) เพื่อไม่ให้ชุดที่ลบ/ยกเลิกแสดงในประวัติ
  const activeExamSets = useMemo(() => examSets.filter((s) => s.is_active), [examSets]);
  const activeExamSetIds = useMemo(() => new Set(activeExamSets.map((s) => s.id)), [activeExamSets]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // ต้องเป็นผลสอบของชุดข้อสอบที่ยังเปิดใช้งานอยู่เท่านั้น
      if (!activeExamSetIds.has(s.exam_set_id)) return false;
      if (selectedAnalysisSetId && s.exam_set_id !== selectedAnalysisSetId) return false;
      return true;
    });
  }, [submissions, activeExamSetIds, selectedAnalysisSetId]);

  // Selected student details
  const matchedStudent = useMemo(() => {
    if (selectedStudentId) {
      return students.find((s) => s.id === selectedStudentId);
    }
    if (scannedStudentNo && students.length) {
      return students.find((s) => s.class_number === scannedStudentNo);
    }
    return null;
  }, [students, selectedStudentId, scannedStudentNo]);

  // ── Mutations ──
  const createQMutation = useMutation({
    mutationFn: examService.createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_questions'] });
      toast({ title: 'สำเร็จ', description: 'บันทึกข้อสอบใหม่เรียบร้อย' });
      setShowAddModal(false);
      setNewQText('');
      setNewQOpts(['', '', '', '']);
      setNewQFillinAns('');
      setNewQAcceptedAlts('');
      setNewQEssayKeySol('');
      setNewQEssayKeywords('');
      setNewQImageUrl('');
      setNewQImageTitle('');
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาด', description: e.message, variant: 'destructive' });
    },
  });

  const handleSaveManualQuestion = () => {
    if (!newQText.trim()) {
      toast({ title: 'กรุณากรอกโจทย์คำถาม', variant: 'destructive' });
      return;
    }

    const matchedInd = newQIndicatorCode && newQIndicatorCode !== 'none'
      ? curriculumIndicators.find((i) => i.indicator_code === newQIndicatorCode)
      : null;

    const matchedMedia = newQMediaId !== 'none'
      ? mediaItems.find((m) => m.id === newQMediaId)
      : null;

    let ansPayload: any = 0;
    let acceptedAltsList: string[] = [];
    let rubricPayload: any = {};

    if (newQType === 'mcq') {
      ansPayload = newQAns;
    } else if (newQType === 'fillin') {
      if (!newQFillinAns.trim()) {
        toast({ title: 'กรุณากรอกคำตอบหลัก', variant: 'destructive' });
        return;
      }
      ansPayload = newQFillinAns.trim();
      acceptedAltsList = newQAcceptedAlts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (newQType === 'essay') {
      if (!newQEssayKeySol.trim()) {
        toast({ title: 'กรุณากรอกแนวคำตอบหรือขั้นตอนวิธีทำ', variant: 'destructive' });
        return;
      }
      ansPayload = newQEssayKeySol.trim();
      const kwList = newQEssayKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      rubricPayload = {
        full_score: newQEssayScore || 5,
        key_solution: newQEssayKeySol.trim(),
        keywords: kwList,
      };
    }

    createQMutation.mutate({
      subject: selectedSubject !== 'all' ? selectedSubject : 'ทั่วไป',
      grade: selectedGrade !== 'all' ? selectedGrade : 'ป.4',
      topic: aiTopic || 'ทั่วไป',
      question_type: newQType,
      difficulty: newQDifficulty,
      bloom_level: newQBloom,
      question_text: newQText.trim(),
      options: newQType === 'mcq' ? newQOpts : [],
      answer: ansPayload,
      accepted_answers: acceptedAltsList,
      rubric: rubricPayload,
      indicator_id: matchedInd?.id || null,
      indicator_code: matchedInd?.indicator_code || null,
      indicator_desc: matchedInd?.description || null,
      media_item_id: matchedMedia?.id || null,
      media_title: newQImageTitle.trim() || (newQImageUrl.trim() ? (matchedMedia?.title || 'ภาพประกอบข้อสอบ') : null),
      media_image_url: newQImageUrl.trim() || null,
    });
  };

  const deleteQMutation = useMutation({
    mutationFn: examService.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_questions'] });
      toast({ title: 'ลบเรียบร้อย', description: 'นำข้อสอบออกจากคลังแล้ว' });
    },
  });

  const createSetMutation = useMutation({
    mutationFn: examService.createExamSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_sets'] });
      toast({ title: 'สร้างชุดข้อสอบสำเร็จ', description: 'สามารถนำไปพิมพ์หรือให้นักเรียนสอบออนไลน์ได้ทันที' });
      setSelectedQIds([]);
      setNewSetTitle('');
      setActiveTab('sets');
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาด', description: e.message, variant: 'destructive' });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<'exam_sets'> }) =>
      examService.updateExamSet(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['exam_sets'] });
      toast({
        title: 'อัปเดตชุดข้อสอบสำเร็จ!',
        description: `บันทึกการแก้ไขชุดข้อสอบ "${updated.title}" เรียบร้อยแล้ว`,
      });
      setEditingExamSetId(null);
      setSelectedQIds([]);
      setNewSetTitle('');
      setNewSetPin('');
      setActiveTab('sets');
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาดในการอัปเดต', description: e.message, variant: 'destructive' });
    },
  });

  const toggleActiveSetMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      examService.updateExamSet(id, { is_active }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['exam_sets'] });
      queryClient.invalidateQueries({ queryKey: ['active_exam_sets'] });
      queryClient.invalidateQueries({ queryKey: ['exam_submissions'] });
      if (!updated.is_active && selectedAnalysisSetId === updated.id) {
        setSelectedAnalysisSetId('');
      }
      toast({
        title: updated.is_active ? 'เปิดรับการสอบสำเร็จ' : 'ยกเลิก/ปิดรับการสอบแล้ว',
        description: `ชุดข้อสอบ "${updated.title}" ${
          updated.is_active
            ? 'พร้อมให้นักเรียนเข้าสอบผ่าน PIN'
            : 'ถูกนำออกจากระบบ PIN และประวัติผลการสอบแล้ว'
        }`,
      });
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาดในการเปลี่ยนสถานะ', description: e.message, variant: 'destructive' });
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: examService.deleteExamSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_sets'] });
      queryClient.invalidateQueries({ queryKey: ['active_exam_sets'] });
      queryClient.invalidateQueries({ queryKey: ['exam_submissions'] });
      if (deleteSetConfirmId === selectedAnalysisSetId) {
        setSelectedAnalysisSetId('');
      }
      if (deleteSetConfirmId === scannerExamSetId) {
        setScannerExamSetId('');
      }
      if (previewExamSet?.id === deleteSetConfirmId) {
        setPreviewExamSet(null);
      }
      toast({ title: 'ลบชุดข้อสอบสำเร็จ', description: 'นำชุดข้อสอบออกจากระบบแล้ว' });
      setDeleteSetConfirmId(null);
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาดในการลบ', description: e.message, variant: 'destructive' });
    },
  });

  const saveSubmissionMutation = useMutation({
    mutationFn: examService.submitExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_submissions'] });
      toast({ title: 'บันทึกคะแนนเรียบร้อย', description: 'ข้อมูลคะแนนถูกบันทึกลงฐานข้อมูลนักเรียนแล้ว' });
      setCapturedImage(null);
      setOmrSummary(null);
    },
    onError: (e: Error) => {
      toast({ title: 'บันทึกคะแนนล้มเหลว', description: e.message, variant: 'destructive' });
    },
  });

  // ── AI Generation Action ──
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({ title: 'กรุณาระบุหัวข้อ', description: 'เช่น ระบบสุริยะ, เศษส่วน, คำราชาศัพท์', variant: 'destructive' });
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        title: 'ไม่พบ Gemini API Key',
        description: 'กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env ของระบบ',
        variant: 'destructive',
      });
      return;
    }

    setAiGenerating(true);
    try {
      // Find selected indicator details if any
      const matchedInd = aiIndicatorCode !== 'all'
        ? curriculumIndicators.find((i) => i.indicator_code === aiIndicatorCode)
        : null;

      // Find selected media details if any
      const matchedMedia = aiSelectedMediaId !== 'none'
        ? mediaItems.find((m) => m.id === aiSelectedMediaId)
        : null;

      let formatInstruction = '';
      if (aiQuestionFormat === 'mcq') {
        formatInstruction = 'รูปแบบคำถาม: ปรนัย 4 ตัวเลือก (ก, ข, ค, ง) ทั้งหมด (question_type: "mcq")';
      } else if (aiQuestionFormat === 'fillin') {
        formatInstruction = 'รูปแบบคำถาม: แบบเติมคำตอบสั้น (question_type: "fillin") ทั้งหมด โดยให้ผู้เรียนคิดวิเคราะห์และตอบเป็นคำสั้นๆ หรือตัวเลข มีคำตอบหลัก และคำตอบสำรองที่ยอมรับได้';
      } else if (aiQuestionFormat === 'essay') {
        formatInstruction = 'รูปแบบคำถาม: แบบอัตนัย แสดงวิธีทำ หรือเขียนอธิบายเหตุผล (question_type: "essay") ทั้งหมด พร้อมแนวคำตอบ/ขั้นตอนวิธีทำ และเกณฑ์การให้คะแนน (Rubric)';
      } else {
        formatInstruction = `รูปแบบคำถาม: แบบผสม (Mixed) 3 รูปแบบ
- ประมาณ 60% เป็น ปรนัย 4 ตัวเลือก (question_type: "mcq")
- ประมาณ 20% เป็น เติมคำตอบสั้น (question_type: "fillin")
- ประมาณ 20% เป็น อัตนัย แสดงวิธีทำหรืออธิบายเหตุผล (question_type: "essay")`;
      }

      let indicatorInstruction = '';
      if (matchedInd) {
        indicatorInstruction = `ตัวชี้วัดหลักสูตรแกนกลางที่ต้องครอบคลุม: ${matchedInd.indicator_code} (${matchedInd.description}) โดยคำถามต้องวัดพฤติกรรมการเรียนรู้ตามมาตรฐานนี้โดยตรง`;
      }

      let mediaInstruction = '';
      if (matchedMedia) {
        mediaInstruction = `สื่อการสอน/เกมอ้างอิงประจำโรงเรียน: "${matchedMedia.title}" (${matchedMedia.description || ''}) โดยให้ดึงบริบท ตัวละคร หรือสถานการณ์จำลองจากสื่อการสอนนี้มาตั้งเป็นโจทย์คำถามเชื่อมโยงกับบทเรียนจริง`;
      }

      const prompt = `คุณคือผู้เชี่ยวชาญการออกข้อสอบและประเมินผลระดับประถมศึกษาของกระทรวงศึกษาธิการไทย
กรุณาสร้างข้อสอบวิชา ${selectedSubject} ระดับชั้น ${selectedGrade}
หัวข้อ: ${aiTopic}
จำนวน: ${aiCount} ข้อ
ระดับความยาก: ${aiDifficulty}
ระดับ Bloom's Taxonomy: ${aiBloom}
${formatInstruction}
${indicatorInstruction}
${mediaInstruction}

ข้อกำหนดโครงสร้าง JSON (ตอบเป็น array ของ object เท่านั้น):
- สำหรับ "mcq":
  {
    "question_type": "mcq",
    "question_text": "โจทย์คำถาม...",
    "options": ["ตัวเลือก ก", "ตัวเลือก ข", "ตัวเลือก ค", "ตัวเลือก ง"],
    "answer": 0, // 0=ก, 1=ข, 2=ค, 3=ง
    "explanation": "คำอธิบายเฉลย...",
    "difficulty": "${aiDifficulty}",
    "bloom_level": "L2",
    "indicator_code": "${matchedInd?.indicator_code || ''}"
  }
- สำหรับ "fillin":
  {
    "question_type": "fillin",
    "question_text": "โจทย์เติมคำถาม... (เว้นช่องให้ตอบ)",
    "options": [],
    "answer": "คำตอบหลัก",
    "accepted_answers": ["คำตอบสำรอง1", "คำตอบสำรอง2"],
    "explanation": "คำอธิบายเฉลย...",
    "difficulty": "${aiDifficulty}",
    "bloom_level": "L2",
    "indicator_code": "${matchedInd?.indicator_code || ''}"
  }
- สำหรับ "essay":
  {
    "question_type": "essay",
    "question_text": "โจทย์อัตนัย / ให้แสดงวิธีทำ / อธิบายเหตุผล...",
    "options": [],
    "answer": "แนวคำตอบและขั้นตอนวิธีทำอย่างละเอียด...",
    "rubric": {
      "full_score": 5,
      "key_solution": "แนวคำตอบหลักหรือขั้นตอนวิธีทำ...",
      "keywords": ["คำสำคัญ1", "คำสำคัญ2"]
    },
    "explanation": "เกณฑ์และแนวทางให้คะแนน...",
    "difficulty": "${aiDifficulty}",
    "bloom_level": "L4",
    "indicator_code": "${matchedInd?.indicator_code || ''}"
  }

ห้ามมี markdown codeblock ส่งเฉพาะ raw JSON string`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI');
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsedItems: AIParsedQuestion[] = JSON.parse(rawText);

      if (!Array.isArray(parsedItems) || !parsedItems.length) {
        throw new Error('AI ส่งผลลัพธ์ไม่ถูกต้อง');
      }

      const rowsToInsert: TablesInsert<'exam_questions'>[] = parsedItems.map((item) => {
        const qType = (item.question_type as any) || (item.options && item.options.length ? 'mcq' : 'fillin');
        const qIndCode = item.indicator_code || matchedInd?.indicator_code || null;
        const qIndDesc = matchedInd?.description || null;

        return {
          subject: selectedSubject,
          grade: selectedGrade,
          topic: aiTopic || item.topic || 'ทั่วไป',
          difficulty: item.difficulty || aiDifficulty,
          bloom_level: item.bloom_level || (aiBloom !== 'auto' ? (aiBloom as any) : 'L2'),
          question_type: qType,
          question_text: item.question_text,
          options: Array.isArray(item.options) ? item.options : [],
          answer: item.answer !== undefined ? (item.answer as any) : 0,
          accepted_answers: Array.isArray(item.accepted_answers) ? item.accepted_answers : [],
          rubric: (item.rubric as any) || (qType === 'essay' ? { full_score: 5, key_solution: String(item.answer || '') } : {}),
          indicator_id: matchedInd?.id || null,
          indicator_code: qIndCode,
          indicator_desc: qIndDesc,
          media_item_id: matchedMedia?.id || null,
          media_title: null,
          media_image_url: null,
          explanation: item.explanation || '',
        };
      });

      await examService.createQuestionsBulk(rowsToInsert);
      queryClient.invalidateQueries({ queryKey: ['exam_questions'] });
      toast({
        title: 'สร้างข้อสอบสำเร็จ!',
        description: `AI สร้างข้อสอบ ${rowsToInsert.length} ข้อ (${aiQuestionFormat === 'mixed' ? 'แบบผสม' : aiQuestionFormat}) ลงในคลังเรียบร้อยแล้ว`,
      });
      setAiTopic('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      toast({ title: 'AI สร้างข้อสอบไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  };

  // ── Camera Scanner Actions ──
  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await omrScannerService.startCamera(videoRef.current);
      cameraStreamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
      setOmrSummary(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      toast({ title: 'ไม่สามารถเปิดกล้องได้', description: msg, variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    omrScannerService.stopCamera(cameraStreamRef.current, videoRef.current);
    cameraStreamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const base64 = omrScannerService.captureFrame(videoRef.current);
    setCapturedImage(base64);
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await omrScannerService.readFileAsBase64(file);
    setCapturedImage(base64);
    stopCamera();
  };

  const runOMRAnalysis = async () => {
    if (!capturedImage) return;
    const targetSet = examSets.find((s) => s.id === scannerExamSetId);
    if (!targetSet) {
      toast({ title: 'กรุณาเลือกชุดข้อสอบ', description: 'ต้องเลือกชุดข้อสอบเพื่อใช้เฉลยในการตรวจ', variant: 'destructive' });
      return;
    }

    const qCount = Array.isArray(targetSet.questions) ? targetSet.questions.length : 10;
    setAnalyzingOMR(true);

    try {
      const res = await omrScannerService.analyzeWithAI(capturedImage, qCount);
      const questionsList = (Array.isArray(targetSet.questions) ? targetSet.questions : []) as QuestionToGrade[];
      const summary = omrScannerService.gradeAnswers(res.answers, questionsList, targetSet.pass_threshold_pct);

      setOmrSummary(summary);
      if (res.detectedStudentNo) {
        setScannedStudentNo(res.detectedStudentNo);
      }
      toast({ title: 'ตรวจเสร็จสิ้น!', description: `ได้ ${summary.correctCount}/${summary.totalQuestions} คะแนน (${summary.percentage}%)` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'การตรวจ OMR ผิดพลาด';
      toast({ title: 'การตรวจ OMR ผิดพลาด', description: msg, variant: 'destructive' });
    } finally {
      setAnalyzingOMR(false);
    }
  };

  const handleSaveScannedResult = () => {
    if (!omrSummary || !scannerExamSetId) return;
    const targetSet = examSets.find((s) => s.id === scannerExamSetId);
    if (!targetSet) return;

    const studentName = matchedStudent ? matchedStudent.name : 'ไม่ระบุชื่อ';
    const studentNo = matchedStudent ? matchedStudent.class_number : scannedStudentNo || 0;

    saveSubmissionMutation.mutate({
      exam_set_id: scannerExamSetId,
      student_id: matchedStudent?.id || null,
      student_name: studentName,
      student_class: omrStudentClass,
      student_no: studentNo,
      submission_mode: 'omr_paper',
      score: omrSummary.correctCount,
      max_score: omrSummary.totalQuestions,
      percentage: omrSummary.percentage,
      passed: omrSummary.passed,
      answers: omrSummary.details.map((d) => d.studentAnswer) as unknown as Json,
      review_status: 'completed',
    });
  };

  // ── Build Exam Set ──
  const handleBuildSet = (forceSave: boolean = false) => {
    if (!newSetTitle.trim()) {
      toast({ title: 'กรุณาระบุชื่อชุดข้อสอบ', variant: 'destructive' });
      return;
    }
    if (!selectedQIds.length) {
      toast({ title: 'กรุณาเลือกข้อสอบอย่างน้อย 1 ข้อ', variant: 'destructive' });
      return;
    }

    if (!forceSave && selectedQIds.length < targetQuestionCount) {
      setShowIncompleteConfirm(true);
      return;
    }

    // Resolve question objects from current questions query or customQuestionsCache
    const setQuestions = selectedQIds.map((id) => {
      const fromCurrent = questions.find((q) => q.id === id);
      if (fromCurrent) return fromCurrent;
      if (customQuestionsCache[id]) return customQuestionsCache[id];
      return null;
    }).filter(Boolean);

    const finalSubject = targetSubject || (selectedSubject !== 'all' ? selectedSubject : 'ทั่วไป');

    if (editingExamSetId) {
      updateSetMutation.mutate({
        id: editingExamSetId,
        data: {
          title: newSetTitle.trim(),
          subject: finalSubject,
          grade: selectedGrade !== 'all' ? selectedGrade : 'ป.4',
          time_limit_minutes: newSetTime,
          pin_code: newSetPin.trim() ? newSetPin.trim().toUpperCase() : null,
          questions: setQuestions as unknown as Json,
        },
      });
    } else {
      createSetMutation.mutate({
        title: newSetTitle.trim(),
        subject: finalSubject,
        grade: selectedGrade !== 'all' ? selectedGrade : 'ป.4',
        time_limit_minutes: newSetTime,
        pass_threshold_pct: 50,
        pin_code: newSetPin.trim() ? newSetPin.trim().toUpperCase() : null,
        questions: setQuestions as unknown as Json,
        is_active: true,
      });
    }
  };

  // Export Results
  const exportCSV = () => {
    if (!filteredSubmissions.length) return;
    const rows = filteredSubmissions.map((s, idx) => ({
      ลำดับ: idx + 1,
      ชื่อนักเรียน: s.student_name,
      ชั้น: s.student_class,
      เลขที่: s.student_no ?? '-',
      คะแนน: s.score,
      คะแนนเต็ม: s.max_score,
      ร้อยละ: `${s.percentage}%`,
      ผลการสอบ: s.passed ? 'ผ่าน' : 'ไม่ผ่าน',
      รูปแบบ: s.submission_mode === 'online' ? 'ออนไลน์' : 'กระดาษ OMR',
      วันที่สอบ: new Date(s.created_at).toLocaleString('th-TH'),
    }));
    downloadCSV(rows, `ผลการสอบ_โรงเรียนบ้านคำไผ่_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPpor5 = () => {
    const targetSet = activeExamSets.find((s) => s.id === selectedAnalysisSetId) || (activeExamSets.length ? activeExamSets[0] : null);
    if (!targetSet) {
      toast({ title: 'ไม่พบชุดข้อสอบ', description: 'กรุณาเลือกหรือสร้างชุดข้อสอบก่อนส่งออก', variant: 'destructive' });
      return;
    }
    const targetSubmissions = selectedAnalysisSetId
      ? filteredSubmissions.filter((s) => s.exam_set_id === selectedAnalysisSetId)
      : filteredSubmissions;

    exportExamResultsToExcel(targetSet, targetSubmissions);
    toast({ title: 'ส่งออกสำเร็จ', description: 'ดาวน์โหลดไฟล์แบบบันทึกคะแนน ปพ.5 (.xlsx) เรียบร้อย' });
  };

  const handleSaveBatchSubmissions = async (
    submissionsList: {
      exam_set_id: string;
      student_id: string | null;
      student_name: string;
      student_class: string;
      student_no: number;
      submission_mode: 'omr_paper';
      score: number;
      max_score: number;
      percentage: number;
      passed: boolean;
      answers: unknown;
    }[]
  ) => {
    for (const sub of submissionsList) {
      await examService.submitExam(sub as unknown as TablesInsert<'exam_submissions'>);
    }
    queryClient.invalidateQueries({ queryKey: ['exam_submissions'] });
  };

  const handleOpenEssayGrading = (sub: ExamSubmissionRow) => {
    const foundSet = examSets.find((s) => s.id === sub.exam_set_id);
    if (!foundSet) {
      toast({ title: 'ไม่พบชุดข้อสอบ', description: 'ไม่พบชุดข้อสอบที่ตรงกับการสอบนี้', variant: 'destructive' });
      return;
    }
    setGradingSubmission(sub);
    setGradingExamSet(foundSet);

    // Initialize existing scores if any
    const existingRubric = (sub.rubric_scores as Record<string, number>) || {};
    const initialScores: Record<number, number> = {};
    const questionsList = (Array.isArray(foundSet.questions) ? foundSet.questions : []) as any[];
    questionsList.forEach((q, idx) => {
      if (q.question_type === 'essay') {
        initialScores[idx] = existingRubric[idx] !== undefined ? Number(existingRubric[idx]) : 0;
      }
    });

    setEssayScores(initialScores);
    setTeacherFeedback(sub.teacher_feedback || '');
    setEssayGradingModalOpen(true);
  };

  const handleSaveEssayGrading = async () => {
    if (!gradingSubmission || !gradingExamSet) return;
    setIsSavingGrading(true);
    try {
      const questionsList = (Array.isArray(gradingExamSet.questions) ? gradingExamSet.questions : []) as any[];
      const studentAnswers = (gradingSubmission.answers as Record<string, any>) || {};

      const normalize = (v: unknown) =>
        String(v ?? '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ');

      let totalEarned = 0;
      let totalMax = 0;

      questionsList.forEach((q, idx) => {
        const qType = q.question_type || 'mcq';
        const points = Number(q.points) > 0 ? Number(q.points) : (qType === 'essay' ? 5 : 1);
        totalMax += points;

        if (qType === 'essay') {
          const awarded = Number(essayScores[idx]) || 0;
          totalEarned += Math.min(points, Math.max(0, awarded));
        } else if (qType === 'fillin') {
          const ans = studentAnswers[idx];
          if (ans !== undefined && ans !== null) {
            const normUser = normalize(ans);
            const acceptedList: string[] = [];
            if (q.answer !== undefined && q.answer !== null) acceptedList.push(normalize(q.answer));
            if (Array.isArray(q.accepted_answers)) {
              q.accepted_answers.forEach((a: string) => acceptedList.push(normalize(a)));
            }
            if (acceptedList.some((acc) => acc && acc === normUser)) {
              totalEarned += points;
            }
          }
        } else {
          // mcq
          const ans = studentAnswers[idx];
          if (
            ans !== undefined &&
            ans !== null &&
            q.answer !== undefined &&
            q.answer !== null &&
            Number(ans) === Number(q.answer)
          ) {
            totalEarned += points;
          }
        }
      });

      const maxScore = totalMax || gradingSubmission.max_score || 1;
      const percentage = Math.round((totalEarned / maxScore) * 100);
      const passed = percentage >= (gradingExamSet.pass_threshold_pct || 50);

      await examService.updateSubmission(gradingSubmission.id, {
        score: totalEarned,
        max_score: maxScore,
        percentage,
        passed,
        review_status: 'reviewed',
        rubric_scores: essayScores as unknown as Json,
        teacher_feedback: teacherFeedback.trim() || null,
      });

      queryClient.invalidateQueries({ queryKey: ['exam_submissions'] });
      toast({
        title: 'บันทึกการตรวจข้อสอบสำเร็จ',
        description: `บันทึกคะแนนรวม ${totalEarned}/${maxScore} (${percentage}%) เรียบร้อยแล้ว`,
      });
      setEssayGradingModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingGrading(false);
    }
  };

  return (
    <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={TEACHER_MENU} accent="teacher">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Title Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <CheckSquare className="h-6 w-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ระบบจัดการข้อสอบ (Exam System)</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              ออกข้อสอบด้วย AI · จัดคลังข้อสอบ · พิมพ์ข้อสอบ A4/OMR · ตรวจกระดาษคำตอบด้วยกล้องมือถือ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="ทุกวิชา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกวิชา</SelectItem>
                {SUBJECT_LIST.map((subj) => (
                  <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGrade} onValueChange={handleGradeChange}>
              <SelectTrigger className="w-[100px] h-9 text-xs">
                <SelectValue placeholder="ทุกชั้น" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกชั้น</SelectItem>
                {GRADE_LIST.map((gr) => (
                  <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bank' | 'sets' | 'print' | 'scanner' | 'results')}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto h-11 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="bank" className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              คลังข้อสอบ
            </TabsTrigger>
            <TabsTrigger value="sets" className="text-xs font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              ชุดข้อสอบ
            </TabsTrigger>
            <TabsTrigger value="print" className="text-xs font-semibold flex items-center gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ A4/OMR
            </TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 font-bold">
              <Camera className="h-3.5 w-3.5" />
              สแกน OMR
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              ผลการสอบ
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: คลังข้อสอบ & AI Generator
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="bank" className="space-y-6 mt-6">
            {/* ─── Subject Navigation Hub (แถบเลือกกลุ่มสาระการเรียนรู้) ─── */}
            <div className="space-y-3 p-4 bg-card border border-border rounded-2xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    เลือกกลุ่มสาระการเรียนรู้ / รายวิชา
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    แยกคลังข้อสอบตามวิชาอย่างเด็ดขาด คลิกเลือกวิชาเพื่อดูข้อสอบและจัดชุดข้อสอบโดยไม่ปะปนกัน
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">ระดับชั้น:</span>
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                    {GRADE_LIST.map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => handleGradeChange(gr)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          selectedGrade === gr
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                        }`}
                      >
                        {gr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                {SUBJECT_LIST.map((subj) => {
                  const cfg = SUBJECT_MAP[subj];
                  const isSelected = selectedSubject === subj;
                  const count = subjectCounts[subj] || 0;

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => handleSubjectChange(subj)}
                      className={`flex items-center justify-between p-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                        isSelected
                          ? `${cfg.activeColor} ring-2 ring-primary/20 scale-[1.02]`
                          : `${cfg.colorClass} border-border/80 bg-card`
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base leading-none shrink-0">{cfg.icon}</span>
                        <span className="truncate">{subj}</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Active Subject Banner ─── */}
            {selectedSubjectConfig && (
              <div className="p-4 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-2xl flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                    {selectedSubjectConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-foreground">
                        คลังข้อสอบวิชา{selectedSubject} ({selectedGrade})
                      </h2>
                      <Badge className={selectedSubjectConfig.badgeClass}>
                        {questions.length} ข้อในระบบ
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      แสดงเฉพาะข้อสอบวิชา{selectedSubject} ระดับชั้น {selectedGrade} ไม่ปะปนกับวิชาอื่น
                    </p>
                  </div>
                </div>

                {/* Quick actions for this subject */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRandomSelect(targetQuestionCount)}
                    className="h-8 text-xs gap-1.5 shadow-xs bg-primary hover:bg-primary/90 font-semibold"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    สุ่มออกข้อสอบวิชานี้ ({targetQuestionCount} ข้อ)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มข้อสอบวิชานี้
                  </Button>
                </div>
              </div>
            )}

            {/* AI Generator Panel */}
            <Card id="ai-generator-panel" className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background shadow-sm scroll-mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary font-bold">
                  <Sparkles className="h-4 w-4" />
                  AI ช่วยสร้างข้อสอบอิงตัวชี้วัด & สื่อการสอน (Google Gemini 2.0)
                </CardTitle>
                <CardDescription className="text-xs">
                  เลือกรูปแบบข้อสอบ (ปรนัย, เติมคำ, อัตนัย หรือแบบผสม), ตัวชี้วัดหลักสูตร และเชื่อมโยงสื่อการสอนจริง
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row 1: Topic, Question Format & Count */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">หัวข้อ / บทเรียน</Label>
                    <Input
                      placeholder="เช่น การสังเคราะห์ด้วยแสง, ระบบสุริยะ, เศษส่วน..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="h-9 text-xs"
                    />
                    {selectedSubjectConfig?.suggestedTopics && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-500" />
                          หัวข้อแนะนำ:
                        </span>
                        {selectedSubjectConfig.suggestedTopics.map((top) => (
                          <button
                            key={top}
                            type="button"
                            onClick={() => setAiTopic(top)}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 text-muted-foreground"
                          >
                            {top}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">รูปแบบข้อสอบ</Label>
                    <Select
                      value={aiQuestionFormat}
                      onValueChange={(v) => setAiQuestionFormat(v as 'mixed' | 'mcq' | 'fillin' | 'essay')}
                    >
                      <SelectTrigger className="h-9 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">🌟 ผสม (ปรนัย+เติมคำ+อัตนัย)</SelectItem>
                        <SelectItem value="mcq">📝 ปรนัย 4 ตัวเลือก (MCQ)</SelectItem>
                        <SelectItem value="fillin">✍️ เติมคำตอบสั้น (Fill-in)</SelectItem>
                        <SelectItem value="essay">📋 อัตนัย / แสดงวิธีทำ (Essay)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">จำนวนข้อ</Label>
                    <Select value={String(aiCount)} onValueChange={(v) => setAiCount(Number(v))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 ข้อ</SelectItem>
                        <SelectItem value="10">10 ข้อ</SelectItem>
                        <SelectItem value="15">15 ข้อ</SelectItem>
                        <SelectItem value="20">20 ข้อ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Curriculum Indicator, Media Reference, Difficulty & Bloom */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-border/40">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      ตัวชี้วัดหลักสูตรแกนกลาง (Curriculum Indicator)
                    </Label>
                    <Select value={aiIndicatorCode} onValueChange={setAiIndicatorCode}>
                      <SelectTrigger className="h-9 text-xs truncate">
                        <SelectValue placeholder="— เลือกตัวชี้วัด —" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 max-w-lg">
                        <SelectItem value="all">🎯 ครอบคลุมทั่วไปตามมาตรฐานวิชา</SelectItem>
                        {curriculumIndicators.map((ind) => (
                          <SelectItem key={ind.id} value={ind.indicator_code}>
                            <span className="font-semibold text-primary">{ind.indicator_code}</span>: {ind.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      สื่อการสอน / เกมที่ใช้อ้างอิง
                    </Label>
                    <Select value={aiSelectedMediaId} onValueChange={setAiSelectedMediaId}>
                      <SelectTrigger className="h-9 text-xs truncate">
                        <SelectValue placeholder="— ไม่อ้างอิงสื่อ —" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 max-w-sm">
                        <SelectItem value="none">🌐 ไม่อ้างอิงสื่อ (สร้างตามเนื้อหาทั่วไป)</SelectItem>
                        {mediaItems.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            🎮 {med.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">ความยาก</Label>
                      <Select value={aiDifficulty} onValueChange={(v) => setAiDifficulty(v as 'easy' | 'medium' | 'hard')}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">ง่าย</SelectItem>
                          <SelectItem value="medium">ปานกลาง</SelectItem>
                          <SelectItem value="hard">ยาก</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Bloom's</Label>
                      <Select value={aiBloom} onValueChange={setAiBloom}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="L1">L1 จำ</SelectItem>
                          <SelectItem value="L2">L2 เข้าใจ</SelectItem>
                          <SelectItem value="L3">L3 นำไปใช้</SelectItem>
                          <SelectItem value="L4">L4 วิเคราะห์</SelectItem>
                          <SelectItem value="L5">L5 ประเมิน</SelectItem>
                          <SelectItem value="L6">L6 คิดค้น</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                    <span>วิชา: <strong className="text-foreground">{selectedSubject}</strong> ({selectedGrade})</span>
                    <span>•</span>
                    <span>โหมด: <strong className="text-primary">{aiQuestionFormat === 'mixed' ? 'แบบผสม 3 รูปแบบ' : aiQuestionFormat}</strong></span>
                    {aiIndicatorCode !== 'all' && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                          {aiIndicatorCode}
                        </Badge>
                      </>
                    )}
                    {aiSelectedMediaId !== 'none' && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-800 bg-amber-50/40">
                          🎮 อิงสื่อบทเรียน
                        </Badge>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating}
                    size="sm"
                    className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        กำลังสร้างข้อสอบ {aiQuestionFormat === 'mixed' ? 'แบบผสม' : ''}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        สร้างข้อสอบด้วย AI ({aiCount} ข้อ)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List & Cart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question Bank Items */}
              <div className="lg:col-span-2 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm">รายการข้อสอบในคลัง</h2>
                    <Badge variant="secondary" className="text-xs">{questions.length} ข้อ</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Question Type Filter Pills */}
                    <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-xl border border-border/60">
                      <button
                        type="button"
                        onClick={() => setSelectedQTypeFilter('all')}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                          selectedQTypeFilter === 'all'
                            ? 'bg-background text-foreground shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQTypeFilter('mcq')}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                          selectedQTypeFilter === 'mcq'
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        📝 ปรนัย
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQTypeFilter('fillin')}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                          selectedQTypeFilter === 'fillin'
                            ? 'bg-amber-600 text-white shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ✍️ เติมคำ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedQTypeFilter('essay')}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                          selectedQTypeFilter === 'essay'
                            ? 'bg-violet-600 text-white shadow-xs font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        📋 อัตนัย
                      </button>
                    </div>

                    {/* Indicator Filter */}
                    {availableIndicatorsInQuestions.length > 0 && (
                      <Select value={selectedIndicatorFilter} onValueChange={setSelectedIndicatorFilter}>
                        <SelectTrigger className="w-[150px] sm:w-[170px] h-8 text-xs">
                          <Target className="h-3 w-3 mr-1 text-primary shrink-0" />
                          <SelectValue placeholder="ทุกตัวชี้วัด" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 max-w-sm">
                          <SelectItem value="all">🎯 ทุกตัวชี้วัด ({questions.length})</SelectItem>
                          {availableIndicatorsInQuestions.map((ind) => (
                            <SelectItem key={ind.code} value={ind.code}>
                              {ind.code} ({questions.filter((q) => q.indicator_code === ind.code).length})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Topic Filter */}
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs">
                        <ListFilter className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue placeholder="ทุกบทเรียน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกบทเรียน ({questions.length})</SelectItem>
                        {availableTopics.map((top) => {
                          const count = questions.filter((q) => q.topic === top).length;
                          return (
                            <SelectItem key={top} value={top}>
                              {top} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="ค้นหาข้อสอบ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-32 sm:w-40 h-8 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(!showAddModal)}
                      className="h-8 text-xs gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มเอง
                    </Button>
                  </div>
                </div>

                {/* Editing Mode Banner */}
                {editingExamSetId && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold">กำลังอยู่ในโหมดแก้ไขชุดข้อสอบ: </span>
                        <span className="underline decoration-amber-400 font-semibold">{newSetTitle}</span>
                        <span className="text-amber-800 ml-1.5 font-medium">(มีข้อสอบเดิม {selectedQIds.length} ข้อ)</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-6 text-xs text-amber-800 hover:text-amber-950 hover:bg-amber-200/50"
                    >
                      <X className="h-3 w-3 mr-1" />
                      ยกเลิกการแก้ไข
                    </Button>
                  </div>
                )}

                {/* Smart Selection & Random Picker Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/60 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1 mr-1 text-[11px]">
                      <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      เลือกข้อ:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 text-[11px] px-2.5 bg-background shadow-xs"
                    >
                      เลือกทั้งหมดในหน้านี้ ({displayedQuestions.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground bg-background shadow-xs"
                      disabled={selectedQIds.length === 0}
                    >
                      ยกเลิกในหน้านี้
                    </Button>

                    <div className="h-3.5 w-px bg-border mx-1 hidden sm:block" />

                    <span className="font-semibold text-muted-foreground flex items-center gap-1 mr-1 text-[11px]">
                      <Shuffle className="h-3.5 w-3.5 text-amber-600" />
                      สุ่มสร้าง:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRandomSelect(10)}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-amber-500/10 hover:text-amber-700 hover:border-amber-300 shadow-xs"
                    >
                      10 ข้อ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRandomSelect(20)}
                      className="h-7 text-[11px] px-2.5 bg-background font-semibold text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
                    >
                      20 ข้อ (แนะนำ)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRandomSelect(30)}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-amber-500/10 hover:text-amber-700 hover:border-amber-300 shadow-xs"
                    >
                      30 ข้อ
                    </Button>

                    {/* Quick Fill Remaining Button if not yet completed */}
                    {selectedQIds.length > 0 && selectedQIds.length < targetQuestionCount && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFillRemaining}
                        className="h-7 text-[11px] px-2.5 bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20 font-semibold gap-1 shadow-xs ml-1"
                      >
                        <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
                        สุ่มเติมให้ครบ {targetQuestionCount} ข้อ (ขาดอีก {targetQuestionCount - selectedQIds.length})
                      </Button>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground ml-auto">
                    แสดง {displayedQuestions.length} จาก {questions.length} ข้อ
                  </div>
                </div>

                {/* Add Manual Form Modal */}
                {showAddModal && (
                  <Card className="border-primary/30 p-4 bg-muted/20 space-y-3.5 shadow-sm rounded-2xl">
                    <div className="flex justify-between items-center pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-primary" />
                        <span className="font-bold text-xs text-foreground">เพิ่มข้อสอบด้วยตนเอง</span>
                      </div>
                      {/* Question Type Switcher */}
                      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/60">
                        <button
                          type="button"
                          onClick={() => setNewQType('mcq')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                            newQType === 'mcq'
                              ? 'bg-blue-600 text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          📝 ปรนัย 4 ตัวเลือก
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewQType('fillin')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                            newQType === 'fillin'
                              ? 'bg-amber-600 text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          ✍️ เติมคำตอบสั้น
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewQType('essay')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                            newQType === 'essay'
                              ? 'bg-violet-600 text-white shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          📋 อัตนัย / แสดงวิธีทำ
                        </button>
                      </div>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="text-xs text-muted-foreground hover:text-foreground p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Metadata: Indicator, Media, Difficulty & Bloom */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium flex items-center gap-1">
                          <Target className="h-3 w-3 text-primary" />
                          ตัวชี้วัดหลักสูตร:
                        </Label>
                        <Select value={newQIndicatorCode} onValueChange={setNewQIndicatorCode}>
                          <SelectTrigger className="h-8 text-xs truncate">
                            <SelectValue placeholder="— เลือกตัวชี้วัด —" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 max-w-sm">
                            <SelectItem value="none">ไม่ระบุตัวชี้วัด</SelectItem>
                            {curriculumIndicators.map((ind) => (
                              <SelectItem key={ind.id} value={ind.indicator_code}>
                                <span className="font-semibold text-primary">{ind.indicator_code}</span>: {ind.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          สื่อการสอนอ้างอิง:
                        </Label>
                        <Select value={newQMediaId} onValueChange={setNewQMediaId}>
                          <SelectTrigger className="h-8 text-xs truncate">
                            <SelectValue placeholder="— ไม่อ้างอิงสื่อ —" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 max-w-sm">
                            <SelectItem value="none">ไม่อ้างอิงสื่อ</SelectItem>
                            {mediaItems.map((med) => (
                              <SelectItem key={med.id} value={med.id}>
                                🎮 {med.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">ระดับความยาก:</Label>
                        <Select
                          value={newQDifficulty}
                          onValueChange={(v) => setNewQDifficulty(v as 'easy' | 'medium' | 'hard')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">ง่าย</SelectItem>
                            <SelectItem value="medium">ปานกลาง</SelectItem>
                            <SelectItem value="hard">ยาก</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">ระดับ Bloom's:</Label>
                        <Select
                          value={newQBloom}
                          onValueChange={(v) => setNewQBloom(v as BloomLevel)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L1">L1 จำ</SelectItem>
                            <SelectItem value="L2">L2 เข้าใจ</SelectItem>
                            <SelectItem value="L3">L3 นำไปใช้</SelectItem>
                            <SelectItem value="L4">L4 วิเคราะห์</SelectItem>
                            <SelectItem value="L5">L5 ประเมิน</SelectItem>
                            <SelectItem value="L6">L6 คิดค้น</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">โจทย์คำถาม</Label>
                      <Textarea
                        placeholder="พิมพ์โจทย์คำถาม เช่น นักเรียนทำการทดลองเรื่องสถานะของสาร..."
                        value={newQText}
                        onChange={(e) => setNewQText(e.target.value)}
                        className="text-xs min-h-[70px]"
                      />
                    </div>

                    {/* Image Attachment (Optional) */}
                    <div className="p-3 bg-muted/20 border border-border/70 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          ภาพประกอบข้อสอบ (ถ้ามี)
                        </Label>
                        {Boolean(newQImageUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewQImageUrl('');
                              setNewQImageTitle('');
                            }}
                            className="h-6 text-[10px] text-destructive hover:text-destructive px-2"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            ไม่ใช้ภาพประกอบ
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <Input
                            placeholder="URL ภาพ เช่น /games/career/illustrations/coconut-broom.webp"
                            value={newQImageUrl}
                            onChange={(e) => setNewQImageUrl(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="คำอธิบายภาพ เช่น ภาพประกอบ: ไม้กวาดทางมะพร้าวมีด้าม"
                            value={newQImageTitle}
                            onChange={(e) => setNewQImageTitle(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Quick Preset Selector for Teacher */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">เลือกภาพด่วนจากคลัง:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/coconut-broom.webp');
                            setNewQImageTitle('ภาพประกอบ: ไม้กวาดทางมะพร้าวมีด้าม');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          🧹 ไม้กวาดทางมะพร้าว
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/grass-broom.webp');
                            setNewQImageTitle('ภาพประกอบ: ไม้กวาดดอกหญ้า');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          🌾 ไม้กวาดดอกหญ้า
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/mop-bucket.webp');
                            setNewQImageTitle('ภาพประกอบ: ไม้ถูพื้นและถังน้ำ');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          🪣 ไม้ถูพื้น
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/dishwashing.webp');
                            setNewQImageTitle('ภาพประกอบ: การล้างจานชาม');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          🍽️ ล้างจาน
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/hoe-digging.webp');
                            setNewQImageTitle('ภาพประกอบ: จอบขุดดิน');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          ⛏️ จอบ
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/transplanting-trowel.webp');
                            setNewQImageTitle('ภาพประกอบ: ช้อนปลูก');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          🌱 ช้อนปลูก
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewQImageUrl('/games/career/illustrations/waste-sorting-4bins.webp');
                            setNewQImageTitle('ภาพประกอบ: ถังขยะ 4 สี แยกประเภท');
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          ♻️ ถังขยะ 4 สี
                        </Button>
                      </div>

                      {/* Image Preview */}
                      {Boolean(newQImageUrl) && (
                        <div className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border w-fit">
                          <img
                            src={newQImageUrl}
                            alt="พรีวิวภาพประกอบ"
                            className="h-16 w-16 object-contain rounded border border-border bg-white"
                          />
                          <div className="text-xs">
                            <div className="font-semibold text-foreground">ตัวอย่างภาพประกอบโจทย์</div>
                            <div className="text-[11px] text-muted-foreground">{newQImageTitle || 'ไม่มีคำอธิบายภาพ'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sub-form 1: MCQ */}
                    {newQType === 'mcq' && (
                      <div className="space-y-3 pt-1 border-t border-border/50">
                        <div className="text-xs font-semibold text-muted-foreground">ตัวเลือกคำตอบ 4 ตัวเลือก:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {['ก', 'ข', 'ค', 'ง'].map((l, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-bold w-4">{l}.</span>
                              <Input
                                placeholder={`ตัวเลือก ${l}`}
                                value={newQOpts[i]}
                                onChange={(e) => {
                                  const opts = [...newQOpts];
                                  opts[i] = e.target.value;
                                  setNewQOpts(opts);
                                }}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="font-semibold">เฉลยข้อที่ถูกต้อง:</span>
                          <Select value={String(newQAns)} onValueChange={(v) => setNewQAns(Number(v))}>
                            <SelectTrigger className="w-24 h-8 text-xs font-bold text-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">ก</SelectItem>
                              <SelectItem value="1">ข</SelectItem>
                              <SelectItem value="2">ค</SelectItem>
                              <SelectItem value="3">ง</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Sub-form 2: Fill-in */}
                    {newQType === 'fillin' && (
                      <div className="space-y-3 pt-1 border-t border-border/50 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-amber-900">คำตอบหลักที่ถูกต้อง (Primary Answer)</Label>
                            <Input
                              placeholder="เช่น ดาวพุธ หรือ 48"
                              value={newQFillinAns}
                              onChange={(e) => setNewQFillinAns(e.target.value)}
                              className="h-8 text-xs font-bold border-amber-300"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">
                              คำตอบสำรองที่ยอมรับได้ (คั่นด้วยจุลภาค ",")
                            </Label>
                            <Input
                              placeholder="เช่น พุธ, ดาวพุธ., Mercury"
                              value={newQAcceptedAlts}
                              onChange={(e) => setNewQAcceptedAlts(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          💡 ระบบจะทำการ Normalize คำตอบ เช่น ตัดวรรคตอนหน้าหลัง และเทียบกับทั้งคำตอบหลักและคำตอบสำรองโดยอัตโนมัติ
                        </p>
                      </div>
                    )}

                    {/* Sub-form 3: Essay */}
                    {newQType === 'essay' && (
                      <div className="space-y-3 pt-1 border-t border-border/50 text-xs">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-violet-950">
                            แนวคำตอบที่สมบูรณ์ หรือขั้นตอนการแสดงวิธีทำ (Key Solution)
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground">คะแนนเต็มข้อนี้:</span>
                            <Input
                              type="number"
                              value={newQEssayScore}
                              onChange={(e) => setNewQEssayScore(Number(e.target.value))}
                              className="h-7 w-16 text-xs text-center font-bold text-violet-700"
                              min={1}
                              max={100}
                            />
                            <span className="text-[11px] font-semibold text-muted-foreground">คะแนน</span>
                          </div>
                        </div>
                        <Textarea
                          placeholder="พิมพ์ขั้นตอนการแสดงวิธีทำ หรือแนวคำตอบที่นักเรียนควรเขียนตอบ เพื่อให้ครูใช้เป็นเกณฑ์ในการตรวจ..."
                          value={newQEssayKeySol}
                          onChange={(e) => setNewQEssayKeySol(e.target.value)}
                          className="text-xs min-h-[75px] font-normal"
                        />
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            คำสำคัญที่ควรมีในคำตอบ (Keywords คั่นด้วยจุลภาค ",")
                          </Label>
                          <Input
                            placeholder="เช่น จุดหลอมเหลว, ความร้อนแฝง, การเปลี่ยนสถานะ"
                            value={newQEssayKeywords}
                            onChange={(e) => setNewQEssayKeywords(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddModal(false)}
                        className="h-8 text-xs"
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveManualQuestion}
                        disabled={createQMutation.isPending}
                        className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        {createQMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อสอบลงคลัง'}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* List items */}
                {loadingQ ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">กำลังโหลดข้อสอบ...</div>
                ) : displayedQuestions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl p-8 bg-muted/10 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 text-3xl flex items-center justify-center mx-auto border border-border/80 shadow-xs">
                      {selectedSubjectConfig?.icon || '📚'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-foreground">
                        {searchQuery.trim()
                          ? `ไม่พบข้อสอบที่ตรงกับ "${searchQuery}"`
                          : `ยังไม่มีข้อสอบในคลังสำหรับวิชา${selectedSubject !== 'all' ? selectedSubject : ''} (${selectedGrade})`}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        {searchQuery.trim()
                          ? 'ลองปรับคำค้นหา หรือกดปุ่มล้างคำค้นหาเพื่อดูข้อสอบทั้งหมด'
                          : 'คุณครูสามารถให้ AI ช่วยสร้างข้อสอบปรนัยมาตรฐานพร้อมเฉลยใน 1 คลิก หรือกดเพิ่มข้อสอบด้วยตนเอง'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {searchQuery.trim() ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="h-8 text-xs gap-1.5"
                        >
                          <X className="h-3.5 w-3.5" />
                          ล้างคำค้นหา
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              const firstTopic = selectedSubjectConfig?.suggestedTopics?.[0] || selectedSubject;
                              setAiTopic(firstTopic);
                              setAiCount(10);
                              const el = document.getElementById('ai-generator-panel');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            ให้ AI ช่วยสร้างข้อสอบวิชานี้ (10 ข้อ)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            เพิ่มข้อสอบด้วยตนเอง
                          </Button>
                        </>
                      )}
                    </div>

                    {!searchQuery.trim() && selectedSubjectConfig?.suggestedTopics && selectedSubjectConfig.suggestedTopics.length > 0 && (
                      <div className="pt-2 border-t border-border/40 max-w-lg mx-auto">
                        <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mb-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          คลิกหัวข้อแนะนำเพื่อเริ่มสร้างข้อสอบด้วย AI:
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {selectedSubjectConfig.suggestedTopics.map((top) => (
                            <button
                              key={top}
                              type="button"
                              onClick={() => {
                                setAiTopic(top);
                                setAiCount(10);
                                const el = document.getElementById('ai-generator-panel');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-background hover:bg-primary/10 hover:text-primary transition-colors border border-border/80 text-muted-foreground shadow-xs"
                            >
                              + {top}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedQuestions.map((q, idx) => {
                      const isSelected = selectedQIds.includes(q.id);
                      const opts = Array.isArray(q.options) ? (q.options as string[]) : [];

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            isSelected ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const next = [...selectedQIds, q.id];
                                    setSelectedQIds(next);
                                    if (!newSetTitle) {
                                      setNewSetTitle(`แบบทดสอบ${selectedSubject !== 'all' ? selectedSubject : ''} ${selectedGrade} (${next.length} ข้อ)`);
                                    }
                                  } else {
                                    setSelectedQIds(selectedQIds.filter((id) => id !== q.id));
                                  }
                                }}
                                className="mt-1 rounded border-border cursor-pointer h-4 w-4 accent-primary"
                              />
                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-muted-foreground text-xs">{idx + 1}.</span>

                                  {/* Question Type Badge */}
                                  {q.question_type === 'fillin' ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-800 bg-amber-50 font-bold">
                                      ✍️ เติมคำ
                                    </Badge>
                                  ) : q.question_type === 'essay' ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-400 text-violet-800 bg-violet-50 font-bold">
                                      📋 อัตนัย
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-400 text-blue-800 bg-blue-50 font-bold">
                                      📝 ปรนัย
                                    </Badge>
                                  )}

                                  {q.subject && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 font-medium ${
                                        SUBJECT_MAP[q.subject]?.badgeClass || 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {SUBJECT_MAP[q.subject]?.icon || '📄'} {q.subject}
                                    </Badge>
                                  )}
                                  {q.topic && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                                      {q.topic}
                                    </Badge>
                                  )}
                                  {q.indicator_code && (
                                    <Badge
                                      variant="outline"
                                      title={q.indicator_desc || ''}
                                      className="text-[10px] px-1.5 py-0 border-teal-400 text-teal-800 bg-teal-50 font-medium cursor-help"
                                    >
                                      🎯 {q.indicator_code}
                                    </Badge>
                                  )}
                                  {q.media_title && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 border-rose-300 text-rose-800 bg-rose-50 font-medium"
                                    >
                                      🎮 {q.media_title}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${
                                      q.difficulty === 'easy'
                                        ? 'text-emerald-700 border-emerald-300 bg-emerald-500/10'
                                        : q.difficulty === 'hard'
                                        ? 'text-purple-700 border-purple-300 bg-purple-500/10'
                                        : 'text-blue-700 border-blue-300 bg-blue-500/10'
                                    }`}
                                  >
                                    {q.difficulty === 'easy' ? 'ง่าย' : q.difficulty === 'hard' ? 'ยาก' : 'ปานกลาง'}
                                  </Badge>
                                  {q.bloom_level && q.bloom_level !== 'auto' && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted text-muted-foreground">
                                      {q.bloom_level}
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs font-medium leading-relaxed text-foreground">
                                  {q.question_text}
                                </div>

                                {/* Question Image Stimulus if available */}
                                {Boolean(q.media_image_url) && (
                                  <div className="my-2 p-1.5 bg-muted/20 border border-border rounded-lg flex items-center gap-2.5 w-fit">
                                    <img
                                      src={String(q.media_image_url)}
                                      alt={String(q.media_title || 'ภาพประกอบข้อสอบ')}
                                      className="h-14 w-14 object-contain rounded bg-card border border-border shrink-0"
                                    />
                                    <div className="text-[11px] text-muted-foreground pr-2">
                                      <div className="font-semibold text-foreground">ภาพประกอบข้อสอบ</div>
                                      <div className="text-[10px] text-muted-foreground">{String(q.media_title || '')}</div>
                                    </div>
                                  </div>
                                )}

                                {/* MCQ Choices Display */}
                                {(!q.question_type || q.question_type === 'mcq') && opts.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 text-[11px] text-muted-foreground">
                                    {opts.map((opt, oIdx) => (
                                      <div
                                        key={oIdx}
                                        className={`p-1 px-2 rounded ${
                                          oIdx === q.answer
                                            ? 'font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-300/60'
                                            : 'bg-muted/20'
                                        }`}
                                      >
                                        {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Fill-in Answer Display */}
                                {q.question_type === 'fillin' && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-300/60 text-xs text-amber-900 space-y-1">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                      <span>เฉลยคำตอบหลัก: <strong className="text-foreground underline decoration-amber-400 font-bold">{String(q.answer)}</strong></span>
                                    </div>
                                    {Array.isArray(q.accepted_answers) && q.accepted_answers.length > 0 && (
                                      <div className="text-[11px] text-muted-foreground">
                                        คำตอบสำรองที่ยอมรับได้: {q.accepted_answers.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Essay Solution & Rubric Display */}
                                {q.question_type === 'essay' && (
                                  <div className="mt-1.5 p-2.5 rounded-lg bg-violet-500/10 border border-violet-300/60 text-xs text-violet-950 space-y-1.5">
                                    <div className="flex items-center justify-between font-semibold">
                                      <span className="flex items-center gap-1.5 text-violet-800">
                                        <FileText className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                                        แนวคำตอบ / ขั้นตอนการแสดงวิธีทำ
                                      </span>
                                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-violet-300 text-violet-800 bg-white font-bold shadow-xs">
                                        คะแนนเต็ม {(q.rubric as any)?.full_score || 5} คะแนน
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line bg-background/60 p-2 rounded border border-violet-200/50">
                                      {(q.rubric as any)?.key_solution || String(q.answer || '-')}
                                    </p>
                                    {Array.isArray((q.rubric as any)?.keywords) && (q.rubric as any).keywords.length > 0 && (
                                      <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                                        <span className="font-semibold text-violet-800">คำสำคัญ (Keywords):</span>
                                        <span>{(q.rubric as any).keywords.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {q.explanation && (
                                  <div className="mt-1.5 p-2 rounded bg-muted/30 border border-border/50 text-[11px] text-muted-foreground">
                                    <span className="font-semibold text-foreground">💡 คำอธิบายเฉลย: </span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQMutation.mutate(q.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart / Set Builder Panel */}
              <div className="space-y-4">
                <Card className="border-border sticky top-20 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-primary" />
                        จัดชุดข้อสอบ (Cart)
                      </span>
                      <Badge
                        variant={selectedQIds.length >= targetQuestionCount ? 'default' : 'secondary'}
                        className={`text-xs font-bold ${
                          selectedQIds.length >= targetQuestionCount
                            ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                            : 'text-primary'
                        }`}
                      >
                        {selectedQIds.length} / {targetQuestionCount} ข้อ
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {editingExamSetId
                        ? 'กำลังแก้ไขชุดข้อสอบเดิม — สามารถเพิ่ม/ลดข้อสอบได้ตามต้องการ'
                        : 'กำหนดจำนวนข้อที่ต้องการ เลือกข้อสอบ หรือกดสุ่มเติมให้ครบ'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    {/* Editing Banner */}
                    {editingExamSetId && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Pencil className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                          <span className="font-semibold">โหมดแก้ไขชุดเดิม</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-6 text-[11px] text-amber-800 hover:text-amber-950 px-1.5 hover:bg-amber-200/50"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    )}

                    {/* Target Question Count Controls */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1 text-[11px]">
                          <Layers className="h-3 w-3 text-primary" />
                          เป้าหมายใน 1 ชุด:
                        </span>
                        <span className="font-bold text-primary">{targetQuestionCount} ข้อ</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[10, 20, 30].map((num) => (
                          <Button
                            key={num}
                            type="button"
                            variant={targetQuestionCount === num && !isCustomTarget ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTargetCountSelect(num)}
                            className="h-7 text-[11px] px-1 shadow-xs"
                          >
                            {num} ข้อ {num === 20 ? '⭐' : ''}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant={isCustomTarget ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setIsCustomTarget(!isCustomTarget)}
                          className="h-7 text-[11px] px-1 shadow-xs"
                        >
                          ระบุเอง
                        </Button>
                      </div>
                      {isCustomTarget && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={customTargetInput}
                            onChange={(e) => setCustomTargetInput(e.target.value)}
                            placeholder="จำนวนข้อ (1-100)"
                            className="h-7 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCustomTargetApply}
                            className="h-7 text-[11px] px-2.5"
                          >
                            ตั้งค่า
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Auto-Fill Status */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-card border border-border/70 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-muted-foreground">ความคืบหน้าการเลือก:</span>
                        <span className="font-bold">
                          {selectedQIds.length} / {targetQuestionCount} ข้อ
                          {selectedQIds.length >= targetQuestionCount && (
                            <span className="text-emerald-700 ml-1">✓ ครบแล้ว</span>
                          )}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.round((selectedQIds.length / targetQuestionCount) * 100))}
                        className="h-2"
                      />
                      {selectedQIds.length < targetQuestionCount ? (
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <span className="text-[11px] text-amber-700 font-medium">
                            ยังขาดอีก {targetQuestionCount - selectedQIds.length} ข้อ
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleFillRemaining}
                            className="h-6 text-[10px] px-2 bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20 font-semibold gap-1"
                          >
                            <Zap className="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
                            สุ่มเติมให้ครบ
                          </Button>
                        </div>
                      ) : selectedQIds.length > targetQuestionCount ? (
                        <div className="text-[11px] text-blue-700 font-medium pt-0.5">
                          เลือกเกินเป้าหมาย {selectedQIds.length - targetQuestionCount} ข้อ (ใช้งานได้ปกติ)
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-700 font-medium pt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          เลือกข้อสอบครบตามเป้าหมาย {targetQuestionCount} ข้อพอดี
                        </div>
                      )}
                    </div>

                    {/* Difficulty Stats Breakdown */}
                    {selectedQIds.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/60 text-center">
                        <div className="p-1 rounded bg-emerald-500/10 border border-emerald-200/50">
                          <div className="text-[10px] text-emerald-700 font-medium">ง่าย</div>
                          <div className="text-xs font-bold text-emerald-800">{difficultyStats.easy}</div>
                        </div>
                        <div className="p-1 rounded bg-blue-500/10 border border-blue-200/50">
                          <div className="text-[10px] text-blue-700 font-medium">ปานกลาง</div>
                          <div className="text-xs font-bold text-blue-800">{difficultyStats.medium}</div>
                        </div>
                        <div className="p-1 rounded bg-purple-500/10 border border-purple-200/50">
                          <div className="text-[10px] text-purple-700 font-medium">ยาก</div>
                          <div className="text-xs font-bold text-purple-800">{difficultyStats.hard}</div>
                        </div>
                      </div>
                    )}

                    {/* Quick Review / Clear Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCartReview(true)}
                        disabled={selectedQIds.length === 0}
                        className="flex-1 text-xs h-8 gap-1.5 bg-background shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        ตรวจทานข้อที่เลือก ({selectedQIds.length})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQIds([])}
                        disabled={selectedQIds.length === 0}
                        className="text-xs h-8 text-muted-foreground hover:text-destructive px-2"
                      >
                        ล้าง
                      </Button>
                    </div>

                    {/* Cross-Subject Validation & Warning */}
                    {selectedQIds.length > 0 && (
                      <div className="pt-1">
                        {isCrossSubject ? (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-900 text-xs space-y-2">
                            <div className="flex items-start gap-1.5 font-semibold text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span>ตรวจพบข้อสอบหลายวิชาในชุดนี้:</span>
                                <div className="flex flex-wrap gap-1 mt-1 font-normal">
                                  {Object.entries(selectedSubjectsBreakdown).map(([subj, count]) => (
                                    <Badge key={subj} variant="outline" className="text-[10px] bg-background/80 border-amber-300 text-amber-900">
                                      {SUBJECT_MAP[subj]?.icon || '📄'} {subj}: {count} ข้อ
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="pt-0.5 flex flex-wrap gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleKeepOnlySubject(targetSubject)}
                                className="h-6 text-[10px] px-2 bg-amber-600 text-white hover:bg-amber-700 border-transparent font-medium"
                              >
                                ⚡ เก็บเฉพาะวิชา {targetSubject} ({selectedSubjectsBreakdown[targetSubject] || 0} ข้อ)
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-300/60 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>ทุกข้อเป็นวิชา {uniqueSelectedSubjects[0] || targetSubject} ตรงตามวิชา 100%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Target Subject Selector */}
                    <div className="space-y-1.5 pt-1 border-t border-border/60">
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>วิชาของชุดข้อสอบ:</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {SUBJECT_MAP[targetSubject]?.icon} {targetSubject}
                        </span>
                      </Label>
                      <Select
                        value={targetSubject}
                        onValueChange={(val) => {
                          setTargetSubject(val);
                          if (!editingExamSetId) {
                            setNewSetTitle(`แบบทดสอบวิชา${val} ${selectedGrade} (${selectedQIds.length} ข้อ)`);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_LIST.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              <span className="flex items-center gap-1.5">
                                <span>{SUBJECT_MAP[subj]?.icon}</span>
                                <span>{subj}</span>
                              </span>
                            </SelectItem>
                          ))}
                          <SelectItem value="บูรณาการ/ทั่วไป">🌐 บูรณาการ / ทั่วไป</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-border/60">
                      <Label className="text-xs">ชื่อชุดข้อสอบ</Label>
                      <Input
                        placeholder="เช่น ข้อสอบปลายภาค วิทยาศาสตร์ ป.4"
                        value={newSetTitle}
                        onChange={(e) => setNewSetTitle(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">เวลาสอบ (นาที)</Label>
                        <Input
                          type="number"
                          value={newSetTime}
                          onChange={(e) => setNewSetTime(Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">รหัส PIN เข้าสอบ</Label>
                        <Input
                          placeholder="เช่น SCI401"
                          value={newSetPin}
                          onChange={(e) => setNewSetPin(e.target.value)}
                          className="h-8 text-xs uppercase"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBuildSet(false)}
                      disabled={createSetMutation.isPending || updateSetMutation.isPending || !selectedQIds.length}
                      className={`w-full text-xs h-9 shadow-xs font-semibold ${
                        editingExamSetId ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
                      }`}
                    >
                      {editingExamSetId ? (
                        <>
                          <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                          บันทึกการแก้ไขชุดข้อสอบ ({selectedQIds.length} ข้อ)
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                          บันทึกชุดข้อสอบ ({selectedQIds.length} ข้อ)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: ชุดข้อสอบ (Exam Sets)
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="sets" className="space-y-6 mt-6">
            {/* Subject Selector Toolbar for Exam Sets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-xs">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  ชุดข้อสอบที่สร้างไว้ (Exam Sets)
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  เลือกดูชุดข้อสอบแยกตามกลุ่มสาระการเรียนรู้ หรือเลือกดูทั้งหมด
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="ทุกวิชา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 แสดงทุกวิชา</SelectItem>
                    {SUBJECT_LIST.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        <span className="flex items-center gap-1.5">
                          <span>{SUBJECT_MAP[subj]?.icon}</span>
                          <span>{subj}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="ทุกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกชั้น</SelectItem>
                    {GRADE_LIST.map((gr) => (
                      <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingSets ? (
                <div className="col-span-full text-center py-12 text-xs text-muted-foreground">กำลังโหลดชุดข้อสอบ...</div>
              ) : examSets.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed rounded-xl p-8 bg-muted/10">
                  <p className="text-sm font-semibold text-muted-foreground">ยังไม่มีชุดข้อสอบในหมวดนี้</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSubject !== 'all' ? `ยังไม่มีชุดข้อสอบวิชา ${selectedSubject}` : 'ไปที่แท็บ "คลังข้อสอบ" เพื่อเลือกข้อสอบและสร้างชุดข้อสอบ'}
                  </p>
                </div>
              ) : (
                examSets.map((set) => {
                  const qCount = Array.isArray(set.questions) ? set.questions.length : 0;

                  return (
                    <Card key={set.id} className="border-border hover:border-primary/50 transition-shadow shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              SUBJECT_MAP[set.subject]?.badgeClass || 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {SUBJECT_MAP[set.subject]?.icon || '📄'} {set.subject} · {set.grade}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {set.is_active ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px]">
                                เปิดสอบ
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                                ยกเลิก/ปิดสอบ
                              </Badge>
                            )}
                            {set.pin_code && (
                              <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 text-[10px]">
                                PIN: {set.pin_code}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-sm font-bold mt-1 line-clamp-1">{set.title}</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-2.5 pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {qCount} ข้อ
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {set.time_limit_minutes} นาที
                          </span>
                        </div>

                        {qCount < 5 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-500/10 border border-amber-300/60 p-1.5 rounded-md font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>มีเพียง {qCount} ข้อ — กดแก้ไขเพื่อเลือกข้อสอบเพิ่ม</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/60">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1 font-semibold text-primary hover:bg-primary/5 hover:border-primary/50 shadow-xs"
                            onClick={() => handleStartEditSet(set)}
                          >
                            <Pencil className="h-3 w-3" />
                            แก้ไข / เพิ่มข้อ ({qCount})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1 shadow-xs"
                            onClick={() => {
                              setPreviewExamSet(set);
                              setActiveTab('print');
                            }}
                          >
                            <Printer className="h-3 w-3" />
                            พิมพ์ A4
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1 text-blue-700 hover:text-blue-800 hover:bg-blue-500/10 hover:border-blue-300 shadow-xs"
                            onClick={() => {
                              setSelectedAnalysisSetId(set.id);
                              setResultsViewMode('analysis');
                              setActiveTab('results');
                            }}
                          >
                            <BarChart3 className="h-3 w-3 text-blue-600" />
                            วิเคราะห์ข้อสอบ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1 text-slate-700 hover:bg-muted/60 shadow-xs"
                            onClick={() => downloadExamDocx(set, { version: 'A' })}
                            title="ดาวน์โหลดชุดข้อสอบเป็นไฟล์ Microsoft Word"
                          >
                            <FileText className="h-3 w-3 text-blue-600" />
                            Word (.docx)
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] px-1 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/10 hover:border-emerald-300 shadow-xs"
                            onClick={() => {
                              setScannerExamSetId(set.id);
                              setActiveTab('scanner');
                            }}
                          >
                            <Camera className="h-3 w-3 text-emerald-600" />
                            สแกนตรวจ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 text-[11px] px-1 gap-1 shadow-xs ${
                              set.is_active
                                ? 'text-amber-700 hover:bg-amber-500/10 hover:border-amber-300'
                                : 'text-emerald-700 hover:bg-emerald-500/10 hover:border-emerald-300'
                            }`}
                            onClick={() =>
                              toggleActiveSetMutation.mutate({
                                id: set.id,
                                is_active: !set.is_active,
                              })
                            }
                            title={set.is_active ? 'ยกเลิก/ปิดรับการสอบชุดนี้' : 'เปิดรับการสอบชุดนี้อีกครั้ง'}
                          >
                            {set.is_active ? (
                              <>
                                <XCircle className="h-3 w-3 text-amber-600" />
                                ยกเลิกสอบ
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                เปิดสอบ
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] px-1 gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteSetConfirmId(set.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            ลบชุดนี้
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: พิมพ์ข้อสอบ A4 และกระดาษคำตอบ OMR
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="print" className="space-y-6 mt-6">
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Printer className="h-4 w-4 text-primary" />
                    ศูนย์พิมพ์แบบทดสอบ A4 และกระดาษคำตอบฝน OMR
                  </CardTitle>
                  <CardDescription className="text-xs">
                    เลือกชุดข้อสอบและรูปแบบที่ต้องการพิมพ์ลงกระดาษ A4 มาตรฐาน
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                    disabled={!previewExamSet}
                    onClick={() => previewExamSet && downloadExamDocx(previewExamSet, { version: printVersion === 'B' ? 'B' : 'A' })}
                    title="ดาวน์โหลดเป็นไฟล์ Microsoft Word (.docx) พร้อมหัวกระดาษราชการ"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    ส่งออก Word (.docx)
                  </Button>
                  <Button
                    variant={printMode === 'paper' && printVersion !== 'key' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setPrintMode('paper');
                      if (printVersion === 'key') setPrintVersion('A');
                    }}
                  >
                    ข้อสอบกระดาษ
                  </Button>
                  <Button
                    variant={printMode === 'omr' && printVersion !== 'key' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setPrintMode('omr');
                      if (printVersion === 'key') setPrintVersion('A');
                    }}
                  >
                    กระดาษคำตอบ OMR
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    size="sm"
                    className="h-8 text-xs gap-1.5 ml-2"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    สั่งพิมพ์
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2.5">
                    <Label className="text-xs whitespace-nowrap font-medium">ชุดข้อสอบ:</Label>
                    <Select
                      value={previewExamSet?.id || ''}
                      onValueChange={(val) => {
                        const found = examSets.find((s) => s.id === val);
                        if (found) setPreviewExamSet(found);
                      }}
                    >
                      <SelectTrigger className="w-64 sm:w-72 h-8 text-xs">
                        <SelectValue placeholder="— เลือกชุดข้อสอบ —" />
                      </SelectTrigger>
                      <SelectContent>
                        {examSets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title} ({s.subject} · {s.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Version & Key Matrix Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">ฉบับ:</span>
                    <Button
                      variant={printVersion === 'A' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setPrintVersion('A')}
                    >
                      ฉบับ A
                    </Button>
                    <Button
                      variant={printVersion === 'B' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setPrintVersion('B')}
                      title="สลับข้อและสลับตัวเลือก ก ข ค ง อัตโนมัติ ป้องกันการลอก"
                    >
                      ฉบับ B (สลับข้อ)
                    </Button>
                    <Button
                      variant={printVersion === 'key' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => setPrintVersion('key')}
                      title="แสดงตารางเทียบเฉลยคู่ขนาน Form A vs Form B"
                    >
                      <Split className="h-3 w-3" />
                      เทียบเฉลย A/B
                    </Button>
                  </div>
                </div>

                {/* Print Preview Container */}
                <div className="border border-border/80 rounded-xl p-6 bg-card min-h-[500px] shadow-inner overflow-x-auto">
                  {previewExamSet ? (
                    printVersion === 'key' ? (
                      <ExamAnswerKeyMatrix examSet={previewExamSet} />
                    ) : printMode === 'paper' ? (
                      <PrintableExamPaper examSet={previewExamSet} version={printVersion} />
                    ) : (
                      <PrintableOMRSheet examSet={previewExamSet} version={printVersion} />
                    )
                  ) : (
                    <div className="text-center py-24 text-muted-foreground text-xs">
                      กรุณาเลือกชุดข้อสอบด้านบนเพื่อแสดงตัวอย่างก่อนพิมพ์
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: สแกนตรวจกระดาษคำตอบด้วยกล้องมือถือ (Mobile Camera OMR)
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="scanner" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Camera Viewfinder */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-600 font-bold">
                    <Camera className="h-4 w-4" />
                    กล้องมือถือตรวจกระดาษคำตอบ OMR
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ส่องกล้องหลังให้กระดาษคำตอบอยู่ภายในกรอบ ระบบ AI Vision จะตรวจให้อัตโนมัติ
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Select Exam Set */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ชุดข้อสอบ (เฉลย)</Label>
                      <Select value={scannerExamSetId} onValueChange={setScannerExamSetId}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="— เลือกชุดข้อสอบ —" />
                        </SelectTrigger>
                        <SelectContent>
                          {examSets.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">ชั้นเรียนของนักเรียน</Label>
                      <Select value={omrStudentClass} onValueChange={setOmrStudentClass}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_LIST.map((gr) => (
                            <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Camera / Image Viewport */}
                  <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border">
                    <video
                      ref={videoRef}
                      playsInline
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                    />

                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Captured OMR"
                        className="w-full h-full object-contain bg-black"
                      />
                    )}

                    {!cameraActive && !capturedImage && (
                      <div className="text-center p-6 text-white/70 space-y-2">
                        <Camera className="h-10 w-10 mx-auto text-white/50" />
                        <p className="text-xs">กดปุ่ม "เปิดกล้องตรวจ" หรือเลือกไฟล์ภาพกระดาษคำตอบ</p>
                      </div>
                    )}

                    {/* Viewfinder overlay guide */}
                    {cameraActive && (
                      <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <div className="w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                          <div className="w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                        </div>
                        <div className="text-center text-[11px] text-emerald-300 font-semibold bg-black/40 py-1 rounded">
                          จัดกระดาษคำตอบให้อยู่ในกรอบ 4 มุม
                        </div>
                        <div className="flex justify-between">
                          <div className="w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                          <div className="w-5 h-5 border-b-4 border-r-4 border-emerald-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!cameraActive ? (
                      <Button onClick={startCamera} size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                        <Camera className="h-3.5 w-3.5" />
                        เปิดกล้องตรวจ
                      </Button>
                    ) : (
                      <>
                        <Button onClick={capturePhoto} size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                          <Camera className="h-3.5 w-3.5" />
                          ถ่ายภาพ
                        </Button>
                        <Button onClick={stopCamera} variant="outline" size="sm" className="h-8 text-xs">
                          ปิดกล้อง
                        </Button>
                      </>
                    )}

                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors">
                        📁 เลือกรูปถ่าย (1 แผ่น)
                      </span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => setBatchScannerOpen(true)}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      สแกนหลายแผ่นพร้อมกัน (Batch Scan)
                    </Button>

                    {capturedImage && (
                      <Button
                        onClick={runOMRAnalysis}
                        disabled={analyzingOMR || !scannerExamSetId}
                        size="sm"
                        className="h-8 text-xs gap-1.5 ml-auto"
                      >
                        {analyzingOMR ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            AI กำลังวิเคราะห์...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            ตรวจคะแนนทันที
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Instant Grading Results */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>ผลการตรวจและบันทึกคะแนน</span>
                    {omrSummary && (
                      <Badge className={omrSummary.passed ? 'bg-emerald-600 text-white' : 'bg-destructive text-white'}>
                        {omrSummary.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    เทียบรอยฝนกับเฉลยข้อสอบและจับคู่กับรายชื่อนักเรียนในฐานข้อมูล
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {omrSummary ? (
                    <>
                      {/* Score Summary Box */}
                      <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border text-center">
                        <div>
                          <div className="text-2xl font-bold text-foreground">
                            {omrSummary.correctCount}/{omrSummary.totalQuestions}
                          </div>
                          <div className="text-[11px] text-muted-foreground">คะแนนที่ได้</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{omrSummary.percentage}%</div>
                          <div className="text-[11px] text-muted-foreground">คิดเป็นร้อยละ</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {omrSummary.percentage >= 80 ? 'ดีเยี่ยม' : omrSummary.passed ? 'ผ่าน' : 'ปรับปรุง'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">ระดับผลการเรียน</div>
                        </div>
                      </div>

                      {/* Student Identification Roster Select */}
                      <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
                        <div className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                          <UserCheck className="h-4 w-4 text-primary" />
                          ระบุตัวตนนักเรียน (จากฐานข้อมูลโรงเรียน)
                        </div>

                        <div className="flex items-center gap-3">
                          <Select
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="— เลือกชื่อนักเรียน —" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((stu) => (
                                <SelectItem key={stu.id} value={stu.id}>
                                  เลขที่ {stu.class_number} · {stu.name} ({stu.student_code || 'ไม่มีรหัส'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {matchedStudent && (
                          <div className="flex items-center gap-3 pt-1 text-xs">
                            <PersonAvatar
                              name={matchedStudent.name}
                              photoUrl={matchedStudent.photo_url}
                              className="h-8 w-8"
                            />
                            <div>
                              <div className="font-semibold">{matchedStudent.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                ชั้น {matchedStudent.class} · เลขที่ {matchedStudent.class_number}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Answers Breakdown */}
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          รายละเอียดรายข้อ:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {omrSummary.details.map((d) => (
                            <div
                              key={d.index}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                d.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                                  : 'border-red-200 bg-red-50/50 text-red-800'
                              }`}
                            >
                              <span>ข้อ {d.index + 1}</span>
                              <div className="flex items-center gap-1 font-semibold">
                                <span>ตอบ: {d.studentAnswer !== null ? ['ก', 'ข', 'ค', 'ง'][d.studentAnswer] : '-'}</span>
                                {!d.isCorrect && (
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    (เฉลย {['ก', 'ข', 'ค', 'ง'][d.correctAnswer]})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Score Action */}
                      <Button
                        onClick={handleSaveScannedResult}
                        disabled={saveSubmissionMutation.isPending}
                        className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        บันทึกผลคะแนนลงฐานข้อมูล
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground text-xs space-y-2">
                      <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p>ยังไม่มีผลการตรวจ</p>
                      <p className="text-[11px]">ถ่ายภาพกระดาษคำตอบทางด้านซ้ายเพื่อดูคะแนน</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 5: สถิติและรายงานผลสอบ (Results Dashboard)
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="results" className="space-y-6 mt-6">
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    ประวัติผลการสอบและการวิเคราะห์คุณภาพ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    รวมผลการสอบทั้งจากระบบออนไลน์ ตรวจ OMR และการวิเคราะห์คุณภาพข้อสอบรายข้อ (Item Analysis)
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleExportPpor5}
                    disabled={!filteredSubmissions.length}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    title="ส่งออกผลคะแนนเป็นแบบบันทึกคะแนน ปพ.5 (.xlsx) พร้อมวิเคราะห์ข้อสอบ"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    ส่งออก ปพ.5 (.xlsx)
                  </Button>
                  <Button
                    onClick={exportCSV}
                    disabled={!filteredSubmissions.length}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ส่งออก CSV
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* View Mode & Exam Set Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2.5">
                    <Label className="text-xs whitespace-nowrap font-medium">ชุดข้อสอบ:</Label>
                    <Select
                      value={selectedAnalysisSetId || 'all'}
                      onValueChange={(val) => setSelectedAnalysisSetId(val === 'all' ? '' : val)}
                    >
                      <SelectTrigger className="w-64 sm:w-72 h-8 text-xs">
                        <SelectValue placeholder="— ทุกชุดข้อสอบ (เฉพาะที่เปิดสอบ) —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">— ทุกชุดข้อสอบ (เฉพาะที่เปิดสอบ) —</SelectItem>
                        {activeExamSets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title} ({s.subject} · {s.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sub-view switcher: List vs Analysis vs Competency */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant={resultsViewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setResultsViewMode('list')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ตารางคะแนนนักเรียน
                    </Button>
                    <Button
                      variant={resultsViewMode === 'competency' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setResultsViewMode('competency')}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      สมรรถนะรายสาระ (Competency)
                    </Button>
                    <Button
                      variant={resultsViewMode === 'analysis' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setResultsViewMode('analysis')}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      วิเคราะห์ข้อสอบ (Item Analysis)
                    </Button>
                  </div>
                </div>

                {/* Sub-view Content: Competency vs Analysis vs List */}
                {resultsViewMode === 'competency' ? (
                  (() => {
                    const targetSet =
                      activeExamSets.find((s) => s.id === selectedAnalysisSetId) ||
                      (activeExamSets.length > 0 ? activeExamSets[0] : null);

                    if (!targetSet) {
                      return (
                        <div className="text-center py-20 text-muted-foreground text-xs">
                          ยังไม่มีชุดข้อสอบที่เปิดใช้งานในระบบ กรุณาสร้างหรือเปิดใช้งานชุดข้อสอบก่อนเพื่อดูการวิเคราะห์สมรรถนะ
                        </div>
                      );
                    }

                    const targetSubmissions = selectedAnalysisSetId
                      ? filteredSubmissions.filter((s) => s.exam_set_id === selectedAnalysisSetId)
                      : filteredSubmissions;

                    return (
                      <ExamClassCompetencyView
                        examSet={targetSet}
                        submissions={targetSubmissions}
                        onBack={() => setResultsViewMode('list')}
                      />
                    );
                  })()
                ) : resultsViewMode === 'analysis' ? (
                  (() => {
                    const targetSet =
                      activeExamSets.find((s) => s.id === selectedAnalysisSetId) ||
                      (activeExamSets.length > 0 ? activeExamSets[0] : null);

                    if (!targetSet) {
                      return (
                        <div className="text-center py-20 text-muted-foreground text-xs">
                          ยังไม่มีชุดข้อสอบที่เปิดใช้งานในระบบ กรุณาสร้างหรือเปิดใช้งานชุดข้อสอบก่อนเพื่อดูการวิเคราะห์คุณภาพ
                        </div>
                      );
                    }

                    const targetSubmissions = filteredSubmissions.filter((s) => s.exam_set_id === targetSet.id);

                    return (
                      <ExamItemAnalysisView
                        examSet={targetSet}
                        submissions={targetSubmissions}
                        onBack={() => setResultsViewMode('list')}
                      />
                    );
                  })()
                ) : (
                  (() => {
                    if (loadingSubmissions) {
                      return <div className="text-center py-12 text-xs text-muted-foreground">กำลังโหลดผลสอบ...</div>;
                    }

                    if (filteredSubmissions.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground text-xs">
                          {selectedAnalysisSetId
                            ? 'ยังไม่มีข้อมูลผลการสอบสำหรับชุดข้อสอบนี้'
                            : 'ยังไม่มีข้อมูลผลการสอบในระบบ'}
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">นักเรียน</th>
                              <th className="py-2.5 px-3">ชั้น / เลขที่</th>
                              <th className="py-2.5 px-3">คะแนน</th>
                              <th className="py-2.5 px-3">ร้อยละ</th>
                              <th className="py-2.5 px-3">ผลสอบ</th>
                              <th className="py-2.5 px-3">สถานะตรวจ</th>
                              <th className="py-2.5 px-3">ช่องทาง</th>
                              <th className="py-2.5 px-3">วันที่สอบ</th>
                              <th className="py-2.5 px-3 text-right">การจัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {filteredSubmissions.map((sub, idx) => {
                              const foundSet = activeExamSets.find((s) => s.id === sub.exam_set_id);
                              const setQuestions = (Array.isArray(foundSet?.questions) ? foundSet?.questions : []) as any[];
                              const hasEssay = setQuestions.some((q) => q.question_type === 'essay');

                              return (
                                <tr key={sub.id} className="hover:bg-muted/20">
                                  <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                                  <td className="py-2 px-3 font-medium flex items-center gap-2">
                                    <PersonAvatar name={sub.student_name} photoUrl={null} className="h-6 w-6 text-[10px]" />
                                    <span>{sub.student_name}</span>
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {sub.student_class} (เลขที่ {sub.student_no ?? '-'})
                                  </td>
                                  <td className="py-2 px-3 font-semibold">
                                    {sub.score}/{sub.max_score}
                                  </td>
                                  <td className="py-2 px-3">{sub.percentage}%</td>
                                  <td className="py-2 px-3">
                                    {sub.passed ? (
                                      <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 text-[10px]">ผ่าน</Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-[10px]">ไม่ผ่าน</Badge>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    {sub.review_status === 'pending_review' ? (
                                      <Badge className="bg-amber-500/10 text-amber-800 border-amber-300 text-[10px] gap-1">
                                        <Clock className="h-2.5 w-2.5" /> รอตรวจอัตนัย
                                      </Badge>
                                    ) : sub.review_status === 'reviewed' || sub.review_status === 'completed' ? (
                                      <Badge className="bg-emerald-500/10 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5" /> ตรวจครบแล้ว
                                      </Badge>
                                    ) : hasEssay ? (
                                      <Badge variant="outline" className="text-[10px]">มีอัตนัย</Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-[11px]">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <Badge variant="outline" className="text-[10px]">
                                      {sub.submission_mode === 'online' ? 'ออนไลน์' : 'สแกน OMR'}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-muted-foreground text-[11px]">
                                    {new Date(sub.created_at).toLocaleDateString('th-TH')}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {hasEssay && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`h-6 text-[10px] gap-1 ${
                                            sub.review_status === 'pending_review'
                                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100'
                                              : 'border-muted-foreground/30 text-foreground hover:bg-muted/30'
                                          }`}
                                          onClick={() => handleOpenEssayGrading(sub)}
                                        >
                                          <PenLine className="h-2.5 w-2.5" />
                                          {sub.review_status === 'pending_review' ? 'ตรวจอัตนัย (รอตรวจ)' : 'ตรวจอัตนัย'}
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                        onClick={() => {
                                          if (foundSet) {
                                            setDiagnosticSubmission(sub);
                                            setDiagnosticExamSet(foundSet);
                                            setDiagnosticModalOpen(true);
                                          } else {
                                            toast({ title: 'ไม่พบชุดข้อสอบ', variant: 'destructive' });
                                          }
                                        }}
                                      >
                                        <Target className="h-2.5 w-2.5" />
                                        วินิจฉัยสมรรถนะ
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cart Review Dialog */}
        <Dialog open={showCartReview} onOpenChange={setShowCartReview}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
            <DialogHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    ตรวจทานข้อสอบที่เลือกในชุด ({selectedQuestionsDetails.length} ข้อ)
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    ตรวจสอบความถูกต้อง ลำดับโจทย์ หรือนำข้อที่ไม่ต้องการออกจากชุดข้อสอบ
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-300">ง่าย {difficultyStats.easy}</Badge>
                  <Badge variant="outline" className="text-blue-700 bg-blue-500/10 border-blue-300">ปานกลาง {difficultyStats.medium}</Badge>
                  <Badge variant="outline" className="text-purple-700 bg-purple-500/10 border-purple-300">ยาก {difficultyStats.hard}</Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
              {selectedQuestionsDetails.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  ยังไม่ได้เลือกข้อสอบใดๆ เข้าสู่ชุดข้อสอบ
                </div>
              ) : (
                selectedQuestionsDetails.map((q, idx) => {
                  const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
                  return (
                    <div key={q.id} className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">ข้อที่ {idx + 1}</span>
                            {q.topic && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                                {q.topic}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                q.difficulty === 'easy'
                                  ? 'text-emerald-700 border-emerald-300 bg-emerald-500/10'
                                  : q.difficulty === 'hard'
                                  ? 'text-purple-700 border-purple-300 bg-purple-500/10'
                                  : 'text-blue-700 border-blue-300 bg-blue-500/10'
                              }`}
                            >
                              {q.difficulty === 'easy' ? 'ง่าย' : q.difficulty === 'hard' ? 'ยาก' : 'ปานกลาง'}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">{q.question_text}</p>
                          {Boolean(q.media_image_url) && (
                            <div className="mt-1 flex items-center gap-2 p-1 bg-muted/20 border border-border rounded w-fit">
                              <img
                                src={String(q.media_image_url)}
                                alt="ภาพประกอบ"
                                className="h-9 w-9 object-contain rounded bg-card border border-border shrink-0"
                              />
                              <span className="text-[10px] text-muted-foreground">{String(q.media_title || '')}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedQIds(selectedQIds.filter((id) => id !== q.id))}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          title="นำข้อนี้ออกจากชุด"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {opts.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          {opts.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1 px-2 rounded ${
                                oIdx === q.answer
                                  ? 'bg-emerald-500/15 text-emerald-800 font-semibold border border-emerald-300'
                                  : 'text-muted-foreground bg-muted/20'
                              }`}
                            >
                              {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="text-[10px] text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40">
                          💡 <span className="font-semibold text-foreground">เฉลย:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border flex justify-between sm:justify-between items-center">
              <span className="text-xs text-muted-foreground">
                รวมทั้งหมด <strong className="text-foreground">{selectedQuestionsDetails.length}</strong> ข้อ
              </span>
              <Button size="sm" onClick={() => setShowCartReview(false)} className="text-xs">
                ปิดหน้าต่างตรวจทาน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Incomplete Set Confirmation Dialog */}
        <Dialog open={showIncompleteConfirm} onOpenChange={setShowIncompleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                ข้อสอบยังไม่ครบตามเป้าหมาย
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-2 text-xs text-foreground">
                <p>
                  ชุดข้อสอบนี้มีเพียง <span className="font-bold text-amber-700">{selectedQIds.length} ข้อ</span> จากเป้าหมายที่ตั้งไว้ <span className="font-bold text-primary">{targetQuestionCount} ข้อ</span> (ยังขาดอีก {targetQuestionCount - selectedQIds.length} ข้อ)
                </p>
                <p className="text-muted-foreground">
                  ท่านต้องการให้ระบบสุ่มเติมข้อสอบให้ครบ {targetQuestionCount} ข้อก่อนบันทึก หรือต้องการบันทึกเพียงเท่านี้?
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIncompleteConfirm(false)}
                className="text-xs"
              >
                กลับไปเลือกต่อ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowIncompleteConfirm(false);
                  handleBuildSet(true);
                }}
                className="text-xs"
              >
                บันทึก {selectedQIds.length} ข้อตามนี้
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowIncompleteConfirm(false);
                  handleFillRemaining();
                  setTimeout(() => handleBuildSet(true), 150);
                }}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1"
              >
                <Zap className="h-3.5 w-3.5 fill-white" />
                สุ่มเติมให้ครบ {targetQuestionCount} ข้อ แล้วบันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Set Confirmation Dialog */}
        <Dialog open={!!deleteSetConfirmId} onOpenChange={(open) => !open && setDeleteSetConfirmId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                ยืนยันการลบชุดข้อสอบ
              </DialogTitle>
              <DialogDescription className="pt-2 text-xs">
                ท่านแน่ใจหรือไม่ว่าต้องการลบชุดข้อสอบนี้? ข้อมูลชุดข้อสอบจะถูกนำออกจากระบบและไม่สามารถกู้คืนได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteSetConfirmId(null)}
                className="text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteSetMutation.isPending}
                onClick={() => {
                  if (deleteSetConfirmId) {
                    deleteSetMutation.mutate(deleteSetConfirmId);
                  }
                }}
                className="text-xs"
              >
                {deleteSetMutation.isPending ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Diagnostic & Remediation Modal */}
        <ExamStudentDiagnosticModal
          isOpen={diagnosticModalOpen}
          onClose={() => {
            setDiagnosticModalOpen(false);
            setDiagnosticSubmission(null);
            setDiagnosticExamSet(null);
          }}
          submission={diagnosticSubmission}
          examSet={diagnosticExamSet}
        />

        {/* Batch OMR Scanner Modal */}
        <BatchOMRScannerModal
          isOpen={batchScannerOpen}
          onClose={() => setBatchScannerOpen(false)}
          examSets={examSets}
          initialExamSetId={scannerExamSetId || (examSets.length > 0 ? examSets[0].id : '')}
          students={students}
          onSaveBatchSubmissions={handleSaveBatchSubmissions}
        />

        {/* Essay Grading Dialog */}
        <Dialog open={essayGradingModalOpen} onOpenChange={setEssayGradingModalOpen}>
          <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-6">
            <DialogHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-primary" />
                    ตรวจและให้คะแนนข้อสอบอัตนัย (Essay Grading)
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    ประเมินคำตอบของนักเรียนตามเกณฑ์รูบริก (Rubric) และแนวคำตอบที่กำหนด พร้อมบันทึกข้อเสนอแนะ
                  </DialogDescription>
                </div>
                {gradingSubmission && (
                  <Badge variant="outline" className="text-xs font-semibold py-1 px-2.5 self-start sm:self-auto">
                    คะแนนเดิม: {gradingSubmission.score}/{gradingSubmission.max_score} ({gradingSubmission.percentage}%)
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {gradingSubmission && gradingExamSet && (
              <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
                {/* Student header bar */}
                <div className="p-3.5 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar name={gradingSubmission.student_name} photoUrl={null} className="h-8 w-8 text-xs" />
                    <div>
                      <div className="font-bold text-sm text-foreground">{gradingSubmission.student_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        ชั้น {gradingSubmission.student_class} · เลขที่ {gradingSubmission.student_no ?? '-'} · ชุดข้อสอบ: {gradingExamSet.title}
                      </div>
                    </div>
                  </div>
                  <Badge className={gradingSubmission.review_status === 'pending_review' ? 'bg-amber-500/10 text-amber-800 border-amber-300' : 'bg-emerald-500/10 text-emerald-800 border-emerald-300'}>
                    {gradingSubmission.review_status === 'pending_review' ? 'รอตรวจ' : 'ตรวจแล้ว'}
                  </Badge>
                </div>

                {/* Essay Questions List */}
                {(() => {
                  const questionsList = (Array.isArray(gradingExamSet.questions) ? gradingExamSet.questions : []) as Array<Record<string, unknown>>;
                  const essayQuestions = questionsList
                    .map((q, idx) => ({ ...q, originalIndex: idx }))
                    .filter((q) => q.question_type === 'essay');
                  const studentAnswers = (gradingSubmission.answers as Record<string, unknown>) || {};

                  if (!essayQuestions.length) {
                    return (
                      <div className="text-center py-10 text-muted-foreground text-xs">
                        ชุดข้อสอบนี้ไม่มีข้อสอบอัตนัย
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {essayQuestions.map((q, qIndex) => {
                        const originalIdx = q.originalIndex as number;
                        const studentAnswer = studentAnswers[originalIdx];
                        const points = Number(q.points) > 0 ? Number(q.points) : 5;
                        const currentScore = essayScores[originalIdx] !== undefined ? essayScores[originalIdx] : 0;
                        const rubricData = q.rubric as EssayRubric | undefined;

                        return (
                          <Card key={originalIdx} className="border-border shadow-xs overflow-hidden">
                            <CardHeader className="p-4 bg-muted/20 border-b border-border">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                      {originalIdx + 1}
                                    </span>
                                    <span className="font-bold text-xs text-foreground">
                                      ข้อสอบอัตนัยข้อที่ {qIndex + 1} (ข้อที่ {originalIdx + 1} ของชุด)
                                    </span>
                                    <Badge variant="outline" className="text-[10px] bg-card">
                                      เต็ม {points} คะแนน
                                    </Badge>
                                    {Boolean(q.indicator_code) && (
                                      <Badge variant="outline" className="text-[10px] text-muted-foreground bg-card">
                                        🎯 {String(q.indicator_code)}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-foreground leading-relaxed pt-1">
                                    {String(q.question_text || q.question || '')}
                                  </p>
                                </div>
                              </div>

                              {/* Media Reference Image if available */}
                              {Boolean(q.media_image_url) && (
                                <div className="mt-2.5 p-2 bg-card border border-border rounded-lg flex items-center gap-3">
                                  <img
                                    src={String(q.media_image_url)}
                                    alt={String(q.media_title || 'สื่ออ้างอิง')}
                                    className="h-16 w-24 object-cover rounded border border-border"
                                  />
                                  <div className="text-[11px] text-muted-foreground">
                                    <div className="font-semibold text-foreground">สื่อประกอบ: {String(q.media_title || '')}</div>
                                    <div>ข้อสอบเชื่อมโยงกับบทเรียนจากสื่อการสอนประจำ</div>
                                  </div>
                                </div>
                              )}
                            </CardHeader>

                            <CardContent className="p-4 space-y-3.5">
                              {/* Student's Answer Box */}
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  คำตอบที่นักเรียนเขียนส่ง:
                                </Label>
                                <div className="p-3 bg-muted/30 border border-border rounded-xl text-xs whitespace-pre-wrap leading-relaxed min-h-[50px] font-sans">
                                  {studentAnswer ? (
                                    <span className="text-foreground">{String(studentAnswer)}</span>
                                  ) : (
                                    <span className="text-muted-foreground italic">(นักเรียนไม่ได้กรอกคำตอบข้อนี้)</span>
                                  )}
                                </div>
                              </div>

                              {/* Reference Answer & Rubric Criteria */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {/* Left: Reference Answer / Model Answer */}
                                <div className="p-3 bg-card border border-border rounded-xl space-y-1.5">
                                  <div className="text-[11px] font-semibold text-muted-foreground">
                                    💡 แนวคำตอบที่ถูกต้อง / หลักคิดสำคัญ:
                                  </div>
                                  <div className="text-xs text-foreground leading-relaxed">
                                    {String(q.answer || 'ดูเกณฑ์การให้คะแนนตาม Rubric ด้านขวา')}
                                  </div>
                                </div>

                                {/* Right: Rubric Criteria */}
                                <div className="p-3 bg-card border border-border rounded-xl space-y-1.5">
                                  <div className="text-[11px] font-semibold text-muted-foreground">
                                    📋 เกณฑ์การตรวจประเมิน (Rubric):
                                  </div>
                                  {rubricData?.criteria && Array.isArray(rubricData.criteria) && rubricData.criteria.length > 0 ? (
                                    <div className="space-y-1 text-xs">
                                      {rubricData.criteria.map((c, cIdx: number) => (
                                        <div key={cIdx} className="flex justify-between items-start gap-2 border-b border-border/40 pb-1 last:border-0">
                                          <span className="text-muted-foreground text-[11px]">{c.name}: {c.description}</span>
                                          <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                                            {c.points} คะแนน
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-muted-foreground">
                                      ประเมินความถูกต้องของเนื้อหา ความสมบูรณ์ของวิธีคิด และเหตุผลประกอบ (เต็ม {points} คะแนน)
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Score Input Box */}
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
                                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                  คะแนนที่ให้ในข้อนี้ (0 ถึง {points} คะแนน):
                                </Label>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {[...Array(points + 1)].map((_, pt) => (
                                      <button
                                        key={pt}
                                        type="button"
                                        onClick={() => setEssayScores((prev) => ({ ...prev, [originalIdx]: pt }))}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                          currentScore === pt
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-card border border-border hover:bg-muted/40 text-foreground'
                                        }`}
                                      >
                                        {pt}
                                      </button>
                                    ))}
                                  </div>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={points}
                                    value={currentScore}
                                    onChange={(e) => {
                                      const val = Math.min(points, Math.max(0, Number(e.target.value) || 0));
                                      setEssayScores((prev) => ({ ...prev, [originalIdx]: val }));
                                    }}
                                    className="w-16 h-8 text-xs font-bold text-center bg-card"
                                  />
                                  <span className="text-xs text-muted-foreground font-semibold">/{points}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Overall Teacher Feedback */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    ข้อเสนอแนะและคำแนะนำจากคุณครู (Teacher Feedback):
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="พิมพ์คำแนะนำ เช่น แสดงวิธีคิดได้ชัดเจนมาก ควรระวังเรื่องการแปลงหน่วย หรือ คำอธิบายมีเหตุผลสมบูรณ์ดี..."
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    className="text-xs bg-card border-border leading-relaxed"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-muted-foreground">
                ตรวจครบแล้วกดบันทึกเพื่ออัปเดตคะแนนรวมของนักเรียน
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEssayGradingModalOpen(false)}
                  disabled={isSavingGrading}
                  className="text-xs h-9"
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEssayGrading}
                  disabled={isSavingGrading}
                  className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSavingGrading ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจอัตนัย'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RolePortalLayout>
  );
}

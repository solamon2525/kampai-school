/**
 * TeacherExamManagement.tsx
 * ระบบบริหารจัดการข้อสอบ คลังข้อสอบ และการตรวจ OMR สำหรับครูและบุคลากร
 * รองรับ: AI ออกข้อสอบ, คลังข้อสอบ, จัดชุดข้อสอบ, พิมพ์ A4/OMR, สแกนด้วยกล้องมือถือ, และรายงานผลสอบ
 */
import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Camera, Printer, BarChart3, Trash2, CheckCircle2,
  Sparkles, CheckSquare, RefreshCw, Download, Layers, UserCheck
} from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from './teacher-menu';
import { examService, type ExamSetRow } from '@/services/exam.service';
import { studentsService } from '@/services/students.service';
import { omrScannerService, type OMRGradingSummary, type QuestionToGrade } from '@/services/omr-scanner.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { PrintableExamPaper } from '@/components/exam/PrintableExamPaper';
import { PrintableOMRSheet } from '@/components/exam/PrintableOMRSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV } from '@/lib/export';
import type { Json, TablesInsert } from '@/integrations/supabase/types';

interface AIParsedQuestion {
  question_text: string;
  options: string[];
  answer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const SUBJECT_LIST = [
  'คณิตศาสตร์', 'ภาษาไทย', 'วิทยาศาสตร์', 'สังคมศึกษา',
  'ภาษาอังกฤษ', 'ประวัติศาสตร์', 'สุขศึกษา', 'ศิลปะ',
  'การงานอาชีพ', 'ต้านทุจริต'
];

const GRADE_LIST = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function TeacherExamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'bank' | 'sets' | 'print' | 'scanner' | 'results'>('bank');

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('ป.5');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Generator state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiBloom] = useState<string>('auto');

  // Manual Question state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQAns, setNewQAns] = useState<number>(0);

  // Selected questions for building set
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetTime, setNewSetTime] = useState(60);
  const [newSetPin, setNewSetPin] = useState('');

  // Print Preview state
  const [previewExamSet, setPreviewExamSet] = useState<ExamSetRow | null>(null);
  const [printMode, setPrintMode] = useState<'paper' | 'omr'>('paper');

  // OMR Scanner state
  const [scannerExamSetId, setScannerExamSetId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzingOMR, setAnalyzingOMR] = useState(false);
  const [omrSummary, setOmrSummary] = useState<OMRGradingSummary | null>(null);
  const [scannedStudentNo, setScannedStudentNo] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [omrStudentClass, setOmrStudentClass] = useState<string>('ป.5');

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
    },
    onError: (e: Error) => {
      toast({ title: 'ข้อผิดพลาด', description: e.message, variant: 'destructive' });
    },
  });

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

    setAiGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCsxMZYnRMne29x52Eyg4VCYGZCBRJ8POw';
      const prompt = `คุณคือผู้เชี่ยวชาญการออกข้อสอบระดับประถมศึกษาไทย
กรุณาสร้างข้อสอบวิชา ${selectedSubject} ระดับชั้น ${selectedGrade}
หัวข้อ: ${aiTopic}
จำนวน: ${aiCount} ข้อ
ระดับความยาก: ${aiDifficulty}
ระดับ Bloom's Taxonomy: ${aiBloom}

รูปแบบคำถาม: ปรนัย 4 ตัวเลือก (ก, ข, ค, ง)
ตอบเป็น JSON เท่านั้นในรูปแบบอาเรย์ของออบเจกต์:
[
  {
    "question_text": "คำถาม...",
    "options": ["ตัวเลือก ก", "ตัวเลือก ข", "ตัวเลือก ค", "ตัวเลือก ง"],
    "answer": 0, // ดัชนีเฉลย 0=ก, 1=ข, 2=ค, 3=ง
    "explanation": "คำอธิบายเฉลย...",
    "difficulty": "${aiDifficulty}"
  }
]
ห้ามมี markdown block ส่งเฉพาะ JSON string`;

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

      const rowsToInsert: TablesInsert<'exam_questions'>[] = parsedItems.map((item) => ({
        subject: selectedSubject,
        grade: selectedGrade,
        topic: aiTopic,
        difficulty: item.difficulty || aiDifficulty,
        question_type: 'mcq',
        question_text: item.question_text,
        options: item.options || [],
        answer: typeof item.answer === 'number' ? item.answer : 0,
        explanation: item.explanation || '',
      }));

      await examService.createQuestionsBulk(rowsToInsert);
      queryClient.invalidateQueries({ queryKey: ['exam_questions'] });
      toast({ title: 'สร้างข้อสอบสำเร็จ!', description: `AI สร้างข้อสอบ ${rowsToInsert.length} ข้อลงในคลังเรียบร้อยแล้ว` });
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
    });
  };

  // ── Build Exam Set ──
  const handleBuildSet = () => {
    if (!newSetTitle.trim()) {
      toast({ title: 'กรุณาระบุชื่อชุดข้อสอบ', variant: 'destructive' });
      return;
    }
    if (!selectedQIds.length) {
      toast({ title: 'กรุณาเลือกข้อสอบอย่างน้อย 1 ข้อ', variant: 'destructive' });
      return;
    }

    const setQuestions = questions.filter((q) => selectedQIds.includes(q.id));
    createSetMutation.mutate({
      title: newSetTitle.trim(),
      subject: selectedSubject !== 'all' ? selectedSubject : 'ทั่วไป',
      grade: selectedGrade !== 'all' ? selectedGrade : 'ป.5',
      time_limit_minutes: newSetTime,
      pass_threshold_pct: 50,
      pin_code: newSetPin.trim() ? newSetPin.trim().toUpperCase() : null,
      questions: setQuestions as unknown as Json,
      is_active: true,
    });
  };

  // Export Results
  const exportCSV = () => {
    if (!submissions.length) return;
    const rows = submissions.map((s, idx) => ({
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
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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
            {/* AI Generator Panel */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary font-bold">
                  <Sparkles className="h-4 w-4" />
                  AI ช่วยสร้างข้อสอบอัตโนมัติ (Google Gemini / Claude)
                </CardTitle>
                <CardDescription className="text-xs">
                  ระบุหัวข้อที่ต้องการ AI จะช่วยสร้างข้อสอบปรนัยพร้อมตัวเลือกและเฉลยให้ทันที
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">หัวข้อ / บทเรียน</Label>
                    <Input
                      placeholder="เช่น การสังเคราะห์ด้วยแสง, ระบบสุริยะ, เศษส่วน..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">จำนวนข้อ</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-xs">ระดับความยาก</Label>
                    <Select value={aiDifficulty} onValueChange={(v) => setAiDifficulty(v as 'easy' | 'medium' | 'hard')}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">ง่าย (ความจำ)</SelectItem>
                        <SelectItem value="medium">ปานกลาง (เข้าใจ)</SelectItem>
                        <SelectItem value="hard">ยาก (วิเคราะห์)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[11px] text-muted-foreground">
                    สร้างสำหรับ: <span className="font-semibold text-foreground">{selectedSubject}</span> ({selectedGrade})
                  </div>
                  <Button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating}
                    size="sm"
                    className="gap-2 text-xs"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        กำลังสร้างข้อสอบ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        สร้างข้อสอบด้วย AI
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List & Cart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question Bank Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm">รายการข้อสอบในคลัง</h2>
                    <Badge variant="secondary" className="text-xs">{questions.length} ข้อ</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="ค้นหาข้อสอบ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 h-8 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(!showAddModal)}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มเอง
                    </Button>
                  </div>
                </div>

                {/* Add Manual Form Modal */}
                {showAddModal && (
                  <Card className="border-border p-4 bg-muted/20 space-y-3">
                    <div className="font-semibold text-xs flex justify-between items-center">
                      <span>เพิ่มข้อสอบด้วยตนเอง</span>
                      <button onClick={() => setShowAddModal(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                    <Textarea
                      placeholder="พิมพ์โจทย์คำถาม..."
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
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
                            className="h-7 text-xs flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span>เฉลยข้อ:</span>
                        <Select value={String(newQAns)} onValueChange={(v) => setNewQAns(Number(v))}>
                          <SelectTrigger className="w-20 h-7 text-xs">
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
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newQText.trim()) return;
                          createQMutation.mutate({
                            subject: selectedSubject !== 'all' ? selectedSubject : 'ทั่วไป',
                            grade: selectedGrade !== 'all' ? selectedGrade : 'ป.5',
                            question_type: 'mcq',
                            question_text: newQText.trim(),
                            options: newQOpts,
                            answer: newQAns,
                          });
                        }}
                        className="h-7 text-xs"
                      >
                        บันทึกข้อสอบ
                      </Button>
                    </div>
                  </Card>
                )}

                {/* List items */}
                {loadingQ ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">กำลังโหลดข้อสอบ...</div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-muted/10">
                    <p className="text-sm font-semibold text-muted-foreground">ยังไม่มีข้อสอบในหมวดนี้</p>
                    <p className="text-xs text-muted-foreground mt-1">ใช้ AI สร้าง หรือกดปุ่ม "เพิ่มเอง" ด้านบนได้เลย</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => {
                      const isSelected = selectedQIds.includes(q.id);
                      const opts = Array.isArray(q.options) ? (q.options as string[]) : [];

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQIds([...selectedQIds, q.id]);
                                  } else {
                                    setSelectedQIds(selectedQIds.filter((id) => id !== q.id));
                                  }
                                }}
                                className="mt-1 rounded border-border"
                              />
                              <div className="space-y-1 flex-1">
                                <div className="text-xs font-medium leading-relaxed">
                                  <span className="font-bold text-muted-foreground mr-1.5">{idx + 1}.</span>
                                  {q.question_text}
                                </div>
                                {q.question_type === 'mcq' && opts.length > 0 && (
                                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-muted-foreground">
                                    {opts.map((opt, oIdx) => (
                                      <div
                                        key={oIdx}
                                        className={oIdx === q.answer ? 'font-bold text-green-600' : ''}
                                      >
                                        {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQMutation.mutate(q.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
                      <Badge variant="secondary" className="text-xs">
                        เลือกแล้ว {selectedQIds.length} ข้อ
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      เลือกข้อสอบจากด้านซ้ายเพื่อนำมารวมเป็นชุดข้อสอบใหม่
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs">ชื่อชุดข้อสอบ</Label>
                      <Input
                        placeholder="เช่น ข้อสอบปลายภาค วิทยาศาสตร์ ป.5"
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
                        <Label className="text-[11px]">รหัส PIN สำหรับเข้าสอบ</Label>
                        <Input
                          placeholder="เช่น SCI501"
                          value={newSetPin}
                          onChange={(e) => setNewSetPin(e.target.value)}
                          className="h-8 text-xs uppercase"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleBuildSet}
                      disabled={createSetMutation.isPending || !selectedQIds.length}
                      className="w-full text-xs h-9"
                    >
                      <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                      บันทึกชุดข้อสอบ
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingSets ? (
                <div className="col-span-full text-center py-12 text-xs text-muted-foreground">กำลังโหลดชุดข้อสอบ...</div>
              ) : examSets.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed rounded-xl p-8 bg-muted/10">
                  <p className="text-sm font-semibold text-muted-foreground">ยังไม่มีชุดข้อสอบ</p>
                  <p className="text-xs text-muted-foreground mt-1">ไปที่แท็บ "คลังข้อสอบ" เพื่อเลือกข้อสอบและสร้างชุดข้อสอบ</p>
                </div>
              ) : (
                examSets.map((set) => {
                  const qCount = Array.isArray(set.questions) ? set.questions.length : 0;

                  return (
                    <Card key={set.id} className="border-border hover:border-primary/50 transition-shadow shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <Badge variant="outline" className="text-[10px]">{set.subject} · {set.grade}</Badge>
                          {set.pin_code && (
                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 text-[10px]">
                              PIN: {set.pin_code}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm font-bold mt-1 line-clamp-1">{set.title}</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
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

                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/60">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1"
                            onClick={() => {
                              setPreviewExamSet(set);
                              setActiveTab('print');
                            }}
                          >
                            <Printer className="h-3 w-3" />
                            พิมพ์ A4
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700"
                            onClick={() => {
                              setScannerExamSetId(set.id);
                              setActiveTab('scanner');
                            }}
                          >
                            <Camera className="h-3 w-3" />
                            สแกนตรวจ
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
                    variant={printMode === 'paper' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPrintMode('paper')}
                  >
                    ข้อสอบกระดาษ
                  </Button>
                  <Button
                    variant={printMode === 'omr' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPrintMode('omr')}
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
                <div className="flex items-center gap-3">
                  <Label className="text-xs whitespace-nowrap">เลือกชุดข้อสอบที่จะพิมพ์:</Label>
                  <Select
                    value={previewExamSet?.id || ''}
                    onValueChange={(val) => {
                      const found = examSets.find((s) => s.id === val);
                      if (found) setPreviewExamSet(found);
                    }}
                  >
                    <SelectTrigger className="w-72 h-8 text-xs">
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

                {/* Print Preview Container */}
                <div className="border border-border/80 rounded-xl p-6 bg-card min-h-[500px] shadow-inner overflow-x-auto">
                  {previewExamSet ? (
                    printMode === 'paper' ? (
                      <PrintableExamPaper examSet={previewExamSet} />
                    ) : (
                      <PrintableOMRSheet examSet={previewExamSet} />
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
                        📁 เลือกรูปถ่าย
                      </span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

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
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    ประวัติผลการสอบของนักเรียน
                  </CardTitle>
                  <CardDescription className="text-xs">
                    รวมผลการสอบทั้งจากระบบออนไลน์และจากการตรวจ OMR ด้วยกล้องมือถือ
                  </CardDescription>
                </div>

                <Button
                  onClick={exportCSV}
                  disabled={!submissions.length}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  ส่งออก Excel / CSV
                </Button>
              </CardHeader>

              <CardContent>
                {loadingSubmissions ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">กำลังโหลดผลสอบ...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    ยังไม่มีข้อมูลผลการสอบในระบบ
                  </div>
                ) : (
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
                          <th className="py-2.5 px-3">ช่องทาง</th>
                          <th className="py-2.5 px-3">วันที่สอบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {submissions.map((sub, idx) => (
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
                              <Badge variant="outline" className="text-[10px]">
                                {sub.submission_mode === 'online' ? 'ออนไลน์' : 'สแกน OMR'}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-[11px]">
                              {new Date(sub.created_at).toLocaleDateString('th-TH')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RolePortalLayout>
  );
}

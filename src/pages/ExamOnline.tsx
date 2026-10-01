/**
 * ExamOnline.tsx
 * ระบบสอบออนไลน์สำหรับนักเรียน โรงเรียนบ้านคำไผ่
 * รองรับการใส่รหัส PIN, ดึงรายชื่อนักเรียนจากฐานข้อมูลจริงพร้อม Avatar, จับเวลา, และตรวจคะแนนทันที
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Clock, CheckCircle2, ShieldCheck, BookOpen, Send, PenLine, FileText, AlertCircle, Shuffle,
  Volume2, VolumeX
} from 'lucide-react';
import { examService, type ExamSetRow } from '@/services/exam.service';
import { studentsService, type StudentMin } from '@/services/students.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import { speakThai, stopThaiSpeech, thaiNumberToWords } from '@/lib/thaiSpeech';

interface QuestionItem {
  id?: string;
  question_text?: string;
  question?: string;
  question_type?: 'mcq' | 'truefalse' | 'fillin' | 'matching' | 'essay';
  options?: string[];
  answer?: number | string | boolean;
  accepted_answers?: string[];
  rubric?: Record<string, unknown> | null;
  points?: number;
  indicator_code?: string;
  media_title?: string;
  media_image_url?: string;
}

interface RandomizedQuestionItem extends QuestionItem {
  _originalQuestionIndex: number;
  _optionsMapping?: number[]; // displayed choice index -> original choice index
}

/**
 * Fisher-Yates (Knuth) Shuffle อัลกอริทึม
 * สลับตำแหน่งสมาชิกในอาร์เรย์แบบสุ่มอิสระสำหรับนักเรียนแต่ละคน
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * ปรับคำนำหน้าชื่อนักเรียนให้ออกเสียงภาษาไทยได้อย่างถูกต้องและเป็นธรรมชาติ
 */
function formatStudentNameForSpeech(rawName?: string | null): string {
  if (!rawName) return '';
  return rawName
    .replace(/^ด\.ช\.?\s*/i, 'เด็กชาย ')
    .replace(/^ด\.ญ\.?\s*/i, 'เด็กหญิง ')
    .replace(/^น\.ส\.?\s*/i, 'นางสาว ')
    .trim();
}

const GRADE_LIST = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function ExamOnline() {
  const { examSetId } = useParams<{ examSetId?: string }>();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const urlPin = searchParams.get('pin') || '';

  // Screen flow: 'pin' | 'student' | 'exam' | 'result'
  const [screen, setScreen] = useState<'pin' | 'student' | 'exam' | 'result'>('pin');

  // PIN / Set Selection
  const [pinCode, setPinCode] = useState(urlPin);
  const [selectedExamSet, setSelectedExamSet] = useState<ExamSetRow | null>(null);

  // Student Info
  const [selectedGrade, setSelectedGrade] = useState('ป.4');
  const [selectedStudent, setSelectedStudent] = useState<StudentMin | null>(null);

  // Exam Answers & Timer
  const [currentExamQuestions, setCurrentExamQuestions] = useState<RandomizedQuestionItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string | boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeTotal, setTimeTotal] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentSpeechSegmentsRef = useRef<string[]>([]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopThaiSpeech();
      setIsSpeaking(false);
    } else if (currentSpeechSegmentsRef.current.length > 0) {
      setIsSpeaking(true);
      void speakThai(currentSpeechSegmentsRef.current).then(() => {
        setIsSpeaking(false);
      });
    }
  };

  // Result state
  const [examResult, setExamResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    timeUsedFormatted: string;
    hasEssay: boolean;
    essayCount: number;
    reviewStatus: 'pending_review' | 'completed' | 'reviewed';
  } | null>(null);

  // ── Queries ──
  const { data: studentsInClass = [] } = useQuery({
    queryKey: ['students_roster', selectedGrade],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(selectedGrade);
      if (error) throw error;
      return (data || []) as StudentMin[];
    },
  });

  // If examSetId is provided in URL, load it directly if active
  useEffect(() => {
    if (examSetId) {
      examService.getExamSet(examSetId)
        .then((set) => {
          if (set && set.is_active) {
            setSelectedExamSet(set);
            setSelectedGrade(set.grade || 'ป.4');
            setScreen('student');
          } else {
            toast({
              title: 'ไม่พบชุดข้อสอบนี้',
              description: 'ชุดข้อสอบอาจถูกลบหรือปิดการใช้งานแล้ว กรุณากรอกรหัส PIN',
              variant: 'destructive',
            });
          }
        })
        .catch(() => {
          // If error loading, stay on PIN screen
        });
    }
  }, [examSetId, toast]);

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: examService.submitExam,
    onSuccess: () => {
      toast({ title: 'ส่งข้อสอบสำเร็จ', description: 'ระบบบันทึกผลคะแนนของคุณเรียบร้อยแล้ว' });
    },
    onError: (err: Error) => {
      toast({ title: 'ไม่สามารถบันทึกผลสอบได้', description: err.message, variant: 'destructive' });
    },
  });

  // ── PIN Verification ──
  const handleVerifyPIN = async () => {
    if (!pinCode.trim()) {
      toast({ title: 'กรุณากรอกรหัส PIN', variant: 'destructive' });
      return;
    }
    try {
      const found = await examService.getExamSetByPin(pinCode);
      if (!found || !found.is_active) {
        toast({
          title: 'รหัสสอบไม่ถูกต้องหรือชุดข้อสอบปิดการใช้งานแล้ว',
          description: 'กรุณาตรวจสอบรหัสสอบจากคุณครูอีกครั้ง',
          variant: 'destructive',
        });
        return;
      }
      setSelectedExamSet(found);
      setSelectedGrade(found.grade || 'ป.4');
      setScreen('student');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด';
      toast({ title: 'เกิดข้อผิดพลาด', description: msg, variant: 'destructive' });
    }
  };

  // ── Start Exam ──
  const handleStartExam = () => {
    if (!selectedStudent) {
      toast({ title: 'กรุณาเลือกชื่อนักเรียน', variant: 'destructive' });
      return;
    }
    if (!selectedExamSet) return;

    const rawQuestions: QuestionItem[] = Array.isArray(selectedExamSet.questions)
      ? (selectedExamSet.questions as QuestionItem[])
      : [];
    if (!rawQuestions.length) {
      toast({ title: 'ชุดข้อสอบนี้ยังไม่มีคำถาม', variant: 'destructive' });
      return;
    }

    // 1. สุ่มสลับตัวเลือกของแต่ละข้อสอบ (สำหรับปรนัย MCQ) พร้อมบันทึก mapping กลับไปยังต้นฉบับ
    const preparedQuestions: RandomizedQuestionItem[] = rawQuestions.map((q, origIdx) => {
      const qType = q.question_type || 'mcq';

      // ถ้าเป็นปรนัย (MCQ) และมีตัวเลือกมากกว่า 1 ตัวเลือก ให้สลับลำดับตัวเลือก
      if (qType === 'mcq' && Array.isArray(q.options) && q.options.length > 1) {
        const origOptions = q.options;
        const originalAnswerIdx = Number(q.answer);

        // นำตัวเลือกมาจับคู่กับ index เดิม
        const indexedOptions = origOptions.map((text, oIdx) => ({ text, originalIdx: oIdx }));
        const shuffledOpts = shuffleArray(indexedOptions);

        // คำนวณตำแหน่งเฉลยที่ถูกต้องในลำดับตัวเลือกใหม่
        let newAnswerIdx = shuffledOpts.findIndex((opt) => opt.originalIdx === originalAnswerIdx);
        // กรณีสำรอง: ถ้า q.answer เป็นข้อความตัวอักษรแทนดัชนีตัวเลข
        if (newAnswerIdx === -1 && typeof q.answer === 'string') {
          newAnswerIdx = shuffledOpts.findIndex((opt) => opt.text.trim() === String(q.answer).trim());
        }

        return {
          ...q,
          options: shuffledOpts.map((opt) => opt.text),
          answer: newAnswerIdx !== -1 ? newAnswerIdx : originalAnswerIdx,
          _originalQuestionIndex: origIdx,
          _optionsMapping: shuffledOpts.map((opt) => opt.originalIdx),
        };
      }

      // สำหรับข้อสอบประเภทอื่น (อัตนัย / เติมคำ / จับคู่)
      return {
        ...q,
        _originalQuestionIndex: origIdx,
      };
    });

    // 2. สุ่มสลับลำดับข้อสอบทั้งหมดในชุด สำหรับนักเรียนแต่ละคน (Anti-Cheating Randomization)
    const randomizedQuestions = shuffleArray(preparedQuestions);

    setCurrentExamQuestions(randomizedQuestions);
    setUserAnswers({});
    const totalSec = (selectedExamSet.time_limit_minutes || 60) * 60;
    setTimeRemaining(totalSec);
    setTimeTotal(totalSec);
    setScreen('exam');

    // Start countdown purely updating state
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  // ── Auto-submit when time reaches 0 ──
  useEffect(() => {
    if (screen === 'exam' && timeTotal > 0 && timeRemaining === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast({ title: 'หมดเวลาสอบ!', description: 'ระบบกำลังส่งคำตอบอัตโนมัติ', variant: 'destructive' });
      finishExam();
    }
  }, [timeRemaining, screen, timeTotal]);

  // ── Timer & Speech Cleanup ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopThaiSpeech();
    };
  }, []);

  const handleManualSubmit = () => {
    const total = currentExamQuestions.length;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < total) {
      const unCount = total - answeredCount;
      if (!confirm(`คุณยังไม่ได้ตอบอีก ${unCount} ข้อ ต้องการส่งข้อสอบเลยหรือไม่?`)) {
        return;
      }
    }
    finishExam();
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!selectedExamSet || !selectedStudent) return;

    const normalize = (v: unknown) =>
      String(v ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    let earnedScore = 0;
    let totalMaxScore = 0;
    let essayCount = 0;

    // ตรวจคำตอบตามคีย์และตัวเลือกที่สลับของชุดนี้ (Instant Grading)
    currentExamQuestions.forEach((q, idx) => {
      const qType = q.question_type || 'mcq';
      const points = Number(q.points) > 0 ? Number(q.points) : 1;
      totalMaxScore += points;

      const userAns = userAnswers[idx];

      if (qType === 'essay') {
        essayCount++;
        // Essay score is pending review by teacher
      } else if (qType === 'fillin') {
        if (userAns !== undefined && userAns !== null) {
          const normUser = normalize(userAns);
          const acceptedList: string[] = [];
          if (q.answer !== undefined && q.answer !== null) {
            acceptedList.push(normalize(q.answer));
          }
          if (Array.isArray(q.accepted_answers)) {
            q.accepted_answers.forEach((ans) => acceptedList.push(normalize(ans)));
          }
          if (acceptedList.some((acc) => acc && acc === normUser)) {
            earnedScore += points;
          }
        }
      } else {
        // mcq / truefalse / default
        const correctAns = q.answer;
        if (
          userAns !== undefined &&
          userAns !== null &&
          correctAns !== undefined &&
          correctAns !== null &&
          Number(userAns) === Number(correctAns)
        ) {
          earnedScore += points;
        }
      }
    });

    const hasEssay = essayCount > 0;
    const maxScore = totalMaxScore || currentExamQuestions.length || 1;
    const percentage = Math.round((earnedScore / maxScore) * 100);
    const passed = percentage >= (selectedExamSet.pass_threshold_pct || 50);
    const timeUsedSec = timeTotal - timeRemaining;
    const timeUsedFormatted = `${Math.floor(timeUsedSec / 60)} นาที ${timeUsedSec % 60} วินาที`;
    const reviewStatus: 'pending_review' | 'completed' | 'reviewed' = hasEssay ? 'pending_review' : 'completed';

    setExamResult({
      score: earnedScore,
      maxScore,
      percentage,
      passed,
      timeUsedFormatted,
      hasEssay,
      essayCount,
      reviewStatus,
    });

    // แปลงคำตอบของนักเรียนกลับสู่ดัชนีข้อสอบและดัชนีตัวเลือกเดิม (Normalized Answers)
    // เพื่อให้ระบบตรวจข้อสอบอัตนัย, การวิเคราะห์ข้อสอบ (Item Analysis / KR-20), และรายงานผล (Diagnostic) ถูกต้อง 100%
    const normalizedAnswers: Record<string | number, unknown> = {};
    currentExamQuestions.forEach((q, dispIdx) => {
      const origQIdx = q._originalQuestionIndex !== undefined ? q._originalQuestionIndex : dispIdx;
      const studentAns = userAnswers[dispIdx];

      if (studentAns === undefined || studentAns === null) {
        return;
      }

      const qType = q.question_type || 'mcq';
      if (qType === 'mcq' && Array.isArray(q._optionsMapping) && typeof studentAns === 'number') {
        // แมปดัชนีตัวเลือกที่แสดงผลบนจอ กลับไปเป็นดัชนีตัวเลือกเดิมในชุดข้อสอบหลัก
        const origChoiceIdx = q._optionsMapping[studentAns] !== undefined ? q._optionsMapping[studentAns] : studentAns;
        normalizedAnswers[origQIdx] = origChoiceIdx;
      } else {
        normalizedAnswers[origQIdx] = studentAns;
      }
    });

    submitMutation.mutate({
      exam_set_id: selectedExamSet.id,
      student_id: selectedStudent.id,
      student_name: selectedStudent.name,
      student_class: selectedStudent.class,
      student_no: selectedStudent.class_number,
      submission_mode: 'online',
      score: earnedScore,
      max_score: maxScore,
      percentage,
      passed,
      answers: normalizedAnswers as unknown as Json,
      time_used_seconds: timeUsedSec,
      review_status: reviewStatus,
    });

    setScreen('result');

    // ── อ่านผลคะแนนเป็นเสียงภาษาไทยอัตโนมัติ (Thai TTS Voice Read-Out) ──
    const studentSpokenName = formatStudentNameForSpeech(selectedStudent.name);
    const examTitle = selectedExamSet.title || 'แบบทดสอบ';
    const scoreWords = thaiNumberToWords(earnedScore);
    const maxScoreWords = thaiNumberToWords(maxScore);

    let speechSegments: string[] = [];

    if (hasEssay) {
      speechSegments = [
        `ชื่อ ${studentSpokenName}`,
        `ชุดข้อสอบ ${examTitle}`,
        `ผลการสอบเบื้องต้นได้ ${scoreWords} คะแนน จากคะแนนเต็ม ${maxScoreWords} คะแนน`,
        `มีข้อสอบอัตนัย ${thaiNumberToWords(essayCount)} ข้อ รอคุณครูตรวจเพิ่มเติมค่ะ`,
      ];
    } else if (passed) {
      speechSegments = [
        `ชื่อ ${studentSpokenName}`,
        `ชุดข้อสอบ ${examTitle}`,
        `ผลการสอบได้ ${scoreWords} คะแนน จากคะแนนเต็ม ${maxScoreWords} คะแนน`,
        `ผ่านการทดสอบ ยินดีด้วยค่ะ`,
      ];
    } else {
      speechSegments = [
        `ชื่อ ${studentSpokenName}`,
        `ชุดข้อสอบ ${examTitle}`,
        `ผลการสอบได้ ${scoreWords} คะแนน จากคะแนนเต็ม ${maxScoreWords} คะแนน`,
        `ไม่ผ่านการทดสอบ พยายามฝึกฝนเพิ่มเติมนะคะ`,
      ];
    }

    currentSpeechSegmentsRef.current = speechSegments;
    setIsSpeaking(true);
    void speakThai(speechSegments).then(() => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-sm font-bold leading-tight">โรงเรียนบ้านคำไผ่</h1>
              <p className="text-[11px] text-muted-foreground">ระบบสอบออนไลน์ (Online Examination)</p>
            </div>
          </div>

          {screen === 'exam' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/60 border border-border rounded-full text-xs font-mono font-bold">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* ═══════════════════════════════════════════════════════════
            SCREEN 0: PIN ENTRY OR EXAM SELECTION
        ════════════════════════════════════════════════════════════ */}
        {screen === 'pin' && (
          <div className="max-w-md w-full mx-auto space-y-6">
            <Card className="border-border shadow-md">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">เข้าสู่ระบบสอบออนไลน์</CardTitle>
                <p className="text-xs text-muted-foreground">กรอกรหัสสอบ PIN ที่คุณครูแจ้งเพื่อเริ่มทำข้อสอบ</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">รหัสสอบ PIN ที่ครูแจ้ง</Label>
                  <Input
                    placeholder="เช่น ENG401"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPIN()}
                    className="text-center font-mono tracking-widest text-lg font-bold h-12 uppercase"
                    maxLength={10}
                    autoFocus
                  />
                </div>

                <Button onClick={handleVerifyPIN} className="w-full text-xs h-10 font-bold">
                  ตรวจสอบรหัสสอบ
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 1: STUDENT IDENTIFICATION
        ════════════════════════════════════════════════════════════ */}
        {screen === 'student' && selectedExamSet && (
          <div className="max-w-md w-full mx-auto space-y-6">
            <Card className="border-border shadow-md">
              <CardHeader className="text-center pb-2">
                <Badge variant="outline" className="w-fit mx-auto mb-1 text-[11px]">
                  {selectedExamSet.subject} · {selectedExamSet.grade}
                </Badge>
                <CardTitle className="text-base font-bold">{selectedExamSet.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  เวลาสอบ {selectedExamSet.time_limit_minutes} นาที · เกณฑ์ผ่าน {selectedExamSet.pass_threshold_pct}%
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">เลือกระดับชั้น</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LIST.map((gr) => (
                        <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">เลือกชื่อนักเรียน (จากฐานข้อมูล)</Label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto border border-border rounded-xl p-1 bg-muted/10">
                    {studentsInClass.map((stu) => {
                      const isSelected = selectedStudent?.id === stu.id;
                      return (
                        <div
                          key={stu.id}
                          onClick={() => setSelectedStudent(stu)}
                          className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'hover:bg-muted/40 text-foreground'
                          }`}
                        >
                          <PersonAvatar
                            name={stu.name}
                            photoUrl={stu.photo_url}
                            className="h-8 w-8 text-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate">{stu.name}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              เลขที่ {stu.class_number ?? '-'} · ชั้น {stu.class}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs flex items-center gap-2 text-primary">
                  <Shuffle className="h-4 w-4 shrink-0" />
                  <span>ระบบจะสลับลำดับข้อสอบและตัวเลือกอัตโนมัติสำหรับนักเรียนแต่ละคน</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScreen('pin')}
                    className="flex-1 text-xs h-10"
                  >
                    ย้อนกลับ
                  </Button>
                  <Button
                    onClick={handleStartExam}
                    disabled={!selectedStudent}
                    size="sm"
                    className="flex-1 text-xs h-10 font-bold bg-primary hover:bg-primary/90"
                  >
                    เริ่มทำข้อสอบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 2: EXAM TAKING
        ════════════════════════════════════════════════════════════ */}
        {screen === 'exam' && selectedExamSet && (
          <div className="space-y-6">
            {/* Student Bar */}
            <div className="p-3 bg-muted/40 border border-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <PersonAvatar
                  name={selectedStudent?.name || ''}
                  photoUrl={selectedStudent?.photo_url || null}
                  className="h-7 w-7 text-xs"
                />
                <div>
                  <div className="font-semibold">{selectedStudent?.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    เลขที่ {selectedStudent?.class_number} · ชั้น {selectedStudent?.class}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/20">
                  <Shuffle className="h-3 w-3" />
                  สุ่มข้อ & สลับตัวเลือก
                </Badge>
                <div className="text-[11px] text-muted-foreground">
                  ตอบแล้ว: <span className="font-bold text-foreground">{Object.keys(userAnswers).length}</span> / {currentExamQuestions.length} ข้อ
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {currentExamQuestions.map((q, qIdx) => {
                const currentAns = userAnswers[qIdx];
                const qType = q.question_type || 'mcq';
                const opts = Array.isArray(q.options) ? q.options : [];

                return (
                  <Card key={qIdx} className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-semibold leading-relaxed">
                              {q.question_text || q.question}
                            </div>
                            {q.indicator_code && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/40">
                                  ตัวชี้วัด {q.indicator_code}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                          {qType === 'mcq' && '📝 ปรนัย'}
                          {qType === 'fillin' && '✍️ เติมคำ'}
                          {qType === 'essay' && `📋 อัตนัย (${q.points || 5} คะแนน)`}
                        </Badge>
                      </div>

                      {/* Media reference image */}
                      {q.media_image_url && (
                        <div className="my-3 p-2 bg-muted/20 border border-border rounded-xl flex flex-col items-center">
                          <img
                            src={q.media_image_url}
                            alt={q.media_title || 'ภาพประกอบข้อสอบ'}
                            className="max-h-60 max-w-full object-contain rounded-lg border border-border bg-card shadow-xs"
                          />
                          {q.media_title && (
                            <span className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                              🎮 อ้างอิงสื่อ: {q.media_title}
                            </span>
                          )}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* MCQ Mode */}
                      {qType === 'mcq' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {opts.map((opt: string, optIdx: number) => {
                            const isSelected = currentAns === optIdx;
                            const label = ['ก', 'ข', 'ค', 'ง'][optIdx] || `${optIdx + 1}`;

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  setUserAnswers({ ...userAnswers, [qIdx]: optIdx });
                                }}
                                className={`p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-all min-h-[44px] ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 font-bold text-primary shadow-sm'
                                    : 'border-border bg-card hover:bg-muted/30 text-foreground'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'border-muted-foreground/60 text-muted-foreground'
                                  }`}
                                >
                                  {label}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill-in Mode */}
                      {qType === 'fillin' && (
                        <div className="space-y-2 pt-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <PenLine className="h-3.5 w-3.5 text-primary" />
                            พิมพ์คำตอบสั้นๆ ในช่องด้านล่าง (ตัวเลข, คำศัพท์ หรือข้อความสั้น):
                          </Label>
                          <Input
                            placeholder="พิมพ์คำตอบของคุณที่นี่..."
                            value={(currentAns as string) || ''}
                            onChange={(e) => {
                              setUserAnswers({ ...userAnswers, [qIdx]: e.target.value });
                            }}
                            className="h-11 text-sm bg-card border-border focus:border-primary font-medium"
                          />
                        </div>
                      )}

                      {/* Essay Mode */}
                      {qType === 'essay' && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <PenLine className="h-3.5 w-3.5 text-primary" />
                              เขียนแสดงวิธีทำ หรือ อธิบายเหตุผลอย่างละเอียด:
                            </Label>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              คะแนนเต็ม {q.points || 5} คะแนน
                            </span>
                          </div>
                          <Textarea
                            placeholder="พิมพ์คำตอบ วิธีคิด ลำดับขั้นตอน หรือเหตุผลประกอบที่นี่..."
                            rows={5}
                            value={(currentAns as string) || ''}
                            onChange={(e) => {
                              setUserAnswers({ ...userAnswers, [qIdx]: e.target.value });
                            }}
                            className="text-sm bg-card border-border focus:border-primary leading-relaxed resize-y"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Submit Button Tray */}
            <div className="sticky bottom-4 p-4 bg-card/90 backdrop-blur border border-border rounded-2xl shadow-lg flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                ตรวจทานคำตอบให้ครบถ้วนก่อนส่ง
              </div>
              <Button
                onClick={handleManualSubmit}
                size="sm"
                className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 h-10 px-6"
              >
                <Send className="h-4 w-4" />
                ส่งข้อสอบ & ดูผลคะแนน
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 3: INSTANT RESULT
        ═══════════════════════════════════════════════════════════ */}
        {screen === 'result' && examResult && selectedExamSet && (
          <div className="max-w-md w-full mx-auto space-y-6">
            <Card className="border-border text-center shadow-lg overflow-hidden">
              <div
                className={`py-8 px-6 text-white ${
                  examResult.hasEssay
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                    : examResult.passed
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-br from-rose-600 to-red-700'
                }`}
              >
                <div className="text-4xl mb-2">
                  {examResult.hasEssay ? '📋' : examResult.passed ? '🎉' : '📖'}
                </div>
                <h2 className="text-xl font-bold">
                  {examResult.hasEssay
                    ? 'ส่งข้อสอบสำเร็จ (รอคุณครูตรวจอัตนัย)'
                    : examResult.passed
                    ? 'ยินดีด้วย! คุณผ่านการทดสอบ'
                    : 'ต้องฝึกฝนเพิ่มเติมนะ'}
                </h2>
                <div className="text-5xl font-black mt-3">
                  {examResult.score}
                  <span className="text-xl font-normal opacity-80">/{examResult.maxScore}</span>
                </div>
                <div className="text-sm font-semibold opacity-90 mt-1">
                  คิดเป็นร้อยละ {examResult.percentage}%
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {examResult.hasEssay && (
                  <div className="p-3 bg-amber-500/10 border border-amber-300/40 rounded-xl text-xs text-amber-900 leading-relaxed text-left flex items-start gap-2">
                    <span className="text-base shrink-0">⏳</span>
                    <div>
                      <strong className="font-semibold block">มีข้อสอบอัตนัย {examResult.essayCount} ข้อ</strong>
                      คะแนนที่แสดงเบื้องต้นเป็นคะแนนจากส่วนปรนัยและเติมคำ คุณครูประจำวิชาจะตรวจและเพิ่มคะแนนส่วนอัตนัยให้ในภายหลัง
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted/30 border border-border rounded-xl text-xs space-y-1 text-left">
                  <div className="font-semibold text-foreground">{selectedStudent?.name}</div>
                  <div className="text-muted-foreground">{selectedExamSet.title}</div>
                  <div className="text-[11px] text-muted-foreground">เวลาที่ใช้: {examResult.timeUsedFormatted}</div>
                </div>

                {/* Audio Read-out Controls */}
                <Button
                  type="button"
                  variant={isSpeaking ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleToggleSpeech}
                  className="w-full text-xs font-semibold h-10 gap-2 border-primary/30 hover:bg-primary/10 transition-colors"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4 animate-pulse text-destructive" />
                      <span>กำลังอ่านผลคะแนน... (แตะเพื่อหยุด)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span>ฟังผลคะแนนเป็นเสียง (อ่านอีกครั้ง)</span>
                    </>
                  )}
                </Button>

                <div className="pt-1 flex gap-2">
                  <Button
                    onClick={() => {
                      stopThaiSpeech();
                      setIsSpeaking(false);
                      setScreen('pin');
                      setUserAnswers({});
                    }}
                    className="w-full text-xs h-10"
                  >
                    กลับสู่หน้าแรก
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้แบบบูรณาการ
      </footer>
    </div>
  );
}

/**
 * ExamOnline.tsx
 * ระบบสอบออนไลน์สำหรับนักเรียน โรงเรียนบ้านคำไผ่
 * รองรับการใส่รหัส PIN, ดึงรายชื่อนักเรียนจากฐานข้อมูลจริงพร้อม Avatar, จับเวลา, และตรวจคะแนนทันที
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Clock, CheckCircle2, ShieldCheck, BookOpen, Send
} from 'lucide-react';
import { examService, type ExamSetRow } from '@/services/exam.service';
import { studentsService, type StudentMin } from '@/services/students.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface QuestionItem {
  question_text?: string;
  question?: string;
  options?: string[];
  answer?: number | string | boolean;
}

const GRADE_LIST = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function ExamOnline() {
  const { examSetId } = useParams<{ examSetId?: string }>();
  const { toast } = useToast();

  // Screen flow: 'pin' | 'student' | 'exam' | 'result'
  const [screen, setScreen] = useState<'pin' | 'student' | 'exam' | 'result'>('pin');

  // PIN / Set Selection
  const [pinCode, setPinCode] = useState('');
  const [selectedExamSet, setSelectedExamSet] = useState<ExamSetRow | null>(null);

  // Student Info
  const [selectedGrade, setSelectedGrade] = useState('ป.4');
  const [selectedStudent, setSelectedStudent] = useState<StudentMin | null>(null);

  // Exam Answers & Timer
  const [currentExamQuestions, setCurrentExamQuestions] = useState<QuestionItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string | boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeTotal, setTimeTotal] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result state
  const [examResult, setExamResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    timeUsedFormatted: string;
  } | null>(null);

  // ── Queries ──
  const { data: activeSets = [] } = useQuery({
    queryKey: ['active_exam_sets'],
    queryFn: () => examService.listExamSets({ is_active: true }),
  });

  const { data: studentsInClass = [] } = useQuery({
    queryKey: ['students_roster', selectedGrade],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(selectedGrade);
      if (error) throw error;
      return (data || []) as StudentMin[];
    },
  });

  // If examSetId is provided in URL, pre-select it
  useEffect(() => {
    if (examSetId && activeSets.length) {
      const found = activeSets.find((s) => s.id === examSetId);
      if (found) {
        setSelectedExamSet(found);
        setSelectedGrade(found.grade || 'ป.4');
        setScreen('student');
      }
    }
  }, [examSetId, activeSets]);

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
      if (!found) {
        toast({ title: 'รหัสสอบไม่ถูกต้อง', description: 'กรุณาตรวจสอบรหัสสอบจากคุณครูอีกครั้ง', variant: 'destructive' });
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

    const questions: QuestionItem[] = Array.isArray(selectedExamSet.questions)
      ? (selectedExamSet.questions as QuestionItem[])
      : [];
    if (!questions.length) {
      toast({ title: 'ชุดข้อสอบนี้ยังไม่มีคำถาม', variant: 'destructive' });
      return;
    }

    setCurrentExamQuestions(questions);
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

  // ── Timer Cleanup ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

    let correctCount = 0;
    currentExamQuestions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      const correctAns = q.answer;
      if (
        ans !== undefined &&
        ans !== null &&
        correctAns !== undefined &&
        correctAns !== null &&
        Number(ans) === Number(correctAns)
      ) {
        correctCount++;
      }
    });

    const total = currentExamQuestions.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= (selectedExamSet.pass_threshold_pct || 50);
    const timeUsedSec = timeTotal - timeRemaining;
    const timeUsedFormatted = `${Math.floor(timeUsedSec / 60)} นาที ${timeUsedSec % 60} วินาที`;

    setExamResult({
      score: correctCount,
      maxScore: total,
      percentage,
      passed,
      timeUsedFormatted,
    });

    submitMutation.mutate({
      exam_set_id: selectedExamSet.id,
      student_id: selectedStudent.id,
      student_name: selectedStudent.name,
      student_class: selectedStudent.class,
      student_no: selectedStudent.class_number,
      submission_mode: 'online',
      score: correctCount,
      max_score: total,
      percentage,
      passed,
      answers: userAnswers as unknown as Json,
      time_used_seconds: timeUsedSec,
    });

    setScreen('result');
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
                <p className="text-xs text-muted-foreground">กรอกรหัสสอบ PIN หรือเลือกชุดข้อสอบด้านล่าง</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">รหัสสอบ PIN ที่ครูแจ้ง</Label>
                  <Input
                    placeholder="เช่น SCI501"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPIN()}
                    className="text-center font-mono tracking-widest text-lg font-bold h-12 uppercase"
                    maxLength={10}
                  />
                </div>

                <Button onClick={handleVerifyPIN} className="w-full text-xs h-10 font-bold">
                  ตรวจสอบรหัสสอบ
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-card px-2 text-muted-foreground">หรือเลือกชุดข้อสอบ</span>
                  </div>
                </div>

                {/* Public Active Sets */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeSets.map((set) => (
                    <div
                      key={set.id}
                      onClick={() => {
                        setSelectedExamSet(set);
                        setSelectedGrade(set.grade || 'ป.5');
                        setScreen('student');
                      }}
                      className="p-2.5 rounded-lg border border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold">{set.title}</div>
                        <div className="text-[11px] text-muted-foreground">{set.subject} · {set.grade}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {Array.isArray(set.questions) ? set.questions.length : 0} ข้อ
                      </Badge>
                    </div>
                  ))}
                </div>
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
            <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs">
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

              <div className="text-[11px] text-muted-foreground">
                ตอบแล้ว: <span className="font-bold text-foreground">{Object.keys(userAnswers).length}</span> / {currentExamQuestions.length} ข้อ
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {currentExamQuestions.map((q, qIdx) => {
                const currentAns = userAnswers[qIdx];
                const opts = Array.isArray(q.options) ? q.options : [];

                return (
                  <Card key={qIdx} className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <div className="text-sm font-semibold leading-relaxed">
                          {q.question_text || q.question}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
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
                  examResult.passed
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-br from-rose-600 to-red-700'
                }`}
              >
                <div className="text-4xl mb-2">{examResult.passed ? '🎉' : '📖'}</div>
                <h2 className="text-xl font-bold">
                  {examResult.passed ? 'ยินดีด้วย! คุณผ่านการทดสอบ' : 'ต้องฝึกฝนเพิ่มเติมนะ'}
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
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-foreground">{selectedStudent?.name}</div>
                  <div className="text-muted-foreground">{selectedExamSet.title}</div>
                  <div className="text-[11px] text-muted-foreground">เวลาที่ใช้: {examResult.timeUsedFormatted}</div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => {
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

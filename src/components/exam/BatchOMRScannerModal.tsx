/**
 * BatchOMRScannerModal.tsx
 * Batch Multi-Sheet OMR Scanner for Kampai School Exam System
 * 
 * Features:
 * 1. Drag & drop or select multiple image files (20-35 sheets at once)
 * 2. Concurrent AI Vision scanning queue with live progress bar
 * 3. Automatic student matching from class roster via detected_student_no
 * 4. Exception filtering (Ready vs Needs Review vs Error)
 * 5. Side-by-side inspection dialog to verify or adjust bubbles
 * 6. One-click batch submission saving to database
 */

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  omrScannerService,
  type OMRGradingSummary,
  type QuestionToGrade,
} from '@/services/omr-scanner.service';
import type { ExamSetRow, QuestionData } from '@/services/exam.service';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  FileCheck,
  Eye,
  Trash2,
  Layers,
  Sparkles,
  Save,
} from 'lucide-react';

export interface StudentRosterItem {
  id: string;
  name: string;
  class_name: string;
  class_number: number;
}

export interface BatchSheetItem {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;
  status: 'queued' | 'scanning' | 'ready' | 'needs_review' | 'error';
  detectedStudentNo: number | null;
  matchedStudent: StudentRosterItem | null;
  summary: OMRGradingSummary | null;
  errorMessage?: string;
  answers: (number | null)[];
}

interface BatchOMRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examSets: ExamSetRow[];
  initialExamSetId?: string;
  students: StudentRosterItem[];
  onSaveBatchSubmissions: (
    submissions: {
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
  ) => Promise<void>;
}

export const BatchOMRScannerModal: React.FC<BatchOMRScannerModalProps> = ({
  isOpen,
  onClose,
  examSets,
  initialExamSetId,
  students,
  onSaveBatchSubmissions,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSetId, setSelectedSetId] = useState<string>(
    initialExamSetId || (examSets.length > 0 ? examSets[0].id : '')
  );
  const [selectedClass, setSelectedClass] = useState<string>('ป.4');
  const [sheets, setSheets] = useState<BatchSheetItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [inspectedSheet, setInspectedSheet] = useState<BatchSheetItem | null>(null);

  const currentExamSet = examSets.find((s) => s.id === selectedSetId);
  const questionsList = (
    Array.isArray(currentExamSet?.questions) ? currentExamSet.questions : []
  ) as QuestionToGrade[];

  // File Upload Handlers
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToQueue(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    addFilesToQueue(Array.from(files));
  };

  const addFilesToQueue = (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      toast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้น',
        variant: 'destructive',
      });
      return;
    }

    const newItems: BatchSheetItem[] = validImageFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'queued',
      detectedStudentNo: null,
      matchedStudent: null,
      summary: null,
      answers: [],
    }));

    setSheets((prev) => [...prev, ...newItems]);
    toast({
      title: `เพิ่มกระดาษคำตอบ ${newItems.length} แผ่น`,
      description: 'พร้อมเริ่มการตรวจอัตโนมัติด้วย AI Vision',
    });
  };

  const removeSheet = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (inspectedSheet?.id === id) setInspectedSheet(null);
  };

  const clearAllSheets = () => {
    if (isProcessing) return;
    setSheets([]);
    setInspectedSheet(null);
  };

  // Run Batch Scan
  const startBatchScan = async () => {
    if (!currentExamSet) {
      toast({
        title: 'กรุณาเลือกชุดข้อสอบ',
        description: 'ต้องเลือกชุดข้อสอบเพื่อใช้เฉลยในการตรวจ',
        variant: 'destructive',
      });
      return;
    }

    const queued = sheets.filter((s) => s.status === 'queued' || s.status === 'error');
    if (queued.length === 0) {
      toast({ title: 'ไม่มีกระดาษคำตอบที่รอการตรวจ' });
      return;
    }

    setIsProcessing(true);
    const qCount = questionsList.length || 10;
    const passThreshold = currentExamSet.pass_threshold_pct || 60;

    // Filter students by selected class
    const classStudents = students.filter(
      (s) => !selectedClass || s.class_name === selectedClass
    );

    // Process with concurrency limit = 2
    const CONCURRENCY = 2;
    let index = 0;

    const processItem = async (item: BatchSheetItem) => {
      // Mark as scanning
      setSheets((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: 'scanning' } : s))
      );

      try {
        const base64 = await omrScannerService.readFileAsBase64(item.file);
        const aiResult = await omrScannerService.analyzeWithAI(base64, qCount);
        const summary = omrScannerService.gradeAnswers(
          aiResult.answers,
          questionsList,
          passThreshold
        );

        const detectedNo = aiResult.detectedStudentNo || null;
        let matched: StudentRosterItem | null = null;

        if (detectedNo) {
          matched = classStudents.find((st) => st.class_number === detectedNo) || null;
        }

        const isUncertain =
          !detectedNo ||
          !matched ||
          summary.unansweredCount > qCount * 0.4 ||
          aiResult.answers.includes(null);

        const newStatus = isUncertain ? 'needs_review' : 'ready';

        setSheets((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  base64,
                  status: newStatus,
                  detectedStudentNo: detectedNo,
                  matchedStudent: matched,
                  summary,
                  answers: aiResult.answers,
                }
              : s
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ตรวจล้มเหลว';
        setSheets((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  status: 'error',
                  errorMessage: msg,
                }
              : s
          )
        );
      }
    };

    // Worker pool
    const workers = Array.from({ length: CONCURRENCY }).map(async () => {
      while (index < queued.length) {
        const currentItem = queued[index++];
        if (currentItem) {
          await processItem(currentItem);
        }
      }
    });

    await Promise.all(workers);
    setIsProcessing(false);
    toast({
      title: 'การตรวจแบบชุดเสร็จสิ้น!',
      description: 'กรุณาตรวจสอบผลการตรวจและกดบันทึกคะแนนเข้าสู่ระบบ',
    });
  };

  // Save Batch Submissions
  const handleSaveAll = async () => {
    if (!currentExamSet) return;

    const validSheets = sheets.filter(
      (s) => (s.status === 'ready' || s.status === 'needs_review') && s.summary
    );

    if (validSheets.length === 0) {
      toast({
        title: 'ไม่มีผลสอบที่พร้อมบันทึก',
        description: 'กรุณาตรวจกระดาษคำตอบให้เรียบร้อยก่อนบันทึก',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const submissionsToSave = validSheets.map((s) => {
        const studentName = s.matchedStudent
          ? s.matchedStudent.name
          : s.detectedStudentNo
          ? `นักเรียนเลขที่ ${s.detectedStudentNo}`
          : 'ไม่ระบุชื่อ';

        const studentNo = s.matchedStudent
          ? s.matchedStudent.class_number
          : s.detectedStudentNo || 0;

        return {
          exam_set_id: currentExamSet.id,
          student_id: s.matchedStudent?.id || null,
          student_name: studentName,
          student_class: selectedClass,
          student_no: studentNo,
          submission_mode: 'omr_paper' as const,
          score: s.summary!.correctCount,
          max_score: s.summary!.totalQuestions,
          percentage: s.summary!.percentage,
          passed: s.summary!.passed,
          answers: s.summary!.details.map((d) => d.studentAnswer),
        };
      });

      await onSaveBatchSubmissions(submissionsToSave);
      toast({
        title: 'บันทึกสำเร็จ!',
        description: `บันทึกผลการสอบนักเรียนครบทั้ง ${submissionsToSave.length} คน เรียบร้อยแล้ว`,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Stats
  const totalCount = sheets.length;
  const readyCount = sheets.filter((s) => s.status === 'ready').length;
  const reviewCount = sheets.filter((s) => s.status === 'needs_review').length;
  const errorCount = sheets.filter((s) => s.status === 'error').length;
  const scanningCount = sheets.filter((s) => s.status === 'scanning').length;
  const completedCount = readyCount + reviewCount + errorCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  ระบบตรวจกระดาษคำตอบ OMR แบบชุด (Batch Scanner)
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  อัปโหลดภาพกระดาษคำตอบทั้งห้องเรียน ตรวจและบันทึกคะแนนในคราวเดียว
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={clearAllSheets}
                disabled={isProcessing || sheets.length === 0}
              >
                ล้างทั้งหมด
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {/* Exam Set Selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
              ชุดข้อสอบเป้าหมาย (ใช้เฉลย):
            </label>
            <Select value={selectedSetId} onValueChange={setSelectedSetId} disabled={isProcessing}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="เลือกชุดข้อสอบ..." />
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

          {/* Target Class Selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
              ระดับชั้นเรียน (เพื่อจับคู่นักเรียน):
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isProcessing}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="เลือกระดับชั้น..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ป.1">ประถมศึกษาปีที่ 1</SelectItem>
                <SelectItem value="ป.2">ประถมศึกษาปีที่ 2</SelectItem>
                <SelectItem value="ป.3">ประถมศึกษาปีที่ 3</SelectItem>
                <SelectItem value="ป.4">ประถมศึกษาปีที่ 4</SelectItem>
                <SelectItem value="ป.5">ประถมศึกษาปีที่ 5</SelectItem>
                <SelectItem value="ป.6">ประถมศึกษาปีที่ 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={startBatchScan}
              disabled={isProcessing || sheets.length === 0 || !selectedSetId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังตรวจ {scanningCount}...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  เริ่มตรวจทั้งหมด ({sheets.filter((s) => s.status === 'queued').length})
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveAll}
              disabled={isProcessing || isSaving || (readyCount === 0 && reviewCount === 0)}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              บันทึกผลสอบ ({readyCount + reviewCount})
            </Button>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mt-3 p-6 border-2 border-dashed border-border rounded-xl bg-card hover:bg-muted/10 transition-colors text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFilesSelected}
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">
            ลากภาพกระดาษคำตอบ OMR มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            รองรับไฟล์ JPG, PNG, WebP (สามารถเลือกพร้อมกันได้ 20–35 ไฟล์ต่อห้อง)
          </p>
        </div>

        {/* Progress Bar & Summary Stats */}
        {totalCount > 0 && (
          <div className="mt-4 p-3 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                ความคืบหน้าการตรวจ: {completedCount}/{totalCount} แผ่น ({progressPct}%)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-medium">✓ ผ่านแล้ว {readyCount}</span>
                {reviewCount > 0 && (
                  <span className="text-amber-700 font-medium">⚠️ ตรวจทาน {reviewCount}</span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-700 font-medium">✕ ผิดพลาด {errorCount}</span>
                )}
              </div>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {/* Sheets Grid / List */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
            <span>รายการกระดาษคำตอบในชุด ({totalCount} แผ่น)</span>
          </h4>

          {sheets.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              ยังไม่มีไฟล์กระดาษคำตอบ กรุณาลากไฟล์มาวางเพื่อเริ่มใช้งาน
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
              {sheets.map((sheet, idx) => (
                <div
                  key={sheet.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    sheet.status === 'ready'
                      ? 'border-emerald-300 bg-emerald-500/5'
                      : sheet.status === 'needs_review'
                      ? 'border-amber-400 bg-amber-500/5'
                      : sheet.status === 'error'
                      ? 'border-red-300 bg-red-500/5'
                      : sheet.status === 'scanning'
                      ? 'border-primary bg-primary/5 animate-pulse'
                      : 'border-border bg-card'
                  }`}
                >
                  <div>
                    {/* Top Row: Thumbnail + Status */}
                    <div className="flex items-start gap-2">
                      <img
                        src={sheet.previewUrl}
                        alt="OMR"
                        className="h-14 w-11 object-cover rounded border border-border shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-muted-foreground">
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeSheet(sheet.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="ลบออก"
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-1">
                          {sheet.status === 'ready' && (
                            <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 text-[9px] px-1 py-0">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> ตรวจสำเร็จ
                            </Badge>
                          )}
                          {sheet.status === 'needs_review' && (
                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 text-[9px] px-1 py-0">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> ต้องตรวจทาน
                            </Badge>
                          )}
                          {sheet.status === 'scanning' && (
                            <Badge className="bg-primary/10 text-primary border-primary/30 text-[9px] px-1 py-0">
                              <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" /> กำลังตรวจ...
                            </Badge>
                          )}
                          {sheet.status === 'error' && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">
                              <XCircle className="h-2.5 w-2.5 mr-0.5" /> ผิดพลาด
                            </Badge>
                          )}
                          {sheet.status === 'queued' && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              รอตรวจ
                            </Badge>
                          )}
                        </div>

                        {/* Student Name */}
                        <p className="font-bold text-foreground text-[11px] mt-1 truncate">
                          {sheet.matchedStudent
                            ? sheet.matchedStudent.name
                            : sheet.detectedStudentNo
                            ? `เลขที่ ${sheet.detectedStudentNo}`
                            : 'ไม่พบเลขที่'}
                        </p>
                      </div>
                    </div>

                    {/* Score / Details */}
                    {sheet.summary && (
                      <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span>คะแนน:</span>
                        <span className="font-bold">
                          {sheet.summary.correctCount}/{sheet.summary.totalQuestions} ({sheet.summary.percentage}%)
                        </span>
                      </div>
                    )}

                    {sheet.errorMessage && (
                      <p className="mt-1 text-[10px] text-destructive truncate">
                        {sheet.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 pt-1 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-1.5 gap-1"
                      onClick={() => setInspectedSheet(sheet)}
                    >
                      <Eye className="h-2.5 w-2.5" />
                      ดู/แก้ไข
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-Side Sheet Inspector Dialog */}
        {inspectedSheet && (
          <Dialog open={!!inspectedSheet} onOpenChange={() => setInspectedSheet(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  ตรวจสอบรายละเอียดกระดาษคำตอบ
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {/* Original Photo */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    ภาพถ่ายต้นฉบับ:
                  </p>
                  <div className="h-80 border border-border rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                    <img
                      src={inspectedSheet.previewUrl}
                      alt="OMR Full"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                {/* Detected Details & Adjustments */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      เลขที่นักเรียน (แก้ไขได้):
                    </label>
                    <Select
                      value={String(inspectedSheet.matchedStudent?.class_number || inspectedSheet.detectedStudentNo || '')}
                      onValueChange={(val) => {
                        const num = parseInt(val, 10);
                        const match = students.find(
                          (st) => st.class_number === num && st.class_name === selectedClass
                        );
                        setSheets((prev) =>
                          prev.map((s) =>
                            s.id === inspectedSheet.id
                              ? {
                                  ...s,
                                  detectedStudentNo: num,
                                  matchedStudent: match || null,
                                  status: 'ready',
                                }
                              : s
                          )
                        );
                        setInspectedSheet((prev) =>
                          prev
                            ? {
                                ...prev,
                                detectedStudentNo: num,
                                matchedStudent: match || null,
                                status: 'ready',
                              }
                            : null
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="เลือกเลขที่ / นักเรียน..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students
                          .filter((st) => st.class_name === selectedClass)
                          .map((st) => (
                            <SelectItem key={st.id} value={String(st.class_number)}>
                              เลขที่ {st.class_number} - {st.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {inspectedSheet.summary && (
                    <div className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ผลคะแนน:</span>
                        <span className="font-bold">
                          {inspectedSheet.summary.correctCount} / {inspectedSheet.summary.totalQuestions} ({inspectedSheet.summary.percentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ตอบถูก:</span>
                        <span className="text-emerald-700 font-semibold">{inspectedSheet.summary.correctCount} ข้อ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ตอบผิด:</span>
                        <span className="text-red-700 font-semibold">{inspectedSheet.summary.wrongCount} ข้อ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ไม่ฝน / คลุมเครือ:</span>
                        <span className="text-amber-700 font-semibold">{inspectedSheet.summary.unansweredCount} ข้อ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">การตัดสิน:</span>
                        <span className="font-bold">
                          {inspectedSheet.summary.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setInspectedSheet(null)}
                    >
                      ยืนยันและปิด
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

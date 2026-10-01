/**
 * PrintableExamPaper.tsx
 * เลย์เอาต์พิมพ์ชุดข้อสอบลงกระดาษ A4 มาตรฐานโรงเรียนบ้านคำไผ่
 * รองรับปรนัย (MCQ), ถูก/ผิด (True/False), เติมคำ (Fill-in), และจับคู่ (Matching)
 */
import React from 'react';
import type { ExamSetRow } from '@/services/exam.service';
import { generateExamVersion } from '@/lib/exam/multiVersion';

interface MatchingPairItem {
  left: string;
  right: string;
}

interface ExamPaperQuestion {
  question_text?: string;
  question?: string;
  question_type?: string;
  type?: string;
  options?: string[];
  pairs?: MatchingPairItem[];
  answer?: number | boolean | string | unknown;
  rubric?: any;
  points?: number;
  indicator_code?: string;
  media_title?: string;
  media_image_url?: string;
}

interface PrintableExamPaperProps {
  examSet: ExamSetRow;
  schoolName?: string;
  termInfo?: string;
  version?: 'A' | 'B';
}

export const PrintableExamPaper: React.FC<PrintableExamPaperProps> = ({
  examSet,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  termInfo = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษายโสธร เขต 1',
  version = 'A',
}) => {
  const rawQuestions: ExamPaperQuestion[] = Array.isArray(examSet.questions)
    ? (examSet.questions as ExamPaperQuestion[])
    : [];

  const versionResult = generateExamVersion(rawQuestions, version, examSet.id || examSet.title);
  const questions = versionResult.questions;

  const totalPoints = questions.reduce((sum, q: any) => {
    const pts = Number(q.points) > 0 ? Number(q.points) : (q.rubric?.full_score || 1);
    return sum + pts;
  }, 0) || questions.length;

  return (
    <div className="printable-exam-paper bg-background text-foreground font-sans p-6 max-w-4xl mx-auto print:p-0 print:max-w-none print:bg-white print:text-black">
      {/* Header */}
      <header className="border-b-2 border-foreground/80 pb-4 mb-5 text-center relative">
        {/* Form Version Stamp in Print */}
        <div className="absolute top-0 right-0 border-2 border-foreground/80 px-2.5 py-1 rounded text-xs font-bold print:border-black">
          ฉบับ {version} (Form {version})
        </div>

        <h1 className="text-xl font-bold tracking-tight">{schoolName}</h1>
        <p className="text-xs text-muted-foreground print:text-gray-600">{termInfo}</p>
        <div className="mt-2 text-base font-semibold flex items-center justify-center gap-2">
          <span>{examSet.title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold print:bg-transparent print:text-black print:border print:border-black">
            [ฉบับ {version}]
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-medium mt-1">
          <span><strong>กลุ่มสาระการเรียนรู้:</strong> {examSet.subject}</span>
          <span><strong>ระดับชั้น:</strong> {examSet.grade}</span>
          <span><strong>เวลา:</strong> {examSet.time_limit_minutes} นาที</span>
          <span><strong>คะแนนเต็ม:</strong> {totalPoints} คะแนน</span>
        </div>

        {/* Student Name Fill-in Box */}
        <div className="mt-4 pt-3 border-t border-dashed border-border flex flex-wrap justify-between items-center text-xs font-medium px-2 print:border-gray-400">
          <div>
            ชื่อ-นามสกุล: ............................................................................................
          </div>
          <div>
            ชั้น: .................... เลขที่: ....................
          </div>
          <div>
            คะแนนที่ได้: [ ......... / {totalPoints} ]
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="bg-muted/40 p-3 rounded-lg text-xs mb-5 border border-border/60 print:bg-transparent print:border-gray-300">
        <strong>คำชี้แจง:</strong> ให้นักเรียนเลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว หรือเขียนคำตอบลงในกระดาษคำถามตามที่ระบุ
      </div>

      {/* Questions list - 2 Columns in Print Mode to save paper */}
      <div className="grid grid-cols-1 print:grid-cols-2 print:gap-x-6 print:gap-y-3 space-y-4 print:space-y-0">
        {questions.map((q, idx) => {
          const qType = q.question_type || (q.type ? q.type : 'mcq');
          const options = q.options || [];
          const pts = Number(q.points) > 0
            ? Number(q.points)
            : (qType === 'essay' ? ((q.rubric as any)?.full_score || 5) : (qType === 'fillin' ? 2 : 1));

          return (
            <div
              key={idx}
              className="question-block border-b border-border/40 pb-3.5 print:pb-2 print:border-gray-200 print:break-inside-avoid"
            >
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-xs min-w-[24px]">{idx + 1}.</span>
                <div className="flex-1 text-xs font-medium leading-relaxed">
                  <span>{q.question_text || q.question}</span>
                  <span className="ml-1 text-[11px] text-muted-foreground print:text-gray-700 font-semibold">
                    ({pts} คะแนน)
                  </span>
                  {q.indicator_code && (
                    <span className="ml-2 inline-block text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground print:border print:border-gray-400 print:text-black">
                      ตัวชี้วัด: {q.indicator_code}
                    </span>
                  )}
                </div>
              </div>

              {/* Media Image Stimulus */}
              {q.media_image_url && (
                <div className="mt-2 ml-6 mb-2">
                  <img
                    src={q.media_image_url}
                    alt={q.media_title || 'สื่อประกอบข้อสอบ'}
                    className="max-h-36 max-w-full rounded border border-border/80 object-contain bg-white print:border-gray-400"
                  />
                  {q.media_title && (
                    <div className="text-[10px] text-muted-foreground print:text-gray-600 mt-0.5">
                      ภาพประกอบ: {q.media_title}
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Choice (MCQ) */}
              {qType === 'mcq' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 ml-6 text-[11px] leading-normal">
                  {options.map((opt: string, optIdx: number) => {
                    const label = ['ก', 'ข', 'ค', 'ง'][optIdx] || `${optIdx + 1}`;
                    return (
                      <div key={optIdx} className="flex items-start gap-1">
                        <span className="font-semibold text-muted-foreground print:text-black">
                          {label}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {qType === 'truefalse' && (
                <div className="flex items-center gap-8 mt-2.5 ml-8 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="inline-block w-4 h-4 border border-foreground/60 rounded-sm print:border-black" />
                    <span>ถูก (True)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="inline-block w-4 h-4 border border-foreground/60 rounded-sm print:border-black" />
                    <span>ผิด (False)</span>
                  </label>
                </div>
              )}

              {/* Fill-in */}
              {qType === 'fillin' && (
                <div className="mt-2.5 ml-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground print:text-black">ตอบ:</span>
                    <span className="flex-1 border-b-2 border-dotted border-foreground/60 print:border-black h-5 inline-block" />
                  </div>
                </div>
              )}

              {/* Essay / Subjective / Show Work */}
              {qType === 'essay' && (
                <div className="mt-2.5 ml-6 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground print:text-gray-700">
                    <span className="italic">แสดงวิธีทำ หรือเขียนอธิบายเหตุผลอย่างละเอียด:</span>
                    <span className="font-bold text-foreground print:text-black">
                      (คะแนนเต็ม {(q.rubric as any)?.full_score || 5} คะแนน)
                    </span>
                  </div>
                  <div className="border border-border/80 print:border-gray-500 rounded-md p-3 min-h-[85px] bg-muted/5 print:bg-transparent space-y-4">
                    <div className="border-b border-dotted border-border/60 print:border-gray-400 h-5" />
                    <div className="border-b border-dotted border-border/60 print:border-gray-400 h-5" />
                    <div className="border-b border-dotted border-border/60 print:border-gray-400 h-5" />
                  </div>
                </div>
              )}

              {/* Matching */}
              {qType === 'matching' && Array.isArray(q.pairs) && (
                <div className="mt-3 ml-8 text-xs grid grid-cols-2 gap-4 border border-border/60 p-3 rounded-md print:border-gray-400">
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted-foreground mb-1">กลุ่มที่ 1</div>
                    {q.pairs.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-1.5">
                        <span className="font-semibold">({pIdx + 1})</span>
                        <span>{p.left}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted-foreground mb-1">กลุ่มที่ 2</div>
                    {q.pairs.map((p, pIdx) => {
                      const letter = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'][pIdx] || `${pIdx + 1}`;
                      return (
                        <div key={pIdx} className="flex items-center gap-1.5">
                          <span className="font-semibold">{letter}.</span>
                          <span>{p.right}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground print:text-gray-500">
        - สิ้นสุดแบบทดสอบ ({questions.length} ข้อ) -
      </footer>
    </div>
  );
};

/**
 * PrintableOMRSheet.tsx
 * กระดาษคำตอบ OMR A4 พร้อม Fiducial Corner Markers 4 มุม
 * สำหรับตรวจด้วยกล้องมือถือครู (Mobile AI Vision OMR Scanner)
 */
import React from 'react';
import type { ExamSetRow } from '@/services/exam.service';

interface PrintableOMRSheetProps {
  examSet: ExamSetRow;
  schoolName?: string;
  totalQuestions?: number;
  version?: 'A' | 'B';
}

export const PrintableOMRSheet: React.FC<PrintableOMRSheetProps> = ({
  examSet,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  totalQuestions,
  version = 'A',
}) => {
  const rawQuestions = Array.isArray(examSet.questions) ? examSet.questions : [];
  
  // Categorize questions into sections
  const mcqQuestions: any[] = [];
  const fillinQuestions: any[] = [];
  const essayQuestions: any[] = [];

  rawQuestions.forEach((q: any, idx: number) => {
    const qType = q.question_type || q.type || 'mcq';
    const item = { ...q, questionNumber: idx + 1 };
    if (qType === 'essay') {
      essayQuestions.push(item);
    } else if (qType === 'fillin') {
      fillinQuestions.push(item);
    } else {
      mcqQuestions.push(item);
    }
  });

  const totalPoints = rawQuestions.reduce((sum, q: any) => {
    const pts = Number(q.points) > 0 ? Number(q.points) : (q.rubric?.full_score || 1);
    return sum + pts;
  }, 0) || rawQuestions.length || 20;

  const mcqPoints = mcqQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
  const fillinPoints = fillinQuestions.reduce((sum, q) => sum + (Number(q.points) || 2), 0);
  const essayPoints = essayQuestions.reduce((sum, q) => sum + (Number(q.rubric?.full_score) || Number(q.points) || 5), 0);

  const hasNonMcq = fillinQuestions.length > 0 || essayQuestions.length > 0;
  const mcqCount = mcqQuestions.length > 0 ? mcqQuestions.length : (totalQuestions || 20);

  // แบ่งออกเป็นคอลัมน์ คอลัมน์ละ 10 หรือ 15 ข้อ
  const perCol = mcqCount <= 20 ? 10 : mcqCount <= 30 ? 15 : 20;
  const colCount = Math.max(1, Math.ceil(mcqCount / perCol));

  const columns: Array<{ questionNumber: number }>[] = [];
  for (let c = 0; c < colCount; c++) {
    const start = c * perCol;
    const end = Math.min(start + perCol, mcqCount);
    const colItems: Array<{ questionNumber: number }> = [];
    for (let i = start; i < end; i++) {
      const qNum = mcqQuestions[i] ? mcqQuestions[i].questionNumber : i + 1;
      colItems.push({ questionNumber: qNum });
    }
    columns.push(colItems);
  }

  const colGridClass =
    colCount === 1 ? 'grid-cols-1' : colCount === 2 ? 'grid-cols-2' : colCount === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="printable-omr-container relative p-8 max-w-3xl mx-auto bg-background text-foreground font-sans print:p-6 print:max-w-none print:bg-white print:text-black">
      {/* ── 4 Fiducial Corner Alignment Markers (สำหรับการตรวจจับของกล้อง) ── */}
      <div className="absolute top-4 left-4 w-6 h-6 bg-black" aria-hidden="true" />
      <div className="absolute top-4 right-4 w-6 h-6 bg-black" aria-hidden="true" />
      <div className="absolute bottom-4 left-4 w-6 h-6 bg-black" aria-hidden="true" />
      <div className="absolute bottom-4 right-4 w-6 h-6 bg-black" aria-hidden="true" />

      {/* ── Header ── */}
      <div className="text-center border-b-2 border-foreground/80 pb-3 mb-4 relative">
        {/* Form Version Stamp for Camera Detection */}
        <div className="absolute top-0 right-8 border-2 border-foreground px-2 py-0.5 rounded font-black text-sm print:border-black">
          ฉบับ {version}
        </div>

        <h1 className="text-lg font-bold tracking-tight">{schoolName}</h1>
        <h2 className="text-base font-semibold mt-0.5 flex items-center justify-center gap-2">
          <span>กระดาษคำตอบ OMR (มาตรฐาน)</span>
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold print:border print:border-black print:text-black">
            ฉบับ {version} (Form {version})
          </span>
        </h2>
        <div className="text-xs text-muted-foreground print:text-gray-600 mt-1">
          {examSet.title} · {examSet.subject} ({examSet.grade}) · จำนวน {rawQuestions.length || mcqCount} ข้อ (คะแนนเต็ม {totalPoints} คะแนน)
        </div>
      </div>

      {/* ── ข้อมูลผู้เข้าสอบ & บล็อกฝนเลขที่ OMR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 border border-border rounded-lg text-xs mb-5 print:bg-transparent print:border-gray-400">
        {/* ข้อมูลชื่อ-ชั้น */}
        <div className="space-y-2">
          <div className="font-semibold text-xs text-foreground/90">ข้อมูลผู้เข้าสอบ:</div>
          <div>ชื่อ-นามสกุล: ........................................................</div>
          <div className="flex gap-3">
            <span>ชั้น: ....................</span>
            <span>ห้อง: ........</span>
          </div>
          <div className="text-[11px] text-muted-foreground print:text-gray-600">
            * กรุณาระบายวงกลมเลขที่ 2 หลักด้านขวา
          </div>
        </div>

        {/* บล็อกฝนรหัสเลขที่นักเรียน (2 หลัก: หลักสิบ / หลักหน่วย) */}
        <div className="border-t sm:border-t-0 sm:border-l sm:pl-3 border-border print:border-gray-300">
          <div className="font-semibold text-xs text-foreground/90 mb-1 text-center">
            เลขที่นักเรียน (2 หลัก)
          </div>
          <div className="flex gap-4 items-start justify-center">
            {/* หลักสิบ (0-4) */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-muted-foreground print:text-black">หลักสิบ</span>
              <div className="grid grid-cols-1 gap-0.5 mt-1">
                {[0, 1, 2, 3, 4].map((d) => (
                  <span
                    key={d}
                    className="w-4 h-4 rounded-full border border-foreground/80 print:border-black flex items-center justify-center text-[9px] font-bold select-none mx-auto"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* หลักหน่วย (0-9) */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-muted-foreground print:text-black">หลักหน่วย</span>
              <div className="grid grid-cols-2 gap-0.5 mt-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <span
                    key={d}
                    className="w-4 h-4 rounded-full border border-foreground/80 print:border-black flex items-center justify-center text-[9px] font-bold select-none mx-auto"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* คำแนะนำการระบาย */}
        <div className="border-t sm:border-t-0 sm:border-l sm:pl-3 border-border print:border-gray-300 space-y-1">
          <div className="font-semibold text-xs text-foreground/90">คำแนะนำการฝนคำตอบ:</div>
          <div className="text-[11px] leading-tight text-muted-foreground print:text-gray-700">
            • ใช้ดินสอ 2B หรือปากกาสีน้ำเงิน/ดำ ระบายให้เต็มวงกลม<br />
            • ห้ามพับ ห้ามขีดเขียนนอกกรอบ และห้ามกากบาท (✕)
          </div>
          <div className="flex items-center gap-3 pt-1 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full bg-black" />
              <span className="text-green-600 font-medium">ถูกต้อง</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full border border-black text-center leading-3 font-bold text-red-500">✕</span>
              <span className="text-red-600 font-medium">ไม่ถูกต้อง</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── ตอนที่ 1: ตารางฝนคำตอบปรนัย (OMR Bubble Grid) ── */}
      <div className="border border-border/80 rounded-lg p-4 bg-card print:bg-transparent print:border-gray-400 mb-4">
        {hasNonMcq && (
          <div className="text-xs font-bold text-primary mb-3 pb-1 border-b border-border/60 flex justify-between items-center">
            <span>ตอนที่ 1: แบบเลือกตอบปรนัย (ข้อ {mcqQuestions[0]?.questionNumber || 1} – {mcqQuestions[mcqQuestions.length - 1]?.questionNumber || mcqCount})</span>
            <span className="text-muted-foreground font-normal">ข้อละ 1 คะแนน · รวม {mcqPoints} คะแนน</span>
          </div>
        )}

        <div
          className={`grid ${colGridClass} gap-6 divide-x divide-border/60 print:divide-gray-300`}
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {columns.map((col, colIdx) => (
            <div key={colIdx} className={colIdx > 0 ? 'pl-6' : ''}>
              <div className="grid grid-cols-[28px_repeat(4,1fr)] items-center text-center font-bold text-xs text-muted-foreground print:text-black mb-2 pb-1 border-b border-border/40">
                <span>ข้อ</span>
                <span>ก</span>
                <span>ข</span>
                <span>ค</span>
                <span>ง</span>
              </div>

              <div className="space-y-2">
                {col.map((item) => (
                  <div
                    key={item.questionNumber}
                    className="grid grid-cols-[28px_repeat(4,1fr)] items-center text-center text-xs"
                  >
                    <span className="font-bold text-muted-foreground print:text-black text-left">
                      {item.questionNumber}.
                    </span>
                    {['ก', 'ข', 'ค', 'ง'].map((label, optIdx) => (
                      <div key={optIdx} className="flex justify-center">
                        <span className="w-5 h-5 rounded-full border-2 border-foreground/70 print:border-black flex items-center justify-center text-[10px] font-semibold select-none">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ตอนที่ 2: ข้อสอบแบบเติมคำ (ถ้ามี) ── */}
      {fillinQuestions.length > 0 && (
        <div className="border border-border/80 rounded-lg p-3 bg-muted/10 print:bg-transparent print:border-gray-400 mb-4">
          <div className="text-xs font-bold text-primary mb-2 flex justify-between items-center pb-1 border-b border-border/60">
            <span>ตอนที่ 2: แบบเติมคำตอบสั้น (Fill-in) จำนวน {fillinQuestions.length} ข้อ</span>
            <span className="text-muted-foreground font-normal">รวม {fillinPoints} คะแนน</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {fillinQuestions.map((q) => {
              const pts = Number(q.points) > 0 ? Number(q.points) : 2;
              return (
                <div key={q.questionNumber} className="flex items-center gap-2 p-1.5 border border-dashed border-border rounded">
                  <span className="font-bold text-muted-foreground min-w-[20px]">{q.questionNumber}.</span>
                  <div className="flex-1 border-b border-dotted border-foreground/50 h-5" />
                  <span className="text-[10px] font-semibold text-muted-foreground print:text-black min-w-[50px] text-right">
                    [ ... / {pts} ]
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ตอนที่ 3: ข้อสอบอัตนัย / แสดงวิธีทำ (ถ้ามี) ── */}
      {essayQuestions.length > 0 && (
        <div className="border border-border/80 rounded-lg p-3 bg-muted/10 print:bg-transparent print:border-gray-400 mb-4">
          <div className="text-xs font-bold text-primary mb-2 flex justify-between items-center pb-1 border-b border-border/60">
            <span>ตอนที่ 3: แบบอัตนัย / แสดงวิธีทำ (Essay) จำนวน {essayQuestions.length} ข้อ</span>
            <span className="text-muted-foreground font-normal">รวม {essayPoints} คะแนน</span>
          </div>
          <div className="space-y-2 text-xs">
            {essayQuestions.map((q) => {
              const pts = Number(q.rubric?.full_score) || Number(q.points) || 5;
              return (
                <div key={q.questionNumber} className="p-2 border border-dashed border-border rounded flex flex-wrap justify-between items-center gap-2">
                  <div className="font-bold text-muted-foreground">ข้อที่ {q.questionNumber} (เขียนตอบลงในกระดาษคำถาม)</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>เกณฑ์รูบริก: คะแนนเต็ม {pts} คะแนน</span>
                    <span className="border border-foreground/80 px-2 py-0.5 rounded font-bold">
                      ได้: [ .......... / {pts} ]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ช่องตรวจคะแนนสำหรับครู ── */}
      <div className="mt-4 p-3 border border-dashed border-border rounded-lg flex flex-wrap justify-between items-center text-xs print:border-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold">ช่องสำหรับครูผู้ตรวจ:</span>
          {hasNonMcq ? (
            <span className="font-medium">
              ตอน 1: [ ... / {mcqPoints} ] + ตอน 2: [ ... / {fillinPoints} ] + ตอน 3: [ ... / {essayPoints} ] = <strong>รวม [ ............ / {totalPoints} ]</strong>
            </span>
          ) : (
            <span>คะแนนที่ได้: [ .................... / {totalPoints} ]</span>
          )}
        </div>
        <div>
          ลงชื่อครูผู้ตรวจ: ................................................................
        </div>
      </div>

      <div className="text-center text-[10px] text-muted-foreground print:text-gray-500 mt-4">
        * เอกสารประเมินผลการเรียนรู้ โรงเรียนบ้านคำไผ่ — ระบบ OMR AI Vision
      </div>
    </div>
  );
};

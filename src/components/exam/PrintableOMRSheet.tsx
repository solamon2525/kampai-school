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
  const qCount =
    totalQuestions ||
    (Array.isArray(examSet.questions) ? examSet.questions.length : 20);

  // แบ่งออกเป็นคอลัมน์ คอลัมน์ละ 10 หรือ 15 ข้อ
  const perCol = qCount <= 20 ? 10 : qCount <= 30 ? 15 : 20;
  const colCount = Math.ceil(qCount / perCol);

  const columns: number[][] = [];
  for (let c = 0; c < colCount; c++) {
    const start = c * perCol;
    const end = Math.min(start + perCol, qCount);
    const colItems: number[] = [];
    for (let i = start; i < end; i++) {
      colItems.push(i + 1);
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
          {examSet.title} · {examSet.subject} ({examSet.grade}) · จำนวน {qCount} ข้อ
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

      {/* ── ตารางฝนคำตอบ (OMR Bubble Grid) ── */}
      <div className="border border-border/80 rounded-lg p-4 bg-card print:bg-transparent print:border-gray-400">
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
                {col.map((qNum) => (
                  <div
                    key={qNum}
                    className="grid grid-cols-[28px_repeat(4,1fr)] items-center text-center text-xs"
                  >
                    <span className="font-bold text-muted-foreground print:text-black text-left">
                      {qNum}.
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

      {/* ── ช่องตรวจคะแนนสำหรับครู ── */}
      <div className="mt-5 p-3 border border-dashed border-border rounded-lg flex flex-wrap justify-between items-center text-xs print:border-gray-400">
        <div className="flex items-center gap-3">
          <span className="font-bold">ช่องสำหรับครูผู้ตรวจ:</span>
          <span>คะแนนที่ได้: [ .................... / {qCount} ]</span>
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

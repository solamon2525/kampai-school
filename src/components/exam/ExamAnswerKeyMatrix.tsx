/**
 * ExamAnswerKeyMatrix.tsx
 * ตารางเทียบเฉลยคู่ขนาน (Form A vs Form B Answer Key Matrix)
 * แสดงคู่คำตอบที่ถูกต้องของชุดข้อสอบฉบับ A และฉบับ B ข้างกันอย่างชัดเจน
 * สำหรับครูใช้พกเข้าห้องสอบหรือติดโต๊ะตรวจกระดาษคำตอบ
 */

import React from 'react';
import type { ExamSetRow } from '@/services/exam.service';
import { generateAnswerKeyMatrix, type ExamQuestionInput } from '@/lib/exam/multiVersion';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ExamAnswerKeyMatrixProps {
  examSet: ExamSetRow;
  schoolName?: string;
}

export const ExamAnswerKeyMatrix: React.FC<ExamAnswerKeyMatrixProps> = ({
  examSet,
  schoolName = 'โรงเรียนบ้านคำไผ่',
}) => {
  const rawQuestions = Array.isArray(examSet.questions) ? (examSet.questions as ExamQuestionInput[]) : [];
  const matrix = generateAnswerKeyMatrix(rawQuestions, examSet.id || examSet.title);

  return (
    <div className="bg-background text-foreground p-6 max-w-4xl mx-auto font-sans print:p-0 print:max-w-none print:bg-white print:text-black">
      {/* Top action for screen only */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <div>
          <h2 className="text-base font-bold">ตารางเฉลยคู่ขนาน (Form A vs Form B)</h2>
          <p className="text-xs text-muted-foreground">สำหรับครูผู้สอนใช้ตรวจข้อสอบที่สลับข้อ/สลับตัวเลือก</p>
        </div>
        <Button size="sm" onClick={() => window.print()} className="h-8 text-xs gap-1.5">
          <Printer className="h-3.5 w-3.5" />
          พิมพ์ตารางเฉลย
        </Button>
      </div>

      {/* Printable Header */}
      <header className="border-b-2 border-foreground/80 pb-3 mb-4 text-center">
        <h1 className="text-base font-bold">{schoolName}</h1>
        <h2 className="text-sm font-semibold">ตารางเทียบเฉลยคู่ขนาน (ฉบับ A vs ฉบับ B)</h2>
        <div className="text-xs text-muted-foreground print:text-gray-600 mt-0.5">
          {examSet.title} · กลุ่มสาระ{examSet.subject} · ชั้น{examSet.grade} · จำนวน {matrix.length} ข้อ
        </div>
      </header>

      {/* Guide Note */}
      <div className="bg-muted/40 p-2.5 rounded-lg text-xs mb-4 border border-border/60 print:bg-transparent print:border-gray-400">
        <span className="font-semibold text-primary">คำแนะนำสำหรับครู:</span>
        <span className="ml-1 text-muted-foreground print:text-black">
          นักเรียนที่ถือ <strong>ฉบับ A</strong> และ <strong>ฉบับ B</strong> มีโจทย์เดียวกันแต่สลับลำดับข้อและตัวเลือก สามารถตรวจเทียบคำตอบได้ทันทีจากตารางด้านล่าง
        </span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border border-border rounded-lg print:border-gray-400">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border text-muted-foreground print:bg-gray-100 print:text-black font-semibold">
              <th className="py-2 px-3 text-center w-14 border-r border-border">#</th>
              <th className="py-2 px-4 border-r border-border">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-bold text-foreground print:text-black">ฉบับ A (Form A)</span>
                </div>
              </th>
              <th className="py-2 px-4 border-r border-border">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span className="font-bold text-foreground print:text-black">ฉบับ B (Form B)</span>
                </div>
              </th>
              <th className="py-2 px-3">เนื้อหาคำถาม (สังเขป)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 print:divide-gray-300">
            {matrix.map((row) => (
              <tr key={row.questionNumber} className="hover:bg-muted/20 print:hover:bg-transparent">
                <td className="py-2 px-3 text-center font-bold text-muted-foreground print:text-black border-r border-border">
                  {row.questionNumber}
                </td>
                <td className="py-2 px-4 border-r border-border">
                  <span className="text-muted-foreground mr-1.5">ข้อ {row.formAQuestionNumber}:</span>
                  <span className="font-bold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 print:bg-transparent print:border-none print:text-black">
                    {row.formACorrectChoice}
                  </span>
                </td>
                <td className="py-2 px-4 border-r border-border">
                  <span className="text-muted-foreground mr-1.5">ข้อ {row.formBQuestionNumber}:</span>
                  <span className="font-bold text-sm text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 print:bg-transparent print:border-none print:text-black">
                    {row.formBCorrectChoice}
                  </span>
                </td>
                <td className="py-2 px-3 text-muted-foreground print:text-black truncate max-w-xs">
                  {row.questionSnippet}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 pt-3 border-t border-border text-center text-[11px] text-muted-foreground print:text-gray-500">
        - โรงเรียนบ้านคำไผ่ ระบบออกข้อสอบคู่ขนานมาตรฐาน สพฐ. -
      </footer>
    </div>
  );
};

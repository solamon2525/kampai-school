import React from 'react';
import type { ObecGradeSubjectRow } from '@/services/curriculum-subjects.service';

export interface ClassSummaryStudentRow {
  studentId: string;
  classNumber: number | null;
  studentCode: string | null;
  name: string;
  subjectGrades: Record<string, string>; // subject_code -> grade ('4', '3.5', etc.)
  totalGradePoints: number;
  totalCredits: number;
  gpa: number;
  rank: number;
  decision: string;
}

export interface PrintableClassSummaryReportProps {
  selectedClass: string;
  academicYear: string;
  subjects: ObecGradeSubjectRow[];
  studentRows: ClassSummaryStudentRow[];
  schoolName?: string;
  homeroomTeacher?: string;
  directorName?: string;
}

export const PrintableClassSummaryReport: React.FC<PrintableClassSummaryReportProps> = ({
  selectedClass,
  academicYear,
  subjects,
  studentRows,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  homeroomTeacher = 'ครูประจำชั้น',
  directorName = 'ผู้อำนวยการโรงเรียนบ้านคำไผ่',
}) => {
  // Calculate grade distribution statistics per subject
  const gradeLevels = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];
  const statsPerSubject: Record<string, Record<string, number>> = {};

  subjects.forEach((sub) => {
    statsPerSubject[sub.subject_code] = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0,
    };
  });

  studentRows.forEach((row) => {
    subjects.forEach((sub) => {
      const g = row.subjectGrades[sub.subject_code] || '0';
      if (statsPerSubject[sub.subject_code][g] !== undefined) {
        statsPerSubject[sub.subject_code][g] += 1;
      }
    });
  });

  return (
    <div className="printable-class-summary bg-card text-foreground font-sans p-6 max-w-[297mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 text-[11px] leading-tight">
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-black space-y-0.5">
        <div className="font-bold text-base">
          แบบรายงานสรุปผลการประเมินการเรียนรู้ประจำชั้นเรียน (ปพ.๕-ป)
        </div>
        <div className="text-xs font-semibold">
          {schoolName} ชั้น {selectedClass} ปีการศึกษา {academicYear}
        </div>
        <div className="text-[10px] text-neutral-800">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษายโสธร เขต 1 · หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง 2560)
        </div>
      </div>

      {/* Main Grade Matrix Table */}
      <div className="mt-2.5 overflow-x-auto">
        <table className="w-full border-collapse border border-black text-center text-[10px]">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-black">
              <th className="border border-black p-1 w-7">เลขที่</th>
              <th className="border border-black p-1 w-16">รหัส</th>
              <th className="border border-black p-1 text-left px-2 min-w-[140px]">ชื่อ-นามสกุล</th>
              {subjects.map((sub) => (
                <th key={sub.id} className="border border-black p-1 min-w-[42px]" title={sub.subject_name}>
                  <div className="font-mono text-[9px]">{sub.subject_code}</div>
                  <div className="text-[8px] font-normal text-neutral-600 truncate max-w-[55px] mx-auto">
                    {sub.subject_name}
                  </div>
                  <div className="text-[8px] font-mono font-normal">({Number(sub.credit_units).toFixed(1)})</div>
                </th>
              ))}
              <th className="border border-black p-1 w-14 font-mono">GPA</th>
              <th className="border border-black p-1 w-10">อันดับ</th>
              <th className="border border-black p-1 w-16">ผลการเรียน</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.length === 0 ? (
              <tr>
                <td colSpan={subjects.length + 6} className="border border-black p-4 text-center text-neutral-500">
                  ยังไม่มีข้อมูลนักเรียนในชั้นเรียนนี้
                </td>
              </tr>
            ) : (
              studentRows.map((row) => (
                <tr key={row.studentId} className="border-b border-black/60 hover:bg-neutral-50">
                  <td className="border border-black p-1 font-mono font-medium">{row.classNumber || '-'}</td>
                  <td className="border border-black p-1 font-mono">{row.studentCode || '-'}</td>
                  <td className="border border-black p-1 text-left px-2 font-medium truncate max-w-[150px]">
                    {row.name}
                  </td>
                  {subjects.map((sub) => {
                    const grade = row.subjectGrades[sub.subject_code] || '-';
                    return (
                      <td key={sub.id} className="border border-black p-1 font-mono font-semibold">
                        {grade}
                      </td>
                    );
                  })}
                  <td className="border border-black p-1 font-mono font-bold text-neutral-900 bg-neutral-50">
                    {row.gpa.toFixed(2)}
                  </td>
                  <td className="border border-black p-1 font-mono">{row.rank}</td>
                  <td className="border border-black p-1 font-semibold">{row.decision}</td>
                </tr>
              ))
            )}
          </tbody>

          {/* Statistics Footers */}
          {studentRows.length > 0 && (
            <tfoot>
              {gradeLevels.slice(0, 4).map((gl) => (
                <tr key={gl} className="bg-neutral-50 text-[9px]">
                  <td colSpan={3} className="border border-black p-0.5 text-right px-2 font-medium">
                    จำนวนนักเรียนที่ได้เกรด {gl}
                  </td>
                  {subjects.map((sub) => (
                    <td key={sub.id} className="border border-black p-0.5 font-mono">
                      {statsPerSubject[sub.subject_code]?.[gl] || 0}
                    </td>
                  ))}
                  <td colSpan={3} className="border border-black p-0.5"></td>
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>

      {/* Bottom Signatures */}
      <div className="grid grid-cols-3 gap-6 text-center text-xs mt-6 pt-2">
        <div className="space-y-1">
          <div className="h-8"></div>
          <div>(ลงชื่อ).......................................................</div>
          <div className="font-medium">({homeroomTeacher})</div>
          <div className="text-[10px] text-neutral-600">ครูประจำชั้น</div>
        </div>

        <div className="space-y-1">
          <div className="h-8"></div>
          <div>(ลงชื่อ).......................................................</div>
          <div className="font-medium">(นายทะเบียน / งานวัดผล)</div>
          <div className="text-[10px] text-neutral-600">หัวหน้าฝ่ายวิชาการ</div>
        </div>

        <div className="space-y-1">
          <div className="h-8"></div>
          <div>(ลงชื่อ).......................................................</div>
          <div className="font-medium">({directorName})</div>
          <div className="text-[10px] text-neutral-600">ผู้อำนวยการโรงเรียนบ้านคำไผ่</div>
        </div>
      </div>
    </div>
  );
};

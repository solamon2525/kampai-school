/**
 * PrintableParentGradeSlip.tsx
 * สลิปแจ้งผลการเรียนสำหรับผู้ปกครอง (Parent Grade Slip)
 * - ออกแบบสำหรับวันประชุมผู้ปกครองและรายงานผลรายภาคเรียน
 * - ขนาดกะทัดรัด (Compact / Half-A4 Format) พิมพ์ได้ 2 สลิปต่อ 1 แผ่น A4
 * - สรุปผลการเรียนทุกวิชา เกรดเฉลี่ย GPA และผลการประเมิน 4 มิติ
 * - ฝัง Digital QR Code สำหรับสแกนตรวจสอบความถูกต้องผ่านมือถือ
 * - มีช่องเซ็นชื่อผู้ปกครองรับทราบผลการเรียน
 */
import React from 'react';
import QRCode from 'react-qr-code';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import type { ReportCardStudent, ReportCardSubjectScore, ReportCardEvaluations } from './PrintableStudentReportCard';

export interface PrintableParentGradeSlipProps {
  student: ReportCardStudent;
  academicYear: string;
  selectedClass: string;
  scores: ReportCardSubjectScore[];
  evaluations: ReportCardEvaluations;
  schoolName?: string;
  homeroomTeacher?: string;
  showPhoto?: boolean;
  showQrVerification?: boolean;
  verificationBaseUrl?: string;
}

export const PrintableParentGradeSlip: React.FC<PrintableParentGradeSlipProps> = ({
  student,
  academicYear,
  selectedClass,
  scores,
  evaluations,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  homeroomTeacher = 'ครูประจำชั้น',
  showPhoto = true,
  showQrVerification = true,
  verificationBaseUrl = 'https://kampai-school.vercel.app/verify/grade',
}) => {
  // Calculations
  const totalCredits = scores.reduce((sum, s) => sum + Number(s.subject.credit_units || 0), 0);
  let totalGradePoints = 0;
  scores.forEach((s) => {
    const g = parseFloat(s.grade) || 0;
    const w = Number(s.subject.credit_units) || 0;
    totalGradePoints += g * w;
  });
  const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  const verificationUrl = `${verificationBaseUrl}?std=${encodeURIComponent(student.student_code || student.id)}&yr=${academicYear}`;

  return (
    <div className="printable-parent-grade-slip bg-card text-foreground font-sans p-6 max-w-[210mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 border border-border print:border-black rounded-lg print:rounded-none mb-6 text-[12px] leading-snug">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <img
            src="/logos/school-logo.webp"
            alt="ตราประจำโรงเรียนบ้านคำไผ่"
            className="w-10 h-10 object-contain"
          />
          {showPhoto && (
            <div className="print:hidden">
              <PersonAvatar
                name={student.name}
                photoUrl={student.photo_url}
                className="w-10 h-10 rounded-full border border-border"
              />
            </div>
          )}
          <div>
            <div className="font-bold text-sm tracking-wide">
              สลิปแจ้งผลการเรียน (Parent Grade Slip)
            </div>
            <div className="text-xs font-semibold text-foreground">
              {schoolName} • ชั้น{selectedClass} ปีการศึกษา {academicYear}
            </div>
          </div>
        </div>

        {/* Verification QR Code */}
        {showQrVerification && (
          <div className="flex items-center gap-2 text-right">
            <div className="text-[10px] leading-tight text-muted-foreground hidden sm:block print:block">
              <div className="font-semibold text-foreground">สแกนตรวจสอบ</div>
              <div>ผลการเรียนดิจิทัล</div>
            </div>
            <div className="p-1 bg-card border border-border rounded">
              <QRCode value={verificationUrl} size={42} />
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Row */}
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-neutral-300 text-[11px] bg-neutral-50 print:bg-transparent px-2">
        <div>
          <span className="font-semibold">ชื่อ-สกุล:</span> {student.name}
        </div>
        <div>
          <span className="font-semibold">รหัสนักเรียน:</span> {student.student_code || '-'}
        </div>
        <div>
          <span className="font-semibold">เลขที่:</span> {student.class_number ?? '-'} • <span className="font-semibold">ครูประจำชั้น:</span> {homeroomTeacher}
        </div>
      </div>

      {/* Main Table: Scores */}
      <div className="mt-2.5">
        <table className="w-full border-collapse border border-black text-[11px] text-center">
          <thead>
            <tr className="bg-neutral-100 print:bg-neutral-200 border-b border-black font-semibold">
              <th className="border border-black p-1 w-8">ที่</th>
              <th className="border border-black p-1 w-20">รหัสวิชา</th>
              <th className="border border-black p-1 text-left px-2">ชื่อรายวิชา</th>
              <th className="border border-black p-1 w-14">น.ก.</th>
              <th className="border border-black p-1 w-16">คะแนนรวม</th>
              <th className="border border-black p-1 w-14">เกรด</th>
              <th className="border border-black p-1 w-14">ผลประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, idx) => (
              <tr key={s.subject.id || idx} className="hover:bg-neutral-50">
                <td className="border border-black p-0.5">{idx + 1}</td>
                <td className="border border-black p-0.5 font-mono">{s.subject.subject_code}</td>
                <td className="border border-black p-0.5 text-left px-2">{s.subject.subject_name}</td>
                <td className="border border-black p-0.5 font-mono">{s.subject.credit_units}</td>
                <td className="border border-black p-0.5 font-mono font-semibold">{s.totalScore}</td>
                <td className="border border-black p-0.5 font-mono font-bold text-xs">{s.grade}</td>
                <td className="border border-black p-0.5 text-[10px]">
                  {s.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100 print:bg-neutral-200 border-t-2 border-black font-bold">
              <td colSpan={3} className="border border-black p-1 text-right px-2">
                รวมทั้งสิ้น / ผลการเรียนเฉลี่ย (GPA)
              </td>
              <td className="border border-black p-1 font-mono">{totalCredits}</td>
              <td className="border border-black p-1">-</td>
              <td className="border border-black p-1 font-mono text-sm underline">{gpa}</td>
              <td className="border border-black p-1 text-emerald-700">ผ่าน</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Evaluations Summary & Acknowledgement Block */}
      <div className="grid grid-cols-2 gap-3 mt-2.5 pt-1 text-[11px]">
        {/* 4 Evaluations */}
        <div className="p-2 border border-neutral-300 rounded bg-neutral-50 print:bg-transparent space-y-0.5">
          <div className="font-bold border-b border-neutral-300 pb-0.5 mb-1">
            สรุปผลการประเมิน ๔ มิติ
          </div>
          <div className="flex justify-between">
            <span>• คุณลักษณะอันพึงประสงค์:</span>
            <span className="font-semibold">{evaluations.characterGrade || 'ดีเยี่ยม'}</span>
          </div>
          <div className="flex justify-between">
            <span>• สมรรถนะสำคัญของผู้เรียน:</span>
            <span className="font-semibold">{evaluations.competencyGrade || 'ดีเยี่ยม'}</span>
          </div>
          <div className="flex justify-between">
            <span>• การอ่าน คิดวิเคราะห์ และเขียน:</span>
            <span className="font-semibold">{evaluations.readingGrade || 'ดีเยี่ยม'}</span>
          </div>
          <div className="flex justify-between">
            <span>• กิจกรรมพัฒนาผู้เรียน:</span>
            <span className="font-semibold">{evaluations.activityGrade || 'ผ่าน'}</span>
          </div>
        </div>

        {/* Parent Acknowledgement Signature Block */}
        <div className="p-2 border border-black rounded flex flex-col justify-between text-center">
          <div className="font-bold text-[11px]">
            การรับทราบผลการเรียนของผู้ปกครอง
          </div>
          <div className="text-[10px] text-neutral-700 mt-1">
            ข้าพเจ้าได้รับทราบผลการพัฒนาคุณภาพการเรียนรู้ของนักเรียนแล้ว
          </div>
          <div className="pt-4">
            <div>ลงชื่อ..............................................................ผู้ปกครอง</div>
            <div className="text-[10px] text-neutral-600 mt-0.5">(............................................................)</div>
            <div className="text-[10px] text-neutral-600">วันที่............/............/............</div>
          </div>
        </div>
      </div>
    </div>
  );
};

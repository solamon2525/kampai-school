/**
 * PrintableAcademicCertificate.tsx
 * ใบรับรองผลการศึกษา / ใบรับรองสภาพการเป็นนักเรียน (ปพ.๗)
 * - รูปแบบเอกสารราชการมาตรฐานสำหรับยื่นศึกษาต่อหรือขอทุนการศึกษา
 * - หัวหนังสือราชการ ตราโรงเรียน เลขที่หนังสือ วันที่ออกเอกสาร
 * - ตารางสรุปรายวิชา ผลการเรียนเฉลี่ยสะสม (GPA) และความประพฤติ
 * - ลายมือชื่อผู้อำนวยการโรงเรียนและตราประทับ
 * - ฝัง Digital QR Code สำหรับยืนยันความถูกต้องของเอกสาร
 */
import React from 'react';
import QRCode from 'react-qr-code';
import type { ReportCardStudent, ReportCardSubjectScore, ReportCardEvaluations } from './PrintableStudentReportCard';

export interface PrintableAcademicCertificateProps {
  student: ReportCardStudent;
  academicYear: string;
  selectedClass: string;
  scores: ReportCardSubjectScore[];
  evaluations: ReportCardEvaluations;
  schoolName?: string;
  directorName?: string;
  certificateNumber?: string;
  issueDate?: string;
  showSchoolCrest?: boolean;
  showQrVerification?: boolean;
  verificationBaseUrl?: string;
}

const toThaiNumerals = (str: string | number) =>
  String(str).replace(/[0-9]/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d, 10)]);

export const PrintableAcademicCertificate: React.FC<PrintableAcademicCertificateProps> = ({
  student,
  academicYear = '2569',
  selectedClass,
  scores,
  evaluations,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  directorName = 'นายสมพิศ แรงน้อย',
  certificateNumber,
  issueDate,
  showSchoolCrest = true,
  showQrVerification = true,
  verificationBaseUrl = 'https://kampai-school.vercel.app/verify/cert',
}) => {
  const displayCertNumber = certificateNumber || `คภ. ${toThaiNumerals(academicYear)}/๐๐๑`;
  const displayIssueDate = issueDate || `๓๑ มีนาคม ${toThaiNumerals(academicYear)}`;
  // Calculations
  const totalCredits = scores.reduce((sum, s) => sum + Number(s.subject.credit_units || 0), 0);
  let totalGradePoints = 0;
  scores.forEach((s) => {
    const g = parseFloat(s.grade) || 0;
    const w = Number(s.subject.credit_units) || 0;
    totalGradePoints += g * w;
  });
  const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  const verificationUrl = `${verificationBaseUrl}?std=${encodeURIComponent(student.student_code || student.id)}&cert=${encodeURIComponent(displayCertNumber)}`;

  return (
    <div className="printable-academic-certificate bg-card text-foreground font-sans p-8 max-w-[210mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 border border-border print:border-none text-[13px] leading-relaxed">
      {/* Top Header: Official Seal / Crest & Doc Number */}
      <div className="flex items-start justify-between pb-3">
        <div className="text-xs space-y-0.5">
          <div>ที่ ศธ ๐๔๑๐๔.๒๗ / {displayCertNumber}</div>
        </div>

        {/* Center: School Crest */}
        {showSchoolCrest && (
          <div className="text-center flex flex-col items-center">
            <img
              src="/logos/school-logo.webp"
              alt="ตราประจำโรงเรียนบ้านคำไผ่"
              className="w-16 h-16 object-contain mb-1"
            />
          </div>
        )}

        <div className="text-xs text-right space-y-0.5">
          <div>{schoolName}</div>
          <div>๑๕๙ หมู่ ๗ ต.เวียงคำ อ.กุมภวาปี จ.อุดรธานี ๔๑๑๑๐</div>
          <div>วันที่ {displayIssueDate}</div>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center my-4 space-y-1">
        <div className="text-xl font-bold tracking-wide">
          ใบรับรองผลการศึกษาและสภาพการเป็นนักเรียน (ปพ.๗)
        </div>
        <div className="text-xs text-neutral-700">
          สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต ๒
        </div>
      </div>

      {/* Body Certifying Paragraph */}
      <div className="indent-10 text-justify text-[13px] my-4 leading-relaxed">
        หนังสือฉบับนี้ขอรับรองว่า <span className="font-bold underline">{student.name}</span>{' '}
        เลขประจำตัวนักเรียน <span className="font-bold underline">{student.student_code || '-'}</span>{' '}
        เป็นนักเรียนชั้น<span className="font-bold underline">{selectedClass}</span> ปีการศึกษา{' '}
        <span className="font-bold underline">{academicYear}</span> ของ{schoolName} จริง{' '}
        มีความประพฤติเรียบร้อย มีผลสัมฤทธิ์ทางการเรียนและระดับผลการเรียนเฉลี่ยตลอดปีการศึกษา ดังปรากฏผลการประเมินต่อไปนี้:
      </div>

      {/* Summary Scores Table */}
      <div className="my-3">
        <table className="w-full border-collapse border border-black text-xs text-center">
          <thead>
            <tr className="bg-neutral-100 print:bg-neutral-200 border-b border-black font-semibold">
              <th className="border border-black p-1 w-10">ที่</th>
              <th className="border border-black p-1 w-24">รหัสวิชา</th>
              <th className="border border-black p-1 text-left px-2">ชื่อรายวิชา</th>
              <th className="border border-black p-1 w-16">ประเภท</th>
              <th className="border border-black p-1 w-16">หน่วยกิต</th>
              <th className="border border-black p-1 w-20">ระดับผลการเรียน</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, idx) => (
              <tr key={s.subject.id || idx}>
                <td className="border border-black p-1">{idx + 1}</td>
                <td className="border border-black p-1 font-mono">{s.subject.subject_code}</td>
                <td className="border border-black p-1 text-left px-2">{s.subject.subject_name}</td>
                <td className="border border-black p-1">{s.subject.subject_type}</td>
                <td className="border border-black p-1 font-mono">{s.subject.credit_units}</td>
                <td className="border border-black p-1 font-mono font-bold">{s.grade}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100 print:bg-neutral-200 border-t-2 border-black font-bold">
              <td colSpan={4} className="border border-black p-1 text-right px-3">
                รวมหน่วยกิตและผลการเรียนเฉลี่ยสะสม (GPA)
              </td>
              <td className="border border-black p-1 font-mono">{totalCredits}</td>
              <td className="border border-black p-1 font-mono text-sm underline">{gpa}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Character and Competency Note */}
      <div className="text-xs my-3 grid grid-cols-2 gap-2 p-2 border border-neutral-300 rounded">
        <div>
          • ผลการประเมินคุณลักษณะอันพึงประสงค์: <span className="font-bold">{evaluations.characterGrade || 'ดีเยี่ยม'}</span>
        </div>
        <div>
          • ผลการประเมินสมรรถนะสำคัญ: <span className="font-bold">{evaluations.competencyGrade || 'ดีเยี่ยม'}</span>
        </div>
        <div>
          • การอ่าน คิดวิเคราะห์ และเขียน: <span className="font-bold">{evaluations.readingGrade || 'ดีเยี่ยม'}</span>
        </div>
        <div>
          • กิจกรรมพัฒนาผู้เรียน: <span className="font-bold">{evaluations.activityGrade || 'ผ่าน'}</span>
        </div>
      </div>

      <div className="indent-10 text-[13px] my-4 leading-relaxed">
        ให้ไว้เพื่อเป็นหลักฐาน แสดงว่าข้อความดังกล่าวข้างต้นเป็นความจริงทุกประการ
      </div>

      {/* Footer: Signatures and QR Code */}
      <div className="flex items-end justify-between mt-8 pt-4">
        {/* Verification QR Code */}
        {showQrVerification ? (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-card border border-border rounded">
              <QRCode value={verificationUrl} size={50} />
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              <div className="font-bold text-foreground">เอกสารทางการ สพฐ.</div>
              <div>สแกนเพื่อตรวจสอบความถูกต้อง</div>
              <div className="font-mono text-[9px] text-muted-foreground">{displayCertNumber}</div>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Director Signature Box */}
        <div className="text-center text-xs space-y-1 w-64">
          <div className="h-12"></div>
          <div>(ลงชื่อ)............................................................</div>
          <div className="font-bold">({directorName})</div>
          <div>ผู้อำนวยการโรงเรียนบ้านคำไผ่</div>
          <div className="text-[10px] text-neutral-600">(ประทับตราประจำโรงเรียน)</div>
        </div>
      </div>
    </div>
  );
};

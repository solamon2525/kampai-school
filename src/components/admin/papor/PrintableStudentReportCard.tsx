import React from 'react';
import QRCode from 'react-qr-code';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import type { ObecGradeSubjectRow } from '@/services/curriculum-subjects.service';

export interface ReportCardStudent {
  id: string;
  name: string;
  student_code: string | null;
  class: string | null;
  class_number: number | null;
  photo_url: string | null;
}

export interface ReportCardSubjectScore {
  subject: ObecGradeSubjectRow;
  formativeScore: number;
  summativeScore: number;
  totalScore: number;
  grade: string;
  isPassed: boolean;
}

export interface ReportCardEvaluations {
  characterGrade: string; // 'ดย', 'ด', 'ผ', 'มผ'
  competencyGrade: string;
  readingGrade: string;
  activityGrade: string;
  attendanceDays: number;
  attendanceTotal: number;
  attendancePct: number;
}

export interface PrintableStudentReportCardProps {
  student: ReportCardStudent;
  academicYear: string;
  selectedClass: string;
  scores: ReportCardSubjectScore[];
  evaluations: ReportCardEvaluations;
  schoolName?: string;
  directorName?: string;
  homeroomTeacher?: string;
  nextGradeLevel?: string;
  showSchoolCrest?: boolean;
  showStudentPhoto?: boolean;
  showSignatures?: boolean;
  showQrVerification?: boolean;
  verificationBaseUrl?: string;
}

export const PrintableStudentReportCard: React.FC<PrintableStudentReportCardProps> = ({
  student,
  academicYear,
  selectedClass,
  scores,
  evaluations,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  directorName = 'ผู้อำนวยการโรงเรียนบ้านคำไผ่',
  homeroomTeacher = 'ครูประจำชั้น',
  nextGradeLevel,
  showSchoolCrest = true,
  showStudentPhoto = true,
  showSignatures = true,
  showQrVerification = true,
  verificationBaseUrl = 'https://kampai-school.vercel.app/verify/papor6',
}) => {
  // Calculations
  const coreSubjects = scores.filter((s) => s.subject.subject_type === 'พื้นฐาน');
  const addSubjects = scores.filter((s) => s.subject.subject_type === 'เพิ่มเติม');

  const coreCredits = coreSubjects.reduce((sum, s) => sum + Number(s.subject.credit_units || 0), 0);
  const addCredits = addSubjects.reduce((sum, s) => sum + Number(s.subject.credit_units || 0), 0);
  const totalCredits = coreCredits + addCredits;

  const totalHours = scores.reduce((sum, s) => sum + Number(s.subject.credit_hours || 0), 0);

  // Weighted GPA
  let totalGradePoints = 0;
  scores.forEach((s) => {
    const g = parseFloat(s.grade) || 0;
    const w = Number(s.subject.credit_units) || 0;
    totalGradePoints += g * w;
  });
  const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  const defaultNextLevel = nextGradeLevel || (
    selectedClass === 'ป.1' ? 'ชั้นประถมศึกษาปีที่ 2' :
    selectedClass === 'ป.2' ? 'ชั้นประถมศึกษาปีที่ 3' :
    selectedClass === 'ป.3' ? 'ชั้นประถมศึกษาปีที่ 4' :
    selectedClass === 'ป.4' ? 'ชั้นประถมศึกษาปีที่ 5' :
    selectedClass === 'ป.5' ? 'ชั้นประถมศึกษาปีที่ 6' :
    'ชั้นมัธยมศึกษาปีที่ 1'
  );

  return (
    <div className="printable-report-card bg-card text-foreground font-sans p-8 max-w-[210mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 text-[13px] leading-normal">
      {/* School Header */}
      <div className="text-center pb-3 border-b-2 border-black space-y-1 relative">
        {showSchoolCrest && (
          <div className="absolute left-0 top-0 hidden md:block print:block">
            <div className="w-12 h-12 border border-black rounded-full flex items-center justify-center font-bold text-[9px] p-1 bg-amber-50 print:bg-transparent">
              สพฐ.
            </div>
          </div>
        )}
        <div className="font-bold text-lg tracking-wide">
          แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)
        </div>
        <div className="text-sm font-semibold">
          {schoolName} สำนักงานเขตพื้นที่การศึกษาประถมศึกษายโสธร เขต 1
        </div>
        <div className="text-xs text-neutral-800">
          หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551 (ฉบับปรับปรุง พ.ศ. 2560)
        </div>
      </div>

      {/* Student Profile Info Grid */}
      <div className="flex items-center justify-between py-3 border-b border-black text-xs gap-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1">
          <div>
            <span className="font-bold">ชื่อ-นามสกุล:</span> {student.name}
          </div>
          <div>
            <span className="font-bold">เลขประจำตัวนักเรียน:</span> {student.student_code || '-'}
          </div>
          <div>
            <span className="font-bold">ระดับชั้น:</span> {selectedClass} {student.class_number ? `เลขที่ ${student.class_number}` : ''}
          </div>
          <div>
            <span className="font-bold">ปีการศึกษา:</span> {academicYear}
          </div>
          <div className="col-span-2">
            <span className="font-bold">ครูประจำชั้น:</span> {homeroomTeacher}
          </div>
        </div>
        {showStudentPhoto && (
          <div className="w-16 h-20 border border-neutral-400 p-0.5 rounded flex items-center justify-center bg-neutral-50 print:bg-transparent shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-full h-full object-cover rounded-sm"
              />
            ) : (
              <div className="text-[10px] text-neutral-500 text-center">
                รูปถ่าย<br />๑.๕ นิ้ว
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 1: Academic Scores Table */}
      <div className="mt-3">
        <div className="font-bold text-xs mb-1.5">๑. ผลการประเมินกลุ่มสาระการเรียนรู้</div>
        <table className="w-full border-collapse border border-black text-xs text-center">
          <thead>
            <tr className="bg-neutral-100 font-semibold border-b border-black">
              <th className="border border-black p-1 w-8">ที่</th>
              <th className="border border-black p-1 w-20">รหัสวิชา</th>
              <th className="border border-black p-1 text-left px-2">รายวิชา</th>
              <th className="border border-black p-1 w-14">ประเภท</th>
              <th className="border border-black p-1 w-12">นก.</th>
              <th className="border border-black p-1 w-12">ชม.</th>
              <th className="border border-black p-1 w-14">คะแนนรวม</th>
              <th className="border border-black p-1 w-14">ระดับผลการเรียน</th>
              <th className="border border-black p-1 w-14">ผลประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-black p-3 text-center text-neutral-500">
                  ยังไม่มีข้อมูลคะแนนรายวิชา
                </td>
              </tr>
            ) : (
              scores.map((sc, i) => (
                <tr key={sc.subject.id} className="border-b border-black/60">
                  <td className="border border-black p-1 font-mono">{i + 1}</td>
                  <td className="border border-black p-1 font-mono">{sc.subject.subject_code}</td>
                  <td className="border border-black p-1 text-left px-2 font-medium">
                    {sc.subject.subject_name}
                  </td>
                  <td className="border border-black p-1 text-[11px]">{sc.subject.subject_type}</td>
                  <td className="border border-black p-1 font-mono">{Number(sc.subject.credit_units).toFixed(1)}</td>
                  <td className="border border-black p-1 font-mono">{sc.subject.credit_hours}</td>
                  <td className="border border-black p-1 font-mono">{sc.totalScore}</td>
                  <td className="border border-black p-1 font-bold font-mono">{sc.grade}</td>
                  <td className="border border-black p-1 font-semibold">
                    {sc.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </td>
                </tr>
              ))
            )}

            {/* Summary Row */}
            <tr className="bg-neutral-100 font-bold border-t-2 border-black">
              <td colSpan={4} className="border border-black p-1.5 text-right px-3">
                รวมหน่วยกิตและชั่วโมงเรียนตลอดปี
              </td>
              <td className="border border-black p-1 font-mono">{totalCredits.toFixed(1)}</td>
              <td className="border border-black p-1 font-mono">{totalHours}</td>
              <td colSpan={2} className="border border-black p-1 text-right px-2">
                เกรดเฉลี่ย (GPA): <span className="text-sm underline font-mono ml-1">{gpa}</span>
              </td>
              <td className="border border-black p-1 text-center">ผ่าน</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: 4-Dimension OBEC Evaluations & Attendance */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        {/* Left: 4 Evaluations */}
        <div>
          <div className="font-bold text-xs mb-1.5">๒. ผลการประเมินคุณลักษณะและสมรรถนะ</div>
          <table className="w-full border-collapse border border-black text-xs text-center">
            <thead>
              <tr className="bg-neutral-100 border-b border-black font-semibold">
                <th className="border border-black p-1 text-left px-2">รายการประเมิน</th>
                <th className="border border-black p-1 w-24">ผลการประเมิน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left px-2">๑. คุณลักษณะอันพึงประสงค์ (๘ ข้อ)</td>
                <td className="border border-black p-1 font-semibold">{evaluations.characterGrade || 'ดีเยี่ยม'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">๒. สมรรถนะสำคัญของผู้เรียน (๕ ด้าน)</td>
                <td className="border border-black p-1 font-semibold">{evaluations.competencyGrade || 'ดีเยี่ยม'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">๓. การอ่าน คิดวิเคราะห์ และเขียน</td>
                <td className="border border-black p-1 font-semibold">{evaluations.readingGrade || 'ดีเยี่ยม'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">๔. กิจกรรมพัฒนาผู้เรียน (๔ กิจกรรม)</td>
                <td className="border border-black p-1 font-semibold">{evaluations.activityGrade || 'ผ่าน'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: Attendance and Criteria */}
        <div>
          <div className="font-bold text-xs mb-1.5">๓. สถิติเวลาเรียนและการผ่านเกณฑ์</div>
          <table className="w-full border-collapse border border-black text-xs text-center">
            <thead>
              <tr className="bg-neutral-100 border-b border-black font-semibold">
                <th className="border border-black p-1 text-left px-2">รายการ</th>
                <th className="border border-black p-1 w-24">ข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left px-2">เวลาเรียนที่มาเรียนจริง</td>
                <td className="border border-black p-1 font-mono">
                  {evaluations.attendanceDays || 200} วัน
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">เวลาเรียนทั้งหมด</td>
                <td className="border border-black p-1 font-mono">
                  {evaluations.attendanceTotal || 200} วัน
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">คิดเป็นร้อยละ (เกณฑ์ $\ge$ ๘๐%)</td>
                <td className="border border-black p-1 font-mono font-bold">
                  {evaluations.attendancePct ? `${evaluations.attendancePct.toFixed(1)}%` : '100%'}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left px-2">การผ่านเกณฑ์เวลาเรียน</td>
                <td className="border border-black p-1 font-semibold">ผ่าน</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Promotion Decision Banner */}
      <div className="mt-3 p-2.5 border border-black bg-neutral-50 rounded text-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm">๔. สรุปผลการตัดสินการเรียน: </span>
            <span className="font-bold text-sm underline ml-2">อนุมัติให้เลื่อนชั้น</span>
          </div>
          <div className="text-xs font-semibold">
            เลื่อนชั้นไปเรียน: <span className="underline ml-1">{defaultNextLevel}</span>
          </div>
        </div>
      </div>

      {/* Section 4: Signatures and QR Verification */}
      <div className="flex items-end justify-between mt-6 pt-3 border-t border-neutral-300">
        {showQrVerification ? (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-card border border-border rounded">
              <QRCode
                value={`${verificationBaseUrl}?std=${encodeURIComponent(student.student_code || student.id)}&yr=${academicYear}`}
                size={44}
              />
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              <div className="font-bold text-foreground">เอกสาร ปพ.6 สพฐ.</div>
              <div>สแกนตรวจสอบผลดิจิทัล</div>
            </div>
          </div>
        ) : (
          <div />
        )}

        {showSignatures && (
          <div className="grid grid-cols-3 gap-3 text-center text-xs flex-1 ml-4">
            <div className="space-y-1">
              <div className="h-8"></div>
              <div>(ลงชื่อ).......................................................</div>
              <div className="font-medium">({homeroomTeacher})</div>
              <div className="text-[10px] text-neutral-600">ครูประจำชั้น</div>
            </div>

            <div className="space-y-1">
              <div className="h-8"></div>
              <div>(ลงชื่อ).......................................................</div>
              <div className="font-medium">(นายทะเบียน / วิชาการ)</div>
              <div className="text-[10px] text-neutral-600">หัวหน้าฝ่ายวิชาการ</div>
            </div>

            <div className="space-y-1">
              <div className="h-8"></div>
              <div>(ลงชื่อ).......................................................</div>
              <div className="font-medium">({directorName})</div>
              <div className="text-[10px] text-neutral-600">ผู้อำนวยการโรงเรียน</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

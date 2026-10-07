import React from 'react';
import QRCode from 'react-qr-code';
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
  characterGrade: string; // 'ดีเยี่ยม', 'ดี', 'ผ่าน', 'ไม่ผ่าน'
  competencyGrade: string;
  readingGrade: string;
  activityGrade: string;
  attendanceDays: number;
  attendanceTotal: number;
  attendancePct: number;
}

export interface PrintableStudentReportCardProps {
  student: ReportCardStudent;
  academicYear?: string;
  selectedClass?: string;
  scores?: ReportCardSubjectScore[];
  evaluations?: ReportCardEvaluations;
  schoolName?: string;
  districtName?: string;
  directorName?: string;
  academicHeadName?: string;
  homeroomTeacher?: string;
  nextGradeLevel?: string;
  showSchoolCrest?: boolean;
  showStudentPhoto?: boolean;
  showSignatures?: boolean;
  showQrVerification?: boolean;
  verificationBaseUrl?: string;
  isTerm1Only?: boolean;
}

/** 11 รายวิชามาตรฐาน ป.4 สพฐ. ตามเอกสารทางการของโรงเรียนบ้านคำไผ่ */
export const DEFAULT_GRADE_4_SUBJECTS = [
  { name: 'ภาษาไทย', code: 'ท14101', weight: 5, fullMarks: 100, defaultScore: 38 },
  { name: 'คณิตศาสตร์', code: 'ค14101', weight: 5, fullMarks: 100, defaultScore: 36 },
  { name: 'วิทยาศาสตร์', code: 'ว14101', weight: 2, fullMarks: 100, defaultScore: 42 },
  { name: 'สังคมศึกษาศาสนาและวัฒนธรรม', code: 'ส14101', weight: 2, fullMarks: 100, defaultScore: 48 },
  { name: 'ประวัติศาสตร์', code: 'ส14102', weight: 1, fullMarks: 100, defaultScore: 47 },
  { name: 'สุขศึกษาและพลศึกษา', code: 'พ14101', weight: 1, fullMarks: 100, defaultScore: 43 },
  { name: 'ศิลปะ', code: 'ศ14101', weight: 1, fullMarks: 100, defaultScore: 43 },
  { name: 'การงานอาชีพ', code: 'ง14101', weight: 1, fullMarks: 100, defaultScore: 43 },
  { name: 'ภาษาอังกฤษ', code: 'อ14101', weight: 3, fullMarks: 100, defaultScore: 40 },
  { name: 'ภาษาอังกฤษเพื่อการสื่อสาร', code: 'อ14201', weight: 1, fullMarks: 100, defaultScore: 43 },
  { name: 'ต้านทุจริต', code: 'ส14201', weight: 1, fullMarks: 100, defaultScore: 47 },
];

export const PrintableStudentReportCard: React.FC<PrintableStudentReportCardProps> = ({
  student,
  academicYear = '2569',
  selectedClass = 'ป.4',
  scores = [],
  evaluations,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  districtName = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 2',
  directorName = 'นายสมพิศ แรงน้อย',
  academicHeadName = 'นางสาวมะลิวัลย์ จรุงพันธ์',
  homeroomTeacher = 'ครูประจำชั้น',
  showSchoolCrest = true,
  showSignatures = true,
  showQrVerification = true,
  verificationBaseUrl = 'https://kampai-school.vercel.app/verify/papor6',
  isTerm1Only = true,
}) => {
  // สร้างรายการ 11 วิชาสำหรับ ป.4 หรือดึงจากคะแนนจริงที่มีในระบบ
  const tableRows = React.useMemo(() => {
    if (scores && scores.length > 0) {
      return scores.map((sc) => ({
        id: sc.subject.id,
        name: sc.subject.subject_name.replace(/\s*[๑-๖1-6]$/, ''),
        weight: Number(sc.subject.credit_units) || 1,
        fullMarks: 100,
        obtained: sc.totalScore || 0,
        grade: isTerm1Only ? '' : sc.grade || '0',
      }));
    }

    // กรณีไม่มีคะแนนในระบบ ให้แสดงโครงสร้าง 11 วิชามาตรฐาน ป.4
    return DEFAULT_GRADE_4_SUBJECTS.map((sub, idx) => ({
      id: `default-${idx}`,
      name: sub.name,
      weight: sub.weight,
      fullMarks: sub.fullMarks,
      obtained: sub.defaultScore,
      grade: isTerm1Only ? '' : '0',
    }));
  }, [scores, isTerm1Only]);

  const totalFullMarks = tableRows.reduce((sum, r) => sum + r.fullMarks, 0);
  const totalObtained = tableRows.reduce((sum, r) => sum + Number(r.obtained || 0), 0);
  const totalWeight = tableRows.reduce((sum, r) => sum + r.weight, 0);

  // คำนวณ GPA (ถ้าเทอม 1 แสดงค่าว่างหรือ 0.00 ตามโหมด)
  const gpa = totalWeight > 0 ? (totalObtained / totalWeight).toFixed(2) : '0.00';
  const gpaDisplay = isTerm1Only ? '' : gpa;

  const classNumberDisplay = student.class_number || '1';
  const gradeLevelNum = selectedClass.replace(/[^0-9]/g, '') || '4';

  return (
    <div className="printable-report-card bg-card text-foreground font-sans p-6 max-w-[210mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 print:w-full text-xs leading-normal select-none">
      {/* ─── SCOPED PRINT CSS: ควบคุมกระดาษ A4 แนวตั้ง และป้องกันการแตกหน้า ─── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }
          .printable-report-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-report-card table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── HEADER: ปพ. 6 + ตรา รร + หัวข้อกึ่งกลาง ─── */}
      <div className="relative mb-3.5">
        {/* Top Right: ปพ. 6 */}
        <div className="absolute right-0 top-0 text-right">
          <span className="font-bold text-sm">ปพ. 6</span>
        </div>

        {/* Top Left: ตราโรงเรียนบ้านคำไผ่ */}
        {showSchoolCrest && (
          <div className="absolute left-0 top-0">
            <img
              src="/logos/school-logo.webp"
              alt="ตราประจำโรงเรียนบ้านคำไผ่"
              className="w-14 h-14 object-contain"
            />
          </div>
        )}

        {/* Center Header */}
        <div className="text-center space-y-1 pt-0.5 px-16">
          <div className="font-bold text-sm sm:text-base leading-snug">
            ผลการเรียนปีการศึกษา {academicYear} &nbsp;&nbsp; {schoolName} &nbsp;&nbsp; {districtName}
          </div>
          <div className="font-semibold text-xs sm:text-sm">
            {student.name} &nbsp;&nbsp;&nbsp;&nbsp; ชั้นประถมศึกษาปีที่ {gradeLevelNum} &nbsp;&nbsp;&nbsp;&nbsp; เลขที่ &nbsp;{classNumberDisplay}
          </div>
        </div>
      </div>

      {/* ─── TABLE 1: สาระการเรียนรู้ (11 วิชา ป.4) ─── */}
      <table className="w-full border-collapse border border-black text-center text-xs mb-3.5">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-8 text-xs">
            <th className="border border-black p-1 text-center w-[36%]">สาระการเรียนรู้</th>
            <th className="border border-black p-1 w-[9%]">น้ำหนัก</th>
            <th className="border border-black p-1 w-[11%]">คะแนนเต็ม</th>
            <th className="border border-black p-1 w-[11%]">คะแนนที่ได้</th>
            <th className="border border-black p-1 w-[15%]">ระดับผลการเรียน</th>
            <th className="border border-black p-1 w-[18%]">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, idx) => {
            // คอลัมน์หมายเหตุ: จัดวาง "คะแนนที่ได้" และ "เกรดเฉลี่ย" ตามสัดส่วนภาพจริง
            let remarkContent: React.ReactNode = null;
            if (idx === 3) remarkContent = <span className="font-medium text-xs">คะแนนที่ได้</span>;
            if (idx === 4) remarkContent = <span className="font-bold font-mono text-xs">{totalObtained}</span>;
            if (idx === 6) remarkContent = <span className="font-medium text-xs">เกรดเฉลี่ย</span>;
            if (idx === 7) remarkContent = <span className="font-bold font-mono text-xs">{isTerm1Only ? '-' : gpa}</span>;

            return (
              <tr key={row.id} className="h-7">
                <td className="border border-black px-2 py-1 text-left font-medium text-[12px]">
                  {row.name}
                </td>
                <td className="border border-black p-1 font-mono text-xs">{row.weight}</td>
                <td className="border border-black p-1 font-mono text-xs">{row.fullMarks}</td>
                <td className="border border-black p-1 font-mono text-xs">{row.obtained}</td>
                <td className="border border-black p-1 font-mono font-semibold text-xs">
                  {row.grade || (isTerm1Only ? '' : '0')}
                </td>
                <td className="border border-black p-1 text-center text-[11px]">
                  {remarkContent}
                </td>
              </tr>
            );
          })}

          {/* แถวสรุปรวม */}
          <tr className="h-8 font-bold bg-neutral-100/50 text-xs">
            <td className="border border-black px-2 py-1 text-center">รวม</td>
            <td className="border border-black p-1"></td>
            <td className="border border-black p-1 font-mono">{totalFullMarks}</td>
            <td className="border border-black p-1 font-mono">{totalObtained}</td>
            <td className="border border-black p-1 font-mono">{gpaDisplay || (isTerm1Only ? '' : '0.00')}</td>
            <td className="border border-black p-1"></td>
          </tr>
        </tbody>
      </table>

      {/* ─── TABLE 2: กิจกรรมพัฒนาผู้เรียน (ผ่าน / ไม่ผ่าน) ─── */}
      <table className="w-full border-collapse border border-black text-center text-xs mb-3.5">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-8 text-[11px]">
            <th className="border border-black p-1 text-center w-[67%]">กิจกรรมพัฒนาผู้เรียน</th>
            <th colSpan={2} className="border border-black p-0.5 w-[33%]">
              <div>ผลการประเมิน</div>
              <div className="grid grid-cols-2 border-t border-black font-medium text-[10px] mt-0.5 pt-0.5">
                <div>ผ่าน</div>
                <div>ไม่ผ่าน</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            'ลูกเสือ',
            'แนะแนว',
            'ชุมนุม',
            'เพื่อสังคมและสาธารณประโยชน์',
          ].map((act) => (
            <tr key={act} className="h-7">
              <td className="border border-black px-2 py-1 text-left font-medium text-[11.5px]">{act}</td>
              <td className="border border-black p-1 w-[16.5%] font-bold"></td>
              <td className="border border-black p-1 w-[16.5%] font-bold"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── TABLE 3: สรุปการประเมิน 3 ด้าน (ดีเยี่ยม / ดี / ผ่าน) ─── */}
      <table className="w-full border-collapse border border-black text-center text-xs mb-4">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-8 text-[11px]">
            <th className="border border-black p-1 w-[55%]"></th>
            <th colSpan={3} className="border border-black p-0.5 w-[45%]">
              <div>ผลการประเมิน</div>
              <div className="grid grid-cols-3 border-t border-black font-medium text-[10px] mt-0.5 pt-0.5">
                <div>ดีเยี่ยม</div>
                <div>ดี</div>
                <div>ผ่าน</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            'สรุปการประเมินผลการอ่าน คิดวิเคราะห์ และเขียน',
            'สรุปการประเมินผล คุณลักษณะอันพึงประสงค์',
            'สรุปการประเมินผล สมรรถนะ',
          ].map((item) => (
            <tr key={item} className="h-7">
              <td className="border border-black px-2 py-1 text-left font-medium text-[11.5px]">{item}</td>
              <td className="border border-black p-1 w-[15%] font-bold"></td>
              <td className="border border-black p-1 w-[15%] font-bold"></td>
              <td className="border border-black p-1 w-[15%] font-bold"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── SIGNATURES BLOCK: 3 ตำแหน่งตรงตามรูปต้นฉบับ จัดชื่อให้อยู่กึ่งกลางใต้เส้นประพอดี ─── */}
      {showSignatures && (
        <div className="pt-3 text-xs leading-normal">
          {/* แถวบน: ครูประจำชั้น (ซ้าย) + หัวหน้าวิชาการ (ขวา) */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex items-start justify-center">
              <span className="whitespace-nowrap">ลงชื่อ</span>
              <div className="flex flex-col items-center mx-1">
                <span>....................................................</span>
                <span className="font-medium text-xs mt-1">
                  ({homeroomTeacher || 'ครูประจำชั้น'})
                </span>
              </div>
              <span className="whitespace-nowrap">ครูประจำชั้น</span>
            </div>

            <div className="flex items-start justify-center">
              <span className="whitespace-nowrap">ลงชื่อ</span>
              <div className="flex flex-col items-center mx-1">
                <span>....................................................</span>
                <span className="font-medium text-xs mt-1">
                  ({academicHeadName})
                </span>
              </div>
              <span className="whitespace-nowrap">หัวหน้าวิชาการ</span>
            </div>
          </div>

          {/* แถวล่าง: ผู้อำนวยการโรงเรียน (ตรงกลาง) */}
          <div className="flex items-start justify-center pt-5">
            <span className="whitespace-nowrap">ลงชื่อ</span>
            <div className="flex flex-col items-center mx-1">
              <span>............................................................................</span>
              <span className="font-medium text-xs mt-1">
                ({directorName})
              </span>
            </div>
            <span className="whitespace-nowrap">ผู้อำนวยการโรงเรียน</span>
          </div>
        </div>
      )}

      {/* QR Code Verification ขนาดกะทัดรัดมุมล่างซ้าย (ซ่อนตอนพิมพ์หรือแสดงเบาๆ) */}
      {showQrVerification && (
        <div className="mt-2 pt-1 border-t border-dashed border-neutral-300 flex items-center justify-between text-[9px] text-neutral-500 print:hidden">
          <div className="flex items-center gap-2">
            <QRCode
              value={`${verificationBaseUrl}?std=${encodeURIComponent(student.student_code || student.id)}&yr=${academicYear}`}
              size={32}
            />
            <div>
              <span className="font-bold text-neutral-700">ปพ.6 ดิจิทัล โรงเรียนบ้านคำไผ่</span>
              <div>สแกนเพื่อตรวจสอบความถูกต้องของผลการเรียน</div>
            </div>
          </div>
          <div className="text-right">
            สพป.อุดรธานี เขต ๒
          </div>
        </div>
      )}
    </div>
  );
};

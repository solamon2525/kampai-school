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
    <div className="printable-report-card bg-card text-foreground font-sans p-6 max-w-[210mm] mx-auto print:bg-white print:text-black print:p-0 print:max-w-none print:m-0 print:w-full text-[11px] leading-tight select-none">
      {/* ─── SCOPED PRINT CSS: ควบคุมกระดาษ A4 แนวตั้ง และป้องกันการแตกหน้า ─── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
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
      <div className="relative mb-2">
        {/* Top Right: ปพ. 6 */}
        <div className="absolute right-0 top-0 text-right">
          <span className="font-bold text-xs">ปพ. 6</span>
        </div>

        {/* Top Left: ตราโรงเรียนบ้านคำไผ่ */}
        {showSchoolCrest && (
          <div className="absolute left-0 top-0">
            <img
              src="/logos/school-logo.webp"
              alt="ตราประจำโรงเรียนบ้านคำไผ่"
              className="w-12 h-12 object-contain"
            />
          </div>
        )}

        {/* Center Header */}
        <div className="text-center space-y-0.5 pt-0.5 px-14">
          <div className="font-bold text-xs sm:text-sm">
            ผลการเรียนปีการศึกษา {academicYear} &nbsp;&nbsp; {schoolName} &nbsp;&nbsp; {districtName}
          </div>
          <div className="font-semibold text-xs">
            {student.name} &nbsp;&nbsp;&nbsp;&nbsp; ชั้นประถมศึกษาปีที่ {gradeLevelNum} &nbsp;&nbsp;&nbsp;&nbsp; เลขที่ &nbsp;{classNumberDisplay}
          </div>
        </div>
      </div>

      {/* ─── TABLE 1: สาระการเรียนรู้ (11 วิชา ป.4) ─── */}
      <table className="w-full border-collapse border border-black text-center text-[11px] mb-2">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-6">
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
            if (idx === 3) remarkContent = <span className="font-medium">คะแนนที่ได้</span>;
            if (idx === 4) remarkContent = <span className="font-bold font-mono">{totalObtained}</span>;
            if (idx === 6) remarkContent = <span className="font-medium">เกรดเฉลี่ย</span>;
            if (idx === 7) remarkContent = <span className="font-bold font-mono">{isTerm1Only ? '-' : gpa}</span>;

            return (
              <tr key={row.id} className="h-5">
                <td className="border border-black px-2 py-0.5 text-left font-medium">
                  {row.name}
                </td>
                <td className="border border-black p-0.5 font-mono">{row.weight}</td>
                <td className="border border-black p-0.5 font-mono">{row.fullMarks}</td>
                <td className="border border-black p-0.5 font-mono">{row.obtained}</td>
                <td className="border border-black p-0.5 font-mono font-semibold">
                  {row.grade || (isTerm1Only ? '' : '0')}
                </td>
                <td className="border border-black p-0.5 text-center text-[10px]">
                  {remarkContent}
                </td>
              </tr>
            );
          })}

          {/* แถวสรุปรวม */}
          <tr className="h-6 font-bold bg-neutral-100/50">
            <td className="border border-black px-2 py-0.5 text-center">รวม</td>
            <td className="border border-black p-0.5"></td>
            <td className="border border-black p-0.5 font-mono">{totalFullMarks}</td>
            <td className="border border-black p-0.5 font-mono">{totalObtained}</td>
            <td className="border border-black p-0.5 font-mono">{gpaDisplay || (isTerm1Only ? '' : '0.00')}</td>
            <td className="border border-black p-0.5"></td>
          </tr>
        </tbody>
      </table>

      {/* ─── TABLE 2: กิจกรรมพัฒนาผู้เรียน (ผ่าน / ไม่ผ่าน) ─── */}
      <table className="w-full border-collapse border border-black text-center text-[10px] mb-2">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-6">
            <th className="border border-black p-1 text-center w-[67%]">กิจกรรมพัฒนาผู้เรียน</th>
            <th colSpan={2} className="border border-black p-0.5 w-[33%]">
              <div>ผลการประเมิน</div>
              <div className="grid grid-cols-2 border-t border-black font-medium text-[9px] mt-0.5 pt-0.5">
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
            <tr key={act} className="h-5">
              <td className="border border-black px-2 py-0.5 text-left font-medium">{act}</td>
              <td className="border border-black p-0.5 w-[16.5%] font-bold"></td>
              <td className="border border-black p-0.5 w-[16.5%] font-bold"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── TABLE 3: สรุปการประเมิน 3 ด้าน (ดีเยี่ยม / ดี / ผ่าน) ─── */}
      <table className="w-full border-collapse border border-black text-center text-[10px] mb-3">
        <thead>
          <tr className="bg-neutral-100/70 font-semibold h-6">
            <th className="border border-black p-1 w-[55%]"></th>
            <th colSpan={3} className="border border-black p-0.5 w-[45%]">
              <div>ผลการประเมิน</div>
              <div className="grid grid-cols-3 border-t border-black font-medium text-[9px] mt-0.5 pt-0.5">
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
            <tr key={item} className="h-5">
              <td className="border border-black px-2 py-0.5 text-left font-medium">{item}</td>
              <td className="border border-black p-0.5 w-[15%] font-bold"></td>
              <td className="border border-black p-0.5 w-[15%] font-bold"></td>
              <td className="border border-black p-0.5 w-[15%] font-bold"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── SIGNATURES BLOCK: 3 ตำแหน่งตรงตามรูปต้นฉบับ ─── */}
      {showSignatures && (
        <div className="pt-2 text-xs leading-normal">
          {/* แถวบน: ครูประจำชั้น (ซ้าย) + หัวหน้าวิชาการ (ขวา) */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div>
                ลงชื่อ .................................................... ครูประจำชั้น
              </div>
              <div className="font-medium text-[11px]">
                ({homeroomTeacher || 'ครูประจำชั้น'})
              </div>
            </div>

            <div className="space-y-1">
              <div>
                ลงชื่อ .................................................... หัวหน้าวิชาการ
              </div>
              <div className="font-medium text-[11px]">
                ({academicHeadName})
              </div>
            </div>
          </div>

          {/* แถวล่าง: ผู้อำนวยการโรงเรียน (ตรงกลาง) */}
          <div className="text-center pt-3 space-y-1">
            <div>
              ลงชื่อ ............................................................................ ผู้อำนวยการโรงเรียน
            </div>
            <div className="font-medium text-[11px]">
              ({directorName})
            </div>
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

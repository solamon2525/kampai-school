/**
 * PrintableBatchStudentReportCards.tsx
 * รวมพิมพ์เอกสาร ปพ.6 ของนักเรียนทั้งห้องในคลิกเดียว (1-Click Batch Report Card Printing)
 * - เรนเดอร์ ปพ.6 ของนักเรียนทุกคนในชั้นเรียนอย่างต่อเนื่อง
 * - คั่นหน้าด้วย CSS page-break-after: always; และ break-after: page;
 * - สั่งพิมพ์ครั้งเดียว เครื่องพิมพ์จะพิมพ์ออกมาครบทุกคนในห้องโดยอัตโนมัติ
 * - ป้องกันปัญหาการต้องคลิกเลือกพิมพ์ทีละคนซ้ำซ้อน
 */
import React from 'react';
import {
  PrintableStudentReportCard,
  type ReportCardStudent,
  type ReportCardSubjectScore,
  type ReportCardEvaluations,
} from './PrintableStudentReportCard';

export interface PrintableBatchStudentReportCardsProps {
  students: ReportCardStudent[];
  academicYear: string;
  selectedClass: string;
  studentScoresMap: Record<string, ReportCardSubjectScore[]>;
  studentEvaluationsMap: Record<string, ReportCardEvaluations>;
  schoolName?: string;
  directorName?: string;
  homeroomTeacher?: string;
}

export const PrintableBatchStudentReportCards: React.FC<PrintableBatchStudentReportCardsProps> = ({
  students,
  academicYear,
  selectedClass,
  studentScoresMap,
  studentEvaluationsMap,
  schoolName = 'โรงเรียนบ้านคำไผ่',
  directorName = 'นายสมพิศ แรงน้อย',
  homeroomTeacher = 'ครูประจำชั้น',
}) => {
  return (
    <div className="printable-batch-report-cards space-y-8 print:space-y-0">
      {students.map((student, idx) => {
        const scores = studentScoresMap[student.id] || [];
        const evaluations = studentEvaluationsMap[student.id] || {
          characterGrade: 'ดีเยี่ยม',
          competencyGrade: 'ดีเยี่ยม',
          readingGrade: 'ดีเยี่ยม',
          activityGrade: 'ผ่าน',
          attendanceDays: 200,
          attendanceTotal: 200,
          attendancePct: 100,
        };

        const isLast = idx === students.length - 1;

        return (
          <div key={student.id} className="batch-student-report-card-wrapper">
            {/* Visual separator on screen between students */}
            <div className="print:hidden text-center text-xs font-semibold text-muted-foreground py-2 border-b border-dashed border-border mb-4">
              [ แผ่นที่ {idx + 1} จาก {students.length} ] — {student.name} (เลขที่ {student.class_number ?? '-'})
            </div>

            <PrintableStudentReportCard
              student={student}
              academicYear={academicYear}
              selectedClass={selectedClass}
              scores={scores}
              evaluations={evaluations}
              schoolName={schoolName}
              directorName={directorName}
              homeroomTeacher={homeroomTeacher}
            />

            {/* Page break element for physical printer */}
            {!isLast && (
              <div
                className="print-page-break print:break-after-page break-after-page"
                style={{
                  pageBreakAfter: 'always',
                  breakAfter: 'page',
                  height: '0px',
                  display: 'block',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

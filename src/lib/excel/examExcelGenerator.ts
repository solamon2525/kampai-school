/**
 * examExcelGenerator.ts
 * โมดูลส่งออกผลสอบเป็นไฟล์ Excel (.xlsx) ตามแบบฟอร์ม ปพ.5
 * พร้อมชีตวิเคราะห์คุณภาพข้อสอบ (Item Analysis) และสรุปสถิติภาพรวม
 */

import * as XLSX from 'xlsx';
import type { ExamSetRow, ExamSubmissionRow } from '@/services/exam.service';
import type { ExamQuestionInput } from '@/lib/exam/multiVersion';
import { computeItemAnalysis } from '@/lib/exam/itemAnalysis';

export interface ExamExcelExportOptions {
  schoolName?: string;
  filename?: string;
}

export function exportExamResultsToExcel(
  examSet: ExamSetRow,
  submissions: ExamSubmissionRow[],
  options: ExamExcelExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  const rawQuestions = Array.isArray(examSet.questions) ? (examSet.questions as ExamQuestionInput[]) : [];
  const qCount = rawQuestions.length || 1;

  // ─────────────────────────────────────────────────────────────
  // Sheet 1: แบบบันทึกคะแนนรายบุคคล (ปพ.5)
  // ─────────────────────────────────────────────────────────────
  const sortedSubmissions = [...submissions].sort((a, b) => {
    // Sort by student_no, then by student_name
    const noA = a.student_no ?? 999;
    const noB = b.student_no ?? 999;
    if (noA !== noB) return noA - noB;
    return (a.student_name || '').localeCompare(b.student_name || '', 'th');
  });

  const ppor5Rows = sortedSubmissions.map((sub, sIdx) => {
    const answersMap = (sub.answers || {}) as Record<string, unknown>;

    const row: Record<string, string | number> = {
      ลำดับ: sIdx + 1,
      เลขที่: sub.student_no ?? '-',
      'ชื่อ-นามสกุล': sub.student_name || 'ไม่ระบุชื่อ',
      ชั้น: sub.student_class || examSet.grade || '-',
    };

    // Item-by-item marks (1 or 0)
    rawQuestions.forEach((q, qIdx) => {
      const correctAns = q.answer !== undefined ? q.answer : 0;
      const studentAns = answersMap[qIdx] !== undefined ? answersMap[qIdx] : answersMap[String(qIdx)];
      const isCorrect = Number(studentAns) === Number(correctAns);
      row[`ข้อ ${qIdx + 1}`] = isCorrect ? 1 : 0;
    });

    row['คะแนนรวม'] = sub.score;
    row['คะแนนเต็ม'] = sub.max_score || qCount;
    row['ร้อยละ'] = `${Math.round(sub.percentage)}%`;
    row['ผลการประเมิน'] = sub.passed ? 'ผ่าน' : 'ไม่ผ่าน';
    row['รูปแบบการส่ง'] = sub.submission_mode === 'omr_scan' ? 'กระดาษ OMR' : 'สอบออนไลน์';

    return row;
  });

  const wsScores = XLSX.utils.json_to_sheet(ppor5Rows.length > 0 ? ppor5Rows : [{ ข้อความ: 'ไม่มีข้อมูลผลการสอบ' }]);

  // Auto-size columns
  if (ppor5Rows.length > 0) {
    const scoreCols = Object.keys(ppor5Rows[0]).map((key) => ({
      wch: Math.max(key.length + 3, 7),
    }));
    (wsScores as any)['!cols'] = scoreCols;
  }
  XLSX.utils.book_append_sheet(wb, wsScores, 'คะแนนนักเรียน (ปพ.5)');

  // ─────────────────────────────────────────────────────────────
  // Sheet 2: วิเคราะห์คุณภาพข้อสอบ (Item Analysis)
  // ─────────────────────────────────────────────────────────────
  const analysisReport = computeItemAnalysis(rawQuestions, sortedSubmissions);

  const analysisRows = analysisReport.items.map((item) => {
    const effectiveDistractorsCount = item.distractors.filter((d) => d.isEffective).length;
    return {
      ข้อที่: item.questionNumber,
      คำถาม: item.questionText,
      'ตัวชี้วัด/หัวข้อ': item.topic || '-',
      'ระดับความยาก (เดิม)': item.difficultyDeclared || '-',
      ผู้ตอบถูก: `${item.correctCount} / ${item.examineeCount}`,
      'ค่าความยาก (p)': item.difficultyIndex,
      'ค่าอำนาจจำแนก (r)': item.discriminationIndex,
      'ตัวลวงที่มีประสิทธิภาพ': `${effectiveDistractorsCount} / ${Math.max(0, item.distractors.length - 1)}`,
      'การประเมินคุณภาพ': item.qualityLabel,
      'คำแนะนำการพัฒนา': item.recommendation,
    };
  });

  const wsAnalysis = XLSX.utils.json_to_sheet(analysisRows.length > 0 ? analysisRows : [{ ข้อความ: 'ไม่มีข้อมูลข้อสอบ' }]);
  if (analysisRows.length > 0) {
    const analysisCols = [
      { wch: 8 },  // ข้อที่
      { wch: 45 }, // คำถาม
      { wch: 25 }, // ตัวชี้วัด
      { wch: 15 }, // ระดับความยาก
      { wch: 12 }, // ผู้ตอบถูก
      { wch: 15 }, // p
      { wch: 18 }, // r
      { wch: 22 }, // ตัวลวง
      { wch: 18 }, // คุณภาพ
      { wch: 45 }, // คำแนะนำ
    ];
    (wsAnalysis as any)['!cols'] = analysisCols;
  }
  XLSX.utils.book_append_sheet(wb, wsAnalysis, 'วิเคราะห์ข้อสอบ (Item Analysis)');

  // ─────────────────────────────────────────────────────────────
  // Sheet 3: สถิติภาพรวม (Summary)
  // ─────────────────────────────────────────────────────────────
  const summaryRows = [
    { รายการ: 'ชื่อชุดข้อสอบ', ข้อมูล: examSet.title },
    { รายการ: 'กลุ่มสาระการเรียนรู้', ข้อมูล: examSet.subject },
    { รายการ: 'ระดับชั้น', ข้อมูล: examSet.grade },
    { รายการ: 'จำนวนข้อสอบทั้งหมด', ข้อมูล: `${qCount} ข้อ` },
    { รายการ: 'เกณฑ์ผ่าน', ข้อมูล: `${examSet.pass_threshold_pct}%` },
    { รายการ: 'จำนวนนักเรียนที่เข้าสอบ (N)', ข้อมูล: `${analysisReport.overall.totalExaminees} คน` },
    { รายการ: 'คะแนนเฉลี่ย (Mean)', ข้อมูล: analysisReport.overall.averageScore },
    { รายการ: 'ร้อยละเฉลี่ย', ข้อมูล: `${analysisReport.overall.averagePercentage}%` },
    { รายการ: 'คะแนนสูงสุด (Max)', ข้อมูล: analysisReport.overall.highestScore },
    { รายการ: 'คะแนนต่ำสุด (Min)', ข้อมูล: analysisReport.overall.lowestScore },
    { รายการ: 'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)', ข้อมูล: analysisReport.overall.standardDeviation },
    { รายการ: 'ค่าความยากเฉลี่ย (Mean p)', ข้อมูล: analysisReport.overall.averageDifficulty },
    { รายการ: 'ค่าอำนาจจำแนกเฉลี่ย (Mean r)', ข้อมูล: analysisReport.overall.averageDiscrimination },
    { รายการ: 'ข้อสอบคุณภาพดีเยี่ยม', ข้อมูล: `${analysisReport.overall.excellentCount} ข้อ` },
    { รายการ: 'ข้อสอบคุณภาพพอใช้/ผ่านเกณฑ์', ข้อมูล: `${analysisReport.overall.acceptableCount} ข้อ` },
    { รายการ: 'ข้อสอบที่ควรปรับปรุง', ข้อมูล: `${analysisReport.overall.needsRevisionCount} ข้อ` },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  (wsSummary as any)['!cols'] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'สถิติภาพรวม');

  // Trigger Download
  const cleanTitle = (examSet.title || 'exam_results').replace(/[\\/:*?"<>|]+/g, '_');
  const filename = options.filename || `แบบบันทึกคะแนน_ปพ5_${cleanTitle}.xlsx`;
  XLSX.writeFile(wb, filename);
}

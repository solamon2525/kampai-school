/**
 * diagnostic.ts
 * Educational Diagnostic & Competency Engine for Kampai School Exam System
 * 
 * Analyzes student exam submissions at the topic and competency level:
 * - Aggregates performance by topic/learning strand
 * - Calculates radar chart metrics (0-100%)
 * - Evaluates cognitive Bloom levels (Remembering, Understanding, Applying, Analyzing)
 * - Identifies strengths and weaknesses for targeted remediation
 */

import type { ExamSubmissionRow } from '@/services/exam.service';

export interface DiagnosticQuestion {
  question_text?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  bloom_level?: string;
  question_type?: 'mcq' | 'fillin' | 'essay';
  answer: number | boolean | string | unknown;
  accepted_answers?: string[];
  rubric?: {
    full_score?: number;
    key_solution?: string;
    criteria?: Array<{ name: string; points: number; description: string }>;
    keywords?: string[];
  };
  options?: string[];
  explanation?: string;
  points?: number;
  indicator_code?: string;
  media_title?: string;
}

export interface TopicDiagnostic {
  topic: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  level: 'mastered' | 'proficient' | 'developing' | 'needs_remediation';
  levelLabel: string;
  missedIndices: number[];
}

export interface BloomDiagnostic {
  level: string;
  levelNameTh: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
}

export interface StudentDiagnosticResult {
  studentName: string;
  studentClass: string;
  studentNo: number | null;
  overallScore: number;
  maxScore: number;
  overallPercentage: number;
  passed: boolean;
  topicBreakdown: TopicDiagnostic[];
  radarData: { topic: string; score: number; fullMark: number }[];
  strengths: TopicDiagnostic[];
  weaknesses: TopicDiagnostic[];
  bloomBreakdown: BloomDiagnostic[];
  needsRemediation: boolean;
}

export interface ClassTopicSummary {
  topic: string;
  totalQuestionsPerStudent: number;
  averagePercentage: number;
  studentCount: number;
  masteryCount: number; // >= 80%
  remediationCount: number; // < 60%
  needsClassroomReview: boolean;
}

export interface ClassDiagnosticResult {
  examSetTitle: string;
  totalSubmissions: number;
  classAveragePercentage: number;
  topics: ClassTopicSummary[];
  radarData: { topic: string; score: number; fullMark: number }[];
  classStrengths: ClassTopicSummary[];
  classWeaknesses: ClassTopicSummary[];
}

const BLOOM_LEVEL_NAMES: Record<string, string> = {
  L1: 'ความจำ (Remembering)',
  L2: 'ความเข้าใจ (Understanding)',
  L3: 'การประยุกต์ใช้ (Applying)',
  L4: 'การวิเคราะห์ (Analyzing)',
  L5: 'การประเมินค่า (Evaluating)',
  L6: 'การสร้างสรรค์ (Creating)',
  auto: 'ประยุกต์ทั่วไป (Applied)',
  mixed: 'ผสมผสาน (Integrated)',
};

/**
 * Normalizes numeric answers for MCQ comparison
 */
function normalizeAnswer(ans: unknown): number | null {
  if (typeof ans === 'number') return ans;
  if (typeof ans === 'string') {
    const parsed = parseInt(ans, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Normalizes text answers for Fill-in comparison
 */
function normalizeTextAnswer(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Robust question answer checker supporting MCQ, Fill-in, and Essay
 */
function checkQuestionCorrect(
  q: DiagnosticQuestion,
  studentAnswer: unknown,
  rubricScore?: number
): boolean {
  const qType = q.question_type || 'mcq';

  if (qType === 'essay') {
    if (typeof rubricScore === 'number') {
      const full = q.rubric?.full_score || q.points || 5;
      return rubricScore >= full * 0.6; // Passing threshold for essay competency
    }
    return false;
  }

  if (qType === 'fillin' || Array.isArray(q.accepted_answers)) {
    if (studentAnswer === undefined || studentAnswer === null) return false;
    const normUser = normalizeTextAnswer(studentAnswer);
    if (!normUser) return false;
    const acceptedList: string[] = [];
    if (q.answer !== undefined && q.answer !== null) {
      acceptedList.push(normalizeTextAnswer(q.answer));
    }
    if (Array.isArray(q.accepted_answers)) {
      q.accepted_answers.forEach((ans) => acceptedList.push(normalizeTextAnswer(ans)));
    }
    return acceptedList.some((acc) => acc && acc === normUser);
  }

  // Default MCQ / TrueFalse
  if (studentAnswer === undefined || studentAnswer === null || q.answer === undefined || q.answer === null) {
    return false;
  }
  const normS = normalizeAnswer(studentAnswer);
  const normC = normalizeAnswer(q.answer);
  if (normS !== null && normC !== null) {
    return normS === normC;
  }
  return normalizeTextAnswer(studentAnswer) === normalizeTextAnswer(q.answer);
}

/**
 * Calculates individual student diagnostic report
 */
export function calculateStudentDiagnostic(
  questions: DiagnosticQuestion[],
  submission: ExamSubmissionRow
): StudentDiagnosticResult {
  const studentAnswers = Array.isArray(submission.answers)
    ? (submission.answers as unknown[])
    : typeof submission.answers === 'object' && submission.answers !== null
    ? Object.values(submission.answers)
    : [];

  const rubricScores =
    typeof submission.rubric_scores === 'object' && submission.rubric_scores !== null
      ? (submission.rubric_scores as Record<string, number>)
      : null;

  const topicMap: Record<
    string,
    { total: number; correct: number; missedIndices: number[] }
  > = {};

  const bloomMap: Record<string, { total: number; correct: number }> = {};

  questions.forEach((q, idx) => {
    const rawTopic = (q.topic || 'ความรู้พื้นฐานทั่วไป').trim();
    // Normalize topic name (remove excess codes if any, keep friendly name)
    const topic = rawTopic.length > 25 ? rawTopic.slice(0, 22) + '...' : rawTopic;

    if (!topicMap[topic]) {
      topicMap[topic] = { total: 0, correct: 0, missedIndices: [] };
    }
    topicMap[topic].total += 1;

    // Bloom tracking
    const bloomKey = q.bloom_level || 'L2';
    if (!bloomMap[bloomKey]) {
      bloomMap[bloomKey] = { total: 0, correct: 0 };
    }
    bloomMap[bloomKey].total += 1;

    const rubricScore = rubricScores ? rubricScores[String(idx)] ?? rubricScores[idx] : undefined;
    const isCorrect = checkQuestionCorrect(q, studentAnswers[idx], rubricScore);

    if (isCorrect) {
      topicMap[topic].correct += 1;
      bloomMap[bloomKey].correct += 1;
    } else {
      topicMap[topic].missedIndices.push(idx);
    }
  });

  // Build TopicDiagnostic items
  const topicBreakdown: TopicDiagnostic[] = Object.entries(topicMap).map(
    ([topic, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let level: TopicDiagnostic['level'] = 'mastered';
      let levelLabel = 'เชี่ยวชาญ (Mastered)';

      if (pct >= 80) {
        level = 'mastered';
        levelLabel = 'เชี่ยวชาญ (Mastered)';
      } else if (pct >= 65) {
        level = 'proficient';
        levelLabel = 'ทำได้ดี (Proficient)';
      } else if (pct >= 50) {
        level = 'developing';
        levelLabel = 'พอใช้ (Developing)';
      } else {
        level = 'needs_remediation';
        levelLabel = 'ต้องการซ่อมเสริม (Needs Remediation)';
      }

      return {
        topic,
        totalQuestions: stats.total,
        correctCount: stats.correct,
        scorePercentage: pct,
        level,
        levelLabel,
        missedIndices: stats.missedIndices,
      };
    }
  );

  // Sort topics by score ascending (lowest first for focus)
  topicBreakdown.sort((a, b) => a.scorePercentage - b.scorePercentage);

  // Radar data (all topics)
  const radarData = topicBreakdown.map((t) => ({
    topic: t.topic,
    score: t.scorePercentage,
    fullMark: 100,
  }));

  // Strengths (>= 75%) & Weaknesses (< 60%)
  const strengths = topicBreakdown.filter((t) => t.scorePercentage >= 75);
  const weaknesses = topicBreakdown.filter((t) => t.scorePercentage < 60);

  // Bloom breakdown
  const bloomBreakdown: BloomDiagnostic[] = Object.entries(bloomMap).map(
    ([key, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        level: key,
        levelNameTh: BLOOM_LEVEL_NAMES[key] || key,
        totalQuestions: stats.total,
        correctCount: stats.correct,
        scorePercentage: pct,
      };
    }
  );

  return {
    studentName: submission.student_name,
    studentClass: submission.student_class,
    studentNo: submission.student_no,
    overallScore: submission.score,
    maxScore: submission.max_score,
    overallPercentage: submission.percentage,
    passed: submission.passed,
    topicBreakdown,
    radarData,
    strengths,
    weaknesses,
    bloomBreakdown,
    needsRemediation: weaknesses.length > 0 || submission.percentage < 60,
  };
}

/**
 * Aggregates diagnostic results across all submissions for a class
 */
export function calculateClassDiagnostic(
  questions: DiagnosticQuestion[],
  submissions: ExamSubmissionRow[],
  examSetTitle: string = 'ชุดข้อสอบ'
): ClassDiagnosticResult {
  if (submissions.length === 0) {
    return {
      examSetTitle,
      totalSubmissions: 0,
      classAveragePercentage: 0,
      topics: [],
      radarData: [],
      classStrengths: [],
      classWeaknesses: [],
    };
  }

  const studentDiagnostics = submissions.map((sub) =>
    calculateStudentDiagnostic(questions, sub)
  );

  const topicTotals: Record<
    string,
    {
      percentageSum: number;
      totalCount: number;
      questionsCount: number;
      masteryCount: number;
      remediationCount: number;
    }
  > = {};

  studentDiagnostics.forEach((sd) => {
    sd.topicBreakdown.forEach((tb) => {
      if (!topicTotals[tb.topic]) {
        topicTotals[tb.topic] = {
          percentageSum: 0,
          totalCount: 0,
          questionsCount: tb.totalQuestions,
          masteryCount: 0,
          remediationCount: 0,
        };
      }
      topicTotals[tb.topic].percentageSum += tb.scorePercentage;
      topicTotals[tb.topic].totalCount += 1;
      if (tb.scorePercentage >= 80) topicTotals[tb.topic].masteryCount += 1;
      if (tb.scorePercentage < 60) topicTotals[tb.topic].remediationCount += 1;
    });
  });

  const topics: ClassTopicSummary[] = Object.entries(topicTotals).map(
    ([topic, stats]) => {
      const avgPct =
        stats.totalCount > 0
          ? Math.round(stats.percentageSum / stats.totalCount)
          : 0;

      return {
        topic,
        totalQuestionsPerStudent: stats.questionsCount,
        averagePercentage: avgPct,
        studentCount: stats.totalCount,
        masteryCount: stats.masteryCount,
        remediationCount: stats.remediationCount,
        needsClassroomReview: avgPct < 60,
      };
    }
  );

  topics.sort((a, b) => a.averagePercentage - b.averagePercentage);

  const radarData = topics.map((t) => ({
    topic: t.topic,
    score: t.averagePercentage,
    fullMark: 100,
  }));

  const overallAvg = Math.round(
    submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length
  );

  return {
    examSetTitle,
    totalSubmissions: submissions.length,
    classAveragePercentage: overallAvg,
    topics,
    radarData,
    classStrengths: topics.filter((t) => t.averagePercentage >= 75),
    classWeaknesses: topics.filter((t) => t.averagePercentage < 60),
  };
}

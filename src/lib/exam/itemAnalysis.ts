/**
 * itemAnalysis.ts
 * โมดูลวิเคราะห์คุณภาพข้อสอบ (Item Analysis & Educational Psychometrics)
 * คำนวณค่าความยากง่าย (p), ค่าอำนาจจำแนก (r), และการกระจายตัวของตัวลวง (Distractor Efficiency)
 * อิงเกณฑ์การวัดและประเมินผลทางการศึกษา สพฐ. (Kelley's 27% Rule)
 */

import type { ExamQuestionInput } from './multiVersion';

export interface DistractorChoiceStat {
  choiceIndex: number;
  choiceLabel: string; // 'ก', 'ข', 'ค', 'ง'
  text: string;
  isCorrect: boolean;
  totalSelected: number;
  upperSelected: number;
  lowerSelected: number;
  totalPercent: number;
  upperPercent: number;
  lowerPercent: number;
  isEffective: boolean; // เป็นตัวลวงที่มีประสิทธิภาพหรือไม่ (มีเด็กกลุ่มล่างเลือกมากกว่ากลุ่มบนอย่างน้อย 1 คน หรือมีคนเลือกอย่างน้อย 5%)
}

export type ItemQualityLevel = 'excellent' | 'acceptable' | 'too_easy' | 'too_hard' | 'poor' | 'critical';

export interface QuestionAnalysisResult {
  questionIndex: number; // 0-based
  questionNumber: number; // 1-based
  questionText: string;
  questionType: string;
  topic?: string;
  difficultyDeclared?: string;
  correctAnswer: number | string | boolean;
  examineeCount: number;
  correctCount: number;
  difficultyIndex: number; // p (0.00 - 1.00)
  discriminationIndex: number; // r (-1.00 to 1.00)
  qualityLevel: ItemQualityLevel;
  qualityLabel: string;
  qualityBadgeColor: string;
  recommendation: string;
  distractors: DistractorChoiceStat[];
}

export interface ExamOverallPsychometrics {
  totalExaminees: number;
  totalQuestions: number;
  averageScore: number;
  averagePercentage: number;
  averageDifficulty: number; // Mean p
  averageDiscrimination: number; // Mean r
  excellentCount: number;
  acceptableCount: number;
  needsRevisionCount: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
}

export interface ItemAnalysisReport {
  overall: ExamOverallPsychometrics;
  items: QuestionAnalysisResult[];
}

interface SubmissionLike {
  score: number;
  max_score?: number;
  answers: unknown;
  rubric_scores?: unknown;
  student_name?: string;
}

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

function normalizeText(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

function isItemAnswerCorrect(
  q: ExamQuestionInput,
  studentAns: unknown,
  rubricScore?: number
): boolean {
  const qType = q.question_type || q.type || 'mcq';

  if (qType === 'essay') {
    if (typeof rubricScore === 'number') {
      const full = (q as any).rubric?.full_score || (q as any).points || 5;
      return rubricScore >= full * 0.6; // Passing threshold for essay
    }
    return false;
  }

  if (qType === 'fillin' || Array.isArray(q.accepted_answers)) {
    if (studentAns === undefined || studentAns === null) return false;
    const normUser = normalizeText(studentAns);
    if (!normUser) return false;
    const acceptedList: string[] = [];
    if (q.answer !== undefined && q.answer !== null) {
      acceptedList.push(normalizeText(q.answer));
    }
    if (Array.isArray(q.accepted_answers)) {
      q.accepted_answers.forEach((ans) => acceptedList.push(normalizeText(ans)));
    }
    return acceptedList.some((acc) => acc && acc === normUser);
  }

  // Default MCQ / TrueFalse
  if (studentAns === undefined || studentAns === null || q.answer === undefined || q.answer === null) {
    return false;
  }
  const sNum = Number(studentAns);
  const cNum = Number(q.answer);
  if (!isNaN(sNum) && !isNaN(cNum)) {
    return sNum === cNum;
  }
  return normalizeText(studentAns) === normalizeText(q.answer);
}

/**
 * คำนวณการวิเคราะห์คุณภาพข้อสอบจากชุดข้อสอบและข้อมูลการส่งข้อสอบ
 */
export function computeItemAnalysis(
  questions: ExamQuestionInput[],
  submissions: SubmissionLike[]
): ItemAnalysisReport {
  const N = submissions.length;

  // Default empty stats if no submissions yet
  if (N === 0) {
    const defaultItems: QuestionAnalysisResult[] = questions.map((q, idx) => ({
      questionIndex: idx,
      questionNumber: idx + 1,
      questionText: q.question_text || q.question || `ข้อที่ ${idx + 1}`,
      questionType: q.question_type || q.type || 'mcq',
      topic: q.topic,
      difficultyDeclared: q.difficulty,
      correctAnswer: (q.answer !== undefined ? q.answer : 0) as number | string | boolean,
      examineeCount: 0,
      correctCount: 0,
      difficultyIndex: 0.5,
      discriminationIndex: 0,
      qualityLevel: 'acceptable',
      qualityLabel: 'ยังไม่มีข้อมูลสอบ',
      qualityBadgeColor: 'bg-muted text-muted-foreground',
      recommendation: 'รอข้อมูลการส่งข้อสอบของนักเรียนเพื่อประมวลผล',
      distractors: [],
    }));

    return {
      overall: {
        totalExaminees: 0,
        totalQuestions: questions.length,
        averageScore: 0,
        averagePercentage: 0,
        averageDifficulty: 0,
        averageDiscrimination: 0,
        excellentCount: 0,
        acceptableCount: 0,
        needsRevisionCount: 0,
        highestScore: 0,
        lowestScore: 0,
        standardDeviation: 0,
      },
      items: defaultItems,
    };
  }

  // 1. Sort submissions by total score descending
  const sortedSubmissions = [...submissions].sort((a, b) => b.score - a.score);

  // 2. Determine Upper and Lower 27% groups (Kelley's Rule)
  // For small N (e.g. < 4), use at least 1 student or half
  const groupSize = N >= 4 ? Math.max(1, Math.round(N * 0.27)) : Math.max(1, Math.floor(N / 2));
  const upperGroup = sortedSubmissions.slice(0, groupSize);
  const lowerGroup = sortedSubmissions.slice(sortedSubmissions.length - groupSize);

  // Calculate overall score statistics
  const scores = sortedSubmissions.map((s) => s.score);
  const sumScores = scores.reduce((sum, s) => sum + s, 0);
  const avgScore = sumScores / N;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  const variance = scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / N;
  const standardDeviation = Math.sqrt(variance);

  let sumDifficulty = 0;
  let sumDiscrimination = 0;
  let excellentCount = 0;
  let acceptableCount = 0;
  let needsRevisionCount = 0;

  // 3. Analyze each question
  const analyzedItems: QuestionAnalysisResult[] = questions.map((q, idx) => {
    const qType = q.question_type || q.type || 'mcq';
    const correctAns = q.answer !== undefined ? q.answer : 0;
    const qText = q.question_text || q.question || `ข้อที่ ${idx + 1}`;
    const options = Array.isArray(q.options) ? q.options : [];

    let correctTotal = 0;
    let correctUpper = 0;
    let correctLower = 0;

    // Track choice distributions for MCQ
    const choiceTotalCounts = new Array(options.length).fill(0);
    const choiceUpperCounts = new Array(options.length).fill(0);
    const choiceLowerCounts = new Array(options.length).fill(0);

    // Scan all submissions
    sortedSubmissions.forEach((sub) => {
      const answersMap = (sub.answers || {}) as Record<string, unknown>;
      const studentAns = answersMap[idx] !== undefined ? answersMap[idx] : answersMap[String(idx)];
      const rubricMap = (sub.rubric_scores || {}) as Record<string, number>;
      const rubricScore = rubricMap[idx] !== undefined ? rubricMap[idx] : rubricMap[String(idx)];

      const isCorrect = isItemAnswerCorrect(q, studentAns, rubricScore);
      if (isCorrect) {
        correctTotal++;
      }

      if (qType === 'mcq') {
        const optIdx = Number(studentAns);
        if (!isNaN(optIdx) && optIdx >= 0 && optIdx < options.length) {
          choiceTotalCounts[optIdx]++;
        }
      }
    });

    // Scan upper group
    upperGroup.forEach((sub) => {
      const answersMap = (sub.answers || {}) as Record<string, unknown>;
      const studentAns = answersMap[idx] !== undefined ? answersMap[idx] : answersMap[String(idx)];
      const rubricMap = (sub.rubric_scores || {}) as Record<string, number>;
      const rubricScore = rubricMap[idx] !== undefined ? rubricMap[idx] : rubricMap[String(idx)];

      if (isItemAnswerCorrect(q, studentAns, rubricScore)) {
        correctUpper++;
      }
      if (qType === 'mcq') {
        const optIdx = Number(studentAns);
        if (!isNaN(optIdx) && optIdx >= 0 && optIdx < options.length) {
          choiceUpperCounts[optIdx]++;
        }
      }
    });

    // Scan lower group
    lowerGroup.forEach((sub) => {
      const answersMap = (sub.answers || {}) as Record<string, unknown>;
      const studentAns = answersMap[idx] !== undefined ? answersMap[idx] : answersMap[String(idx)];
      const rubricMap = (sub.rubric_scores || {}) as Record<string, number>;
      const rubricScore = rubricMap[idx] !== undefined ? rubricMap[idx] : rubricMap[String(idx)];

      if (isItemAnswerCorrect(q, studentAns, rubricScore)) {
        correctLower++;
      }
      if (qType === 'mcq') {
        const optIdx = Number(studentAns);
        if (!isNaN(optIdx) && optIdx >= 0 && optIdx < options.length) {
          choiceLowerCounts[optIdx]++;
        }
      }
    });

    // Calculate p: Difficulty Index
    const p = Math.round((correctTotal / N) * 100) / 100;

    // Calculate r: Discrimination Index
    const rRaw = groupSize > 0 ? (correctUpper - correctLower) / groupSize : 0;
    const r = Math.round(rRaw * 100) / 100;

    sumDifficulty += p;
    sumDiscrimination += r;

    // Distractor analysis stats (applicable for MCQ only)
    const distractors: DistractorChoiceStat[] = qType === 'mcq'
      ? options.map((optText, oIdx) => {
          const isChoiceCorrect = oIdx === Number(correctAns);
          const totalSel = choiceTotalCounts[oIdx] || 0;
          const upperSel = choiceUpperCounts[oIdx] || 0;
          const lowerSel = choiceLowerCounts[oIdx] || 0;

          const totalPct = Math.round((totalSel / N) * 100);
          const upperPct = Math.round((upperSel / groupSize) * 100);
          const lowerPct = Math.round((lowerSel / groupSize) * 100);

          // Distractor is effective if it is incorrect and selected by more lower group than upper group (or >= 5% total)
          const isEffective = !isChoiceCorrect && (lowerSel > upperSel || totalPct >= 5);

          return {
            choiceIndex: oIdx,
            choiceLabel: CHOICE_LABELS[oIdx] || `${oIdx + 1}`,
            text: optText,
            isCorrect: isChoiceCorrect,
            totalSelected: totalSel,
            upperSelected: upperSel,
            lowerSelected: lowerSel,
            totalPercent: totalPct,
            upperPercent: upperPct,
            lowerPercent: lowerPct,
            isEffective,
          };
        })
      : [];

    // Determine Quality Level & Recommendation
    let qualityLevel: ItemQualityLevel = 'acceptable';
    let qualityLabel = 'คุณภาพพอใช้';
    let qualityBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    let recommendation = 'ข้อสอบอยู่ในเกณฑ์ที่นำไปใช้ได้';

    if (r < 0) {
      qualityLevel = 'critical';
      qualityLabel = 'วิกฤต (ตรวจด่วน)';
      qualityBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
      recommendation = 'เด็กกลุ่มอ่อนตอบถูกมากกว่าเด็กกลุ่มเก่ง ควรตรวจสอบว่าเฉลยผิดหรือข้อความกำกวม';
      needsRevisionCount++;
    } else if (r < 0.20) {
      qualityLevel = 'poor';
      qualityLabel = 'อำนาจจำแนกต่ำ';
      qualityBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
      recommendation = 'ข้อสอบไม่สามารถแยกเด็กเก่งกับเด็กอ่อนได้ ควรปรับปรุงตัวเลือกหรือคำถาม';
      needsRevisionCount++;
    } else if (p > 0.85) {
      qualityLevel = 'too_easy';
      qualityLabel = 'ง่ายเกินไป';
      qualityBadgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
      recommendation = 'นักเรียนส่วนใหญ่ตอบถูกแทบทั้งหมด ควรปรับเพิ่มความท้าทายของตัวเลือก';
      acceptableCount++;
    } else if (p < 0.15) {
      qualityLevel = 'too_hard';
      qualityLabel = 'ยากเกินไป';
      qualityBadgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
      recommendation = 'นักเรียนส่วนใหญ่ตอบผิด อาจเกินขอบเขตตัวชี้วัดหรือคำถามซับซ้อนเกินไป';
      acceptableCount++;
    } else if (r >= 0.35 && p >= 0.30 && p <= 0.75) {
      qualityLevel = 'excellent';
      qualityLabel = 'คุณภาพดีเยี่ยม';
      qualityBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      recommendation = 'ข้อสอบมาตรฐานสูง อำนาจจำแนกดี ความยากเหมาะสม นำไปเก็บเป็นข้อสอบมาตรฐานได้';
      excellentCount++;
    } else {
      qualityLevel = 'acceptable';
      qualityLabel = 'คุณภาพดี';
      qualityBadgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
      recommendation = 'ข้อสอบมีคุณภาพตามเกณฑ์มาตรฐาน สามารถนำไปใช้วัดผลได้ดี';
      acceptableCount++;
    }

    return {
      questionIndex: idx,
      questionNumber: idx + 1,
      questionText: qText,
      questionType: qType,
      topic: q.topic,
      difficultyDeclared: q.difficulty,
      correctAnswer: correctAns as number | string | boolean,
      examineeCount: N,
      correctCount: correctTotal,
      difficultyIndex: p,
      discriminationIndex: r,
      qualityLevel,
      qualityLabel,
      qualityBadgeColor,
      recommendation,
      distractors,
    };
  });

  const avgP = Math.round((sumDifficulty / questions.length) * 100) / 100;
  const avgR = Math.round((sumDiscrimination / questions.length) * 100) / 100;
  const avgPct = Math.round((avgScore / (questions.length || 1)) * 100);

  return {
    overall: {
      totalExaminees: N,
      totalQuestions: questions.length,
      averageScore: Math.round(avgScore * 10) / 10,
      averagePercentage: avgPct,
      averageDifficulty: avgP,
      averageDiscrimination: avgR,
      excellentCount,
      acceptableCount,
      needsRevisionCount,
      highestScore: maxScore,
      lowestScore: minScore,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
    },
    items: analyzedItems,
  };
}

/**
 * multiVersion.ts
 * โมดูลสร้างชุดข้อสอบคู่ขนานหลายฉบับ (Multi-Version Exam Form A / Form B)
 * สลับลำดับข้อสอบ และสลับตำแหน่งตัวเลือก (ก, ข, ค, ง) แบบ Deterministic (ผลลัพธ์คงที่ทุกครั้งที่พิมพ์/เปิด)
 * พร้อมคำนวณคีย์เฉลยที่ถูกต้องของแต่ละฉบับ
 */

export interface ExamOptionItem {
  text: string;
  originalIndex: number;
}

export interface ExamQuestionInput {
  id?: string;
  question_text?: string;
  question?: string;
  question_type?: string;
  type?: string;
  options?: string[];
  answer?: number | string | boolean | unknown;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  pairs?: Array<{ left: string; right: string }>;
}

export interface ShuffledQuestion extends ExamQuestionInput {
  originalQuestionIndex: number;
  newQuestionIndex: number;
  version: 'A' | 'B';
  optionsMapping?: number[]; // newOptionIndex -> originalOptionIndex
}

export interface MultiVersionResult {
  version: 'A' | 'B';
  title: string;
  questions: ShuffledQuestion[];
  answerKey: Record<number, number | string | boolean>; // questionNumber (1-based) -> correct answer
}

export interface AnswerKeyMatrixItem {
  questionNumber: number;
  formAQuestionNumber: number;
  formACorrectChoice: string; // 'ก', 'ข', 'ค', 'ง'
  formBQuestionNumber: number;
  formBCorrectChoice: string; // 'ก', 'ข', 'ค', 'ง'
  questionSnippet: string;
}

/**
 * Simple Mulberry32 pseudo-random number generator
 * ให้ลำดับเลขสุ่มคงที่ตาม seed สำหรับความสม่ำเสมอในการพิมพ์
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) + 12345;
}

/**
 * Fisher-Yates shuffle using deterministic PRNG
 */
function seededShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

/**
 * สร้างชุดข้อสอบฉบับ A หรือ B
 * - Form A: คงลำดับข้อและตัวเลือกตามต้นฉบับ
 * - Form B: สลับลำดับข้อ และสลับตำแหน่งตัวเลือก (สำหรับ MCQ) โดยเฉลยยังชี้ไปยังคำตอบที่ถูกต้องตรงกัน
 */
export function generateExamVersion(
  baseQuestions: ExamQuestionInput[],
  version: 'A' | 'B',
  examSetIdOrTitle: string = 'kampai-exam'
): MultiVersionResult {
  if (version === 'A') {
    const questions: ShuffledQuestion[] = baseQuestions.map((q, idx) => ({
      ...q,
      originalQuestionIndex: idx,
      newQuestionIndex: idx,
      version: 'A',
    }));

    const answerKey: Record<number, number | string | boolean> = {};
    questions.forEach((q, idx) => {
      answerKey[idx + 1] = (q.answer !== undefined ? q.answer : 0) as number | string | boolean;
    });

    return {
      version: 'A',
      title: 'ฉบับ A (Form A)',
      questions,
      answerKey,
    };
  }

  // Version B: Deterministic Shuffle
  const seed = stringToSeed(`${examSetIdOrTitle}-form-b-v1`);
  const prng = mulberry32(seed);

  // 1. Prepare indices and shuffle questions order
  const indexedQuestions = baseQuestions.map((q, idx) => ({ q, originalIndex: idx }));
  const shuffledIndexedQuestions = seededShuffle(indexedQuestions, prng);

  const shuffledQuestions: ShuffledQuestion[] = shuffledIndexedQuestions.map((item, newIdx) => {
    const q = item.q;
    const qType = q.question_type || q.type || 'mcq';

    // If MCQ and has options, shuffle options
    if (qType === 'mcq' && Array.isArray(q.options) && q.options.length > 1) {
      const origOptions = q.options;
      const originalAnswerIdx = Number(q.answer);

      // Create indexed options
      const optObjects = origOptions.map((text, oIdx) => ({ text, originalIdx: oIdx }));
      const shuffledOpts = seededShuffle(optObjects, prng);

      // Find where the correct answer moved to
      const newAnswerIdx = shuffledOpts.findIndex((opt) => opt.originalIdx === originalAnswerIdx);

      return {
        ...q,
        options: shuffledOpts.map((opt) => opt.text),
        answer: newAnswerIdx !== -1 ? newAnswerIdx : originalAnswerIdx,
        originalQuestionIndex: item.originalIndex,
        newQuestionIndex: newIdx,
        version: 'B',
        optionsMapping: shuffledOpts.map((opt) => opt.originalIdx),
      };
    }

    // For True/False, Fill-in, Matching - keep content but note new question order
    return {
      ...q,
      originalQuestionIndex: item.originalIndex,
      newQuestionIndex: newIdx,
      version: 'B',
    };
  });

  const answerKey: Record<number, number | string | boolean> = {};
  shuffledQuestions.forEach((q, idx) => {
    answerKey[idx + 1] = (q.answer !== undefined ? q.answer : 0) as number | string | boolean;
  });

  return {
    version: 'B',
    title: 'ฉบับ B (Form B)',
    questions: shuffledQuestions,
    answerKey,
  };
}

/**
 * สร้างตารางเปรียบเทียบเฉลยคู่ขนาน (Form A vs Form B Matrix) สำหรับคุณครูใช้ตรวจข้อสอบ
 */
export function generateAnswerKeyMatrix(
  baseQuestions: ExamQuestionInput[],
  examSetIdOrTitle: string = 'kampai-exam'
): AnswerKeyMatrixItem[] {
  const formA = generateExamVersion(baseQuestions, 'A', examSetIdOrTitle);
  const formB = generateExamVersion(baseQuestions, 'B', examSetIdOrTitle);

  // Map from Form B's originalQuestionIndex to Form B's new question number
  const originalToFormBMap = new Map<number, { newQuestionNumber: number; correctChoiceLabel: string }>();

  formB.questions.forEach((bQ, bIdx) => {
    const bAnswerIdx = Number(bQ.answer);
    const label = CHOICE_LABELS[bAnswerIdx] || `${bAnswerIdx + 1}`;
    originalToFormBMap.set(bQ.originalQuestionIndex, {
      newQuestionNumber: bIdx + 1,
      correctChoiceLabel: label,
    });
  });

  return formA.questions.map((aQ, aIdx) => {
    const aAnswerIdx = Number(aQ.answer);
    const aLabel = CHOICE_LABELS[aAnswerIdx] || `${aAnswerIdx + 1}`;
    const bInfo = originalToFormBMap.get(aIdx) || {
      newQuestionNumber: aIdx + 1,
      correctChoiceLabel: aLabel,
    };

    const text = aQ.question_text || aQ.question || '';
    const snippet = text.length > 50 ? `${text.slice(0, 48)}...` : text;

    return {
      questionNumber: aIdx + 1,
      formAQuestionNumber: aIdx + 1,
      formACorrectChoice: aLabel,
      formBQuestionNumber: bInfo.newQuestionNumber,
      formBCorrectChoice: bInfo.correctChoiceLabel,
      questionSnippet: snippet,
    };
  });
}

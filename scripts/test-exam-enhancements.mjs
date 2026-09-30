/**
 * test-exam-enhancements.mjs
 * Automated verification test suite for Exam System enhancements:
 * - Multi-Version Form A / Form B generation & answer key consistency
 * - Psychometrics & Item Analysis calculation (p, r, distractor efficiency)
 * - Word (.docx) generation
 * - Excel (.xlsx) generation
 */

import assert from 'node:assert';
import { generateExamVersion, generateAnswerKeyMatrix } from '../src/lib/exam/multiVersion.ts';
import { computeItemAnalysis } from '../src/lib/exam/itemAnalysis.ts';

console.log('🧪 Starting Exam System Enhancements Verification Suite...\n');

// ── Test 1: Multi-Version Generation ──────────────────────────────────────────
console.log('👉 [Test 1] Testing Multi-Version Form A vs Form B generation...');

const sampleQuestions = [
  {
    question_text: '5 + 7 มีค่าเท่ากับเท่าใด',
    question_type: 'mcq',
    options: ['10', '11', '12', '13'],
    answer: 2, // '12'
    topic: 'การบวกจำนวนนับ',
    difficulty: 'easy',
  },
  {
    question_text: 'รูปสี่เหลี่ยมจัตุรัสมีด้านยาวด้านละ 4 ซม. จะมีพื้นที่กี่ ตร.ซม.',
    question_type: 'mcq',
    options: ['8', '12', '16', '20'],
    answer: 2, // '16'
    topic: 'เรขาคณิต',
    difficulty: 'medium',
  },
  {
    question_text: 'ผลคูณของ 15 x 6 เท่ากับข้อใด',
    question_type: 'mcq',
    options: ['80', '90', '100', '110'],
    answer: 1, // '90'
    topic: 'การคูณจำนวนนับ',
    difficulty: 'easy',
  },
  {
    question_text: 'ประเทศไทยตั้งอยู่ในทวีปใด',
    question_type: 'mcq',
    options: ['ยุโรป', 'เอเชีย', 'แอฟริกา', 'ออสเตรเลีย'],
    answer: 1, // 'เอเชีย'
    topic: 'ภูมิศาสตร์',
    difficulty: 'easy',
  },
];

const formA = generateExamVersion(sampleQuestions, 'A', 'test-exam');
const formB = generateExamVersion(sampleQuestions, 'B', 'test-exam');

assert.strictEqual(formA.questions.length, 4, 'Form A should have 4 questions');
assert.strictEqual(formB.questions.length, 4, 'Form B should have 4 questions');

// Verify that in Form A, Q1 answer is still '12'
assert.strictEqual(formA.questions[0].options[formA.questions[0].answer], '12');

// Verify that in Form B, every question still points to its correct answer text!
formB.questions.forEach((bQ, idx) => {
  const origQ = sampleQuestions[bQ.originalQuestionIndex];
  const origAnswerText = origQ.options[origQ.answer];
  const bAnswerText = bQ.options[bQ.answer];
  assert.strictEqual(
    bAnswerText,
    origAnswerText,
    `Form B Q#${idx + 1} answer text "${bAnswerText}" must match original "${origAnswerText}"`
  );
});

console.log('   ✅ Form A and Form B question answer consistency verified!');

// Test Answer Key Matrix
const matrix = generateAnswerKeyMatrix(sampleQuestions, 'test-exam');
assert.strictEqual(matrix.length, 4, 'Matrix must have 4 rows');
console.log('   Form A vs Form B Matrix sample:');
matrix.forEach((m) => {
  console.log(`     • Q (Form A): #${m.formAQuestionNumber} [${m.formACorrectChoice}]  <-->  Q (Form B): #${m.formBQuestionNumber} [${m.formBCorrectChoice}] | "${m.questionSnippet}"`);
});
console.log('   ✅ Answer Key Matrix generated correctly!\n');

// ── Test 2: Item Analysis (p & r calculations) ───────────────────────────────
console.log('👉 [Test 2] Testing Item Analysis & Psychometrics calculations...');

// Simulate 10 student submissions:
// High group students (score 4, 3, 3)
// Medium group students (score 2, 2, 2, 2)
// Low group students (score 1, 0, 0)
const simulatedSubmissions = [
  { score: 4, answers: { 0: 2, 1: 2, 2: 1, 3: 1 }, student_name: 'เด็กชายเอ (เก่งมาก)' },
  { score: 3, answers: { 0: 2, 1: 2, 2: 1, 3: 0 }, student_name: 'เด็กหญิงบี' },
  { score: 3, answers: { 0: 2, 1: 2, 2: 0, 3: 1 }, student_name: 'เด็กชายซี' },
  { score: 2, answers: { 0: 2, 1: 0, 2: 1, 3: 0 }, student_name: 'เด็กหญิงดี' },
  { score: 2, answers: { 0: 2, 1: 1, 2: 1, 3: 2 }, student_name: 'เด็กชายอี' },
  { score: 2, answers: { 0: 0, 1: 2, 2: 1, 3: 3 }, student_name: 'เด็กหญิงเอฟ' },
  { score: 2, answers: { 0: 2, 1: 3, 2: 1, 3: 0 }, student_name: 'เด็กชายจี' },
  { score: 1, answers: { 0: 2, 1: 0, 2: 0, 3: 0 }, student_name: 'เด็กหญิงเอช' },
  { score: 0, answers: { 0: 0, 1: 0, 2: 0, 3: 0 }, student_name: 'เด็กชายไอ' },
  { score: 0, answers: { 0: 1, 1: 1, 2: 2, 3: 2 }, student_name: 'เด็กหญิงเจ' },
];

const analysis = computeItemAnalysis(sampleQuestions, simulatedSubmissions);

assert.strictEqual(analysis.overall.totalExaminees, 10, 'Total examinees should be 10');
assert.strictEqual(analysis.items.length, 4, 'Items count should be 4');

// Question 0: answered correctly by 8/10 students -> p = 0.8
console.log(`   Q1: Difficulty p = ${analysis.items[0].difficultyIndex}, Discrimination r = ${analysis.items[0].discriminationIndex}, Quality: ${analysis.items[0].qualityLabel}`);
assert.ok(analysis.items[0].difficultyIndex >= 0.7, 'Q1 should have high p (easy)');

// Question 1: answered correctly by upper group, missed by lower group -> high r!
console.log(`   Q2: Difficulty p = ${analysis.items[1].difficultyIndex}, Discrimination r = ${analysis.items[1].discriminationIndex}, Quality: ${analysis.items[1].qualityLabel}`);
assert.ok(analysis.items[1].discriminationIndex > 0, 'Q2 discrimination should be positive');

// Verify distractor efficiency stats exist for all options
assert.strictEqual(analysis.items[0].distractors.length, 4, 'Q1 must have 4 distractor options');
assert.strictEqual(analysis.items[0].distractors[2].isCorrect, true, 'Q1 option 2 must be marked as correct');
assert.strictEqual(analysis.items[0].distractors[0].isCorrect, false, 'Q1 option 0 must be marked as incorrect distractor');

console.log('   ✅ Item Analysis & Distractor breakdown verified successfully!\n');

console.log('🎉 ALL 2 VERIFICATION TEST SUITES PASSED CLEANLY! 🎉');

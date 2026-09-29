/**
 * scripts/verify-and-generate-exam-pack3.mjs
 * ตรวจสอบความถูกต้องของข้อสอบชุดที่ 3 (50 ข้อ × 9 วิชา = 450 ข้อ)
 * และสร้างไฟล์ SQL Migration 544_seed_grade4_pack3_exams.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Pack 3 datasets
import { thaiPack3Questions } from './data/grade4/pack3/thai.mjs';
import { mathPack3Questions } from './data/grade4/pack3/math.mjs';
import { sciencePack3Questions } from './data/grade4/pack3/science.mjs';
import { socialPack3Questions } from './data/grade4/pack3/social.mjs';
import { historyPack3Questions } from './data/grade4/pack3/history.mjs';
import { englishPack3Questions } from './data/grade4/pack3/english.mjs';
import { healthPack3Questions } from './data/grade4/pack3/health.mjs';
import { artPack3Questions } from './data/grade4/pack3/art.mjs';
import { careersPack3Questions } from './data/grade4/pack3/careers.mjs';

// Import existing datasets to check for duplicate questions
import { thaiQuestions } from './data/grade4/thai.mjs';
import { mathQuestions } from './data/grade4/math.mjs';
import { scienceQuestions } from './data/grade4/science.mjs';
import { socialQuestions } from './data/grade4/social.mjs';
import { historyQuestions } from './data/grade4/history.mjs';
import { englishQuestions } from './data/grade4/english.mjs';
import { healthQuestions } from './data/grade4/health.mjs';
import { artQuestions } from './data/grade4/art.mjs';
import { careersQuestions } from './data/grade4/careers.mjs';

import { thaiExtraQuestions } from './data/grade4/thai-extra.mjs';
import { mathExtraQuestions } from './data/grade4/math-extra.mjs';
import { scienceExtraQuestions } from './data/grade4/science-extra.mjs';
import { socialExtraQuestions } from './data/grade4/social-extra.mjs';
import { historyExtraQuestions } from './data/grade4/history-extra.mjs';
import { englishExtraQuestions } from './data/grade4/english-extra.mjs';
import { healthExtraQuestions } from './data/grade4/health-extra.mjs';
import { artExtraQuestions } from './data/grade4/art-extra.mjs';
import { careersExtraQuestions } from './data/grade4/careers-extra.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const existingQuestions = [
  ...thaiQuestions, ...mathQuestions, ...scienceQuestions,
  ...socialQuestions, ...historyQuestions, ...englishQuestions,
  ...healthQuestions, ...artQuestions, ...careersQuestions,
  ...thaiExtraQuestions, ...mathExtraQuestions, ...scienceExtraQuestions,
  ...socialExtraQuestions, ...historyExtraQuestions, ...englishExtraQuestions,
  ...healthExtraQuestions, ...artExtraQuestions, ...careersExtraQuestions,
];

const existingTexts = new Set(
  existingQuestions.map((q) => q.question_text.trim().toLowerCase())
);

console.log(`\n======================================================`);
console.log(`  EXAM QUESTION PACK 3 VALIDATION (450 Questions)`);
console.log(`  Existing Database Questions Loaded: ${existingQuestions.length}`);
console.log(`======================================================\n`);

const packs = [
  { name: 'ภาษาไทย', list: thaiPack3Questions },
  { name: 'คณิตศาสตร์', list: mathPack3Questions },
  { name: 'วิทยาศาสตร์', list: sciencePack3Questions },
  { name: 'สังคมศึกษา', list: socialPack3Questions },
  { name: 'ประวัติศาสตร์', list: historyPack3Questions },
  { name: 'ภาษาอังกฤษ', list: englishPack3Questions },
  { name: 'สุขศึกษา', list: healthPack3Questions },
  { name: 'ศิลปะ', list: artPack3Questions },
  { name: 'การงานอาชีพ', list: careersPack3Questions },
];

let totalNewQuestions = 0;
let hasError = false;
const packTexts = new Set();
const summaryRows = [];

for (const pack of packs) {
  const { name, list } = pack;

  if (list.length !== 50) {
    console.error(`❌ [${name}] Error: Expected exactly 50 questions, found ${list.length}`);
    hasError = true;
  }

  let easyCount = 0;
  let medCount = 0;
  let hardCount = 0;

  list.forEach((q, idx) => {
    totalNewQuestions++;
    const qNum = idx + 1;

    // Check schema
    if (q.subject !== name) {
      console.error(`❌ [${name}] Q#${qNum}: Subject mismatch: '${q.subject}' vs expected '${name}'`);
      hasError = true;
    }
    if (q.grade !== 'ป.4') {
      console.error(`❌ [${name}] Q#${qNum}: Grade must be 'ป.4', found '${q.grade}'`);
      hasError = true;
    }
    if (!q.topic || !q.topic.includes('ป.4')) {
      console.error(`❌ [${name}] Q#${qNum}: Topic missing indicator code: '${q.topic}'`);
      hasError = true;
    }
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
      console.error(`❌ [${name}] Q#${qNum}: Invalid difficulty '${q.difficulty}'`);
      hasError = true;
    } else {
      if (q.difficulty === 'easy') easyCount++;
      if (q.difficulty === 'medium') medCount++;
      if (q.difficulty === 'hard') hardCount++;
    }

    if (q.question_type !== 'mcq') {
      console.error(`❌ [${name}] Q#${qNum}: question_type must be 'mcq'`);
      hasError = true;
    }

    if (!q.question_text || q.question_text.trim().length === 0) {
      console.error(`❌ [${name}] Q#${qNum}: Empty question_text`);
      hasError = true;
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      console.error(`❌ [${name}] Q#${qNum}: Must have exactly 4 options`);
      hasError = true;
    } else {
      const uniqueOptions = new Set(q.options.map(o => String(o).trim()));
      if (uniqueOptions.size !== 4) {
        console.error(`❌ [${name}] Q#${qNum}: Duplicate options detected in ${JSON.stringify(q.options)}`);
        hasError = true;
      }
    }

    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
      console.error(`❌ [${name}] Q#${qNum}: Answer index must be integer 0..3, found: ${q.answer}`);
      hasError = true;
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      console.error(`❌ [${name}] Q#${qNum}: Missing explanation`);
      hasError = true;
    }

    // Check duplicate in Pack 3
    const textKey = q.question_text.trim().toLowerCase();
    if (packTexts.has(textKey)) {
      console.error(`❌ [${name}] Q#${qNum}: Duplicate question_text in Pack 3: "${q.question_text.slice(0, 50)}..."`);
      hasError = true;
    }
    packTexts.add(textKey);

    // Check duplicate with existing 900 questions
    if (existingTexts.has(textKey)) {
      console.error(`❌ [${name}] Q#${qNum}: Question already exists in previous 900 questions: "${q.question_text.slice(0, 50)}..."`);
      hasError = true;
    }
  });

  // Verify exact difficulty counts: 15 easy, 25 medium, 10 hard
  if (easyCount !== 15 || medCount !== 25 || hardCount !== 10) {
    console.error(`❌ [${name}] Difficulty distribution mismatch: Easy=${easyCount} (exp 15), Med=${medCount} (exp 25), Hard=${hardCount} (exp 10)`);
    hasError = true;
  }

  summaryRows.push({
    วิชา: name,
    จำนวนข้อ: list.length,
    ง่าย_15: easyCount === 15 ? `✅ ${easyCount}` : `❌ ${easyCount}`,
    กลาง_25: medCount === 25 ? `✅ ${medCount}` : `❌ ${medCount}`,
    ยาก_10: hardCount === 10 ? `✅ ${hardCount}` : `❌ ${hardCount}`,
    สถานะ: (easyCount === 15 && medCount === 25 && hardCount === 10 && list.length === 50) ? '✅ ผ่าน' : '❌ ไม่ผ่าน'
  });
}

console.table(summaryRows);

if (hasError) {
  console.error('\n❌ VALIDATION FAILED! Please fix the errors listed above.\n');
  process.exit(1);
}

console.log(`\n✅ ALL 450 QUESTIONS VALIDATED SUCCESSFULLY!`);
console.log(`- 9 subjects × 50 questions = 450 questions`);
console.log(`- Difficulty ratio: 15 easy (30%), 25 medium (50%), 10 hard (20%) per subject`);
console.log(`- Zero duplicates with existing 900 questions`);
console.log(`- Total questions after migration will be 900 + 450 = 1,350 questions\n`);

// ─────────────────────────────────────────────────────────────────────────────
// Generate SQL Migration 544
// ─────────────────────────────────────────────────────────────────────────────
console.log('Generating SQL migration: supabase/migrations/544_seed_grade4_pack3_exams.sql ...');

function escapeSqlString(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/'/g, "''");
}

let sqlContent = `-- ═══════════════════════════════════════════════════════════════
-- Migration 544: Seed Grade 4 Pack 3 Curriculum Exams
-- Adds 450 additional questions (50 per subject × 9 subjects)
-- Ratio: Easy 30% (15), Medium 50% (25), Hard 20% (10) per subject
-- Total after this migration: 1,350 questions for ป.4 (150 per subject)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO exam_questions (subject, grade, question_type, question_text, options, answer, explanation, difficulty, topic)
VALUES
`;

const valueRows = [];

for (const pack of packs) {
  for (const q of pack.list) {
    const subject = escapeSqlString(q.subject);
    const grade = escapeSqlString(q.grade);
    const questionType = escapeSqlString(q.question_type);
    const questionText = escapeSqlString(q.question_text);
    const optionsJson = escapeSqlString(JSON.stringify(q.options));
    const answerJson = escapeSqlString(JSON.stringify(q.answer));
    const explanation = escapeSqlString(q.explanation);
    const difficulty = escapeSqlString(q.difficulty);
    const topic = escapeSqlString(q.topic);

    valueRows.push(
      `  ('${subject}', '${grade}', '${questionType}', '${questionText}', '${optionsJson}'::jsonb, '${answerJson}'::jsonb, '${explanation}', '${difficulty}', '${topic}')`
    );
  }
}

sqlContent += valueRows.join(',\n') + ';\n';

const outPath = path.resolve(__dirname, '../supabase/migrations/544_seed_grade4_pack3_exams.sql');
fs.writeFileSync(outPath, sqlContent, 'utf8');

console.log(`✅ Successfully generated: ${outPath} (${sqlContent.length} bytes, ${valueRows.length} rows)\n`);

// Also write per-subject SQL files for modular execution
const subDir = path.resolve(__dirname, '../supabase/migrations/pack3_by_subject');
if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

for (const pack of packs) {
  const rows = pack.list.map(q => {
    const subject = escapeSqlString(q.subject);
    const grade = escapeSqlString(q.grade);
    const questionType = escapeSqlString(q.question_type);
    const questionText = escapeSqlString(q.question_text);
    const optionsJson = escapeSqlString(JSON.stringify(q.options));
    const answerJson = escapeSqlString(JSON.stringify(q.answer));
    const explanation = escapeSqlString(q.explanation);
    const difficulty = escapeSqlString(q.difficulty);
    const topic = escapeSqlString(q.topic);
    return `  ('${subject}', '${grade}', '${questionType}', '${questionText}', '${optionsJson}'::jsonb, '${answerJson}'::jsonb, '${explanation}', '${difficulty}', '${topic}')`;
  });

  const subSql = `INSERT INTO exam_questions (subject, grade, question_type, question_text, options, answer, explanation, difficulty, topic)\nVALUES\n${rows.join(',\n')};\n`;
  const subPath = path.resolve(subDir, `${pack.name}.sql`);
  fs.writeFileSync(subPath, subSql, 'utf8');
}
console.log(`✅ Generated 9 per-subject SQL files in: ${subDir}\n`);

/**
 * scripts/seed-grade4-exams.mjs
 * ตรวจสอบความถูกต้องและสร้าง SQL Migration สำหรับคลังข้อสอบ ป.4 ทั้ง 9 วิชา (540 ข้อ)
 * และชุดข้อสอบมาตรฐาน 9 ชุด พร้อมนำเข้าสู่ Supabase
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { thaiQuestions } from './data/grade4/thai.mjs';
import { mathQuestions } from './data/grade4/math.mjs';
import { scienceQuestions } from './data/grade4/science.mjs';
import { socialQuestions } from './data/grade4/social.mjs';
import { historyQuestions } from './data/grade4/history.mjs';
import { englishQuestions } from './data/grade4/english.mjs';
import { healthQuestions } from './data/grade4/health.mjs';
import { artQuestions } from './data/grade4/art.mjs';
import { careersQuestions } from './data/grade4/careers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allSubjectDatasets = [
  { name: 'ภาษาไทย', list: thaiQuestions, pin: 'THAI401' },
  { name: 'คณิตศาสตร์', list: mathQuestions, pin: 'MATH401' },
  { name: 'วิทยาศาสตร์', list: scienceQuestions, pin: 'SCI401' },
  { name: 'สังคมศึกษา', list: socialQuestions, pin: 'SOC401' },
  { name: 'ประวัติศาสตร์', list: historyQuestions, pin: 'HIST401' },
  { name: 'ภาษาอังกฤษ', list: englishQuestions, pin: 'ENG401' },
  { name: 'สุขศึกษา', list: healthQuestions, pin: 'HEA401' },
  { name: 'ศิลปะ', list: artQuestions, pin: 'ART401' },
  { name: 'การงานอาชีพ', list: careersQuestions, pin: 'CAR401' },
];

console.log('=== Validating Grade 4 Exam Datasets ===');
let totalQuestions = 0;

for (const sub of allSubjectDatasets) {
  if (sub.list.length !== 60) {
    throw new Error(`Subject ${sub.name} has ${sub.list.length} questions (expected 60)`);
  }
  for (let i = 0; i < sub.list.length; i++) {
    const q = sub.list[i];
    if (!q.question_text || !q.topic || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Subject ${sub.name} item ${i + 1} has invalid question_text/options`);
    }
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
      throw new Error(`Subject ${sub.name} item ${i + 1} has invalid answer index: ${q.answer}`);
    }
    if (!q.explanation) {
      throw new Error(`Subject ${sub.name} item ${i + 1} missing explanation`);
    }
  }
  console.log(`✓ ${sub.name}: ${sub.list.length} questions valid`);
  totalQuestions += sub.list.length;
}

console.log(`Total questions verified: ${totalQuestions}`);

// Helper to escape SQL string
function escapeSql(str) {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

// Generate SQL migration
console.log('=== Generating SQL Migration 542 ===');
const sqlLines = [];
sqlLines.push('-- 542_seed_grade4_curriculum_exams.sql');
sqlLines.push('-- คลังข้อสอบมาตรฐาน ป.4 ครบ 9 รายวิชา วิชาละ 60 ข้อ (รวม 540 ข้อ) ตามตัวชี้วัด สพฐ.');
sqlLines.push('-- พร้อมชุดข้อสอบมาตรฐาน 9 ชุด');
sqlLines.push('');

// Insert questions
sqlLines.push('-- 1. แทรกข้อสอบ 540 ข้อลงใน public.exam_questions');

for (const sub of allSubjectDatasets) {
  sqlLines.push(`-- วิชา: ${sub.name} (60 ข้อ)`);
  for (const q of sub.list) {
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    sqlLines.push(
      `INSERT INTO public.exam_questions (subject, grade, topic, difficulty, question_type, question_text, options, answer, explanation) VALUES (` +
        `${escapeSql(q.subject)}, ` +
        `${escapeSql(q.grade)}, ` +
        `${escapeSql(q.topic)}, ` +
        `${escapeSql(q.difficulty)}, ` +
        `'mcq', ` +
        `${escapeSql(q.question_text)}, ` +
        `'${optionsJson}'::jsonb, ` +
        `'${q.answer}'::jsonb, ` +
        `${escapeSql(q.explanation)}` +
      `);`
    );
  }
  sqlLines.push('');
}

// Preset Exam Sets (20 questions each)
sqlLines.push('-- 2. สร้างชุดข้อสอบมาตรฐาน ป.4 วิชาละ 1 ชุด (ชุดละ 20 ข้อ)');

for (const sub of allSubjectDatasets) {
  const sample20 = sub.list.slice(0, 20);
  const questionsJson = JSON.stringify(sample20).replace(/'/g, "''");
  const title = `แบบทดสอบมาตรฐาน วิชา${sub.name} ป.4 (20 ข้อ)`;
  sqlLines.push(
    `INSERT INTO public.exam_sets (title, subject, grade, questions, time_limit_minutes, pass_threshold_pct, pin_code, is_active) VALUES (` +
      `${escapeSql(title)}, ` +
      `${escapeSql(sub.name)}, ` +
      `'ป.4', ` +
      `'${questionsJson}'::jsonb, ` +
      `30, ` +
      `50, ` +
      `${escapeSql(sub.pin)}, ` +
      `true` +
    `);`
  );
}

const migrationFilePath = path.resolve(__dirname, '../supabase/migrations/542_seed_grade4_curriculum_exams.sql');
fs.writeFileSync(migrationFilePath, sqlLines.join('\n'), 'utf8');
console.log(`✓ Migration written to: ${migrationFilePath} (${sqlLines.length} lines)`);

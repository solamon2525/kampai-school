// scripts/build-migration-558.mjs
// Generates supabase/migrations/558_seed_english_picture_exam_bank.sql
// 60 English Picture-based MCQ Questions and the standard ENGPIC60 Exam Set
import fs from 'fs';
import path from 'path';
import { generateEnglishPictureMcq } from './gen-english-picture-mcq.mjs';

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function sqlJsonbText(val) {
  return `to_jsonb(${esc(val)}::text)`;
}

const MEDIA_HUB_ENGLISH = {
  id: '2cc2e12b-eff6-475f-894e-f09822fcacb2',
  title: 'คำศัพท์ภาษาอังกฤษ (Vocabulary Hub)',
  img: '/games/english/vocab-hub-cover.png'
};

const rawQuestions = generateEnglishPictureMcq();
console.log(`Loaded ${rawQuestions.length} picture-based questions`);

const questions = rawQuestions.map((q, idx) => ({
  id: `e1000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
  subject: 'ภาษาอังกฤษ',
  grade: 'ป.4',
  topic: q.topic,
  difficulty: q.difficulty,
  bloom_level: q.bloom,
  question_type: 'mcq',
  question_text: q.text,
  options: q.options,
  answer: q.answer,
  explanation: q.explanation,
  indicator_code: q.indicator_code,
  indicator_desc: q.indicator_desc,
  media_item_id: MEDIA_HUB_ENGLISH.id,
  media_title: q.media_title,
  media_image_url: q.media_image_url
}));

const sqlLines = [];
sqlLines.push('-- ============================================================================');
sqlLines.push('-- Migration 558: Seed English Picture-based Exam Bank (60 Questions) & ENGPIC60');
sqlLines.push('-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 2551');
sqlLines.push('-- บรรจุข้อสอบปรนัยภาษาอังกฤษตอบคำถามจากภาพ (Look at the picture...) จำนวน 60 ข้อ');
sqlLines.push('-- ครอบคลุม 6 หมวด: Colors & Shapes (10), Classroom (10), Animals (10),');
sqlLines.push('-- Food & Fruits (10), Body & Clothes (10), Actions & Weather (10)');
sqlLines.push('-- พร้อมสร้างชุดข้อสอบมาตรฐานพร้อมรหัส PIN "ENGPIC60" สำหรับเปิดสอบและสั่งพิมพ์');
sqlLines.push('-- ============================================================================\n');

sqlLines.push('-- 1. แทรกข้อสอบภาพ 60 ข้อลงใน exam_questions');
sqlLines.push('INSERT INTO public.exam_questions (');
sqlLines.push('  id, subject, grade, topic, difficulty, bloom_level, question_type,');
sqlLines.push('  question_text, options, answer, explanation,');
sqlLines.push('  indicator_code, indicator_desc, media_item_id, media_title, media_image_url');
sqlLines.push(') VALUES');

const rowsSql = questions.map((q, idx) => {
  const isLast = idx === questions.length - 1;
  return `(
  ${esc(q.id)}::uuid, ${esc(q.subject)}, ${esc(q.grade)}, ${esc(q.topic)}, ${esc(q.difficulty)}, ${esc(q.bloom_level)}, ${esc(q.question_type)},
  ${esc(q.question_text)}, ${sqlJsonb(q.options)}, ${sqlJsonbText(q.answer)}, ${esc(q.explanation)},
  ${esc(q.indicator_code)}, ${esc(q.indicator_desc)}, ${esc(q.media_item_id)}::uuid, ${esc(q.media_title)}, ${esc(q.media_image_url)}
)${isLast ? ';' : ','}`;
});

sqlLines.push(rowsSql.join('\n'));
sqlLines.push('\n-- 2. สร้างหรืออัปเดตชุดข้อสอบมาตรฐาน ENGPIC60 ใน exam_sets');

const examSetId = 'e0033333-3333-4444-8888-000000000003';
const examSetTitle = 'แบบทดสอบคำศัพท์ภาษาอังกฤษจากภาพ ป.4 (English Picture Vocabulary Quiz 60)';
const examSetPin = 'ENGPIC60';

const setQuestionsJson = questions.map((q, idx) => ({
  id: q.id,
  question: q.question_text,
  question_text: q.question_text,
  options: q.options,
  answer: q.answer,
  explanation: q.explanation,
  media_image_url: q.media_image_url,
  media_title: q.media_title,
  points: 1,
  question_type: 'mcq'
}));

sqlLines.push(`
INSERT INTO public.exam_sets (
  id, title, subject, grade, pin_code, time_limit_minutes, pass_threshold_pct, is_active, questions
) VALUES (
  '${examSetId}'::uuid,
  ${esc(examSetTitle)},
  'ภาษาอังกฤษ',
  'ป.4',
  '${examSetPin}',
  45,
  60,
  true,
  ${sqlJsonb(setQuestionsJson)}
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  pin_code = EXCLUDED.pin_code,
  questions = EXCLUDED.questions,
  is_active = EXCLUDED.is_active,
  updated_at = now();
`);

const targetSqlPath = path.resolve('supabase/migrations/558_seed_english_picture_exam_bank.sql');
fs.writeFileSync(targetSqlPath, sqlLines.join('\n'), 'utf8');
console.log(`Successfully generated Migration 558: ${targetSqlPath}`);
console.log(`File size: ${(fs.statSync(targetSqlPath).size / 1024).toFixed(1)} KB`);

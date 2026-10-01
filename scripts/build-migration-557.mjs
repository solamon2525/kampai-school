// scripts/build-migration-557.mjs
// Generates supabase/migrations/557_seed_double_mcq_specialized_subjects.sql
// 750 Specialized Subjects MCQ Questions (History 150, Health 150, Art 150, Career 150, Virtue 150)
import fs from 'fs';
import path from 'path';

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

const MEDIA = {
  history: { id: 'e4a29ada-eb6e-493e-b198-869cc54f1edc', title: '🏛️ สมัยสุโขทัย — ไทม์ไลน์', img: '/games/social/sukhothai-timeline-cover.png' },
  health: { id: '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b', title: '🧼 ล้างมือ 7 ขั้นตอน', img: '/games/health/handwash-media-cover.png' },
  art: { id: '068ea5e4-306b-478d-9396-c7632d61fd27', title: '🎶 เครื่องดนตรีไทยและเสียง', img: '/games/arts/thai-instruments-media-cover.png' },
  career: { id: '5ce11c89-0525-41a8-8490-ea0f3c3afc4d', title: '🧵 งานบ้านและงานประดิษฐ์', img: '/games/career/home-crafts-media-cover.png' },
  virtue: { id: '302a9639-7d4d-4433-9e86-233900dc28bc', title: '♻️ คัดแยกขยะ 4 ถัง', img: '/images/virtue-bank.png' }
};

const questions = [];

function addMcq(q) {
  // Validate 4 options
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error(`MCQ question must have exactly 4 options: ${q.text}`);
  }
  // Validate answer index (0, 1, 2, 3)
  const ansIdx = Number(q.answer);
  if (isNaN(ansIdx) || ansIdx < 0 || ansIdx > 3) {
    throw new Error(`MCQ answer must be '0', '1', '2', or '3': got ${q.answer} for ${q.text}`);
  }

  questions.push({
    subject: q.subject,
    grade: 'ป.4',
    topic: q.topic,
    difficulty: q.difficulty || 'medium',
    bloom_level: q.bloom || 'L2',
    question_type: 'mcq',
    question_text: q.text,
    options: q.options,
    answer: String(ansIdx),
    explanation: q.explanation,
    indicator_code: q.indicator_code,
    indicator_desc: q.indicator_desc,
    media_item_id: q.media.id,
    media_title: q.media.title,
    media_image_url: q.media.img
  });
}

// Import generators for each subject
import { generateHistoryMcq } from './gen-history-mcq.mjs';
import { generateHealthMcq } from './gen-health-mcq.mjs';
import { generateArtMcq } from './gen-art-mcq.mjs';
import { generateCareerMcq } from './gen-career-mcq.mjs';
import { generateVirtueMcq } from './gen-virtue-mcq.mjs';

const historyList = generateHistoryMcq();
const healthList = generateHealthMcq();
const artList = generateArtMcq();
const careerList = generateCareerMcq();
const virtueList = generateVirtueMcq();

console.log(`History MCQs generated: ${historyList.length} (Target: 150)`);
console.log(`Health MCQs generated: ${healthList.length} (Target: 150)`);
console.log(`Art MCQs generated: ${artList.length} (Target: 150)`);
console.log(`Career MCQs generated: ${careerList.length} (Target: 150)`);
console.log(`Virtue MCQs generated: ${virtueList.length} (Target: 150)`);

historyList.forEach(q => addMcq({ subject: 'ประวัติศาสตร์', ...q, media: MEDIA.history }));
healthList.forEach(q => addMcq({ subject: 'สุขศึกษา', ...q, media: MEDIA.health }));
artList.forEach(q => addMcq({ subject: 'ศิลปะ', ...q, media: MEDIA.art }));
careerList.forEach(q => addMcq({ subject: 'การงานอาชีพ', ...q, media: MEDIA.career }));
virtueList.forEach(q => addMcq({ subject: 'ต้านทุจริต', ...q, media: MEDIA.virtue }));

console.log(`Total questions for Migration 557: ${questions.length} (Target: 750)`);

const sqlLines = [];
sqlLines.push('-- ============================================================================');
sqlLines.push('-- Migration 557: Seed Double MCQ Bank for Specialized Subjects (750 Questions)');
sqlLines.push('-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 2551');
sqlLines.push('-- บรรจุข้อสอบปรนัย (MCQ) วิชาละ 150 ข้อ รวม 750 ข้อ');
sqlLines.push('-- ครอบคลุม: ประวัติศาสตร์ (150), สุขศึกษา (150), ศิลปะ (150), การงานอาชีพ (150), ต้านทุจริต (150)');
sqlLines.push('-- กระจายความยาก Easy 30%, Medium 50%, Hard 20% ผูกตัวชี้วัด สพฐ. ป.4 และสื่อการสอนจริง');
sqlLines.push('-- ============================================================================\n');

sqlLines.push('INSERT INTO public.exam_questions (');
sqlLines.push('  subject, grade, topic, difficulty, bloom_level, question_type,');
sqlLines.push('  question_text, options, answer, explanation,');
sqlLines.push('  indicator_code, indicator_desc, media_item_id, media_title, media_image_url');
sqlLines.push(') VALUES');

const rowsSql = questions.map((q, idx) => {
  const isLast = idx === questions.length - 1;
  return `(
  ${esc(q.subject)}, ${esc(q.grade)}, ${esc(q.topic)}, ${esc(q.difficulty)}, ${esc(q.bloom_level)}, ${esc(q.question_type)},
  ${esc(q.question_text)}, ${sqlJsonb(q.options)}, ${sqlJsonbText(q.answer)}, ${esc(q.explanation)},
  ${esc(q.indicator_code)}, ${esc(q.indicator_desc)}, ${esc(q.media_item_id)}::uuid, ${esc(q.media_title)}, ${esc(q.media_image_url)}
)${isLast ? ';' : ','}`;
});

sqlLines.push(rowsSql.join('\n'));

const targetSqlPath = path.resolve('supabase/migrations/557_seed_double_mcq_specialized_subjects.sql');
fs.writeFileSync(targetSqlPath, sqlLines.join('\n'), 'utf8');
console.log(`Successfully generated Migration 557: ${targetSqlPath}`);
console.log(`File size: ${(fs.statSync(targetSqlPath).size / 1024).toFixed(1)} KB`);

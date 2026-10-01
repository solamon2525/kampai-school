// scripts/build-migration-556.mjs
// Generates supabase/migrations/556_seed_double_mcq_core_subjects.sql
// 750 Core Subjects MCQ Questions (Thai 150, Math 150, Sci 150, Eng 150, Social 150)
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
  thai: { id: '09148797-df6c-42fd-a5a5-653fe6067de8', title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', img: '/games/thai/thai-vocab-hub/cover.png' },
  math: { id: '45046f41-4f71-48ac-979d-8e3e4fbebc13', title: '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', img: '/games/math/geometry-3d-media-cover.png' },
  sci: { id: '2f26d41a-e6a2-404f-bc20-81965e553665', title: '📝 ใบงานคลังวิทย์ ป.4–ป.5', img: '/games/science/science-p45-hub/cover.png' },
  eng: { id: 'fc6bf43f-9249-4a91-bcfb-c24cf27db608', title: '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', img: '/games/english/english-quest-cover.png' },
  social: { id: 'd5387db8-ff6d-4397-8df1-721640d1cbdd', title: '🤝 พลเมืองดี — หน้าที่และจริยธรรม', img: '/games/social/good-citizen-media-cover.png' }
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

// Driver will import generators for each subject
import { generateMathMcq } from './gen-math-mcq.mjs';
import { generateThaiMcq } from './gen-thai-mcq.mjs';
import { generateSciMcq } from './gen-sci-mcq.mjs';
import { generateEngMcq } from './gen-eng-mcq.mjs';
import { generateSocialMcq } from './gen-social-mcq.mjs';

const mathList = generateMathMcq();
const thaiList = generateThaiMcq();
const sciList = generateSciMcq();
const engList = generateEngMcq();
const socialList = generateSocialMcq();

console.log(`Math MCQs generated: ${mathList.length} (Target: 150)`);
console.log(`Thai MCQs generated: ${thaiList.length} (Target: 150)`);
console.log(`Science MCQs generated: ${sciList.length} (Target: 150)`);
console.log(`English MCQs generated: ${engList.length} (Target: 150)`);
console.log(`Social MCQs generated: ${socialList.length} (Target: 150)`);

mathList.forEach(q => addMcq({ subject: 'คณิตศาสตร์', ...q, media: MEDIA.math }));
thaiList.forEach(q => addMcq({ subject: 'ภาษาไทย', ...q, media: MEDIA.thai }));
sciList.forEach(q => addMcq({ subject: 'วิทยาศาสตร์', ...q, media: MEDIA.sci }));
engList.forEach(q => addMcq({ subject: 'ภาษาอังกฤษ', ...q, media: MEDIA.eng }));
socialList.forEach(q => addMcq({ subject: 'สังคมศึกษา', ...q, media: MEDIA.social }));

console.log(`Total questions for Migration 556: ${questions.length} (Target: 750)`);

const sqlLines = [];
sqlLines.push('-- ============================================================================');
sqlLines.push('-- Migration 556: Seed Double MCQ Bank for Core Subjects (750 Questions)');
sqlLines.push('-- โรงเรียนบ้านคำไผ่ · ระบบประเมินผลการเรียนรู้มาตรฐาน สพฐ. 2551');
sqlLines.push('-- บรรจุข้อสอบปรนัย (MCQ) วิชาละ 150 ข้อ รวม 750 ข้อ');
sqlLines.push('-- ครอบคลุม: ภาษาไทย (150), คณิตศาสตร์ (150), วิทยาศาสตร์ (150), ภาษาอังกฤษ (150), สังคมศึกษา (150)');
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

const targetSqlPath = path.resolve('supabase/migrations/556_seed_double_mcq_core_subjects.sql');
fs.writeFileSync(targetSqlPath, sqlLines.join('\n'), 'utf8');
console.log(`Successfully generated Migration 556: ${targetSqlPath}`);
console.log(`File size: ${(fs.statSync(targetSqlPath).size / 1024).toFixed(1)} KB`);

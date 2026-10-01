// scripts/build-migration-555.mjs
// Generates supabase/migrations/555_seed_double_fillin_and_essay_bank.sql
// 195 Fill-in + 117 Essay = 312 questions
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

function sqlArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "ARRAY[]::text[]";
  const items = arr.map(a => "'" + String(a).replace(/'/g, "''") + "'").join(', ');
  return `ARRAY[${items}]`;
}

const MEDIA = {
  thai: { id: '09148797-df6c-42fd-a5a5-653fe6067de8', title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)', img: '/games/thai/thai-vocab-hub/cover.png' },
  math: { id: '45046f41-4f71-48ac-979d-8e3e4fbebc13', title: '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด', img: '/games/math/geometry-3d-media-cover.png' },
  sci: { id: '2f26d41a-e6a2-404f-bc20-81965e553665', title: '📝 ใบงานคลังวิทย์ ป.4–ป.5', img: '/games/science/science-p45-hub/cover.png' },
  eng: { id: 'fc6bf43f-9249-4a91-bcfb-c24cf27db608', title: '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', img: '/games/english/english-quest-cover.png' },
  social: { id: 'd5387db8-ff6d-4397-8df1-721640d1cbdd', title: '🤝 พลเมืองดี — หน้าที่และจริยธรรม', img: '/games/social/good-citizen-media-cover.png' },
  history: { id: 'e4a29ada-eb6e-493e-b198-869cc54f1edc', title: '🏛️ สมัยสุโขทัย — ไทม์ไลน์', img: '/games/social/sukhothai-timeline-cover.png' },
  health: { id: '017ecbc9-16a6-4def-a9a8-9dfd5e346c2b', title: '🧼 ล้างมือ 7 ขั้นตอน', img: '/games/health/handwash-media-cover.png' },
  art: { id: '068ea5e4-306b-478d-9396-c7632d61fd27', title: '🎶 เครื่องดนตรีไทยและเสียง', img: '/games/arts/thai-instruments-media-cover.png' },
  career: { id: '5ce11c89-0525-41a8-8490-ea0f3c3afc4d', title: '🧵 งานบ้านและงานประดิษฐ์', img: '/games/career/home-crafts-media-cover.png' },
  tech: { id: 'b673b26e-4c29-457e-af54-0134246838ec', title: '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์', img: '/games/tech/code-craft/cover.png' },
  virtue: { id: '302a9639-7d4d-4433-9e86-233900dc28bc', title: '♻️ คัดแยกขยะ 4 ถัง', img: '/images/virtue-bank.png' }
};

const questions = [];

function addFillin(q) {
  questions.push({
    subject: q.subject,
    grade: 'ป.4',
    topic: q.topic,
    difficulty: q.difficulty || 'medium',
    bloom_level: q.bloom || 'L2',
    question_type: 'fillin',
    question_text: q.text,
    answer: q.answer,
    rubric: null,
    accepted_answers: q.accepted,
    explanation: q.explanation,
    indicator_code: q.indicator_code,
    indicator_desc: q.indicator_desc,
    media_item_id: q.media.id,
    media_title: q.media.title,
    media_image_url: q.media.img
  });
}

function addEssay(q) {
  questions.push({
    subject: q.subject,
    grade: 'ป.4',
    topic: q.topic,
    difficulty: q.difficulty || 'easy',
    bloom_level: q.bloom || 'L2',
    question_type: 'essay',
    question_text: q.text,
    answer: q.answer,
    rubric: q.rubric,
    accepted_answers: [],
    explanation: q.explanation,
    indicator_code: q.indicator_code,
    indicator_desc: q.indicator_desc,
    media_item_id: q.media.id,
    media_title: q.media.title,
    media_image_url: q.media.img
  });
}

function makeRubric(keySolution, c1Name, c1Pts, c1Desc, c2Name, c2Pts, c2Desc, c3Name, c3Pts, c3Desc, keywords) {
  return {
    full_score: 5,
    key_solution: keySolution,
    criteria: [
      { name: c1Name, points: c1Pts, description: c1Desc },
      { name: c2Name, points: c2Pts, description: c2Desc },
      { name: c3Name, points: c3Pts, description: c3Desc }
    ],
    keywords: keywords
  };
}

// Import dataset modules
import { mathFillins, thaiFillins, engFillins, sciFillins, socialFillins, historyFillins, healthFillins, artFillins, careerFillins, techFillins } from './data-fillins-555.mjs';
import { mathEssays, sciEssays, thaiEssays, engEssays, socialEssays, historyEssays, healthEssays, artEssays, careerEssays, techEssays, virtueEssays } from './data-essays-555.mjs';

// Load all Fill-ins
mathFillins.forEach(f => addFillin({ subject: 'คณิตศาสตร์', ...f, media: MEDIA.math }));
thaiFillins.forEach(f => addFillin({ subject: 'ภาษาไทย', ...f, media: MEDIA.thai }));
engFillins.forEach(f => addFillin({ subject: 'ภาษาอังกฤษ', ...f, media: MEDIA.eng }));
sciFillins.forEach(f => addFillin({ subject: 'วิทยาศาสตร์', ...f, media: MEDIA.sci }));
socialFillins.forEach(f => addFillin({ subject: 'สังคมศึกษา', ...f, media: MEDIA.social }));
historyFillins.forEach(f => addFillin({ subject: 'ประวัติศาสตร์', ...f, media: MEDIA.history }));
healthFillins.forEach(f => addFillin({ subject: 'สุขศึกษา', ...f, media: MEDIA.health }));
artFillins.forEach(f => addFillin({ subject: 'ศิลปะ', ...f, media: MEDIA.art }));
careerFillins.forEach(f => addFillin({ subject: 'การงานอาชีพ', ...f, media: MEDIA.career }));
techFillins.forEach(f => addFillin({ subject: 'เทคโนโลยี', ...f, media: MEDIA.tech }));

const fillinCount = questions.length;
console.log(`Loaded ${fillinCount} Fill-in questions (Target: 195)`);

// Load all Essays
mathEssays.forEach(e => addEssay({ subject: 'คณิตศาสตร์', ...e, media: MEDIA.math }));
sciEssays.forEach(e => addEssay({ subject: 'วิทยาศาสตร์', ...e, media: MEDIA.sci }));
thaiEssays.forEach(e => addEssay({ subject: 'ภาษาไทย', ...e, media: MEDIA.thai }));
engEssays.forEach(e => addEssay({ subject: 'ภาษาอังกฤษ', ...e, media: MEDIA.eng }));
socialEssays.forEach(e => addEssay({ subject: 'สังคมศึกษา', ...e, media: MEDIA.social }));
historyEssays.forEach(e => addEssay({ subject: 'ประวัติศาสตร์', ...e, media: MEDIA.history }));
healthEssays.forEach(e => addEssay({ subject: 'สุขศึกษา', ...e, media: MEDIA.health }));
artEssays.forEach(e => addEssay({ subject: 'ศิลปะ', ...e, media: MEDIA.art }));
careerEssays.forEach(e => addEssay({ subject: 'การงานอาชีพ', ...e, media: MEDIA.career }));
techEssays.forEach(e => addEssay({ subject: 'เทคโนโลยี', ...e, media: MEDIA.tech }));
virtueEssays.forEach(e => addEssay({ subject: 'ต้านทุจริต', ...e, media: MEDIA.virtue }));

const essayCount = questions.length - fillinCount;
console.log(`Loaded ${essayCount} Essay questions (Target: 117)`);
console.log(`Total questions for Migration 555: ${questions.length} (Target: 312)`);

// Generate SQL
const sqlLines = [];
sqlLines.push('-- ============================================================================');
sqlLines.push('-- Migration 555: Seed Double Fill-in & Essay Exam Bank (312 Questions)');
sqlLines.push('-- โรงเรียนบ้านคำไผ่ · ระบบคลังข้อสอบมาตรฐาน สพฐ. 2551');
sqlLines.push(`-- บรรจุข้อสอบเติมคำ (Fill-in) 195 ข้อ + อัตนัย (Essay) 117 ข้อ ครบ 11 วิชา`);
sqlLines.push('-- ผูกสื่อจริงในคลัง (educational_hub_items), ตัวชี้วัด สพฐ. ป.4 และ Rubric ละเอียด');
sqlLines.push('-- ============================================================================\n');

sqlLines.push('INSERT INTO public.exam_questions (');
sqlLines.push('  subject, grade, topic, difficulty, bloom_level, question_type,');
sqlLines.push('  question_text, answer, rubric, accepted_answers, explanation,');
sqlLines.push('  indicator_code, indicator_desc, media_item_id, media_title, media_image_url');
sqlLines.push(') VALUES');

const rowsSql = questions.map((q, idx) => {
  const isLast = idx === questions.length - 1;
  return `(
  ${esc(q.subject)}, ${esc(q.grade)}, ${esc(q.topic)}, ${esc(q.difficulty)}, ${esc(q.bloom_level)}, ${esc(q.question_type)},
  ${esc(q.question_text)}, ${sqlJsonbText(q.answer)}, ${sqlJsonb(q.rubric)}, ${sqlArray(q.accepted_answers)}, ${esc(q.explanation)},
  ${esc(q.indicator_code)}, ${esc(q.indicator_desc)}, ${esc(q.media_item_id)}::uuid, ${esc(q.media_title)}, ${esc(q.media_image_url)}
)${isLast ? ';' : ','}`;
});

sqlLines.push(rowsSql.join('\n'));

const targetSqlPath = path.resolve('supabase/migrations/555_seed_double_fillin_and_essay_bank.sql');
fs.writeFileSync(targetSqlPath, sqlLines.join('\n'), 'utf8');
console.log(`Successfully generated Migration 555: ${targetSqlPath}`);
console.log(`File size: ${(fs.statSync(targetSqlPath).size / 1024).toFixed(1)} KB`);

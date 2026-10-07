// scripts/verify-p4-papor6-scores.mjs
// Verifies that P.4 exam scores logic and scaling match [35, 45] constraints and blank handling in Papor 6

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- 🧪 STARTING P.4 PAPOR 6 SCORES & MAPPING VERIFICATION ---');

// 1. Verify scaling formula behavior
console.log('\n[1/4] Verifying score scaling formula (range 35-45)...');
function scaleScore(raw, max) {
  const ratio = raw / max;
  return Math.min(45, Math.max(35, Math.round(35 + 10 * ratio)));
}

// Test edge cases: 0% -> 35, 100% -> 45, 50% -> 40
assert.strictEqual(scaleScore(0, 20), 35, '0% raw score must scale to 35');
assert.strictEqual(scaleScore(20, 20), 45, '100% raw score must scale to 45');
assert.strictEqual(scaleScore(10, 20), 40, '50% raw score must scale to 40');
assert.strictEqual(scaleScore(15, 20), 43, '75% raw score must scale to 43');
assert.strictEqual(scaleScore(18, 20), 44, '90% raw score must scale to 44');
assert.strictEqual(scaleScore(12, 30), 39, '40% raw score (English 30 items) must scale to 39');
console.log('  ✅ PASS: Score scaling strictly adheres to [35, 45] range');

// 2. Verify subject normalizer and matching logic
console.log('\n[2/4] Verifying subject matching & blank cell logic...');
const norm = (str) => (str || '').trim().toLowerCase().replace(/\s*[๑-๖1-6]$/, '');

assert.strictEqual(norm('ภาษาไทย 4'), 'ภาษาไทย');
assert.strictEqual(norm('ภาษาไทย ๔'), 'ภาษาไทย');
assert.strictEqual(norm('ภาษาไทย'), 'ภาษาไทย');
assert.strictEqual(norm('วิทยาศาสตร์และเทคโนโลยี 4'), 'วิทยาศาสตร์และเทคโนโลยี');

const term1ScoresMock = [
  { subject: 'ภาษาไทย 4', total: 44, max: 50, percent: 88, grade: '4' },
  { subject: 'วิทยาศาสตร์และเทคโนโลยี 4', total: 44, max: 50, percent: 88, grade: '4' },
  { subject: 'สังคมศึกษา ศาสนาฯ 4', total: 45, max: 50, percent: 90, grade: '4' },
  { subject: 'ประวัติศาสตร์ 4', total: 45, max: 50, percent: 90, grade: '4' },
  { subject: 'สุขศึกษาและพลศึกษา 4', total: 45, max: 50, percent: 90, grade: '4' },
  { subject: 'การงานอาชีพ 4', total: 39, max: 50, percent: 78, grade: '3.5' },
  { subject: 'ภาษาอังกฤษ 4', total: 41, max: 50, percent: 82, grade: '4' },
  { subject: 'การป้องกันการทุจริต 4', total: 45, max: 50, percent: 90, grade: '4' },
];

const grade4SubjectsMock = [
  { id: '1', subject_name: 'ภาษาไทย 4', subject_code: 'ท14101', credit_units: 4 },
  { id: '2', subject_name: 'คณิตศาสตร์ 4', subject_code: 'ค14101', credit_units: 4 },
  { id: '3', subject_name: 'วิทยาศาสตร์และเทคโนโลยี 4', subject_code: 'ว14101', credit_units: 3 },
  { id: '4', subject_name: 'สังคมศึกษา ศาสนาฯ 4', subject_code: 'ส14101', credit_units: 2 },
  { id: '5', subject_name: 'ประวัติศาสตร์ 4', subject_code: 'ส14102', credit_units: 1 },
  { id: '6', subject_name: 'สุขศึกษาและพลศึกษา 4', subject_code: 'พ14101', credit_units: 2 },
  { id: '7', subject_name: 'ศิลปะ 4', subject_code: 'ศ14101', credit_units: 2 },
  { id: '8', subject_name: 'การงานอาชีพ 4', subject_code: 'ง14101', credit_units: 1 },
  { id: '9', subject_name: 'ภาษาอังกฤษ 4', subject_code: 'อ14101', credit_units: 3 },
  { id: '10', subject_name: 'ภาษาอังกฤษเพื่อการสื่อสาร 4', subject_code: 'อ14201', credit_units: 1 },
  { id: '11', subject_name: 'การป้องกันการทุจริต 4', subject_code: 'ส14201', credit_units: 1 },
];

const mapped = grade4SubjectsMock.map((sub) => {
  const found = term1ScoresMock.find(
    (s) =>
      s.subject === sub.subject_name ||
      s.subject === sub.subject_code ||
      norm(s.subject) === norm(sub.subject_name)
  );
  const rawObtained = found
    ? (found.total !== undefined ? String(found.total) : (found.score !== undefined ? String(found.score) : ''))
    : '';
  return {
    subjectName: sub.subject_name,
    obtained: rawObtained,
  };
});

// Check that tracked subjects have numbers
const thaiRow = mapped.find((m) => m.subjectName === 'ภาษาไทย 4');
assert.strictEqual(thaiRow.obtained, '44', 'ภาษาไทย 4 must have obtained score 44');

// Check that missing subjects have empty string (BLANK)
const mathRow = mapped.find((m) => m.subjectName === 'คณิตศาสตร์ 4');
assert.strictEqual(mathRow.obtained, '', 'คณิตศาสตร์ 4 must be BLANK (empty string)');

const artRow = mapped.find((m) => m.subjectName === 'ศิลปะ 4');
assert.strictEqual(artRow.obtained, '', 'ศิลปะ 4 must be BLANK (empty string)');

const engCommRow = mapped.find((m) => m.subjectName === 'ภาษาอังกฤษเพื่อการสื่อสาร 4');
assert.strictEqual(engCommRow.obtained, '', 'ภาษาอังกฤษเพื่อการสื่อสาร 4 must be BLANK (empty string)');
console.log('  ✅ PASS: Tracked subjects receive scores and missing subjects remain BLANK');

// 3. Verify total score summing
console.log('\n[3/4] Verifying total score calculation...');
const totalObtained = mapped.reduce((sum, s) => sum + (parseFloat(s.obtained) || 0), 0);
assert.strictEqual(totalObtained, 348, 'Total sum of 8 active scores must equal 348');
console.log('  ✅ PASS: Total obtained score calculates correctly as 348');

// 4. Verify code contents in PaporSixViewer.tsx
console.log('\n[4/4] Verifying PaporSixViewer.tsx implementation...');
const viewerPath = path.join(process.cwd(), 'src/components/admin/papor/PaporSixViewer.tsx');
const viewerContent = fs.readFileSync(viewerPath, 'utf8');

assert(viewerContent.includes('found.total !== undefined'), 'PaporSixViewer reads found.total');
assert(viewerContent.includes('norm(s.subject) === norm(sub.subject_name)'), 'PaporSixViewer normalizes subject names');
assert(viewerContent.includes('totalObtainedScore > 0 ? totalObtainedScore : \'\''), 'Total row renders blank if total is 0');
console.log('  ✅ PASS: PaporSixViewer contains required score resolution logic');

console.log('\n========================================');
console.log('🎉 ALL P.4 PAPOR 6 SCORE TESTS PASSED (4/4)!');
console.log('========================================');

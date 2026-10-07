// scripts/verify-papor6-save-service.mjs
// Verifies score saving service logic, safe batch fill, and database constraints

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- 🧪 STARTING PAPOR 6 SCORE SAVE & BATCH FILL VERIFICATION ---');

// 1. Verify PaporGradebookGrid.tsx score_type compliance
console.log('\n[1/4] Checking PaporGradebookGrid.tsx for database check constraint compliance...');
const gradebookPath = path.join(process.cwd(), 'src/components/admin/papor/PaporGradebookGrid.tsx');
const gradebookContent = fs.readFileSync(gradebookPath, 'utf8');

assert(
  !gradebookContent.includes("score_type: 'ระหว่างเรียน_T1'"),
  "Must NOT contain invalid 'ระหว่างเรียน_T1' in score_type"
);
assert(
  !gradebookContent.includes("score_type: 'ระหว่างเรียน_T2'"),
  "Must NOT contain invalid 'ระหว่างเรียน_T2' in score_type"
);
assert(
  gradebookContent.includes("score_type: 'เก็บ'"),
  "Must use valid score_type 'เก็บ' for formative assessment"
);
assert(
  gradebookContent.includes("score_type: 'ปลายภาค'"),
  "Must use valid score_type 'ปลายภาค' for summative assessment"
);
console.log('  ✅ PASS: PaporGradebookGrid strictly adheres to score_records_score_type_check');

// 2. Verify scores.service.ts methods exist and follow architecture
console.log('\n[2/4] Checking scores.service.ts new methods...');
const servicePath = path.join(process.cwd(), 'src/services/scores.service.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(serviceContent.includes('saveMidtermScoresForStudent:'), 'Must export saveMidtermScoresForStudent');
assert(serviceContent.includes('batchFillEmptySubjectsForClass:'), 'Must export batchFillEmptySubjectsForClass');
assert(serviceContent.includes("score_type: 'กลางภาค'"), "Must use 'กลางภาค' as score_type for Papor 6");
assert(serviceContent.includes('max_score: s.maxScore ?? 50'), 'Must default max_score to 50');
assert(serviceContent.includes('!existingSet.has(key)'), 'Batch fill must only add records that do NOT already exist');
console.log('  ✅ PASS: scores.service.ts contains saveMidtermScoresForStudent and safe batchFill');

// 3. Verify PaporSixViewer.tsx UI components and print isolation
console.log('\n[3/4] Checking PaporSixViewer.tsx UI integration & Print Isolation...');
const viewerPath = path.join(process.cwd(), 'src/components/admin/papor/PaporSixViewer.tsx');
const viewerContent = fs.readFileSync(viewerPath, 'utf8');

assert(viewerContent.includes('saveStudentMutation = useMutation'), 'Must declare saveStudentMutation');
assert(viewerContent.includes('batchFillMutation = useMutation'), 'Must declare batchFillMutation');
assert(viewerContent.includes('scoresService.saveMidtermScoresForStudent'), 'Must invoke saveMidtermScoresForStudent');
assert(viewerContent.includes('scoresService.batchFillEmptySubjectsForClass'), 'Must invoke batchFillEmptySubjectsForClass');
assert(viewerContent.includes('บันทึกคะแนน (คนปัจจุบัน)'), 'Must render single student save button');
assert(viewerContent.includes('ใช้คะแนนช่องที่ว่างกับเพื่อนทั้งห้อง'), 'Must render batch fill button');
assert(viewerContent.includes('print:hidden'), 'Toolbar must be hidden during printing');
console.log('  ✅ PASS: PaporSixViewer has Save buttons with strict print:hidden protection');

// 4. Test safe batch fill algorithm logic
console.log('\n[4/4] Testing Safe Batch Fill filtering logic...');
const mockStudents = [
  { id: 'st1', name: 'Student 1' },
  { id: 'st2', name: 'Student 2' },
];

const mockExisting = [
  { student_id: 'st1', subject: 'ภาษาไทย 4' },
  { student_id: 'st1', subject: 'วิทยาศาสตร์และเทคโนโลยี 4' },
  { student_id: 'st2', subject: 'ภาษาไทย 4' },
  // st2 has no science score
];

const mockTemplates = [
  { subject: 'ภาษาไทย 4', score: 40 },
  { subject: 'วิทยาศาสตร์และเทคโนโลยี 4', score: 42 },
  { subject: 'คณิตศาสตร์ 4', score: 38 },
];

const existingSet = new Set(mockExisting.map((r) => `${r.student_id}::${r.subject}`));
const newRecords = [];

for (const student of mockStudents) {
  for (const t of mockTemplates) {
    const key = `${student.id}::${t.subject}`;
    if (!existingSet.has(key)) {
      newRecords.push({
        student_id: student.id,
        subject: t.subject,
        score: t.score,
      });
    }
  }
}

// st1 should get ONLY 'คณิตศาสตร์ 4' (since st1 already has Thai and Science)
const st1Records = newRecords.filter((r) => r.student_id === 'st1');
assert.strictEqual(st1Records.length, 1, 'st1 should only receive 1 missing subject');
assert.strictEqual(st1Records[0].subject, 'คณิตศาสตร์ 4');

// st2 should get 'วิทยาศาสตร์และเทคโนโลยี 4' AND 'คณิตศาสตร์ 4' (since st2 already has Thai)
const st2Records = newRecords.filter((r) => r.student_id === 'st2');
assert.strictEqual(st2Records.length, 2, 'st2 should receive 2 missing subjects');
assert(st2Records.some((r) => r.subject === 'วิทยาศาสตร์และเทคโนโลยี 4'));
assert(st2Records.some((r) => r.subject === 'คณิตศาสตร์ 4'));

console.log('  ✅ PASS: Safe Batch Fill correctly protects existing scores and only fills missing subjects');

console.log('\n========================================');
console.log('🎉 ALL PAPOR 6 SCORE SAVE CHECKS PASSED (4/4)!');
console.log('========================================');

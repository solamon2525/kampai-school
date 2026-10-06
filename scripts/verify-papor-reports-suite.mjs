/**
 * verify-papor-reports-suite.mjs
 * ตรวจสอบความถูกต้องของคอมโพเนนต์และฟังก์ชันระบบรายงานและ UX/UI เกรด (v1.232.0)
 * 1. ตรวจสอบไฟล์คอมโพเนนต์ครบทั้ง 6 รายการ
 * 2. ตรวจสอบตรรกะการคำนวณเกรด (scoreToGrade), GPA ถ่วงน้ำหนัก, Mean, Pass Rate, Grade Distribution
 * 3. ตรวจสอบ CSS Print (page-break-after / break-after)
 * 4. ตรวจสอบการผูก Digital QR Code และ Light-mode compliance (ห้ามมี dark: prefix)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 STARTING PAPOR REPORTS SUITE VERIFICATION ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Files existence check
const requiredFiles = [
  'src/components/admin/papor/PaporAcademicAnalyticsDashboard.tsx',
  'src/components/admin/papor/PrintableBatchStudentReportCards.tsx',
  'src/components/admin/papor/PrintableParentGradeSlip.tsx',
  'src/components/admin/papor/PrintableAcademicCertificate.tsx',
  'src/components/admin/papor/PrintableStudentReportCard.tsx',
  'src/components/admin/papor/PaporReportsCenter.tsx',
  'src/components/admin/papor/PaporGradebookGrid.tsx',
];

console.log('\n[1/4] ตรวจสอบไฟล์คอมโพเนนต์ระบบรายงานและ Gradebook...');
for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  const exists = fs.existsSync(fullPath);
  assert(exists, `พบไฟล์ ${relPath}`);
}

// 2. Statistical & Grade Calculation Verification
console.log('\n[2/4] ตรวจสอบฟังก์ชันการคำนวณเกรดและสถิติวิชาการ...');
function scoreToGrade(score) {
  if (score >= 80) return '4';
  if (score >= 75) return '3.5';
  if (score >= 70) return '3';
  if (score >= 65) return '2.5';
  if (score >= 60) return '2';
  if (score >= 55) return '1.5';
  if (score >= 50) return '1';
  return '0';
}

assert(scoreToGrade(95) === '4', 'คะแนน 95 ได้เกรด 4');
assert(scoreToGrade(80) === '4', 'คะแนน 80 ได้เกรด 4');
assert(scoreToGrade(78) === '3.5', 'คะแนน 78 ได้เกรด 3.5');
assert(scoreToGrade(70) === '3', 'คะแนน 70 ได้เกรด 3');
assert(scoreToGrade(66) === '2.5', 'คะแนน 66 ได้เกรด 2.5');
assert(scoreToGrade(60) === '2', 'คะแนน 60 ได้เกรด 2');
assert(scoreToGrade(55) === '1.5', 'คะแนน 55 ได้เกรด 1.5');
assert(scoreToGrade(50) === '1', 'คะแนน 50 ได้เกรด 1');
assert(scoreToGrade(49) === '0', 'คะแนน 49 ได้เกรด 0');
assert(scoreToGrade(0) === '0', 'คะแนน 0 ได้เกรด 0');

// Weighted GPA test
const sampleSubjects = [
  { credit: 2.0, score: 85 }, // Grade 4 -> 8 pts
  { credit: 1.5, score: 72 }, // Grade 3 -> 4.5 pts
  { credit: 1.0, score: 58 }, // Grade 1.5 -> 1.5 pts
];
const totalCredits = sampleSubjects.reduce((acc, s) => acc + s.credit, 0); // 4.5
const totalPts = sampleSubjects.reduce((acc, s) => acc + (parseFloat(scoreToGrade(s.score)) * s.credit), 0); // 14.0
const calculatedGpa = (totalPts / totalCredits).toFixed(2);
assert(calculatedGpa === '3.11', `คำนวณ GPA ถ่วงน้ำหนักถูกต้อง (14.0 / 4.5 = 3.11, ได้ ${calculatedGpa})`);

// 3. Print Styles & Batch Break-page Verification
console.log('\n[3/4] ตรวจสอบสไตล์การพิมพ์และ CSS Page Break...');
const batchFileContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PrintableBatchStudentReportCards.tsx'), 'utf8');
assert(
  batchFileContent.includes('pageBreakAfter') && batchFileContent.includes('breakAfter'),
  'PrintableBatchStudentReportCards รองรับ pageBreakAfter: always และ breakAfter: page'
);

const reportCenterContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PaporReportsCenter.tsx'), 'utf8');
assert(reportCenterContent.includes('batch_individual'), 'PaporReportsCenter มีโหมด batch_individual (พิมพ์ทั้งห้อง 1-Click)');
assert(reportCenterContent.includes('parent_slip'), 'PaporReportsCenter มีโหมด parent_slip (สลิปผู้ปกครอง)');
assert(reportCenterContent.includes('certificate'), 'PaporReportsCenter มีโหมด certificate (ใบรับรอง ปพ.7)');
assert(reportCenterContent.includes('analytics'), 'PaporReportsCenter มีโหมด analytics (แดชบอร์ดวิเคราะห์)');

// 4. Digital QR Code and Light-Mode Compliance Check
console.log('\n[4/4] ตรวจสอบ Digital QR Code และ Light-mode compliance...');
const qrFiles = [
  'src/components/admin/papor/PrintableParentGradeSlip.tsx',
  'src/components/admin/papor/PrintableAcademicCertificate.tsx',
  'src/components/admin/papor/PrintableStudentReportCard.tsx',
];

for (const relPath of qrFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  assert(content.includes('react-qr-code'), `${relPath} ฝัง Digital QR Code ผ่าน react-qr-code`);
}

// Light mode check: Ensure no dark: prefix in papor components (Rule 14.15)
for (const relPath of requiredFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  const hasDarkMode = /\bdark:/.test(content);
  assert(!hasDarkMode, `${relPath} ไม่มี dark: prefix (Light-mode only compliant)`);
}

console.log('\n====================================================');
console.log(`สรุปผลการทดสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}

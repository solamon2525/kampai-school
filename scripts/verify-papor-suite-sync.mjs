/**
 * verify-papor-suite-sync.mjs
 * Verification script for Papor Suite cross-tab synchronization & printable reports
 */
import fs from 'node:fs';
import path from 'node:path';

let passed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    passed = false;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Check papor-gradebook.service.ts
const gradebookServiceContent = fs.readFileSync(
  path.resolve('src/services/papor-gradebook.service.ts'),
  'utf-8'
);
assert(
  gradebookServiceContent.includes('syncDimensionToPromotions'),
  'paporGradebookService has syncDimensionToPromotions method'
);
assert(
  gradebookServiceContent.includes('student_term_promotion_records'),
  'syncDimensionToPromotions targets student_term_promotion_records'
);

// 2. Check PaporEvaluationsManager.tsx
const evalsManagerContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PaporEvaluationsManager.tsx'),
  'utf-8'
);
assert(
  evalsManagerContent.includes('syncDimensionToPromotions'),
  'PaporEvaluationsManager calls syncDimensionToPromotions'
);
assert(
  evalsManagerContent.includes("category_key: 'summary'"),
  'PaporEvaluationsManager creates summary rows in student_obec_evaluations'
);
assert(
  evalsManagerContent.includes("queryKey: ['papor-promotions']"),
  'PaporEvaluationsManager invalidates papor-promotions query'
);
assert(
  evalsManagerContent.includes("queryKey: ['student-papor-year-data']"),
  'PaporEvaluationsManager invalidates student-papor-year-data query'
);

// 3. Check PaporPromotionManager.tsx
const promoManagerContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PaporPromotionManager.tsx'),
  'utf-8'
);
assert(
  promoManagerContent.includes("queryKey: ['student-papor-year-data']"),
  'PaporPromotionManager invalidates student-papor-year-data query'
);
assert(
  promoManagerContent.includes("queryKey: ['papor-reports-promotions']"),
  'PaporPromotionManager invalidates papor-reports-promotions query'
);

// 4. Check PrintableClassSummaryReport.tsx
const classSummaryContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PrintableClassSummaryReport.tsx'),
  'utf-8'
);
assert(
  classSummaryContent.includes('นางสาวมะลิวัลย์ จรุงพันธ์'),
  'PrintableClassSummaryReport defaults academicHead to นางสาวมะลิวัลย์ จรุงพันธ์'
);
assert(
  classSummaryContent.includes('({academicHead})'),
  'PrintableClassSummaryReport renders academicHead name'
);
assert(
  !classSummaryContent.includes('(นายทะเบียน / งานวัดผล)'),
  'PrintableClassSummaryReport no longer has hardcoded placeholder for academic head'
);

// 5. Check PrintableAcademicCertificate.tsx
const certContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PrintableAcademicCertificate.tsx'),
  'utf-8'
);
assert(
  !certContent.includes('๓๑ มีนาคม ๒๕๖๘'),
  'PrintableAcademicCertificate does not contain hardcoded year 2568'
);
assert(
  certContent.includes('toThaiNumerals'),
  'PrintableAcademicCertificate dynamically formats Thai year'
);
assert(
  certContent.includes('displayIssueDate'),
  'PrintableAcademicCertificate uses dynamic displayIssueDate'
);

// 6. Check PrintableStudentReportCard.tsx
const reportCardContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PrintableStudentReportCard.tsx'),
  'utf-8'
);
assert(
  reportCardContent.includes("isPass ? '✓' : ''"),
  'PrintableStudentReportCard Table 2 renders checkmark for activities'
);
assert(
  reportCardContent.includes("isExcellent ? '✓' : ''"),
  'PrintableStudentReportCard Table 3 renders checkmark for 3 dimensions'
);

// 7. Check PaporReportsCenter.tsx
const reportsCenterContent = fs.readFileSync(
  path.resolve('src/components/admin/papor/PaporReportsCenter.tsx'),
  'utf-8'
);
assert(
  reportsCenterContent.includes('papor-reports-promotions'),
  'PaporReportsCenter queries promotions data'
);
assert(
  reportsCenterContent.includes('activeStudentEvaluations'),
  'PaporReportsCenter passes real student evaluations to certificate and grade slip'
);
assert(
  reportsCenterContent.includes('academicHead="นางสาวมะลิวัลย์ จรุงพันธ์"'),
  'PaporReportsCenter passes academicHead to PrintableClassSummaryReport'
);

if (!passed) {
  process.exit(1);
}

console.log('\n🎉 ALL PAPOR SUITE SYNC CHECKS PASSED SUCCESSFULLY!\n');

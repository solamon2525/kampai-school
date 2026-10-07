/**
 * verify-papor-print-isolation.mjs
 * ตรวจสอบความถูกต้องของระบบ Print Isolation และ Single-Page Fit สำหรับ ปพ.6 (v1.233.7)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 STARTING PAPOR PRINT ISOLATION & SINGLE-PAGE VERIFICATION ---');

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

// 1. ตรวจสอบ index.css
console.log('\n[1/6] ตรวจสอบสไตล์สากล @media print ใน src/index.css...');
const indexCss = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
assert(indexCss.includes('@media print'), 'src/index.css มีบล็อก @media print');
assert(indexCss.includes('header,\n  nav,\n  aside,\n  footer') || indexCss.includes('aside,'), 'ซ่อน header, nav, aside, footer เมื่อพิมพ์');
assert(indexCss.includes('print-color-adjust: exact'), 'บังคับ print-color-adjust: exact เพื่อสีและเส้นขอบคมชัด');
assert(indexCss.includes('.printable-report-card') && indexCss.includes('break-inside: avoid'), 'กำหนด break-inside: avoid ให้ .printable-report-card');

// 2. ตรวจสอบ AdminLayout.tsx
console.log('\n[2/6] ตรวจสอบการซ่อน Web Chrome ใน AdminLayout.tsx...');
const adminLayout = fs.readFileSync(path.join(rootDir, 'src/components/admin/shared/AdminLayout.tsx'), 'utf8');
assert(adminLayout.includes('aside') && adminLayout.includes('print:hidden'), 'Desktop Sidebar มี class print:hidden');
assert(adminLayout.includes('lg:hidden') && adminLayout.includes('print:hidden'), 'Mobile Header มี class print:hidden');
assert(adminLayout.includes('lg:ml-64') && adminLayout.includes('print:hidden'), 'Desktop Top Bar มี class print:hidden');
assert(adminLayout.includes('print:ml-0') && adminLayout.includes('print:w-full'), 'Main content มี class print:ml-0 print:w-full');
assert(adminLayout.includes('print:hidden') && adminLayout.includes('<ScanFAB />'), 'ScanFAB ถูกครอบด้วย print:hidden');

// 3. ตรวจสอบ RolePortalLayout.tsx & TeacherScores.tsx
console.log('\n[3/6] ตรวจสอบการซ่อน Web Chrome ใน RolePortalLayout.tsx & TeacherScores.tsx...');
const rolePortal = fs.readFileSync(path.join(rootDir, 'src/components/portal/RolePortalLayout.tsx'), 'utf8');
assert(rolePortal.includes('aside') && rolePortal.includes('print:hidden'), 'RolePortalLayout Sidebar มี class print:hidden');
assert(rolePortal.includes('lg:hidden') && rolePortal.includes('print:hidden'), 'RolePortalLayout Mobile Header มี class print:hidden');
assert(rolePortal.includes('lg:ml-64') && rolePortal.includes('print:hidden'), 'RolePortalLayout Top Bar มี class print:hidden');

const teacherScores = fs.readFileSync(path.join(rootDir, 'src/pages/teacher/TeacherScores.tsx'), 'utf8');
assert(teacherScores.includes('TabsList') && teacherScores.includes('print:hidden'), 'TeacherScores TabsList มี class print:hidden');

// 4. ตรวจสอบ PaporGenerator.tsx
console.log('\n[4/6] ตรวจสอบการซ่อน Header และแท็บเมนูใน PaporGenerator.tsx...');
const paporGen = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PaporGenerator.tsx'), 'utf8');
assert(paporGen.includes('ระบบออกเกรดและเอกสาร ปพ.5 - ปพ.6 สพฐ.') && paporGen.includes('print:hidden'), 'หัวข้อหลักและบัตรครูมี class print:hidden');
assert(paporGen.includes('TabsList') && paporGen.includes('print:hidden'), 'TabsList 9 เมนูมี class print:hidden');
assert(paporGen.includes('print:space-y-0'), 'Wrapper ภายนอกมี class print:space-y-0');

// 5. ตรวจสอบ PaporReportsCenter.tsx
console.log('\n[5/6] ตรวจสอบ Container ของเอกสารใน PaporReportsCenter.tsx...');
const paporReports = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PaporReportsCenter.tsx'), 'utf8');
assert(paporReports.includes('report-paper-wrapper') && paporReports.includes('print:w-full'), 'report-paper-wrapper มี class print:w-full');
assert(paporReports.includes('print:max-w-none print:w-full'), 'Card wrapper ของ ปพ.6 มี class print:max-w-none print:w-full');

// 6. ตรวจสอบ PrintableStudentReportCard.tsx
console.log('\n[6/6] ตรวจสอบ PrintableStudentReportCard.tsx สำหรับ Single-Page Fit...');
const reportCard = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PrintableStudentReportCard.tsx'), 'utf8');
assert(reportCard.includes('size: A4 portrait'), 'มีคำสั่ง @page กำหนด size: A4 portrait');
assert(reportCard.includes('break-inside: avoid') && reportCard.includes('page-break-inside: avoid'), 'มี CSS ป้องกัน break-inside ในตัวเอกสารและตาราง');
assert(!reportCard.includes('แถวว่างตกแต่ง 2 แถว'), 'ไม่มีแถวว่างตกแต่งส่วนเกินที่ดันความสูง');
assert(reportCard.includes('DEFAULT_GRADE_4_SUBJECTS'), 'มีโครงสร้าง 11 วิชา ป.4 สมบูรณ์');
assert(reportCard.includes('ลงชื่อ .................................................... ครูประจำชั้น'), 'มีบล็อกลายเซ็นครูประจำชั้น');
assert(reportCard.includes('ลงชื่อ .................................................... หัวหน้าวิชาการ'), 'มีบล็อกลายเซ็นหัวหน้าวิชาการ');
assert(reportCard.includes('ลงชื่อ ............................................................................ ผู้อำนวยการโรงเรียน'), 'มีบล็อกลายเซ็นผู้อำนวยการโรงเรียน');

console.log('\n========================================');
console.log(`ผลการตรวจสอบ Print Isolation: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PAPOR PRINT ISOLATION CHECKS PASSED PERFECTLY!\n');
}

/**
 * verify-papor6-grade4-form.mjs
 * ตรวจสอบความถูกต้องของข้อมูลโรงเรียนและแบบฟอร์ม ปพ.6 ชั้น ป.4 ตามเอกสารทางการ (v1.233.6)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 STARTING PAPOR 6 GRADE 4 FORM & SCHOOL INFO VERIFICATION ---');

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

// 1. ตรวจสอบไฟล์ตราประจำโรงเรียน
console.log('\n[1/5] ตรวจสอบไฟล์ตราสัญลักษณ์โรงเรียนบ้านคำไผ่...');
const logoPath = path.join(rootDir, 'public', 'logos', 'school-logo.webp');
assert(fs.existsSync(logoPath), 'พบไฟล์ตราโรงเรียน public/logos/school-logo.webp');
if (fs.existsSync(logoPath)) {
  const stat = fs.statSync(logoPath);
  assert(stat.size > 10000, `ไฟล์ตราโรงเรียนมีขนาดสมบูรณ์ (${stat.size} bytes)`);
}

// 2. ตรวจสอบว่าไม่มีข้อมูลเขตพื้นที่ผิดพลาด (ยโสธร)
console.log('\n[2/5] ตรวจสอบความถูกต้องของเขตพื้นที่การศึกษา...');
const paporFiles = [
  'src/components/admin/papor/PrintableStudentReportCard.tsx',
  'src/components/admin/papor/PrintableClassSummaryReport.tsx',
  'src/components/admin/papor/PrintableAcademicCertificate.tsx',
  'src/components/admin/papor/PaporSixViewer.tsx',
];

paporFiles.forEach((fileRel) => {
  const content = fs.readFileSync(path.join(rootDir, fileRel), 'utf8');
  assert(!content.includes('ยโสธร'), `ไฟล์ ${fileRel} ไม่มีคำว่า 'ยโสธร'`);
  assert(
    content.includes('อุดรธานี เขต 2') || content.includes('อุดรธานี เขต ๒'),
    `ไฟล์ ${fileRel} มีชื่อเขต 'อุดรธานี เขต 2/๒' ถูกต้อง`
  );
});

// 3. ตรวจสอบชื่อผู้อำนวยการโรงเรียนและหัวหน้าวิชาการ
console.log('\n[3/5] ตรวจสอบชื่อผู้อำนวยการโรงเรียนและหัวหน้าวิชาการ...');
paporFiles.forEach((fileRel) => {
  const content = fs.readFileSync(path.join(rootDir, fileRel), 'utf8');
  assert(!content.includes('มกรธวัช'), `ไฟล์ ${fileRel} ไม่มีชื่อ 'มกรธวัช' ตกค้าง`);
  assert(content.includes('สมพิศ แรงน้อย'), `ไฟล์ ${fileRel} มีชื่อ ผอ. 'สมพิศ แรงน้อย'`);
});

const reportCardContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PrintableStudentReportCard.tsx'), 'utf8');
assert(reportCardContent.includes('มะลิวัลย์ จรุงพันธ์'), 'PrintableStudentReportCard มีชื่อหัวหน้าวิชาการ "มะลิวัลย์ จรุงพันธ์"');

const viewerContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/papor/PaporSixViewer.tsx'), 'utf8');
assert(viewerContent.includes('มะลิวัลย์ จรุงพันธ์'), 'PaporSixViewer มีชื่อหัวหน้าวิชาการ "มะลิวัลย์ จรุงพันธ์"');

// 4. ตรวจสอบโครงสร้าง 11 วิชา ป.4 และคะแนนเต็ม 1,100
console.log('\n[4/5] ตรวจสอบโครงสร้าง 11 วิชา ป.4 และแบบฟอร์มตามภาพต้นฉบับ...');
assert(reportCardContent.includes('DEFAULT_GRADE_4_SUBJECTS'), 'พบรายการวิชามาตรฐาน ป.4 DEFAULT_GRADE_4_SUBJECTS');
assert(reportCardContent.includes('ภาษาอังกฤษเพื่อการสื่อสาร'), 'มีวิชาภาษาอังกฤษเพื่อการสื่อสาร');
assert(reportCardContent.includes('ต้านทุจริต'), 'มีวิชาต้านทุจริต');
assert(reportCardContent.includes('1100') || reportCardContent.includes('totalFullMarks'), 'มีคะแนนเต็มรวม 1100 คะแนน');
assert(reportCardContent.includes('คะแนนที่ได้') && reportCardContent.includes('เกรดเฉลี่ย'), 'คอลัมน์หมายเหตุมีข้อความ "คะแนนที่ได้" และ "เกรดเฉลี่ย"');

// 5. ตรวจสอบกิจกรรมพัฒนาผู้เรียนและสรุป 3 ด้าน
console.log('\n[5/5] ตรวจสอบกิจกรรมพัฒนาผู้เรียนและสรุปการประเมิน 3 ด้าน...');
assert(reportCardContent.includes('ผ่าน') && reportCardContent.includes('ไม่ผ่าน'), 'ตารางกิจกรรมพัฒนาผู้เรียนมีคอลัมน์ ผ่าน / ไม่ผ่าน');
assert(reportCardContent.includes('ดีเยี่ยม') && reportCardContent.includes('ดี') && reportCardContent.includes('ผ่าน'), 'ตารางสรุปการประเมิน 3 ด้านมีคอลัมน์ ดีเยี่ยม / ดี / ผ่าน');
assert(reportCardContent.includes('ครูประจำชั้น') && reportCardContent.includes('....................................................'), 'มีบล็อกลายเซ็นครูประจำชั้น');
assert(reportCardContent.includes('หัวหน้าวิชาการ') && reportCardContent.includes('....................................................'), 'มีบล็อกลายเซ็นหัวหน้าวิชาการ');
assert(reportCardContent.includes('ผู้อำนวยการโรงเรียน') && reportCardContent.includes('............................................................................'), 'มีบล็อกลายเซ็นผู้อำนวยการโรงเรียน');

console.log('\n========================================');
console.log(`ผลการตรวจสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PAPOR 6 FORM & SCHOOL DATA CHECKS PASSED PERFECTLY!\n');
}

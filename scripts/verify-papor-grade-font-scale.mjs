/**
 * verify-papor-grade-font-scale.mjs
 * ตรวจสอบความถูกต้องของระบบปรับขนาดฟอนต์ตามสัดส่วน (Proportional Font Scaling)
 * สำหรับ ปพ.6 หน้า ๖ (รายงานผลการเรียนรายบุคคล - renderGradeReportPage)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Papor Page 6 Grade Font Scale Verification...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

const viewerPath = path.join(rootDir, 'src/components/admin/papor/PaporSixViewer.tsx');
const viewerContent = fs.readFileSync(viewerPath, 'utf8');

console.log('Test 1: ตรวจสอบการนำเข้า Icons และ State การจัดขนาดฟอนต์...');
assert(
  viewerContent.includes("Type,") &&
  viewerContent.includes("ZoomIn,") &&
  viewerContent.includes("ZoomOut,"),
  'นำเข้าไอคอน Type, ZoomIn, ZoomOut จาก lucide-react ครบถ้วน'
);

assert(
  viewerContent.includes("const [gradeFontScale, setGradeFontScale] = useState<number>(() => {") &&
  viewerContent.includes("localStorage.getItem('papor_grade_font_scale')") &&
  viewerContent.includes("return 115;"),
  'มี State gradeFontScale พร้อมค่าเริ่มต้นเป็น 115% และเชื่อมต่อ localStorage papor_grade_font_scale'
);

// สกัดฟังก์ชัน renderGradeReportPage
const startIdx = viewerContent.indexOf('function renderGradeReportPage()');
const endIdx = viewerContent.indexOf('function renderActivitiesPage()');
const page6Content = viewerContent.substring(startIdx, endIdx);

console.log('\nTest 2: ตรวจสอบ Toolbar ปรับขนาดฟอนต์บนหน้าจอ...');
assert(
  page6Content.includes('print:hidden') &&
  page6Content.includes('ขนาดตัวอักษร ปพ.6:'),
  'มี Toolbar ปรับขนาดฟอนต์แบบซ่อนตอนพิมพ์ (print:hidden)'
);

assert(
  page6Content.includes('กะทัดรัด (100%)') &&
  page6Content.includes('⭐ มาตรฐาน (115% ค่ากลาง)') &&
  page6Content.includes('ขยายใหญ่ (125%)') &&
  page6Content.includes('ใหญ่พิเศษ (135%)'),
  'มีปุ่ม Preset ครบ 4 ระดับ (100%, 115%, 125%, 135%)'
);

assert(
  page6Content.includes('gradeFontScale <= 90') &&
  page6Content.includes('gradeFontScale >= 140') &&
  page6Content.includes('handleSetGradeFontScale(gradeFontScale - 5)') &&
  page6Content.includes('handleSetGradeFontScale(gradeFontScale + 5)'),
  'มีปุ่ม Stepper ย่อ/ขยายทีละ 5% (A- / A+) พร้อมขอบเขตปลอดภัย 90% - 140%'
);

assert(
  page6Content.includes('คืนค่ากลาง (115%)') &&
  page6Content.includes('handleSetGradeFontScale(115)'),
  'มีปุ่มลัดสำหรับคืนค่ากลาง 115% ทันที'
);

console.log('\nTest 3: ตรวจสอบสูตรคำนวณสัดส่วน (scaleRatio) ในตารางและการแสดงผล...');
assert(
  page6Content.includes('const scaleRatio = gradeFontScale / 100;'),
  'คำนวณตัวคูณสัดส่วน scaleRatio = gradeFontScale / 100 ถูกต้อง'
);

assert(
  page6Content.includes('fontSize: `${11 * scaleRatio}px`') &&
  page6Content.includes('height: `${23 * scaleRatio}px`'),
  'ตารางสาระการเรียนรู้หลักมีการปรับขนาดตัวอักษรและความสูงแถวตาม scaleRatio'
);

assert(
  page6Content.includes('fontSize: `${10.5 * scaleRatio}px`') &&
  page6Content.includes('height: `${21 * scaleRatio}px`'),
  'ตารางกิจกรรมพัฒนาผู้เรียนและตารางประเมิน 3 ด้านมีการปรับขนาดตัวอักษรและความสูงตาม scaleRatio'
);

assert(
  page6Content.includes('fontSize: `${13 * scaleRatio}px`'),
  'เครื่องหมายถูก ✓ และผลประเมินถูกปรับขนาดตาม scaleRatio คมชัด ไม่แตก'
);

assert(
  page6Content.includes('fontSize: `${11.5 * scaleRatio}px`') &&
  page6Content.includes('fontSize: `${11 * scaleRatio}px`'),
  'ส่วนลงชื่อ 3 ตำแหน่งท้ายหน้าปรับขนาดตัวอักษรและระยะห่างตาม scaleRatio'
);

console.log('\n========================================');
console.log(`ผลการตรวจสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PAGE 6 GRADE FONT SCALE CHECKS PASSED!\n');
}

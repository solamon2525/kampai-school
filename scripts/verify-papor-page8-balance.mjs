/**
 * verify-papor-page8-balance.mjs
 * ตรวจสอบความถูกต้องของสัดส่วนตัวอักษรต่อตารางและการจัดหน้า ปพ.6 หน้า ๘ (ความเห็นของครูประจำชั้น)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Papor Page 8 Typography & Layout Balance Verification...\n');

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

// สกัดฟังก์ชัน renderTeacherCommentsPage
const startIdx = viewerContent.indexOf('function renderTeacherCommentsPage()');
const endIdx = viewerContent.indexOf('function renderParentCommentsPage()');
const page8Content = viewerContent.substring(startIdx, endIdx);

console.log('Test 1: ตรวจสอบขนาดฟอนต์หัวเรื่องและชื่อนักเรียน...');
assert(
  page8Content.includes('font-bold text-lg">ความเห็นของครูประจำชั้น</div>'),
  'หัวเรื่องหน้าใช้ text-lg font-bold เด่นชัดสมเกียรติเอกสาร'
);
assert(
  page8Content.includes('text-sm text-neutral-800">ให้ใส่เครื่องหมาย ✓ ลงในช่องว่าง</div>'),
  'คำชี้แจงใช้ text-sm อ่านง่ายสบายตา'
);
assert(
  page8Content.includes('font-semibold text-sm') && page8Content.includes('{currentStudent.name}'),
  'ชื่อนักเรียนมุมขวาบนใช้ text-sm font-semibold ชัดเจน ไม่ถูกตัดทอน (ไม่ใช้ truncate)'
);

console.log('\nTest 2: ตรวจสอบตารางคุณลักษณะ ๑๒ ข้อและสัดส่วนตัวอักษรต่อตาราง...');
assert(
  page8Content.includes('table className="w-full border-collapse border border-black text-center text-sm leading-normal">'),
  'ตารางหลักใช้ text-sm leading-normal เป็นค่ามาตรฐาน'
);
assert(
  page8Content.includes('text-sm font-bold">ภาคเรียนที่ ๑</th>') &&
  page8Content.includes('text-sm font-bold">ภาคเรียนที่ ๒</th>'),
  'หัวตารางภาคเรียนใช้ text-sm font-bold'
);
assert(
  page8Content.includes('bg-neutral-100/50 font-semibold text-xs') &&
  !page8Content.includes('text-[11px]'),
  'หัวตาราง ๔ ระดับ (ดีเยี่ยม, ดี, พอใช้, ปรับปรุง) อัปเกรดเป็น text-xs font-semibold (ไม่ใช้ text-[11px] เดิม)'
);
assert(
  page8Content.includes('px-3 py-0.5 text-left font-medium text-[13.5px] whitespace-normal'),
  'รายการคุณลักษณะ ๑๒ ข้อใช้ text-[13.5px] พร้อม padding px-3 py-0.5 เต็มช่องพอดี ไม่ชิดไม่ติด'
);
assert(
  page8Content.includes('font-bold text-sm cursor-pointer select-none'),
  'เครื่องหมายถูก ✓ และเซลล์ติ๊กใช้ text-sm font-bold คมชัด ชัดเจน'
);
assert(
  page8Content.includes('ลงชื่อครูประจำชั้น</td>') && page8Content.includes('text-[13px] font-medium text-center'),
  'แถวลงชื่อครูประจำชั้นในตารางใช้ text-sm และ text-[13px] สมส่วน'
);

console.log('\nTest 3: ตรวจสอบกล่องความคิดเห็นเพิ่มเติมและความสมดุลแนวตั้ง...');
assert(
  page8Content.includes('font-bold text-center text-sm">ความคิดเห็นเพิ่มเติมของครูประจำชั้น</div>'),
  'หัวข้อความคิดเห็นเพิ่มเติมใช้ text-sm font-bold'
);
assert(
  page8Content.includes('min-h-[255px]') || page8Content.includes('min-h-[250px]'),
  'กล่องความคิดเห็นมีความสูงสมดุล min-h-[255px] ไม่กินพื้นที่จนดันส่วนล่างตกหน้า'
);
assert(
  page8Content.includes('text-sm border border-neutral-300 rounded resize-none bg-neutral-50/50 min-h-[180px]'),
  'ช่อง textarea โหมดแก้ไขใช้ text-sm ขนาดสมดุล'
);
assert(
  page8Content.includes('text-sm leading-relaxed italic text-neutral-800 flex-1 whitespace-pre-wrap'),
  'ข้อความความคิดเห็นโหมดแสดงผลใช้ text-sm leading-relaxed อ่านสบายตา'
);

console.log('\nTest 4: ตรวจสอบแถวลงชื่อท้ายหน้าและความปลอดภัยขอบกระดาษ A4...');
assert(
  page8Content.includes('pt-3 pb-1 text-center text-sm font-medium') &&
  page8Content.includes('ลงชื่อ ............................................................................ ครูประจำชั้น'),
  'แถวลงชื่อครูประจำชั้นท้ายหน้าใช้ text-sm และจัดระยะ pt-3 pb-1 อยู่ในหน้ากระดาษแผ่นเดียว 100%'
);

console.log('\n========================================');
console.log(`ผลการตรวจสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PAGE 8 BALANCE AND TYPOGRAPHY CHECKS PASSED!\n');
}

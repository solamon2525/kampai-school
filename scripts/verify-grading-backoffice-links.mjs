/**
 * verify-grading-backoffice-links.mjs
 * ตรวจสอบความถูกต้องของลิงก์และจุดเชื่อมโยงระบบตัดเกรด & ปพ.5-6 ในระบบหลังบ้าน (v1.233.1)
 * 1. ตรวจสอบ AdminLayout.tsx: มี papor ในหมวด "ฝ่ายวิชาการ" และไม่มีในหมวด "ระบบ"
 * 2. ตรวจสอบ teacher-menu.ts: มีป้าย "ตัดเกรด & ปพ.5/ปพ.6" พร้อมไอคอน FileSpreadsheet
 * 3. ตรวจสอบ quickMenuCatalog.ts: มี papor ใน ADMIN_QUICK_MENU_CATALOG และอัปเดตใน TEACHER_QUICK_MENU_CATALOG
 * 4. ตรวจสอบ registry.ts: ทุก icon ที่ใช้ใน icon: X ต้องถูก import จาก lucide-react ป้องกัน white screen (Rule 14.38)
 * 5. ตรวจสอบ UserRolesManagement.tsx: มี papor ในรายการสิทธิ์วิชาการ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- 🧪 STARTING GRADING BACKOFFICE LINKS VERIFICATION ---');

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

// 1. AdminLayout check
console.log('\n[1/5] ตรวจสอบ AdminLayout.tsx...');
const adminLayoutContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/shared/AdminLayout.tsx'), 'utf8');

const hasAcademicPapor = adminLayoutContent.includes("id: 'papor', label: 'ระบบตัดเกรด & ปพ.5-6', icon: FileSpreadsheet, path: '/admin/dashboard/papor'");
assert(hasAcademicPapor, 'พบเมนู "ระบบตัดเกรด & ปพ.5-6" ในหมวดฝ่ายวิชาการของ AdminLayout');

const hasOldPapor = adminLayoutContent.includes("label: 'ปพ.5 / ปพ.6 (PDF)'");
assert(!hasOldPapor, 'นำเมนูเก่า ปพ.5 / ปพ.6 (PDF) ออกจากหมวดระบบเรียบร้อย');

// 2. teacher-menu check
console.log('\n[2/5] ตรวจสอบ teacher-menu.ts...');
const teacherMenuContent = fs.readFileSync(path.join(rootDir, 'src/pages/teacher/teacher-menu.ts'), 'utf8');

const hasTeacherGradingLabel = teacherMenuContent.includes("label: 'ตัดเกรด & ปพ.5/ปพ.6'");
assert(hasTeacherGradingLabel, 'เมนูครูมีป้าย "ตัดเกรด & ปพ.5/ปพ.6" ชัดเจน');

const hasTeacherSpreadsheetIcon = teacherMenuContent.includes("FileSpreadsheet");
assert(hasTeacherSpreadsheetIcon, 'เมนูครูใช้ไอคอน FileSpreadsheet');

// 3. quickMenuCatalog check
console.log('\n[3/5] ตรวจสอบ quickMenuCatalog.ts...');
const catalogContent = fs.readFileSync(path.join(rootDir, 'src/lib/quickMenuCatalog.ts'), 'utf8');

const hasAdminCatalogPapor = catalogContent.includes("id: 'papor', label: 'ระบบตัดเกรด & ปพ.5-6'");
assert(hasAdminCatalogPapor, 'พบ papor ใน ADMIN_QUICK_MENU_CATALOG หมวดฝ่ายวิชาการ');

const hasTeacherCatalogScores = catalogContent.includes("id: 'scores', label: 'ตัดเกรด & ปพ.5/ปพ.6'");
assert(hasTeacherCatalogScores, 'พบป้าย "ตัดเกรด & ปพ.5/ปพ.6" ใน TEACHER_QUICK_MENU_CATALOG');

// 4. registry.ts check (Rule 14.38 protection)
console.log('\n[4/5] ตรวจสอบ registry.ts (Rule 14.38 ป้องกันหน้าขาว)...');
const registryContent = fs.readFileSync(path.join(rootDir, 'src/lib/commands/registry.ts'), 'utf8');

const iconMatches = [...registryContent.matchAll(/icon:\s*([A-Za-z0-9_]+)/g)].map(m => m[1]);
const uniqueUsedIcons = Array.from(new Set(iconMatches));

// Check imports
const importMatch = registryContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/s);
assert(Boolean(importMatch), 'พบ import จาก lucide-react ใน registry.ts');

if (importMatch) {
  const importedIcons = importMatch[1]
    .split(',')
    .map(s => s.trim().replace(/^type\s+/, '').replace(/\s+as\s+[A-Za-z0-9_]+/, ''))
    .filter(Boolean);

  let allImported = true;
  for (const icon of uniqueUsedIcons) {
    if (icon === 'ImageIcon' && registryContent.includes('Image as ImageIcon')) continue;
    if (icon === 'LucideIcon') continue;
    if (!importedIcons.includes(icon) && !registryContent.includes(`${icon} as`)) {
      assert(false, `ไอคอน ${icon} ถูกใช้ใน registry.ts แต่ไม่ได้ import!`);
      allImported = false;
    }
  }
  if (allImported) {
    assert(true, `ทุกไอคอนที่ใช้งาน (${uniqueUsedIcons.length} ไอคอน รวม FileSpreadsheet) ถูก import ครบถ้วน`);
  }
}

const hasThaiKeywords = registryContent.includes("'เกรด'") && registryContent.includes("'ตัดเกรด'");
assert(hasThaiKeywords, 'มีคีย์เวิร์ดภาษาไทย "เกรด", "ตัดเกรด" ใน Command Palette');

// 5. UserRolesManagement check
console.log('\n[5/5] ตรวจสอบ UserRolesManagement.tsx...');
const userRolesContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/settings/UserRolesManagement.tsx'), 'utf8');
const hasRolePapor = userRolesContent.includes("id: 'papor', label: 'ระบบตัดเกรด & ปพ.5-6'");
assert(hasRolePapor, 'พบตัวเลือกสิทธิ์ papor ใน UserRolesManagement');

console.log(`\n========================================`);
console.log(`ผลการทดสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL BACKOFFICE GRADING LINKS VERIFIED SUCCESSFULLY!\n');
}

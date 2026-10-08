/**
 * verify-papor-audit-fixes.mjs
 * ตรวจสอบความถูกต้องของการแก้ไขช่องโหว่ความปลอดภัย (Security & RLS)
 * และตรรกะความถูกต้องของข้อมูลในระบบ ปพ.5 และ ปพ.6 ออนไลน์
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Papor System Audit & Security Verification...\n');

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

// 1. ตรวจสอบ Migration 579 สำหรับ RLS Security Policies
console.log('Test 1: ตรวจสอบ Migration 579 ปิดช่องโหว่ RLS Database...');
const migrationPath = path.join(rootDir, 'supabase/migrations/579_fix_papor_security_and_rls_policies.sql');
assert(fs.existsSync(migrationPath), 'พบไฟล์ Migration 579_fix_papor_security_and_rls_policies.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');
assert(
  migrationContent.includes('DROP POLICY IF EXISTS "Allow public read obec evaluations"') &&
  migrationContent.includes('DROP POLICY IF EXISTS "Allow teachers and admins manage obec evaluations"') &&
  migrationContent.includes('DROP POLICY IF EXISTS "Allow public read promotion records"') &&
  migrationContent.includes('DROP POLICY IF EXISTS "Allow teachers and admins manage promotion records"'),
  'มีการยกเลิกนโยบาย RLS เดิมที่หละหลวม (OR true และ public read)'
);
assert(
  migrationContent.includes('Staff can read obec evaluations') &&
  migrationContent.includes('Staff can manage obec evaluations') &&
  migrationContent.includes('public.is_admin() OR public.is_teacher()'),
  'มีการสร้างนโยบายความปลอดภัยใหม่โดยจำกัดสิทธิ์เฉพาะแอดมินและครู (is_admin() OR is_teacher())'
);

// 2. ตรวจสอบ ScoresManagement.tsx ว่าไม่มี supabase.from() ตรง
console.log('\nTest 2: ตรวจสอบการปฏิบัติตาม Layered Architecture ใน ScoresManagement.tsx...');
const scoresMgmtPath = path.join(rootDir, 'src/components/admin/scores/ScoresManagement.tsx');
const scoresMgmtContent = fs.readFileSync(scoresMgmtPath, 'utf8');
assert(
  !scoresMgmtContent.includes("from('score_records')"),
  'ไม่มีการเรียก supabase.from("score_records") ตรงใน ScoresManagement.tsx'
);
assert(
  !scoresMgmtContent.includes("import { supabase }"),
  'ลบการ import supabase ตรงออกจากคอมโพเนนต์เรียบร้อย'
);
assert(
  scoresMgmtContent.includes('scoresService.getScoresWithStudents') &&
  scoresMgmtContent.includes('scoresService.getAllScoresWithStudentProfiles'),
  'เรียกใช้งานผ่าน scoresService.getScoresWithStudents และ getAllScoresWithStudentProfiles'
);

// 3. ตรวจสอบ scores.service.ts
console.log('\nTest 3: ตรวจสอบเมธอดใหม่ใน scores.service.ts...');
const scoresServicePath = path.join(rootDir, 'src/services/scores.service.ts');
const scoresServiceContent = fs.readFileSync(scoresServicePath, 'utf8');
assert(
  scoresServiceContent.includes('getScoresWithStudents:') &&
  scoresServiceContent.includes('getAllScoresWithStudentProfiles:'),
  'scores.service.ts มีเมธอด getScoresWithStudents และ getAllScoresWithStudentProfiles รองรับ'
);

// 4. ตรวจสอบ papor-gradebook.service.ts ไม่สร้าง GPA 3.5 หรือ Attendance 94% เท็จ
console.log('\nTest 4: ตรวจสอบ papor-gradebook.service.ts ไม่สร้างข้อมูลวิชาการเท็จ...');
const gradebookServicePath = path.join(rootDir, 'src/services/papor-gradebook.service.ts');
const gradebookServiceContent = fs.readFileSync(gradebookServicePath, 'utf8');
assert(
  !gradebookServiceContent.includes('gpa: prev?.gpa ?? 3.5') &&
  !gradebookServiceContent.includes('attendance_percent: prev?.attendance_percent ?? 94'),
  'ยกเลิกการสร้างค่าเริ่มต้นเท็จ 3.5 GPA และ 94% เข้าเรียนใน syncDimensionToPromotions'
);

// 5. ตรวจสอบ papor-diagnostics.service.ts
console.log('\nTest 5: ตรวจสอบความปลอดภัยในการซ่อมแซมผลการประเมินใน Diagnostics...');
const diagServicePath = path.join(rootDir, 'src/services/papor-diagnostics.service.ts');
const diagServiceContent = fs.readFileSync(diagServicePath, 'utf8');
assert(
  diagServiceContent.includes('evaluatedStudentIds') &&
  diagServiceContent.includes('missingStudents'),
  'repairDefaultEvaluations มีการตรวจสอบและคัดกรองเฉพาะนักเรียนที่ยังไม่มีข้อมูลประเมิน (ไม่เขียนทับคนเดิม)'
);
assert(
  !diagServiceContent.includes('prev.gpa || 3.5') &&
  !diagServiceContent.includes('prev.attendance_percent || 94'),
  'repairDefaultPromotions ไม่บังคับค่าเป็น 3.5 หรือ 94 เมื่อคะแนนจริงเป็น 0'
);

// 6. ตรวจสอบ papor-evaluation.service.ts จับคู่ชื่อด้วย prefix-stripping
console.log('\nTest 6: ตรวจสอบการจับคู่ชื่อนักเรียนในการนำเข้า Excel...');
const evalServicePath = path.join(rootDir, 'src/services/papor-evaluation.service.ts');
const evalServiceContent = fs.readFileSync(evalServicePath, 'utf8');
assert(
  evalServiceContent.includes('เด็กชาย|เด็กหญิง|ด\\.ช\\.|ด\\.ญ\\.|นาย|นางสาว|น\\.ส\\.') &&
  !evalServiceContent.includes('st.fullName.includes(d.name)'),
  'ยกเลิก .includes(d.name) ที่สุ่มเสี่ยง และใช้การตัดคำนำหน้าชื่อเปรียบเทียบอย่างแม่นยำ'
);

// 7. ตรวจสอบ PaporGradebookGrid.tsx สูตรคะแนนและเกรด
console.log('\nTest 7: ตรวจสอบการคำนวณคะแนนรวมและเกรดใน PaporGradebookGrid.tsx...');
const gridPath = path.join(rootDir, 'src/components/admin/papor/PaporGradebookGrid.tsx');
const gridContent = fs.readFileSync(gridPath, 'utf8');
assert(
  gridContent.includes('(t1 > 0 && t2 > 0) ? Math.round((t1 + t2) / 2) : (t1 || t2)'),
  'คำนวณ yearlyTotal อย่างปลอดภัย ไม่นำคะแนนเทอม 1 ไปหาร 2 จนติด 0 เมื่อยังไม่มีคะแนนเทอม 2'
);
assert(
  gridContent.includes("sData['1_เก็บ'] ?? 0") &&
  gridContent.includes("sData['1_กลางภาค'] ?? 0"),
  'รวมคะแนนเก็บและคะแนนกลางภาคเข้าเป็นคะแนนระหว่างเรียนอย่างถูกต้อง'
);

// 8. ตรวจสอบ PaporPromotionManager.tsx & PaporEvaluationsManager.tsx
console.log('\nTest 8: ตรวจสอบการป้องกันการแปลงค่า 0 เป็นค่าเริ่มต้นใน Manager Components...');
const promoMgrPath = path.join(rootDir, 'src/components/admin/papor/PaporPromotionManager.tsx');
const promoMgrContent = fs.readFileSync(promoMgrPath, 'utf8');
assert(
  promoMgrContent.includes('p?.attendance_percent != null ? Number(p.attendance_percent) : 0') &&
  promoMgrContent.includes('p?.gpa != null ? Number(p.gpa) : 0'),
  'PaporPromotionManager ตรวจสอบ nullish ป้องกันคะแนน/เวลาเรียน 0 ถูกยกเป็น 3.5 หรือ 94'
);

const evalMgrPath = path.join(rootDir, 'src/components/admin/papor/PaporEvaluationsManager.tsx');
const evalMgrContent = fs.readFileSync(evalMgrPath, 'utf8');
assert(
  evalMgrContent.includes('const sc = ev.score != null ? Number(ev.score) : 3;'),
  'PaporEvaluationsManager ป้องกันคะแนนประเมิน 0 ถูกแปลงเป็น 3'
);

// 9. ตรวจสอบ PaporSixViewer.tsx น้ำหนัก-ส่วนสูง
console.log('\nTest 9: ตรวจสอบการบันทึกน้ำหนัก-ส่วนสูงใน PaporSixViewer.tsx...');
const viewerPath = path.join(rootDir, 'src/components/admin/papor/PaporSixViewer.tsx');
const viewerContent = fs.readFileSync(viewerPath, 'utf8');
assert(
  viewerContent.includes('t1Growth?.weight_kg ? String(t1Growth.weight_kg) : \'32.0\'') &&
  viewerContent.includes('t1Growth?.height_cm ? String(t1Growth.height_cm) : \'135.0\''),
  'handleSaveGrowth สำรองค่าน้ำหนัก-ส่วนสูงเดิมจากฐานข้อมูลจริง ไม่เขียนทับ 32kg/135cm แบบสุ่มสี่สุ่มห้า'
);
assert(
  viewerContent.includes('maxScore: s.fullMarks || 100'),
  'saveStudentMutation บันทึกคะแนนเต็มตาม fullMarks (100) ไม่จำกัดที่ 50'
);

console.log('\n========================================');
console.log(`ผลการตรวจสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PAPOR AUDIT & SECURITY CHECKS PASSED!\n');
}

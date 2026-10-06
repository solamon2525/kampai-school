/**
 * verify-teacher-class-assignments.mjs
 * ตรวจสอบความถูกต้องของระบบจัดครูประจำชั้นและครูสอนควบชั้น (Teacher-Scoped Homeroom Grading v1.233.0)
 * 1. ตรวจสอบไฟล์คอมโพเนนต์และ Service ที่สร้าง/แก้ไข
 * 2. ตรวจสอบ Light-mode compliance (ห้ามมี dark: prefix) และ PersonAvatar usage
 * 3. ตรวจสอบตาราง teacher_class_assignments ใน Supabase จริง:
 *    - การจัดครูประจำชั้นเดี่ยว (ป.3, ป.4, ป.5, ป.6)
 *    - การจัดครูสอนควบชั้น (ป.1 และ ป.2 มอบหมายให้ครูคนเดียวกัน พร้อม is_multi_grade = true)
 *    - การ JOIN กับตาราง staff ดึง name, position, photo_url ได้อย่างสมบูรณ์
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read environment variables from .env
const envPath = path.join(rootDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- 🧪 STARTING TEACHER CLASS ASSIGNMENTS VERIFICATION ---');

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
console.log('\n[1/4] ตรวจสอบไฟล์คอมโพเนนต์และ Migration...');
const filesToCheck = [
  'supabase/migrations/575_teacher_class_assignments.sql',
  'src/services/teacher-class-assignment.service.ts',
  'src/components/admin/papor/TeacherClassAssignmentManager.tsx',
  'src/components/admin/papor/PaporGenerator.tsx',
  'src/components/admin/papor/PaporReportsCenter.tsx',
];

for (const relPath of filesToCheck) {
  const fullPath = path.join(rootDir, relPath);
  const exists = fs.existsSync(fullPath);
  assert(exists, `พบไฟล์ ${relPath}`);
}

// 2. Light-mode compliance & Rule checks
console.log('\n[2/4] ตรวจสอบ Light-mode compliance (ห้ามมี dark:) และ PersonAvatar...');
const uiFiles = [
  'src/components/admin/papor/TeacherClassAssignmentManager.tsx',
  'src/components/admin/papor/PaporGenerator.tsx',
];

for (const relPath of uiFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  const hasDark = content.includes('dark:');
  assert(!hasDark, `ไฟล์ ${relPath} เป็น Light-mode 100% (ไม่มี dark:)`);

  const hasPersonAvatar = content.includes('PersonAvatar');
  assert(hasPersonAvatar, `ไฟล์ ${relPath} มีการเรียกใช้ <PersonAvatar> ตาม Rule 14.13`);
}

// 3. Database query: Check teacher_class_assignments
console.log('\n[3/4] ตรวจสอบตาราง teacher_class_assignments และข้อมูลใน Supabase...');
async function verifyDatabase() {
  try {
    const { data: assignments, error } = await supabase
      .from('teacher_class_assignments')
      .select(`
        id,
        academic_year,
        class_name,
        teacher_id,
        is_primary_homeroom,
        is_multi_grade,
        notes,
        teacher:staff!teacher_class_assignments_teacher_id_fkey(
          id,
          name,
          position,
          photo_url
        )
      `)
      .eq('academic_year', '2568')
      .order('class_name');

    if (error) {
      assert(false, `ดึงข้อมูลจาก teacher_class_assignments ล้มเหลว: ${error.message}`);
      return;
    }

    assert(assignments && assignments.length >= 6, `พบข้อมูลการจัดชั้นเรียนปี 2568 อย่างน้อย 6 ชั้น (พบ ${assignments.length} รายการ)`);

    // Verify all primary classes ป.1 - ป.6 are covered
    const classes = assignments.map((a) => a.class_name);
    const expected = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
    const allCovered = expected.every((c) => classes.includes(c));
    assert(allCovered, `ครอบคลุมทุกระดับชั้น ป.1 - ป.6 ครบถ้วน: [${classes.join(', ')}]`);

    // Verify Multi-grade teaching (สอนควบชั้น ป.1 และ ป.2)
    const p1 = assignments.find((a) => a.class_name === 'ป.1');
    const p2 = assignments.find((a) => a.class_name === 'ป.2');

    assert(p1 && p2, 'พบข้อมูลห้อง ป.1 และ ป.2');
    if (p1 && p2) {
      assert(
        p1.teacher_id === p2.teacher_id,
        `ป.1 และ ป.2 มอบหมายให้ครูท่านเดียวกัน (teacher_id: ${p1.teacher_id})`
      );
      assert(
        p1.is_multi_grade === true && p2.is_multi_grade === true,
        'ป.1 และ ป.2 มี flag is_multi_grade = true'
      );
      assert(
        p1.teacher?.name === p2.teacher?.name,
        `ชื่อครูผู้สอนตรงกัน: "${p1.teacher?.name}"`
      );
    }

    // Verify staff join fields
    const hasFullStaffInfo = assignments.every(
      (a) => a.teacher && a.teacher.name && a.teacher.position
    );
    assert(hasFullStaffInfo, 'ทุกรายการมอบหมายสามารถ JOIN กับตาราง staff ได้ชื่อและตำแหน่งครบถ้วน');

    // 4. Test Teacher Scope Simulation
    console.log('\n[4/4] จำลองการกรองข้อมูลห้องเรียนสำหรับครูผู้สอน (Teacher Scoping Simulation)...');
    if (p1 && p1.teacher_id) {
      const multiGradeTeacherId = p1.teacher_id;
      const teacherAssigned = assignments
        .filter((a) => a.teacher_id === multiGradeTeacherId)
        .map((a) => a.class_name);

      assert(
        teacherAssigned.length === 2 && teacherAssigned.includes('ป.1') && teacherAssigned.includes('ป.2'),
        `ครูสอนควบ (${p1.teacher?.name}) ได้รับเฉพาะห้อง: [${teacherAssigned.join(', ')}] ไม่สามารถเข้าถึงห้องอื่นได้`
      );
    }

    const p5 = assignments.find((a) => a.class_name === 'ป.5');
    if (p5 && p5.teacher_id) {
      const singleGradeTeacherId = p5.teacher_id;
      const teacherAssigned = assignments
        .filter((a) => a.teacher_id === singleGradeTeacherId)
        .map((a) => a.class_name);

      assert(
        teacherAssigned.length === 1 && teacherAssigned[0] === 'ป.5',
        `ครูประจำชั้นเดี่ยว (${p5.teacher?.name}) ได้รับเฉพาะห้อง: [${teacherAssigned.join(', ')}]`
      );
    }
  } catch (err) {
    assert(false, `เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`ผลการทดสอบ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TEACHER CLASS ASSIGNMENTS VERIFICATION PASSED PERFECTLY!\n');
  }
}

verifyDatabase();

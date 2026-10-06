/**
 * test-homeroom-assignment-integrity.mjs
 * ตรวจสอบความถูกต้องและบูรณภาพของระบบจัดครูประจำชั้นและครูสอนควบ (v1.233.4)
 * 1. ตรวจสอบว่าไม่มีแถวซ้ำซ้อนในฐานข้อมูล (1 ห้องเรียน = 1 ครูประจำชั้นหลัก)
 * 2. ตรวจสอบว่าครูสอนควบ 3 ท่าน (ป.1-2, ป.3-4, ป.5-6) มี flag is_multi_grade = true ครบถ้วน
 * 3. ตรวจสอบว่าไม่มีชื่อครูที่มี \t หรือ space นำหน้า
 * 4. ตรวจสอบว่าไม่มีข้อความหมายเหตุผิดห้อง เช่น 'ครูประจำชั้น ป.5' ในห้อง ป.6
 * 5. ทดสอบการดึงข้อมูล getClassHomeroomTeacher ครบทั้ง 6 ห้องโดยไม่เกิด error
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- 🧪 STARTING HOMEROOM ASSIGNMENT INTEGRITY AUDIT ---');

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

async function runAudit() {
  try {
    // 1. ตรวจสอบจำนวนแถวทั้งหมดในปี 2568 (ต้องมี 6 แถว สำหรับ 6 ห้องเรียน)
    console.log('\n[1/5] ตรวจสอบจำนวนการมอบหมายและห้องเรียน...');
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

    if (error) throw error;

    assert(assignments.length === 6, `พบข้อมูลตรงตาม 6 ห้องเรียนเป๊ะ ไม่มีแถวซ้ำซ้อนหรือครูผี (พบ ${assignments.length} แถว)`);

    const classNames = assignments.map((a) => a.class_name);
    const expectedClasses = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
    assert(
      JSON.stringify(classNames) === JSON.stringify(expectedClasses),
      `มีระดับชั้น ป.1 - ป.6 ครบถ้วนและไม่ซ้ำ: [${classNames.join(', ')}]`
    );

    // 2. ตรวจสอบครูผู้สอนควบ 3 คู่
    console.log('\n[2/5] ตรวจสอบคู่การสอนควบชั้นเรียน (Multi-Grade Pairs)...');
    const teacherMap = {};
    assignments.forEach((a) => {
      const tName = a.teacher?.name;
      if (!teacherMap[tName]) teacherMap[tName] = [];
      teacherMap[tName].push(a.class_name);
    });

    const teacherNames = Object.keys(teacherMap);
    assert(teacherNames.length === 3, `มีครูผู้สอนควบทั้งหมด 3 ท่าน สำหรับ 6 ห้องเรียน (พบ: ${teacherNames.join(', ')})`);

    assert(
      JSON.stringify(teacherMap['นางสาวธัญพิชชา วังผือ']) === JSON.stringify(['ป.1', 'ป.2']),
      'ครูธัญพิชชา วังผือ สอนควบ ป.1 และ ป.2 ถูกต้อง'
    );
    assert(
      JSON.stringify(teacherMap['นายเอกวิทย์ พละลี']) === JSON.stringify(['ป.3', 'ป.4']),
      'ครูเอกวิทย์ พละลี สอนควบ ป.3 และ ป.4 ถูกต้อง'
    );
    assert(
      JSON.stringify(teacherMap['นางสาวมะลิวัลย์ จรุงพันธ์']) === JSON.stringify(['ป.5', 'ป.6']),
      'ครูมะลิวัลย์ จรุงพันธ์ สอนควบ ป.5 และ ป.6 ถูกต้อง'
    );

    // 3. ตรวจสอบสถานะ is_multi_grade และหมายเหตุ
    console.log('\n[3/5] ตรวจสอบสถานะ is_multi_grade และความถูกต้องของหมายเหตุ...');
    const allMulti = assignments.every((a) => a.is_multi_grade === true);
    assert(allMulti, 'ทุกแถวมี flag is_multi_grade = true สอดคล้องกันทั้งหมด');

    const p6 = assignments.find((a) => a.class_name === 'ป.6');
    assert(
      p6 && !p6.notes.includes('ป.5 เท่านั้น') && p6.notes.includes('ป.5 และ ป.6'),
      `หมายเหตุห้อง ป.6 แสดงข้อมูลควบถูกต้อง ("${p6?.notes}") ไม่มีคำว่าครูประจำชั้น ป.5 ค้าง`
    );

    // 4. ตรวจสอบความสะอาดของชื่อในตาราง staff
    console.log('\n[4/5] ตรวจสอบความสะอาดของชื่อครูผู้สอน (No leading/trailing whitespace/tab)...');
    const hasCleanNames = assignments.every((a) => {
      const name = a.teacher?.name || '';
      return name === name.trim() && !name.includes('\t');
    });
    assert(hasCleanNames, 'ชื่อครูทุกคนสะอาดเรียบร้อย ไม่มีอักขระ \\t หรือช่องว่างตกค้าง');

    // 5. ทดสอบฟังก์ชัน Query รายห้อง (getClassHomeroomTeacher Simulation)
    console.log('\n[5/5] จำลองการดึงครูประจำชั้นรายห้องสำหรับสมุด ปพ.6 และรายงานเกรด...');
    for (const cls of expectedClasses) {
      const { data, error: qErr } = await supabase
        .from('teacher_class_assignments')
        .select(`
          class_name,
          is_primary_homeroom,
          teacher:staff!teacher_class_assignments_teacher_id_fkey(
            name,
            position,
            photo_url
          )
        `)
        .eq('academic_year', '2568')
        .eq('class_name', cls)
        .eq('is_primary_homeroom', true)
        .limit(1)
        .maybeSingle();

      assert(
        !qErr && data && data.teacher?.name,
        `ดึงครูประจำชั้นห้อง ${cls} สำเร็จ: ${data?.teacher?.name} (${data?.teacher?.position})`
      );
    }

  } catch (err) {
    assert(false, `Audit error: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`ผลการตรวจสอบบูรณภาพ: ผ่าน ${passed} รายการ, ล้มเหลว ${failed} รายการ`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 HOMEROOM ASSIGNMENT INTEGRITY IS 100% PERFECT!\n');
  }
}

runAudit();

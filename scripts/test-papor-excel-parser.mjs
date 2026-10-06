import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const filePath = 'D:/kampai-school-main/เกรด/ปพ-5-ปพ-6-ป 5 ปี68---ครูตุ้ม-Final.xlsm';
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const wb = xlsx.read(buffer, { type: 'buffer' });

console.log('1. Checking Sheets in Workbook...');
console.log(`Found ${wb.SheetNames.length} sheets.`);
const requiredSheets = ['ข้อมูลพื้นฐาน', 'กรอกข้อมูล นร1', 'สรุปคะแนนทั้งปี', 'สมรรถนะ', 'คุณลักษณะอันพึงประสงค์', 'อ่าน คิดวิเคราะห์ เขียน', 'กิจกรรมพัฒนผู้เรียน', 'สรุปเวลาเรียน'];
for (const s of requiredSheets) {
  if (!wb.Sheets[s]) {
    console.error(`Missing required sheet: ${s}`);
    process.exit(1);
  }
}
console.log('✓ All 8 required sheets found.');

// Basic info
const wsBasic = wb.Sheets['ข้อมูลพื้นฐาน'];
const basicData = xlsx.utils.sheet_to_json(wsBasic, { header: 1, defval: '' });
console.log('\n2. School Information:');
console.log(`- School: ${basicData[2]?.[1]}`);
console.log(`- Year: ${basicData[7]?.[1]}`);
console.log(`- Class: ป.${basicData[8]?.[1]}`);
console.log(`- Teacher: ${basicData[9]?.[1]}`);
console.log(`- Director: ${basicData[10]?.[1]}`);

// Students
const wsStudents = wb.Sheets['กรอกข้อมูล นร1'];
const studentData = xlsx.utils.sheet_to_json(wsStudents, { header: 1, defval: '' });
const students = [];
for (let r = 4; r < studentData.length; r++) {
  const row = studentData[r];
  if (row[2] && String(row[2]).trim() !== '' && String(row[2]).trim() !== 'ย้าย') {
    students.push({
      no: Number(row[0]) || students.length + 1,
      studentCode: String(row[1] || '').trim(),
      fullName: String(row[2] || '').trim(),
    });
  }
}
console.log(`\n3. Found ${students.length} students:`);
students.forEach(s => console.log(`  ${s.no}. ${s.studentCode} ${s.fullName}`));

if (students.length !== 5) {
  console.error(`Expected 5 students, found ${students.length}`);
  process.exit(1);
}
console.log('✓ Student count verified (5 students).');

// Verify Supabase connection and tables
const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data: dbCheck, error: dbErr } = await supabase.from('student_obec_evaluations').select('id').limit(1);
if (dbErr) {
  console.error('Supabase query error on student_obec_evaluations:', dbErr.message);
  process.exit(1);
}
console.log('\n4. Supabase tables verified:');
console.log('✓ student_obec_evaluations table is accessible.');

const { data: promoCheck, error: promoErr } = await supabase.from('student_term_promotion_records').select('id').limit(1);
if (promoErr) {
  console.error('Supabase query error on student_term_promotion_records:', promoErr.message);
  process.exit(1);
}
console.log('✓ student_term_promotion_records table is accessible.');

console.log('\n=============================================');
console.log('ALL EXCEL AND DATABASE VERIFICATION TESTS PASSED!');
console.log('=============================================');

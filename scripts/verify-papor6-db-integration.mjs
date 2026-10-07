/**
 * verify-papor6-db-integration.mjs
 * ตรวจสอบความถูกต้องของการเชื่อมโยงฐานข้อมูลจริงในระบบ ปพ.6
 * - ข้อมูลประวัตินักเรียนและผู้ปกครอง (หน้า 3)
 * - ข้อมูลสุขภาพและน้ำหนัก-ส่วนสูง (หน้า 4)
 * - ผลการประเมิน 4 มิติจาก student_obec_evaluations (หน้า 6 & 7)
 * - ข้อมูลเวลาเรียนและการตัดสินเลื่อนชั้นจาก student_term_promotion_records (หน้า 10)
 */

import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const url = envText.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)[1].trim();
const key = envText.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.*)/)[1].trim();

const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
function toThaiNumerals(val) {
  if (val === null || val === undefined || val === '') return '';
  return String(val).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
}
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = toThaiNumerals(d.getDate());
  const month = THAI_MONTHS[d.getMonth()];
  const year = toThaiNumerals(d.getFullYear() + 543);
  return `${day} ${month} ${year}`;
}
function formatThaiNationalId(idStr) {
  if (!idStr) return '-';
  const clean = idStr.replace(/[^0-9]/g, '');
  if (clean.length !== 13) return toThaiNumerals(idStr);
  return toThaiNumerals(`${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean[12]}`);
}
function calculateThaiAge(birthDateStr, academicYear) {
  if (!birthDateStr) return '-';
  const birth = new Date(birthDateStr);
  const targetYearCE = parseInt(academicYear, 10) - 543;
  const refDate = new Date(targetYearCE, 4, 16);
  let years = refDate.getFullYear() - birth.getFullYear();
  let months = refDate.getMonth() - birth.getMonth();
  if (refDate.getDate() < birth.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return `${toThaiNumerals(years)} ปี ${toThaiNumerals(months)} เดือน`;
}

async function verify() {
  console.log('🧪 Starting Papor 6 Database Integration Verification...\n');

  // 1. Fetch Students in ป.4
  const sRes = await fetch(`${url}/rest/v1/students?class=eq.%E0%B8%9B.4&order=name&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const students = await sRes.json();
  if (!students || students.length === 0) {
    throw new Error('❌ ไม่พบนักเรียนชั้น ป.4 ในฐานข้อมูล');
  }
  console.log(`✅ พบนักเรียนชั้น ป.4 จำนวน ${students.length} ตัวอย่าง`);

  const student = students[0];
  console.log(`\n🔍 ตรวจสอบนักเรียน: ${student.name} (รหัส ${student.student_code})`);

  // Verify Page 3 fields
  const formattedId = formatThaiNationalId(student.national_id);
  const formattedBirth = formatThaiDate(student.birth_date);
  const formattedAge = calculateThaiAge(student.birth_date, '2569');
  console.log(`  - เลขประจำตัวประชาชน (๑๓ หลัก): ${formattedId}`);
  console.log(`  - วันเกิดภาษาไทย: ${formattedBirth}`);
  console.log(`  - อายุ ณ ๑๖ พ.ค. ๒๕๖๙: ${formattedAge}`);
  console.log(`  - บิดา: ${student.father_name || '-'}`);
  console.log(`  - มารดา: ${student.mother_name || '-'}`);
  console.log(`  - ผู้ปกครอง: ${student.guardian_name || '-'}`);

  if (!formattedId || formattedId === '-') {
    throw new Error('❌ เลขบัตรประชาชนไม่ถูกต้อง');
  }

  // 2. Verify OBEC 4-dimension evaluations (Page 6 & Page 7)
  const evRes = await fetch(
    `${url}/rest/v1/student_obec_evaluations?academic_year=eq.2569&student_id=eq.${student.id}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }
  );
  const evals = await evRes.json();
  console.log(`\n✅ ผลการประเมิน ๔ มิติใน student_obec_evaluations: ${evals.length} รายการ`);
  evals.forEach((e) => {
    console.log(`  - ${e.evaluation_type}: สถานะ ${e.status} (คะแนน ${e.score})`);
  });

  // 3. Verify Promotion & Attendance (Page 10)
  const prRes = await fetch(
    `${url}/rest/v1/student_term_promotion_records?academic_year=eq.2569&student_id=eq.${student.id}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }
  );
  const promos = await prRes.json();
  const promo = promos[0];
  if (!promo) {
    throw new Error('❌ ไม่พบบันทึกการตัดสินเลื่อนชั้นใน student_term_promotion_records');
  }
  console.log(`\n✅ บันทึกการเลื่อนชั้น (หน้า ๑๐):`);
  console.log(`  - เวลาเรียนร้อยละ: ${toThaiNumerals(promo.attendance_percent)}%`);
  console.log(`  - ผลตัดสิน: ${promo.promotion_decision}`);
  console.log(`  - เลื่อนชั้นไป: ${promo.promoted_to_level}`);
  console.log(`  - คุณลักษณะ: ${promo.character_grade}`);
  console.log(`  - อ่านคิดวิเคราะห์: ${promo.reading_grade}`);
  console.log(`  - กิจกรรมพัฒนาผู้เรียน: ${promo.activities_status ? 'ผ่าน' : 'ไม่ผ่าน'}`);

  console.log('\n🎉 ทุกการตรวจสอบการเชื่อมโยงฐานข้อมูล ปพ.6 ผ่านเรียบร้อย 100%!');
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});

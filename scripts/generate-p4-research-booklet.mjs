/**
 * Generate filled P.4 multiply-race research booklet HTML from DB-shaped data.
 * Run: node scripts/generate-p4-research-booklet.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DATA = {
  schoolName: 'โรงเรียนบ้านคำไผ่',
  schoolLogoUrl: 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/school-images/logo/1778157862905_c2swwm.webp',
  academicYear: '2569',
  semester: '1',
  teacherName: 'นายณัฐพงศ์ สิงห์ชมภู',
  teacherPosition: 'ครูผู้ช่วย',
  studyTitle: 'การพัฒนาผลสัมฤทธิ์ทางการเรียนเรื่องการคูณด้วย Gamification',
  coverTitle:
    'การพัฒนาผลสัมฤทธิ์ทางการเรียนวิชาคณิตศาสตร์ เรื่อง การคูณ ของนักเรียนชั้นประถมศึกษาปีที่ 4 โดยใช้กิจกรรมการจัดการเรียนรู้แบบ Gamification ผ่านเกม multiply-race',
  className: 'ป.4',
  nStudents: 8,
  pretestStart: '2026-07-07',
  pretestEnd: '2026-07-13',
  posttestStart: '2026-07-14',
  posttestEnd: '2026-07-20',
  researchUrl: 'https://kampai-school.vercel.app/research/0420bbd0-d30a-4493-9b9d-016ff0b97deb',
  generatedDate: '7 กรกฎาคม 2569',
  dataAsOf: '7 กรกฎาคม 2569 (วันแรกของช่วง Pretest)',
  students: [
    { no: 1, code: '1319', name: 'ด.ช.ชนาธิป แสงดี', pre: 291.0, post: null, rounds: 1 },
    { no: 2, code: '1320', name: 'ด.ช.พชรพร จรุงพันธ์', pre: null, post: null, rounds: 0 },
    { no: 3, code: '1321', name: 'ด.ช.พีรวัส นิโม', pre: 431.3, post: null, rounds: 3 },
    { no: 4, code: '1322', name: 'ด.ช.อดิศร ว่องไว', pre: 298.5, post: null, rounds: 2 },
    { no: 5, code: '1323', name: 'ด.ญ.สรารัตน์ มฤกุล', pre: 50.0, post: null, rounds: 1 },
    { no: 6, code: '1324', name: 'ด.ญ.อัญมณี เบิกบานดี', pre: 268.7, post: null, rounds: 3 },
    { no: 7, code: '1326', name: 'ด.ญ.สุพิชฌาย์ ศรีนาดี', pre: 330.3, post: null, rounds: 3 },
    { no: 8, code: '1327', name: 'ด.ช.มนต์มนัส คณิโรจน์', pre: null, post: null, rounds: 0 },
  ],
};

const withPre = DATA.students.filter((s) => s.pre != null);
const meanPre =
  withPre.length > 0
    ? withPre.reduce((sum, s) => sum + s.pre, 0) / withPre.length
    : 0;

const fmt = (n) => (n == null ? '—' : n.toFixed(1));
const gain = (pre, post) =>
  pre != null && post != null ? `${post - pre >= 0 ? '+' : ''}${(post - pre).toFixed(1)}` : '—';

const studentRowsHtml = DATA.students
  .map(
    (s) => `<tr>
      <td class="ctr">${s.no}</td>
      <td class="ctr">${s.code}</td>
      <td>${s.name}</td>
      <td class="ctr num">${fmt(s.pre)}</td>
      <td class="ctr num">${fmt(s.post)}</td>
      <td class="ctr num">${gain(s.pre, s.post)}</td>
    </tr>`,
  )
  .join('\n');

const template = readFileSync(
  join(root, 'public/docs/classroom-research/p4-multiply-race-research-9pages.html'),
  'utf8',
);

let html = template
  .replace(
    '<title>เล่มวิจัยในชั้นเรียน ป.4 — แข่งสูตรคูณ โหมดแข่งเร็ว</title>',
    `<title>${DATA.studyTitle} — ${DATA.schoolName}</title>`,
  )
  .replace(
    'โรงเรียน <span class="blank" style="border-color:rgba(255,255,255,.4);min-width:180px;">&nbsp;</span>',
    DATA.schoolName,
  )
  .replace(
    '<h1>ผลของการจัดการเรียนรู้ด้วยเกมแข่งสูตรคูณ โหมดแข่งเร็ว บนแพลตฟอร์ม kampai-school ต่อทักษะการคูณเลขของนักเรียนชั้นประถมศึกษาปีที่ 4</h1>',
    `<h1>${DATA.coverTitle}</h1>`,
  )
  .replace(
    /<strong>ผู้วิจัย<\/strong>[\s\S]*?<strong>วันที่จัดทำ<\/strong>[\s\S]*?<\/span>/,
    `<strong>ผู้วิจัย</strong> ${DATA.teacherName} (${DATA.teacherPosition})<br>\n      <strong>ภาคเรียนที่</strong> ${DATA.semester} / <strong>ปีการศึกษา</strong> ${DATA.academicYear}<br>\n      <strong>วันที่จัดทำ</strong> ${DATA.generatedDate}`,
  );

if (!html.includes(DATA.schoolLogoUrl)) {
  html = html.replace(
    '<div class="cover-badge">',
    `<img src="${DATA.schoolLogoUrl}" alt="logo" style="width:64px;height:64px;object-fit:contain;margin:0 auto 8px;display:block;border-radius:50%;background:rgba(255,255,255,.15);padding:4px;" />\n    <div class="cover-badge">`,
  );
}

html = html
  .replace(/จำนวน <span class="blank">&nbsp;&nbsp;<\/span> คน/g, `จำนวน ${DATA.nStudents} คน`)
  .replace(/\(n = <span class="blank">&nbsp;&nbsp;<\/span>\)/g, `(n = ${DATA.nStudents})`)
  .replace(
    'ผลการวิจัย (กรอกหลังเก็บข้อมูล): คะแนนเฉลี่ยหลังเรียน <span class="blank">&nbsp;&nbsp;</span> คะแนน สูงกว่าก่อนเรียน <span class="blank">&nbsp;&nbsp;</span> คะแนน ผลต่างเฉลี่ย <span class="blank">&nbsp;&nbsp;</span> คะแนน มีนักเรียนที่คะแนนดีขึ้น <span class="blank">&nbsp;&nbsp;</span> ร้อยละ',
    `ผลเบื้องต้น ณ ${DATA.dataAsOf}: มีนักเรียนเข้าเล่นในช่วง Pretest แล้ว ${withPre.length} จาก ${DATA.nStudents} คน คะแนนเฉลี่ย Pretest (เฉพาะผู้ที่เล่นแล้ว) = ${meanPre.toFixed(1)} คะแนน — ช่วง Posttest (${DATA.posttestStart} ถึง ${DATA.posttestEnd}) ยังไม่เริ่ม`,
  )
  .replace(
    '<li>วิเคราะห์พฤติกรรมการเล่นเกมจากจำนวนรอบและคะแนนที่ระบบบันทึก</li>',
    '<li>วิเคราะห์การมีส่วนร่วมในการฝึกคูณจากจำนวนรอบและคะแนนที่ระบบบันทึก</li>',
  )
  .replace(
    '<li>นักเรียนป.4 ที่เล่นเกมครบตามเกณฑ์ (ไม่เกิน 3 รอบ/วัน ตลอดช่วงวิจัย) มีคะแนนหลังเรียนสูงกว่ากลุ่มที่เล่นไม่สม่ำเสมอ</li>',
    '<li>ข้อมูลจำนวนรอบและคะแนนรายบุคคลสามารถใช้วางแผนสอนซ่อมเสริมได้อย่างเหมาะสม</li>',
  )
  .replace(
    /นักเรียนชั้นประถมศึกษาปีที่ 4 ห้อง <span class="blank">&nbsp;<\/span> จำนวน <span class="blank">&nbsp;&nbsp;<\/span> คน/,
    `นักเรียนชั้นประถมศึกษาปีที่ 4 จำนวน ${DATA.nStudents} คน`,
  )
  .replace(
    /<tr><td>1<\/td><td><\/td><td><\/td><td><\/td><td><\/td><td><\/td><\/tr>[\s\S]*?<tr><td colspan="6" style="text-align:center;color:var\(--muted\);font-size:12px;">… เพิ่มแถวตามจำนวนนักเรียน หรือแนบตารางจาก Export CSV …<\/td><\/tr>/,
    studentRowsHtml,
  )
  .replace(
    '<tr><td>ค่าเฉลี่ย (x̄)</td><td></td><td></td></tr>',
    `<tr><td>ค่าเฉลี่ย (x̄)</td><td>${meanPre.toFixed(1)} <span style="font-size:11px;color:var(--muted)">(n=${withPre.length})</span></td><td>—</td></tr>`,
  )
  .replace(
    '<tr><td>S.D.</td><td></td><td></td></tr>',
    `<tr><td>S.D.</td><td>${stddev(withPre.map((s) => s.pre)).toFixed(1)}</td><td>—</td></tr>`,
  )
  .replace(
    '<tr><td>ผลต่างเฉลี่ย (Post − Pre)</td><td colspan="2" style="text-align:center;"></td></tr>',
    '<tr><td>ผลต่างเฉลี่ย (Post − Pre)</td><td colspan="2" style="text-align:center;">— (รอช่วง Posttest)</td></tr>',
  )
  .replace(
    '<tr><td>% นักเรียนที่คะแนนดีขึ้น</td><td colspan="2" style="text-align:center;"></td></tr>',
    '<tr><td>% นักเรียนที่คะแนนดีขึ้น</td><td colspan="2" style="text-align:center;">— (รอช่วง Posttest)</td></tr>',
  )
  .replace(
    'จากการวิจัยด้วยเกมแข่งสูตรคูณ โหมดแข่งเร็ว กับนักเรียนชั้นประถมศึกษาปีที่ 4 พบว่าคะแนนเฉลี่ยหลังเรียน <span class="blank">&nbsp;&nbsp;</span> คะแนน สูงกว่าก่อนเรียน <span class="blank">&nbsp;&nbsp;</span> คะแนน ค่าเฉลี่ยผลต่าง <span class="blank">&nbsp;&nbsp;</span> คะแนน และมีนักเรียนที่คะแนนดีขึ้น <span class="blank">&nbsp;&nbsp;</span> ร้อยละ',
    `ณ ${DATA.dataAsOf} อยู่ระหว่างเก็บข้อมูลช่วง Pretest (7–13 ก.ค. 2569) มีนักเรียน ป.4 เข้าเล่นเกมแข่งสูตรคูณ โหมดแข่งเร็วแล้ว ${withPre.length} คน จาก ${DATA.nStudents} คน คะแนนเฉลี่ย Pretest ชั่วคราว = ${meanPre.toFixed(1)} คะแนน นักเรียนที่ยังไม่เข้าเล่น: ด.ช.พชรพร จรุงพันธ์, ด.ช.มนต์มนัส คณิโรจน์ — สรุปผลเปรียบเทียบก่อน–หลังเรียนจะอัปเดตหลังครบช่วง Posttest (14–20 ก.ค. 2569)`,
  )
  .replace(
    'แนะนำ: หลังเก็บข้อมูลครบ → เปิด <strong>/teacher/game-research</strong> → แท็บรายงาน → <strong>พิมพ์รายงาน 5 บท</strong> เพื่อได้ตารางรายคนอัตโนมัติ แล้วนำมาใส่เล่มฉบับนี้',
    `ลิงก์นักเรียน: <strong>${DATA.researchUrl}</strong> · อัปเดตเล่มฉบับนี้ได้จาก /teacher/game-research หลังครบ Posttest`,
  )
  .replace(
    '<strong>หมายเหตุ:</strong> ระบบใช้ <em>คะแนนเฉลี่ยจากการเล่นเกม</em> ในแต่ละช่วงเป็น Pre/Post (ไม่ใช่แบบทดสอบกระดาษ) — ตารางรายคนในบทที่ 4 คัดลอกจากระบบได้',
    '<strong>หมายเหตุ:</strong> ระบบใช้ <em>คะแนนเฉลี่ยจากการเล่นเกม</em> ในแต่ละช่วงเป็น Pre/Post (ไม่ใช่แบบทดสอบกระดาษ) — ตารางรายคนในบทที่ 4 คัดลอกจากระบบได้<br><strong>หมายเหตุขอบเขต:</strong> ฉบับนี้ยังไม่วัดความพึงพอใจ/แรงจูงใจด้วยแบบสอบถาม จึงสรุปผลจากคะแนนและพฤติกรรมการเล่นในระบบเป็นหลัก',
  )
  .replace(
    'เรียน ผู้อำนวยการโรงเรียน <span class="blank" style="min-width:160px;">&nbsp;</span>',
    `เรียน ผู้อำนวยการ${DATA.schoolName}`,
  );

const outDir = join(root, 'public/docs/classroom-research');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'p4-multiply-race-research-filled.html');
writeFileSync(outPath, html, 'utf8');
console.log('Wrote', outPath);

function stddev(arr) {
  if (arr.length === 0) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

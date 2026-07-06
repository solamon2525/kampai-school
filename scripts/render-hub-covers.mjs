#!/usr/bin/env node
/** ปก Hub มาตรฐาน 1280×720 — SVG → PNG ผ่าน sharp */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function hubCover({ out, c1, c2, title, subtitle, titleColor, subColor, footer, body }) {
  return {
    out,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="48" y="48" width="200" height="44" rx="22" fill="rgba(255,255,255,.25)"/>
  <text x="148" y="78" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="800" fill="#fff">สื่อการสอน Hub</text>
  <text x="640" y="175" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="${titleColor}">${title}</text>
  <text x="640" y="235" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="${subColor || titleColor}">${subtitle}</text>
  ${body}
  <text x="640" y="640" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#64748b">${footer}</text>
</svg>`,
  };
}

const covers = [
  hubCover({
    out: 'public/games/thai/thai-punctuation-hub/cover.png',
    c1: '#fff1f2', c2: '#fecdd3', title: 'คลังวรรคตอนไทย', subtitle: 'จุด · จุลภาค · คำถาม · อัศเจรีย์',
    titleColor: '#be123c', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<text x="400" y="420" font-size="80" font-weight="800" fill="#e11d48">.</text>
<text x="520" y="420" font-size="80" font-weight="800" fill="#e11d48">,</text>
<text x="640" y="420" font-size="80" font-weight="800" fill="#e11d48">?</text>
<text x="760" y="420" font-size="80" font-weight="800" fill="#e11d48">!</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-sentence-hub/cover.png',
    c1: '#f0fdf4', c2: '#bbf7d0', title: 'คลังประโยคไทย', subtitle: 'ประธาน · กริยา · กรรม · ส่วนขยาย',
    titleColor: '#15803d', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<rect x="320" y="320" width="160" height="56" rx="12" fill="#fff" stroke="#86efac" stroke-width="4"/><text x="400" y="358" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="800" fill="#15803d">ประธาน</text>
<rect x="520" y="320" width="160" height="56" rx="12" fill="#fff" stroke="#86efac" stroke-width="4"/><text x="600" y="358" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="800" fill="#15803d">กริยา</text>
<rect x="720" y="320" width="160" height="56" rx="12" fill="#fff" stroke="#86efac" stroke-width="4"/><text x="800" y="358" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="800" fill="#15803d">กรรม</text>
<path d="M400 400 L600 460 L800 400" fill="none" stroke="#22c55e" stroke-width="4"/>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-reading-hub/cover.png',
    c1: '#eff6ff', c2: '#bfdbfe', title: 'คลังอ่านจับใจความ', subtitle: 'เรื่องสั้น · ข่าว · บทความ · ตอบคำถาม',
    titleColor: '#1e40af', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<rect x="440" y="300" width="400" height="220" rx="16" fill="#fff" stroke="#93c5fd" stroke-width="5"/>
<text x="640" y="380" text-anchor="middle" font-size="64">📖</text>
<text x="640" y="460" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#1e40af">อ่านแล้วตอบ</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-poetry-hub/cover.png',
    c1: '#fdf4ff', c2: '#e9d5ff', title: 'คลังบทร้อยกรรม', subtitle: 'ร้อยแก้ว · ร้อยกรอง · คำขวัญ · สัมผัส',
    titleColor: '#7e22ce', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<rect x="380" y="300" width="520" height="200" rx="12" fill="#faf5ff" stroke="#c4b5fd" stroke-width="4"/>
<text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#6b21a8">ใจดีมีที่ไป</text>
<text x="640" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#6b21a8">คนชอบชื่นชอบใจ</text>
<text x="640" y="470" text-anchor="middle" font-size="48">📜🌸</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-writing-hub/cover.png',
    c1: '#fff7ed', c2: '#fed7aa', title: 'คลังแต่งข้อความ', subtitle: 'สรุป · บันทึก · จดหมาย · checklist',
    titleColor: '#c2410c', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<text x="640" y="400" text-anchor="middle" font-size="100">✍️📝</text>
<rect x="480" y="480" width="320" height="40" rx="8" fill="#fff" stroke="#fdba74" stroke-width="3"/>
<rect x="500" y="492" width="200" height="16" rx="4" fill="#fed7aa"/>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-literature-hub/cover.png',
    c1: '#fefce8', c2: '#fef08a', title: 'คลังวรรณคดีวรรณกรรม', subtitle: 'นิทาน · สุภาษิต · ข้อคิด',
    titleColor: '#a16207', footer: 'ป.4–5 · ภาษาไทย · สื่อการสอน',
    body: `<text x="640" y="400" text-anchor="middle" font-size="90">📖🐢💬</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-idiom-hub/cover.png',
    c1: '#ecfdf5', c2: '#a7f3d0', title: 'คลังสำนวนไทย', subtitle: 'สุภาษิต · ชีวิต · สัตว์ · คติ',
    titleColor: '#047857', footer: 'ป.4–6 · ภาษาไทย · สื่อการสอน',
    body: `<ellipse cx="520" cy="400" rx="100" ry="60" fill="#fff" stroke="#34d399" stroke-width="4"/>
<text x="520" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="700" fill="#047857">ช้าๆ ได้พร้า</text>
<ellipse cx="760" cy="400" rx="100" ry="60" fill="#fff" stroke="#34d399" stroke-width="4"/>
<text x="760" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="700" fill="#047857">น้ำขึ้นให้รีบตัก</text>`,
  }),
  hubCover({
    out: 'public/games/math/math-word-problem-hub/cover.png',
    c1: '#fff7ed', c2: '#fdba74', title: 'โจทย์ปัญหาคณิต', subtitle: 'อ่านโจทย์ · คำสำคัญ · วิธีทำ',
    titleColor: '#c2410c', footer: 'ป.4–5 · คณิตศาสตร์ · สื่อการสอน',
    body: `<text x="640" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#9a3412">มีแอปเปิ้ล 12 ลูก ให้เพื่อน 5 ลูก</text>
<text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#c2410c">? = 12 − 5</text>`,
  }),
  hubCover({
    out: 'public/games/math/math-decimal-hub/cover.png',
    c1: '#eff6ff', c2: '#93c5fd', title: 'คลังทศนิยม', subtitle: 'อ่าน · เทียบ · บวกลบ · เงินทอน',
    titleColor: '#1e3a8a', footer: 'ป.4–5 · คณิตศาสตร์ · สื่อการสอน',
    body: `<text x="640" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="100" font-weight="800" fill="#1e40af">3.45</text>`,
  }),
  hubCover({
    out: 'public/games/math/math-geometry-hub/cover.png',
    c1: '#f5f3ff', c2: '#c4b5fd', title: 'คลังเรขาคณิต', subtitle: 'มุม · เส้นรอบ · พื้นที่ · รูป 2D',
    titleColor: '#5b21b6', footer: 'ป.4–5 · คณิตศาสตร์ · สื่อการสอน',
    body: `<path d="M480 480 L640 300 L800 480 Z" fill="none" stroke="#7c3aed" stroke-width="6"/>
<rect x="560" y="400" width="160" height="100" fill="none" stroke="#7c3aed" stroke-width="5"/>`,
  }),
  hubCover({
    out: 'public/games/math/math-data-hub/cover.png',
    c1: '#ecfdf5', c2: '#6ee7b7', title: 'คลังข้อมูลและกราฟ', subtitle: 'แท่ง · รูปภาพ · ตาราง',
    titleColor: '#065f46', footer: 'ป.4–5 · คณิตศาสตร์ · สื่อการสอน',
    body: `<rect x="420" y="360" width="60" height="120" fill="#059669"/><rect x="500" y="400" width="60" height="80" fill="#2563eb"/>
<rect x="580" y="320" width="60" height="160" fill="#ea580c"/><rect x="660" y="380" width="60" height="100" fill="#c026d3"/>
<line x1="400" y1="480" x2="760" y2="480" stroke="#64748b" stroke-width="3"/>`,
  }),
  hubCover({
    out: 'public/games/science/science-p45-hub/cover.png',
    c1: '#f5f3ff', c2: '#ddd6fe', title: 'คลังวิทยาศาสตร์ ป.4-5', subtitle: 'สสาร · น้ำ · สัตว์ · ย่อยอาหาร',
    titleColor: '#5b21b6', footer: 'ป.4–5 · วิทยาศาสตร์ · สื่อการสอน',
    body: `<text x="640" y="400" text-anchor="middle" font-size="90">🧊💧🦴🫁</text>`,
  }),
  hubCover({
    out: 'public/games/social/social-thailand-hub/cover.png',
    c1: '#fef3c7', c2: '#fde68a', title: 'คลังสังคมศึกษาไทย', subtitle: 'แผนที่ · สุโขทัย · พลเมืองดี',
    titleColor: '#92400e', footer: 'ป.4–5 · สังคมศึกษา · สื่อการสอน',
    body: `<path fill="#3b82f6" d="M520,300 L700,300 L720,360 L680,420 L540,410 Z"/>
<path fill="#f59e0b" d="M540,410 L680,420 L700,480 L600,500 L500,460 Z"/>
<path fill="#06b6d4" d="M580,560 L710,530 L730,600 L640,660 L520,620 Z"/>`,
  }),
  hubCover({
    out: 'public/games/english/english-grammar-p45-hub/cover.png',
    c1: '#eef2ff', c2: '#c7d2fe', title: 'คลังอังกฤษ ป.4-5', subtitle: 'Grammar · Sight Words · Instructions',
    titleColor: '#4338ca', footer: 'ป.4–5 · ภาษาอังกฤษ · สื่อการสอน',
    body: `<text x="640" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#4338ca">is / are</text>
<text x="640" y="450" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#0d9488">because</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-narration-style-media-cover.png',
    c1: '#fff7ed', c2: '#ffedd5', title: 'บรรยาย vs พรรณนา', subtitle: 'เล่าเหตุการณ์ · บรรยายลักษณะ',
    titleColor: '#9a3412', footer: 'ป.5 · ภาษาไทย · สื่อการสอน',
    body: `<rect x="300" y="320" width="280" height="160" rx="16" fill="#fff" stroke="#3b82f6" stroke-width="4"/>
<text x="440" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#2563eb">บรรยาย</text>
<text x="440" y="420" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="600" fill="#64748b">เล่าเรื่อง</text>
<rect x="700" y="320" width="280" height="160" rx="16" fill="#fff" stroke="#c026d3" stroke-width="4"/>
<text x="840" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#a21caf">พรรณนา</text>
<text x="840" y="420" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="600" fill="#64748b">บรรยายลักษณะ</text>`,
  }),
  hubCover({
    out: 'public/games/thai/thai-implied-meaning-media-cover.png',
    c1: '#ede9fe', c2: '#dbeafe', title: 'ความหมายโดยนัย', subtitle: 'ตรงตัว · อุปมา · สำนวน',
    titleColor: '#5b21b6', footer: 'ป.5 · ภาษาไทย · สื่อการสอน',
    body: `<text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#0d9488">ตรงตัว</text>
<text x="640" y="420" text-anchor="middle" font-size="48">↔</text>
<text x="640" y="480" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#7c3aed">โดยนัย</text>
<text x="640" y="540" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="600" fill="#64748b">หัวใจทองคำ = ใจดี</text>`,
  }),
];

for (const c of covers) {
  const dest = resolve(root, c.out);
  await sharp(Buffer.from(c.svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  console.log('Wrote', c.out);
}

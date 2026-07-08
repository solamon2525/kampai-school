#!/usr/bin/env node
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function cover({ out, title, subtitle, body, footer, c0, c1, ink }) {
  return {
    out,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="150" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="220" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
  ${body}
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">${footer}</text>
  <text x="1180" y="680" text-anchor="end" font-size="36">📚</text>
</svg>`,
  };
}

const covers = [
  cover({
    out: 'public/games/health/food-groups-media-cover.png',
    title: 'อาหารหลัก 5 หมู่',
    subtitle: 'โปรตีน · คาร์บ · ผัก · ผลไม้ · ไขมันดี',
    footer: 'ป.3–4 · สุขศึกษา · สื่อการสอน',
    c0: '#fff7ed', c1: '#fdba74', ink: '#9a3412',
    body: `<text x="200" y="400" text-anchor="middle" font-size="72">🥩</text>
  <text x="400" y="400" text-anchor="middle" font-size="72">🍚</text>
  <text x="600" y="400" text-anchor="middle" font-size="72">🥬</text>
  <text x="800" y="400" text-anchor="middle" font-size="72">🍌</text>
  <text x="1000" y="400" text-anchor="middle" font-size="72">🥑</text>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#c2410c">จัดจานให้ครบหมู่ · ไม่เก็บคะแนน</text>`,
  }),
  cover({
    out: 'public/games/arts/color-wheel-media-cover.png',
    title: 'วงล้อสี · วรรณะอุ่น–เย็น',
    subtitle: 'สำรวจสี · อารมณ์ · จัดฉาก',
    footer: 'ป.1–4 · ศิลปะ · สื่อการสอน',
    c0: '#faf5ff', c1: '#e9d5ff', ink: '#6b21a8',
    body: `<circle cx="640" cy="400" r="130" fill="none" stroke="#a855f7" stroke-width="18"/>
  <circle cx="640" cy="270" r="28" fill="#ef4444"/>
  <circle cx="752" cy="330" r="28" fill="#f59e0b"/>
  <circle cx="752" cy="470" r="28" fill="#22c55e"/>
  <circle cx="640" cy="530" r="28" fill="#3b82f6"/>
  <circle cx="528" cy="470" r="28" fill="#a855f7"/>
  <circle cx="528" cy="330" r="28" fill="#ec4899"/>`,
  }),
  cover({
    out: 'public/games/thai/synonym-media-cover.png',
    title: 'ไวพจน์ · คำพ้องความหมาย',
    subtitle: 'คำใกล้เคียงกัน แต่โทนใช้ต่างกัน',
    footer: 'ป.4–6 · ภาษาไทย · สื่อการสอน',
    c0: '#eff6ff', c1: '#93c5fd', ink: '#1e3a8a',
    body: `<rect x="220" y="300" width="240" height="120" rx="20" fill="#1d4ed8"/>
  <text x="340" y="375" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="800" fill="#fff">ตะวัน</text>
  <text x="520" y="375" text-anchor="middle" font-size="40" fill="#1e40af">≈</text>
  <rect x="580" y="300" width="240" height="120" rx="20" fill="#2563eb"/>
  <text x="700" y="375" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="800" fill="#fff">สุริยา</text>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#1e40af">24 กลุ่ม · เรียนรู้ + ฝึก</text>`,
  }),
  cover({
    out: 'public/games/science/plant-parts-media-cover.png',
    title: 'ส่วนของพืชดอก',
    subtitle: 'ราก · ลำต้น · ใบ · ดอก · ผล · เมล็ด',
    footer: 'ป.4 · วิทยาศาสตร์ · สื่อการสอน',
    c0: '#ecfdf5', c1: '#86efac', ink: '#14532d',
    body: `<text x="640" y="320" text-anchor="middle" font-size="90">🌻</text>
  <text x="300" y="460" text-anchor="middle" font-size="48">🌱</text>
  <text x="480" y="460" text-anchor="middle" font-size="48">🪵</text>
  <text x="640" y="460" text-anchor="middle" font-size="48">🍃</text>
  <text x="800" y="460" text-anchor="middle" font-size="48">🌸</text>
  <text x="980" y="460" text-anchor="middle" font-size="48">🍎</text>`,
  }),
  cover({
    out: 'public/games/science/moon-phases-media-cover.png',
    title: 'ดวงจันทร์ 8 ข้าง',
    subtitle: 'ข้างขึ้น · เต็มดวง · ข้างแรม',
    footer: 'ป.4 · วิทยาศาสตร์ · สื่อการสอน',
    c0: '#0f172a', c1: '#312e81', ink: '#e0e7ff',
    body: `<text x="180" y="400" text-anchor="middle" font-size="56">🌑</text>
  <text x="340" y="400" text-anchor="middle" font-size="56">🌒</text>
  <text x="500" y="400" text-anchor="middle" font-size="56">🌓</text>
  <text x="660" y="400" text-anchor="middle" font-size="56">🌔</text>
  <text x="820" y="400" text-anchor="middle" font-size="56">🌕</text>
  <text x="980" y="400" text-anchor="middle" font-size="56">🌖</text>
  <text x="1140" y="400" text-anchor="middle" font-size="56">🌗</text>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#a5b4fc">เรารับแสงอาทิตย์ที่สะท้อนจากดวงจันทร์</text>`,
  }),
  cover({
    out: 'public/games/math/rect-area-media-cover.png',
    title: 'พื้นที่สี่เหลี่ยมมุมฉาก',
    subtitle: 'พื้นที่ = กว้าง × ยาว',
    footer: 'ป.4 · คณิตศาสตร์ · สื่อการสอน',
    c0: '#eff6ff', c1: '#bfdbfe', ink: '#1e3a8a',
    body: `<rect x="420" y="280" width="440" height="240" fill="#dbeafe" stroke="#2563eb" stroke-width="6"/>
  <g fill="#93c5fd" stroke="#3b82f6" stroke-width="2">
    <rect x="420" y="280" width="110" height="80"/><rect x="530" y="280" width="110" height="80"/><rect x="640" y="280" width="110" height="80"/><rect x="750" y="280" width="110" height="80"/>
    <rect x="420" y="360" width="110" height="80"/><rect x="530" y="360" width="110" height="80"/><rect x="640" y="360" width="110" height="80"/><rect x="750" y="360" width="110" height="80"/>
    <rect x="420" y="440" width="110" height="80"/><rect x="530" y="440" width="110" height="80"/><rect x="640" y="440" width="110" height="80"/><rect x="750" y="440" width="110" height="80"/>
  </g>
  <text x="640" y="540" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#1d4ed8">นับช่อง · สูตร · แยกจากเส้นรอบรูป</text>`,
  }),
  cover({
    out: 'public/games/health/bone-muscle-media-cover.png',
    title: 'กระดูก · กล้ามเนื้อ · ข้อ',
    subtitle: 'หน้าที่ · ดูแลร่างกายให้แข็งแรง',
    footer: 'ป.4–5 · สุขศึกษา · สื่อการสอน',
    c0: '#fef2f2', c1: '#fecaca', ink: '#7f1d1d',
    body: `<text x="360" y="400" text-anchor="middle" font-size="90">🦴</text>
  <text x="640" y="400" text-anchor="middle" font-size="90">💪</text>
  <text x="920" y="400" text-anchor="middle" font-size="90">🦵</text>
  <text x="640" y="510" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#991b1b">แตะแผนภาพ · แยกประเภท · นิสัยดี/ไม่ดี</text>`,
  }),
  cover({
    out: 'public/games/career/community-jobs-media-cover.png',
    title: 'อาชีพในชุมชน',
    subtitle: 'เกษตร · บริการ · ช่าง · สาธารณสุข',
    footer: 'ป.1–4 · การงานอาชีพ · สื่อการสอน',
    c0: '#fffbeb', c1: '#fcd34d', ink: '#78350f',
    body: `<text x="280" y="400" text-anchor="middle" font-size="72">🌾</text>
  <text x="460" y="400" text-anchor="middle" font-size="72">🛒</text>
  <text x="640" y="400" text-anchor="middle" font-size="72">🛠️</text>
  <text x="820" y="400" text-anchor="middle" font-size="72">👩‍⚕️</text>
  <text x="1000" y="400" text-anchor="middle" font-size="72">👩‍🏫</text>
  <text x="640" y="510" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#92400e">อาชีพไทยชุมชน · สำคัญอย่างไร</text>`,
  }),
  cover({
    out: 'public/games/social/sufficiency-media-cover.png',
    title: 'เศรษฐกิจพอเพียง',
    subtitle: '3 ห่วง · 2 เงื่อนไข',
    footer: 'ป.4–6 · สังคมศึกษา · สื่อการสอน',
    c0: '#f0fdf4', c1: '#86efac', ink: '#14532d',
    body: `<circle cx="420" cy="380" r="90" fill="#bbf7d0" stroke="#16a34a" stroke-width="6"/>
  <text x="420" y="390" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#14532d">พอประมาณ</text>
  <circle cx="640" cy="380" r="90" fill="#bfdbfe" stroke="#2563eb" stroke-width="6"/>
  <text x="640" y="390" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#1e3a8a">มีเหตุผล</text>
  <circle cx="860" cy="380" r="90" fill="#fde68a" stroke="#d97706" stroke-width="6"/>
  <text x="860" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="800" fill="#78350f">ภูมิคุ้มกัน</text>
  <text x="860" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="#78350f"></text>
  <text x="640" y="520" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#166534">ความรู้ + คุณธรรม</text>`,
  }),
  cover({
    out: 'public/games/thai/dictionary-media-cover.png',
    title: 'พจนานุกรมดิจิทัล',
    subtitle: 'สอนวิธีเปิดพจนานุกรม · ค้นหาคำ',
    footer: 'ป.3–4 · ภาษาไทย · สื่อการสอน',
    c0: '#f8fafc', c1: '#cbd5e1', ink: '#0f172a',
    body: `<rect x="360" y="260" width="560" height="280" rx="24" fill="#1e293b"/>
  <text x="640" y="330" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#fbbf24">📖 พจนานุกรม</text>
  <text x="640" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#e2e8f0">ก → ข → ค → … → ฮ</text>
  <text x="640" y="470" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="600" fill="#94a3b8">คำอ่าน · ชนิดคำ · ความหมาย</text>`,
  }),
];

for (const c of covers) {
  const out = resolve(root, c.out);
  await sharp(Buffer.from(c.svg)).png().toFile(out);
  console.log('OK', c.out);
}

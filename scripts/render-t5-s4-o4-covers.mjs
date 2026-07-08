#!/usr/bin/env node
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const covers = [
  {
    out: 'public/games/thai/sentence-structure-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffedd5"/><stop offset="100%" stop-color="#fdba74"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="160" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#7c2d12">โครงสร้างประโยค</text>
  <text x="640" y="230" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#9a3412">ประธาน · กริยา · กรรม</text>
  <rect x="180" y="300" width="220" height="100" rx="20" fill="#2563eb"/>
  <text x="290" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#fff">ประธาน</text>
  <text x="450" y="360" text-anchor="middle" font-size="40" fill="#c2410c">→</text>
  <rect x="500" y="300" width="220" height="100" rx="20" fill="#16a34a"/>
  <text x="610" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#fff">กริยา</text>
  <text x="770" y="360" text-anchor="middle" font-size="40" fill="#c2410c">→</text>
  <rect x="820" y="300" width="240" height="100" rx="20" fill="#c026d3"/>
  <text x="940" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#fff">กรรม</text>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="700" fill="#7c2d12">📝 เรียงคำให้เป็นประโยค</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.3–5 · ภาษาไทย · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/science/food-chain-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#dcfce7"/><stop offset="100%" stop-color="#86efac"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="160" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#14532d">ห่วงโซ่อาหาร</text>
  <text x="640" y="230" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#166534">ผู้ผลิต → ผู้บริโภค → ผู้ล่าสูงสุด</text>
  <text x="240" y="400" text-anchor="middle" font-size="80">🌾</text>
  <text x="400" y="400" text-anchor="middle" font-size="48" fill="#ca8a04">➜</text>
  <text x="520" y="400" text-anchor="middle" font-size="80">🦗</text>
  <text x="680" y="400" text-anchor="middle" font-size="48" fill="#ca8a04">➜</text>
  <text x="800" y="400" text-anchor="middle" font-size="80">🐸</text>
  <text x="940" y="400" text-anchor="middle" font-size="48" fill="#ca8a04">➜</text>
  <text x="1060" y="400" text-anchor="middle" font-size="80">🦅</text>
  <text x="640" y="520" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#14532d">พลังงานไหลตามลูกศร</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4–5 · วิทยาศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/career/waste-sort-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#6ee7b7"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="150" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#064e3b">คัดแยกขยะ 4 ถัง</text>
  <rect x="140" y="240" width="220" height="220" rx="24" fill="#22c55e"/>
  <text x="250" y="340" text-anchor="middle" font-size="64">🟢</text>
  <text x="250" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#fff">เปียก</text>
  <rect x="400" y="240" width="220" height="220" rx="24" fill="#eab308"/>
  <text x="510" y="340" text-anchor="middle" font-size="64">🟡</text>
  <text x="510" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#1e293b">รีไซเคิล</text>
  <rect x="660" y="240" width="220" height="220" rx="24" fill="#3b82f6"/>
  <text x="770" y="340" text-anchor="middle" font-size="64">🔵</text>
  <text x="770" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#fff">ทั่วไป</text>
  <rect x="920" y="240" width="220" height="220" rx="24" fill="#ef4444"/>
  <text x="1030" y="340" text-anchor="middle" font-size="64">🔴</text>
  <text x="1030" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#fff">อันตราย</text>
  <text x="640" y="560" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#065f46">ถังขยะมาตรฐานไทย</text>
  <text x="640" y="620" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.1–4 · การงานอาชีพ · สื่อการสอน</text>
</svg>`,
  },
];

for (const c of covers) {
  const out = resolve(root, c.out);
  await sharp(Buffer.from(c.svg)).png().toFile(out);
  console.log('OK', c.out);
}

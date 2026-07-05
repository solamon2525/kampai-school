#!/usr/bin/env node
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const covers = [
  {
    out: 'public/games/math/decimal-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#bfdbfe"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="64" font-weight="800" fill="#1e3a8a">ทศนิยม</text>
  <text x="640" y="270" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="34" font-weight="700" fill="#2563eb">อ่าน · เปรียบเทียบ · บวกลบ</text>
  <text x="640" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="120" font-weight="800" fill="#1e3a8a">3.45</text>
  <rect x="340" y="480" width="120" height="80" rx="12" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
  <text x="400" y="535" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#1e3a8a">3</text>
  <text x="480" y="535" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#ea580c">.</text>
  <rect x="500" y="480" width="80" height="80" rx="12" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
  <text x="540" y="535" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#1e3a8a">4</text>
  <rect x="600" y="480" width="80" height="80" rx="12" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
  <text x="640" y="535" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#1e3a8a">5</text>
  <text x="640" y="640" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · คณิตศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/science/states-of-matter-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ecfeff"/><stop offset="100%" stop-color="#a5f3fc"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="58" font-weight="800" fill="#0e7490">สสาร 3 สถานะ</text>
  <text x="640" y="250" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="700" fill="#0891b2">แข็ง · ของเหลว · ก๊าซ</text>
  <circle cx="320" cy="420" r="70" fill="#bae6fd" stroke="#0284c7" stroke-width="4"/>
  <text x="320" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#0c4a6e">แข็ง</text>
  <ellipse cx="640" cy="420" rx="90" ry="60" fill="#7dd3fc" stroke="#0284c7" stroke-width="4"/>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#0c4a6e">ของเหลว</text>
  <circle cx="960" cy="400" r="30" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>
  <circle cx="1000" cy="360" r="24" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>
  <circle cx="920" cy="370" r="20" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>
  <text x="960" y="480" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#0c4a6e">ก๊าซ</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · วิทยาศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/social/thailand-map-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="56" font-weight="800" fill="#92400e">แผนที่ประเทศไทย</text>
  <text x="640" y="270" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="700" fill="#b45309">ภาคและจังหวัด</text>
  <path fill="#3b82f6" d="M520,300 L700,300 L720,360 L680,420 L540,410 Z"/>
  <path fill="#22c55e" d="M720,360 L820,370 L810,440 L720,450 Z"/>
  <path fill="#f59e0b" d="M540,410 L680,420 L700,480 L600,500 L500,460 Z"/>
  <path fill="#ec4899" d="M700,480 L810,440 L800,520 L710,530 Z"/>
  <path fill="#8b5cf6" d="M460,460 L500,460 L600,500 L580,560 L440,520 Z"/>
  <path fill="#06b6d4" d="M580,560 L710,530 L730,600 L640,660 L520,620 Z"/>
  <text x="640" y="640" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · สังคมศึกษา · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/english/sight-words-p4-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ccfbf1"/><stop offset="100%" stop-color="#99f6e4"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="170" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="54" font-weight="800" fill="#0f766e">Sight Words</text>
  <text x="640" y="240" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="34" font-weight="700" fill="#14b8a6">คำอ่านจำ ป.4</text>
  <rect x="340" y="320" width="600" height="200" rx="24" fill="#fff" stroke="#5eead4" stroke-width="5"/>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="72" font-weight="800" fill="#0d9488">because</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · ภาษาอังกฤษ · สื่อการสอน</text>
</svg>`,
  },
];

for (const c of covers) {
  const dest = resolve(root, c.out);
  await sharp(Buffer.from(c.svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  console.log('Wrote', c.out);
}

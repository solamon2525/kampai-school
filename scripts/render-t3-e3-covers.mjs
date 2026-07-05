#!/usr/bin/env node
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const covers = [
  {
    out: 'public/games/thai/thai-word-types-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="0" y="0" width="1280" height="96" fill="#fff7ed"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="64" font-weight="800" fill="#7c2d12">ชนิดของคำ</text>
  <text x="640" y="270" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="700" fill="#9a3412">นาม · กริยา · คุณศัพท์</text>
  <rect x="180" y="340" width="280" height="120" rx="20" fill="#2563eb"/>
  <text x="320" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#fff">คำนาม</text>
  <rect x="500" y="340" width="280" height="120" rx="20" fill="#16a34a"/>
  <text x="640" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#fff">คำกริยา</text>
  <rect x="820" y="340" width="280" height="120" rx="20" fill="#c026d3"/>
  <text x="960" y="410" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#fff">คุณศัพท์</text>
  <text x="640" y="560" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.3-4 · ภาษาไทย · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/english/grammar-mini-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef2ff"/><stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="0" y="0" width="1280" height="96" fill="#eef2ff"/>
  <text x="640" y="190" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="58" font-weight="800" fill="#4338ca">Grammar Mini</text>
  <text x="640" y="260" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="34" font-weight="700" fill="#4f46e5">is / are · a / an</text>
  <rect x="200" y="340" width="360" height="100" rx="18" fill="#fff" stroke="#a5b4fc" stroke-width="4"/>
  <text x="380" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="40" font-weight="800" fill="#4338ca">He <tspan fill="#ea580c">is</tspan> happy</text>
  <rect x="720" y="340" width="360" height="100" rx="18" fill="#fff" stroke="#a5b4fc" stroke-width="4"/>
  <text x="900" y="400" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="40" font-weight="800" fill="#4338ca"><tspan fill="#ea580c">an</tspan> apple</text>
  <text x="640" y="560" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.3-4 · ภาษาอังกฤษ · สื่อการสอน</text>
</svg>`,
  },
];

for (const c of covers) {
  const dest = resolve(root, c.out);
  await sharp(Buffer.from(c.svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  console.log('Wrote', c.out);
}

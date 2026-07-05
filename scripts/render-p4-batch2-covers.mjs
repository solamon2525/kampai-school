#!/usr/bin/env node
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const covers = [
  {
    out: 'public/games/thai/fact-opinion-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#ffedd5"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#7c2d12">ข้อเท็จจริง vs ความคิดเห็น</text>
  <rect x="200" y="300" width="400" height="140" rx="20" fill="#eff6ff" stroke="#2563eb" stroke-width="4"/>
  <text x="400" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#2563eb">✓ เท็จจริง</text>
  <rect x="680" y="300" width="400" height="140" rx="20" fill="#fdf4ff" stroke="#c026d3" stroke-width="4"/>
  <text x="880" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="36" font-weight="800" fill="#c026d3">💭 ความคิดเห็น</text>
  <text x="640" y="560" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · ภาษาไทย · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/math/bar-chart-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#bfdbfe"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="56" font-weight="800" fill="#1e3a8a">แผนภูมิแท่ง</text>
  <rect x="340" y="380" width="80" height="120" rx="8" fill="#2563eb"/>
  <rect x="460" y="320" width="80" height="180" rx="8" fill="#16a34a"/>
  <rect x="580" y="260" width="80" height="240" rx="8" fill="#ea580c"/>
  <rect x="700" y="400" width="80" height="100" rx="8" fill="#c026d3"/>
  <line x1="300" y1="500" x2="820" y2="500" stroke="#94a3b8" stroke-width="3"/>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · คณิตศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/social/good-citizen-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="64" font-weight="800" fill="#92400e">พลเมืองดี</text>
  <text x="640" y="280" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="34" font-weight="700" fill="#b45309">หน้าที่ · จริยธรรม · สถานการณ์</text>
  <text x="640" y="420" text-anchor="middle" font-size="100">🤝</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · สังคมศึกษา · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/science/vertebrate-sort-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#a7f3d0"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#047857">สัตว์มี/ไม่มีกระดูกสันหลัง</text>
  <text x="320" y="400" text-anchor="middle" font-size="80">🐘🐟🐦</text>
  <text x="320" y="480" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#2563eb">มีกระดูกสันหลัง</text>
  <text x="960" y="400" text-anchor="middle" font-size="80">🦋🐌🦀</text>
  <text x="960" y="480" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#ea580c">ไม่มีกระดูกสันหลัง</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · วิทยาศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
];

for (const c of covers) {
  const dest = resolve(root, c.out);
  await sharp(Buffer.from(c.svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  console.log('Wrote', c.out);
}

#!/usr/bin/env node
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const covers = [
  {
    out: 'public/games/math/angle-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#7dd3fc"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="56" font-weight="800" fill="#0369a1">มุม — แหลม · ฉาก · ป้าน</text>
  <path d="M420 480 L640 280 L860 480 Z" fill="none" stroke="#2563eb" stroke-width="6"/>
  <text x="500" y="520" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#2563eb">แหลม</text>
  <text x="760" y="520" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#16a34a">ฉาก</text>
  <text x="600" y="420" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#ea580c">ป้าน</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · คณิตศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/social/sukhothai-timeline-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="56" font-weight="800" fill="#92400e">สมัยสุโขทัย</text>
  <line x1="200" y1="400" x2="1080" y2="400" stroke="#b45309" stroke-width="4"/>
  <circle cx="320" cy="400" r="16" fill="#78350f"/><circle cx="640" cy="400" r="16" fill="#b45309"/><circle cx="960" cy="400" r="16" fill="#d97706"/>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#78350f">ไทม์ไลน์ · บุคคลสำคัญ</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · สังคมศึกษา · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/health/food-label-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#a7f3d0"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#047857">อ่านฉลากอาหาร</text>
  <rect x="400" y="260" width="480" height="280" rx="20" fill="#fff" stroke="#10b981" stroke-width="4"/>
  <text x="640" y="340" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#065f46">สารอาหาร · วันหมดอายุ</text>
  <text x="640" y="420" text-anchor="middle" font-size="72">🥫</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · สุขศึกษา · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/english/follow-instructions-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ede9fe"/><stop offset="100%" stop-color="#c4b5fd"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#5b21b6">Follow Instructions</text>
  <text x="640" y="260" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#7c3aed">ฟัง/อ่านคำสั่ง · เลือกภาพ</text>
  <text x="640" y="420" text-anchor="middle" font-size="100">👂📋</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4 · ภาษาอังกฤษ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/math/number-line-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#93c5fd"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="56" font-weight="800" fill="#1e3a8a">เส้นจำนวน</text>
  <line x1="240" y1="400" x2="1040" y2="400" stroke="#2563eb" stroke-width="6"/>
  <circle cx="480" cy="400" r="14" fill="#dc2626"/><circle cx="720" cy="400" r="14" fill="#16a34a"/>
  <text x="640" y="500" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#1d4ed8">ลากจุด · เปรียบเทียบ · เรียงลำดับ</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.1–3 · คณิตศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/science/digestive-system-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fff7ed"/><stop offset="100%" stop-color="#fed7aa"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="180" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="48" font-weight="800" fill="#c2410c">ระบบย่อยอาหาร</text>
  <ellipse cx="640" cy="400" rx="120" ry="180" fill="none" stroke="#ea580c" stroke-width="5"/>
  <text x="640" y="520" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#9a3412">แตะอวัยวะ · เรียงลำดับ</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.4–6 · วิทยาศาสตร์ · สื่อการสอน</text>
</svg>`,
  },
  {
    out: 'public/games/health/handwash-media-cover.png',
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#bae6fd"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="200" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="#0369a1">ล้างมือ 7 ขั้นตอน</text>
  <text x="640" y="400" text-anchor="middle" font-size="120">🧼🖐️</text>
  <text x="640" y="520" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#0284c7">เรียงขั้นตอน · สุขบัญญัติ</text>
  <text x="640" y="600" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#64748b">ป.1–3 · สุขศึกษา · สื่อการสอน</text>
</svg>`,
  },
];

for (const c of covers) {
  const dest = resolve(root, c.out);
  await sharp(Buffer.from(c.svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  console.log('Wrote', c.out);
}

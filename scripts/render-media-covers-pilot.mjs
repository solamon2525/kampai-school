#!/usr/bin/env node
/**
 * ปกสื่อ full-bleed pilot (3 ชิ้น) — พื้นหลังเต็มขอบ + ครูผู้ชาย + เนื้อหาตามสื่อ
 * Usage: node scripts/render-media-covers-pilot.mjs [slug...]
 *   default: thai-word-types, thai-punctuation-hub, decimal-media
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrapCover, whiteboard, mediaBadge } from './lib/edu-cover-fullbleed.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PILOTS = {
  'thai-word-types': {
    out: 'public/games/thai/thai-word-types-cover.png',
    grade: 'ป.3-4',
    build: () => wrapCover({
      bgStops: ['#7c2d12', '#c2410c', '#9a3412'],
      accent: '#431407',
      title: 'ชนิดของคำ',
      subtitle: 'นาม · กริยา · คุณศัพท์ · สำนวน',
      footer: 'ป.3-4 · ภาษาไทย · สื่อการสอน',
      decor: mediaBadge('ป.3-4', '#fbbf24'),
      board: whiteboard(120, 160, 720, 400, `
        <rect x="160" y="240" width="180" height="90" rx="14" fill="#2563eb"/>
        <text x="250" y="295" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="800" fill="#fff">คำนาม</text>
        <text x="250" y="330" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="600" fill="#dbeafe">นักเรียน · แมว</text>
        <rect x="390" y="240" width="180" height="90" rx="14" fill="#16a34a"/>
        <text x="480" y="295" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="800" fill="#fff">คำกริยา</text>
        <text x="480" y="330" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="600" fill="#dcfce7">วิ่ง · อ่าน</text>
        <rect x="620" y="240" width="180" height="90" rx="14" fill="#c026d3"/>
        <text x="710" y="295" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="32" font-weight="800" fill="#fff">คุณศัพท์</text>
        <text x="710" y="330" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="600" fill="#fae8ff">สวย · ดี</text>
        <text x="480" y="210" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="#64748b">ลากจัดกล่อง · ฝึกจำแนก</text>
      `),
    }),
  },

  'thai-punctuation-hub': {
    out: 'public/games/thai/thai-punctuation-hub/cover.png',
    grade: 'ป.4-5',
    build: () => wrapCover({
      bgStops: ['#9f1239', '#e11d48', '#be123c'],
      accent: '#881337',
      title: 'คลังวรรคตอนไทย',
      subtitle: 'จุด · จุลภาค · คำถาม · อัศเจรีย์',
      footer: 'ป.4-5 · ภาษาไทย · สื่อการสอน Hub',
      decor: mediaBadge('ป.4-5', '#fda4af'),
      board: whiteboard(100, 150, 740, 420, `
        <text x="470" y="280" text-anchor="middle" font-size="120" font-weight="800" fill="#e11d48">.</text>
        <text x="560" y="280" text-anchor="middle" font-size="120" font-weight="800" fill="#e11d48">,</text>
        <text x="650" y="280" text-anchor="middle" font-size="120" font-weight="800" fill="#e11d48">?</text>
        <text x="740" y="280" text-anchor="middle" font-size="120" font-weight="800" fill="#e11d48">!</text>
        <text x="470" y="380" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="#64748b">เติมเครื่องหมาย · ทายความหมาย</text>
        <text x="470" y="420" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="600" fill="#94a3b8">คำขวัญโรงเรียน</text>
      `),
    }),
  },

  'decimal-media': {
    out: 'public/games/math/decimal-media-cover.png',
    grade: 'ป.4',
    build: () => wrapCover({
      bgStops: ['#1e3a8a', '#2563eb', '#1d4ed8'],
      accent: '#1e40af',
      title: 'ทศนิยม',
      subtitle: 'อ่าน · เปรียบเทียบ · บวกลบ',
      footer: 'ป.4 · คณิตศาสตร์ · สื่อการสอน',
      decor: mediaBadge('ป.4', '#93c5fd'),
      board: whiteboard(110, 155, 730, 410, `
        <text x="475" y="300" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="110" font-weight="800" fill="#1e3a8a">3.45</text>
        <rect x="300" y="340" width="90" height="70" rx="10" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
        <text x="345" y="388" text-anchor="middle" font-size="40" font-weight="800" fill="#1e3a8a">3</text>
        <text x="410" y="388" text-anchor="middle" font-size="40" font-weight="800" fill="#ea580c">.</text>
        <rect x="430" y="340" width="70" height="70" rx="10" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
        <text x="465" y="388" text-anchor="middle" font-size="40" font-weight="800" fill="#1e3a8a">4</text>
        <rect x="520" y="340" width="70" height="70" rx="10" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
        <text x="555" y="388" text-anchor="middle" font-size="40" font-weight="800" fill="#1e3a8a">5</text>
        <text x="475" y="250" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="#64748b">หลักหน่วย · หลักสิบ · หลักทศนิยม</text>
      `),
    }),
  },
};

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PILOTS);

for (const slug of slugs) {
  const spec = PILOTS[slug];
  if (!spec) {
    console.error(`! ไม่รู้จัก slug: ${slug}`);
    continue;
  }
  const dest = resolve(root, spec.out);
  const svg = spec.build();
  await sharp(Buffer.from(svg, 'utf8')).resize(1280, 720).png().toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`✓ ${slug} → ${spec.out} (${meta.width}×${meta.height})`);
}

#!/usr/bin/env node
/**
 * ปกสื่อ AI full-bleed — คุณภาพแบบ rounding/script-hub (Pollinations) + overlay ไทย
 * Usage: node scripts/render-media-covers-ai-pilot.mjs [slug...]
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAiPrompt, titleOverlaySvg, W, H } from './lib/edu-cover-fullbleed.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POLLINATIONS = 'https://image.pollinations.ai/prompt';

const SPECS = {
  'thai-word-types': {
    out: 'public/games/thai/thai-word-types-cover.png',
    title: 'ชนิดของคำ',
    subtitle: 'นาม · กริยา · คุณศัพท์ · สำนวน',
    footer: 'ป.3-4 · ภาษาไทย · สื่อการสอน',
    grade: 'ป.3-4',
    accent: '#7c2d12',
    scene:
      'male teacher pointing at a large whiteboard with three colorful boxes blue green purple representing noun verb adjective word types, Thai elementary students watching, drag-and-drop classification lesson, warm orange classroom',
    colors: 'main color tone: warm orange brown and navy accents',
  },
  'thai-punctuation-hub': {
    out: 'public/games/thai/thai-punctuation-hub/cover.png',
    title: 'คลังวรรคตอนไทย',
    subtitle: 'จุด · จุลภาค · คำถาม · อัศเจรีย์',
    footer: 'ป.4-5 · ภาษาไทย · สื่อการสอน Hub',
    grade: 'ป.4-5',
    accent: '#9f1239',
    scene:
      'male teacher at whiteboard showing large punctuation marks period comma question exclamation, Thai language punctuation lesson, pink rose classroom poster style',
    colors: 'main color tone: rose pink and deep red',
  },
  'decimal-media': {
    out: 'public/games/math/decimal-media-cover.png',
    title: 'ทศนิยม',
    subtitle: 'อ่าน · เปรียบเทียบ · บวกลบ',
    footer: 'ป.4 · คณิตศาสตร์ · สื่อการสอน',
    grade: 'ป.4',
    accent: '#1e3a8a',
    scene:
      'male teacher explaining decimal number 3.45 on whiteboard with place value blocks ones tenths hundredths, math classroom, blue educational poster',
    colors: 'main color tone: bright blue and navy',
  },
};

async function fetchAiImage(prompt, seed) {
  const url =
    `${POLLINATIONS}/${encodeURIComponent(prompt)}` +
    `?width=${W}&height=${H}&nologo=true&model=flux&seed=${seed}`;
  const res = await fetch(url, { headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('ภาพเล็กผิดปกติ');
  return buf;
}

async function renderOne(slug, spec) {
  const prompt = buildAiPrompt(spec.scene, spec.colors);
  const seed = 40_000 + [...slug].reduce((a, c) => a + c.charCodeAt(0), 0);
  console.log(`… ${slug} — สร้างภาพ AI (seed ${seed})`);
  const raw = await fetchAiImage(prompt, seed);
  const overlay = Buffer.from(
    titleOverlaySvg({
      title: spec.title,
      subtitle: spec.subtitle,
      footer: spec.footer,
      accent: spec.accent,
      grade: spec.grade,
    }),
    'utf8',
  );
  const dest = resolve(root, spec.out);
  await sharp(raw)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(dest);
  console.log(`✓ ${slug} → ${spec.out}`);
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SPECS);
for (const slug of slugs) {
  const spec = SPECS[slug];
  if (!spec) {
    console.error(`! ไม่รู้จัก: ${slug}`);
    process.exitCode = 1;
    continue;
  }
  try {
    await renderOne(slug, spec);
  } catch (e) {
    console.error(`✗ ${slug}:`, e.message);
    process.exitCode = 1;
  }
}

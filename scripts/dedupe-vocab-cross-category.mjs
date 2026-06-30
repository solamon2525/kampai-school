#!/usr/bin/env node
/**
 * รายงานคำซ้ำข้ามหมวด (เฟส F) — ไม่ลบอัตโนมัติ
 * Usage: node scripts/dedupe-vocab-cross-category.mjs [--fix]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');
const fix = process.argv.includes('--fix');

const byWord = new Map();
for (const file of readdirSync(WORDS_DIR).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace('.json', '');
  const items = JSON.parse(readFileSync(join(WORDS_DIR, file), 'utf8'));
  items.forEach((item, idx) => {
    const key = item.word;
    if (!byWord.has(key)) byWord.set(key, []);
    byWord.get(key).push({ slug, idx, item });
  });
}

const dups = [...byWord.entries()].filter(([, locs]) => {
  const slugs = new Set(locs.map((l) => l.slug));
  return slugs.size > 1;
});

console.log(`พบคำซ้ำข้ามหมวด: ${dups.length} คำ\n`);
let removed = 0;

for (const [word, locs] of dups) {
  console.log(`• ${word} → ${locs.map((l) => l.slug).join(', ')}`);
  if (!fix) continue;
  // เก็บใน slug แรกตามลำดับตัวอักษร ลบที่เหลือ
  const keep = [...locs].sort((a, b) => a.slug.localeCompare(b.slug))[0].slug;
  for (const loc of locs) {
    if (loc.slug === keep) continue;
    const path = join(WORDS_DIR, `${loc.slug}.json`);
    const items = JSON.parse(readFileSync(path, 'utf8'));
    const next = items.filter((x) => x.word !== word);
    if (next.length < items.length) {
      writeFileSync(path, JSON.stringify(next, null, 2) + '\n', 'utf8');
      removed++;
    }
  }
}

if (fix) console.log(`\nลบ duplicate ${removed} รายการ (เก็บ slug แรกตามชื่อ)`);
else console.log('\nใส่ --fix เพื่อลบ duplicate (ระวัง: จำนวนคำ/หมวดอาจไม่เท่า 100)');

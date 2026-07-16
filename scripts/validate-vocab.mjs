#!/usr/bin/env node
/**
 * ตรวจคุณภาพคลังคำศัพท์ Thai Vocab Hub
 * Usage: node scripts/validate-vocab.mjs [--strict]
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data');
const TARGET = 200;
const strict = process.argv.includes('--strict');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const categories = loadJson(join(DATA_DIR, 'categories.json'));
const slugs = categories.map((c) => c.slug);
const errors = [];
const warnings = [];
const globalWords = new Map(); // word -> [{slug, idx}]

for (const slug of slugs) {
  const path = join(DATA_DIR, 'words', `${slug}.json`);
  if (!existsSync(path)) {
    errors.push(`[${slug}] ไม่พบไฟล์ words/${slug}.json`);
    continue;
  }

  const items = loadJson(path);
  if (!Array.isArray(items)) {
    errors.push(`[${slug}] ต้องเป็น array`);
    continue;
  }

  if (items.length !== TARGET) {
    (strict ? errors : warnings).push(`[${slug}] จำนวน ${items.length} คำ (เป้า ${TARGET})`);
  }

  const seen = new Set();
  items.forEach((item, idx) => {
    const loc = `${slug}[${idx}]`;
    if (!item || typeof item !== 'object') {
      errors.push(`${loc}: ไม่ใช่ object`);
      return;
    }
    if (!item.word || typeof item.word !== 'string' || !item.word.trim()) {
      errors.push(`${loc}: word ว่าง`);
    }
    if (!item.reading || typeof item.reading !== 'string' || !item.reading.trim()) {
      errors.push(`${loc}: reading ว่าง`);
    }
    if (!item.meaning || typeof item.meaning !== 'string' || item.meaning.trim().length < 4) {
      errors.push(`${loc}: meaning สั้นเกินไป`);
    }
    if (item.grade != null && item.grade !== '' && !['ป.4', 'ป.5', 'ป.6'].includes(item.grade)) {
      errors.push(`${loc}: grade ต้องเป็น ป.4 | ป.5 | ป.6`);
    }
    if (item.word) {
      const key = `${item.word.trim()}\0${(item.reading || '').trim()}`;
      if (seen.has(key)) {
        errors.push(`${loc}: คำซ้ำในหมวดเดียวกัน "${item.word}" [${item.reading}]`);
      }
      seen.add(key);
      const gkey = item.word.trim();
      if (!globalWords.has(gkey)) globalWords.set(gkey, []);
      globalWords.get(gkey).push({ slug, idx });
    }
  });
}

// คำซ้ำข้ามหมวด (homophones อาจมีคำอ่านซ้ำ — แจ้ง warning เท่านั้น)
for (const [word, locs] of globalWords) {
  const uniqueSlugs = [...new Set(locs.map((l) => l.slug))];
  if (uniqueSlugs.length > 1) {
    warnings.push(`คำ "${word}" ปรากฏ ${uniqueSlugs.length} หมวด: ${uniqueSlugs.join(', ')}`);
  }
}

console.log('\n📋 Validate Thai Vocab Hub\n');

if (warnings.length) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  warnings.slice(0, 30).forEach((w) => console.log('  ', w));
  if (warnings.length > 30) console.log(`   ... และอีก ${warnings.length - 30}`);
}

if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.log('  ', e));
  process.exit(1);
}

const total = slugs.reduce((sum, slug) => {
  const items = loadJson(join(DATA_DIR, 'words', `${slug}.json`));
  return sum + items.length;
}, 0);

console.log(`\n✅ ผ่าน — ${categories.length} หมวด · ${total} คำ`);
if (warnings.length) {
  console.log('ℹ️  คำซ้ำข้ามหมวดยังเป็น warning เพื่อให้คำเดียวกันอยู่ได้หลายบริบทการเรียน');
}
process.exit(0);

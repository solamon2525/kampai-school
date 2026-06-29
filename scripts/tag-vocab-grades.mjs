#!/usr/bin/env node
/**
 * ใส่ field grade (ป.4|ป.5|ป.6) ให้คำที่ยังไม่มี — heuristic จากพยางค์/ความยาว
 * Usage: node scripts/tag-vocab-grades.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');
const dryRun = process.argv.includes('--dry-run');

const VALID = new Set(['ป.4', 'ป.5', 'ป.6']);

/** หมวดที่โน้มระดับสูงขึ้น */
const HARDER_SLUGS = new Set(['difficult', 'idioms', 'royal', 'homophones']);
const EASIER_SLUGS = new Set(['classifiers', 'reduplication', 'blends']);

function syllableCount(item) {
  const r = item.reading || item.word || '';
  return r.split('-').filter(Boolean).length || 1;
}

function inferGrade(item, slug) {
  if (item.grade && VALID.has(item.grade)) return item.grade;

  const syl = syllableCount(item);
  const len = (item.word || '').length;
  let score = 0;
  if (syl >= 6) score += 2;
  else if (syl >= 4) score += 1;
  if (len >= 12) score += 2;
  else if (len >= 8) score += 1;

  if (HARDER_SLUGS.has(slug)) score += 1;
  if (EASIER_SLUGS.has(slug)) score -= 1;

  if (score <= 0) return 'ป.4';
  if (score === 1) return 'ป.5';
  return 'ป.6';
}

let tagged = 0;
let total = 0;

for (const file of readdirSync(WORDS_DIR).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '');
  const path = join(WORDS_DIR, file);
  const items = JSON.parse(readFileSync(path, 'utf8'));
  let changed = 0;

  for (const item of items) {
    total++;
    if (item.grade && VALID.has(item.grade)) continue;
    item.grade = inferGrade(item, slug);
    changed++;
    tagged++;
  }

  if (!dryRun && changed > 0) {
    writeFileSync(path, JSON.stringify(items, null, 2) + '\n', 'utf8');
  }
  console.log(`${slug}: +${changed} grade tags`);
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}Tagged ${tagged} / ${total} words`);

#!/usr/bin/env node
/**
 * รายงานคำที่กักกันไว้และรายการสุ่มตรวจครูเป็น CSV
 * Usage: node scripts/audit-thai-vocab-quality.mjs [--sample=10]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data');
const visualPilotOnly = process.argv.includes('--visual-pilot');
const OUT = join(ROOT, visualPilotOnly ? 'output/thai-vocab-visual-pilot-review.csv' : 'output/thai-vocab-quality-review.csv');
const sampleSize = Math.max(1, Number(process.argv.find((arg) => arg.startsWith('--sample='))?.split('=')[1]) || 10);
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));
const rows = [['category_slug', 'category_title', 'status', 'word', 'reading', 'meaning', 'category_evidence', 'review_reason', 'duplicate_rationale', 'image_url', 'image_alt']];

const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
for (const category of categories) {
  const items = JSON.parse(readFileSync(join(DATA_DIR, 'words', `${category.slug}.json`), 'utf8'));
  const quarantined = items.filter((item) => item.content_status === 'quarantined');
  const approvedSample = items.filter((item) => item.content_status !== 'quarantined').slice(0, sampleSize);
  const selected = visualPilotOnly
    ? items.filter((item) => item.content_status !== 'quarantined' && item.image_url)
    : [...quarantined, ...approvedSample];
  for (const item of selected) {
    rows.push([
      category.slug,
      category.title,
      item.content_status ?? 'approved',
      item.word,
      item.reading,
      item.meaning,
      item.category_evidence ?? '',
      item.review_reason ?? '',
      item.duplicate_rationale ?? '',
      item.image_url ?? '',
      item.image_alt ?? '',
    ]);
  }
}
writeFileSync(OUT, `${rows.map((row) => row.map(escape).join(',')).join('\n')}\n`, 'utf8');
console.log(`✅ เขียน ${OUT}`);

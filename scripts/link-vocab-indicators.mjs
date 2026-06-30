#!/usr/bin/env node
/**
 * ใส่ indicator_code ให้ทุกหมวด (เฟส F) — round-robin ตามมาตรฐาน ท 4.1 ป.4-6
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');
const CATEGORIES = JSON.parse(
  readFileSync(join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/categories.json'), 'utf8'),
);

const DEFAULT_CODES = [
  'ท 4.1 ป.4/1', 'ท 4.1 ป.4/2', 'ท 4.1 ป.4/3', 'ท 4.1 ป.4/4',
  'ท 4.1 ป.5/1', 'ท 4.1 ป.5/2', 'ท 4.1 ป.5/3',
  'ท 4.1 ป.6/1', 'ท 4.1 ป.6/2', 'ท 4.1 ป.6/3',
];

const SLUG_CODES = {
  lesson: DEFAULT_CODES,
  spelling: ['ท 4.1 ป.4/1', 'ท 4.1 ป.4/2', 'ท 4.1 ป.5/1', 'ท 4.1 ป.5/2', 'ท 4.1 ป.6/1', 'ท 4.1 ป.6/2'],
  misspelled: ['ท 4.1 ป.4/1', 'ท 4.1 ป.4/2', 'ท 4.1 ป.5/1'],
  homophones: ['ท 4.1 ป.5/1', 'ท 4.1 ป.5/2', 'ท 4.1 ป.6/1'],
};

for (const cat of CATEGORIES) {
  const path = join(WORDS_DIR, `${cat.slug}.json`);
  const items = JSON.parse(readFileSync(path, 'utf8'));
  const codes = SLUG_CODES[cat.slug] ?? DEFAULT_CODES;
  items.forEach((item, i) => {
    if (!item.indicator_code) {
      item.indicator_code = codes[i % codes.length];
    }
  });
  writeFileSync(path, JSON.stringify(items, null, 2) + '\n', 'utf8');
  const tagged = items.filter((x) => x.indicator_code).length;
  console.log(`✅ ${cat.slug}: ${tagged}/${items.length} indicator_code`);
}

console.log('\nรัน pnpm build:vocab แล้ว seed DB');

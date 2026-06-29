#!/usr/bin/env node
/**
 * ใส่ indicator_code ให้หมวด lesson + spelling (เฟส D)
 * แจกตามมาตรฐาน ท 4.1 ป.4-6 แบบ round-robin
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');

const INDICATORS = {
  lesson: [
    'ท 4.1 ป.4/1', 'ท 4.1 ป.4/2', 'ท 4.1 ป.4/3', 'ท 4.1 ป.4/4',
    'ท 4.1 ป.5/1', 'ท 4.1 ป.5/2', 'ท 4.1 ป.5/3',
    'ท 4.1 ป.6/1', 'ท 4.1 ป.6/2', 'ท 4.1 ป.6/3',
  ],
  spelling: [
    'ท 4.1 ป.4/1', 'ท 4.1 ป.4/2', 'ท 4.1 ป.5/1', 'ท 4.1 ป.5/2', 'ท 4.1 ป.6/1', 'ท 4.1 ป.6/2',
  ],
};

for (const slug of Object.keys(INDICATORS)) {
  const path = join(WORDS_DIR, `${slug}.json`);
  const items = JSON.parse(readFileSync(path, 'utf8'));
  const codes = INDICATORS[slug];
  items.forEach((item, i) => {
    if (!item.indicator_code) {
      item.indicator_code = codes[i % codes.length];
    }
  });
  writeFileSync(path, JSON.stringify(items, null, 2) + '\n', 'utf8');
  const tagged = items.filter((x) => x.indicator_code).length;
  console.log(`✅ ${slug}: ${tagged}/${items.length} with indicator_code`);
}

console.log('\nรัน pnpm build:vocab แล้ว seed DB ถ้าต้องการ sync');

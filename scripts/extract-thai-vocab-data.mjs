#!/usr/bin/env node
/** One-time: แยก data.js เดิม → data/categories.json + data/words/*.json */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HUB = join(ROOT, 'public/games/thai/thai-vocab-hub');
const DATA_DIR = join(HUB, 'data');
const WORDS_DIR = join(DATA_DIR, 'words');

global.window = {};
eval(readFileSync(join(HUB, 'data.js'), 'utf8'));
const { categories, words } = global.window.GAME_DATA;

mkdirSync(WORDS_DIR, { recursive: true });
writeFileSync(join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2) + '\n', 'utf8');

for (const cat of categories) {
  const list = words[cat.slug] || [];
  writeFileSync(join(WORDS_DIR, `${cat.slug}.json`), JSON.stringify(list, null, 2) + '\n', 'utf8');
  console.log(`  ${cat.slug}: ${list.length} คำ`);
}

console.log(`\n✅ Extracted to ${DATA_DIR}`);

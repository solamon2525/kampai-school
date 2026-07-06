#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const HUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public/games/thai/thai-literature-hub');
const DATA_DIR = join(HUB, 'data');
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));
const words = {};
for (const cat of categories) {
  const f = join(DATA_DIR, 'items', `${cat.slug}.json`);
  if (!existsSync(f)) { console.error('Missing', f); process.exit(1); }
  words[cat.slug] = JSON.parse(readFileSync(f, 'utf8'));
}
writeFileSync(join(HUB, 'data.js'), `window.GAME_DATA = ${JSON.stringify({ categories, words }, null, 2)};\n`, 'utf8');
console.log(`✅ literature data.js — ${Object.values(words).reduce((s, a) => s + a.length, 0)} items`);

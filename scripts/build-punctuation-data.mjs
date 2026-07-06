#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HUB = join(__dirname, '..', 'public/games/thai/thai-punctuation-hub');
const DATA_DIR = join(HUB, 'data');
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));
const words = {};
for (const cat of categories) {
  const f = join(DATA_DIR, 'items', `${cat.slug}.json`);
  if (!existsSync(f)) { console.error('Missing', f); process.exit(1); }
  words[cat.slug] = JSON.parse(readFileSync(f, 'utf8'));
}
const header = `/* data.js — AUTO-GENERATED — DO NOT EDIT BY HAND */\n`;
writeFileSync(join(HUB, 'data.js'), header + `window.GAME_DATA = ${JSON.stringify({ categories, words }, null, 2)};\n`, 'utf8');
console.log(`✅ punctuation data.js — ${Object.values(words).reduce((s, a) => s + a.length, 0)} items`);

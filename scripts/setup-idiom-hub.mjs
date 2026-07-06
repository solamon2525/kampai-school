#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/games/thai/thai-grammar-hub');
const dir = join(ROOT, 'public/games/thai/thai-idiom-hub');
const slug = 'thai-idiom-hub';
const prefix = 'tih';

if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
cpSync(SRC, dir, { recursive: true });
rmSync(join(dir, 'data'), { recursive: true, force: true });
execSync('node scripts/seed-thai-idiom-data.mjs', { cwd: ROOT, stdio: 'inherit' });
execSync('node scripts/build-idiom-data.mjs', { cwd: ROOT, stdio: 'inherit' });

writeFileSync(join(dir, 'config.js'), `window.GAME_CONFIG = { SLUG: '${slug}', BGM: 'cheerful', LIVES: 5, BASE_SCORE: 10, STAR_THRESHOLDS: [50,100,150], ENABLE_ONLINE: false };\n`);

let html = readFileSync(join(dir, 'index.html'), 'utf8');
html = html
  .replace(/คลังไวยากรณ์ไทย ป\.4-5/g, 'คลังสำนวนไทย ป.4-6')
  .replace(/ชนิดของคำ · นาม · กริยา · คุณศัพท์/g, 'สุภาษิต · สำนวนชีวิต · สำนวนสัตว์ · คติสอนใจ')
  .replace(/📚 คลังไวยากรณ์ไทย ป\.4-5 — ทายชนิดคำ/g, '🗣️ คลังสำนวนไทย ป.4-6 — ทายความหมายสำนวน')
  .replace(/thai-grammar-hub/g, slug)
  .replace(/tgh-/g, `${prefix}-`)
  .replace(/🎯 ทายชนิดคำ/g, '🎯 ทายสำนวน')
  .replace(/ทายชนิดคำ/g, 'ทายสำนวน');
writeFileSync(join(dir, 'index.html'), html, 'utf8');

let js = readFileSync(join(dir, 'game.js'), 'utf8');
js = js
  .replace(/thai-grammar-hub/g, slug)
  .replace(/tgh_/g, `${prefix}_`)
  .replace(/ทายชนิดคำ/g, 'ทายสำนวน')
  .replace(/ชนิดของคำ/g, 'สำนวน');
writeFileSync(join(dir, 'game.js'), js, 'utf8');
cpSync(join(ROOT, 'public/games/thai/thai-grammar-hub/cover.png'), join(dir, 'cover.png'));
console.log(`✅ ${slug} ready`);

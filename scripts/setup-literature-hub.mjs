#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/games/thai/thai-reading-hub');
const dir = join(ROOT, 'public/games/thai/thai-literature-hub');
const slug = 'thai-literature-hub';
const prefix = 'tlh';

if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
cpSync(SRC, dir, { recursive: true });
rmSync(join(dir, 'data'), { recursive: true, force: true });
execSync('node scripts/seed-thai-literature-data.mjs', { cwd: ROOT, stdio: 'inherit' });
execSync('node scripts/build-literature-data.mjs', { cwd: ROOT, stdio: 'inherit' });

writeFileSync(join(dir, 'config.js'), `window.GAME_CONFIG = { SLUG: '${slug}', BGM: 'cheerful', LIVES: 5, BASE_SCORE: 10, STAR_THRESHOLDS: [50,100,150], ENABLE_ONLINE: false };\n`);

let html = readFileSync(join(dir, 'index.html'), 'utf8');
html = html
  .replace(/คลังอ่านจับใจความ ป\.4-5/g, 'คลังวรรณคดีวรรณกรรม ป.4-5')
  .replace(/เรื่องสั้น · ข่าวเด็ก · วิทย์ง่าย · จับใจความ/g, 'นิทาน · สุภาษิต · คำพังเพย · ข้อคิด · ตัวละคร')
  .replace(/📚 คลังอ่านจับใจความ ป\.4-5 — เรื่องสั้น · ข่าว · วิทย์/g, '📚 คลังวรรณคดีวรรณกรรม ป.4-5 — นิทาน · สุภาษิต · ข้อคิด')
  .replace(/thai-reading-hub/g, slug)
  .replace(/trh-/g, `${prefix}-`)
  .replace(/📖 อ่านแล้วตอบ/g, '📖 อ่าน+ข้อคิด');
writeFileSync(join(dir, 'index.html'), html, 'utf8');

let js = readFileSync(join(dir, 'game.js'), 'utf8');
js = js.replace(/thai-reading-hub/g, slug).replace(/trh_/g, `${prefix}_`).replace(/อ่านแล้วตอบ/g, 'อ่าน+ข้อคิด');
writeFileSync(join(dir, 'game.js'), js, 'utf8');
cpSync(join(ROOT, 'public/games/thai/thai-grammar-hub/cover.png'), join(dir, 'cover.png'));
console.log(`✅ ${slug} ready`);

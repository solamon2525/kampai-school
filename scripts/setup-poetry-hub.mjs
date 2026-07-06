#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'public/games/thai/thai-reading-hub');
const dir = join(ROOT, 'public/games/thai/thai-poetry-hub');
const slug = 'thai-poetry-hub';
const prefix = 'tpy';

if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
cpSync(SRC, dir, { recursive: true });
rmSync(join(dir, 'data'), { recursive: true, force: true });

execSync('node scripts/seed-thai-poetry-data.mjs', { cwd: ROOT, stdio: 'inherit' });
execSync('node scripts/build-poetry-data.mjs', { cwd: ROOT, stdio: 'inherit' });

writeFileSync(join(dir, 'config.js'), `window.GAME_CONFIG = { SLUG: '${slug}', BGM: 'cheerful', LIVES: 5, BASE_SCORE: 10, STAR_THRESHOLDS: [50,100,150], ENABLE_ONLINE: false };\n`);

let html = readFileSync(join(dir, 'index.html'), 'utf8');
html = html
  .replace(/คลังอ่านจับใจความ ป\.4-5/g, 'คลังบทร้อยกรรมไทย ป.4-5')
  .replace(/เรื่องสั้น · ข่าวเด็ก · วิทย์ง่าย · จับใจความ/g, 'ร้อยแก้ว · ร้อยกรอง · คำขวัญ · สัมผัส · ฉันทลักษณ์')
  .replace(/📚 คลังอ่านจับใจความ ป\.4-5 — เรื่องสั้น · ข่าว · วิทย์/g, '🎭 คลังบทร้อยกรรมไทย ป.4-5 — ท่องบท · สัมผัส')
  .replace(/thai-reading-hub/g, slug)
  .replace(/trh-/g, `${prefix}-`)
  .replace(/📖 อ่านแล้วตอบ/g, '📖 ท่อง/ตอบ')
  .replace(/href="\/games\/thai\/thai-grammar-hub/g, 'href="/games/thai/thai-punctuation-hub');
writeFileSync(join(dir, 'index.html'), html, 'utf8');

let js = readFileSync(join(dir, 'game.js'), 'utf8');
js = js
  .replace(/คลังอ่านจับใจความ ป\.4-5/g, 'คลังบทร้อยกรรมไทย ป.4-5')
  .replace(/thai-reading-hub/g, slug)
  .replace(/trh_/g, `${prefix}_`)
  .replace(/อ่านแล้วตอบ/g, 'ท่อง/ตอบ');

js = js.replace(
  "document.getElementById('reading-title').textContent = item.word + ' · ' + (item.reading || '');",
  `document.getElementById('reading-title').textContent = item.word + ' · ' + (item.reading || '');
  if (item.rhyme_hint) document.getElementById('reading-title').textContent += ' · ' + item.rhyme_hint;`,
);

js = js.replace(
  "document.getElementById('reading-passage').textContent = item.passage || item.sentence || '';",
  `const passEl = document.getElementById('reading-passage');
  passEl.textContent = item.passage || item.sentence || '';
  passEl.style.whiteSpace = 'pre-wrap';
  if (item.passage && window.KAMPAI && KAMPAI.sound && KAMPAI.sound.speak) {
    setTimeout(() => KAMPAI.sound.speak(item.passage.replace(/\\n/g, ' '), 'th-TH'), 400);
  }`,
);

// default to reading/recite mode items without questions — show TTS only quiz
js = js.replace(
  `  const qs = item.questions || [];
  if (!qs.length) {
    currentWordIndex++;
    loadReadingItem();
    return;
  }`,
  `  const qs = item.questions || [];
  if (!qs.length) {
    document.getElementById('reading-question-text').textContent = 'กดถัดไปเมื่อท่องจบแล้ว';
    document.getElementById('reading-options').innerHTML = '';
    const next = document.createElement('button');
    next.className = 'option-btn';
    next.textContent = 'ท่องจบแล้ว → ถัดไป';
    next.onclick = () => { currentWordIndex++; readingQIndex = 0; loadReadingItem(); };
    document.getElementById('reading-options').appendChild(next);
    return;
  }`,
);

writeFileSync(join(dir, 'game.js'), js, 'utf8');

let css = readFileSync(join(dir, 'style.css'), 'utf8');
if (!css.includes('.reading-passage')) {
  css += `\n.reading-passage { white-space: pre-wrap; font-size: 1.15rem; line-height: 1.8; }\n`;
  writeFileSync(join(dir, 'style.css'), css, 'utf8');
}

cpSync(join(ROOT, 'public/games/thai/thai-grammar-hub/cover.png'), join(dir, 'cover.png'));
console.log(`✅ ${slug} ready`);

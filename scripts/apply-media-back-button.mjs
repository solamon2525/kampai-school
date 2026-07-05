#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BACK_BTN = '<button type="button" class="btn btn-back" onclick="if(window.KAMPAI&&KAMPAI.goHome)KAMPAI.goHome();else history.back();">← กลับคลังสื่อ</button>';

const files = [
  'public/games/_template-media.html',
  'public/games/math/decimal-media.html',
  'public/games/math/bar-chart-media.html',
  'public/games/math/angle-media.html',
  'public/games/math/number-line-media.html',
  'public/games/science/states-of-matter.html',
  'public/games/science/vertebrate-sort.html',
  'public/games/science/digestive-system-media.html',
  'public/games/science/water-cycle.html',
  'public/games/social/thailand-map.html',
  'public/games/social/good-citizen-media.html',
  'public/games/social/sukhothai-timeline.html',
  'public/games/thai/fact-opinion.html',
  'public/games/thai/thai-word-types.html',
  'public/games/thai/thai-sara-chart.html',
  'public/games/thai/thai-matra-chart.html',
  'public/games/english/sight-words-p4.html',
  'public/games/english/follow-instructions.html',
  'public/games/english/grammar-mini.html',
  'public/games/english/phonics-chart.html',
  'public/games/health/food-label-media.html',
  'public/games/health/handwash-media.html',
  'public/games/math/times-table.html',
  'public/games/math/fraction-pieces.html',
];

for (const rel of files) {
  const p = resolve(root, rel);
  let s = readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/<a class="btn btn-back" href="\/h\/nattapong">← กลับคลังสื่อ<\/a>/g, BACK_BTN);
  s = s.replace(/body\s*\{[^}]*min-height:\s*100vh/g, (m) => m.replace('100vh', '100%'));
  if (s !== before) {
    writeFileSync(p, s);
    console.log('updated', rel);
  }
}

// rounding special case
const rounding = resolve(root, 'public/games/math/rounding.html');
let rs = readFileSync(rounding, 'utf8');
const rBefore = rs;
rs = rs.replace(
  /<a href="\/h\/nattapong" class="btn btn-back"[^>]*>[\s\S]*?<\/a>/,
  BACK_BTN.replace('btn-back"', 'btn-back" style="margin-bottom:16px;width:100%;"'),
);
if (rs !== rBefore) {
  writeFileSync(rounding, rs);
  console.log('updated public/games/math/rounding.html');
}

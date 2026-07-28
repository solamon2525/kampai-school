#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['public/games/math/clock-media.html', '/games/math/clock-media-worksheet.html'],
  ['public/games/math/thai-money-media.html', '/games/math/thai-money-media-worksheet.html'],
  ['public/games/math/geometry-3d-media.html', '/games/math/geometry-3d-media-worksheet.html'],
  ['public/games/health/brush-teeth-media.html', '/games/health/brush-teeth-media-worksheet.html'],
  ['public/games/science/light-properties-media.html', '/games/science/light-properties-media-worksheet.html'],
  ['public/games/english/sight-words-p123-media.html', '/games/english/sight-words-p123-media-worksheet.html'],
  ['public/games/english/classroom-english-media.html', '/games/english/classroom-english-media-worksheet.html'],
  ['public/games/thai/literature-short-media.html', '/games/thai/literature-short-media-worksheet.html'],
  ['public/games/social/thai-calendar-media.html', '/games/social/thai-calendar-media-worksheet.html'],
  ['public/games/science/human-organs-media.html', '/games/science/human-organs-media-worksheet.html'],
];

for (const [rel, ws] of pairs) {
  const p = resolve(root, rel);
  let html = readFileSync(p, 'utf8');
  if (html.includes(ws)) {
    console.log('skip', rel);
    continue;
  }
  const btn = `<a class="btn btn-ghost" href="${ws}" target="_blank" rel="noopener">📝 เปิดใบงาน</a>`;
  if (html.includes('id="btnFs"')) {
    html = html.replace(
      /id="btnFs">⛶ เต็มจอ<\/button>/,
      `id="btnFs">⛶ เต็มจอ</button>\n    ${btn}`,
    );
  } else {
    console.warn('no insert', rel);
    continue;
  }
  writeFileSync(p, html);
  console.log('cta', rel);
}

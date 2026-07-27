#!/usr/bin/env node
/**
 * Rasterize SVG-only game covers → PNG 1280×720 (verify:game Check 9).
 * Usage: node scripts/rasterize-game-covers-svg-to-png.mjs
 */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

/** Phase 9 games seeded in migration 434 — hub expects PNG thumbnails */
const PAIRS = [
  ['public/games/math/clock-quest-cover.svg', 'public/games/math/clock-quest-cover.png'],
  ['public/games/science/moon-phases-race-cover.svg', 'public/games/science/moon-phases-race-cover.png'],
  ['public/games/science/light-sort-cover.svg', 'public/games/science/light-sort-cover.png'],
  ['public/games/health/bone-muscle-quest-cover.svg', 'public/games/health/bone-muscle-quest-cover.png'],
  ['public/games/health/first-aid-rush-cover.svg', 'public/games/health/first-aid-rush-cover.png'],
  ['public/games/social/sufficiency-sim-cover.svg', 'public/games/social/sufficiency-sim-cover.png'],
  ['public/games/career/community-jobs-match-cover.svg', 'public/games/career/community-jobs-match-cover.png'],
  ['public/games/english/past-tense-run-cover.svg', 'public/games/english/past-tense-run-cover.png'],
  ['public/games/english/follow-instructions-lab-cover.svg', 'public/games/english/follow-instructions-lab-cover.png'],
  ['public/games/thai/fact-opinion-duel-cover.svg', 'public/games/thai/fact-opinion-duel-cover.png'],
];

/** Make SVG parseable: drop illegal controls; escape raw markup inside <text>. */
function sanitizeSvgXml(buf) {
  let s = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf);
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  s = s.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (_, attrs, content) => {
    const escaped = content
      .replace(/&(?!(#\d+|#x[\da-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<text${attrs}>${escaped}</text>`;
  });
  return Buffer.from(s, 'utf8');
}

let failed = 0;
for (const [svgPath, pngPath] of PAIRS) {
  const svg = sanitizeSvgXml(await readFile(svgPath));
  await sharp(svg).resize(1280, 720, { fit: 'fill' }).png().toFile(pngPath);
  const meta = await sharp(pngPath).metadata();
  const ok = meta.width === 1280 && meta.height === 720;
  console.log(`${ok ? 'OK' : 'FAIL'} ${pngPath} ${meta.width}x${meta.height}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.error(`\n${failed} cover(s) not 1280x720`);
  process.exit(1);
}
console.log(`\nDone: ${PAIRS.length} PNG game covers`);

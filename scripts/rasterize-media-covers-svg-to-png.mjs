#!/usr/bin/env node
/**
 * Rasterize SVG-only media covers → PNG 1280×720 (verify:media Check 9).
 * Usage: node scripts/rasterize-media-covers-svg-to-png.mjs
 */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const PAIRS = [
  ['public/games/arts/symmetry-media-cover.svg', 'public/games/arts/symmetry-media-cover.png'],
  ['public/games/english/grammar-vocab-media-cover.svg', 'public/games/english/grammar-vocab-media-cover.png'],
  ['public/games/english/past-tense-mini-media-cover.svg', 'public/games/english/past-tense-mini-media-cover.png'],
  ['public/games/english/phonics-media-cover.svg', 'public/games/english/phonics-media-cover.png'],
  ['public/games/english/sight-words-media-cover.svg', 'public/games/english/sight-words-media-cover.png'],
  ['public/games/health/exercise-care-media-cover.svg', 'public/games/health/exercise-care-media-cover.png'],
  ['public/games/health/first-aid-media-cover.svg', 'public/games/health/first-aid-media-cover.png'],
  ['public/games/math/clock-media-cover.svg', 'public/games/math/clock-media-cover.png'],
  ['public/games/math/money-change-media-cover.svg', 'public/games/math/money-change-media-cover.png'],
  ['public/games/science/light-sort-media-cover.svg', 'public/games/science/light-sort-media-cover.png'],
  ['public/games/tech/coding-social-media-cover.svg', 'public/games/tech/coding-social-media-cover.png'],
];

let failed = 0;
for (const [svgPath, pngPath] of PAIRS) {
  const svg = await readFile(svgPath);
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
console.log(`\nDone: ${PAIRS.length} PNG covers`);

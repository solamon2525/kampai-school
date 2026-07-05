#!/usr/bin/env node
/** multiply-burst cover v4 → 1280×720 full-bleed */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeTopTitleBand,
  reframeCoverSafeTop,
  COVER_W,
  COVER_H,
} from './lib/cover-safe-zone.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(
  process.env.COVER_SRC ||
    'C:/Users/Admin/.cursor/projects/d-School-kampai-school/assets/multiply-burst-cover-v4.png',
);
const dest = resolve(root, 'public/games/math/multiply-burst/cover.png');
const destFull = resolve(root, 'public/games/math/multiply-burst/cover-full.png');

const raw = await analyzeTopTitleBand(src);
console.log('Source:', raw);

const topSafe = raw.risky ? 96 : 48;
const buf = await reframeCoverSafeTop(src, topSafe);
const out = await sharp(buf).resize(COVER_W, COVER_H).png().toBuffer();
await sharp(out).toFile(dest);
await sharp(out).toFile(destFull);

const final = await analyzeTopTitleBand(dest);
console.log('Output:', dest, `${COVER_W}×${COVER_H}`, 'topSafe=', topSafe);
console.log('Final:', final);

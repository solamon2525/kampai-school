#!/usr/bin/env node
/** multiplication-rpg cover v2 → 1280×720 + safe top */
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
    'C:/Users/Admin/.cursor/projects/d-School-kampai-school/assets/multiplication-rpg-cover-v2.png',
);
const dest = resolve(root, 'public/games/math/multiplication-rpg/cover.png');

const raw = await analyzeTopTitleBand(src);
console.log('Source:', raw);

const topSafe = raw.risky ? 96 : 48;
const buf = await reframeCoverSafeTop(src, topSafe);
await sharp(buf).resize(COVER_W, COVER_H).png().toFile(dest);

const final = await analyzeTopTitleBand(dest);
console.log('Output:', dest, `${COVER_W}×${COVER_H}`, 'topSafe=', topSafe);
console.log('Final:', final);

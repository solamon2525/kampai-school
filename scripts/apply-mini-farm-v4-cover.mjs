#!/usr/bin/env node
/** One-off: v4 cover → 1280×720 + safe top → public/games/.../cover.png */
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
    'C:/Users/Admin/.cursor/projects/d-School-kampai-school/assets/mini-farm-island-cover-v4.png',
);
const dest = resolve(root, 'public/games/math/mini-farm-island/cover.png');

const raw = await analyzeTopTitleBand(src);
console.log('Source:', raw);

const buf = await reframeCoverSafeTop(src, 72);
await sharp(buf).resize(COVER_W, COVER_H).png().toFile(dest);

const final = await analyzeTopTitleBand(dest);
console.log('Output:', dest, `${COVER_W}×${COVER_H}`);
console.log('Final analysis:', final);

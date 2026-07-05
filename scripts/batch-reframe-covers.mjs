#!/usr/bin/env node
/**
 * batch-reframe-covers.mjs — reframe safe-top 96px → 1280×720
 * Usage: node scripts/batch-reframe-covers.mjs <src> <dest>
 */
import sharp from 'sharp';
import { resolve } from 'node:path';
import {
  analyzeTopTitleBand,
  reframeCoverSafeTop,
  COVER_W,
  COVER_H,
  TOP_SAFE_PX,
} from './lib/cover-safe-zone.mjs';

const src = resolve(process.argv[2]);
const dest = resolve(process.argv[3]);
const topSafe = Number(process.argv[4]) || TOP_SAFE_PX;

const before = await analyzeTopTitleBand(src);
const buf = await reframeCoverSafeTop(src, topSafe);
await sharp(buf).resize(COVER_W, COVER_H).png().toFile(dest);
const after = await analyzeTopTitleBand(dest);
console.log(JSON.stringify({ src: before, dest: after, topSafe }, null, 2));

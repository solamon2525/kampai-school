#!/usr/bin/env node
/**
 * Reframe 1280×720 cover — เพิ่มท้องฟ้าด้านบน (safe zone หัวข้อไทย) แล้วบีบกลับ 16:9
 * Usage: node scripts/reframe-cover-safe-top.mjs public/games/math/mini-farm-island/cover.png [topPx]
 */
import sharp from 'sharp';
import { rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const TOP_SAFE = Number(process.argv[3]) || 96;
const src = resolve(process.argv[2] || 'public/games/math/mini-farm-island/cover.png');
const out = src.replace(/(\.[^.]+)$/, '-safe$1');

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let r = 0, g = 0, b = 0;
for (let x = 0; x < info.width; x++) {
  const i = x * 4;
  r += data[i]; g += data[i + 1]; b += data[i + 2];
}
const sky = { r: Math.round(r / info.width), g: Math.round(g / info.width), b: Math.round(b / info.width) };

const extended = await sharp(src).extend({ top: TOP_SAFE, background: sky }).png().toBuffer();
await sharp(extended).resize(1280, 720).png().toFile(out);
await unlink(src).catch(() => {});
await rename(out, src);

const m = await sharp(src).metadata();
console.log(`✅ reframed ${src} (${m.width}×${m.height}) top safe=${TOP_SAFE}px`);

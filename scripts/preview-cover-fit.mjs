#!/usr/bin/env node
/**
 * preview-cover-fit.mjs — จำลองการ์ดเกม aspect-video ว่าปก fit เฟรมแค่ไหน
 * Usage: node scripts/preview-cover-fit.mjs public/games/math/mini-farm-island/cover.png
 */
import sharp from 'sharp';
import { resolve } from 'node:path';

const src = resolve(process.argv[2] || 'public/games/math/mini-farm-island/cover.png');
const out = src.replace(/(\.[^.]+)$/, '-card-preview$1');

// ขนาดการ์ดจริงบนหน้าเว็บ (ตัวอย่าง)
const CARD_WIDTHS = [280, 208, 160]; // grid / featured / compact thumb
const PAD = 0; // GameCoverThumb: ไม่มี padding — object-cover เต็มกรอบ

const cover = await sharp(src).resize(1280, 720).png().toBuffer();
const meta = await sharp(cover).metadata();

const rows = [];
for (const w of CARD_WIDTHS) {
  const h = Math.round(w * 9 / 16);
  const innerW = w - PAD * 2;
  const innerH = h - PAD * 2;
  // object-cover: เต็มกรอบ 16:9 (crop ถ้าไม่ตรงสัดส่วน)
  const scale = Math.max(innerW / meta.width, innerH / meta.height);
  const drawW = Math.round(meta.width * scale);
  const drawH = Math.round(meta.height * scale);
  const ox = PAD + Math.round((innerW - drawW) / 2);
  const oy = PAD + Math.round((innerH - drawH) / 2);
  rows.push({ w, h, drawW, drawH, ox, oy, fillPct: 100 });
}

// สร้าง preview 3 การ์ดเรียงกัน
const gap = 16;
const totalW = CARD_WIDTHS.reduce((a, b) => a + b, 0) + gap * (CARD_WIDTHS.length - 1);
const maxH = Math.max(...CARD_WIDTHS.map((w) => Math.round(w * 9 / 16)));
const composites = [];
let x = 0;
for (const w of CARD_WIDTHS) {
  const h = Math.round(w * 9 / 16);
  // object-cover @ 16:9 source → เต็มกรอบ ไม่ crop
  const card = await sharp(cover).resize(w, h, { fit: 'cover' }).png().toBuffer();
  composites.push({ input: card, left: x, top: 0 });
  x += w + gap;
}

await sharp({
  create: { width: totalW, height: maxH + 40, channels: 3, background: { r: 255, g: 255, b: 255 } },
})
  .composite(composites)
  .png()
  .toFile(out);

console.log('Cover file:', `${meta.width}×${meta.height} (16:9)`);
console.log('Card simulation (object-cover, full bleed):');
for (const r of rows) {
  console.log(`  card ${r.w}×${r.h}px → image ${r.drawW}×${r.drawH}px (${r.fillPct}% width fill)`);
}
console.log('Saved preview:', out.replace(resolve('.'), '.'));

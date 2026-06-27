/**
 * สร้าง sprite sheet กระต่าย thai-sara-run (Piskel 48×48 · 6 เฟรม)
 * รัน: node scripts/generate-sara-run-sprites.mjs
 * นำเข้า Piskel: File → Import → PNG → ตั้ง frame 48px
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/games/thai/assets/thai-sara-run');
const FW = 48;
const FH = 48;
const FRAMES = 6;

/** @param {Uint8ClampedArray} px */
function set(px, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= FW || y >= FH) return;
  const i = (y * FW + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

function fillRect(px, x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) set(px, xx, yy, c[0], c[1], c[2], c[3]);
}

function fillEllipse(px, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) set(px, x, y, c[0], c[1], c[2], c[3]);
    }
}

function palette(variant) {
  const blue = variant === 'blue';
  return {
    outline: blue ? [56, 189, 248, 255] : [249, 168, 212, 255],
    body: blue ? [186, 230, 253, 255] : [255, 255, 255, 255],
    earIn: blue ? [125, 211, 252, 255] : [251, 207, 232, 255],
    cheek: blue ? [147, 197, 253, 255] : [253, 164, 175, 255],
    eye: [51, 65, 85, 255],
    hi: [255, 255, 255, 255],
    nose: [244, 63, 94, 255],
    limb: blue ? [147, 197, 253, 255] : [226, 232, 240, 255],
  };
}

/** @param {0|1|2|3|4|5} pose */
function drawBunny(pose, variant) {
  const px = new Uint8ClampedArray(FW * FH * 4);
  const c = palette(variant);
  const cx = 24;
  const bob = pose === 1 ? 0 : pose === 2 ? 1 : 0;
  const cy = 28 + bob;

  // ears
  const earTilt = pose === 3 ? -2 : 0;
  fillEllipse(px, cx - 10, 10 + earTilt, 5, 11, c.body);
  fillEllipse(px, cx - 10, 10 + earTilt, 3, 8, c.earIn);
  fillEllipse(px, cx + 10, 10 - earTilt, 5, 11, c.body);
  fillEllipse(px, cx + 10, 10 - earTilt, 3, 8, c.earIn);

  // body
  fillEllipse(px, cx, cy, 14, 16, c.body);
  fillEllipse(px, cx, cy + 2, 12, 14, c.body);

  // cheeks
  fillEllipse(px, cx - 9, cy + 2, 4, 3, c.cheek);
  fillEllipse(px, cx + 9, cy + 2, 4, 3, c.cheek);

  // limbs
  const legSpread = pose === 1 ? 8 : pose === 2 ? 4 : 6;
  const armUp = pose === 3;
  const legY = cy + 14;
  fillRect(px, cx - legSpread - 3, legY, 6, 10, c.limb);
  fillRect(px, cx + legSpread - 3, legY, 6, 10, c.limb);
  if (armUp) {
    fillRect(px, cx - 16, cy - 2, 5, 12, c.limb);
    fillRect(px, cx + 11, cy - 2, 5, 12, c.limb);
  } else if (pose === 1) {
    fillRect(px, cx - 18, cy + 4, 5, 9, c.limb);
    fillRect(px, cx + 13, cy + 6, 5, 9, c.limb);
  } else {
    fillRect(px, cx - 17, cy + 5, 5, 9, c.limb);
    fillRect(px, cx + 12, cy + 5, 5, 9, c.limb);
  }

  // face
  if (pose === 4) {
    // hurt X eyes
    for (let d = -3; d <= 3; d++) {
      set(px, cx - 8 + d, cy - 4 + d, ...c.eye);
      set(px, cx - 8 - d, cy - 4 + d, ...c.eye);
      set(px, cx + 8 + d, cy - 4 + d, ...c.eye);
      set(px, cx + 8 - d, cy - 4 + d, ...c.eye);
    }
    fillRect(px, cx - 4, cy + 4, 8, 2, c.eye);
  } else if (pose === 5 || pose === 3) {
    // happy / jump ^ eyes
    for (let i = -3; i <= 3; i++) {
      set(px, cx - 8 + i, cy - 3 + Math.abs(i) - 2, ...c.eye);
      set(px, cx + 8 + i, cy - 3 + Math.abs(i) - 2, ...c.eye);
    }
    fillEllipse(px, cx, cy + 5, 3, 2, c.nose);
  } else {
    fillEllipse(px, cx - 8, cy - 3, 3, 4, c.eye);
    fillEllipse(px, cx + 8, cy - 3, 3, 4, c.eye);
    set(px, cx - 9, cy - 5, ...c.hi);
    set(px, cx + 7, cy - 5, ...c.hi);
    fillEllipse(px, cx, cy + 4, 3, 2, c.nose);
    set(px, cx - 2, cy + 7, ...c.eye);
    set(px, cx + 2, cy + 7, ...c.eye);
  }

  // outline pass (simple border on body)
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const i = (y * FW + x) * 4;
      if (px[i + 3] === 0) continue;
      const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      let edge = false;
      for (const [dx, dy] of neighbors) {
        const ni = ((y + dy) * FW + (x + dx)) * 4;
        if (y + dy < 0 || y + dy >= FH || x + dx < 0 || x + dx >= FW || px[ni + 3] === 0) {
          edge = true;
          break;
        }
      }
      if (edge) set(px, x, y, ...c.outline);
    }

  // restore inner colors (outline overwrote - redo inner on top)
  fillEllipse(px, cx, cy, 13, 15, c.body);
  fillEllipse(px, cx - 9, cy + 2, 3, 2, c.cheek);
  fillEllipse(px, cx + 9, cy + 2, 3, 2, c.cheek);
  fillEllipse(px, cx - 10, 10 + earTilt, 4, 10, c.body);
  fillEllipse(px, cx - 10, 10 + earTilt, 2, 7, c.earIn);
  fillEllipse(px, cx + 10, 10 - earTilt, 4, 10, c.body);
  fillEllipse(px, cx + 10, 10 - earTilt, 2, 7, c.earIn);

  // re-draw face on top
  if (pose === 4) {
    for (let d = -2; d <= 2; d++) {
      set(px, cx - 8 + d, cy - 4 + d, ...c.eye);
      set(px, cx - 8 - d, cy - 4 + d, ...c.eye);
      set(px, cx + 8 + d, cy - 4 + d, ...c.eye);
      set(px, cx + 8 - d, cy - 4 + d, ...c.eye);
    }
  } else if (pose === 5 || pose === 3) {
    for (let i = -2; i <= 2; i++) {
      set(px, cx - 8 + i, cy - 3 + Math.abs(i) - 1, ...c.eye);
      set(px, cx + 8 + i, cy - 3 + Math.abs(i) - 1, ...c.eye);
    }
    fillEllipse(px, cx, cy + 5, 3, 2, c.nose);
  } else {
    fillEllipse(px, cx - 8, cy - 3, 2, 3, c.eye);
    fillEllipse(px, cx + 8, cy - 3, 2, 3, c.eye);
    fillEllipse(px, cx, cy + 4, 2, 2, c.nose);
  }

  return px;
}

async function buildSheet(variant) {
  const sheet = Buffer.alloc(FW * FRAMES * FH * 4);
  for (let f = 0; f < FRAMES; f++) {
    const frame = drawBunny(/** @type {0|1|2|3|4|5} */ (f), variant);
    for (let y = 0; y < FH; y++) {
      const srcOff = y * FW * 4;
      const dstOff = (y * FW * FRAMES + f * FW) * 4;
      sheet.set(frame.subarray(srcOff, srcOff + FW * 4), dstOff);
    }
  }
  return sharp(sheet, { raw: { width: FW * FRAMES, height: FH, channels: 4 } }).png().toBuffer();
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'bunny-white-sheet.png'), await buildSheet('white'));
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), await buildSheet('blue'));
writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  frameWidth: FW,
  frameHeight: FH,
  frames: ['idle', 'runA', 'runB', 'jump', 'hurt', 'happy'],
  piskel: 'Import PNG → Resize frames 48×48 → แก้สี/ท่า → Export sprite sheet',
  regenerate: 'node scripts/generate-sara-run-sprites.mjs',
}, null, 2));

console.log('✅ sprites → public/games/thai/assets/thai-sara-run/');

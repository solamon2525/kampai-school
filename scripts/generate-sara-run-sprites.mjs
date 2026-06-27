/**
 * thai-sara-run · side-view bunny sprites @ 128×128 (12 frames)
 * รัน: node scripts/generate-sara-run-sprites.mjs
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/games/thai/assets/thai-sara-run');
const FW = 128;
const FH = 128;
const FRAMES = 12;

const FRAME_NAMES = [
  'idle', 'idle2', 'run1', 'run2', 'run3', 'run4',
  'jumpUp', 'jumpPeak', 'jumpFall', 'hurt', 'happy', 'land',
];

/** @typedef {{ bob:number, headX:number, bodyTilt:number, backLeg:number, frontLeg:number, frontArm:number, backArm:number, earSwing:number, eye:'normal'|'happy'|'hurt'|'blink', mouth:'smile'|'open'|'sad'|'o', tail:number }} Pose */

/** @param {Uint8ClampedArray} px */
function set(px, x, y, c) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= FW || yi >= FH) return;
  const i = (yi * FW + xi) * 4;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
}

function fillEllipse(px, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) set(px, x, y, c);
    }
}

function fillRoundRect(px, x, y, w, h, r, c) {
  fillEllipse(px, x + r, y + r, r, r, c);
  fillEllipse(px, x + w - r, y + r, r, r, c);
  fillEllipse(px, x + r, y + h - r, r, r, c);
  fillEllipse(px, x + w - r, y + h - r, r, r, c);
  for (let yy = y + r; yy <= y + h - r; yy++)
    for (let xx = x; xx <= x + w; xx++) set(px, xx, yy, c);
  for (let xx = x + r; xx <= x + w - r; xx++)
    for (let yy = y; yy <= y + h; yy++) set(px, xx, yy, c);
}

function strokeLine(px, x0, y0, x1, y1, thick, c) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (let dy = -thick; dy <= thick; dy++)
      for (let dx = -thick; dx <= thick; dx++)
        if (dx * dx + dy * dy <= thick * thick) set(px, x + dx, y + dy, c);
  }
}

function palette(variant) {
  const blue = variant === 'blue';
  return {
    outline: blue ? [14, 116, 178, 255] : [190, 24, 93, 255],
    body: blue ? [186, 230, 253, 255] : [255, 255, 255, 255],
    bodyShade: blue ? [125, 211, 252, 255] : [241, 245, 249, 255],
    earOut: blue ? [147, 197, 253, 255] : [255, 255, 255, 255],
    earIn: blue ? [56, 189, 248, 255] : [251, 207, 232, 255],
    cheek: blue ? [96, 165, 250, 255] : [253, 164, 175, 255],
    paw: blue ? [191, 219, 254, 255] : [248, 250, 252, 255],
    eye: [30, 41, 59, 255],
    hi: [255, 255, 255, 255],
    nose: [244, 63, 94, 255],
    tail: blue ? [147, 197, 253, 255] : [255, 255, 255, 255],
  };
}

/** @param {number} frameIdx @param {string} variant */
function poseForFrame(frameIdx) {
  /** @type {Pose} */
  const base = {
    bob: 0, headX: 0, bodyTilt: 0, backLeg: 0, frontLeg: 0,
    frontArm: 0, backArm: 0, earSwing: 0, eye: 'normal', mouth: 'smile', tail: 0,
  };
  switch (frameIdx) {
    case 0: return { ...base };
    case 1: return { ...base, bob: 2, eye: 'blink', earSwing: 0.05 };
    case 2: return { ...base, bob: 1, backLeg: -28, frontLeg: 22, frontArm: 18, backArm: -8, earSwing: 0.12, bodyTilt: 0.04 };
    case 3: return { ...base, bob: 0, backLeg: -8, frontLeg: 8, frontArm: 8, backArm: 4, earSwing: 0.08, bodyTilt: 0.02 };
    case 4: return { ...base, bob: 1, backLeg: 18, frontLeg: -22, frontArm: -12, backArm: 14, earSwing: 0.14, bodyTilt: -0.02 };
    case 5: return { ...base, bob: 0, backLeg: 26, frontLeg: -10, frontArm: -6, backArm: 20, earSwing: 0.1, bodyTilt: -0.04 };
    case 6: return { ...base, bob: 4, backLeg: 12, frontLeg: 14, frontArm: 24, backArm: 10, earSwing: -0.15, mouth: 'o' };
    case 7: return { ...base, bob: -4, backLeg: -18, frontLeg: -14, frontArm: -28, backArm: -22, earSwing: -0.22, eye: 'happy', mouth: 'open' };
    case 8: return { ...base, bob: -2, backLeg: 10, frontLeg: 6, frontArm: -8, backArm: 6, earSwing: 0.05, eye: 'normal' };
    case 9: return { ...base, bob: 3, eye: 'hurt', mouth: 'sad', backLeg: 20, frontLeg: -16, earSwing: 0.2, bodyTilt: 0.08 };
    case 10: return { ...base, bob: -3, eye: 'happy', mouth: 'open', backLeg: -10, frontLeg: -8, frontArm: -20, earSwing: -0.18 };
    case 11: return { ...base, bob: 5, backLeg: 24, frontLeg: 20, bodyTilt: 0.06, earSwing: 0.06 };
    default: return base;
  }
}

/** Side view · หันขวา (เกม flip เมื่อ face=-1) */
function drawSideBunny(frameIdx, variant) {
  const px = new Uint8ClampedArray(FW * FH * 4);
  const c = palette(variant);
  const p = poseForFrame(frameIdx);
  const ground = 108 + p.bob;
  const headCx = 46 + p.headX;
  const headCy = 52 + p.bob;
  const bodyCx = 72;
  const bodyCy = 78 + p.bob;

  // tail (back)
  fillEllipse(px, 104 + p.tail, bodyCy - 6, 12, 11, c.tail);
  fillEllipse(px, 106 + p.tail, bodyCy - 6, 8, 7, c.body);

  // back leg + paw
  const backKneeX = bodyCx - 8;
  const backKneeY = bodyCy + 14;
  const backFootX = backKneeX + Math.sin(p.backLeg * Math.PI / 180) * 22;
  const backFootY = ground - 4;
  strokeLine(px, backKneeX, backKneeY, backFootX, backFootY, 5, c.paw);
  fillEllipse(px, backFootX, backFootY + 2, 10, 6, c.paw);
  fillEllipse(px, backFootX, backFootY + 2, 7, 4, c.bodyShade);

  // body (ใหญ่ — ท้องกลม)
  fillEllipse(px, bodyCx, bodyCy, 30, 26, c.body);
  fillEllipse(px, bodyCx + 4, bodyCy + 4, 24, 18, c.bodyShade);

  // back arm
  const backArmX = bodyCx - 4;
  const backArmY = bodyCy - 2;
  strokeLine(px, backArmX, backArmY, backArmX - 8, backArmY + 14 + p.backArm, 4, c.paw);

  // head (ใหญ่ — มุมข้าง)
  fillEllipse(px, headCx, headCy, 28, 26, c.body);
  fillEllipse(px, headCx + 2, headCy + 4, 22, 20, c.bodyShade);

  // ear (ข้างเดียว — ยาว)
  const earBaseX = headCx - 6;
  const earBaseY = headCy - 18;
  const earTipX = earBaseX - 10 + p.earSwing * 20;
  const earTipY = earBaseY - 38 + p.earSwing * 10;
  strokeLine(px, earBaseX, earBaseY, earTipX, earTipY, 7, c.earOut);
  strokeLine(px, earBaseX + 2, earBaseY, earTipX + 4, earTipY + 6, 4, c.earIn);

  // front leg
  const frontKneeX = bodyCx + 14;
  const frontKneeY = bodyCy + 16;
  const frontFootX = frontKneeX + Math.sin(p.frontLeg * Math.PI / 180) * 24;
  const frontFootY = ground - 3;
  strokeLine(px, frontKneeX, frontKneeY, frontFootX, frontFootY, 5, c.paw);
  fillEllipse(px, frontFootX, frontFootY + 2, 11, 7, c.paw);
  fillEllipse(px, frontFootX, frontFootY + 2, 8, 5, c.body);

  // front arm / paw
  const frontArmX = bodyCx + 18;
  const frontArmY = bodyCy + 2;
  strokeLine(px, frontArmX, frontArmY, frontArmX + 12, frontArmY + 16 + p.frontArm, 4, c.paw);
  fillEllipse(px, frontArmX + 12, frontArmY + 18 + p.frontArm, 8, 7, c.paw);

  // cheek (มุมข้าง)
  fillEllipse(px, headCx + 14, headCy + 8, 8, 6, c.cheek);

  // snout bump
  fillEllipse(px, headCx + 24, headCy + 10, 10, 8, c.body);
  fillEllipse(px, headCx + 30, headCy + 12, 5, 4, c.nose);

  // eye (ข้างเดียว)
  const eyeX = headCx + 10;
  const eyeY = headCy - 2;
  if (p.eye === 'hurt') {
    strokeLine(px, eyeX - 5, eyeY - 5, eyeX + 1, eyeY + 1, 2, c.eye);
    strokeLine(px, eyeX - 5, eyeY + 1, eyeX + 1, eyeY - 5, 2, c.eye);
  } else if (p.eye === 'happy') {
    strokeLine(px, eyeX - 6, eyeY + 2, eyeX, eyeY - 4, 2.5, c.eye);
    strokeLine(px, eyeX, eyeY - 4, eyeX + 6, eyeY + 2, 2.5, c.eye);
  } else if (p.eye === 'blink') {
    strokeLine(px, eyeX - 5, eyeY, eyeX + 5, eyeY, 2.5, c.eye);
  } else {
    fillEllipse(px, eyeX, eyeY, 5, 7, c.eye);
    set(px, eyeX - 1, eyeY - 3, c.hi);
  }

  // mouth
  const mouthX = headCx + 22;
  const mouthY = headCy + 16;
  if (p.mouth === 'open') {
    fillEllipse(px, mouthX, mouthY + 2, 6, 5, c.nose);
    fillEllipse(px, mouthX, mouthY + 1, 4, 2, [255, 255, 255, 255]);
  } else if (p.mouth === 'sad') {
    strokeLine(px, mouthX - 4, mouthY + 4, mouthX + 4, mouthY, 2, c.eye);
  } else if (p.mouth === 'o') {
    fillEllipse(px, mouthX, mouthY + 2, 4, 5, c.eye);
  } else {
    strokeLine(px, mouthX - 4, mouthY + 2, mouthX + 2, mouthY + 4, 2, c.eye);
    strokeLine(px, mouthX + 2, mouthY + 4, mouthX + 5, mouthY + 1, 2, c.eye);
  }

  // outline บาง ๆ (ไม่ทับใบหน้า)
  for (const [cx, cy, rx, ry] of [[headCx, headCy, 28, 26], [bodyCx, bodyCy, 30, 26]]) {
    for (let a = 0; a < Math.PI * 2; a += 0.08) {
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      set(px, x, y, c.outline);
    }
  }

  return px;
}

async function buildSheet(variant) {
  const sheet = Buffer.alloc(FW * FRAMES * FH * 4);
  for (let f = 0; f < FRAMES; f++) {
    const frame = drawSideBunny(f, variant);
    for (let y = 0; y < FH; y++) {
      const srcOff = y * FW * 4;
      const dstOff = (y * FW * FRAMES + f * FW) * 4;
      sheet.set(frame.subarray(srcOff, srcOff + FW * 4), dstOff);
    }
  }
  return sharp(sheet, { raw: { width: FW * FRAMES, height: FH, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'bunny-white-sheet.png'), await buildSheet('white'));
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), await buildSheet('blue'));
writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  frameWidth: FW,
  frameHeight: FH,
  frameCount: FRAMES,
  frames: FRAME_NAMES,
  view: 'side-right (flip in game when moving left)',
  displaySize: { w: 88, h: 96 },
  piskel: `Import PNG → ${FW}px per frame · ${FRAMES} columns`,
  regenerate: 'node scripts/generate-sara-run-sprites.mjs',
}, null, 2));

console.log(`✅ ${FRAMES}× side-view sprites ${FW}×${FH} → ${OUT}`);

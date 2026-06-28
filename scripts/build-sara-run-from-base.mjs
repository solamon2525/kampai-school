/**
 * ใช้ bunny-base.png (เฟรมเดียว) → สร้าง idle / เดิน / วิ่ง / กระโดด
 * รัน: node scripts/build-sara-run-from-base.mjs
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/games/thai/assets/thai-sara-run');
const BASE = join(OUT, 'bunny-base.png');
const FW = 128;
const FH = 128;
const FRAMES = 12;

const FRAME_NAMES = [
  'idle', 'walk1', 'walk2', 'run1', 'run2', 'run3', 'run4',
  'jumpUp', 'jumpPeak', 'jumpFall', 'hurt', 'happy',
];

/** @typedef {{ bob:number, lDx:number, lDy:number, rDx:number, rDy:number, squash:number }} Pose */

function isChecker(r, g, b) {
  if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 120 && r < 252) return true;
  if (b > g + 8 && b > r + 8 && b > 150 && b < 252) return true;
  return false;
}

function floodRemoveBg(rgba, w, h) {
  const px = Buffer.from(rgba);
  const vis = new Uint8Array(w * h);
  const q = [];

  function trySeed(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = y * w + x;
    if (vis[i]) return;
    const o = i * 4;
    if (!isChecker(px[o], px[o + 1], px[o + 2])) return;
    vis[i] = 1;
    q.push(i);
  }

  for (let x = 0; x < w; x++) { trySeed(x, 0); trySeed(x, h - 1); }
  for (let y = 0; y < h; y++) { trySeed(0, y); trySeed(w - 1, y); }

  while (q.length) {
    const i = q.pop();
    const x = i % w, y = (i / w) | 0;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (vis[ni]) continue;
      const o = ni * 4;
      if (!isChecker(px[o], px[o + 1], px[o + 2])) continue;
      vis[ni] = 1;
      q.push(ni);
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (vis[i]) px[i * 4 + 3] = 0;
  }
  return px;
}

function stripChecker(buf) {
  return buf;
}

function trimBounds(rgba, w, h) {
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX) return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  return { minX, minY, maxX, maxY };
}

function emptyCanvas() {
  return Buffer.alloc(FW * FH * 4);
}

function getPx(buf, w, x, y) {
  if (x < 0 || x >= w || y < 0 || y >= FH) return [0, 0, 0, 0];
  const i = (y * w + x) * 4;
  return [buf[i], buf[i + 1], buf[i + 2], buf[i + 3]];
}

function setPx(buf, w, x, y, r, g, b, a) {
  if (x < 0 || x >= w || y < 0 || y >= FH) return;
  const i = (y * w + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}

function blitPixel(dst, w, src, sx, sy, dx, dy) {
  const [r, g, b, a] = getPx(src, w, sx, sy);
  if (a < 10) return;
  const [dr, dg, db, da] = getPx(dst, w, dx, dy);
  if (a >= da) setPx(dst, w, dx, dy, r, g, b, a);
}

/** วาง ขา → ตัวบน (layer ถูกต้อง) */
function composePose(base, legY, midX, pose) {
  const out = emptyCanvas();
  const { bob, lDx, lDy, rDx, rDy, squash } = pose;

  for (let y = legY; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const [, , , a] = getPx(base, FW, x, y);
      if (a < 10) continue;
      if (x <= midX) blitPixel(out, FW, base, x, y, x + lDx, y + lDy);
      else blitPixel(out, FW, base, x, y, x + rDx, y + rDy);
    }
  }

  for (let y = 0; y < legY; y++) {
    for (let x = 0; x < FW; x++) {
      const [, , , a] = getPx(base, FW, x, y);
      if (a < 10) continue;
      blitPixel(out, FW, base, x, y, x, y + bob + squash);
    }
  }
  return out;
}

async function loadBaseToCanvas(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  const cleared = floodRemoveBg(px, info.width, info.height);

  const b = trimBounds(cleared, info.width, info.height);
  const pad = 2;
  const cw = b.maxX - b.minX + 1 + pad * 2;
  const ch = b.maxY - b.minY + 1 + pad * 2;
  const crop = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const sx = b.minX - pad + x;
      const sy = b.minY - pad + y;
      const di = (y * cw + x) * 4;
      if (sx < 0 || sy < 0 || sx >= info.width || sy >= info.height) continue;
      const si = (sy * info.width + sx) * 4;
      crop[di] = cleared[si]; crop[di + 1] = cleared[si + 1]; crop[di + 2] = cleared[si + 2]; crop[di + 3] = cleared[si + 3];
    }
  }

  const scale = Math.min((FW - 10) / cw, (FH - 10) / ch);
  const dw = Math.max(1, Math.round(cw * scale));
  const dh = Math.max(1, Math.round(ch * scale));
  const resized = await sharp(crop, { raw: { width: cw, height: ch, channels: 4 } })
    .resize(dw, dh, { kernel: 'nearest' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const canvas = emptyCanvas();
  const dx = Math.round((FW - dw) / 2);
  const dy = FH - dh - 6;
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const si = (y * dw + x) * 4;
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || tx >= FW || ty < 0 || ty >= FH) continue;
      const di = (ty * FW + tx) * 4;
      if (resized[si + 3] < 10) continue;
      canvas[di] = resized[si];
      canvas[di + 1] = resized[si + 1];
      canvas[di + 2] = resized[si + 2];
      canvas[di + 3] = resized[si + 3];
    }
  }

  const bb = trimBounds(canvas, FW, FH);
  const legY = bb.minY + Math.round((bb.maxY - bb.minY) * 0.68);
  const midX = Math.round((bb.minX + bb.maxX) / 2) - 2;
  return { canvas, legY, midX };
}

function poseForFrame(f) {
  /** @type {Pose} */
  const z = { bob: 0, lDx: 0, lDy: 0, rDx: 0, rDy: 0, squash: 0 };
  switch (f) {
    case 0: return z;
    case 1: return { bob: -1, lDx: 5, lDy: 0, rDx: -4, rDy: 1, squash: 0 };
    case 2: return { bob: 0, lDx: -4, lDy: 1, rDx: 5, rDy: 0, squash: 0 };
    case 3: return { bob: -1, lDx: 6, lDy: -1, rDx: -5, rDy: 0, squash: -1 };
    case 4: return { bob: -3, lDx: 1, lDy: -4, rDx: 2, rDy: -4, squash: 1 };
    case 5: return { bob: -1, lDx: -5, lDy: 0, rDx: 6, rDy: -1, squash: -1 };
    case 6: return { bob: 0, lDx: -2, lDy: -3, rDx: 3, rDy: -3, squash: 0 };
    case 7: return { bob: -3, lDx: -2, lDy: 2, rDx: 2, rDy: 2, squash: -1 };
    case 8: return { bob: -4, lDx: 1, lDy: 4, rDx: -1, rDy: 4, squash: 1 };
    case 9: return { bob: -2, lDx: -3, lDy: 0, rDx: 4, rDy: 0, squash: 0 };
    default: return z;
  }
}

function tintBlue(rgba) {
  const px = Buffer.from(rgba);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 20) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const lum = (r + g + b) / 3;
    if (lum > 175 && r > 150) {
      px[i] = Math.min(255, 170 + (r - 170) * 0.35);
      px[i + 1] = Math.min(255, 205 + (g - 170) * 0.25);
      px[i + 2] = Math.min(255, 252);
    } else if (lum > 110) {
      px[i] = Math.min(255, r * 0.78);
      px[i + 1] = Math.min(255, g * 0.88 + 15);
      px[i + 2] = Math.min(255, b * 0.95 + 35);
    }
  }
  return px;
}

async function buildFramesFromBase(basePath) {
  const { canvas, legY, midX } = await loadBaseToCanvas(basePath);
  const frames = [];

  for (let f = 0; f < FRAMES; f++) {
    if (f <= 9) {
      frames.push(composePose(canvas, legY, midX, poseForFrame(f)));
    } else if (f === 10) {
      frames.push(composePose(canvas, legY, midX, { bob: 2, lDx: 2, lDy: 1, rDx: -2, rDy: 1, squash: 1 }));
    } else {
      frames.push(composePose(canvas, legY, midX, { bob: -2, lDx: -2, lDy: -2, rDx: 2, rDy: -2, squash: 0 }));
    }
  }
  return frames;
}

async function buildSheet(frames, tint = false) {
  const outFrames = tint ? frames.map(tintBlue) : frames;
  const sheet = Buffer.alloc(FW * FRAMES * FH * 4);
  for (let f = 0; f < FRAMES; f++) {
    for (let y = 0; y < FH; y++) {
      sheet.set(outFrames[f].subarray(y * FW * 4, y * FW * 4 + FW * 4), (y * FW * FRAMES + f * FW) * 4);
    }
  }
  const sheetPng = await sharp(sheet, { raw: { width: FW * FRAMES, height: FH, channels: 4 } }).png().toBuffer();
  const pngs = [];
  for (const px of outFrames) {
    pngs.push(await sharp(px, { raw: { width: FW, height: FH, channels: 4 } }).png().toBuffer());
  }
  return { sheetPng, pngs };
}

function buildPiskel(name, pngs) {
  const chunks = pngs.map((buf, frame) => ({ layout: [[frame]], base64PNG: buf.toString('base64') }));
  return JSON.stringify({
    modelVersion: 2,
    piskel: {
      name,
      description: 'thai-sara-run · bunny-base walk/run/jump',
      fps: 10,
      height: FH,
      width: FW,
      layers: [JSON.stringify({ name: 'Layer 1', opacity: 1, frameCount: pngs.length, chunks })],
      hiddenFrames: [],
    },
  }, null, 2);
}

async function buildPreview(sheetPng) {
  const scale = 2;
  const pad = 10;
  const cols = 6;
  const cell = FW * scale + pad;
  const pw = cols * cell + pad;
  const ph = 2 * (FH * scale + pad + 20) + pad;
  const bg = Buffer.alloc(pw * ph * 4);
  for (let i = 0; i < pw * ph; i++) {
    bg[i * 4] = 186; bg[i * 4 + 1] = 230; bg[i * 4 + 2] = 253; bg[i * 4 + 3] = 255;
  }
  const composites = [];
  for (let f = 0; f < FRAMES; f++) {
    const col = f % cols;
    const row = Math.floor(f / cols);
    const frameBuf = await sharp(sheetPng)
      .extract({ left: f * FW, top: 0, width: FW, height: FH })
      .resize(FW * scale, FH * scale, { kernel: 'nearest' })
      .png().toBuffer();
    composites.push({ input: frameBuf, left: pad + col * cell, top: 28 + row * (FH * scale + pad + 20) });
  }
  await sharp(bg, { raw: { width: pw, height: ph, channels: 4 } })
    .composite(composites)
    .png()
    .toFile(join(OUT, 'preview.png'));
}

function writePreviewHtml() {
  writeFileSync(join(OUT, 'preview.html'), `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview · กระต่าย thai-sara-run</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:linear-gradient(180deg,#fce7f3,#e0f2fe);padding:20px;color:#334155}
h1{color:#be185d;font-size:1.3rem} p{margin:8px 0 16px;color:#64748b;font-size:.88rem}
.card{background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;border:3px solid #fbcfe8}
canvas{display:block;margin:0 auto;image-rendering:pixelated;background:linear-gradient(#bae6fd 60%,#86efac);border-radius:10px;border:2px solid #e2e8f0}
.row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.box{text-align:center;font-size:.7rem;color:#94a3b8;margin-top:4px}
img{max-width:100%;image-rendering:pixelated;border-radius:10px;border:2px solid #e2e8f0;margin-top:8px}
</style></head><body>
<h1>🐰 กระต่ายจาก bunny-base · thai-sara-run</h1>
<p>128×128 · ท่าเดินวาดจากเฟรมฐาน</p>
<div class="card"><div class="row">
<div><canvas id="idle" width="256" height="256"></canvas><div class="box">ยืน</div></div>
<div><canvas id="walk" width="256" height="256"></canvas><div class="box">เดิน</div></div>
<div><canvas id="run" width="256" height="256"></canvas><div class="box">วิ่ง</div></div>
<div><canvas id="jump" width="256" height="256"></canvas><div class="box">กระโดด</div></div>
</div></div>
<div class="card"><img src="preview.png?v=3" alt="preview"><img src="bunny-white-sheet.png?v=3" alt="sheet"></div>
<script>
const W=128,H=128,WALK=[1,2],RUN=[3,4,5,6],JUMP=[7,8,9];
function load(s){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s+'?v=3';});}
function loop(c,s,fr,fps){const x=c.getContext('2d');x.imageSmoothingEnabled=false;let n=0,t=0;const sc=c.width/W;
(function tick(now){if(now-t>1000/fps){t=now;n=(n+1)%fr.length;}x.clearRect(0,0,c.width,c.height);
x.drawImage(s,fr[n]*W,0,W,H,0,0,W*sc,H*sc);requestAnimationFrame(tick);})(0);}
function hold(c,s,f){const x=c.getContext('2d');x.imageSmoothingEnabled=false;const sc=c.width/W;
x.drawImage(s,f*W,0,W,H,0,0,W*sc,H*sc);}
load('bunny-white-sheet.png').then(s=>{
hold(document.getElementById('idle'),s,0);loop(document.getElementById('walk'),s,WALK,5);
loop(document.getElementById('run'),s,RUN,10);loop(document.getElementById('jump'),s,JUMP,8);});
</script></body></html>`, 'utf8');
}

// ── main ──
mkdirSync(OUT, { recursive: true });
const basePath = process.argv[2] || BASE;
if (!existsSync(basePath)) {
  console.error('ไม่พบ', basePath);
  process.exit(1);
}

const frames = await buildFramesFromBase(basePath);
const white = await buildSheet(frames, false);
const blue = await buildSheet(frames, true);

writeFileSync(join(OUT, 'bunny-white-sheet.png'), white.sheetPng);
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), blue.sheetPng);
writeFileSync(join(OUT, 'bunny-white.piskel'), buildPiskel('bunny-white', white.pngs));
writeFileSync(join(OUT, 'bunny-blue.piskel'), buildPiskel('bunny-blue', blue.pngs));
writePreviewHtml();
await buildPreview(white.sheetPng);

writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  model: 'bunny-base derived · side chibi + hat',
  source: 'bunny-base.png',
  frameWidth: FW,
  frameHeight: FH,
  frameCount: FRAMES,
  frames: FRAME_NAMES,
  regenerate: 'node scripts/build-sara-run-from-base.mjs',
}, null, 2));

console.log('✅ Built from bunny-base →', OUT);

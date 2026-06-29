/**
 * นำภาพอ้างอิงกระต่าย (4×3 grid) → sprite sheet สำหรับ thai-sara-run
 * รัน: node scripts/import-sara-run-reference.mjs
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/games/thai/assets/thai-sara-run');
const REF = join(ROOT, 'public/games/thai/assets/thai-sara-run/reference-bunny.png');
const FW = 128;
const FH = 128;
const FRAMES = 12;

/** ลำดับเฟรมในเกม → index ใน grid 4×3 (row-major) */
const GAME_TO_GRID = [
  2,  // 0 idle
  6,  // 1 walk1
  7,  // 2 walk2
  3,  // 3 run1
  5,  // 4 run2
  6,  // 5 run3 (ไม่ใช้เฟรมที่มีพื้นหญ้า)
  7,  // 6 run4
  8,  // 7 jumpUp
  8,  // 8 jumpPeak
  8,  // 9 jumpFall
  1,  // 10 hurt
  4,  // 11 happy
];

const FRAME_NAMES = [
  'idle', 'walk1', 'walk2', 'run1', 'run2', 'run3', 'run4',
  'jumpUp', 'jumpPeak', 'jumpFall', 'hurt', 'happy',
];

function isBackground(r, g, b) {
  // checkerboard teal/cyan
  if (b > 120 && g > 100 && r < 140 && Math.abs(g - b) < 50) return true;
  // grass greens (เข้มขึ้นเล็กน้อย ไม่กินตัวขาว)
  if (g > 95 && g > r + 22 && g > b + 12 && r < 110) return true;
  // earth / rock blocks (เฉพาะโทนน้ำตาล/ม่วง ไม่กินหมวกส้ม)
  if (r > 70 && r < 165 && g > 45 && g < 130 && b > 50 && b < 150) {
    if (g < r - 5 && Math.abs(r - b) < 55) return true;
  }
  return false;
}

function makeTransparent(rgba, w, h) {
  const px = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const r = px[o], g = px[o + 1], b = px[o + 2];
    if (isBackground(r, g, b)) {
      px[o + 3] = 0;
    }
  }
  return px;
}

function trimBounds(rgba, w, h, pad = 4) {
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
  if (maxX < minX) return { left: 0, top: 0, width: w, height: h };
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.max(1, Math.min(w - left, maxX - minX + 1 + pad * 2));
  const height = Math.max(1, Math.min(h - top, maxY - minY + 1 + pad * 2));
  return { left, top, width, height };
}

function tintBlue(rgba) {
  const px = Buffer.from(rgba);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 20) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const lum = (r + g + b) / 3;
    // ขาว/อ่อน → ฟ้า · สีเข้ม (หมวก/เส้น) คงเดิมบางส่วน
    if (lum > 180 && r > 160 && g > 160 && b > 160) {
      px[i] = Math.min(255, 180 + (r - 180) * 0.3);
      px[i + 1] = Math.min(255, 210 + (g - 180) * 0.2);
      px[i + 2] = Math.min(255, 250);
    } else if (lum > 120 && r > 100) {
      px[i] = Math.min(255, r * 0.75);
      px[i + 1] = Math.min(255, g * 0.85 + 20);
      px[i + 2] = Math.min(255, b * 0.95 + 40);
    }
  }
  return px;
}

function flipH(rgba, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = (y * w + (w - 1 - x)) * 4;
      out[di] = rgba[si];
      out[di + 1] = rgba[si + 1];
      out[di + 2] = rgba[si + 2];
      out[di + 3] = rgba[si + 3];
    }
  }
  return out;
}

async function extractGridFrame(srcPath, metaW, metaH, gridIdx, flip = true) {
  const cols = 4, rows = 3;
  const cw = Math.floor(metaW / cols);
  const ch = Math.floor(metaH / rows);
  const col = gridIdx % cols;
  const row = Math.floor(gridIdx / cols);

  const { data, info } = await sharp(srcPath)
    .extract({ left: col * cw, top: row * ch, width: cw, height: ch })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparent = makeTransparent(data, info.width, info.height);
  let bounds = trimBounds(transparent, info.width, info.height, 6);
  if (bounds.width < 8 || bounds.height < 8) {
    bounds = { left: 0, top: 0, width: info.width, height: info.height };
  }

  const trimmed = await sharp(transparent, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(bounds)
    .png()
    .toBuffer();

  // ใส่กลาง canvas FW×FH — ยื่นขาไว้ด้านล่าง
  const meta = await sharp(trimmed).metadata();
  const scale = Math.min((FW - 8) / meta.width, (FH - 8) / meta.height);
  const dw = Math.round(meta.width * scale);
  const dh = Math.round(meta.height * scale);
  const dx = Math.round((FW - dw) / 2);
  const dy = FH - dh - 4; // anchor ขา

  const canvas = Buffer.alloc(FW * FH * 4);
  const resized = await sharp(trimmed)
    .resize(dw, dh, { kernel: 'nearest' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const si = (y * dw + x) * 4;
      const tx = dx + x, ty = dy + y;
      if (tx < 0 || tx >= FW || ty < 0 || ty >= FH) continue;
      const di = (ty * FW + tx) * 4;
      const a = resized[si + 3];
      if (a < 10) continue;
      canvas[di] = resized[si];
      canvas[di + 1] = resized[si + 1];
      canvas[di + 2] = resized[si + 2];
      canvas[di + 3] = a;
    }
  }

  return flip ? flipH(canvas, FW, FH) : canvas;
}

async function buildSheet(srcPath, metaW, metaH, tint = false) {
  const frames = [];
  for (let g = 0; g < FRAMES; g++) {
    const gridIdx = GAME_TO_GRID[g];
    let px = await extractGridFrame(srcPath, metaW, metaH, gridIdx, g !== 11);
    if (tint) px = tintBlue(px);
    frames.push(px);
  }

  const sheet = Buffer.alloc(FW * FRAMES * FH * 4);
  for (let f = 0; f < FRAMES; f++) {
    for (let y = 0; y < FH; y++) {
      const srcOff = y * FW * 4;
      const dstOff = (y * FW * FRAMES + f * FW) * 4;
      sheet.set(frames[f].subarray(srcOff, srcOff + FW * 4), dstOff);
    }
  }

  const sheetPng = await sharp(sheet, { raw: { width: FW * FRAMES, height: FH, channels: 4 } }).png().toBuffer();
  const pngs = [];
  for (const px of frames) {
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
      description: 'thai-sara-run · reference bunny · side view + hat',
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
<h1>🐰 กระต่ายอ้างอิง · thai-sara-run</h1>
<p>128×128 · มุมข้าง + หมวก · เดิน / วิ่ง / กระโดด</p>
<div class="card"><div class="row">
<div><canvas id="idle" width="256" height="256"></canvas><div class="box">ยืน</div></div>
<div><canvas id="walk" width="256" height="256"></canvas><div class="box">เดิน</div></div>
<div><canvas id="run" width="256" height="256"></canvas><div class="box">วิ่ง</div></div>
<div><canvas id="jump" width="256" height="256"></canvas><div class="box">กระโดด</div></div>
</div></div>
<div class="card"><img src="preview.png" alt="preview"><img src="bunny-white-sheet.png" alt="sheet"></div>
<script>
const W=128,H=128,WALK=[1,2],RUN=[3,4,5,6],JUMP=[7,8,9];
function load(s){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s;});}
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

const srcPath = process.argv[2] || REF;
const meta = await sharp(srcPath).metadata();

const white = await buildSheet(srcPath, meta.width, meta.height, false);
const blue = await buildSheet(srcPath, meta.width, meta.height, true);

writeFileSync(join(OUT, 'bunny-white-sheet.png'), white.sheetPng);
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), blue.sheetPng);
writeFileSync(join(OUT, 'bunny-white.piskel'), buildPiskel('bunny-white', white.pngs));
writeFileSync(join(OUT, 'bunny-blue.piskel'), buildPiskel('bunny-blue', blue.pngs));

writePreviewHtml();
await buildPreview(white.sheetPng);

writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  model: 'reference side-view bunny with hat',
  source: 'reference-bunny.png (4×3 grid)',
  frameWidth: FW,
  frameHeight: FH,
  frameCount: FRAMES,
  frames: FRAME_NAMES,
  gridMapping: GAME_TO_GRID,
  regenerate: 'node scripts/import-sara-run-reference.mjs',
}, null, 2));

console.log('✅ Imported reference →', OUT);
console.log('   sheet:', FW * FRAMES, '×', FH);

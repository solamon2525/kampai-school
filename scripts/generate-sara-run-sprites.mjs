/**
 * thai-sara-run · กระต่ายมุมหน้า (64×64 · 12 เฟรม)
 * รัน: node scripts/generate-sara-run-sprites.mjs
 *
 * เฟรม: idle · walk×2 · run×4 · jump×3 · hurt · happy
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/games/thai/assets/thai-sara-run');
const W = 64;
const H = 64;
const FRAMES = 12;
const FPS = 10;

const FRAME_NAMES = [
  'idle', 'walk1', 'walk2', 'run1', 'run2', 'run3', 'run4',
  'jumpUp', 'jumpPeak', 'jumpFall', 'hurt', 'happy',
];

/** @type {Record<string, [number,number,number,number]>} */
const PAL_WHITE = {
  '.': [0, 0, 0, 0],
  O: [157, 23, 77, 255],
  W: [255, 255, 255, 255],
  S: [253, 242, 248, 255],
  E: [251, 207, 232, 255],
  C: [253, 164, 175, 255],
  P: [251, 207, 232, 255],
  I: [30, 41, 59, 255],
  H: [255, 255, 255, 255],
  N: [244, 63, 94, 255],
};

/** @type {Record<string, [number,number,number,number]>} */
const PAL_BLUE = {
  '.': [0, 0, 0, 0],
  O: [3, 105, 161, 255],
  W: [224, 242, 254, 255],
  S: [186, 230, 253, 255],
  E: [125, 211, 252, 255],
  C: [147, 197, 253, 255],
  P: [186, 230, 253, 255],
  I: [15, 23, 42, 255],
  H: [255, 255, 255, 255],
  N: [236, 72, 153, 255],
};

/** @typedef {{ bob:number, lFootX:number, rFootX:number, lFootY:number, rFootY:number, lArmY:number, rArmY:number, lEarTilt:number, rEarTilt:number, eye:string, mouth:string, squash:number }} Pose */

/** @param {string[]} rows @param {Record<string,[number,number,number,number]>} pal */
function rasterize(rows, pal) {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H && y < rows.length; y++) {
    const row = rows[y].padEnd(W, '.').slice(0, W);
    for (let x = 0; x < W; x++) {
      const ch = row[x] || '.';
      const c = pal[ch] || pal['.'];
      const i = (y * W + x) * 4;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
    }
  }
  return px;
}

/** มุมหน้า chibi · สมมาตร · pixel grid */
function bunnyArt(p) {
  const b = p.bob | 0;
  const raw = Array.from({ length: H }, () => '.'.repeat(W));

  function stamp(sx, sy, art) {
    for (let y = 0; y < art.length; y++)
      for (let x = 0; x < art[y].length; x++) {
        const ch = art[y][x];
        if (ch === '.' || ch === ' ') continue;
        const ty = sy + y + b + p.squash;
        const tx = sx + x;
        if (ty >= 0 && ty < H && tx >= 0 && tx < W)
          raw[ty] = raw[ty].substring(0, tx) + ch + raw[ty].substring(tx + 1);
      }
  }

  const cx = 32;

  // ── หูซ้าย ──
  stamp(cx - 18 + p.lEarTilt, 4 - p.lEarTilt, [
    '..OO..',
    '.OEEEO',
    '.OEEEO',
    '.OEEEO',
    '.OWWWO',
    '..OO..',
  ]);

  // ── หูขวา ──
  stamp(cx + 6 - p.rEarTilt, 4 - p.rEarTilt, [
    '..OO..',
    '.OEEEO',
    '.OEEEO',
    '.OEEEO',
    '.OWWWO',
    '..OO..',
  ]);

  // ── หัว ──
  stamp(cx - 14, 14 + p.squash, [
    '....OOOOOO....',
    '..OOOWWWWOOO..',
    '.OWWWWWWWWWWOO',
    'OWWWWWWWWWWWWO',
    'OWWWWWWWWWWWWO',
    'OWWWWWWWWWWWWO',
    '.OWWWWWWWWWWOO',
    '..OOOWWWWOOO..',
    '....OOOOOO....',
  ]);

  // ── ตา ──
  if (p.eye === 'hurt') {
    stamp(cx - 12, 24 + p.squash, ['I..I', '.II.', 'I..I']);
    stamp(cx + 4, 24 + p.squash, ['I..I', '.II.', 'I..I']);
  } else if (p.eye === 'happy') {
    stamp(cx - 13, 25 + p.squash, ['O..O', '.II.', 'O..O']);
    stamp(cx + 3, 25 + p.squash, ['O..O', '.II.', 'O..O']);
  } else if (p.eye === 'blink') {
    stamp(cx - 12, 26 + p.squash, ['OOOO', 'OOOO']);
    stamp(cx + 4, 26 + p.squash, ['OOOO', 'OOOO']);
  } else {
    stamp(cx - 12, 24 + p.squash, ['.OO.', 'OIHO', '.OO.']);
    stamp(cx + 4, 24 + p.squash, ['.OO.', 'OHIO', '.OO.']);
  }

  // ── แก้ม ──
  stamp(cx - 16, 30 + p.squash, ['.CC.', '.CC.']);
  stamp(cx + 8, 30 + p.squash, ['.CC.', '.CC.']);

  // ── จมูก/ปาก ──
  if (p.mouth === 'open') {
    stamp(cx - 4, 32 + p.squash, ['.OWO.', 'OWNNO', '.OOO.']);
  } else if (p.mouth === 'sad') {
    stamp(cx - 3, 33 + p.squash, ['.II.', 'I..I']);
  } else if (p.mouth === 'gasp') {
    stamp(cx - 2, 33 + p.squash, ['.II.', '.II.']);
  } else {
    stamp(cx - 3, 32 + p.squash, ['.OWO.', 'OWWWO', '.ONO.']);
  }

  // ── ตัว ──
  stamp(cx - 13, 36 + p.squash, [
    '...OOOOOOO...',
    '..OWWWWWWWOO.',
    '.OWWWSSSWWWO.',
    'OWWWSSSSSWWWO',
    'OWWWSSSSSWWWO',
    '.OWWWWWWWWO.',
    '..OOOOOOOO..',
  ]);

  // ── แขนซ้าย ──
  stamp(cx - 22, 38 + p.lArmY + p.squash, [
    '.WW.',
    '.WW.',
    '.PP.',
    '.PP.',
    'OOOO',
  ]);

  // ── แขนขวา ──
  stamp(cx + 14, 38 + p.rArmY + p.squash, [
    '.WW.',
    '.WW.',
    '.PP.',
    '.PP.',
    'OOOO',
  ]);

  // ── ขาซ้าย ──
  stamp(cx - 14 + p.lFootX, 48 + p.lFootY, [
    '.WWW.',
    '.WWW.',
    '.PPP.',
    '.PPP.',
    'OOOOO',
    'OPOPO',
  ]);

  // ── ขาขวา ──
  stamp(cx + 4 + p.rFootX, 48 + p.rFootY, [
    '.WWW.',
    '.WWW.',
    '.PPP.',
    '.PPP.',
    'OOOOO',
    'OPOPO',
  ]);

  return raw;
}

/** @param {number} f */
function poseForFrame(f) {
  /** @type {Pose} */
  const base = {
    bob: 0, lFootX: 0, rFootX: 0, lFootY: 0, rFootY: 0,
    lArmY: 0, rArmY: 0, lEarTilt: 0, rEarTilt: 0,
    eye: 'normal', mouth: 'smile', squash: 0,
  };
  switch (f) {
    case 0: // idle
      return { ...base, lFootX: -1, rFootX: 1 };
    case 1: // walk1 — ซ้ายก้าวหน้า
      return { ...base, bob: 1, lFootX: -3, rFootX: 2, lFootY: -1, rFootY: 0, lArmY: 2, rArmY: -2, lEarTilt: 1, rEarTilt: 0 };
    case 2: // walk2 — ขวาก้าวหน้า
      return { ...base, bob: 0, lFootX: 2, rFootX: -3, lFootY: 0, rFootY: -1, lArmY: -2, rArmY: 2, lEarTilt: 0, rEarTilt: 1 };
    case 3: // run1
      return { ...base, bob: 1, lFootX: -4, rFootX: 3, lFootY: -2, rFootY: 1, lArmY: 3, rArmY: -3, lEarTilt: 2, rEarTilt: 1, squash: -1 };
    case 4: // run2 — กลางอากาศ
      return { ...base, bob: -1, lFootX: 0, rFootX: 0, lFootY: -4, rFootY: -4, lArmY: -2, rArmY: -2, lEarTilt: -1, rEarTilt: -1, squash: 1 };
    case 5: // run3
      return { ...base, bob: 1, lFootX: 3, rFootX: -4, lFootY: 1, rFootY: -2, lArmY: -3, rArmY: 3, lEarTilt: 1, rEarTilt: 2, squash: -1 };
    case 6: // run4
      return { ...base, bob: 0, lFootX: -2, rFootX: 2, lFootY: -3, rFootY: -3, lArmY: 1, rArmY: 1, lEarTilt: 0, rEarTilt: 0, squash: 0 };
    case 7: // jumpUp
      return { ...base, bob: -2, lFootX: -2, rFootX: 2, lFootY: 2, rFootY: 2, lArmY: -4, rArmY: -4, lEarTilt: -2, rEarTilt: -2, mouth: 'gasp', squash: -1 };
    case 8: // jumpPeak
      return { ...base, bob: -3, lFootX: -1, rFootX: 1, lFootY: 4, rFootY: 4, lArmY: -5, rArmY: -5, lEarTilt: -3, rEarTilt: -3, eye: 'happy', mouth: 'open', squash: 1 };
    case 9: // jumpFall
      return { ...base, bob: -1, lFootX: -3, rFootX: 3, lFootY: 0, rFootY: 0, lArmY: 2, rArmY: 2, lEarTilt: 1, rEarTilt: 1 };
    case 10: // hurt
      return { ...base, bob: 2, lFootX: -2, rFootX: 2, lArmY: 3, rArmY: 3, eye: 'hurt', mouth: 'sad', lEarTilt: 3, rEarTilt: 3, squash: 1 };
    case 11: // happy
      return { ...base, bob: -2, lFootX: -2, rFootX: 2, lFootY: -2, rFootY: -2, lArmY: -4, rArmY: -4, eye: 'happy', mouth: 'open', lEarTilt: -2, rEarTilt: -2 };
    default:
      return base;
  }
}

function drawFrame(f, pal) {
  return rasterize(bunnyArt(poseForFrame(f)), pal);
}

async function frameToPng(px) {
  return sharp(Buffer.from(px), { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

async function buildSheet(pal) {
  const pngs = [];
  const sheet = Buffer.alloc(W * FRAMES * H * 4);
  for (let f = 0; f < FRAMES; f++) {
    const px = drawFrame(f, pal);
    pngs.push(await frameToPng(px));
    for (let y = 0; y < H; y++) {
      const srcOff = y * W * 4;
      const dstOff = (y * W * FRAMES + f * W) * 4;
      sheet.set(px.subarray(srcOff, srcOff + W * 4), dstOff);
    }
  }
  const sheetPng = await sharp(sheet, { raw: { width: W * FRAMES, height: H, channels: 4 } }).png().toBuffer();
  return { pngs, sheetPng };
}

function buildPiskel(name, pngs) {
  const chunks = pngs.map((buf, frame) => ({
    layout: [[frame]],
    base64PNG: buf.toString('base64'),
  }));
  const layer = JSON.stringify({
    name: 'Layer 1',
    opacity: 1,
    frameCount: pngs.length,
    chunks,
  });
  return JSON.stringify({
    modelVersion: 2,
    piskel: {
      name,
      description: 'thai-sara-run · front chibi bunny · เดิน/วิ่ง/กระโดด',
      fps: FPS,
      height: H,
      width: W,
      layers: [layer],
      hiddenFrames: [],
    },
  }, null, 2);
}

async function buildPreviewPng(whiteSheet, blueSheet) {
  const scale = 2;
  const pad = 12;
  const cols = 6;
  const cell = W * scale + pad;
  const pw = cols * cell + pad;
  const ph = 2 * (H * scale + pad + 20) + pad;

  const bg = Buffer.alloc(pw * ph * 4);
  for (let i = 0; i < pw * ph; i++) {
    bg[i * 4] = 199; bg[i * 4 + 1] = 210; bg[i * 4 + 2] = 254; bg[i * 4 + 3] = 255;
  }

  const composites = [];
  for (let f = 0; f < FRAMES; f++) {
    const col = f % cols;
    const row = Math.floor(f / cols);
    const frameBuf = await sharp(whiteSheet)
      .extract({ left: f * W, top: 0, width: W, height: H })
      .resize(W * scale, H * scale, { kernel: 'nearest' })
      .png().toBuffer();
    composites.push({ input: frameBuf, left: pad + col * cell, top: 36 + row * (H * scale + pad + 20) });
  }

  await sharp(bg, { raw: { width: pw, height: ph, channels: 4 } })
    .composite(composites)
    .png()
    .toFile(join(OUT, 'preview.png'));
}

function writePreviewHtml() {
  writeFileSync(join(OUT, 'preview.html'), `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview · กระต่ายมุมหน้า</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:linear-gradient(180deg,#a1c4fd,#c2e9fb);padding:20px;color:#334155}
h1{color:#be185d;font-size:1.4rem} p{margin:8px 0 16px;color:#64748b;font-size:.9rem}
.card{background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;border:3px solid #fbcfe8;box-shadow:0 6px 24px rgba(0,0,0,.08)}
.card h2{font-size:.95rem;color:#be185d;margin-bottom:10px}
canvas{display:block;margin:0 auto;image-rendering:pixelated;background:linear-gradient(#bae6fd,#86efac);border-radius:10px;border:2px solid #e2e8f0}
.row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
.box{text-align:center;font-size:.72rem;color:#94a3b8;margin-top:4px}
img{max-width:100%;image-rendering:pixelated;border-radius:10px;border:2px solid #e2e8f0;margin-top:8px}
code{background:#fce7f3;padding:2px 6px;border-radius:4px;font-size:.85rem}
a{color:#be185d}
</style></head><body>
<h1>🐰 กระต่ายมุมหน้า · thai-sara-run</h1>
<p>64×64 · 12 เฟรม · idle / เดิน / วิ่ง / กระโดด · เปิด <code>.piskel</code> ใน <a href="https://www.piskelapp.com/p/create/sprite" target="_blank">Piskel</a></p>
<div class="card"><h2>Animation</h2><div class="row">
<div><canvas id="idle" width="192" height="192"></canvas><div class="box">ยืน</div></div>
<div><canvas id="walk" width="192" height="192"></canvas><div class="box">เดิน</div></div>
<div><canvas id="run" width="192" height="192"></canvas><div class="box">วิ่ง</div></div>
<div><canvas id="jump" width="192" height="192"></canvas><div class="box">กระโดด</div></div>
</div></div>
<div class="card"><h2>Sprite sheet</h2>
<img src="preview.png" alt="preview"><img src="bunny-white-sheet.png" alt="white">
</div>
<script>
const W=64,H=64,WALK=[1,2],RUN=[3,4,5,6],JUMP=[7,8,9];
function load(s){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s;});}
function loop(c,s,fr,fps){const x=c.getContext('2d');x.imageSmoothingEnabled=false;let n=0,t=0;const sc=c.width/W;
(function tick(now){if(now-t>1000/fps){t=now;n=(n+1)%fr.length;}x.clearRect(0,0,c.width,c.height);
const f=fr[n];x.drawImage(s,f*W,0,W,H,0,0,W*sc,H*sc);requestAnimationFrame(tick);})(0);}
function hold(c,s,f){const x=c.getContext('2d');x.imageSmoothingEnabled=false;const sc=c.width/W;
x.drawImage(s,f*W,0,W,H,0,0,W*sc,H*sc);}
load('bunny-white-sheet.png').then(s=>{
loop(document.getElementById('walk'),s,WALK,6);loop(document.getElementById('run'),s,RUN,10);
loop(document.getElementById('jump'),s,JUMP,7);hold(document.getElementById('idle'),s,0);});
</script></body></html>`, 'utf8');
}

function writePiskelGuide() {
  writeFileSync(join(OUT, 'PISKEL.md'), `# แก้กระต่ายมุมหน้าใน Piskel

## เฟรม (12)
| # | ท่า |
|---|-----|
| 0 | idle ยืน |
| 1–2 | เดิน |
| 3–6 | วิ่ง |
| 7–9 | กระโดด (ขึ้น / ลอย / ลง) |
| 10 | โดน |
| 11 | ยินดี |

## เปิดไฟล์
1. [piskelapp.com](https://www.piskelapp.com/p/create/sprite) → **Import** → \`bunny-white.piskel\`
2. แก้ pixel ทีละเฟรม (64×64)

## Export
**Export** → PNG → Sprite sheet แนวนอน 12 columns → ทับ \`bunny-white-sheet.png\` (768×64)

## สร้างใหม่
\`\`\`bash
node scripts/generate-sara-run-sprites.mjs
\`\`\`
`, 'utf8');
}

// ── main ──
mkdirSync(OUT, { recursive: true });

const white = await buildSheet(PAL_WHITE);
const blue = await buildSheet(PAL_BLUE);

writeFileSync(join(OUT, 'bunny-white-sheet.png'), white.sheetPng);
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), blue.sheetPng);
writeFileSync(join(OUT, 'bunny-white.piskel'), buildPiskel('bunny-white', white.pngs));
writeFileSync(join(OUT, 'bunny-blue.piskel'), buildPiskel('bunny-blue', blue.pngs));

writePreviewHtml();
writePiskelGuide();
await buildPreviewPng(white.sheetPng, blue.sheetPng);

writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  source: 'Piskel-compatible pixel art · front view',
  frameWidth: W,
  frameHeight: H,
  frameCount: FRAMES,
  frames: FRAME_NAMES,
  piskelFiles: ['bunny-white.piskel', 'bunny-blue.piskel'],
  preview: 'preview.html',
  regenerate: 'node scripts/generate-sara-run-sprites.mjs',
}, null, 2));

console.log('✅ Front-view bunny sprites →', OUT);

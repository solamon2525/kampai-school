/**
 * thai-sara-run · กระต่าย Piskel มุมหน้า chibi (64×64 · 12 เฟรม)
 * รัน: node scripts/generate-sara-run-sprites.mjs
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
  T: [255, 255, 255, 255],
  D: [148, 163, 184, 120],
};

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
  T: [186, 230, 253, 255],
  D: [100, 116, 139, 120],
};

/** @typedef {{ bob:number, lFootX:number, rFootX:number, lFootY:number, rFootY:number, lArmX:number, rArmX:number, lArmY:number, rArmY:number, lEar:number, rEar:number, tail:number, eye:string, mouth:string, squash:number, shadow:boolean, dust:boolean }} Pose */

function rasterize(rows, pal) {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const row = (rows[y] || '').padEnd(W, '.').slice(0, W);
    for (let x = 0; x < W; x++) {
      const c = pal[row[x] || '.'] || pal['.'];
      const i = (y * W + x) * 4;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
    }
  }
  return px;
}

function bunnyArt(p) {
  const b = p.bob | 0;
  const sq = p.squash | 0;
  const raw = Array.from({ length: H }, () => '.'.repeat(W));
  const cx = 32;

  function put(sx, sy, art) {
    for (let y = 0; y < art.length; y++)
      for (let x = 0; x < art[y].length; x++) {
        const ch = art[y][x];
        if (ch === '.' || ch === ' ') continue;
        const ty = sy + y + b + sq;
        const tx = sx + x;
        if (ty >= 0 && ty < H && tx >= 0 && tx < W)
          raw[ty] = raw[ty].slice(0, tx) + ch + raw[ty].slice(tx + 1);
      }
  }

  if (p.shadow) {
    put(cx - 10, 57 + b, ['....DDDDDD....', '..DDDDDDDDDD..', '....DDDDDD....']);
  }

  if (p.dust) {
    put(cx - 18, 54 + b, ['.D..', '..D.', '.D..']);
    put(cx + 12, 55 + b, ['..D.', '.D..', '..D.']);
  }

  // หาง
  put(cx - 2 + p.tail, 42 + sq, [
    '..TTTOO',
    '.TTWWWO',
    'TTWWWO.',
    '.TWO...',
  ]);

  // ขาซ้าย (หลัง)
  put(cx - 16 + p.lFootX, 46 + p.lFootY + b, [
    '..WWW..',
    '..WWW..',
    '..PPP..',
    '..PPP..',
    '.OOOOO.',
    'OOPOPOO',
  ]);

  // ขาขวา (หลัง)
  put(cx + 6 + p.rFootX, 46 + p.rFootY + b, [
    '..WWW..',
    '..WWW..',
    '..PPP..',
    '..PPP..',
    '.OOOOO.',
    'OOPOPOO',
  ]);

  // ตัว + ท้อง
  put(cx - 15, 34 + sq, [
    '.....OOOOOOO.....',
    '...OOOWWWWWWOOO..',
    '..OWWWWWWWWWWOO.',
    '.OWWWSSSSSSWWWO.',
    'OWWWSSSSSSSWWWO',
    'OWWWSSSSSSSWWWO',
    '.OWWWWWWWWWWWOO.',
    '..OOOOOOOOOOO...',
  ]);

  // แขนซ้าย
  put(cx - 24 + p.lArmX, 36 + p.lArmY + sq, [
    '.WW.',
    '.WW.',
    '.PP.',
    '.PP.',
    'OOOO',
    '.OO.',
  ]);

  // แขนขวา
  put(cx + 16 + p.rArmX, 36 + p.rArmY + sq, [
    '.WW.',
    '.WW.',
    '.PP.',
    '.PP.',
    'OOOO',
    '.OO.',
  ]);

  // หูซ้าย
  put(cx - 20 + p.lEar, 2 - p.lEar, [
    '...OOO...',
    '..OWEEO..',
    '..OWEEO..',
    '..OWEEO..',
    '..OWEEO..',
    '..OWWWO..',
    '...OOO...',
  ]);

  // หูขวา
  put(cx + 5 - p.rEar, 2 - p.rEar, [
    '...OOO...',
    '..OWEEO..',
    '..OWEEO..',
    '..OWEEO..',
    '..OWEEO..',
    '..OWWWO..',
    '...OOO...',
  ]);

  // หัว
  put(cx - 16, 12 + sq, [
    '......OOOOOO......',
    '....OOOWWWWOOO....',
    '...OWWWWWWWWWWOO..',
    '..OWWWHHHHHWWWWO..',
    '.OWWWHHHHHHHWWWWO.',
    'OWWWWWWWWWWWWWWWWO',
    'OWWWWWWWWWWWWWWWWO',
    '.OWWWWWWWWWWWWWWOO',
    '..OOOWWWWWWOOO....',
    '....OOOOOOOO......',
  ]);

  // ตา
  if (p.eye === 'hurt') {
    put(cx - 13, 22 + sq, ['I..I', '.II.', 'I..I']);
    put(cx + 5, 22 + sq, ['I..I', '.II.', 'I..I']);
  } else if (p.eye === 'happy') {
    put(cx - 14, 23 + sq, ['O..O', '.II.', '....']);
    put(cx + 4, 23 + sq, ['O..O', '.II.', '....']);
  } else if (p.eye === 'wide') {
    put(cx - 13, 22 + sq, ['OOOO', 'OIHO', 'OOOO']);
    put(cx + 5, 22 + sq, ['OOOO', 'OHIO', 'OOOO']);
  } else {
    put(cx - 13, 22 + sq, ['.OO.', 'OIHO', '.OO.']);
    put(cx + 5, 22 + sq, ['.OO.', 'OHIO', '.OO.']);
  }

  // แก้ม
  put(cx - 17, 28 + sq, ['.CC..', '.CC..']);
  put(cx + 9, 28 + sq, ['..CC.', '..CC.']);

  // จมูกปาก
  if (p.mouth === 'open') {
    put(cx - 5, 30 + sq, ['..OWO..', '.OWNNO.', '..OOO..']);
  } else if (p.mouth === 'sad') {
    put(cx - 4, 31 + sq, ['.II.', 'I..I']);
  } else if (p.mouth === 'gasp') {
    put(cx - 3, 31 + sq, ['.II.', '.II.']);
  } else {
    put(cx - 4, 30 + sq, ['..OWO..', '.OWWWO.', '..ONO..']);
  }

  return raw;
}

function poseForFrame(f) {
  /** @type {Pose} */
  const z = {
    bob: 0, lFootX: 0, rFootX: 0, lFootY: 0, rFootY: 0,
    lArmX: 0, rArmX: 0, lArmY: 0, rArmY: 0,
    lEar: 0, rEar: 0, tail: 0,
    eye: 'normal', mouth: 'smile', squash: 0, shadow: true, dust: false,
  };
  switch (f) {
    case 0:
      return { ...z, lFootX: -2, rFootX: 2, lArmY: 1, rArmY: 1 };
    case 1:
      return { ...z, bob: 1, lFootX: -4, rFootX: 3, lFootY: -1, lArmX: -1, rArmX: 1, lArmY: 2, rArmY: -1, lEar: 1, rEar: 0, tail: -1 };
    case 2:
      return { ...z, bob: 0, lFootX: 3, rFootX: -4, rFootY: -1, lArmX: 1, rArmX: -1, lArmY: -1, rArmY: 2, lEar: 0, rEar: 1, tail: 1 };
    case 3:
      return { ...z, bob: 1, lFootX: -5, rFootX: 4, lFootY: -2, rFootY: 1, lArmX: -2, rArmX: 2, lArmY: 3, rArmY: -2, lEar: 2, rEar: 1, squash: -1, dust: true };
    case 4:
      return { ...z, bob: -2, lFootX: -1, rFootX: 1, lFootY: -5, rFootY: -5, lArmY: -3, rArmY: -3, lEar: -2, rEar: -2, squash: 1, shadow: false, dust: true };
    case 5:
      return { ...z, bob: 1, lFootX: 4, rFootX: -5, lFootY: 1, rFootY: -2, lArmX: 2, rArmX: -2, lArmY: -2, rArmY: 3, lEar: 1, rEar: 2, squash: -1, dust: true };
    case 6:
      return { ...z, bob: 0, lFootX: -3, rFootX: 3, lFootY: -4, rFootY: -4, lArmY: 0, rArmY: 0, lEar: 0, rEar: 0, shadow: false };
    case 7:
      return { ...z, bob: -2, lFootX: -3, rFootX: 3, lFootY: 3, rFootY: 3, lArmY: -5, rArmY: -5, lEar: -2, rEar: -2, mouth: 'gasp', eye: 'wide', squash: -1, shadow: false };
    case 8:
      return { ...z, bob: -3, lFootX: -2, rFootX: 2, lFootY: 5, rFootY: 5, lArmY: -6, rArmY: -6, lEar: -3, rEar: -3, eye: 'happy', mouth: 'open', squash: 2, shadow: false };
    case 9:
      return { ...z, bob: -1, lFootX: -4, rFootX: 4, lFootY: 1, lArmY: 1, rArmY: 1, lEar: 1, rEar: 1, eye: 'wide', shadow: false };
    case 10:
      return { ...z, bob: 2, lFootX: -3, rFootX: 3, lArmY: 4, rArmY: 4, lEar: 3, rEar: 3, eye: 'hurt', mouth: 'sad', squash: 1, tail: 2 };
    case 11:
      return { ...z, bob: -2, lFootX: -3, rFootX: 3, lFootY: -2, rFootY: -2, lArmY: -5, rArmY: -5, lEar: -2, rEar: -2, eye: 'happy', mouth: 'open', tail: -1 };
    default:
      return z;
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
  return JSON.stringify({
    modelVersion: 2,
    piskel: {
      name,
      description: 'thai-sara-run · chibi bunny front · walk/run/jump',
      fps: FPS,
      height: H,
      width: W,
      layers: [JSON.stringify({ name: 'Layer 1', opacity: 1, frameCount: pngs.length, chunks })],
      hiddenFrames: [],
    },
  }, null, 2);
}

async function buildPreviewPng(whiteSheet) {
  const scale = 3;
  const pad = 10;
  const cols = 6;
  const cell = W * scale + pad;
  const pw = cols * cell + pad;
  const ph = 2 * (H * scale + pad + 24) + pad + 40;

  const bg = Buffer.alloc(pw * ph * 4);
  for (let i = 0; i < pw * ph; i++) {
    bg[i * 4] = 186; bg[i * 4 + 1] = 230; bg[i * 4 + 2] = 253; bg[i * 4 + 3] = 255;
  }

  const labels = ['idle', 'walk1', 'walk2', 'run1', 'run2', 'run3', 'run4', 'jump↑', 'jump○', 'jump↓', 'hurt', 'happy'];
  const composites = [];
  for (let f = 0; f < FRAMES; f++) {
    const col = f % cols;
    const row = Math.floor(f / cols);
    const frameBuf = await sharp(whiteSheet)
      .extract({ left: f * W, top: 0, width: W, height: H })
      .resize(W * scale, H * scale, { kernel: 'nearest' })
      .png().toBuffer();
    composites.push({ input: frameBuf, left: pad + col * cell, top: 28 + row * (H * scale + pad + 24) });
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
body{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(180deg,#fce7f3,#e0f2fe);padding:20px;color:#334155}
h1{color:#be185d;font-size:1.35rem} p{margin:8px 0 16px;color:#64748b;font-size:.88rem}
.card{background:#fff;border-radius:16px;padding:16px;margin-bottom:14px;border:3px solid #fbcfe8;box-shadow:0 6px 24px rgba(0,0,0,.08)}
.card h2{font-size:.92rem;color:#be185d;margin-bottom:10px}
canvas{display:block;margin:0 auto;image-rendering:pixelated;background:linear-gradient(#bae6fd 60%,#86efac);border-radius:10px;border:2px solid #e2e8f0}
.row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.box{text-align:center;font-size:.7rem;color:#94a3b8;margin-top:4px}
img{max-width:100%;image-rendering:pixelated;border-radius:10px;border:2px solid #e2e8f0;margin-top:8px}
code{background:#fce7f3;padding:2px 6px;border-radius:4px;font-size:.82rem}
a{color:#be185d}
</style></head><body>
<h1>🐰 กระต่าย chibi · thai-sara-run</h1>
<p>64×64 · Piskel · มุมหน้า · <a href="https://www.piskelapp.com/p/create/sprite" target="_blank">เปิดแก้ใน Piskel</a></p>
<div class="card"><h2>ท่าทาง</h2><div class="row">
<div><canvas id="idle" width="192" height="192"></canvas><div class="box">ยืน</div></div>
<div><canvas id="walk" width="192" height="192"></canvas><div class="box">เดิน</div></div>
<div><canvas id="run" width="192" height="192"></canvas><div class="box">วิ่ง</div></div>
<div><canvas id="jump" width="192" height="192"></canvas><div class="box">กระโดด</div></div>
</div></div>
<div class="card"><h2>Sprite sheet ทั้งหมด</h2>
<img src="preview.png?v=2" alt="preview"><img src="bunny-white-sheet.png?v=2" alt="white">
<p style="margin-top:8px">Import: <code>bunny-white.piskel</code></p>
</div>
<script>
const W=64,H=64,WALK=[1,2],RUN=[3,4,5,6],JUMP=[7,8,9];
function load(s){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s+'?v=2';});}
function loop(c,s,fr,fps){const x=c.getContext('2d');x.imageSmoothingEnabled=false;let n=0,t=0;const sc=c.width/W;
(function tick(now){if(now-t>1000/fps){t=now;n=(n+1)%fr.length;}x.clearRect(0,0,c.width,c.height);
const f=fr[n];x.drawImage(s,f*W,0,W,H,0,0,W*sc,H*sc);requestAnimationFrame(tick);})(0);}
function hold(c,s,f){const x=c.getContext('2d');x.imageSmoothingEnabled=false;const sc=c.width/W;
x.drawImage(s,f*W,0,W,H,0,0,W*sc,H*sc);}
load('bunny-white-sheet.png').then(s=>{
hold(document.getElementById('idle'),s,0);loop(document.getElementById('walk'),s,WALK,5);
loop(document.getElementById('run'),s,RUN,11);loop(document.getElementById('jump'),s,JUMP,8);});
</script></body></html>`, 'utf8');
}

function writePiskelGuide() {
  writeFileSync(join(OUT, 'PISKEL.md'), `# กระต่าย thai-sara-run (Piskel)

## โมเดล
มุมหน้า chibi · 64×64 · เหมาะกับ platform runner

| เฟรม | ท่า |
|------|-----|
| 0 | idle |
| 1–2 | เดิน |
| 3–6 | วิ่ง (มีเฟรมลอย) |
| 7–9 | กระโดด |
| 10 | โดน |
| 11 | ยินดี |

## แก้ใน Piskel
1. [piskelapp.com](https://www.piskelapp.com/p/create/sprite) → Import \`bunny-white.piskel\`
2. Export PNG sprite sheet แนวนอน 12 columns → ทับ \`bunny-white-sheet.png\`

## สร้างใหม่
\`\`\`bash
node scripts/generate-sara-run-sprites.mjs
\`\`\`
`, 'utf8');
}

mkdirSync(OUT, { recursive: true });

const white = await buildSheet(PAL_WHITE);
const blue = await buildSheet(PAL_BLUE);

writeFileSync(join(OUT, 'bunny-white-sheet.png'), white.sheetPng);
writeFileSync(join(OUT, 'bunny-blue-sheet.png'), blue.sheetPng);
writeFileSync(join(OUT, 'bunny-white.piskel'), buildPiskel('bunny-white', white.pngs));
writeFileSync(join(OUT, 'bunny-blue.piskel'), buildPiskel('bunny-blue', blue.pngs));

writePreviewHtml();
writePiskelGuide();
await buildPreviewPng(white.sheetPng);

writeFileSync(join(OUT, 'README.json'), JSON.stringify({
  model: 'front chibi bunny',
  source: 'Piskel-compatible pixel art',
  frameWidth: W,
  frameHeight: H,
  frameCount: FRAMES,
  frames: FRAME_NAMES,
  piskelFiles: ['bunny-white.piskel', 'bunny-blue.piskel'],
  preview: 'preview.html',
  regenerate: 'node scripts/generate-sara-run-sprites.mjs',
}, null, 2));

console.log('✅ Bunny sprites v2 →', OUT);

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../public');

// Static HTTP server
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  const filePath = path.join(publicDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise(r => server.listen(8770, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto('http://localhost:8770/games/thai/thai-vocab-hub/index.html');
await page.waitForLoadState('networkidle');

// 1. Open with 'เกิด'
await page.evaluate(() => {
  window.ThaiVowelMorph.open('เกิด');
});
await page.waitForTimeout(300);

// Advance to step 3
await page.evaluate(() => {
  window.ThaiVowelMorph.nextStep(); // step 2
  window.ThaiVowelMorph.nextStep(); // step 3
});
await page.waitForTimeout(800); // Wait for transition settle

// Verify font size and stage size on desktop
const metrics = await page.evaluate(() => {
  const group = document.querySelector('.morph-char-group');
  const stage = document.querySelector('.morph-stage-wrapper');
  const styleGroup = window.getComputedStyle(group);
  const styleStage = window.getComputedStyle(stage);
  return {
    fontSize: parseFloat(styleGroup.fontSize),
    stageMinHeight: parseFloat(styleStage.minHeight)
  };
});

assert.ok(metrics.fontSize >= 200, `Desktop font size should be >= 200px, got ${metrics.fontSize}px`);
assert.ok(metrics.stageMinHeight >= 260, `Stage min-height should be >= 260px, got ${metrics.stageMinHeight}px`);

// Capture screenshot and measure pixel alignment
const screenshotBuffer = await page.screenshot();
const image = sharp(screenshotBuffer);
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

// Measure 'เกิด' diacritic mark vs consonant
const stageRect = await page.evaluate(() => {
  const r = document.querySelector('.char-initial-slot').getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});

let rXs = [], rYs = [], bXs = [], bYs = [];
const scanMinX = Math.floor(stageRect.x - 20);
const scanMaxX = Math.ceil(stageRect.x + stageRect.width + 20);
const scanMinY = Math.floor(stageRect.y - 40);
const scanMaxY = Math.ceil(stageRect.y + stageRect.height + 20);

for (let y = scanMinY; y < scanMaxY; y++) {
  for (let x = scanMinX; x < scanMaxX; x++) {
    const idx = (y * info.width + x) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    // Red mark (ิ)
    if (r > 180 && g < 100 && b < 100 && y < stageRect.y + stageRect.height * 0.45) {
      rXs.push(x);
      rYs.push(y);
    }
    // Black consonant (ก)
    if (r < 50 && g < 50 && b < 60 && y > stageRect.y + stageRect.height * 0.3) {
      bXs.push(x);
      bYs.push(y);
    }
  }
}

assert.ok(rXs.length > 0, 'Must detect red mark pixels');
assert.ok(bXs.length > 0, 'Must detect black consonant pixels');

const gap = Math.min(...bYs) - Math.max(...rYs);
const rCenter = (Math.min(...rXs) + Math.max(...rXs)) / 2;
const bCenter = (Math.min(...bXs) + Math.max(...bXs)) / 2;
const hOffset = Math.abs(rCenter - bCenter);

console.log(`Measured: gap=${gap}px, hOffset=${hOffset.toFixed(1)}px, fontSize=${metrics.fontSize}px`);

// Gap must be tight (0 to 5px) - NOT 20px in the air!
assert.ok(gap >= 0 && gap <= 5, `Vertical gap between mark and consonant must be between 0 and 5px, got ${gap}px`);
// Horizontal offset must be centered (<= 5px) - NOT 29px off to the left!
assert.ok(hOffset <= 5, `Horizontal offset must be <= 5px from center, got ${hOffset.toFixed(1)}px`);

await browser.close();
server.close();
console.log('✅ vowel-morph-upsize-alignment test passed!');

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

await new Promise(r => server.listen(8774, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto('http://localhost:8774/games/thai/thai-vocab-hub/index.html');
await page.waitForLoadState('networkidle');

async function verifyClusterWord(word, expectedLead, expectedTarget, expectedMark) {
  await page.evaluate((w) => {
    window.ThaiVowelMorph.open(w);
    window.ThaiVowelMorph.nextStep(); // step 2
    window.ThaiVowelMorph.nextStep(); // step 3
  }, word);
  await page.waitForTimeout(600);

  const domCheck = await page.evaluate(() => {
    const slot = document.querySelector('.char-initial-slot');
    const target = slot ? slot.querySelector('.char-initial') : null;
    const lead = document.querySelector('.char-initial-leading');
    const mark = document.querySelector('.char-morphed-top');
    const targetRect = target ? target.getBoundingClientRect() : null;

    return {
      hasLead: !!lead,
      leadText: lead ? lead.textContent : '',
      targetText: target ? target.textContent : '',
      markText: mark ? mark.textContent : '',
      slotRect: targetRect ? { x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height } : null
    };
  });

  if (expectedLead) {
    assert.strictEqual(domCheck.hasLead, true, `Word ${word} should have leading initial`);
    assert.strictEqual(domCheck.leadText, expectedLead, `Word ${word} leading initial should be ${expectedLead}`);
  } else {
    assert.strictEqual(domCheck.hasLead, false, `Word ${word} should not have leading initial`);
  }
  assert.strictEqual(domCheck.targetText, expectedTarget, `Word ${word} target initial should be ${expectedTarget}`);
  assert.strictEqual(domCheck.markText, expectedMark, `Word ${word} mark should be ${expectedMark}`);

  // Pixel measurement
  const screenshotBuffer = await page.screenshot();
  const image = sharp(screenshotBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const slotRect = domCheck.slotRect;
  let rXs = [], bXs = [], rYs = [], bYs = [];
  const scanMinX = Math.floor(slotRect.x + 2);
  const scanMaxX = Math.ceil(slotRect.x + slotRect.width - 2);
  const scanMinY = Math.floor(slotRect.y - 60);
  const scanMaxY = Math.ceil(slotRect.y + slotRect.height + 20);

  for (let y = scanMinY; y < scanMaxY; y++) {
    for (let x = scanMinX; x < scanMaxX; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Red mark
      if (r > 180 && g < 100 && b < 100 && y < slotRect.y + slotRect.height * 0.45) {
        rXs.push(x);
        rYs.push(y);
      }
      // Black target consonant
      if (r < 50 && g < 50 && b < 60 && y > slotRect.y + slotRect.height * 0.25) {
        bXs.push(x);
        bYs.push(y);
      }
    }
  }

  assert.ok(rXs.length > 0, `Word ${word} should have red mark pixels`);
  assert.ok(bXs.length > 0, `Word ${word} should have black consonant pixels`);

  const redCenterX = (Math.min(...rXs) + Math.max(...rXs)) / 2;
  const blkCenterX = (Math.min(...bXs) + Math.max(...bXs)) / 2;
  const hOffset = Math.abs(redCenterX - blkCenterX);
  const vGap = Math.min(...bYs) - Math.max(...rYs);

  console.log(`Verified ${word}: hOffset=${hOffset.toFixed(1)}px, vGap=${vGap.toFixed(1)}px`);
  assert.ok(hOffset <= 12, `Word ${word} hOffset should be <= 12px, got ${hOffset.toFixed(1)}px`);
  assert.ok(vGap >= -2 && vGap <= 6, `Word ${word} vGap should be between -2px and 6px, got ${vGap.toFixed(1)}px`);
}

// 1. Cluster words
await verifyClusterWord('เพลิง', 'พ', 'ล', 'ิ');
await verifyClusterWord('เพลิน', 'พ', 'ล', 'ิ');
await verifyClusterWord('ขยัน', 'ข', 'ย', 'ั');
await verifyClusterWord('หนัก', 'ห', 'น', 'ั');

// 2. Single consonant words
await verifyClusterWord('เกิด', '', 'ก', 'ิ');
await verifyClusterWord('กัน', '', 'ก', 'ั');
await verifyClusterWord('แข็ง', '', 'ข', '็');

await browser.close();
server.close();
console.log('✅ ALL CLUSTER AND SINGLE CONSONANT ALIGNMENT CHECKS PASSED!');

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/games/thai/thai-vocab-hub/index.html`;

const browser = await chromium.launch();
const pageErrors = [];

try {
  for (const vp of [{ width: 1280, height: 720 }, { width: 360, height: 800 }]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    page.on('pageerror', (err) => pageErrors.push(`${vp.width}x${vp.height}: ${err.message}`));

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.ThaiVocabMatch && document.querySelectorAll('.hub-card').length > 0);

    // Open category 'p5-focus' (same category as user screenshot)
    await page.locator('.hub-card[data-slug="p5-focus"]').click();
    await page.waitForSelector('#topic-view', { state: 'visible' });

    // Switch to choice first (to test stale #word-area bug), then switch to match
    await page.click('#m-choice');
    await page.click('#m-match');
    await page.waitForSelector('#match-mode', { state: 'visible' });

    // 1. #word-area must be hidden (no stale "เลือกความหมาย" banner)
    assert.equal(await page.isVisible('#word-area'), false, '#word-area must be hidden in match mode');

    // 2. 6 pairs rendered by default (> 4) and right column shows meanings, not [reading]
    const leftCount = await page.locator('#match-left .match-card').count();
    const rightCount = await page.locator('#match-right .match-card').count();
    assert.equal(leftCount, 6);
    assert.equal(rightCount, 6);

    const firstRightText = await page.locator('#match-right .match-card .mc-text').first().textContent();
    assert.ok(firstRightText && !firstRightText.trim().startsWith('['), `Right card must show meaning, got: ${firstRightText}`);

    // 3. Match a valid pair -> SVG line drawn + score increases
    const pairId = await page.locator('#match-left .match-card').first().getAttribute('data-pair-id');
    await page.locator(`#match-left .match-card[data-pair-id="${pairId}"]`).click();
    await page.locator(`#match-right .match-card[data-pair-id="${pairId}"]`).click();

    const svgLines = await page.locator('#match-svg-layer path').count();
    assert.equal(svgLines, 1, 'Matched pair must draw 1 SVG connector line');
    const score = Number(await page.textContent('#score-val'));
    assert.ok(score > 0, `Score must increase after match, got: ${score}`);

    // 4. Switch to Memory Flip sub-mode -> 12 cards rendered and flip on click
    await page.click('#match-sub-memory');
    const memCount = await page.locator('#match-memory-grid .memory-card').count();
    assert.equal(memCount, 12, 'Memory flip mode must render 12 cards (6 pairs)');
    await page.locator('#match-memory-grid .memory-card').first().click();
    const flippedCount = await page.locator('#match-memory-grid .memory-card.flipped').count();
    assert.equal(flippedCount, 1);

    // 5. Zero horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, `Horizontal overflow at ${vp.width}x${vp.height}`);

    await ctx.close();
  }

  assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join('; ')}`);
  console.log('✅ Matching browser tests passed on 1280x720 and 360x800!');
} finally {
  await browser.close();
  server.close();
}

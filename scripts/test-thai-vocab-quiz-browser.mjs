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
    await page.waitForFunction(() => !!window.ThaiVocabQuiz && document.querySelectorAll('.hub-card').length > 0);

    // Enter 'misspelled' category
    await page.locator('.hub-card[data-slug="misspelled"]').click();
    await page.waitForSelector('#topic-view', { state: 'visible' });

    // 1. Choice mode
    await page.click('#m-choice');
    await page.waitForSelector('#choice-mode', { state: 'visible' });

    assert.equal(await page.isVisible('#word-area'), false, '#word-area must be hidden in choice mode');
    const choiceProgress = await page.textContent('#choice-progress-badge');
    assert.ok(choiceProgress && choiceProgress.includes('ข้อ 1/12'), `Expected ข้อ 1/12, got: ${choiceProgress}`);
    assert.equal(await page.locator('#choice-options .option-btn').count(), 4, 'Choice mode must render 4 options');

    // Click 50/50 hint -> 2 wrong options disabled with .hint-eliminated
    await page.click('#choice-hint-btn');
    const eliminatedCount = await page.locator('#choice-options .option-btn.hint-eliminated:disabled').count();
    assert.equal(eliminatedCount, 2, '50/50 hint must disable 2 wrong options');

    // Click an enabled option -> #choice-feedback-box becomes visible
    await page.locator('#choice-options .option-btn:not(:disabled)').first().click();
    await page.waitForSelector('#choice-feedback-box', { state: 'visible' });
    assert.equal(await page.isVisible('#choice-feedback-box'), true, '#choice-feedback-box must be visible after answering');

    // 2. Listen mode
    await page.click('#m-listen');
    await page.waitForSelector('#listen-mode', { state: 'visible' });

    assert.equal(await page.isVisible('#word-area'), false, '#word-area must be hidden in listen mode');
    const listenProgress = await page.textContent('#listen-progress-badge');
    assert.ok(listenProgress && listenProgress.includes('ข้อ 1/12'), `Expected ข้อ 1/12, got: ${listenProgress}`);
    assert.equal(await page.locator('#listen-options .option-btn').count(), 4, 'Listen mode must render 4 options');

    // Click meaning hint -> #listen-clue-box becomes visible
    await page.click('#listen-hint-btn');
    await page.waitForSelector('#listen-clue-box', { state: 'visible' });
    assert.equal(await page.isVisible('#listen-clue-box'), true, '#listen-clue-box must be visible after clicking hint');

    // 3. On 360x800, toggle teacher tools drawer
    if (vp.width === 360) {
      await page.click('#btn-teacher-tools-toggle');
      await page.waitForSelector('#teacher-tools-drawer', { state: 'visible' });
      assert.equal(await page.isVisible('#teacher-tools-drawer'), true, '#teacher-tools-drawer must be visible on mobile after toggle');
    }

    // 4. Zero horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, `Horizontal overflow at ${vp.width}x${vp.height}`);

    await ctx.close();
  }

  assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join('; ')}`);
  console.log('✅ Choice & Listen quiz browser tests passed on 1280x720 and 360x800!');
} finally {
  await browser.close();
  server.close();
}

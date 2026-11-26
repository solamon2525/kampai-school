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
    await page.waitForFunction(() => !!window.ThaiStudioChallenge && !!window.ThaiVowelMorph && !!window.ThaiSpellingDecoder && !!window.ThaiSoundTwins && !!window.ThaiReadingTrainer);

    // 1. Vowel Morph Studio Quiz
    await page.click('#btn-morph-theater-toggle');
    await page.waitForSelector('#tvh-morph-modal', { state: 'visible' });
    await page.click('#morph-tab-quiz');
    await page.waitForSelector('#morph-quiz-panel .studio-challenge-card', { state: 'visible' });
    assert.equal(await page.locator('#morph-quiz-panel .studio-opt-btn').count(), 4);
    await page.locator('#morph-quiz-panel .studio-opt-btn').first().click();
    await page.waitForSelector('#morph-quiz-panel .studio-feedback-box', { state: 'visible' });
    await page.click('#tvh-morph-modal .tvh-modal-close');

    // 2. Spelling Decoder Studio Quiz
    await page.click('#btn-decoder-theater-toggle');
    await page.waitForSelector('#modal-spelling-decoder', { state: 'visible' });
    await page.click('#decoder-tab-quiz');
    await page.waitForSelector('#decoder-quiz-panel .studio-challenge-card', { state: 'visible' });
    assert.equal(await page.locator('#decoder-quiz-panel .studio-opt-btn').count(), 4);
    await page.locator('#decoder-quiz-panel .studio-opt-btn').first().click();
    await page.waitForSelector('#decoder-quiz-panel .studio-feedback-box', { state: 'visible' });
    await page.click('#modal-spelling-decoder .tvh-modal-close');

    // 3. Reading Trainer Studio Quiz
    await page.click('#btn-reading-theater-toggle');
    await page.waitForSelector('#tvh-reading-modal', { state: 'visible' });
    await page.click('#reading-tab-quiz');
    await page.waitForSelector('#reading-quiz-panel .studio-challenge-card', { state: 'visible' });
    assert.equal(await page.locator('#reading-quiz-panel .studio-opt-btn').count(), 4);
    await page.locator('#reading-quiz-panel .studio-opt-btn').first().click();
    await page.waitForSelector('#reading-quiz-panel .studio-feedback-box', { state: 'visible' });
    await page.click('#tvh-reading-modal .tvh-modal-close');

    // 4. Sound Twins Castles Round Badge
    await page.click('#btn-sound-twins-toggle');
    await page.waitForSelector('#modal-sound-twins', { state: 'visible' });
    await page.click('#tab-mode-castles');
    await page.waitForSelector('#castle-round-val', { state: 'visible' });
    assert.equal((await page.textContent('#castle-round-val')).trim(), '1/10');
    await page.click('#modal-sound-twins .tvh-modal-close');

    // 5. Zero horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, `Horizontal overflow at ${vp.width}x${vp.height}`);

    await ctx.close();
  }

  assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join('; ')}`);
  console.log('✅ All 4 Special Studios browser tests passed on 1280x720 and 360x800!');
} finally {
  await browser.close();
  server.close();
}

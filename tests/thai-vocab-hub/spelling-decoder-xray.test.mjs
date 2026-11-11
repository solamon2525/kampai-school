import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../public');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(publicDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`🧪 Test server running at http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://localhost:${port}/games/thai/thai-vocab-hub/index.html`);
    await page.waitForLoadState('networkidle');

    console.log('1. Navigating to "spelling" (มาตราตัวสะกด) category...');
    await page.evaluate(() => {
      if (typeof window.loadAndSelectCategory === 'function') {
        window.loadAndSelectCategory('spelling');
      } else if (typeof window.selectCategory === 'function') {
        window.selectCategory('spelling');
      }
    });
    await page.waitForTimeout(400);

    console.log('2. Verifying Phonetic X-Ray toggle button (#btn-xray-toggle)...');
    const toggleBtn = page.locator('#btn-xray-toggle');
    const toggleExists = await toggleBtn.count() > 0;
    assert.ok(toggleExists, '#btn-xray-toggle must exist in category filter toolbar');

    const isVisible = await toggleBtn.isVisible();
    assert.ok(isVisible, '#btn-xray-toggle must be visible when viewing spelling category');

    const btnText = await toggleBtn.textContent();
    assert.ok(btnText.includes('แว่นสแกนเสียงอ่าน'), `Toggle button text must contain "แว่นสแกนเสียงอ่าน", got: "${btnText}"`);

    // Verify initial state is off (aria-pressed=false)
    const initialPressed = await toggleBtn.getAttribute('aria-pressed');
    assert.equal(initialPressed, 'false', 'Initial aria-pressed should be "false"');

    console.log('3. Clicking #btn-xray-toggle to activate X-Ray scanner...');
    await toggleBtn.click();
    await page.waitForTimeout(300);

    const activePressed = await toggleBtn.getAttribute('aria-pressed');
    assert.equal(activePressed, 'true', 'After click, aria-pressed must be "true"');

    const hasActiveClass = await toggleBtn.evaluate((el) => el.classList.contains('active'));
    assert.ok(hasActiveClass, 'Toggle button must have .active class when activated');

    console.log('4. Verifying irregular cards display phonetic sound badges (.card-xray-badge)...');
    const badges = page.locator('.card-xray-badge');
    const badgeCount = await badges.count();
    console.log(`   Found ${badgeCount} phonetic sound badges.`);
    assert.ok(badgeCount > 0, 'Must display at least one .card-xray-badge on irregular cards');

    // Check content of first badge
    const firstBadgeText = await badges.first().textContent();
    assert.ok(
      /\[[กดนบ]\]/.test(firstBadgeText),
      `Badge text should be bracketed sound consonant like [ด], [ก], [น], [บ], got: "${firstBadgeText}"`
    );

    console.log('5. Verifying unmask action buttons (.btn-card-unmask) are displayed on irregular cards...');
    const unmaskBtns = page.locator('.btn-card-unmask');
    const unmaskCount = await unmaskBtns.count();
    console.log(`   Found ${unmaskCount} unmask buttons.`);
    assert.ok(unmaskCount > 0, 'Must display at least one .btn-card-unmask button');

    console.log('6. Clicking .btn-card-unmask on first card to open Theater Studio...');
    const firstUnmaskBtn = unmaskBtns.first();
    const targetWord = await firstUnmaskBtn.evaluate(el => {
      const card = el.closest('.grid-flip-card');
      const textEl = card ? card.querySelector('.grid-word-text') : null;
      return textEl ? textEl.childNodes[0].textContent.trim() : '';
    });
    console.log(`   Target word for unmasking: "${targetWord}"`);

    await firstUnmaskBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('#modal-spelling-decoder');
    const modalVisible = await modal.isVisible();
    assert.ok(modalVisible, '#modal-spelling-decoder must be visible after clicking .btn-card-unmask');

    console.log('7. Verifying Theater Studio shows decoded word details...');
    const stageEl = page.locator('#modal-spelling-decoder .decoder-stage-screen');
    assert.ok(await stageEl.isVisible(), 'Theater stage screen must be visible');
    if (targetWord) {
      const curWord = await page.evaluate(() => window.ThaiSpellingDecoder && window.ThaiSpellingDecoder.getCurrentWord());
      console.log(`   Current decoded word in Theater: "${curWord?.word}"`);
      assert.equal(curWord?.word, targetWord, `Theater Studio must open with target word "${targetWord}"`);
    }

    console.log('8. Toggling X-Ray scanner OFF and confirming badges disappear without layout break...');
    // Close modal first
    await page.evaluate(() => {
      if (window.ThaiSpellingDecoder && typeof window.ThaiSpellingDecoder.close === 'function') {
        window.ThaiSpellingDecoder.close();
      }
    });
    await page.waitForTimeout(200);

    await toggleBtn.click();
    await page.waitForTimeout(200);

    const badgesAfterOff = await page.locator('.card-xray-badge').count();
    assert.equal(badgesAfterOff, 0, 'Phonetic badges must disappear when X-Ray is toggled off');

    console.log('9. Testing Mobile Viewport (360x800)...');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(200);

    await toggleBtn.click();
    await page.waitForTimeout(200);
    assert.ok(await toggleBtn.isVisible(), 'Toggle button must be visible on 360x800 mobile screen');
    const mobileBadges = await page.locator('.card-xray-badge').count();
    assert.ok(mobileBadges > 0, 'Badges must be displayed on mobile view');

    console.log('✅ All Phonetic X-Ray Scanner tests passed successfully!');
  } finally {
    await browser.close();
    server.close();
  }
});

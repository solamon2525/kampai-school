import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PUBLIC_DIR = path.resolve('public');
const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/ac57a6e5-a0a7-4547-97c8-2a522baacbef';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
      if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function main() {
  const { server, baseUrl } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.error('PAGEERROR:', err));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
    });

    // Track speechSynthesis calls
    await page.addInitScript(() => {
      window.__spokenCount = 0;
      window.__spokenTexts = [];
      const fakeSynth = {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {},
        speak: (u) => {
          window.__spokenCount += 1;
          window.__spokenTexts.push(u && u.text ? u.text : '');
          setTimeout(() => {
            if (u && typeof u.onend === 'function') u.onend();
          }, 15);
        },
      };
      try {
        Object.defineProperty(window, 'speechSynthesis', { value: fakeSynth, configurable: true });
      } catch (_) {}
      window.SpeechSynthesisUtterance = function (text) {
        this.text = text;
        this.lang = 'en-US';
        this.rate = 1;
        this.onend = null;
        this.onerror = null;
      };
    });

    await page.goto(`${baseUrl}/games/english/vocab-hub.html#math`, { waitUntil: 'networkidle' });
    await page.click('[data-math-format="grid"]');
    await page.waitForSelector('.math-grid-board');

    // 1. Verify all 25 cells show pictures instead of '?'
    const cellCount = await page.locator('[data-grid-cell]').count();
    assert.equal(cellCount, 25, 'Should render 25 grid cells');
    const picImgCount = await page.locator('[data-grid-cell] .math-cell-pic img').count();
    assert.equal(picImgCount, 25, 'All 25 cells should render a picture image');
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('[data-grid-cell] .math-cell-pic img'));
      return imgs.length === 25 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    });
    const questionMarkCount = await page.locator('[data-grid-cell]:has-text("❓")').count();
    assert.equal(questionMarkCount, 0, 'Closed cells should not show ❓');

    // 2. Verify grid size is larger than 500px on 1280x720 and no horizontal overflow
    const desktopMetrics = await page.evaluate(() => {
      const board = document.querySelector('.math-grid-board');
      const rect = board.getBoundingClientRect();
      return {
        boardWidth: rect.width,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    assert.ok(desktopMetrics.boardWidth > 500, `Expected boardWidth > 500px on 1280x720, got ${desktopMetrics.boardWidth}`);
    assert.ok(desktopMetrics.scrollWidth <= desktopMetrics.innerWidth, 'No horizontal overflow on 1280x720');

    // Screenshot initial picture grid on desktop
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'math-grid-pic-desktop.png') });

    // 3. Click cell #1 -> enters pic_asking (does NOT speak math question yet, shows reveal button)
    const spokenBeforeClick = await page.evaluate(() => window.__spokenCount);
    await page.click('[data-grid-cell="0"]');
    await page.waitForSelector('#math-pic-gate-bar');
    await page.waitForSelector('#math-grid-pic-reveal');
    await page.waitForSelector('#math-grid-pic-pass');
    const cell1Class = await page.getAttribute('[data-grid-cell="0"]', 'class');
    assert.ok(cell1Class.includes('pic_asking'), 'Cell #1 should enter pic_asking state');
    assert.equal(await page.locator('#math-grid-speak').count(), 0, 'Replay button must not appear before picture gate is passed');
    const spokenDuringPic = await page.evaluate(() => window.__spokenCount);
    assert.equal(spokenDuringPic, spokenBeforeClick, 'Entering pic_asking must not auto-speak math question');

    // 3b. Click 'เฉลยภาพ' -> shows answer (en + sub) + speaks vocab word + shows cell label + speak button
    await page.click('#math-grid-pic-reveal');
    await page.waitForSelector('.math-pic-answer-en');
    await page.waitForSelector('#math-grid-pic-speak');
    await page.waitForSelector('[data-grid-cell="0"] .math-cell-pic-label');
    const revealAnswerText = await page.textContent('.math-pic-answer-en');
    assert.ok(revealAnswerText.includes('เฉลย #1:'), `Expected picture reveal text, got '${revealAnswerText}'`);
    await page.waitForFunction((prev) => window.__spokenCount > prev, spokenDuringPic);
    const spokenAfterReveal = await page.evaluate(() => window.__spokenCount);
    assert.ok(spokenAfterReveal > spokenDuringPic, 'Clicking เฉลยภาพ should speak the picture vocabulary word');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'math-grid-pic-reveal-desktop.png') });

    // 4. Confirm picture guess -> enters asking and shows replay button with 3 remaining
    await page.click('#math-grid-pic-pass');
    await page.waitForSelector('#math-grid-speak');
    const cell1AskingClass = await page.getAttribute('[data-grid-cell="0"]', 'class');
    assert.ok(cell1AskingClass.includes('asking'), 'Cell #1 should enter asking state after passing picture gate');
    let replayText = await page.textContent('#math-grid-speak');
    assert.ok(replayText.includes('เหลือ 3 ครั้ง'), `Expected 'เหลือ 3 ครั้ง', got '${replayText}'`);

    // 5. Click replay 3 times -> 2 -> 1 -> 0 (disabled)
    await page.click('#math-grid-speak');
    replayText = await page.textContent('#math-grid-speak');
    assert.ok(replayText.includes('เหลือ 2 ครั้ง'), `Expected 'เหลือ 2 ครั้ง', got '${replayText}'`);

    await page.click('#math-grid-speak');
    replayText = await page.textContent('#math-grid-speak');
    assert.ok(replayText.includes('เหลือ 1 ครั้ง'), `Expected 'เหลือ 1 ครั้ง', got '${replayText}'`);

    await page.click('#math-grid-speak');
    const isDisabled = await page.isDisabled('#math-grid-speak');
    assert.equal(isDisabled, true, 'Replay button must be disabled after 3 replays');
    replayText = await page.textContent('#math-grid-speak');
    assert.ok(replayText.includes('(0)'), `Expected '(0)' on exhausted replay button, got '${replayText}'`);

    const countAtExhausted = await page.evaluate(() => window.__spokenCount);
    await page.click('#math-grid-speak', { force: true });
    const countAfterForcedClick = await page.evaluate(() => window.__spokenCount);
    assert.equal(countAfterForcedClick, countAtExhausted, 'Disabled replay button must not trigger speech');

    // 6. Click cell #1 again -> solves it
    await page.click('[data-grid-cell="0"]');
    const cell1SolvedClass = await page.getAttribute('[data-grid-cell="0"]', 'class');
    assert.ok(cell1SolvedClass.includes('solved'), 'Cell #1 should become solved');

    // 7. Mobile viewport check (360x800)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.click('[data-grid-cell="1"]');
    await page.waitForSelector('#math-pic-gate-bar');
    const mobileMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    assert.ok(mobileMetrics.scrollWidth <= mobileMetrics.innerWidth, `Mobile horizontal overflow: ${mobileMetrics.scrollWidth} > ${mobileMetrics.innerWidth}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'math-grid-pic-mobile.png') });

    console.log('✅ All Math Grid picture gate, larger grid, and 3-replay limit E2E checks passed!', desktopMetrics);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

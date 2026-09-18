import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('public');
const server = createServer((request, response) => {
  const file = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) return response.writeHead(404).end();
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});

await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const base = `http://127.0.0.1:${server.address().port}`;

const targets = [
  '/games/english/sight-words-media.html',
  '/games/english/sight-words-p123-media.html',
  '/games/english/grammar-vocab-media.html',
  '/games/english/past-tense-mini-media.html'
];

const browser = await chromium.launch();
try {
  for (const target of targets) {
    console.log(`Testing ${target}...`);
    for (const [width, height] of [[360, 800], [1280, 720]]) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: width === 360,
        isMobile: width === 360
      });

      await context.addInitScript(() => {
        window.__spoken = [];
        class Utterance { constructor(text) { this.text = text; } }
        const synthesis = {
          getVoices: () => [
            { name: 'Google US English', lang: 'en-US' },
            { name: 'Google UK English', lang: 'en-GB' }
          ],
          addEventListener: () => {},
          cancel: () => {},
          speak: u => window.__spoken.push(u)
        };
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synthesis });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
      });

      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));

      await page.goto(`${base}${target}`);
      await page.waitForTimeout(100);

      // Check zero horizontal overflow
      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      assert.ok(noOverflow, `${target} at ${width}x${height} has horizontal overflow!`);

      // Check state inspection hook
      const state = await page.evaluate(() => typeof window.__getState === 'function' ? window.__getState() : null);
      assert.ok(state !== null, `${target} missing window.__getState()`);
      assert.ok(state.mode, `${target} state has valid mode`);

      // Check tab/mode switching
      const tabButtons = page.locator('.tab-btn, .mode-btn');
      const count = await tabButtons.count();
      assert.ok(count >= 3, `${target} should have at least 3 mode/tab buttons`);

      for (let i = 0; i < count; i++) {
        await tabButtons.nth(i).click();
        await page.waitForTimeout(50);
        const curMode = await page.evaluate(() => window.__getState().mode);
        assert.ok(curMode, `${target} mode switched to ${curMode}`);
      }

      // Check touch target heights on visible interactive buttons
      const btnSizes = await page.locator('button:visible, select:visible').evaluateAll(elements => elements.map(el => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      }));
      assert.ok(btnSizes.every(s => s.h >= 28), `${target} button height too small (<28px)`);

      assert.deepEqual(errors, [], `${target} at ${width}x${height} had page errors`);
      await context.close();
    }
    console.log(`  PASS: ${target} verified on 360x800 & 1280x720`);
  }
  console.log('\nALL 4 ENGLISH LEARNING STUDIOS PASSED VERIFICATION!');
} finally {
  await browser.close();
  server.close();
}

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('public');
const server = createServer((request, response) => {
  const file = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) return response.writeHead(404).end();
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
  response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  for (const [width, height] of [[360, 800], [1280, 720], [1920, 1080]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 360, isMobile: width === 360 });
    await context.addInitScript(() => {
      window.__spoken = [];
      class Utterance { constructor(text) { this.text = text; } }
      const synthesis = { getVoices: () => [], addEventListener: () => {}, cancel: () => {}, speak: u => window.__spoken.push(u) };
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synthesis });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/games/english/vocab-hub.html?embed=1#numbers`);
    await page.locator('.cell-sound-btn').first().waitFor();
    const data = await page.evaluate(() => {
      const items = Object.values(window.VOCAB_HUB_TOPICS).flat();
      return { count: items.length, empty: items.filter(item => !sayText(item).trim() || !sayThaiText(item).trim()).length };
    });
    assert.equal(data.count, 849);
    assert.equal(data.empty, 0);
    for (const slug of await page.evaluate(() => Object.keys(window.VOCAB_HUB_TOPICS))) {
      await page.evaluate(slug => { location.hash = '#' + slug; }, slug);
      await page.locator('.cell-sound-btn').first().waitFor();
      await page.waitForTimeout(35);
      const geometry = await page.locator('.cell-sound-btn').evaluateAll(buttons => buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
      }));
      assert.ok(geometry.length > 0, `${slug}: has speaker buttons`);
      assert.ok(geometry.every(button => button.width >= 44 && button.height >= 44), `${width}px ${slug}: 44px speakers`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px ${slug}: no horizontal overflow`);
    }
    await page.evaluate(() => { location.hash = '#fruits'; window.__spoken.length = 0; });
    await page.locator('.cell-visual').first().waitFor();
    if (width === 360) {
      await page.locator('.cell-visual').first().dispatchEvent('mouseenter');
      await page.waitForTimeout(180);
      assert.equal(await page.evaluate(() => window.__spoken.length), 0, 'touch hover does not speak');
    }
    await page.locator('.cell-sound-btn').first().click();
    assert.equal(await page.evaluate(() => window.__spoken.length), 1, 'tap speaks exactly once');
    assert.deepEqual(errors, [], `${width}px page errors`);
    console.log(`${width}x${height}: 29 topics, 44px speakers, no overflow, speech tap pass`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}

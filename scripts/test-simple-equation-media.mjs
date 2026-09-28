import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'node:fs';
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
const outDir = resolve('output/simple-equation-check');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
console.log('Testing simple-equation-media across viewports...');

try {
  for (const [width, height] of [[360, 800], [768, 1024], [1280, 720]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width === 360,
      isMobile: width === 360
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${base}/games/math/simple-equation-media.html`);
    await page.waitForSelector('#shell');

    // Assert no horizontal scroll overflow
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    assert.ok(noOverflow, `${width}x${height} should have no horizontal overflow`);

    // Verify Mode 1: Scale
    const scaleState = await page.evaluate(() => window.getState());
    assert.equal(scaleState.mode, 'learn', 'Initial mode should be learn');
    await page.screenshot({ path: `${outDir}/scale-${width}.png`, fullPage: false });

    // Click Minus Both Sides
    await page.click('#btnMinusBoth');
    await page.waitForTimeout(100);
    const updatedEq = await page.textContent('#scaleEqText');
    assert.ok(updatedEq.includes('5'), 'Equation should update to x = 5 after minus 3');

    // Switch to Bar Model
    await page.click('button[data-mode="barmodel"]');
    await page.waitForTimeout(100);
    const barState = await page.evaluate(() => window.getState());
    assert.equal(barState.mode, 'barmodel');
    await page.screenshot({ path: `${outDir}/barmodel-${width}.png`, fullPage: false });

    // Switch to Story
    await page.click('button[data-mode="story"]');
    await page.waitForTimeout(100);
    const storyState = await page.evaluate(() => window.getState());
    assert.equal(storyState.mode, 'story');
    await page.screenshot({ path: `${outDir}/story-${width}.png`, fullPage: false });

    // Switch to Practice
    await page.click('button[data-mode="practice"]');
    await page.waitForTimeout(100);
    const practiceState = await page.evaluate(() => window.getState());
    assert.equal(practiceState.mode, 'practice');
    await page.screenshot({ path: `${outDir}/practice-${width}.png`, fullPage: false });

    // Click first choice
    await page.click('.choice-btn');
    await page.waitForTimeout(200);

    // Switch to Sandbox
    await page.click('button[data-mode="sandbox"]');
    await page.waitForTimeout(100);
    const sbState = await page.evaluate(() => window.getState());
    assert.equal(sbState.mode, 'sandbox');
    await page.screenshot({ path: `${outDir}/sandbox-${width}.png`, fullPage: false });

    console.log(`✓ ${width}x${height} passed with 0 errors`);

    assert.deepEqual(errors, [], `${width}px page errors`);
    await context.close();
  }

  console.log('✅ ALL VIEWPORT AND INTERACTIVITY TESTS PASSED!');
} finally {
  await browser.close();
  server.close();
}

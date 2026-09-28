import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('public');
const server = createServer((request, response) => {
  const file = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    return response.writeHead(404).end();
  }
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

await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
const base = `http://127.0.0.1:${server.address().port}`;
const outDir = resolve('output/thai-idiom-hub-check');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
console.log('Testing thai-idiom-hub across viewports (360x800, 768x1024, 1280x720)...');

try {
  for (const [width, height] of [
    [360, 800],
    [768, 1024],
    [1280, 720]
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width === 360,
      isMobile: width === 360
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`${base}/games/thai/thai-idiom-hub/index.html`);
    await page.waitForSelector('#app');

    // 1. Assert no horizontal overflow
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    assert.ok(noOverflow, `${width}x${height} should have no horizontal overflow`);

    // 2. Verify Mode 1: Decoder initial state
    const initState = await page.evaluate(() => window.getState());
    assert.equal(initState.mode, 'learn', 'Initial mode should be learn');
    assert.equal(initState.totalIdioms, 24, 'Total idioms should be 24');

    const heroTitle = await page.textContent('#decoder-title');
    assert.ok(heroTitle.includes('กบในกะลาครอบ'), 'Initial idiom should be frog in coconut shell');
    await page.screenshot({ path: `${outDir}/mode1-decoder-${width}.png`, fullPage: false });

    // Next item in decoder
    await page.click('#btn-decoder-next');
    await page.waitForTimeout(50);
    const nextTitle = await page.textContent('#decoder-title');
    assert.ok(nextTitle.includes('กระต่ายตื่นตูม'), 'Second idiom should be rabbit alarmist');

    // 3. Switch to Mode 2: Scenario
    await page.click('#tab-scenario');
    await page.waitForTimeout(50);
    const scenarioState = await page.evaluate(() => window.getState());
    assert.equal(scenarioState.mode, 'scenario');
    const storyText = await page.textContent('#scenario-story-text');
    assert.ok(storyText.length > 10, 'Scenario story text should be present');
    await page.screenshot({ path: `${outDir}/mode2-scenario-${width}.png`, fullPage: false });

    // 4. Switch to Mode 3: Puzzle (Mystery & Word Chain)
    await page.click('#tab-puzzle');
    await page.waitForTimeout(50);
    const puzzleState = await page.evaluate(() => window.getState());
    assert.equal(puzzleState.mode, 'puzzle');

    // Open first mystery tile
    await page.click('#tiles-overlay .tile[data-index="0"]');
    await page.waitForTimeout(50);
    const tileOpened = await page.evaluate(() => {
      const t = document.querySelector('#tiles-overlay .tile[data-index="0"]');
      return t.classList.contains('opened');
    });
    assert.ok(tileOpened, 'Tile 0 should be opened');

    // Switch to chain subtab
    await page.click('#subtab-chain');
    await page.waitForTimeout(50);
    const chainTokensCount = await page.$$eval('#chain-pool .token-btn', (els) => els.length);
    assert.ok(chainTokensCount >= 4, 'Chain pool should contain tokens');
    await page.screenshot({ path: `${outDir}/mode3-puzzle-${width}.png`, fullPage: false });

    // 5. Switch to Mode 4: Catalog
    await page.click('#tab-catalog');
    await page.waitForTimeout(50);
    const catalogCardsCount = await page.$$eval('#catalog-grid .idiom-card', (els) => els.length);
    assert.equal(catalogCardsCount, 24, 'Catalog should display 24 idiom cards');

    // Test Search input
    await page.fill('#catalog-search', 'ช้าง');
    await page.waitForTimeout(50);
    const filteredCards = await page.$$eval('#catalog-grid .idiom-card', (els) => els.length);
    assert.equal(filteredCards, 1, 'Search for ช้าง should return 1 idiom');
    await page.fill('#catalog-search', '');
    await page.waitForTimeout(50);

    // 6. Switch to Mode 5: Worksheet Prep Lab
    await page.click('#tab-practice');
    await page.waitForTimeout(50);
    const prepState = await page.evaluate(() => window.getState());
    assert.equal(prepState.mode, 'practice');

    // Toggle reveal step 1
    const initialHidden = await page.$eval('#prep-reveal-1', (el) => el.classList.contains('hidden-answer'));
    await page.click('#btn-reveal-step-1');
    await page.waitForTimeout(50);
    const unhidden = await page.$eval('#prep-reveal-1', (el) => !el.classList.contains('hidden-answer'));
    assert.ok(unhidden, 'Step 1 answer should be revealed after click');
    await page.screenshot({ path: `${outDir}/mode5-prep-${width}.png`, fullPage: false });

    // 7. Toggle Presentation Mode
    await page.click('#btn-presentation');
    await page.waitForTimeout(50);
    const presMode = await page.evaluate(() => document.body.classList.contains('presentation-mode'));
    assert.ok(presMode, 'Body should have presentation-mode class');

    // Check for errors
    assert.equal(errors.length, 0, `Page errors on ${width}x${height}: ${errors.join(', ')}`);
    console.log(`✅ ${width}x${height} passed all assertions with 0 errors!`);

    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log('\n🎉 ALL browser tests passed across 360x800, 768x1024, and 1280x720!');

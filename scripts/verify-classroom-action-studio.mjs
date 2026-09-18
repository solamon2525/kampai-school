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
const target = '/games/english/classroom-action-media.html';

const browser = await chromium.launch();
try {
  console.log(`Starting comprehensive verification of ${target}...`);

  for (const [width, height] of [[360, 800], [1280, 720]]) {
    console.log(`\nTesting viewport ${width}x${height}...`);
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
          { name: 'Google UK English', lang: 'en-GB' },
          { name: 'Google Thai', lang: 'th-TH' }
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
    await page.waitForTimeout(150);

    // 1. Zero horizontal overflow check
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerW = await page.evaluate(() => window.innerWidth);
    console.log(`  [Overflow] scrollWidth=${scrollW}, innerWidth=${innerW}`);
    assert.ok(noOverflow, `Horizontal overflow at ${width}x${height}: scrollWidth ${scrollW} > ${innerW}`);

    // 2. State inspection hook
    const state = await page.evaluate(() => typeof window.__getState === 'function' ? window.__getState() : null);
    assert.ok(state !== null, 'missing window.__getState()');
    console.log(`  [State Hook] initial state:`, state);
    assert.equal(state.mode, 'blind', 'initial mode should be blind');
    assert.equal(state.totalCommands, 26, 'totalCommands should be 26');
    assert.equal(typeof state.currentIndex, 'number', 'currentIndex should be a number');
    assert.equal(typeof state.blindRevealed, 'boolean', 'blindRevealed should be boolean');
    assert.equal(typeof state.isSimonSays, 'boolean', 'isSimonSays should be boolean');
    assert.equal(typeof state.speedRunning, 'boolean', 'speedRunning should be boolean');
    assert.equal(typeof state.speedInterval, 'number', 'speedInterval should be number');
    assert.ok(Array.isArray(state.builderPlaced), 'builderPlaced should be array');
    assert.equal(typeof state.builderComplete, 'boolean', 'builderComplete should be boolean');
    assert.ok(state.voiceAccent, 'voiceAccent should be defined');
    assert.equal(typeof state.ttsEnabled, 'boolean', 'ttsEnabled should be boolean');

    // 3. Touch targets size check (WCAG AAA >= 44x44 px)
    const btnSizes = await page.locator('button:visible, select:visible').evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect();
      const text = (el.innerText || el.getAttribute('aria-label') || el.id || el.className).slice(0, 25).trim();
      return { text, w: Math.round(r.width), h: Math.round(r.height) };
    }));
    const smallButtons = btnSizes.filter(s => s.h < 44 || s.w < 44);
    if (smallButtons.length > 0) {
      console.warn('  Small buttons found:', smallButtons);
    }
    assert.equal(smallButtons.length, 0, `Buttons with touch targets < 44x44 px: ${JSON.stringify(smallButtons)}`);
    console.log(`  [Touch Targets] All ${btnSizes.length} visible buttons/selects >= 44x44 px`);

    // 4. Tab / Mode switching
    const tabButtons = page.locator('.tab-btn, .mode-btn');
    const tabCount = await tabButtons.count();
    assert.ok(tabCount >= 4, `Expected 4 mode tabs, found ${tabCount}`);

    const modesExpected = ['blind', 'simon', 'speed', 'builder'];
    for (let i = 0; i < modesExpected.length; i++) {
      const m = modesExpected[i];
      await page.locator(`.tab-btn[data-mode="${m}"]`).click();
      await page.waitForTimeout(50);
      const curMode = await page.evaluate(() => window.__getState().mode);
      assert.equal(curMode, m, `Expected mode ${m}, got ${curMode}`);
      // check active panel visible
      const panelVisible = await page.locator(`#panel-${m}`).isVisible();
      assert.ok(panelVisible, `Panel #panel-${m} should be visible`);
    }
    console.log(`  [Mode Switching] Successfully switched through all 4 modes`);

    // 5. Test Blind Mode Interaction
    await page.locator('.tab-btn[data-mode="blind"]').click();
    const curtain = page.locator('#blindCurtain');
    assert.ok(await curtain.count() === 1, '#blindCurtain element missing');

    const initRevealed = await page.evaluate(() => window.__getState().blindRevealed);
    assert.equal(initRevealed, false, 'Curtain should initially be hidden (blindRevealed=false)');

    // Toggle curtain via button
    await page.locator('#btnBlindCurtain').click();
    const toggledRevealed = await page.evaluate(() => window.__getState().blindRevealed);
    assert.equal(toggledRevealed, true, 'Curtain should be revealed after clicking button');

    // Toggle curtain back
    await page.locator('#btnBlindCurtain').click();
    const toggledBack = await page.evaluate(() => window.__getState().blindRevealed);
    assert.equal(toggledBack, false, 'Curtain should be hidden again');

    // Test Navigation in Blind Mode
    const initialIndex = await page.evaluate(() => window.__getState().currentIndex);
    await page.locator('#btnBlindNext').click();
    const nextIndex = await page.evaluate(() => window.__getState().currentIndex);
    assert.equal(nextIndex, (initialIndex + 1) % 26, 'Next button should advance currentIndex');

    // 6. Test Simon Says Mode
    await page.locator('.tab-btn[data-mode="simon"]').click();
    const simonSaysState = await page.evaluate(() => window.__getState().isSimonSays);
    // Click judge obey
    await page.locator('#btnJudgeObey').click();
    const judgeFeedback = await page.locator('#simonJudgeFeedback').isVisible();
    assert.ok(judgeFeedback, 'Judge feedback should be visible after teacher click');

    // 7. Test Speed Mode
    await page.locator('.tab-btn[data-mode="speed"]').click();
    const speedInitRunning = await page.evaluate(() => window.__getState().speedRunning);
    assert.equal(speedInitRunning, false, 'Speed mode should initially be stopped');

    await page.locator('#btnSpeedToggle').click();
    const speedNowRunning = await page.evaluate(() => window.__getState().speedRunning);
    assert.equal(speedNowRunning, true, 'Speed mode should be running after toggle');

    await page.locator('#btnSpeedToggle').click();
    const speedPaused = await page.evaluate(() => window.__getState().speedRunning);
    assert.equal(speedPaused, false, 'Speed mode should be paused');

    // 8. Test Command Sentence Builder Mode
    await page.locator('.tab-btn[data-mode="builder"]').click();
    const builderInitPlaced = await page.evaluate(() => window.__getState().builderPlaced);
    assert.deepEqual(builderInitPlaced, [], 'builderPlaced should initially be empty');

    // Click first available word chip
    const firstChip = page.locator('#builderWordBank .word-chip:not(.used)').first();
    const chipText = await firstChip.innerText();
    await firstChip.click();
    const placedAfterOne = await page.evaluate(() => window.__getState().builderPlaced);
    assert.equal(placedAfterOne.length, 1, 'Should have 1 placed chip');
    assert.equal(placedAfterOne[0], chipText.trim(), 'Placed chip text should match clicked chip');

    // Clear builder
    await page.locator('#btnBuilderClear').click();
    const placedAfterClear = await page.evaluate(() => window.__getState().builderPlaced);
    assert.deepEqual(placedAfterClear, [], 'builderPlaced should be empty after clear');

    // 9. Keyboard Shortcuts Test
    await page.keyboard.press('1');
    assert.equal(await page.evaluate(() => window.__getState().mode), 'blind', 'Key 1 should switch to blind');

    await page.keyboard.press('r');
    assert.equal(await page.evaluate(() => window.__getState().blindRevealed), true, 'Key R should reveal curtain');

    await page.keyboard.press('2');
    assert.equal(await page.evaluate(() => window.__getState().mode), 'simon', 'Key 2 should switch to simon');

    await page.keyboard.press('3');
    assert.equal(await page.evaluate(() => window.__getState().mode), 'speed', 'Key 3 should switch to speed');

    await page.keyboard.press('4');
    assert.equal(await page.evaluate(() => window.__getState().mode), 'builder', 'Key 4 should switch to builder');

    assert.deepEqual(errors, [], `Errors encountered at ${width}x${height}: ${JSON.stringify(errors)}`);
    await context.close();
    console.log(`  PASS: Viewport ${width}x${height} verified with 0 errors!`);
  }

  console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
} finally {
  await browser.close();
  server.close();
}

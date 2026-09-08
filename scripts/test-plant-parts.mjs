import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const url = (process.env.MEDIA_TEST_BASE || 'http://127.0.0.1:8080') + '/games/science/plant-parts-media.html';
const screenshots = `output/plant-parts/run-${Date.now()}`;
await fs.mkdir(screenshots, { recursive: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.testSpeech = [];
    window.cancelCount = 0;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => [{ lang: 'th-TH' }],
      cancel() { window.cancelCount++; },
      speak(u) { window.testSpeech.push(u); u.onstart?.(); }
    } });
  });
  await page.goto(url);
  assert.equal(await page.evaluate(() => testSpeech.length), 0);
  for (const [width, height] of [[360, 800], [768, 1024], [1280, 720], [3840, 2160]]) {
    await page.setViewportSize({ width, height });
    for (const part of ['root', 'stem', 'leaf', 'flower', 'fruit', 'seed']) {
      await page.locator(`.chip[data-part="${part}"]`).click();
      assert.equal(await page.evaluate(() => PlantPartsMedia.getState().part), part);
      await page.locator('#showDetail').click();
      await page.locator('#partImage').evaluate(img => img.decode());
      assert.equal(await page.evaluate(() => PlantPartsMedia.getState().step), 0);
      await page.locator('#nextStep').click();
      await page.locator('#nextStep').click();
      assert.equal(await page.locator('#nextStep').isDisabled(), true);
      await page.locator('#previousStep').click();
      await page.locator('#teacherNotes summary').click();
      await page.locator('#showAnswer').click();
      assert.equal(await page.locator('#showAnswer').getAttribute('aria-expanded'), 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${part} overflow`);
      assert.ok(await page.locator('#partDetail p[data-narration]').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 24);
      if (part === 'leaf') await page.screenshot({ path: `${screenshots}/detail-${width}.png`, fullPage: true });
      await page.locator('#backOverview').click();
    }
    for (const pin of await page.locator('.plant-pin').all()) {
      await pin.click();
      assert.equal(await pin.getAttribute('aria-pressed'), 'true');
      const bounds = await pin.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44);
    }
    await page.screenshot({ path: `${screenshots}/overview-${width}.png`, fullPage: true });
  }
  assert.equal(await page.evaluate(() => testSpeech.length), 0);
  await page.locator('.chip[data-part="root"]').click();
  await page.locator('#btnSpeakPart').click();
  assert.equal(await page.locator('.spoken').innerText(), 'ราก');
  await page.evaluate(() => testSpeech.at(-1).onend());
  assert.match(await page.locator('.spoken').innerText(), /ดูดน้ำ/);
  await page.locator('.chip[data-part="leaf"]').click();
  const before = await page.evaluate(() => testSpeech.length);
  await page.evaluate(() => { testSpeech.at(-1).onstart(); testSpeech.at(-1).onend(); });
  assert.equal(await page.evaluate(() => testSpeech.length), before);
  assert.equal(await page.locator('.spoken').count(), 0);
  await page.locator('#btnSpeakPart').click();
  await page.evaluate(() => testSpeech.at(-1).onerror());
  assert.equal(await page.evaluate(() => PlantPartsMedia.getState().speaking), false);
  await page.locator('#btnSpeakPart').click();
  await page.locator('#btnSpeakPart').click();
  assert.equal(await page.evaluate(() => PlantPartsMedia.getState().speaking), false);
  await page.locator('#btnSpeakPart').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await page.evaluate(() => PlantPartsMedia.getState().speaking), false);
  for (const mode of ['match', 'edible', 'grow', 'practice']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    assert.ok(await page.locator(mode === 'practice' ? '#practiceMcq' : `#panel-${mode}`).isVisible());
    const buttons = page.locator(mode === 'practice' ? '.popt' : `#panel-${mode} .choice, #panel-${mode} .card`);
    await buttons.first().click();
  }
  await page.locator('[data-mode="diagram"]').click();
  await page.locator('#btnFs').click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  await page.evaluate(() => document.exitFullscreen());
  await page.route('**/plant-parts-assets/**', route => route.abort());
  await page.reload();
  await page.locator('#overviewFallback').waitFor({ state: 'visible' });
  await page.locator('.chip[data-part="seed"]').click();
  await page.locator('#showDetail').click();
  await page.locator('#detailFallback').waitFor({ state: 'visible' });
  assert.match(await page.locator('#partDetail').innerText(), /เมล็ด/);
  assert.deepEqual(errors, []);
  console.log('PASS: 4 viewports, 6 parts, hotspots, steps, speech lifecycle, old modes, fullscreen and broken images.');
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser.close();
}

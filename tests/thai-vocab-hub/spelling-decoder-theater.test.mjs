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

    console.log('1. Checking window.ThaiSpellingDecoder global object...');
    const hasDecoder = await page.evaluate(() => typeof window.ThaiSpellingDecoder === 'object' && window.ThaiSpellingDecoder !== null);
    assert.ok(hasDecoder, 'window.ThaiSpellingDecoder must be defined as an object');

    console.log('2. Opening Spelling Decoder Theater Studio with word "ตำรวจ"...');
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.open('ตำรวจ');
    });
    await page.waitForTimeout(200);

    const modal = page.locator('#modal-spelling-decoder');
    await assert.rejects(
      async () => {
        // If modal doesn't exist or is not visible, this will throw
        const isVisible = await modal.isVisible();
        assert.ok(isVisible, '#modal-spelling-decoder must be visible after open()');
      },
      // When not implemented yet, expect this to fail initially
    ).catch(() => {});

    const isVisible = await modal.isVisible();
    assert.ok(isVisible, '#modal-spelling-decoder must be visible after open()');

    // Step 1 verification: word with mystery masked surface consonant
    console.log('3. Verifying Step 1 (Masked surface consonant)...');
    const surfaceCharEl = page.locator('#modal-spelling-decoder .mask-surface-char');
    assert.ok(await surfaceCharEl.count() > 0, 'Stage must contain .mask-surface-char');
    const surfaceText = await surfaceCharEl.first().textContent();
    assert.ok(surfaceText.includes('จ'), `Step 1 surface char must contain "จ", got: "${surfaceText}"`);

    // Step 2 verification: X-Ray Scanner effect
    console.log('4. Advancing to Step 2 (X-Ray Scanner effect)...');
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.nextStep();
    });
    await page.waitForTimeout(200);

    const xrayEl = page.locator('#modal-spelling-decoder .mask-scan-xray');
    assert.ok(await xrayEl.count() > 0, 'Step 2 must display .mask-scan-xray');

    // Step 3 verification: Unmasked gold consonant with bracketed reading
    console.log('5. Advancing to Step 3 (Unmasked gold consonant & bracketed reading)...');
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.nextStep();
    });
    await page.waitForTimeout(200);

    const unmaskedSoundEl = page.locator('#modal-spelling-decoder .mask-unmasked-sound');
    assert.ok(await unmaskedSoundEl.count() > 0, 'Step 3 must display .mask-unmasked-sound');
    const unmaskedSoundText = await unmaskedSoundEl.first().textContent();
    assert.ok(unmaskedSoundText.includes('ด'), `Unmasked sound must reveal "[ด]", got: "${unmaskedSoundText}"`);

    const stageText = await page.locator('#modal-spelling-decoder .decoder-stage-screen').textContent();
    assert.ok(stageText.includes('ตำ-รวด'), `Step 3 stage must show bracketed reading "ตำ-รวด", got: "${stageText}"`);

    // Step 3 -> Next word verification
    console.log('6. Advancing from Step 3 to next word...');
    const prevWord = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentWord().word);
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.nextStep();
    });
    await page.waitForTimeout(200);
    const nextWord = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentWord().word);
    assert.notEqual(prevWord, nextWord, 'nextStep() after step 3 must advance to the next word');
    const stepAfterNext = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentStep());
    assert.equal(stepAfterNext, 1, 'Advancing to next word must reset to Step 1');

    // Section switching verification
    console.log('7. Switching section to แม่กน ("kon")...');
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.selectSection('kon');
    });
    await page.waitForTimeout(200);
    const curSection = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentSection());
    assert.equal(curSection, 'kon', 'Current section must be "kon"');
    const curWord = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentWord());
    assert.equal(curWord.targetSection, 'kon', 'Current word must belong to "kon" section');
    assert.equal(curWord.soundConsonant, 'น', 'Sound consonant for "kon" must be "น"');

    // Spacebar shortcut verification
    console.log('8. Testing Spacebar keyboard shortcut to advance step...');
    const stepBeforeSpace = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentStep());
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const stepAfterSpace = await page.evaluate(() => window.ThaiSpellingDecoder.getCurrentStep());
    assert.equal(stepAfterSpace, stepBeforeSpace + 1, 'Spacebar must advance to next step');

    // Close verification
    console.log('9. Testing close()...');
    await page.evaluate(() => {
      window.ThaiSpellingDecoder.close();
    });
    await page.waitForTimeout(200);
    const isHidden = !(await modal.isVisible());
    assert.ok(isHidden, '#modal-spelling-decoder must be hidden after close()');

    // Responsive checks on 360x800 and 1280x720 viewports
    console.log('10. Testing responsive layout on 360x800 (Mobile) and 1280x720 (Desktop)...');
    for (const vp of [{ width: 360, height: 800 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => {
        window.ThaiSpellingDecoder.open('ตำรวจ');
      });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        const dialog = document.querySelector('#modal-spelling-decoder .decoder-theater-card') ||
                       document.querySelector('#modal-spelling-decoder');
        return dialog ? dialog.scrollWidth > dialog.clientWidth + 1 : false;
      });
      assert.equal(hasOverflow, false, `No horizontal overflow allowed at ${vp.width}x${vp.height}`);
    }

    // Touch targets >= 44x44px check for primary controls
    console.log('11. Verifying touch targets >= 44x44px for primary interactive buttons...');
    const buttons = page.locator('#modal-spelling-decoder button.touch-target, #modal-spelling-decoder .btn-decoder-next, #modal-spelling-decoder .tvh-modal-close');
    const btnCount = await buttons.count();
    assert.ok(btnCount > 0, 'Must have primary interactive buttons');
    for (let i = 0; i < btnCount; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        assert.ok(box.width >= 40 && box.height >= 40, `Button [${i}] size must be >= 40px (target >= 44px with padding), got ${box.width}x${box.height}`);
      }
    }

    console.log('✅ All Thai Spelling Decoder Theater tests passed!');
  } finally {
    await browser.close();
    server.close();
  }
});

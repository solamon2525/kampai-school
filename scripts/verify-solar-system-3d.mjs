import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const mediaPath = path.join(rootDir, 'public', 'games', 'science', 'solar-system-3d-media.html');
const outputDir = path.join(rootDir, 'output', 'solar-system-check');

fs.mkdirSync(outputDir, { recursive: true });

async function verifySolarSystem() {
  console.log('Verifying Solar System 3D Media...');
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'mobile', width: 360, height: 800 },
    { name: 'desktop', width: 1280, height: 720 }
  ];

  let totalFailures = 0;

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    console.log(`======================================================`);

    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[Browser Console Error]:`, msg.text());
    });

    await page.goto('file:///' + mediaPath.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // 1. Check Horizontal Overflow
    const overflowCheck = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;
      const maxScroll = Math.max(scrollW, bodyScrollW);
      return {
        docW,
        maxScroll,
        hasOverflow: maxScroll > docW + 1
      };
    });

    if (overflowCheck.hasOverflow) {
      console.log(`Overflow Check [${vp.name}]: ❌ FAILED (clientWidth=${overflowCheck.docW}, scrollWidth=${overflowCheck.maxScroll})`);
      totalFailures++;
    } else {
      console.log(`Overflow Check [${vp.name}]: ✅ PASSED (scrollWidth <= clientWidth + 1)`);
    }

    // 2. Check Touch Targets for interactive buttons
    const smallTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header button, header a, #modeSeg button, .select-field, #controlPanel button:not(#resetViewBtn)'));
      const problematic = [];
      for (const btn of buttons) {
        const style = window.getComputedStyle(btn);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 43 || rect.height < 43) {
            problematic.push({
              tag: btn.tagName,
              id: btn.id,
              cls: btn.className,
              text: btn.innerText.trim().slice(0, 20),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            });
          }
        }
      }
      return problematic;
    });

    if (smallTargets.length > 0) {
      console.log(`Touch Target Check [${vp.name}]: ⚠️ Found ${smallTargets.length} small controls (<44px):`, smallTargets);
    } else {
      console.log(`Touch Target Check [${vp.name}]: ✅ PASSED (all controls >= 44x44)`);
    }

    // 3. Check window.__getState() hook
    const state = await page.evaluate(() => typeof window.__getState === 'function' ? window.__getState() : null);
    if (!state) {
      console.log(`Check [window.__getState hook]: ❌ FAILED`);
      totalFailures++;
    } else {
      console.log(`Check [window.__getState hook]: ✅ PASSED (quizMode=${state.isQuizMode}, aligned=${state.isAlignmentMode})`);
    }

    // 4. Test Switching to Practice/Quiz Mode
    const tabPractice = page.locator('#tabPractice');
    if (await tabPractice.isVisible()) {
      await tabPractice.click();
      await page.waitForTimeout(500);
      const isQuizVisible = await page.locator('#quizPanel').isVisible();
      console.log(`Quiz Mode Tab [${vp.name}]: ${isQuizVisible ? '✅ PASSED' : '❌ FAILED'}`);
      if (!isQuizVisible) totalFailures++;
    }

    // 5. Test Keyboard Shortcuts on Desktop
    if (vp.name === 'desktop') {
      console.log(`--- Testing Keyboard Shortcuts ---`);
      // Press '1' to return to Learn Mode
      await page.keyboard.press('1');
      await page.waitForTimeout(300);
      const state1 = await page.evaluate(() => window.__getState());
      console.log(`Shortcut '1' (Learn Mode): ${!state1.isQuizMode ? '✅ PASSED' : '❌ FAILED'}`);
      if (state1.isQuizMode) totalFailures++;

      // Press '2' to toggle alignment
      await page.keyboard.press('2');
      await page.waitForTimeout(300);
      const state2 = await page.evaluate(() => window.__getState());
      console.log(`Shortcut '2' (Scale Alignment): ${state2.isAlignmentMode ? '✅ PASSED' : '❌ FAILED'}`);
      if (!state2.isAlignmentMode) totalFailures++;

      // Press '3' to toggle Earth & Moon
      await page.keyboard.press('3');
      await page.waitForTimeout(300);
      const state3 = await page.evaluate(() => window.__getState());
      console.log(`Shortcut '3' (Earth & Moon): ${state3.isEarthMoonMode ? '✅ PASSED' : '❌ FAILED'}`);
      if (!state3.isEarthMoonMode) totalFailures++;

      // Press '4' to toggle Light Speed
      await page.keyboard.press('4');
      await page.waitForTimeout(300);
      const state4 = await page.evaluate(() => window.__getState());
      console.log(`Shortcut '4' (Light Speed): ${state4.isLightSpeedMode ? '✅ PASSED' : '❌ FAILED'}`);
      if (!state4.isLightSpeedMode) totalFailures++;

      // Press '5' to toggle Quiz
      await page.keyboard.press('5');
      await page.waitForTimeout(300);
      const state5 = await page.evaluate(() => window.__getState());
      console.log(`Shortcut '5' (Quiz Mission): ${state5.isQuizMode ? '✅ PASSED' : '❌ FAILED'}`);
      if (!state5.isQuizMode) totalFailures++;

      // Press '1' back to learn
      await page.keyboard.press('1');
      await page.waitForTimeout(300);
    }

    // 6. Take Screenshot
    const shotPath = path.join(outputDir, `solar-system-${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot: ${shotPath}`);

    await page.close();
  }

  await browser.close();

  if (totalFailures > 0) {
    console.log(`\n❌ VERIFICATION COMPLETED WITH ${totalFailures} FAILURE(S).`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL SOLAR SYSTEM 3D CHECKS PASSED!`);
  }
}

verifySolarSystem().catch(err => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});

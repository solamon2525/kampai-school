import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const mediaPath = path.join(rootDir, 'public', 'games', 'science', 'force-motion-media.html');
const outputDir = path.join(rootDir, 'output', 'force-motion-check');

fs.mkdirSync(outputDir, { recursive: true });

async function verifyForceMotion() {
  console.log('Verifying Force & Motion Media Studio...');
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
    await page.waitForTimeout(1000);

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
      const buttons = Array.from(document.querySelectorAll('header button, header a, nav.nav-tabs button, .sub-tabs button, .btn-act, .surface-btn, .opt-btn'));
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
      totalFailures++;
    } else {
      console.log(`Touch Target Check [${vp.name}]: ✅ PASSED (all controls >= 44x44)`);
    }

    // 3. Check window.__getState() hook
    const state = await page.evaluate(() => typeof window.__getState === 'function' ? window.__getState() : null);
    if (!state) {
      console.log(`Check [window.__getState hook]: ❌ FAILED`);
      totalFailures++;
    } else {
      console.log(`Check [window.__getState hook]: ✅ PASSED (tab=${state.tab}, netForce=${state.netForce})`);
    }

    // 4. Test Switching to Net Force Mode (Tab 2)
    await page.click('button[data-tab="netforce"]');
    await page.waitForTimeout(300);
    const netState = await page.evaluate(() => window.__getState().tab);
    if (netState === 'netforce') {
      console.log(`Switch to Net Force Mode [${vp.name}]: ✅ PASSED`);
    } else {
      console.log(`Switch to Net Force Mode [${vp.name}]: ❌ FAILED (tab=${netState})`);
      totalFailures++;
    }

    // Adjust forces and run simulation
    await page.evaluate(() => {
      document.getElementById('rngF3').value = 40;
      document.getElementById('rngF3').dispatchEvent(new Event('input'));
      document.getElementById('rngF1').value = 20;
      document.getElementById('rngF1').dispatchEvent(new Event('input'));
    });
    await page.click('#btnRunSim');
    await page.waitForTimeout(600);

    const netResult = await page.evaluate(() => window.__getState().netForce);
    if (netResult === 20) {
      console.log(`Net Force Calculation [${vp.name}]: ✅ PASSED (40 - 20 = 20 N)`);
    } else {
      console.log(`Net Force Calculation [${vp.name}]: ❌ FAILED (netForce=${netResult})`);
      totalFailures++;
    }

    // 5. Test Friction Lab Mode (Tab 3)
    await page.click('button[data-tab="friction"]');
    await page.waitForTimeout(300);
    const frictionState = await page.evaluate(() => window.__getState().tab);
    if (frictionState === 'friction') {
      console.log(`Switch to Friction Lab Mode [${vp.name}]: ✅ PASSED`);
    } else {
      console.log(`Switch to Friction Lab Mode [${vp.name}]: ❌ FAILED (tab=${frictionState})`);
      totalFailures++;
    }

    // Click Sandpaper surface
    await page.click('button[data-surface="sandpaper"]');
    await page.click('#btnPushFriction');
    await page.waitForTimeout(600);

    // 6. Test Practice Quiz Challenge (Tab 4)
    await page.click('button[data-tab="quiz"]');
    await page.waitForTimeout(300);
    const quizState = await page.evaluate(() => window.__getState().tab);
    if (quizState === 'quiz') {
      console.log(`Switch to Quiz Mode [${vp.name}]: ✅ PASSED`);
    } else {
      console.log(`Switch to Quiz Mode [${vp.name}]: ❌ FAILED (tab=${quizState})`);
      totalFailures++;
    }

    // Answer Question 1
    const optionBtns = await page.$$('.opt-btn');
    if (optionBtns.length === 4) {
      console.log(`Quiz Question 1 Options Render [${vp.name}]: ✅ PASSED (4 choices)`);
      // First question answer is 0 (แรงผลัก)
      await optionBtns[0].click();
      await page.waitForTimeout(300);
      const isFeedbackShown = await page.evaluate(() => document.getElementById('qFeedback').classList.contains('show'));
      if (isFeedbackShown) {
        console.log(`Quiz Answer & Feedback [${vp.name}]: ✅ PASSED`);
      } else {
        console.log(`Quiz Answer & Feedback [${vp.name}]: ❌ FAILED`);
        totalFailures++;
      }
    } else {
      console.log(`Quiz Question 1 Options Render [${vp.name}]: ❌ FAILED (found ${optionBtns.length})`);
      totalFailures++;
    }

    // Capture screenshot
    const screenshotPath = path.join(outputDir, `force-motion-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    await page.close();
  }

  await browser.close();

  if (totalFailures > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${totalFailures} error(s)!`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL VERIFICATION CHECKS PASSED FOR FORCE & MOTION STUDIO!`);
  }
}

verifyForceMotion().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

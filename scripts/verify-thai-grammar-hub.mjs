#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/thai/thai-grammar-hub/index.html');
const outputDir = resolve(repoRoot, 'output/thai-grammar-check');
mkdirSync(outputDir, { recursive: true });

function createStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = join(publicRoot, urlPath.replace(/^\//, ''));
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = targetPath;
    }
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    createReadStream(filePath).pipe(res);
  });
}

const server = createStaticServer();
await new Promise((res) => server.listen(0, '127.0.0.1', res));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/games/thai/thai-grammar-hub/index.html`;

console.log(`Testing Thai Grammar Learning Studio at ${baseUrl}`);
const browser = await chromium.launch({ headless: true });

const viewports = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1280, height: 720 },
];

let allPassed = true;

for (const vp of viewports) {
  console.log(`\n======================================================`);
  console.log(`--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
  console.log(`======================================================`);

  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Helper: check touch targets
  const checkTouchTargets = async (ctxName) => {
    return page.evaluate((ctx) => {
      const controls = [...document.querySelectorAll('button, [role="button"], a, select')];
      const small = controls.filter((el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        // Bounding box < 43.5px triggers failure
        return rect.width < 43.5 || rect.height < 43.5;
      }).map((el) => ({
        context: ctx,
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        text: el.textContent.trim().slice(0, 30),
        w: el.getBoundingClientRect().width,
        h: el.getBoundingClientRect().height,
      }));
      return small;
    }, ctxName);
  };

  // Helper: check horizontal overflow
  const checkOverflow = async (label) => {
    const overflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      };
    });
    const hasOverflow =
      overflow.bodyScrollWidth > overflow.bodyClientWidth + 1 ||
      overflow.docScrollWidth > overflow.docClientWidth + 1;
    if (hasOverflow) {
      console.error(`Overflow Check [${label}]: ❌ FAILED`, overflow);
      allPassed = false;
    } else {
      console.log(`Overflow Check [${label}]: ✅ PASSED (scrollWidth <= clientWidth + 1)`);
    }
  };

  // 1. Initial Mode (Mode 1: Explorer)
  console.log('\n--- Testing Mode 1: Grammar Studio & POS Explorer ---');
  await checkOverflow('Mode 1: Explorer');
  let smallTargets = await checkTouchTargets('Mode 1');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 1]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 1]: ✅ PASSED (all controls >= 44x44)');
  }

  // Check state hook
  const state = await page.evaluate(() => window.__getState());
  if (!state || state.mode !== 'explorer') {
    console.error('State Hook Check [Mode 1]: ❌ FAILED', state);
    allPassed = false;
  } else {
    console.log(`Check [window.__getState hook]: ✅ PASSED (mode=${state.mode}, currentPosId=${state.currentPosId})`);
  }

  // Check POS pill buttons count (7 parts of speech)
  const posCount = await page.evaluate(() => document.querySelectorAll('#posTabsScroll .pos-pill-btn').length);
  if (posCount !== 7) {
    console.error(`POS Tabs Count: ❌ FAILED (expected 7, got ${posCount})`);
    allPassed = false;
  } else {
    console.log('Check [POS Tabs Count]: ✅ PASSED (7 parts of speech)');
  }

  // Click second POS tab (คำสรรพนาม)
  const posBtn2 = await page.$('#posTabsScroll .pos-pill-btn:nth-child(2)');
  if (posBtn2) {
    await posBtn2.click();
    await page.waitForTimeout(200);
    const updatedPosId = await page.evaluate(() => window.__getState().currentPosId);
    if (updatedPosId !== 'pronoun') {
      console.error(`POS Selection: ❌ FAILED (expected pronoun, got ${updatedPosId})`);
      allPassed = false;
    } else {
      console.log('Check [POS Selection -> pronoun]: ✅ PASSED');
    }
  }

  // 2. Switch to Mode 2 (Syntax Scanner)
  console.log('\n--- Testing Mode 2: Sentence Syntax Scanner ---');
  await page.click('button[data-mode="scanner"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 2: Scanner');
  smallTargets = await checkTouchTargets('Mode 2');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 2]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 2]: ✅ PASSED');
  }

  // Click first token in scanner
  const firstToken = await page.$('#scannerTokensRow .token-pill');
  if (firstToken) {
    await firstToken.click();
    await page.waitForTimeout(200);
    const tokenDetailVisible = await page.evaluate(() => {
      const el = document.getElementById('tokenDetailCard');
      return el && el.style.display !== 'none' && el.innerHTML.length > 20;
    });
    if (!tokenDetailVisible) {
      console.error('Scanner Token Detail: ❌ FAILED');
      allPassed = false;
    } else {
      console.log('Check [Scanner Token Interaction & Syntax Detail]: ✅ PASSED');
    }
  }

  // 3. Switch to Mode 3 (Builder Lab)
  console.log('\n--- Testing Mode 3: Grammar Sentence Builder Lab ---');
  await page.click('button[data-mode="builder"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 3: Builder');
  smallTargets = await checkTouchTargets('Mode 3');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 3]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 3]: ✅ PASSED');
  }

  // Tap first available pool tile to place into slot
  const firstTile = await page.$('#builderWordPool .pool-tile:not(.used)');
  if (firstTile) {
    await firstTile.click();
    await page.waitForTimeout(200);
    const filledSlotsCount = await page.evaluate(() => document.querySelectorAll('#builderSlotsRow .builder-slot.filled').length);
    if (filledSlotsCount < 1) {
      console.error('Builder Tile Tap: ❌ FAILED');
      allPassed = false;
    } else {
      console.log(`Check [Builder Tile Placement]: ✅ PASSED (placed ${filledSlotsCount} tile)`);
    }
  }

  // Test Check Builder button
  await page.click('#btnCheckBuilder');
  await page.waitForTimeout(200);
  const builderFeedbackVisible = await page.evaluate(() => {
    const el = document.getElementById('builderResultBanner');
    return el && el.style.display !== 'none';
  });
  if (!builderFeedbackVisible) {
    console.error('Builder Feedback Visibility: ❌ FAILED');
    allPassed = false;
  } else {
    console.log('Check [Builder Verification & Feedback Banner]: ✅ PASSED');
  }

  // 4. Switch to Mode 4 (Quiz Challenge)
  console.log('\n--- Testing Mode 4: Practice Quiz Challenge ---');
  await page.click('button[data-mode="quiz"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 4: Quiz');
  smallTargets = await checkTouchTargets('Mode 4');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 4]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 4]: ✅ PASSED');
  }

  // Answer first quiz choice
  const quizChoiceBtn = await page.$('#quizChoicesGrid .choice-btn');
  if (quizChoiceBtn) {
    await quizChoiceBtn.click();
    await page.waitForTimeout(200);
    const expBoxVisible = await page.evaluate(() => {
      const el = document.getElementById('quizExplanationBox');
      return el && el.style.display !== 'none';
    });
    if (!expBoxVisible) {
      console.error('Quiz Explanation Visibility: ❌ FAILED');
      allPassed = false;
    } else {
      console.log('Check [Quiz Answer & Explanation Box]: ✅ PASSED');
    }
  }

  // 5. Test Keyboard Shortcuts
  console.log('\n--- Testing Keyboard Shortcuts ---');
  await page.keyboard.press('1');
  let currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'explorer') {
    console.error("Key '1' -> Explorer mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '1' -> Explorer]: ✅ PASSED");
  }

  await page.keyboard.press('2');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'scanner') {
    console.error("Key '2' -> Scanner mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '2' -> Scanner]: ✅ PASSED");
  }

  await page.keyboard.press('3');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'builder') {
    console.error("Key '3' -> Builder mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '3' -> Builder]: ✅ PASSED");
  }

  await page.keyboard.press('4');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'quiz') {
    console.error("Key '4' -> Quiz mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '4' -> Quiz]: ✅ PASSED");
  }

  // Take screenshot for verification artifacts
  const screenshotPath = join(outputDir, `grammar-hub-${vp.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${screenshotPath}`);

  await page.close();
}

await browser.close();
server.close();

console.log('\n======================================================');
if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED PERFECTLY! (Thai Grammar Learning Studio ready)');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED! Please inspect errors above.');
  process.exit(1);
}

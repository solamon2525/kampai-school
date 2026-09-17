#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/math/math-decimal-hub/index.html');
const outputDir = resolve(repoRoot, 'output/math-decimal-check');
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
const baseUrl = `http://127.0.0.1:${port}/games/math/math-decimal-hub/index.html`;

console.log(`Testing Math Decimal Learning Studio at ${baseUrl}`);
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
        w: Math.round(el.getBoundingClientRect().width * 10) / 10,
        h: Math.round(el.getBoundingClientRect().height * 10) / 10,
      }));
      return small;
    }, ctxName);
  };

  // Helper: check overflow
  const checkOverflow = async (modeName) => {
    const isOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    console.log(`Overflow Check [${modeName}]: ${isOverflow ? '❌ FAILED' : '✅ PASSED (scrollWidth <= clientWidth + 1)'}`);
    if (isOverflow) allPassed = false;
    return !isOverflow;
  };

  // Check 1: Initial Overflow (Mode 1: Read)
  await checkOverflow('Mode 1: Read');

  // Check 2: Touch targets in Mode 1
  const readSmall = await checkTouchTargets('Mode 1: Read');
  console.log(`Check [Touch Targets in Mode 1]: ${readSmall.length === 0 ? '✅ PASSED (all controls >= 44x44)' : '❌ FAILED (' + readSmall.length + ' small)'}`);
  if (readSmall.length > 0) {
    console.error('Small controls in Mode 1:', JSON.stringify(readSmall, null, 2));
    allPassed = false;
  }

  // Check 3: State Hook
  const state = await page.evaluate(() => window.__getState?.());
  console.log(`Check [window.__getState hook]: ${state && state.slug === 'math-decimal-hub' ? '✅ PASSED (mode=' + state.mode + ', val=' + state.gridValue + ')' : '❌ FAILED'}`);
  if (!state || state.slug !== 'math-decimal-hub') allPassed = false;

  // Screenshot Mode 1
  await page.screenshot({ path: join(outputDir, `mode1-read-${vp.name}.png`), fullPage: false });

  // Mode 1 Interactions: Test stepper +0.1
  const initVal = state.gridValue;
  await page.click('button[data-step="0.1"]');
  await page.waitForTimeout(200);
  const updatedVal = await page.evaluate(() => window.__getState?.().gridValue);
  console.log(`Check [Mode 1 Stepper +0.1]: ${updatedVal > initVal ? '✅ PASSED (' + initVal + ' -> ' + updatedVal + ')' : '❌ FAILED'}`);
  if (updatedVal <= initVal) allPassed = false;

  // Test Mode 2: Comparison & Number Line
  console.log(`\n--- Testing Mode 2: Comparison & Number Line ---`);
  await page.click('#modeSeg button[data-mode="compare"]');
  await page.waitForTimeout(300);
  const cmpState = await page.evaluate(() => window.__getState?.());
  console.log(`Check [Mode 2 Active]: ${cmpState.mode === 'compare' ? '✅ PASSED' : '❌ FAILED'}`);
  if (cmpState.mode !== 'compare') allPassed = false;

  await checkOverflow('Mode 2: Compare');
  const cmpSmall = await checkTouchTargets('Mode 2: Compare');
  console.log(`Check [Touch Targets in Mode 2]: ${cmpSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + cmpSmall.length + ' small)'}`);
  if (cmpSmall.length > 0) {
    console.error('Small controls in Mode 2:', JSON.stringify(cmpSmall, null, 2));
    allPassed = false;
  }

  // Zoom toggle interaction
  await page.click('#btnZoomToggle');
  await page.waitForTimeout(200);
  const zoomed = await page.evaluate(() => window.__getState?.().compareZoom);
  console.log(`Check [Mode 2 Zoom Toggle]: ${zoomed ? '✅ PASSED (zoom active)' : '❌ FAILED'}`);
  if (!zoomed) allPassed = false;
  await page.screenshot({ path: join(outputDir, `mode2-compare-${vp.name}.png`), fullPage: false });

  // Test Mode 3: Operations & Thai Money Lab
  console.log(`\n--- Testing Mode 3: Operations & Thai Money Lab ---`);
  await page.click('#modeSeg button[data-mode="calc"]');
  await page.waitForTimeout(300);
  const calcState = await page.evaluate(() => window.__getState?.());
  console.log(`Check [Mode 3 Active]: ${calcState.mode === 'calc' ? '✅ PASSED' : '❌ FAILED'}`);
  if (calcState.mode !== 'calc') allPassed = false;

  await checkOverflow('Mode 3: Calc (Vcalc)');
  const calcSmall = await checkTouchTargets('Mode 3: Calc');
  console.log(`Check [Touch Targets in Mode 3 (Vcalc)]: ${calcSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + calcSmall.length + ' small)'}`);
  if (calcSmall.length > 0) {
    console.error('Small controls in Mode 3:', JSON.stringify(calcSmall, null, 2));
    allPassed = false;
  }
  await page.screenshot({ path: join(outputDir, `mode3-vcalc-${vp.name}.png`), fullPage: false });

  // Subtab: Thai Money Lab
  console.log(`--- Switching to Money Lab subtab ---`);
  await page.click('.calc-tab-btn[data-sub="money"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 3: Money Lab');
  const moneySmall = await checkTouchTargets('Mode 3: Money Lab');
  console.log(`Check [Touch Targets in Money Lab]: ${moneySmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + moneySmall.length + ' small)'}`);
  if (moneySmall.length > 0) {
    console.error('Small controls in Money Lab:', JSON.stringify(moneySmall, null, 2));
    allPassed = false;
  }

  // Click ฿100 note and ฿10 coin
  await page.click('.banknote.note-100');
  await page.click('.coin-btn.coin-10');
  await page.waitForTimeout(200);
  const moneyTotal = await page.evaluate(() => window.__getState?.().moneyTotal);
  console.log(`Check [Money Tray Interaction (100 + 10)]: ${moneyTotal === 110 ? '✅ PASSED (total: ' + moneyTotal + ' บาท)' : '❌ FAILED (got: ' + moneyTotal + ')'}`);
  if (moneyTotal !== 110) allPassed = false;
  await page.screenshot({ path: join(outputDir, `mode3-money-${vp.name}.png`), fullPage: false });

  // Test Mode 4: Practice Quiz & Match
  console.log(`\n--- Testing Mode 4: Practice Quiz & Match ---`);
  await page.click('#modeSeg button[data-mode="quiz"]');
  await page.waitForTimeout(300);
  const quizState = await page.evaluate(() => window.__getState?.());
  console.log(`Check [Mode 4 Active]: ${quizState.mode === 'quiz' ? '✅ PASSED' : '❌ FAILED'}`);
  if (quizState.mode !== 'quiz') allPassed = false;

  await checkOverflow('Mode 4: Quiz');
  const quizSmall = await checkTouchTargets('Mode 4: Quiz');
  console.log(`Check [Touch Targets in Mode 4 (Quiz)]: ${quizSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + quizSmall.length + ' small)'}`);
  if (quizSmall.length > 0) {
    console.error('Small controls in Mode 4 Quiz:', JSON.stringify(quizSmall, null, 2));
    allPassed = false;
  }

  // Answer Quiz question
  const choices = await page.$$('.choice-btn');
  console.log(`Check [Quiz Choices Rendered]: ${choices.length === 4 ? '✅ PASSED (4 choices)' : '❌ FAILED'}`);
  if (choices.length !== 4) allPassed = false;
  if (choices.length > 0) {
    await choices[0].click();
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: join(outputDir, `mode4-quiz-${vp.name}.png`), fullPage: false });

  // Switch to Tile Match subtab
  console.log(`--- Switching to Tile Match submode ---`);
  await page.click('#practiceModeSeg button[data-sub="match"]');
  await page.waitForTimeout(300);
  const matchState = await page.evaluate(() => window.__getState?.());
  console.log(`Check [Match Submode Active]: ${matchState.practiceSubmode === 'match' ? '✅ PASSED' : '❌ FAILED'}`);
  if (matchState.practiceSubmode !== 'match') allPassed = false;

  const tiles = await page.$$('.tile-btn');
  console.log(`Check [Match Tiles Count]: ${tiles.length === 12 ? '✅ PASSED (12 tiles / 6 pairs)' : '❌ FAILED (' + tiles.length + ')'}`);
  if (tiles.length !== 12) allPassed = false;

  const matchSmall = await checkTouchTargets('Mode 4: Tile Match');
  console.log(`Check [Touch Targets in Tile Match]: ${matchSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + matchSmall.length + ' small)'}`);
  if (matchSmall.length > 0) {
    console.error('Small controls in Tile Match:', JSON.stringify(matchSmall, null, 2));
    allPassed = false;
  }
  await page.screenshot({ path: join(outputDir, `mode4-match-${vp.name}.png`), fullPage: false });

  // Test Keyboard Shortcuts
  console.log(`\n--- Testing Keyboard Shortcuts ---`);
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  let kMode = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check [Key '1' -> Read]: ${kMode === 'read' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode !== 'read') allPassed = false;

  await page.keyboard.press('2');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check [Key '2' -> Compare]: ${kMode === 'compare' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode !== 'compare') allPassed = false;

  await page.keyboard.press('3');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check [Key '3' -> Calc]: ${kMode === 'calc' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode !== 'calc') allPassed = false;

  await page.keyboard.press('4');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check [Key '4' -> Quiz]: ${kMode === 'quiz' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode !== 'quiz') allPassed = false;

  await page.close();
}

await browser.close();
server.close();

console.log(`\n======================================================`);
if (allPassed) {
  console.log(`🎉 ALL CHECKS PASSED FOR MATH DECIMAL LEARNING STUDIO!`);
  process.exit(0);
} else {
  console.error(`❌ SOME CHECKS FAILED!`);
  process.exit(1);
}

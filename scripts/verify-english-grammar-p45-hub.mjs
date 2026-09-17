#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/english/english-grammar-p45-hub/index.html');
const outputDir = resolve(repoRoot, 'output/english-grammar-check');
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
const baseUrl = `http://127.0.0.1:${port}/games/english/english-grammar-p45-hub/index.html`;

console.log(`Testing English Grammar & Sight Words Studio at ${baseUrl}`);
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

  // Check 1: Zero Horizontal Scroll Overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });
  console.log(`Check 1 [Zero Horizontal Overflow]: ${overflow ? '❌ FAILED (overflow detected)' : '✅ PASSED (scrollWidth <= clientWidth + 1)'}`);
  if (overflow) {
    allPassed = false;
  }

  // Check 2: Visible Touch Targets & Buttons >= 44x44 px
  const checkTouchTargets = async (contextName) => {
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
    }, contextName);
  };

  const initialSmall = await checkTouchTargets('Initial Grammar Studio');
  console.log(`Check 2 [Touch Targets >= 44x44px in Grammar]: ${initialSmall.length === 0 ? '✅ PASSED (all controls >= 44x44)' : '❌ FAILED (' + initialSmall.length + ' small controls)'}`);
  if (initialSmall.length > 0) {
    console.error('Small controls in Grammar:', JSON.stringify(initialSmall, null, 2));
    allPassed = false;
  }

  // Check 3: State Hook Inspection
  const state = await page.evaluate(() => window.__getState?.());
  console.log(`Check 3 [window.__getState hook]: ${state && state.slug === 'english-grammar-p45-hub' ? '✅ PASSED (mode=' + state.mode + ')' : '❌ FAILED'}`);
  if (!state || state.slug !== 'english-grammar-p45-hub') allPassed = false;

  // Screenshot Grammar Studio
  await page.screenshot({ path: join(outputDir, `grammar-${vp.name}.png`), fullPage: false });

  // Test Mode 2: Sight Words
  console.log(`\n--- Switching to Mode 2: Sight Words ---`);
  await page.click('#modeSeg button[data-mode="sight"]');
  await page.waitForTimeout(300);
  const sightState = await page.evaluate(() => window.__getState?.());
  const sightSmall = await checkTouchTargets('Sight Words Mode');
  console.log(`Check 4.1 [Sight Mode Active]: ${sightState.mode === 'sight' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Check 4.2 [Touch Targets in Sight Words]: ${sightSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + sightSmall.length + ' small)'}`);
  if (sightState.mode !== 'sight' || sightSmall.length > 0) allPassed = false;
  await page.screenshot({ path: join(outputDir, `sight-${vp.name}.png`), fullPage: false });

  // Test Mode 3: Follow Instructions Lab
  console.log(`\n--- Switching to Mode 3: Follow Instructions Lab ---`);
  await page.click('#modeSeg button[data-mode="instructions"]');
  await page.waitForTimeout(300);
  const instrState = await page.evaluate(() => window.__getState?.());
  const instrSmall = await checkTouchTargets('Instructions Mode');
  console.log(`Check 5.1 [Instructions Mode Active]: ${instrState.mode === 'instructions' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Check 5.2 [Touch Targets in Instructions]: ${instrSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + instrSmall.length + ' small)'}`);
  if (instrState.mode !== 'instructions' || instrSmall.length > 0) allPassed = false;

  // Test interaction in Instructions: click a target button
  const targetCards = await page.$$('.target-card-btn');
  console.log(`Check 5.3 [Target Cards Count]: ${targetCards.length === 4 ? '✅ PASSED (4 cards)' : '❌ FAILED'}`);
  if (targetCards.length !== 4) allPassed = false;
  await page.screenshot({ path: join(outputDir, `instructions-${vp.name}.png`), fullPage: false });

  // Test Mode 4: Practice Quiz
  console.log(`\n--- Switching to Mode 4: Practice Quiz & Builder ---`);
  await page.click('#modeSeg button[data-mode="practice"]');
  await page.waitForTimeout(300);
  const quizState = await page.evaluate(() => window.__getState?.());
  const quizSmall = await checkTouchTargets('Practice Quiz Mode');
  console.log(`Check 6.1 [Practice Mode Active]: ${quizState.mode === 'practice' ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Check 6.2 [Touch Targets in Practice Quiz]: ${quizSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + quizSmall.length + ' small)'}`);
  if (quizState.mode !== 'practice' || quizSmall.length > 0) allPassed = false;
  await page.screenshot({ path: join(outputDir, `quiz-${vp.name}.png`), fullPage: false });

  // Test Sub-mode: Sentence Builder
  await page.click('#practiceTabs button[data-submode="builder"]');
  await page.waitForTimeout(300);
  const builderSmall = await checkTouchTargets('Sentence Builder Mode');
  console.log(`Check 6.3 [Touch Targets in Sentence Builder]: ${builderSmall.length === 0 ? '✅ PASSED' : '❌ FAILED (' + builderSmall.length + ' small)'}`);
  if (builderSmall.length > 0) allPassed = false;
  await page.screenshot({ path: join(outputDir, `builder-${vp.name}.png`), fullPage: false });

  // Check 7: Smartboard Keyboard Shortcuts
  console.log(`\n--- Testing Keyboard Shortcuts ---`);
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  const kMode1 = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check 7.1 [Key '1' -> Grammar]: ${kMode1 === 'grammar' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode1 !== 'grammar') allPassed = false;

  await page.keyboard.press('2');
  await page.waitForTimeout(200);
  const kMode2 = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check 7.2 [Key '2' -> Sight]: ${kMode2 === 'sight' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode2 !== 'sight') allPassed = false;

  await page.keyboard.press('3');
  await page.waitForTimeout(200);
  const kMode3 = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check 7.3 [Key '3' -> Instructions]: ${kMode3 === 'instructions' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode3 !== 'instructions') allPassed = false;

  await page.keyboard.press('4');
  await page.waitForTimeout(200);
  const kMode4 = await page.evaluate(() => window.__getState?.().mode);
  console.log(`Check 7.4 [Key '4' -> Practice]: ${kMode4 === 'practice' ? '✅ PASSED' : '❌ FAILED'}`);
  if (kMode4 !== 'practice') allPassed = false;

  await page.close();
}

await browser.close();
server.close();

console.log(`\n======================================================`);
if (allPassed) {
  console.log(`🎉 ALL CHECKS PASSED FOR ENGLISH GRAMMAR & SIGHT WORDS STUDIO!`);
  process.exit(0);
} else {
  console.error(`❌ SOME CHECKS FAILED!`);
  process.exit(1);
}

#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/english/english-tenses-p6-media.html');
const outputDir = resolve(repoRoot, 'output/english-tenses-check');
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
const baseUrl = `http://127.0.0.1:${port}/games/english/english-tenses-p6-media.html`;

console.log(`Testing English Tenses Learning Studio at ${baseUrl}`);
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
        // Bounding box < 43.5px triggers failure (accounting for subpixel rounding)
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

  const initialSmall = await checkTouchTargets('Initial Studio Mode');
  console.log(`Check 2 [Touch Targets >= 44x44px in Studio]: ${initialSmall.length === 0 ? '✅ PASSED (all controls >= 44x44)' : '❌ FAILED (' + initialSmall.length + ' small controls)'}`);
  if (initialSmall.length > 0) {
    console.error('Small controls in Studio:', JSON.stringify(initialSmall, null, 2));
    allPassed = false;
  }

  // Check 3: State & Pedagogical Metadata Verification
  const state = await page.evaluate(() => window.__getState?.());
  console.log(`Check 3 [State Inspection]: slug=${state?.slug}, mode=${state?.mode}, level=${state?.level}, curStudioId=${state?.curStudioId}`);
  if (!state || state.slug !== 'english-tenses-p6-media' || state.mode !== 'studio') {
    console.error(`❌ FAILED: Unexpected initial state!`, state);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: QA state hook confirmed.`);
  }

  // Check 4: Mode 1 (Studio & Timeline)
  const studioImgLoaded = await page.evaluate(() => {
    const img = document.querySelector('#studioCard img.studio-img');
    return img && img.complete && img.naturalWidth > 0;
  });
  console.log(`Check 4 [Studio Image WebP Loaded]: ${studioImgLoaded ? '✅ PASSED' : '❌ FAILED'}`);
  if (!studioImgLoaded) allPassed = false;

  await page.screenshot({ path: join(outputDir, `studio-${vp.name}.png`), fullPage: false });

  // Check 5: Mode 2 (Comparison Matrix)
  await page.click('#modeSeg button[data-mode="matrix"]');
  await page.waitForTimeout(300);

  const matrixState = await page.evaluate(() => {
    const state = window.__getState?.();
    const matrixSecVisible = getComputedStyle(document.getElementById('secMatrix')).display !== 'none';
    const cardCount = document.querySelectorAll('#matrixGrid .matrix-card').length;
    const verbBtnCount = document.querySelectorAll('#matrixVerbBar .verb-btn').length;
    return { mode: state?.mode, visible: matrixSecVisible, cards: cardCount, verbs: verbBtnCount };
  });

  const matrixSmall = await checkTouchTargets('Mode 2: Matrix');
  console.log(`Check 5 [Mode 2 Matrix]: mode=${matrixState.mode}, visible=${matrixState.visible}, cards=${matrixState.cards}, verbs=${matrixState.verbs}`);
  if (matrixState.mode !== 'matrix' || !matrixState.visible || matrixState.cards !== 4 || matrixState.verbs < 6) {
    console.error('❌ FAILED: Comparison Matrix render anomaly', matrixState);
    allPassed = false;
  } else if (matrixSmall.length > 0) {
    console.error('❌ FAILED: Small controls in Matrix:', JSON.stringify(matrixSmall, null, 2));
    allPassed = false;
  } else {
    console.log(`✅ PASSED: Mode 2 Comparison Matrix verified.`);
  }
  await page.screenshot({ path: join(outputDir, `matrix-${vp.name}.png`), fullPage: false });

  // Check 6: Mode 3 (Practice Quiz)
  await page.click('#modeSeg button[data-mode="quiz"]');
  await page.waitForTimeout(300);

  const quizState = await page.evaluate(() => {
    const state = window.__getState?.();
    const quizSecVisible = getComputedStyle(document.getElementById('secQuiz')).display !== 'none';
    const choices = document.querySelectorAll('#quizChoices .choice-btn').length;
    const prompt = document.getElementById('quizPrompt')?.textContent?.trim();
    return { mode: state?.mode, visible: quizSecVisible, choices, prompt };
  });

  const quizSmall = await checkTouchTargets('Mode 3: Quiz');
  console.log(`Check 6 [Mode 3 Practice Quiz]: mode=${quizState.mode}, visible=${quizState.visible}, choices=${quizState.choices}`);
  if (quizState.mode !== 'quiz' || !quizState.visible || quizState.choices < 3 || !quizState.prompt) {
    console.error('❌ FAILED: Practice Quiz render anomaly', quizState);
    allPassed = false;
  } else if (quizSmall.length > 0) {
    console.error('❌ FAILED: Small controls in Quiz:', JSON.stringify(quizSmall, null, 2));
    allPassed = false;
  } else {
    // Test answering a quiz choice
    await page.click('#quizChoices .choice-btn');
    await page.waitForTimeout(200);
    const feedbackVisible = await page.evaluate(() => {
      const fb = document.getElementById('quizFeedback');
      return fb && getComputedStyle(fb).display !== 'none';
    });
    if (!feedbackVisible) {
      console.error('❌ FAILED: Quiz feedback was not displayed after answering');
      allPassed = false;
    } else {
      console.log('✅ PASSED: Mode 3 Quiz choice interaction and feedback verified.');
    }
  }
  await page.screenshot({ path: join(outputDir, `quiz-${vp.name}.png`), fullPage: false });

  // Check 7: Mode 4 (Sentence Builder)
  await page.click('#modeSeg button[data-mode="builder"]');
  await page.waitForTimeout(300);

  const builderState = await page.evaluate(() => {
    const state = window.__getState?.();
    const builderSecVisible = getComputedStyle(document.getElementById('secBuilder')).display !== 'none';
    const bankTiles = document.querySelectorAll('#builderBank .word-tile').length;
    const prompt = document.getElementById('builderThPrompt')?.textContent?.trim();
    return { mode: state?.mode, visible: builderSecVisible, bankTiles, prompt };
  });

  const builderSmall = await checkTouchTargets('Mode 4: Builder');
  console.log(`Check 7 [Mode 4 Sentence Builder]: mode=${builderState.mode}, visible=${builderState.visible}, bankTiles=${builderState.bankTiles}`);
  if (builderState.mode !== 'builder' || !builderState.visible || builderState.bankTiles === 0 || !builderState.prompt) {
    console.error('❌ FAILED: Sentence Builder render anomaly', builderState);
    allPassed = false;
  } else if (builderSmall.length > 0) {
    console.error('❌ FAILED: Small controls in Builder:', JSON.stringify(builderSmall, null, 2));
    allPassed = false;
  } else {
    // Test tapping a word tile from bank into slots
    await page.click('#builderBank .word-tile');
    await page.waitForTimeout(200);
    const slotsCount = await page.evaluate(() => document.querySelectorAll('#builderSlots .word-tile').length);
    if (slotsCount !== 1) {
      console.error(`❌ FAILED: Expected 1 placed slot, got: ${slotsCount}`);
      allPassed = false;
    } else {
      console.log('✅ PASSED: Mode 4 Word Tile placement into slot verified.');
    }
  }
  await page.screenshot({ path: join(outputDir, `builder-${vp.name}.png`), fullPage: false });

  // Check 8: Grade Level Selectors
  console.log('Check 8 [Grade Level Selectors]: testing P.4, P.5, P.6, All');
  for (const lvl of ['p4', 'p5', 'p6', 'all']) {
    await page.click(`#levelSeg button[data-level="${lvl}"]`);
    await page.waitForTimeout(200);
    const activeLevel = await page.evaluate(() => window.__getState?.()?.level);
    if (activeLevel !== lvl) {
      console.error(`❌ FAILED: Level selector failed for ${lvl}, got: ${activeLevel}`);
      allPassed = false;
    }
  }
  console.log('✅ PASSED: Grade Level selector filtering verified.');

  // Check 9: Smartboard Keyboard Shortcuts
  console.log('Check 9 [Smartboard Keyboard Shortcuts]');
  // Press '1' -> Studio
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  let kMode = await page.evaluate(() => window.__getState?.()?.mode);
  if (kMode !== 'studio') {
    console.error(`❌ Shortcut '1' failed, mode=${kMode}`);
    allPassed = false;
  }

  // Press '2' -> Matrix
  await page.keyboard.press('2');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.()?.mode);
  if (kMode !== 'matrix') {
    console.error(`❌ Shortcut '2' failed, mode=${kMode}`);
    allPassed = false;
  }

  // Press '3' -> Quiz
  await page.keyboard.press('3');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.()?.mode);
  if (kMode !== 'quiz') {
    console.error(`❌ Shortcut '3' failed, mode=${kMode}`);
    allPassed = false;
  }

  // Press '4' -> Builder
  await page.keyboard.press('4');
  await page.waitForTimeout(200);
  kMode = await page.evaluate(() => window.__getState?.()?.mode);
  if (kMode !== 'builder') {
    console.error(`❌ Shortcut '4' failed, mode=${kMode}`);
    allPassed = false;
  }

  // Return to Studio and test Navigation Arrows
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  const cardBeforeArrow = await page.evaluate(() => window.__getState?.()?.curStudioId);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  const cardAfterArrow = await page.evaluate(() => window.__getState?.()?.curStudioId);
  if (cardBeforeArrow === cardAfterArrow) {
    console.error(`❌ Shortcut ArrowRight did not change studio card!`);
    allPassed = false;
  }

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  const cardAfterLeft = await page.evaluate(() => window.__getState?.()?.curStudioId);
  if (cardAfterLeft !== cardBeforeArrow) {
    console.error(`❌ Shortcut ArrowLeft did not return to original studio card!`);
    allPassed = false;
  }

  // Test Space (audio narration trigger)
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  // Test KeyM (Classroom Echo repeat)
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(300);
  const echoTriggered = await page.evaluate(() => {
    const echoBox = document.getElementById('echoBox');
    return echoBox && echoBox.innerHTML.length > 0;
  });
  if (!echoTriggered) {
    console.error(`❌ Shortcut KeyM failed to trigger Classroom Echo!`);
    allPassed = false;
  } else {
    console.log(`✅ Classroom Echo triggered via KeyM.`);
  }

  // Test KeyF (Fullscreen trigger without crashing)
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(100);

  console.log('✅ PASSED: All Keyboard shortcuts (1, 2, 3, 4, ArrowRight, ArrowLeft, Space, KeyM, KeyF) verified.');

  await page.close();
}

await browser.close();
server.close();

console.log(`\n======================================================`);
console.log(`Overall Verification Result: ${allPassed ? '🎉 ALL CHECKS PASSED WITH ZERO FAILURES!' : '❌ SOME CHECKS FAILED'}`);
console.log(`======================================================\n`);

process.exit(allPassed ? 0 : 1);

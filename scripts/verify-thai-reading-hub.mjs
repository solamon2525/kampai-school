#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/thai/thai-reading-hub/index.html');
const outputDir = resolve(repoRoot, 'output/thai-reading-check');
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
const baseUrl = `http://127.0.0.1:${port}/games/thai/thai-reading-hub/index.html`;

console.log(`Testing Thai Reading Comprehension Studio at ${baseUrl}`);
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

  // 1. Initial Mode (Mode 1: Read)
  await checkOverflow('Mode 1: Read');
  let smallTargets = await checkTouchTargets('Mode 1');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 1]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 1]: ✅ PASSED (all controls >= 44x44)');
  }

  // Check state hook
  const state = await page.evaluate(() => window.__getState());
  if (!state || state.mode !== 'read') {
    console.error('State Hook Check [Mode 1]: ❌ FAILED', state);
    allPassed = false;
  } else {
    console.log(`Check [window.__getState hook]: ✅ PASSED (mode=${state.mode}, story=${state.curStoryTitle})`);
  }

  // Check 5W1H items count
  const w5h1Count = await page.evaluate(() => document.querySelectorAll('#w5h1Grid .w5h1-item').length);
  if (w5h1Count !== 6) {
    console.error(`5W1H Grid Count: ❌ FAILED (expected 6, got ${w5h1Count})`);
    allPassed = false;
  } else {
    console.log('Check [5W1H Grid Count]: ✅ PASSED (6 items: Who, What, Where, When, Why, How)');
  }

  // Toggle Highlights
  await page.click('#btnToggleTopicHighlight');
  const topicHighlighted = await page.evaluate(() => document.querySelectorAll('#passageText .topic-highlight').length > 0);
  if (!topicHighlighted) {
    console.error('Topic Highlight Toggle: ❌ FAILED');
    allPassed = false;
  } else {
    console.log('Check [Topic Highlight Toggle]: ✅ PASSED');
  }

  // 2. Switch to Mode 2 (Detective)
  console.log('\n--- Testing Mode 2: Fact vs Opinion Detective Lab ---');
  await page.click('button[data-mode="detective"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 2: Detective');
  smallTargets = await checkTouchTargets('Mode 2');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 2]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 2]: ✅ PASSED');
  }

  // Click Answer Fact
  await page.click('#btnAnswerFact');
  const detFeedbackVisible = await page.evaluate(() => {
    const el = document.getElementById('detFeedback');
    return el && el.style.display !== 'none';
  });
  if (!detFeedbackVisible) {
    console.error('Detective Feedback Visibility: ❌ FAILED');
    allPassed = false;
  } else {
    console.log('Check [Detective Feedback & Scoring]: ✅ PASSED');
  }

  // 3. Switch to Mode 3 (Sequencer)
  console.log('\n--- Testing Mode 3: Story Sequencer Lab ---');
  await page.click('button[data-mode="sequencer"]');
  await page.waitForTimeout(300);
  await checkOverflow('Mode 3: Sequencer');
  smallTargets = await checkTouchTargets('Mode 3');
  if (smallTargets.length > 0) {
    console.error('Touch Target Violations [Mode 3]:', smallTargets);
    allPassed = false;
  } else {
    console.log('Check [Touch Targets in Mode 3]: ✅ PASSED');
  }

  // Check Sequence Check Button
  await page.click('#btnCheckSequence');
  const seqResultVisible = await page.evaluate(() => {
    const el = document.getElementById('seqResultBanner');
    return el && el.style.display !== 'none';
  });
  if (!seqResultVisible) {
    console.error('Sequencer Check Banner: ❌ FAILED');
    allPassed = false;
  } else {
    console.log('Check [Sequencer Verification Interaction]: ✅ PASSED');
  }

  // 4. Switch to Mode 4 (Quiz)
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
  const choiceBtn = await page.$('.choice-btn');
  if (choiceBtn) {
    await choiceBtn.click();
    const expBoxVisible = await page.evaluate(() => {
      const el = document.getElementById('quizExplanationBox');
      return el && el.style.display !== 'none';
    });
    if (!expBoxVisible) {
      console.error('Quiz Explanation Visibility: ❌ FAILED');
      allPassed = false;
    } else {
      console.log('Check [Quiz Answer & Explanation]: ✅ PASSED');
    }
  }

  // 5. Test Keyboard Shortcuts
  console.log('\n--- Testing Keyboard Shortcuts ---');
  await page.keyboard.press('1');
  let currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'read') {
    console.error("Key '1' -> Read mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '1' -> Read]: ✅ PASSED");
  }

  await page.keyboard.press('2');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'detective') {
    console.error("Key '2' -> Detective mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '2' -> Detective]: ✅ PASSED");
  }

  await page.keyboard.press('3');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'sequencer') {
    console.error("Key '3' -> Sequencer mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '3' -> Sequencer]: ✅ PASSED");
  }

  await page.keyboard.press('4');
  currentMode = await page.evaluate(() => window.__getState().mode);
  if (currentMode !== 'quiz') {
    console.error("Key '4' -> Quiz mode: ❌ FAILED", currentMode);
    allPassed = false;
  } else {
    console.log("Check [Key '4' -> Quiz]: ✅ PASSED");
  }

  // Take screenshot for record
  await page.screenshot({ path: join(outputDir, `reading-hub-${vp.name}.png`), fullPage: false });
  await page.close();
}

await browser.close();
server.close();

if (!allPassed) {
  console.error('\n❌ SOME CHECKS FAILED FOR THAI READING COMPREHENSION STUDIO');
  process.exit(1);
} else {
  console.log('\n======================================================');
  console.log('🎉 ALL CHECKS PASSED FOR THAI READING COMPREHENSION STUDIO!');
  process.exit(0);
}

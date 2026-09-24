import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');

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
      res.writeHead(404);
      res.end('Not found');
      return;
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
const hubUrl = `http://127.0.0.1:${port}/games/math/math-decimal-hub/index.html`;
const wsUrl = `http://127.0.0.1:${port}/games/math/math-decimal-hub-worksheet.html`;

console.log(`Challenger 2 Stress Server listening on port ${port}`);

const browser = await chromium.launch({ headless: true });

const results = {
  rapidModeSwitch: { passed: true, errors: [], details: {} },
  tileMatchStress: { passed: true, errors: [], details: {} },
  worksheetZeroShift: { passed: true, errors: [], details: {} },
};

// =========================================================================
// TEST 1: Rapid Mode Switching, State Sync, Audio & Speech Concurrency
// =========================================================================
console.log('\n--- Running Test 1: Rapid Mode Switching & Concurrency Stress ---');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('  [PageError caught in Test 1]:', err.message);
  });

  await page.goto(hubUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const modes = ['read', 'compare', 'calc', 'quiz'];
  const switchCount = 60;
  console.log(`  Executing ${switchCount} rapid mode switches with random delays (0-20ms)...`);

  for (let i = 0; i < switchCount; i++) {
    const targetMode = modes[i % modes.length];
    await page.evaluate((m) => {
      // Direct click on button
      const btn = document.querySelector(`#modeSeg button[data-mode="${m}"]`);
      if (btn) btn.click();
    }, targetMode);

    // Concurrently trigger speak or steppers occasionally
    if (i % 5 === 0) {
      await page.evaluate(() => {
        const btnSpeak = document.getElementById('btnSpeak');
        if (btnSpeak && btnSpeak.offsetParent !== null) btnSpeak.click();
      }).catch(() => {});
    }
    if (i % 7 === 0) {
      await page.evaluate(() => {
        const btnAudio = document.getElementById('btnAudioToggle');
        if (btnAudio) btnAudio.click();
      }).catch(() => {});
    }

    const delay = Math.floor(Math.random() * 20);
    if (delay > 0) await page.waitForTimeout(delay);
  }

  // Settle and verify DOM state consistency
  await page.waitForTimeout(400);

  const syncState = await page.evaluate(() => {
    const state = window.__getState?.();
    const activeButtons = [...document.querySelectorAll('#modeSeg button.active')].map(b => b.dataset.mode);
    const activeSections = [...document.querySelectorAll('.mode-section.active')].map(s => s.id);
    return {
      stateMode: state?.mode,
      activeButtons,
      activeSections,
      sectionsMatch: activeSections.length === 1 && activeButtons.length === 1 && activeButtons[0] === state?.mode
    };
  });

  console.log('  State after 60 rapid switches:', syncState);
  if (!syncState.sectionsMatch) {
    results.rapidModeSwitch.passed = false;
    results.rapidModeSwitch.errors.push(`DOM and state desynchronized: ${JSON.stringify(syncState)}`);
  }
  if (pageErrors.length > 0) {
    results.rapidModeSwitch.passed = false;
    results.rapidModeSwitch.errors.push(...pageErrors);
  }
  results.rapidModeSwitch.details = { switchCount, pageErrorsCount: pageErrors.length, syncState };

  await page.close();
}

// =========================================================================
// TEST 2: Mode 4 Tile Match Adversarial Stress & Flip Locking
// =========================================================================
console.log('\n--- Running Test 2: Mode 4 Tile Match Stress & Flip Lock Race Conditions ---');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('  [PageError caught in Test 2]:', err.message);
  });

  await page.goto(hubUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Switch to Quiz Mode, then Match submode
  await page.click('#modeSeg button[data-mode="quiz"]');
  await page.waitForTimeout(200);
  await page.click('#practiceModeSeg button[data-sub="match"]');
  await page.waitForTimeout(200);

  // Subtest 2A: Verify Tile Click Logic and Match/Mismatch Execution
  console.log('  Subtest 2A: Simulating Tile Clicks to test matching logic...');
  const matchResult = await page.evaluate(async () => {
    const errors = [];
    try {
      const tiles = [...document.querySelectorAll('#tileGrid .tile-btn')];
      if (tiles.length < 2) return { success: false, reason: 'Less than 2 tiles found' };

      // Find two matching tiles by inspecting matchTiles if accessible or finding tiles that have matching pairIds
      // In game.js / index.html, btn.dataset.pairId is set on each button!
      // Let's check dataset:
      const pairMap = new Map();
      tiles.forEach((btn, idx) => {
        const pId = btn.dataset.pairId;
        if (!pairMap.has(pId)) pairMap.set(pId, []);
        pairMap.get(pId).push(btn);
      });

      // Pick one pair to match
      const [firstPairId, pairBtns] = [...pairMap.entries()][0];
      if (pairBtns.length === 2) {
        // Click first tile
        pairBtns[0].click();
        const firstSelected = pairBtns[0].classList.contains('selected');

        // Click second tile of same pair
        pairBtns[1].click();
        const firstMatched = pairBtns[0].classList.contains('matched');
        const secondMatched = pairBtns[1].classList.contains('matched');

        return {
          pairId: firstPairId,
          firstSelected,
          firstMatched,
          secondMatched,
          matchPairsFound: window.__getState?.().matchPairsFound
        };
      }
      return { success: false, reason: 'Could not find a pair' };
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  });

  console.log('  Subtest 2A Tile Match Execution Result:', matchResult);
  if (matchResult.error) {
    results.tileMatchStress.passed = false;
    results.tileMatchStress.errors.push(`Subtest 2A Exception: ${matchResult.error}`);
  } else if (!matchResult.firstMatched || !matchResult.secondMatched) {
    results.tileMatchStress.passed = false;
    results.tileMatchStress.errors.push(`Subtest 2A: Tiles failed to match properly: ${JSON.stringify(matchResult)}`);
  }

  // Subtest 2B: Rapid Click Stress & Flip Lock Verification
  console.log('  Subtest 2B: Rapid Click Flood (race conditions on flip lock)...');
  const rapidClickResult = await page.evaluate(async () => {
    const tiles = [...document.querySelectorAll('#tileGrid .tile-btn:not(.matched)')];
    if (tiles.length < 4) return { error: 'Not enough unmatched tiles' };

    // Deliberately pick 2 mismatching tiles
    const t0 = tiles[0];
    let tMismatch = null;
    for (let i = 1; i < tiles.length; i++) {
      if (tiles[i].dataset.pairId !== t0.dataset.pairId) {
        tMismatch = tiles[i];
        break;
      }
    }
    if (!tMismatch) return { error: 'No mismatch pair found' };

    // Rapidly click t0, then tMismatch, then immediately click a 3rd tile t2
    const t2 = tiles.find(t => t !== t0 && t !== tMismatch);

    t0.click();
    tMismatch.click();
    // At this moment, mismatch timeout should be running and isMatchLocked should be true
    const lockActiveImmediately = t0.classList.contains('mismatch') && tMismatch.classList.contains('mismatch');
    
    // Attempt to click 3rd tile during lock
    t2.click();
    const t2SelectedDuringLock = t2.classList.contains('selected');

    // Wait 600ms for lock timeout to expire
    await new Promise(r => setTimeout(r, 600));

    const lockCleared = !t0.classList.contains('mismatch') && !tMismatch.classList.contains('mismatch');

    return {
      lockActiveImmediately,
      t2SelectedDuringLock,
      lockCleared
    };
  });

  console.log('  Subtest 2B Rapid Click Result:', rapidClickResult);
  if (rapidClickResult.error) {
    results.tileMatchStress.passed = false;
    results.tileMatchStress.errors.push(`Subtest 2B Error: ${rapidClickResult.error}`);
  } else {
    if (rapidClickResult.t2SelectedDuringLock) {
      results.tileMatchStress.passed = false;
      results.tileMatchStress.errors.push('Subtest 2B: Lock bypassed! 3rd tile was selected while mismatch lock was active.');
    }
    if (!rapidClickResult.lockCleared) {
      results.tileMatchStress.passed = false;
      results.tileMatchStress.errors.push('Subtest 2B: Lock did not clear after mismatch timeout.');
    }
  }

  // Subtest 2C: Rapid Reset Stress
  console.log('  Subtest 2C: Reset while mismatch pending...');
  const resetResult = await page.evaluate(async () => {
    const tiles = [...document.querySelectorAll('#tileGrid .tile-btn')];
    if (tiles.length >= 2) {
      tiles[0].click();
      tiles[1].click(); // Trigger match or mismatch
      // Immediately reset
      document.getElementById('btnResetMatch')?.click();
      await new Promise(r => setTimeout(r, 600));
      const newTiles = document.querySelectorAll('#tileGrid .tile-btn');
      const anyMismatch = [...newTiles].some(t => t.classList.contains('mismatch'));
      return { success: true, newTileCount: newTiles.length, anyMismatch };
    }
    return { error: 'No tiles' };
  });
  console.log('  Subtest 2C Reset Result:', resetResult);

  if (pageErrors.length > 0) {
    results.tileMatchStress.passed = false;
    results.tileMatchStress.errors.push(...pageErrors);
  }
  results.tileMatchStress.details = { matchResult, rapidClickResult, resetResult, pageErrors };

  await page.close();
}

// =========================================================================
// TEST 3: DOM Zero-Shift Layout Measurement on Worksheet
// =========================================================================
console.log('\n--- Running Test 3: Worksheet DOM Zero-Shift Layout Measurements ---');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('  [PageError caught in Test 3]:', err.message);
  });

  await page.goto(wsUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Measure zero-shift across different grades and topics
  const testScenarios = [
    { grade: 'all', topic: 'mixed' },
    { grade: '4', topic: 'read' },
    { grade: '4', topic: 'compare' },
    { grade: '5', topic: 'addsub' },
    { grade: '5', topic: 'money' },
    { grade: 'all', topic: 'fraction' },
  ];

  let maxDeltaAcrossAll = 0;
  const shiftViolations = [];

  for (const scen of testScenarios) {
    console.log(`  Testing Scenario: Grade=${scen.grade}, Topic=${scen.topic}...`);

    await page.evaluate((s) => {
      const selG = document.getElementById('selGrade');
      if (selG) { selG.value = s.grade; selG.dispatchEvent(new Event('change')); }
      const selT = document.getElementById('selTopic');
      if (selT) { selT.value = s.topic; selT.dispatchEvent(new Event('change')); }
      window.render?.();
    }, scen);

    await page.waitForTimeout(300);

    // Step A: Measure without answers
    const beforeMeasurements = await page.evaluate(() => {
      document.body.classList.remove('show-answers');
      const cards = [...document.querySelectorAll('.q')];
      return cards.map((card, idx) => {
        const r = card.getBoundingClientRect();
        const stem = card.querySelector('.q-stem')?.getBoundingClientRect();
        const work = card.querySelector('.q-work-block')?.getBoundingClientRect();
        const foot = card.querySelector('.q-foot')?.getBoundingClientRect();
        return {
          idx,
          totalH: r.height,
          totalW: r.width,
          stemH: stem ? stem.height : 0,
          workH: work ? work.height : 0,
          footH: foot ? foot.height : 0,
        };
      });
    });

    // Step B: Toggle show-answers and measure again
    const afterMeasurements = await page.evaluate(() => {
      document.body.classList.add('show-answers');
      const cards = [...document.querySelectorAll('.q')];
      return cards.map((card, idx) => {
        const r = card.getBoundingClientRect();
        const stem = card.querySelector('.q-stem')?.getBoundingClientRect();
        const work = card.querySelector('.q-work-block')?.getBoundingClientRect();
        const foot = card.querySelector('.q-foot')?.getBoundingClientRect();
        return {
          idx,
          totalH: r.height,
          totalW: r.width,
          stemH: stem ? stem.height : 0,
          workH: work ? work.height : 0,
          footH: foot ? foot.height : 0,
        };
      });
    });

    // Compare card by card
    for (let i = 0; i < beforeMeasurements.length; i++) {
      const b = beforeMeasurements[i];
      const a = afterMeasurements[i];
      const deltaH = Math.abs(a.totalH - b.totalH);
      const deltaW = Math.abs(a.totalW - b.totalW);
      if (deltaH > maxDeltaAcrossAll) maxDeltaAcrossAll = deltaH;

      if (deltaH > 0.05 || deltaW > 0.05) {
        shiftViolations.push({
          scenario: scen,
          cardIndex: i,
          deltaH,
          deltaW,
          before: b,
          after: a,
        });
      }
    }
  }

  console.log(`  Max Layout Delta Height observed: ${maxDeltaAcrossAll.toFixed(4)}px`);
  console.log(`  Shift Violations count (> 0.05px): ${shiftViolations.length}`);

  if (shiftViolations.length > 0) {
    results.worksheetZeroShift.passed = false;
    results.worksheetZeroShift.errors.push(`Detected ${shiftViolations.length} zero-shift layout violations`);
  }
  if (pageErrors.length > 0) {
    results.worksheetZeroShift.passed = false;
    results.worksheetZeroShift.errors.push(...pageErrors);
  }
  results.worksheetZeroShift.details = {
    maxDeltaAcrossAll: maxDeltaAcrossAll.toFixed(4) + 'px',
    violationsCount: shiftViolations.length,
    firstViolation: shiftViolations[0] || null,
  };

  await page.close();
}

await browser.close();
server.close();

console.log('\n=========================================================================');
console.log('SUMMARY OF EMPIRICAL ADVERSARIAL STRESS TEST:');
console.log('=========================================================================');
console.log('1. Rapid Mode Switching:', results.rapidModeSwitch.passed ? '✅ PASSED' : '❌ FAILED');
if (!results.rapidModeSwitch.passed) console.log('   Errors:', results.rapidModeSwitch.errors);

console.log('2. Mode 4 Tile Match Stress:', results.tileMatchStress.passed ? '✅ PASSED' : '❌ FAILED');
if (!results.tileMatchStress.passed) console.log('   Errors:', results.tileMatchStress.errors);

console.log('3. Worksheet Zero-Shift Layout:', results.worksheetZeroShift.passed ? '✅ PASSED' : '❌ FAILED');
if (!results.worksheetZeroShift.passed) console.log('   Errors:', results.worksheetZeroShift.errors);

const overallPass = results.rapidModeSwitch.passed && results.tileMatchStress.passed && results.worksheetZeroShift.passed;
console.log('\nOVERALL EMPIRICAL VERDICT:', overallPass ? 'APPROVE' : 'REJECT');

if (!overallPass) {
  process.exit(1);
} else {
  process.exit(0);
}

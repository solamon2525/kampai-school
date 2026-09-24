import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/english/english-tenses-p6-media.html');
const outputDir = resolve(repoRoot, 'output/challenger-stress-check');
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

console.log(`[Challenger 1] Starting Empirical Adversarial Stress Suite against: ${baseUrl}`);

const browser = await chromium.launch({ headless: true });

const results = {
  dataIntegrity: false,
  rapidTransitions: false,
  extremeViewports: false,
  audioStress: false,
  quizFullPlaythrough: false,
  builderFullPlaythrough: false,
};

const errorsLogged = [];

// =========================================================================
// SUITE 1: DATA BANK & CHALLENGES STRUCTURAL INTEGRITY ORACLE
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 1: Data Bank & Structural Integrity Oracle ---');
console.log('======================================================');

{
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const dataAudit = await page.evaluate(() => {
    const auditErrors = [];

    // 1. Audit QUIZ_ITEMS
    if (typeof QUIZ_ITEMS === 'undefined' || !Array.isArray(QUIZ_ITEMS)) {
      auditErrors.push('QUIZ_ITEMS is not defined or not an array');
    } else {
      if (QUIZ_ITEMS.length !== 36) {
        auditErrors.push(`Expected 36 quiz questions, found: ${QUIZ_ITEMS.length}`);
      }
      const p4Count = QUIZ_ITEMS.filter(q => q.grade === 'p4').length;
      const p5Count = QUIZ_ITEMS.filter(q => q.grade === 'p5').length;
      const p6Count = QUIZ_ITEMS.filter(q => q.grade === 'p6').length;
      if (p4Count !== 12 || p5Count !== 12 || p6Count !== 12) {
        auditErrors.push(`Quiz distribution unbalanced: p4=${p4Count}, p5=${p5Count}, p6=${p6Count}`);
      }

      QUIZ_ITEMS.forEach((q, idx) => {
        if (!q.id) auditErrors.push(`Quiz item ${idx} missing id`);
        if (!q.prompt || q.prompt.trim().length === 0) auditErrors.push(`Quiz item ${q.id} empty prompt`);
        if (!q.choices || q.choices.length !== 4) auditErrors.push(`Quiz item ${q.id} choices length != 4`);
        if (!q.choices.includes(q.correct)) auditErrors.push(`Quiz item ${q.id} correct answer '${q.correct}' not in choices: ${JSON.stringify(q.choices)}`);
        const uniqueChoices = new Set(q.choices);
        if (uniqueChoices.size !== q.choices.length) auditErrors.push(`Quiz item ${q.id} has duplicate choices: ${JSON.stringify(q.choices)}`);
        if (!q.explanation || q.explanation.trim().length === 0) auditErrors.push(`Quiz item ${q.id} missing explanation`);
      });
    }

    // 2. Audit BUILDER_CHALLENGES
    if (typeof BUILDER_CHALLENGES === 'undefined' || !Array.isArray(BUILDER_CHALLENGES)) {
      auditErrors.push('BUILDER_CHALLENGES is not defined or not an array');
    } else {
      if (BUILDER_CHALLENGES.length !== 12) {
        auditErrors.push(`Expected 12 builder challenges, found: ${BUILDER_CHALLENGES.length}`);
      }
      const bP4 = BUILDER_CHALLENGES.filter(b => b.grade === 'p4').length;
      const bP5 = BUILDER_CHALLENGES.filter(b => b.grade === 'p5').length;
      const bP6 = BUILDER_CHALLENGES.filter(b => b.grade === 'p6').length;
      if (bP4 !== 4 || bP5 !== 4 || bP6 !== 4) {
        auditErrors.push(`Builder distribution unbalanced: p4=${bP4}, p5=${bP5}, p6=${bP6}`);
      }

      BUILDER_CHALLENGES.forEach((b, idx) => {
        if (!b.id) auditErrors.push(`Builder challenge ${idx} missing id`);
        if (!b.thPrompt || b.thPrompt.trim().length === 0) auditErrors.push(`Builder challenge ${b.id} empty thPrompt`);
        if (!b.target || b.target.length === 0) auditErrors.push(`Builder challenge ${b.id} empty target`);
        if (!b.bank || b.bank.length < b.target.length) auditErrors.push(`Builder challenge ${b.id} bank smaller than target`);
        const bankTexts = b.bank.map(x => x.text);
        for (const t of b.target) {
          if (!bankTexts.includes(t)) {
            auditErrors.push(`Builder challenge ${b.id} target word '${t}' not found in bank: ${JSON.stringify(bankTexts)}`);
          }
        }
      });
    }

    // 3. Audit STUDIO_CARDS
    if (typeof STUDIO_CARDS === 'undefined' || STUDIO_CARDS.length !== 6) {
      auditErrors.push(`STUDIO_CARDS expected 6, got: ${typeof STUDIO_CARDS !== 'undefined' ? STUDIO_CARDS.length : 'undefined'}`);
    }

    // 4. Audit MATRIX_VERBS
    if (typeof MATRIX_VERBS === 'undefined' || MATRIX_VERBS.length !== 8) {
      auditErrors.push(`MATRIX_VERBS expected 8, got: ${typeof MATRIX_VERBS !== 'undefined' ? MATRIX_VERBS.length : 'undefined'}`);
    }

    return auditErrors;
  });

  if (dataAudit.length === 0) {
    console.log('✅ SUITE 1 PASSED: 36 quiz questions, 12 builder challenges, 6 studio cards, 8 matrix verbs verified.');
    results.dataIntegrity = true;
  } else {
    console.error('❌ SUITE 1 FAILED with errors:', dataAudit);
    errorsLogged.push(...dataAudit);
  }
  await page.close();
}

// =========================================================================
// SUITE 2: RAPID MODE TRANSITIONS & CHAOS BOMBARDMENT
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 2: Rapid Mode Transitions & Chaos Stress ---');
console.log('======================================================');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(`PageError: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(`ConsoleError: ${msg.text()}`);
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const modes = ['studio', 'matrix', 'quiz', 'builder'];
  const keys = ['1', '2', '3', '4'];

  console.log('Executing 80 rapid interleaved mode switches (clicks + keyboard)...');
  for (let i = 0; i < 80; i++) {
    const targetIdx = i % 4;
    const modeName = modes[targetIdx];
    const keyName = keys[targetIdx];

    if (i % 2 === 0) {
      // Click via UI
      await page.click(`#modeSeg button[data-mode="${modeName}"]`);
    } else {
      // Shortcut via keyboard
      await page.keyboard.press(keyName);
    }
    // Chaos delay: 0ms to 15ms
    if (i % 5 === 0) {
      await page.waitForTimeout(10);
    }
  }

  await page.waitForTimeout(300);

  // Validate state and DOM coherence
  const postChaos = await page.evaluate(() => {
    const state = window.__getState?.();
    const activeSections = [...document.querySelectorAll('.mode-section.active')];
    const activeButtons = [...document.querySelectorAll('#modeSeg .seg-btn.active')];
    return {
      mode: state?.mode,
      activeSectionCount: activeSections.length,
      activeSectionId: activeSections[0]?.id,
      activeButtonCount: activeButtons.length,
      activeButtonMode: activeButtons[0]?.dataset?.mode,
    };
  });

  console.log(`Post-chaos state: mode=${postChaos.mode}, activeSec=${postChaos.activeSectionId}, activeBtn=${postChaos.activeButtonMode}`);

  let suite2Passed = true;
  if (pageErrors.length > 0) {
    console.error('❌ Page/Console errors during rapid transitions:', pageErrors);
    errorsLogged.push(...pageErrors);
    suite2Passed = false;
  }
  if (postChaos.activeSectionCount !== 1) {
    console.error(`❌ Expected exactly 1 active section, found: ${postChaos.activeSectionCount}`);
    suite2Passed = false;
  }
  if (postChaos.activeButtonCount !== 1) {
    console.error(`❌ Expected exactly 1 active button, found: ${postChaos.activeButtonCount}`);
    suite2Passed = false;
  }
  if (`sec${postChaos.mode.charAt(0).toUpperCase() + postChaos.mode.slice(1)}` !== postChaos.activeSectionId) {
    console.error(`❌ Mismatch between state mode and active section ID: ${postChaos.mode} vs ${postChaos.activeSectionId}`);
    suite2Passed = false;
  }

  // Verify UI is interactive after chaos by clicking a button in current mode
  if (postChaos.mode === 'builder') {
    const bankTile = await page.$('#builderBank .word-tile');
    if (bankTile) {
      await bankTile.click();
      await page.waitForTimeout(100);
      const slots = await page.evaluate(() => document.querySelectorAll('#builderSlots .word-tile').length);
      if (slots !== 1) {
        console.error('❌ UI unresponsive after rapid mode switching!');
        suite2Passed = false;
      }
    }
  }

  if (suite2Passed) {
    console.log('✅ SUITE 2 PASSED: 80 rapid transitions completed without errors, DOM and state remain strictly synchronized.');
    results.rapidTransitions = true;
  }
  await page.close();
}

// =========================================================================
// SUITE 3: EXTREME VIEWPORT TESTING MATRIX (320x568 up to 3840x2160)
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 3: Extreme Viewport Testing Matrix ---');
console.log('======================================================');

{
  const testViewports = [
    { name: 'iphone-se-narrow', width: 320, height: 568 },
    { name: 'narrow-mobile-640', width: 320, height: 640 },
    { name: 'standard-mobile', width: 360, height: 800 },
    { name: 'large-mobile', width: 412, height: 915 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'hd-720p', width: 1280, height: 720 },
    { name: 'fhd-1080p', width: 1920, height: 1080 },
    { name: '2k-qhd', width: 2560, height: 1440 },
    { name: '4k-smartboard', width: 3840, height: 2160 },
  ];

  let suite3Passed = true;
  const modes = ['studio', 'matrix', 'quiz', 'builder'];

  for (const vp of testViewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    let vpOverflow = false;
    let smallTargetCount = 0;

    for (const m of modes) {
      await page.click(`#modeSeg button[data-mode="${m}"]`);
      await page.waitForTimeout(100);

      // Check overflow
      const overflow = await page.evaluate(() => {
        const docOver = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const bodyOver = document.body.scrollWidth > document.body.clientWidth + 1;
        const shell = document.getElementById('shell');
        const shellOver = shell ? shell.scrollWidth > shell.clientWidth + 1 : false;
        return docOver || bodyOver || shellOver;
      });

      if (overflow) {
        console.error(`❌ Overflow detected in viewport ${vp.name} (${vp.width}x${vp.height}) mode: ${m}`);
        vpOverflow = true;
        suite3Passed = false;
      }

      // Check touch targets >= 43.5px
      const smallControls = await page.evaluate((currMode) => {
        const controls = [...document.querySelectorAll('button, [role="button"], a, select')];
        return controls.filter((el) => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          return rect.width < 43.5 || rect.height < 43.5;
        }).map(el => ({
          mode: currMode,
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          text: el.textContent.trim().slice(0, 20),
          w: Math.round(el.getBoundingClientRect().width * 10) / 10,
          h: Math.round(el.getBoundingClientRect().height * 10) / 10,
        }));
      }, m);

      if (smallControls.length > 0) {
        console.error(`❌ Small controls in ${vp.name} mode ${m}:`, JSON.stringify(smallControls));
        smallTargetCount += smallControls.length;
        suite3Passed = false;
      }
    }

    if (vp.name === 'iphone-se-narrow' || vp.name === '4k-smartboard') {
      await page.screenshot({ path: join(outputDir, `vp-${vp.name}.png`), fullPage: false });
    }

    console.log(`Viewport ${vp.name.padEnd(18)} (${String(vp.width).padStart(4)}x${String(vp.height).padEnd(4)}): Overflow=${vpOverflow ? '❌ FAIL' : '✅ NONE'}, SmallControls=${smallTargetCount === 0 ? '✅ 0' : '❌ ' + smallTargetCount}`);
    await page.close();
  }

  if (suite3Passed) {
    console.log('✅ SUITE 3 PASSED: All 10 viewports (320px to 3840px 4K) have ZERO horizontal overflow and strictly valid touch targets.');
    results.extremeViewports = true;
  }
}

// =========================================================================
// SUITE 4: AUDIO QUEUE COLLISION, SPACE HAMMERING & CLASSROOM ECHO RACE
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 4: Audio Queue Collision & Concurrency Stress ---');
console.log('======================================================');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const audioErrors = [];
  page.on('pageerror', err => audioErrors.push(`PageError: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') audioErrors.push(`ConsoleError: ${msg.text()}`);
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // 1. Hammer Space bar 30 times in 500ms
  console.log('Stress test 4.1: Hammering Space key 30 times in rapid succession...');
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(15);
  }

  // 2. Rapidly switch voice selector while audio triggers
  console.log('Stress test 4.2: Voice options switching during active speech...');
  const voiceSelect = await page.$('#selVoice');
  if (voiceSelect) {
    await voiceSelect.selectOption('us-male');
    await page.keyboard.press('Space');
    await page.waitForTimeout(20);
    await voiceSelect.selectOption('uk');
    await page.keyboard.press('Space');
    await page.waitForTimeout(20);
    await voiceSelect.selectOption('us-female');
  }

  // 3. Trigger Classroom Echo and interrupt with Space and card navigation
  console.log('Stress test 4.3: Interrupting Classroom Echo countdown via navigation & mode switch...');
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(50);
  // Interrupt immediately by switching card
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  // Hammer echo again
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(50);
  // Interrupt by switching mode
  await page.keyboard.press('2');
  await page.waitForTimeout(50);
  await page.keyboard.press('3');
  await page.waitForTimeout(50);
  await page.keyboard.press('1');
  await page.waitForTimeout(100);

  // Check echo box is clean and page has not thrown errors
  const echoState = await page.evaluate(() => {
    const echoBox = document.getElementById('echoBox');
    const btnEcho = document.getElementById('btnEcho');
    return {
      echoText: echoBox ? echoBox.innerHTML : null,
      btnDisabled: btnEcho ? btnEcho.disabled : null,
    };
  });

  let suite4Passed = true;
  if (audioErrors.length > 0) {
    console.error('❌ Audio concurrency errors:', audioErrors);
    errorsLogged.push(...audioErrors);
    suite4Passed = false;
  }
  if (echoState.btnDisabled === true) {
    console.error('❌ btnEcho was left disabled after cancellation!');
    suite4Passed = false;
  }

  if (suite4Passed) {
    console.log('✅ SUITE 4 PASSED: Space hammering, speech queue interruption, and Classroom Echo race conditions handled gracefully.');
    results.audioStress = true;
  }
  await page.close();
}

// =========================================================================
// SUITE 5: FULL PLAYTHROUGH OF ALL 36 QUIZ QUESTIONS
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 5: Full Playthrough of 36 Quiz Questions ---');
console.log('======================================================');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Switch to Quiz mode and set level to 'all'
  await page.click('#modeSeg button[data-mode="quiz"]');
  await page.click('#levelSeg button[data-level="all"]');
  await page.waitForTimeout(200);

  let suite5Passed = true;
  let correctAnswersCount = 0;

  console.log('Testing playthrough of all 36 quiz questions (answering correctly)...');
  for (let q = 0; q < 36; q++) {
    const qState = await page.evaluate(() => {
      const state = window.__getState?.();
      const prompt = document.getElementById('quizPrompt')?.textContent?.trim();
      const hint = document.getElementById('quizHint')?.textContent?.trim();
      const counter = document.getElementById('quizCounter')?.textContent?.trim();
      const img = document.getElementById('quizImg');
      const imgOk = img && img.src && img.complete;
      return {
        quizIndex: state?.quizIndex,
        quizTotal: state?.quizTotal,
        prompt,
        hint,
        counter,
        imgOk,
      };
    });

    if (qState.quizIndex !== q) {
      console.error(`❌ Question index mismatch! Expected ${q}, got ${qState.quizIndex}`);
      suite5Passed = false;
    }
    if (!qState.prompt || !qState.hint || !qState.imgOk) {
      console.error(`❌ Incomplete question data at index ${q}:`, qState);
      suite5Passed = false;
    }

    // Answer correctly
    const answerResult = await page.evaluate(() => {
      const item = curQuizItem;
      const choices = [...document.querySelectorAll('#quizChoices .choice-btn')];
      const correctBtn = choices.find(b => b.dataset.val === item.correct);
      if (!correctBtn) return { success: false, reason: 'Correct button not found' };
      correctBtn.click();
      const fb = document.getElementById('quizFeedback');
      const isOk = fb && fb.classList.contains('show-ok');
      return {
        success: isOk,
        feedback: fb?.textContent,
        streak: window.__getState?.()?.quizStreak,
      };
    });

    if (!answerResult.success || answerResult.streak !== (q + 1)) {
      console.error(`❌ Quiz question ${q + 1} answering failure:`, answerResult);
      suite5Passed = false;
    } else {
      correctAnswersCount++;
    }

    // Click Next
    await page.click('#btnQuizNext');
    await page.waitForTimeout(50);
  }

  // After 36 questions, should wrap back to index 0
  const wrapIndex = await page.evaluate(() => window.__getState?.()?.quizIndex);
  if (wrapIndex !== 0) {
    console.error(`❌ Quiz failed to wrap to index 0 after 36 questions, got: ${wrapIndex}`);
    suite5Passed = false;
  }

  // Test WRONG answer feedback and streak reset
  console.log('Testing wrong answer feedback and streak reset...');
  const wrongResult = await page.evaluate(() => {
    const item = curQuizItem;
    const choices = [...document.querySelectorAll('#quizChoices .choice-btn')];
    const wrongBtn = choices.find(b => b.dataset.val !== item.correct);
    if (!wrongBtn) return { success: false, reason: 'Wrong button not found' };
    wrongBtn.click();
    const fb = document.getElementById('quizFeedback');
    const isNo = fb && fb.classList.contains('show-no');
    return {
      success: isNo,
      streak: window.__getState?.()?.quizStreak,
    };
  });

  if (!wrongResult.success || wrongResult.streak !== 0) {
    console.error('❌ Quiz wrong answer did not reset streak to 0:', wrongResult);
    suite5Passed = false;
  } else {
    console.log('✅ Quiz wrong answer correctly resets streak to 0 and displays error explanation.');
  }

  // Test Grade level filtering in Quiz
  console.log('Testing Quiz grade level filters: P.4 (12), P.5 (12), P.6 (12)...');
  for (const [lvl, expectedCount] of [['p4', 12], ['p5', 12], ['p6', 12]]) {
    await page.click(`#levelSeg button[data-level="${lvl}"]`);
    await page.waitForTimeout(100);
    const count = await page.evaluate(() => window.__getState?.()?.quizTotal);
    if (count !== expectedCount) {
      console.error(`❌ Quiz level ${lvl} expected ${expectedCount} items, got: ${count}`);
      suite5Passed = false;
    }
  }

  if (suite5Passed && correctAnswersCount === 36) {
    console.log('✅ SUITE 5 PASSED: All 36 quiz questions functioned with 100% correct validation, streak tracking, and level filtering.');
    results.quizFullPlaythrough = true;
  }
  await page.close();
}

// =========================================================================
// SUITE 6: FULL PLAYTHROUGH OF ALL 12 BUILDER CHALLENGES
// =========================================================================
console.log('\n======================================================');
console.log('--- SUITE 6: Full Playthrough of 12 Builder Challenges ---');
console.log('======================================================');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Switch to Builder mode and set level to 'all'
  await page.click('#modeSeg button[data-mode="builder"]');
  await page.click('#levelSeg button[data-level="all"]');
  await page.waitForTimeout(200);

  let suite6Passed = true;
  let completedChallengesCount = 0;

  console.log('Testing playthrough of all 12 sentence builder challenges...');
  for (let b = 0; b < 12; b++) {
    const bState = await page.evaluate(() => {
      const state = window.__getState?.();
      const prompt = document.getElementById('builderThPrompt')?.textContent?.trim();
      const tenseTag = document.getElementById('builderTenseTag')?.textContent?.trim();
      const img = document.getElementById('builderImg');
      const imgOk = img && img.src && img.complete;
      const target = curBuilderItem?.target;
      return {
        builderIndex: state?.builderIndex,
        prompt,
        tenseTag,
        imgOk,
        target,
      };
    });

    if (bState.builderIndex !== b) {
      console.error(`❌ Builder index mismatch! Expected ${b}, got ${bState.builderIndex}`);
      suite6Passed = false;
    }

    // Solve challenge: place target words in exact order
    for (const targetWord of bState.target) {
      const placed = await page.evaluate((word) => {
        const bankTiles = [...document.querySelectorAll('#builderBank .word-tile')];
        const tile = bankTiles.find(t => t.textContent.trim() === word);
        if (!tile) return false;
        tile.click();
        return true;
      }, targetWord);

      if (!placed) {
        console.error(`❌ Builder ${b + 1}: Word '${targetWord}' could not be clicked in bank!`);
        suite6Passed = false;
      }
      await page.waitForTimeout(20);
    }

    // Check completion feedback
    const completion = await page.evaluate(() => {
      const fb = document.getElementById('builderFeedback');
      const isOk = fb && fb.classList.contains('ok');
      return {
        isOk,
        text: fb?.textContent,
      };
    });

    if (!completion.isOk) {
      console.error(`❌ Builder ${b + 1} completion failed!`, completion);
      suite6Passed = false;
    } else {
      completedChallengesCount++;
    }

    // Test interactive tile removal: click placed tile to return to bank
    if (b === 0) {
      console.log('Testing interactive tile removal (clicking slot tile returns to bank)...');
      const removeTest = await page.evaluate(() => {
        const slotsBefore = document.querySelectorAll('#builderSlots .word-tile').length;
        const lastSlot = document.querySelector('#builderSlots .word-tile:last-child');
        if (!lastSlot) return { ok: false, reason: 'No slot tile' };
        lastSlot.click();
        const slotsAfter = document.querySelectorAll('#builderSlots .word-tile').length;
        return { ok: slotsAfter === slotsBefore - 1, slotsBefore, slotsAfter };
      });
      if (!removeTest.ok) {
        console.error('❌ Interactive tile removal failed:', removeTest);
        suite6Passed = false;
      } else {
        console.log('✅ Interactive tile removal confirmed.');
      }
    }

    // Next challenge
    await page.click('#btnBuilderNext');
    await page.waitForTimeout(100);
  }

  // After 12 challenges, should wrap back to 0
  const wrapBuilder = await page.evaluate(() => window.__getState?.()?.builderIndex);
  if (wrapBuilder !== 0) {
    console.error(`❌ Builder failed to wrap to index 0, got: ${wrapBuilder}`);
    suite6Passed = false;
  }

  // Test reset button
  console.log('Testing Reset button in Builder...');
  await page.click('#builderBank .word-tile');
  await page.waitForTimeout(50);
  await page.click('#btnBuilderReset');
  await page.waitForTimeout(50);
  const resetState = await page.evaluate(() => {
    const slotsCount = document.querySelectorAll('#builderSlots .word-tile').length;
    const bankCount = document.querySelectorAll('#builderBank .word-tile').length;
    return { slotsCount, bankCount };
  });
  if (resetState.slotsCount !== 0 || resetState.bankCount !== 6) {
    console.error('❌ Builder reset failed:', resetState);
    suite6Passed = false;
  } else {
    console.log('✅ Builder reset button cleared slots and restored 6 bank tiles.');
  }

  if (suite6Passed && completedChallengesCount === 12) {
    console.log('✅ SUITE 6 PASSED: All 12 builder challenges completed with perfect tile matching, removal, reset, and level integrity.');
    results.builderFullPlaythrough = true;
  }
  await page.close();
}

await browser.close();
server.close();

// =========================================================================
// SUMMARY & VERDICT
// =========================================================================
console.log('\n======================================================');
console.log('================ CHALLENGER 1 VERDICT ================');
console.log('======================================================');
console.log(`1. Data Bank & Structural Integrity:  ${results.dataIntegrity ? '✅ PASS' : '❌ FAIL'}`);
console.log(`2. Rapid Mode Transitions (80x):      ${results.rapidTransitions ? '✅ PASS' : '❌ FAIL'}`);
console.log(`3. Extreme Viewports (320px to 4K):   ${results.extremeViewports ? '✅ PASS' : '❌ FAIL'}`);
console.log(`4. Audio Collision & Concurrency:     ${results.audioStress ? '✅ PASS' : '❌ FAIL'}`);
console.log(`5. Quiz Full Playthrough (36 Items):  ${results.quizFullPlaythrough ? '✅ PASS' : '❌ FAIL'}`);
console.log(`6. Builder Full Playthrough (12 Items): ${results.builderFullPlaythrough ? '✅ PASS' : '❌ FAIL'}`);

const allPassed = Object.values(results).every(Boolean) && errorsLogged.length === 0;

console.log(`\nFINAL VERDICT: ${allPassed ? '🎉 APPROVE (Robust & Bug-Free)' : '❌ REJECT (Defects Detected)'}`);
console.log('======================================================\n');

process.exit(allPassed ? 0 : 1);

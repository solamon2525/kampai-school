import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const worksheetPath = join(publicRoot, 'games/english/english-tenses-p6-worksheet.html');

console.log('================================================================');
console.log('CHALLENGER 2: ADVERSARIAL VERIFICATION SUITE');
console.log('Target: public/games/english/english-tenses-p6-worksheet.html');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

// -------------------------------------------------------------
// SUITE 1: 48 QUESTIONS GRAMMAR, CLUES & KEYS AUDIT
// -------------------------------------------------------------
console.log('--- SUITE 1: Question Bank & Grammar Correctness Audit (48 items) ---');
const htmlSource = readFileSync(worksheetPath, 'utf8');
const itemsMatch = htmlSource.match(/const ITEMS = (\[[\s\S]*?\n\]);/);
assert(Boolean(itemsMatch), 'Found ITEMS array definition in worksheet HTML');

let items = [];
try {
  items = eval(itemsMatch[1]);
} catch (err) {
  assert(false, 'Successfully parsed ITEMS array', err.message);
}

assert(items.length === 48, `Expected exactly 48 items, found: ${items.length}`);

const g4Items = items.filter(it => it.grade === 4);
const g5Items = items.filter(it => it.grade === 5);
const g6Items = items.filter(it => it.grade === 6);

assert(g4Items.length === 16, `Grade 4 items: expected 16, got ${g4Items.length}`);
assert(g5Items.length === 16, `Grade 5 items: expected 16, got ${g5Items.length}`);
assert(g6Items.length === 16, `Grade 6 items: expected 16, got ${g6Items.length}`);

const validTypes = new Set(['form', 'signal', 'transform', 'use']);
let grammarErrors = [];

items.forEach((item, idx) => {
  const itemNo = idx + 1;
  if (!validTypes.has(item.type)) {
    grammarErrors.push(`Item #${itemNo}: Invalid type "${item.type}"`);
  }
  if (!item.prompt || typeof item.prompt !== 'string' || item.prompt.trim().length < 5) {
    grammarErrors.push(`Item #${itemNo}: Empty or too short prompt: "${item.prompt}"`);
  }
  if (!item.clue || typeof item.clue !== 'string' || item.clue.trim().length < 5) {
    grammarErrors.push(`Item #${itemNo}: Clue is missing or too brief: "${item.clue}"`);
  }
  if (!item.answer || typeof item.answer !== 'string' || item.answer.trim().length === 0) {
    grammarErrors.push(`Item #${itemNo}: Empty answer key`);
  }

  // Pedagogical & grammatical consistency spot checks:
  if (item.prompt.includes('Tom ___ (walk)')) {
    if (item.answer !== 'walks') grammarErrors.push(`Item #${itemNo}: Tom walk should be walks, got ${item.answer}`);
  }
  if (item.prompt.includes('Listen! The baby ___ (cry)')) {
    if (item.answer !== 'is crying') grammarErrors.push(`Item #${itemNo}: baby cry should be is crying, got ${item.answer}`);
  }
  if (item.prompt.includes('She ___ (wash) her hands')) {
    if (item.answer !== 'washes') grammarErrors.push(`Item #${itemNo}: She wash should be washes, got ${item.answer}`);
  }
  if (item.prompt.includes('yesterday') && item.prompt.includes('watch')) {
    if (item.answer !== 'watched') grammarErrors.push(`Item #${itemNo}: past of watch should be watched, got ${item.answer}`);
  }
  if (item.prompt.includes('go') && item.prompt.includes('last week')) {
    if (item.answer !== 'went') grammarErrors.push(`Item #${itemNo}: past of go should be went, got ${item.answer}`);
  }
  if (item.prompt.includes('tomorrow') && item.prompt.includes('help')) {
    if (item.answer !== 'will help') grammarErrors.push(`Item #${itemNo}: future of help should be will help, got ${item.answer}`);
  }
  if (item.prompt.includes('The sun ___ (rise)')) {
    if (item.answer !== 'rises') grammarErrors.push(`Item #${itemNo}: sun rise should be rises, got ${item.answer}`);
  }
  if (item.prompt.includes('The train ___ (arrive)')) {
    if (item.answer !== 'is arriving') grammarErrors.push(`Item #${itemNo}: train arrive should be is arriving, got ${item.answer}`);
  }
});

assert(grammarErrors.length === 0, 'All 48 questions have valid grammatical keys and clear step-tag clues', grammarErrors.join('; '));

// -------------------------------------------------------------
// SUITE 2: HTTP STATIC SERVER & BROWSER TESTING
// -------------------------------------------------------------
console.log('\n--- SUITE 2: Dual Viewport, Grade Filters & Layout Matrix ---');

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
      filePath = worksheetPath;
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
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const worksheetUrl = `http://127.0.0.1:${port}/games/english/english-tenses-p6-worksheet.html`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Catch page errors
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') pageErrors.push(msg.text());
});

await page.goto(worksheetUrl, { waitUntil: 'networkidle' });

assert(pageErrors.length === 0, 'Worksheet loaded with zero console/runtime errors', pageErrors.join('; '));

const title = await page.title();
assert(title.includes('ใบงาน English Tenses'), `Page title correct: "${title}"`);

// Viewport checks
for (const vp of [{ name: 'mobile', w: 360, h: 800 }, { name: 'desktop', w: 1280, h: 720 }]) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.waitForTimeout(50);
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  assert(noHScroll, `[Viewport ${vp.name} (${vp.w}x${vp.h})] Zero horizontal overflow (scrollWidth <= clientWidth + 1)`);
}

// -------------------------------------------------------------
// SUITE 3: GRADE FILTER & QUESTION COUNT COMBINATIONS
// -------------------------------------------------------------
console.log('\n--- SUITE 3: Grade Filters (all, 4, 5, 6) x Question Counts (5, 10) Matrix ---');

const gradeOptions = ['all', '4', '5', '6'];
const countOptions = [5, 10];

for (const grade of gradeOptions) {
  for (const count of countOptions) {
    const caseLabel = `Grade: ${grade} | Count: ${count}`;
    await page.selectOption('#selGrade', grade);
    await page.selectOption('#selCount', String(count));
    await page.waitForTimeout(50);

    // Check questions container class
    const hasCountClass = await page.$eval('.questions', (el, c) => el.classList.contains(`count-${c}`), count);
    assert(hasCountClass, `[${caseLabel}] .questions has .count-${count} class`);

    // Check question count on page
    const qCount = await page.$$eval('.questions .q', qs => qs.length);
    assert(qCount === count, `[${caseLabel}] Rendered exactly ${count} questions (got ${qCount})`);

    // Check grade badges
    const badges = await page.$$eval('.questions .q .skill-tag', tags => tags.map(t => t.textContent.trim()));
    if (grade === '4') {
      const allP4 = badges.every(b => b.startsWith('ป.4'));
      assert(allP4, `[${caseLabel}] All ${badges.length} questions are Grade 4 (ป.4)`);
    } else if (grade === '5') {
      const allP5 = badges.every(b => b.startsWith('ป.5'));
      assert(allP5, `[${caseLabel}] All ${badges.length} questions are Grade 5 (ป.5)`);
    } else if (grade === '6') {
      const allP6 = badges.every(b => b.startsWith('ป.6'));
      assert(allP6, `[${caseLabel}] All ${badges.length} questions are Grade 6 (ป.6)`);
    } else if (grade === 'all') {
      const validBadges = badges.every(b => b.startsWith('ป.4') || b.startsWith('ป.5') || b.startsWith('ป.6'));
      assert(validBadges, `[${caseLabel}] All questions have valid grade prefix in 'all' mode`);
    }

    // Check that prompt, step-tag, and answer-line exist in every question
    const structuralIntegrity = await page.$$eval('.questions .q', qs => {
      return qs.every(q => {
        const hasPrompt = Boolean(q.querySelector('.q-prompt'));
        const hasStepTag = Boolean(q.querySelector('.step-tag'));
        const hasStepBody = Boolean(q.querySelector('.step-body .work-fill'));
        const hasAnswerLine = Boolean(q.querySelector('.answer-line .answer-fill'));
        return hasPrompt && hasStepTag && hasStepBody && hasAnswerLine;
      });
    });
    assert(structuralIntegrity, `[${caseLabel}] Every question has full structure (.q-prompt, .step-tag, .work-fill, .answer-fill)`);
  }
}

// Topic Stress Testing across all 5 topics and 4 grades
console.log('\n--- SUITE 3B: Topic Filtering Stress Test (5 topics x 4 grades) ---');
const topics = ['mixed', 'form', 'signal', 'transform', 'use'];
for (const topic of topics) {
  for (const grade of ['all', '4', '5', '6']) {
    await page.selectOption('#selTopic', topic);
    await page.selectOption('#selGrade', grade);
    await page.selectOption('#selCount', '5');
    await page.waitForTimeout(50);
    const qCount = await page.$$eval('.questions .q', qs => qs.length);
    assert(qCount === 5, `[Topic: ${topic}, Grade: ${grade}] Renders exactly 5 questions without fallback crash`);
    const validPrompts = await page.$$eval('.questions .q .q-prompt', prompts => {
      return prompts.every(p => p.textContent.trim().length > 0 && !p.textContent.includes('undefined'));
    });
    assert(validPrompts, `[Topic: ${topic}, Grade: ${grade}] All prompts are valid and non-empty`);
  }
}
await page.selectOption('#selTopic', 'mixed');
await page.waitForTimeout(50);

// Multi-page test: 2 pages and 3 pages
console.log('\n--- SUITE 4: Multi-Page and Booklet Layout Tests ---');
await page.selectOption('#selPageCount', '2');
await page.selectOption('#selCount', '5');
await page.waitForTimeout(50);
let sheetCount = await page.$$eval('#pages .sheet', sheets => sheets.length);
assert(sheetCount === 2, `2-page selection renders exactly 2 sheets (got ${sheetCount})`);

await page.selectOption('#selPageCount', '3');
await page.waitForTimeout(50);
sheetCount = await page.$$eval('#pages .sheet', sheets => sheets.length);
assert(sheetCount === 3, `3-page selection renders exactly 3 sheets (got ${sheetCount})`);

// Booklet style test
await page.selectOption('#selStyle', 'booklet');
await page.waitForTimeout(50);
const hasCover = await page.$eval('#pages .sheet', s => s.classList.contains('cover-sheet'));
sheetCount = await page.$$eval('#pages .sheet', sheets => sheets.length);
assert(hasCover && sheetCount === 4, `Booklet style renders cover-sheet + 3 sheets (total 4 sheets, got ${sheetCount})`);

// Reset back to standard 1 page
await page.selectOption('#selStyle', 'standard');
await page.selectOption('#selPageCount', '1');
await page.waitForTimeout(50);

// -------------------------------------------------------------
// SUITE 5: ADVERSARIAL ZERO-SHIFT LAYOUT STRESS TEST
// -------------------------------------------------------------
console.log('\n--- SUITE 5: Adversarial 0px Vertical Layout Shift Stress Test ---');

// We test both count=5 and count=10 across grades
const shiftTestConfigs = [
  { grade: 'all', count: 5 },
  { grade: 'all', count: 10 },
  { grade: '4', count: 5 },
  { grade: '4', count: 10 },
  { grade: '5', count: 5 },
  { grade: '5', count: 10 },
  { grade: '6', count: 5 },
  { grade: '6', count: 10 }
];

for (const cfg of shiftTestConfigs) {
  const label = `Grade ${cfg.grade}, Count ${cfg.count}`;
  await page.selectOption('#selGrade', cfg.grade);
  await page.selectOption('#selCount', String(cfg.count));
  await page.waitForTimeout(50);

  // Measure bounding rects in hidden state
  const beforeBBoxes = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const questions = document.querySelector('.questions');
    const qList = Array.from(document.querySelectorAll('.questions .q')).map((q, idx) => {
      const rect = q.getBoundingClientRect();
      const stemRect = q.querySelector('.q-stem')?.getBoundingClientRect();
      const workRect = q.querySelector('.step-block')?.getBoundingClientRect();
      const footRect = q.querySelector('.q-foot')?.getBoundingClientRect();
      const answerFill = q.querySelector('.answer-fill')?.getBoundingClientRect();
      return {
        idx,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        stemHeight: stemRect?.height || 0,
        workHeight: workRect?.height || 0,
        footHeight: footRect?.height || 0,
        answerFillHeight: answerFill?.height || 0
      };
    });
    const sheetRect = sheet.getBoundingClientRect();
    const qContainerRect = questions.getBoundingClientRect();
    return {
      sheetHeight: sheetRect.height,
      sheetTop: sheetRect.top,
      qContainerHeight: qContainerRect.height,
      qList
    };
  });

  // Action 1: Toggle show all answers
  await page.click('#btnAnswers');
  await page.waitForTimeout(50);

  const isShowAnswers = await page.evaluate(() => document.body.classList.contains('show-answers'));
  assert(isShowAnswers, `[${label}] #btnAnswers activated .show-answers class`);

  const afterShowBBoxes = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const questions = document.querySelector('.questions');
    const qList = Array.from(document.querySelectorAll('.questions .q')).map((q, idx) => {
      const rect = q.getBoundingClientRect();
      const stemRect = q.querySelector('.q-stem')?.getBoundingClientRect();
      const workRect = q.querySelector('.step-block')?.getBoundingClientRect();
      const footRect = q.querySelector('.q-foot')?.getBoundingClientRect();
      const answerFill = q.querySelector('.answer-fill')?.getBoundingClientRect();
      return {
        idx,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        stemHeight: stemRect?.height || 0,
        workHeight: workRect?.height || 0,
        footHeight: footRect?.height || 0,
        answerFillHeight: answerFill?.height || 0
      };
    });
    const sheetRect = sheet.getBoundingClientRect();
    const qContainerRect = questions.getBoundingClientRect();
    return {
      sheetHeight: sheetRect.height,
      sheetTop: sheetRect.top,
      qContainerHeight: qContainerRect.height,
      qList
    };
  });

  // Compare sheet height shift
  const deltaSheetHeight = Math.abs(afterShowBBoxes.sheetHeight - beforeBBoxes.sheetHeight);
  const deltaQContainerHeight = Math.abs(afterShowBBoxes.qContainerHeight - beforeBBoxes.qContainerHeight);
  assert(deltaSheetHeight < 0.01, `[${label}] .sheet height shift is exactly 0px (Δ = ${deltaSheetHeight.toFixed(4)}px)`);
  assert(deltaQContainerHeight < 0.01, `[${label}] .questions container height shift is exactly 0px (Δ = ${deltaQContainerHeight.toFixed(4)}px)`);

  // Compare each question
  let maxQHeightShift = 0;
  let maxQTopShift = 0;
  for (let i = 0; i < beforeBBoxes.qList.length; i++) {
    const b = beforeBBoxes.qList[i];
    const a = afterShowBBoxes.qList[i];
    const dH = Math.abs(a.height - b.height);
    const dT = Math.abs(a.top - b.top);
    if (dH > maxQHeightShift) maxQHeightShift = dH;
    if (dT > maxQTopShift) maxQTopShift = dT;
  }
  assert(maxQHeightShift < 0.01, `[${label}] Max question height shift is exactly 0px (max Δ = ${maxQHeightShift.toFixed(4)}px)`);
  assert(maxQTopShift < 0.01, `[${label}] Max question vertical top position shift is exactly 0px (max Δ = ${maxQTopShift.toFixed(4)}px)`);

  // Action 2: Step-by-step reveal verification
  // First toggle off
  await page.click('#btnAnswers');
  await page.waitForTimeout(50);

  // Now reveal sequentially question by question
  let stepShiftError = false;
  for (let step = 1; step <= cfg.count; step++) {
    await page.click('#btnAnswerNext');
    const revealedCount = await page.$$eval('.questions .q.reveal-answer', qs => qs.length);
    if (revealedCount !== step) {
      stepShiftError = true;
      assert(false, `[${label}] Step ${step}: expected ${step} revealed questions, got ${revealedCount}`);
      break;
    }

    // Measure height shift during step reveal
    const stepBBox = await page.evaluate(() => {
      return {
        sheetHeight: document.querySelector('.sheet').getBoundingClientRect().height,
        qContainerHeight: document.querySelector('.questions').getBoundingClientRect().height
      };
    });
    if (Math.abs(stepBBox.sheetHeight - beforeBBoxes.sheetHeight) > 0.01) {
      stepShiftError = true;
      assert(false, `[${label}] Step ${step}: Sheet height shifted during step reveal!`);
      break;
    }
  }
  if (!stepShiftError) {
    assert(true, `[${label}] Step-by-step reveal across all ${cfg.count} questions produced exactly 0px vertical layout shift`);
  }

  // Reverse step by step back to 0
  for (let step = cfg.count; step >= 1; step--) {
    await page.click('#btnAnswerPrev');
  }
  const remainingRevealed = await page.$$eval('.questions .q.reveal-answer', qs => qs.length);
  assert(remainingRevealed === 0, `[${label}] Sequential step-prev returned revealCount to 0`);
}

// -------------------------------------------------------------
// SUITE 6: TEACHING PURPOSE MODES MOUNTING (worksheet-modes.js)
// -------------------------------------------------------------
console.log('\n--- SUITE 6: Teaching Purpose Modes Mounting & Switching ---');

// Check that #selUseMode is mounted
const hasUseModeSelect = await page.$eval('#selUseMode', el => Boolean(el));
assert(hasUseModeSelect, '#selUseMode dropdown mounted properly in toolbar');

const modeOptions = await page.$$eval('#selUseMode option', opts => opts.map(o => o.value));
assert(modeOptions.includes('standard'), '#selUseMode has "standard" option');
assert(modeOptions.includes('differentiated'), '#selUseMode has "differentiated" option');
assert(modeOptions.includes('exit'), '#selUseMode has "exit" option');
assert(modeOptions.includes('diagnostic'), '#selUseMode has "diagnostic" option');
assert(modeOptions.includes('remedial'), '#selUseMode has "remedial" option');

// Mode 1: Differentiated (A-B-C)
await page.selectOption('#selUseMode', 'differentiated');
await page.waitForTimeout(100);
const diffSheets = await page.$$eval('.sheet', sheets => sheets.length);
const diffBadges = await page.$$eval('.worksheet-mode-badge', badges => badges.map(b => b.textContent.trim()));
assert(diffSheets === 3, `Differentiated mode renders 3 sheets (got ${diffSheets})`);
assert(diffBadges.includes('ชุด A · ทบทวน'), `Differentiated Level 1 badge "ชุด A · ทบทวน" present (found: ${diffBadges.join(', ')})`);
assert(diffBadges.includes('ชุด B · มาตรฐาน'), 'Differentiated Level 2 badge "ชุด B · มาตรฐาน" present');
assert(diffBadges.includes('ชุด C · ท้าทาย'), 'Differentiated Level 3 badge "ชุด C · ท้าทาย" present');
const pageCountDisabled = await page.$eval('#selPageCount', el => el.disabled);
assert(pageCountDisabled, 'selPageCount is locked/disabled during differentiated mode');

// Mode 2: Exit Ticket (ตรวจเร็วท้ายคาบ)
await page.selectOption('#selUseMode', 'exit');
await page.waitForTimeout(100);
const exitSheets = await page.$$eval('.sheet', sheets => sheets.length);
const exitQuestions = await page.$$eval('.questions .q', qs => qs.length);
const exitBadge = await page.$eval('.worksheet-mode-badge', el => el.textContent.trim());
const hasReflection = await page.$eval('.worksheet-mode-reflection', el => Boolean(el));
assert(exitSheets === 1, `Exit mode renders 1 sheet (got ${exitSheets})`);
assert(exitQuestions === 5, `Exit mode trims to exactly 5 questions (got ${exitQuestions})`);
assert(exitBadge.includes('ตรวจเร็วท้ายคาบ · 5 ข้อ'), `Exit mode badge correct: "${exitBadge}"`);
assert(hasReflection, 'Exit mode reflection box (.worksheet-mode-reflection) present');

// Mode 3: Diagnostic (วินิจฉัยก่อนเรียน)
await page.selectOption('#selUseMode', 'diagnostic');
await page.waitForTimeout(100);
const diagSheets = await page.$$eval('.sheet', sheets => sheets.length);
const diagQuestions = await page.$$eval('.questions .q', qs => qs.length);
const diagBadge = await page.$eval('.worksheet-mode-badge', el => el.textContent.trim());
const hasDiagSummary = await page.$eval('.worksheet-mode-summary', el => Boolean(el));
const hasRemedialBtn = await page.$eval('#btnOpenRemedial', el => Boolean(el));
assert(diagSheets === 1, `Diagnostic mode renders 1 sheet (got ${diagSheets})`);
assert(diagQuestions === 5, `Diagnostic mode trims to 5 questions (got ${diagQuestions})`);
assert(diagBadge.includes('วินิจฉัยก่อนเรียน'), `Diagnostic mode badge correct: "${diagBadge}"`);
assert(hasDiagSummary, 'Diagnostic summary (.worksheet-mode-summary) present');
assert(hasRemedialBtn, '#btnOpenRemedial button present in diagnostic summary');

// Test interaction: click #btnOpenRemedial from diagnostic
await page.click('#btnOpenRemedial');
await page.waitForTimeout(150);
const curModeAfterClick = await page.$eval('#selUseMode', el => el.value);
assert(curModeAfterClick === 'remedial', '#btnOpenRemedial switched #selUseMode to "remedial"');

// Mode 4: Remedial (ซ่อมเสริมเฉพาะจุด)
const remBadge = await page.$eval('.worksheet-mode-badge', el => el.textContent.trim());
const hasRemGuide = await page.$eval('.worksheet-mode-guide', el => Boolean(el));
const hasRemSample = await page.$eval('.worksheet-mode-sample', el => Boolean(el));
assert(remBadge.includes('ซ่อมเสริมเฉพาะจุด'), `Remedial badge correct: "${remBadge}"`);
assert(hasRemGuide, 'Remedial step guide (.worksheet-mode-guide) present');
assert(hasRemSample, 'Remedial sample box (.worksheet-mode-sample) present');

// Return to Standard Mode
await page.selectOption('#selUseMode', 'standard');
await page.waitForTimeout(100);
const stdBadges = await page.$$eval('.worksheet-mode-badge', badges => badges.length);
const stdPageCountDisabled = await page.$eval('#selPageCount', el => el.disabled);
assert(stdBadges === 0, 'Standard mode cleaned up all mode badges');
assert(!stdPageCountDisabled, 'selPageCount unlocked upon return to standard mode');

// -------------------------------------------------------------
// SUITE 7: QR CODE & CURRICULUM INDICATORS DYNAMICS
// -------------------------------------------------------------
console.log('\n--- SUITE 7: QR Code & Curriculum Indicators Contract ---');

const qrImgSrc = await page.$eval('.qr-img', img => img.src);
assert(qrImgSrc.includes('api.qrserver.com') && qrImgSrc.includes('english-tenses-p6-media.html'), `QR Code targets companion media studio: "${qrImgSrc}"`);

// Test indicator resolution for each grade in config
const indicatorsByGrade = await page.evaluate(() => {
  const results = {};
  const sel = document.getElementById('selGrade');
  ['4', '5', '6', 'all'].forEach(g => {
    sel.value = g;
    results[g] = {
      label: window.WORKSHEET_CONFIG.gradeLabel,
      indicators: window.WORKSHEET_CONFIG.indicators
    };
  });
  return results;
});

assert(indicatorsByGrade['4'].label === 'ป.4' && indicatorsByGrade['4'].indicators.includes('ต 1.1 ป.4/2'), 'Grade 4 indicators match curriculum (ต 1.1 ป.4/2)');
assert(indicatorsByGrade['5'].label === 'ป.5' && indicatorsByGrade['5'].indicators.includes('ต 1.1 ป.5/2'), 'Grade 5 indicators match curriculum (ต 1.1 ป.5/2)');
assert(indicatorsByGrade['6'].label === 'ป.6' && indicatorsByGrade['6'].indicators.includes('ต 1.2 ป.6/1'), 'Grade 6 indicators match curriculum (ต 1.2 ป.6/1)');
assert(indicatorsByGrade['all'].label === 'ป.4–ป.6' && indicatorsByGrade['all'].indicators.includes('ต 2.2 ป.6/1'), 'Grade all indicators span ป.4–ป.6');

// -------------------------------------------------------------
// SUITE 8: VERIFY-WORKSHEET.MJS EXECUTION
// -------------------------------------------------------------
console.log('\n--- SUITE 8: Official verify-worksheet.mjs Verification ---');
try {
  const verifyOutput = execSync('node scripts/verify-worksheet.mjs public/games/english/english-tenses-p6-worksheet.html', {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const passed = verifyOutput.includes('PASS') && verifyOutput.includes('0 failure(s)');
  assert(passed, 'Official verify-worksheet.mjs passed 18/18 checks with 0 failures', verifyOutput.trim());
} catch (err) {
  assert(false, 'Official verify-worksheet.mjs failed', err.stdout || err.message);
}

await browser.close();
server.close();

console.log('\n================================================================');
console.log(`VERIFICATION COMPLETE: ${passedTests} passed, ${failedTests} failed out of ${totalTests} checks.`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nOVERALL VERDICT: REJECT - Detected failures during adversarial testing.');
  process.exit(1);
} else {
  console.log('\nOVERALL VERDICT: APPROVE - All adversarial tests passed with 100% precision.');
  process.exit(0);
}

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const worksheetPath = join(publicRoot, 'games/english/classroom-action-worksheet.html');
const mediaPath = join(publicRoot, 'games/english/classroom-action-media.html');

console.log('================================================================');
console.log('CHALLENGER 2: ADVERSARIAL VERIFICATION SUITE');
console.log('Target: public/games/english/classroom-action-worksheet.html');
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
// SUITE 1: 48 CURATED TPR COMMAND ITEMS AUDIT
// -------------------------------------------------------------
console.log('--- SUITE 1: Question Bank & Pedagogical Correctness Audit (48 items) ---');
const htmlSource = readFileSync(worksheetPath, 'utf8');
const itemsMatch = htmlSource.match(/const TPR_ITEMS = (\[[\s\S]*?\n  \]);/);
assert(Boolean(itemsMatch), 'Found TPR_ITEMS array definition in worksheet HTML');

let items = [];
try {
  items = eval(itemsMatch[1]);
} catch (err) {
  assert(false, 'Successfully parsed TPR_ITEMS array', err.message);
}

assert(items.length === 48, `Expected exactly 48 items, found: ${items.length}`);

const mItems = items.filter(it => it.type === 'movement');
const dItems = items.filter(it => it.type === 'direction');
const gItems = items.filter(it => it.type === 'gesture');
const eItems = items.filter(it => it.type === 'emotion');

assert(mItems.length === 12, `Movement category items: expected 12, got ${mItems.length}`);
assert(dItems.length === 12, `Direction category items: expected 12, got ${dItems.length}`);
assert(gItems.length === 12, `Gesture category items: expected 12, got ${gItems.length}`);
assert(eItems.length === 12, `Emotion category items: expected 12, got ${eItems.length}`);

const validCategories = new Set(['movement', 'direction', 'gesture', 'emotion']);
let auditErrors = [];

items.forEach((item, idx) => {
  const itemNo = idx + 1;
  if (!validCategories.has(item.type)) {
    auditErrors.push(`Item #${itemNo} (${item.id}): Invalid type "${item.type}"`);
  }
  if (!item.prompt || typeof item.prompt !== 'string' || item.prompt.trim().length < 5) {
    auditErrors.push(`Item #${itemNo} (${item.id}): Prompt too brief or empty: "${item.prompt}"`);
  }
  if (!item.command || typeof item.command !== 'string' || item.command.trim().length < 2) {
    auditErrors.push(`Item #${itemNo} (${item.id}): Command missing: "${item.command}"`);
  }
  if (!item.actionHint || typeof item.actionHint !== 'string' || item.actionHint.trim().length < 2) {
    auditErrors.push(`Item #${itemNo} (${item.id}): actionHint missing: "${item.actionHint}"`);
  }
  if (!item.typeHint || typeof item.typeHint !== 'string' || item.typeHint.trim().length < 2) {
    auditErrors.push(`Item #${itemNo} (${item.id}): typeHint missing: "${item.typeHint}"`);
  }
  if (!item.step1 || typeof item.step1 !== 'string' || item.step1.trim().length < 4) {
    auditErrors.push(`Item #${itemNo} (${item.id}): step1 missing or too brief: "${item.step1}"`);
  }
  if (!item.step2 || typeof item.step2 !== 'string' || item.step2.trim().length < 4) {
    auditErrors.push(`Item #${itemNo} (${item.id}): step2 missing or too brief: "${item.step2}"`);
  }
  if (!item.step3 || typeof item.step3 !== 'string' || item.step3.trim().length < 4) {
    auditErrors.push(`Item #${itemNo} (${item.id}): step3 missing or too brief: "${item.step3}"`);
  }
  if (!item.answer || typeof item.answer !== 'string' || item.answer.trim().length < 2) {
    auditErrors.push(`Item #${itemNo} (${item.id}): answer key empty or missing: "${item.answer}"`);
  }
});

assert(auditErrors.length === 0, 'All 48 TPR items have complete, high-quality fields and clues', auditErrors.join('; '));

// -------------------------------------------------------------
// SUITE 2: OFFICIAL VERIFY-WORKSHEET.MJS CHECK
// -------------------------------------------------------------
console.log('\n--- SUITE 2: Official verify-worksheet.mjs (18/18 checks) ---');
try {
  const verifyOutput = execSync('node scripts/verify-worksheet.mjs public/games/english/classroom-action-worksheet.html', {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const passed = verifyOutput.includes('PASS') && verifyOutput.includes('18 checks') && verifyOutput.includes('0 failure(s)');
  assert(passed, 'Official verify-worksheet.mjs passed 18/18 checks with 0 failures', verifyOutput.trim());
} catch (err) {
  assert(false, 'Official verify-worksheet.mjs failed', err.stdout || err.message);
}

// -------------------------------------------------------------
// SUITE 3: METADATA, HEAD & PRINT CONTRACT
// -------------------------------------------------------------
console.log('\n--- SUITE 3: Metadata, Head, Paired Media Contract & Print CSS ---');
assert(htmlSource.includes('lang="th"'), 'Document specifies lang="th"');
assert(htmlSource.includes('Sarabun'), 'Document loads Sarabun font');
assert(htmlSource.includes('<title>'), 'Document has <title> tag');
assert(
  htmlSource.includes('<meta name="worksheet-source-media" content="/games/english/classroom-action-media.html">'),
  'meta worksheet-source-media points to /games/english/classroom-action-media.html'
);
assert(
  htmlSource.includes('<meta name="curriculum-indicators" content="ต 1.1 ป.1/1, ต 1.1 ป.2/1, ต 1.1 ป.3/1, ต 1.2 ป.3/1">'),
  'meta curriculum-indicators lists primary school TPR standards'
);
assert(htmlSource.includes('worksheet-topic.css?v=2.0.0'), 'worksheet-topic.css loads with query v=2.0.0');
assert(htmlSource.includes('worksheet-modes.css?v=2.0.0'), 'worksheet-modes.css loads with query v=2.0.0');
assert(htmlSource.includes('worksheet-runtime.js?v=2.0.0'), 'worksheet-runtime.js loads with query v=2.0.0');
assert(htmlSource.includes('worksheet-topic.js?v=2.0.0'), 'worksheet-topic.js loads with query v=2.0.0');
assert(htmlSource.includes('worksheet-modes.js?v=2.0.0'), 'worksheet-modes.js loads with query v=2.0.0');
assert(existsSync(mediaPath), 'Paired media HTML file exists in repository');

// -------------------------------------------------------------
// SUITE 4: HTTP STATIC SERVER & BROWSER TESTING
// -------------------------------------------------------------
console.log('\n--- SUITE 4: HTTP Server, Dual Viewport & Responsiveness ---');

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
const worksheetUrl = `http://127.0.0.1:${port}/games/english/classroom-action-worksheet.html`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') pageErrors.push(msg.text());
});

await page.goto(worksheetUrl, { waitUntil: 'networkidle' });
assert(pageErrors.length === 0, 'Worksheet loads with 0 console or runtime errors', pageErrors.join('; '));

const pageTitle = await page.title();
assert(pageTitle.includes('TPR Commands') || pageTitle.includes('คำสั่ง'), `Title contains expected keywords: "${pageTitle}"`);

// Viewport checks
for (const vp of [{ name: 'mobile', w: 360, h: 800 }, { name: 'desktop', w: 1280, h: 720 }]) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.waitForTimeout(50);
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth
  }));
  const noHScroll = metrics.scrollW <= metrics.clientW + 1;
  assert(
    noHScroll,
    `[Viewport ${vp.name} (${vp.w}x${vp.h})] Zero horizontal overflow (scrollWidth <= clientWidth + 1)`,
    `scrollWidth=${metrics.scrollW}px, clientWidth=${metrics.clientW}px (overflow: +${metrics.scrollW - metrics.clientW}px)`
  );
}

// -------------------------------------------------------------
// SUITE 5: GRID LAYOUT MODES (10-q vs 5-q) & MULTI-PAGE
// -------------------------------------------------------------
console.log('\n--- SUITE 5: Grid Layout Modes (10-q vs 5-q) & Multi-Page Generation ---');

// 10-question per page layout
await page.selectOption('#selCount', '10');
await page.selectOption('#selPageCount', '1');
await page.waitForTimeout(50);

const hasCount10 = await page.$eval('.questions', el => el.classList.contains('count-10'));
const qCount10 = await page.$$eval('.questions .q', qs => qs.length);
assert(hasCount10, 'Count 10 option applies .count-10 class to .questions');
assert(qCount10 === 10, `Count 10 option renders exactly 10 questions (got ${qCount10})`);

// 5-question per page layout
await page.selectOption('#selCount', '5');
await page.waitForTimeout(50);

const hasCount5 = await page.$eval('.questions', el => el.classList.contains('count-5'));
const qCount5 = await page.$$eval('.questions .q', qs => qs.length);
assert(hasCount5, 'Count 5 option applies .count-5 class to .questions');
assert(qCount5 === 5, `Count 5 option renders exactly 5 questions (got ${qCount5})`);

// Check sizing difference between 5 and 10 question layouts
const minHeight5 = await page.$eval('.questions.count-5 .step-row', el => window.getComputedStyle(el).minHeight);
assert(minHeight5 && minHeight5 !== '0px', `Count 5 layout step-row has elevated min-height (${minHeight5}) for larger spacing`);

// Multi-page tests (1, 2, 3 pages)
for (const pages of [1, 2, 3]) {
  await page.selectOption('#selPageCount', String(pages));
  await page.selectOption('#selCount', '10');
  await page.waitForTimeout(50);

  const renderedSheets = await page.$$eval('#pages .sheet', sheets => sheets.length);
  const totalQuestions = await page.$$eval('#pages .sheet .questions .q', qs => qs.length);
  assert(
    renderedSheets === pages && totalQuestions === pages * 10,
    `Multi-page ${pages} page(s): renders ${renderedSheets} sheet(s) with ${totalQuestions} questions`
  );
}

// Booklet layout test
await page.selectOption('#selStyle', 'booklet');
await page.selectOption('#selPageCount', '2');
await page.waitForTimeout(50);

const bookletSheets = await page.$$eval('#pages .sheet', sheets => sheets.length);
const hasCoverSheet = await page.$eval('#pages .sheet:first-child', s => s.classList.contains('cover-sheet'));
assert(bookletSheets === 3 && hasCoverSheet, `Booklet style renders cover-sheet + 2 content sheets (total ${bookletSheets} sheets)`);

// Progressive layout test
await page.selectOption('#selStyle', 'progressive');
await page.selectOption('#selPageCount', '1');
await page.waitForTimeout(50);
const hasRating = await page.$eval('.questions .q:first-child .q-rating', el => el.textContent.includes('3'));
assert(hasRating, 'Progressive style renders .q-rating rubric indicator');

// Reset to standard 1-page 10-questions
await page.selectOption('#selStyle', 'standard');
await page.selectOption('#selPageCount', '1');
await page.selectOption('#selCount', '10');
await page.waitForTimeout(50);

// -------------------------------------------------------------
// SUITE 6: TOPIC CATEGORY FILTERING & FALLBACK
// -------------------------------------------------------------
console.log('\n--- SUITE 6: Topic Category Filtering & Large-Page Fallback ---');

const categories = [
  { val: 'movement', label: 'การเคลื่อนไหวพื้นฐาน' },
  { val: 'direction', label: 'ทิศทางและตำแหน่ง' },
  { val: 'gesture', label: 'ใบหน้าและอวัยวะ' },
  { val: 'emotion', label: 'อารมณ์และการแสดงออก' },
];

for (const cat of categories) {
  await page.selectOption('#selTopic', cat.val);
  await page.selectOption('#selCount', '10');
  await page.waitForTimeout(50);

  const tags = await page.$$eval('.questions .q .skill-tag', els => els.map(e => e.textContent.trim()));
  const allMatch = tags.every(t => t === cat.label);
  assert(allMatch, `Topic filter "${cat.val}": all 10 questions match category label "${cat.label}"`);
}

// Fallback test: Request 3 pages x 10 questions (30 items) from a category with only 12 items
await page.selectOption('#selTopic', 'movement');
await page.selectOption('#selPageCount', '3');
await page.selectOption('#selCount', '10');
await page.waitForTimeout(50);

const total30Questions = await page.$$eval('#pages .sheet .questions .q', qs => qs.length);
const hasUndefined = await page.$$eval('#pages .sheet .questions .q', qs => {
  return qs.some(q => q.textContent.includes('undefined') || q.textContent.includes('null'));
});
assert(total30Questions === 30 && !hasUndefined, '3-page category filter with 12 items falls back cleanly without undefined or crashes');

// Reset to mixed topic 1 page
await page.selectOption('#selTopic', 'mixed');
await page.selectOption('#selPageCount', '1');
await page.selectOption('#selCount', '10');
await page.waitForTimeout(50);

// -------------------------------------------------------------
// SUITE 7: SEED REPEATABILITY & RANDOMIZER STRESS TEST
// -------------------------------------------------------------
console.log('\n--- SUITE 7: Seed Repeatability (?seed=...) & Randomizer (🎲 สุ่มใหม่) ---');

// Test seed repeatability
const seedA = 771234;
await page.goto(`${worksheetUrl}?seed=${seedA}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(100);

const commandsSeedA_Run1 = await page.$$eval('.questions .q .eng-word', els => els.map(e => e.textContent.trim()));

// Reload with same seed
await page.goto(`${worksheetUrl}?seed=${seedA}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(100);
const commandsSeedA_Run2 = await page.$$eval('.questions .q .eng-word', els => els.map(e => e.textContent.trim()));

assert(
  JSON.stringify(commandsSeedA_Run1) === JSON.stringify(commandsSeedA_Run2),
  `Seed repeatability: identical question order on reload with ?seed=${seedA}`
);

// Load with different seed
const seedB = 999888;
await page.goto(`${worksheetUrl}?seed=${seedB}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(100);
const commandsSeedB = await page.$$eval('.questions .q .eng-word', els => els.map(e => e.textContent.trim()));

assert(
  JSON.stringify(commandsSeedA_Run1) !== JSON.stringify(commandsSeedB),
  `Different seed ?seed=${seedB} produces distinct pseudo-random permutation`
);

// Randomizer button stress test
let prevCommands = commandsSeedB;
let randomizerSuccessCount = 0;

for (let r = 1; r <= 3; r++) {
  await page.click('#btnRandom');
  await page.waitForTimeout(100);
  const newCommands = await page.$$eval('.questions .q .eng-word', els => els.map(e => e.textContent.trim()));
  if (JSON.stringify(newCommands) !== JSON.stringify(prevCommands)) {
    randomizerSuccessCount++;
  }
  prevCommands = newCommands;
}
assert(randomizerSuccessCount === 3, 'Clicking #btnRandom produces new randomized permutation 3 consecutive times');

// -------------------------------------------------------------
// SUITE 8: ADVERSARIAL ZERO-SHIFT BOUNDING RECT MEASUREMENT
// -------------------------------------------------------------
console.log('\n--- SUITE 8: Adversarial Zero-Shift Layout Shift Stress Test (100% of Questions) ---');

const shiftConfigs = [
  { topic: 'mixed', count: 10, label: 'Mixed 10-Q' },
  { topic: 'mixed', count: 5, label: 'Mixed 5-Q' },
  { topic: 'movement', count: 10, label: 'Movement 10-Q' },
  { topic: 'direction', count: 5, label: 'Direction 5-Q' },
  { topic: 'gesture', count: 10, label: 'Gesture 10-Q' },
  { topic: 'emotion', count: 5, label: 'Emotion 5-Q' }
];

for (const cfg of shiftConfigs) {
  await page.selectOption('#selTopic', cfg.topic);
  await page.selectOption('#selCount', String(cfg.count));
  await page.waitForTimeout(50);

  // Measure initial bounding rects in student view (hidden answers)
  const initialMetrics = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const questions = document.querySelector('.questions');
    const qList = Array.from(document.querySelectorAll('.questions .q')).map((q, idx) => {
      const qRect = q.getBoundingClientRect();
      const stemRect = q.querySelector('.q-stem')?.getBoundingClientRect();
      const workRect = q.querySelector('.step-block')?.getBoundingClientRect();
      const footRect = q.querySelector('.q-foot')?.getBoundingClientRect();
      const answerFill = q.querySelector('.answer-fill')?.getBoundingClientRect();
      const workFills = Array.from(q.querySelectorAll('.work-fill')).map(wf => wf.getBoundingClientRect());
      return {
        idx,
        top: qRect.top,
        height: qRect.height,
        stemHeight: stemRect?.height || 0,
        workHeight: workRect?.height || 0,
        footHeight: footRect?.height || 0,
        answerFillHeight: answerFill?.height || 0,
        workFillsHeights: workFills.map(wf => wf.height)
      };
    });
    return {
      sheetHeight: sheet.getBoundingClientRect().height,
      questionsHeight: questions.getBoundingClientRect().height,
      qList
    };
  });

  // Action 1: Toggle full reveal via #btnAnswers (.show-answers on body)
  await page.click('#btnAnswers');
  await page.waitForTimeout(50);

  const isRevealed = await page.evaluate(() => document.body.classList.contains('show-answers'));
  assert(isRevealed, `[${cfg.label}] #btnAnswers activates .show-answers`);

  const revealedMetrics = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    const questions = document.querySelector('.questions');
    const qList = Array.from(document.querySelectorAll('.questions .q')).map((q, idx) => {
      const qRect = q.getBoundingClientRect();
      const stemRect = q.querySelector('.q-stem')?.getBoundingClientRect();
      const workRect = q.querySelector('.step-block')?.getBoundingClientRect();
      const footRect = q.querySelector('.q-foot')?.getBoundingClientRect();
      const answerFill = q.querySelector('.answer-fill')?.getBoundingClientRect();
      const workFills = Array.from(q.querySelectorAll('.work-fill')).map(wf => wf.getBoundingClientRect());
      return {
        idx,
        top: qRect.top,
        height: qRect.height,
        stemHeight: stemRect?.height || 0,
        workHeight: workRect?.height || 0,
        footHeight: footRect?.height || 0,
        answerFillHeight: answerFill?.height || 0,
        workFillsHeights: workFills.map(wf => wf.height)
      };
    });
    return {
      sheetHeight: sheet.getBoundingClientRect().height,
      questionsHeight: questions.getBoundingClientRect().height,
      qList
    };
  });

  const deltaSheet = Math.abs(revealedMetrics.sheetHeight - initialMetrics.sheetHeight);
  const deltaQuestions = Math.abs(revealedMetrics.questionsHeight - initialMetrics.questionsHeight);
  assert(deltaSheet < 0.01, `[${cfg.label}] .sheet height shift is 0px (Δ = ${deltaSheet.toFixed(4)}px)`);
  assert(deltaQuestions < 0.01, `[${cfg.label}] .questions container height shift is 0px (Δ = ${deltaQuestions.toFixed(4)}px)`);

  let maxQHeightDelta = 0;
  let maxQTopDelta = 0;
  for (let i = 0; i < cfg.count; i++) {
    const init = initialMetrics.qList[i];
    const rev = revealedMetrics.qList[i];
    const dH = Math.abs(rev.height - init.height);
    const dT = Math.abs(rev.top - init.top);
    if (dH > maxQHeightDelta) maxQHeightDelta = dH;
    if (dT > maxQTopDelta) maxQTopDelta = dT;
  }
  assert(maxQHeightDelta < 0.01, `[${cfg.label}] Max question height shift is 0px (max Δ = ${maxQHeightDelta.toFixed(4)}px)`);
  assert(maxQTopDelta < 0.01, `[${cfg.label}] Max question top offset shift is 0px (max Δ = ${maxQTopDelta.toFixed(4)}px)`);

  // Action 2: Toggle off, then step reveal
  await page.click('#btnAnswers');
  await page.waitForTimeout(50);

  let stepShiftError = false;
  for (let step = 1; step <= cfg.count; step++) {
    await page.click('#btnAnswerNext');
    const stepMetrics = await page.evaluate(() => ({
      sheetHeight: document.querySelector('.sheet').getBoundingClientRect().height,
      questionsHeight: document.querySelector('.questions').getBoundingClientRect().height
    }));
    if (Math.abs(stepMetrics.sheetHeight - initialMetrics.sheetHeight) > 0.01) {
      stepShiftError = true;
      break;
    }
  }
  assert(!stepShiftError, `[${cfg.label}] Step-by-step reveal across all ${cfg.count} questions produces exactly 0px layout shift`);

  // Reverse back
  for (let step = cfg.count; step >= 1; step--) {
    await page.click('#btnAnswerPrev');
  }
}

// -------------------------------------------------------------
// SUITE 9: QR CODE LINK TO MEDIA STUDIO CONTRACT
// -------------------------------------------------------------
console.log('\n--- SUITE 9: QR Code Destination Link Contract ---');

const qrImgSrc = await page.$eval('.qr-img', img => img.src);
assert(qrImgSrc.includes('api.qrserver.com'), 'QR image uses standard QR server generator');

const qrUrlMatch = qrImgSrc.match(/[?&]data=([^&]+)/);
assert(Boolean(qrUrlMatch), 'QR code contains encoded data URL parameter');

const decodedDestination = decodeURIComponent(qrUrlMatch[1]);
console.log(`  Decoded QR destination URL: ${decodedDestination}`);
assert(
  decodedDestination.endsWith('/games/english/classroom-action-media.html'),
  `QR code destination links precisely to /games/english/classroom-action-media.html (got: ${decodedDestination})`
);

// -------------------------------------------------------------
// SUITE 10: TEACHING PURPOSE MODES (worksheet-modes.js)
// -------------------------------------------------------------
console.log('\n--- SUITE 10: Teaching Purpose Modes Mounting & Switching ---');

const hasUseMode = await page.$eval('#selUseMode', el => Boolean(el));
assert(hasUseMode, '#selUseMode dropdown mounted in toolbar by worksheet-modes.js');

// Differentiated Mode
await page.selectOption('#selUseMode', 'differentiated');
await page.waitForTimeout(100);
const diffSheets = await page.$$eval('.sheet', sheets => sheets.length);
const diffBadges = await page.$$eval('.worksheet-mode-badge', bs => bs.map(b => b.textContent.trim()));
assert(diffSheets === 3, `Differentiated mode generates 3 leveled sheets (got ${diffSheets})`);
assert(diffBadges.some(b => b.includes('ชุด A')), 'Differentiated Level 1 badge "ชุด A" present');
assert(diffBadges.some(b => b.includes('ชุด B')), 'Differentiated Level 2 badge "ชุด B" present');
assert(diffBadges.some(b => b.includes('ชุด C')), 'Differentiated Level 3 badge "ชุด C" present');

// Exit Ticket Mode
await page.selectOption('#selUseMode', 'exit');
await page.waitForTimeout(100);
const exitQuestions = await page.$$eval('.questions .q', qs => qs.length);
const hasReflection = await page.$eval('.worksheet-mode-reflection', el => Boolean(el));
assert(exitQuestions === 5, `Exit ticket mode sets questions count to 5 (got ${exitQuestions})`);
assert(hasReflection, 'Exit ticket mode mounts .worksheet-mode-reflection box');

// Diagnostic Mode
await page.selectOption('#selUseMode', 'diagnostic');
await page.waitForTimeout(100);
const hasDiagSummary = await page.$eval('.worksheet-mode-summary', el => Boolean(el));
const hasRemedialBtn = await page.$eval('#btnOpenRemedial', el => Boolean(el));
assert(hasDiagSummary && hasRemedialBtn, 'Diagnostic mode mounts summary and #btnOpenRemedial button');

// Click #btnOpenRemedial
await page.click('#btnOpenRemedial');
await page.waitForTimeout(100);
const curMode = await page.$eval('#selUseMode', el => el.value);
assert(curMode === 'remedial', '#btnOpenRemedial successfully transitions to remedial mode');

// Reset to Standard Mode
await page.selectOption('#selUseMode', 'standard');
await page.waitForTimeout(100);
const stdBadges = await page.$$eval('.worksheet-mode-badge', bs => bs.length);
assert(stdBadges === 0, 'Standard mode unmounts all mode badges');

// Close browser & server
await browser.close();
server.close();

// -------------------------------------------------------------
// SUITE 11: PRODUCTION BUILD INTEGRATION
// -------------------------------------------------------------
console.log('\n--- SUITE 11: Repository Production Build (pnpm build) ---');
try {
  const buildOutput = execSync('pnpm build', {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 120000
  });
  assert(true, 'Production build (pnpm build) compiled cleanly with exit code 0');
} catch (err) {
  assert(false, 'Production build failed', err.stdout || err.message);
}

console.log('\n================================================================');
console.log(`VERIFICATION COMPLETE: ${passedTests} passed, ${failedTests} failed out of ${totalTests} checks.`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nOVERALL VERDICT: REQUEST_CHANGES - Detected failures during adversarial testing.');
  process.exit(1);
} else {
  console.log('\nOVERALL VERDICT: APPROVE - All adversarial tests passed with 100% precision.');
  process.exit(0);
}

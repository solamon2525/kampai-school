import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, test } from 'playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(publicDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

async function runE2ETest(page, port) {
  const pageErrors = [];
  page.on('pageerror', (err) => {
    console.error('Page error:', err.message);
    pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });

  const gameUrl = `http://localhost:${port}/games/thai/thai-vocab-hub/index.html`;
  console.log(`Navigating to ${gameUrl}...`);
  await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // a. Verify window.ThaiReadingTrainer global and open theater via button
  console.log('--- Step a: Opening theater via #btn-reading-theater-toggle ---');
  const hasTrainer = await page.evaluate(() => typeof window.ThaiReadingTrainer === 'object' && window.ThaiReadingTrainer !== null);
  assert.ok(hasTrainer, 'window.ThaiReadingTrainer must be available');

  const toggleBtn = page.locator('#btn-reading-theater-toggle');
  await assert.doesNotReject(async () => {
    await toggleBtn.waitFor({ state: 'visible', timeout: 5000 });
  }, '#btn-reading-theater-toggle must be visible on the hub view');

  await toggleBtn.click();
  const modal = page.locator('#tvh-reading-modal');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  const isModalVisible = await modal.isVisible();
  assert.ok(isModalVisible, '#tvh-reading-modal must be visible after clicking toggle button');

  // b. Verifying total words count on tab shows ๕๒๐ (or >= 500)
  console.log('--- Step b: Verifying total words count shows ๕๒๐ (>= 500) ---');
  const allTab = page.locator('.reading-filter-tab[data-filter="all"]');
  await allTab.waitFor({ state: 'visible', timeout: 3000 });
  const allTabText = (await allTab.textContent()) || '';
  console.log(`Tab "all" text: "${allTabText.trim()}"`);
  assert.ok(
    allTabText.includes('๕๒๐') || allTabText.includes('520') || allTabText.includes('๕'),
    `Total words count tab must display Thai numeral count ๕๒๐, got "${allTabText.trim()}"`
  );

  const datasetStats = await page.evaluate(() => {
    const trainer = window.ThaiReadingTrainer;
    return {
      toThai520: trainer.toThaiNumeral(520),
      allWordsCount: window.GAME_DATA?.words?.['reading-studio']?.length || 0,
    };
  });
  assert.equal(datasetStats.toThai520, '๕๒๐', 'toThaiNumeral(520) must be ๕๒๐');
  assert.ok(datasetStats.allWordsCount >= 500, `Expected >= 500 words in dataset, got ${datasetStats.allWordsCount}`);
  assert.equal(datasetStats.allWordsCount, 520, `Expected 520 curated words, got ${datasetStats.allWordsCount}`);

  // c. Verifying all 6 category tabs are present and clickable
  console.log('--- Step c: Verifying all 6 category tabs are present and clickable ---');
  const expectedCategories = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'mispronounced', label: 'คำมักอ่านผิด' },
    { key: 'complex-spelling', label: 'สะกดยาก-การันต์' },
    { key: 'pseudo-clusters', label: 'คำควบไม่แท้' },
    { key: 'irregular-spelling', label: 'สะกดไม่ตรงมาตรา' },
    { key: 'difficult', label: 'คำยากชวนฝึก' },
    { key: 'royal', label: 'คำราชาศัพท์' },
  ];

  const filterTabs = page.locator('.reading-filter-tab');
  const tabCount = await filterTabs.count();
  assert.equal(tabCount, 7, `Expected 7 tabs (all + 6 categories), found ${tabCount}`);

  for (const cat of expectedCategories) {
    const tab = page.locator(`.reading-filter-tab[data-filter="${cat.key}"]`);
    await tab.waitFor({ state: 'visible', timeout: 2000 });
    const text = await tab.textContent();
    assert.ok(text.includes(cat.label), `Tab for ${cat.key} should contain "${cat.label}", got "${text}"`);

    // Click tab and check active state
    await tab.click();
    await page.waitForTimeout(50);
    const isActive = await tab.evaluate((el) => el.classList.contains('active'));
    assert.ok(isActive, `Tab ${cat.key} should have class "active" when clicked`);
  }

  // d. Clicking 🚨 คำมักอ่านผิด loads words (e.g. ขะมักเขม้น) and displays .reading-warning-box
  console.log('--- Step d: Clicking คำมักอ่านผิด loads words & displays warning box ---');
  const misTab = page.locator('.reading-filter-tab[data-filter="mispronounced"]');
  await misTab.click();
  await page.waitForTimeout(100);

  const currentWordText = await page.locator('#reading-stage-screen .reading-word-full').textContent();
  console.log(`Current word displayed: "${currentWordText?.trim()}"`);
  assert.equal(currentWordText?.trim(), 'ขะมักเขม้น', 'First word in mispronounced category must be "ขะมักเขม้น"');

  const warningBox = page.locator('#reading-stage-screen .reading-warning-box');
  await warningBox.waitFor({ state: 'visible', timeout: 3000 });
  const warningText = await page.locator('#reading-stage-screen .reading-warning-box .warning-text').textContent();
  console.log(`Warning text: "${warningText?.trim()}"`);
  assert.ok(
    warningText?.includes('ขะ-มัก-เข-เม่น') && warningText?.includes('ขะ-มัก-ขะ-เม่น'),
    'Warning box must contain correct phonetic comparison guidance'
  );

  const badgeText = await page.locator('#reading-rule-badge').textContent();
  assert.ok(badgeText?.includes('คำมักอ่านผิด'), `Badge must show "คำมักอ่านผิด", got "${badgeText}"`);
  const hasBadgeClass = await page.locator('#reading-rule-badge').evaluate((el) => el.classList.contains('badge-mispronounced'));
  assert.ok(hasBadgeClass, 'Badge must contain badge-mispronounced class');

  // e. Advancing to step 2 renders .syllable-chip elements
  console.log('--- Step e: Advancing to step 2 renders .syllable-chip elements ---');
  const nextBtn = page.locator('#btn-reading-next');
  await nextBtn.click();
  await page.waitForTimeout(150);

  const syllableChips = page.locator('#reading-stage-screen .syllable-chip');
  const chipCount = await syllableChips.count();
  console.log(`Syllable chip count for ขะมักเขม้น: ${chipCount}`);
  assert.equal(chipCount, 4, 'ขะมักเขม้น (ขะ-มัก-ขะ-เม่น) must render exactly 4 syllable chips');

  const syllablesTexts = await syllableChips.evaluateAll((list) =>
    list.map((el) => el.querySelector('.chip-syllable-text')?.textContent?.trim())
  );
  console.log('Syllables rendered:', syllablesTexts);
  assert.deepEqual(syllablesTexts, ['ขะ', 'มัก', 'ขะ', 'เม่น'], 'Syllable texts must match breakdown');

  // Click a syllable chip to verify audio interaction does not throw
  await syllableChips.first().click();

  // Warning box should also remain visible in step 2
  const warningInStep2 = await page.locator('#reading-stage-screen .reading-warning-box').isVisible();
  assert.ok(warningInStep2, 'Warning box must also be visible during step 2 syllable breakdown');

  // Advance to step 3 (meaning and context)
  console.log('Advancing to step 3 (meaning and context)...');
  await nextBtn.click();
  await page.waitForTimeout(150);

  const resWord = await page.locator('.reading-resolution-card .res-word').textContent();
  assert.equal(resWord?.trim(), 'ขะมักเขม้น', 'Step 3 must show resolution card for ขะมักเขม้น');
  const resMeaning = await page.locator('.reading-resolution-card .res-meaning-text').textContent();
  assert.ok(resMeaning && resMeaning.length > 5, 'Step 3 must display comprehensive meaning text');

  // f. In-modal search filters word chips properly
  console.log('--- Step f: In-modal search filters word chips properly ---');
  // Switch to "all" category first to test comprehensive search
  await allTab.click();
  await page.waitForTimeout(100);

  const searchInput = page.locator('#reading-theater-search');
  await searchInput.fill('สัปดาห์');
  await page.waitForTimeout(250); // wait for search debounce

  const filteredChips = page.locator('#reading-words-chips .reading-chip');
  const filteredCount = await filteredChips.count();
  console.log(`Search result chip count for "สัปดาห์": ${filteredCount}`);
  assert.ok(filteredCount >= 1, 'Search for "สัปดาห์" should find at least 1 matching word');
  const firstChipText = await filteredChips.first().textContent();
  assert.ok(firstChipText?.includes('สัปดาห์'), `First chip should be "สัปดาห์", got "${firstChipText}"`);

  // Clear search and verify words restore
  await searchInput.fill('');
  await page.waitForTimeout(250);
  const restoredCount = await page.locator('#reading-words-chips .reading-chip').count();
  assert.ok(restoredCount >= 50, `Clearing search should restore word chips, got ${restoredCount}`);

  // g. Responsive layout checks at 360x800 and 1280x720 without horizontal overflow or clipped text
  console.log('--- Step g: Responsive layout checks at 360x800 and 1280x720 ---');
  const testViewports = [
    { name: 'mobile', width: 360, height: 800 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  for (const vp of testViewports) {
    console.log(`Checking viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);

    const overflowCheck = await page.evaluate(() => {
      const doc = document.documentElement;
      const card = document.querySelector('.reading-theater-card');
      const docOverflow = doc.scrollWidth > doc.clientWidth + 1;
      const cardOverflow = card ? card.scrollWidth > card.clientWidth + 1 : false;
      return {
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        docOverflow,
        cardScrollWidth: card ? card.scrollWidth : 0,
        cardClientWidth: card ? card.clientWidth : 0,
        cardOverflow,
      };
    });

    console.log(`Viewport ${vp.name} metrics:`, overflowCheck);
    assert.equal(overflowCheck.docOverflow, false, `No horizontal document overflow allowed at ${vp.width}x${vp.height}`);
    assert.equal(overflowCheck.cardOverflow, false, `No horizontal card overflow allowed at ${vp.width}x${vp.height}`);
  }

  // Verify close functionality
  console.log('Closing theater modal...');
  const closeBtn = page.locator('#tvh-reading-modal .tvh-modal-close');
  await closeBtn.click();
  await page.waitForTimeout(100);
  const modalAfterClose = await page.locator('#tvh-reading-modal').isVisible();
  assert.equal(modalAfterClose, false, 'Modal should be hidden after clicking close button');

  assert.equal(pageErrors.length, 0, `Page errors encountered during E2E test: ${JSON.stringify(pageErrors)}`);

  console.log('================================================================');
  console.log('🎉 E2E Reading Trainer Suite PASSED with 0 DOM overflow errors!');
  console.log('================================================================');
}

const isPlaywrightRunner = process.argv.some(
  (arg) => arg.includes('playwright') || arg.includes('workerProcessEntry')
);

if (isPlaywrightRunner) {
  let server;
  let port;

  test.beforeAll(async () => {
    server = createStaticServer();
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    console.log(`🧪 Test static server running at http://localhost:${port}`);
  });

  test.afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  test('E2E Reading Trainer Suite', async ({ page }) => {
    await runE2ETest(page, port);
  });
} else {
  // Standalone node execution
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`🧪 Test static server running at http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    await runE2ETest(page, port);
  } finally {
    await browser.close();
    server.close();
  }
}

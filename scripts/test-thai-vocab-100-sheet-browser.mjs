import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/games/thai/thai-vocab-hub/index.html`;

const browser = await chromium.launch();
const pageErrors = [];

try {
  // 1. Desktop 1280x720 + A4 Preview test
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await desktopCtx.newPage();
  page.on('pageerror', (err) => pageErrors.push(`desktop: ${err.message}`));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.ThaiVocabWorksheet && !!window.ThaiVocabSheet100);

  await page.click('button:has-text("พิมพ์ใบงาน A4")');
  await page.waitForSelector('#tvh-worksheet-modal', { state: 'visible' });
  assert.equal(await page.inputValue('#ws-type'), 'vocab-sheet-100', 'Hub modal should default to vocab-sheet-100');
  assert.equal(await page.isVisible('#ws-100-panel'), true, '100-word category panel must be visible');

  // Randomize 4 categories & verify summary updates
  await page.click('#ws100-btn-rand4');
  const summaryText = await page.textContent('#ws100-pool-summary');
  assert.ok(summaryText && summaryText.includes('เลือก 4 หมวด'), `Summary must reflect 4 categories, got: ${summaryText}`);

  // Check modal has zero horizontal overflow at 1280x720
  const modalOverflowDesktop = await page.locator('#tvh-worksheet-modal .tvh-modal-card').evaluate(el => el.scrollWidth > el.clientWidth + 1);
  assert.equal(modalOverflowDesktop, false, 'Modal must have no horizontal overflow at 1280x720');

  // Open preview popup
  const [popup] = await Promise.all([
    desktopCtx.waitForEvent('page'),
    page.click('button:has-text("เปิดหน้าพิมพ์ / Export PDF")'),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  popup.on('pageerror', (err) => pageErrors.push(`popup: ${err.message}`));

  const cellCount = await popup.locator('.student-sheet .vocab-cell').count();
  assert.equal(cellCount, 100, 'Preview sheet must render exactly 100 vocabulary cells');

  // Check A4 toolbar buttons exist
  assert.equal(await popup.locator('.preview-toolbar button:has-text("สั่งพิมพ์")').isVisible(), true);
  assert.equal(await popup.locator('.preview-toolbar button:has-text("บันทึกเป็น PDF")').isVisible(), true);
  assert.equal(await popup.locator('#btn-reroll-100').isVisible(), true);

  // Check A4 student sheet fits within 1 A4 portrait page height (281mm ~= 1062px at 96dpi, allow 2px rounding)
  const sheetMetrics = await popup.locator('.student-sheet').first().evaluate(el => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  assert.ok(
    sheetMetrics.scrollHeight <= sheetMetrics.clientHeight + 2,
    `Student sheet must fit inside 1 A4 page without vertical overflow (scrollH=${sheetMetrics.scrollHeight}, clientH=${sheetMetrics.clientHeight})`
  );
  assert.ok(
    sheetMetrics.scrollWidth <= sheetMetrics.clientWidth + 1,
    `Student sheet must have no horizontal overflow (scrollW=${sheetMetrics.scrollWidth}, clientW=${sheetMetrics.clientWidth})`
  );

  // Check teacher key sheet fits A4 without right-column or bottom clipping and has no notes box
  const keyMetrics = await popup.locator('.teacher-key-sheet').first().evaluate(el => {
    const sheetRect = el.getBoundingClientRect();
    const cols = Array.from(el.querySelectorAll('.key-col'));
    const rightCol = cols[cols.length - 1];
    const rightColRect = rightCol ? rightCol.getBoundingClientRect() : sheetRect;
    const rows = Array.from(el.querySelectorAll('.key-row'));
    const maxRowRight = Math.max(...rows.map(r => r.getBoundingClientRect().right));
    const maxRowBottom = Math.max(...rows.map(r => r.getBoundingClientRect().bottom));
    return {
      rowCount: rows.length,
      notesBoxCount: el.querySelectorAll('.teacher-notes-box').length,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      rightOverflowPx: Math.max(rightColRect.right, maxRowRight) - sheetRect.right,
      bottomOverflowPx: maxRowBottom - sheetRect.bottom,
    };
  });
  assert.equal(keyMetrics.notesBoxCount, 0, 'Teacher key must not render .teacher-notes-box');
  assert.equal(keyMetrics.rowCount, 100, 'Teacher key must render all 100 rows');
  assert.ok(keyMetrics.rightOverflowPx <= 1, `Teacher key right column clipped by ${keyMetrics.rightOverflowPx}px`);
  assert.ok(keyMetrics.bottomOverflowPx <= 1, `Teacher key bottom rows clipped by ${keyMetrics.bottomOverflowPx}px`);
  assert.ok(keyMetrics.scrollWidth <= keyMetrics.clientWidth + 1, `Teacher key horizontal overflow (${keyMetrics.scrollWidth} > ${keyMetrics.clientWidth})`);

  // Test reroll button in preview window
  const firstWordBefore = await popup.locator('.student-sheet .vocab-cell .cell-word').first().textContent();
  await popup.click('#btn-reroll-100');
  await popup.waitForTimeout(100);
  const cellCountAfterReroll = await popup.locator('.student-sheet .vocab-cell').count();
  assert.equal(cellCountAfterReroll, 100, 'Reroll must preserve 100 cells');

  await desktopCtx.close();

  // 2. Mobile 360x800 viewport check
  const mobileCtx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const mPage = await mobileCtx.newPage();
  mPage.on('pageerror', (err) => pageErrors.push(`mobile: ${err.message}`));

  await mPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await mPage.waitForFunction(() => !!window.ThaiVocabWorksheet && !!window.ThaiVocabSheet100);
  await mPage.click('button:has-text("พิมพ์ใบงาน A4")');
  await mPage.waitForSelector('#tvh-worksheet-modal', { state: 'visible' });

  const mobileOverflow = await mPage.locator('#tvh-worksheet-modal .tvh-modal-card').evaluate(el => ({
    sw: el.scrollWidth,
    cw: el.clientWidth,
    h: el.getBoundingClientRect().height,
  }));
  assert.ok(mobileOverflow.sw <= mobileOverflow.cw + 1, `Mobile modal must not overflow horizontally (${mobileOverflow.sw} > ${mobileOverflow.cw})`);
  assert.ok(mobileOverflow.h <= 800, `Mobile modal height must fit viewport (${mobileOverflow.h} <= 800)`);

  await mobileCtx.close();
  assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join('; ')}`);

  console.log(`✅ Browser & A4 layout verification passed! (first word: ${firstWordBefore}, A4 sheet: ${sheetMetrics.clientWidth}x${sheetMetrics.clientHeight}px)`);
} finally {
  await browser.close();
  server.close();
}

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('public');
const errors = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' };

function check(condition, message) {
  if (!condition) errors.push(message);
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root)) throw new Error('invalid path');
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/games/math/short-division-worksheet.html?seed=24680`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('https://**', async (route) => {
    const url = route.request().url();
    if (url.includes('/rest/v1/staff')) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    if (url.includes('qrserver.com')) return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.alloc(0) });
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.ShortDivisionWorksheet && document.querySelectorAll('#pages .q').length > 0);

  const traces = await page.evaluate(() => ({
    internalZero: window.ShortDivisionWorksheet.traceShortDivision(408, 4),
    leadingSkip: window.ShortDivisionWorksheet.traceShortDivision(1234, 12),
    twoDigitCarry: window.ShortDivisionWorksheet.traceShortDivision(98765, 99),
  }));
  check(traces.internalZero.quotient === 102, '408 ÷ 4 ต้องได้ผลหาร 102');
  check(traces.internalZero.quotientByColumn.join('') === '102', 'ผลหารที่มี 0 ตรงกลางต้องวางตรงหลัก');
  check(traces.leadingSkip.quotientByColumn[0] === '' && traces.leadingSkip.carryByColumn[1] === 1, 'หลักแรกน้อยกว่าตัวหารต้องข้ามและทดไปหลักถัดไป');
  check(traces.leadingSkip.quotient === 102 && traces.leadingSkip.remainder === 10, '1234 ÷ 12 ต้องได้ 102 เศษ 10');
  check(traces.twoDigitCarry.carryByColumn.some((value) => Number(value) >= 10), 'ต้องรองรับตัวทดสองหลัก');

  async function cards() {
    return page.locator('#pages .q').evaluateAll((nodes) => nodes.map((node) => ({
      dividend: Number(node.dataset.dividend), divisor: Number(node.dataset.divisor),
      quotient: Number(node.dataset.quotient), remainder: Number(node.dataset.remainder),
    })));
  }
  function validateCards(list, label) {
    check(new Set(list.map((item) => `${item.dividend}/${item.divisor}`)).size === list.length, `${label}: โจทย์ต้องไม่ซ้ำ`);
    list.forEach((item) => {
      check(item.divisor * item.quotient + item.remainder === item.dividend, `${label}: สมการตรวจต้องถูกต้อง`);
      check(item.remainder >= 0 && item.remainder < item.divisor, `${label}: เศษต้องน้อยกว่าตัวหาร`);
    });
  }

  const defaultCards = await cards();
  check(defaultCards.length === 6, 'ค่าเริ่มต้น ป.4 แบบผสมต้องมี 6 ข้อ');
  check(defaultCards.filter((item) => item.remainder === 0).length === 3, 'โหมดผสม 6 ข้อต้องมีโจทย์ลงตัว 3 ข้อ');
  validateCards(defaultCards, 'ค่าเริ่มต้น');
  const deterministicBefore = JSON.stringify(defaultCards);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('#pages .q').length === 6);
  check(JSON.stringify(await cards()) === deterministicBefore, 'seed เดิมต้องสร้างโจทย์เดิม');

  await page.selectOption('#selRemainder', 'exact');
  await page.waitForFunction(() => document.querySelectorAll('#pages .q').length === 8);
  const exactCards = await cards();
  check(exactCards.every((item) => item.remainder === 0), 'โหมดลงตัวต้องไม่มีเศษ');
  validateCards(exactCards, 'โหมดลงตัว');

  await page.selectOption('#selGrade', '6');
  await page.selectOption('#selRemainder', 'remainder');
  await page.waitForFunction(() => document.querySelectorAll('#pages .q').length === 6);
  const gradeSixCards = await cards();
  check(gradeSixCards.every((item) => String(item.dividend).length >= 4 && String(item.dividend).length <= 6), 'ป.6 ต้องใช้ตัวตั้ง 4–6 หลัก');
  check(gradeSixCards.every((item) => item.divisor >= 2 && item.divisor <= 99 && item.remainder > 0), 'ป.6 โหมดมีเศษต้องใช้ตัวหาร 1–2 หลักและมีเศษทุกข้อ');
  validateCards(gradeSixCards, 'ป.6 มีเศษ');

  await page.selectOption('#selGrade', 'custom');
  await page.selectOption('#selDividendDigits', '6');
  await page.selectOption('#selDivisorDigits', '2');
  const customCards = await cards();
  check(customCards.every((item) => String(item.dividend).length === 6 && item.divisor >= 10), 'กำหนดเองต้องรองรับ 6 หลัก ÷ 2 หลัก');

  const sheetHeight = await page.locator('.sheet').first().evaluate((node) => node.getBoundingClientRect().height);
  check(await page.locator('.sd-answer').first().evaluate((node) => getComputedStyle(node).visibility === 'hidden'), 'คำตอบต้องซ่อนตอนเริ่ม');
  const remainderWork = await page.locator('.sd-remainder-work').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, answerVisible: getComputedStyle(node.querySelector('.sd-answer')).visibility })));
  check(remainderWork.length === defaultCards.length && remainderWork.every((item) => item.text.includes('เศษสุดท้าย') && item.answerVisible === 'hidden'), 'ทุกข้อควรมีช่องเศษสุดท้ายที่ซ่อนเฉลย');
  await page.click('#btnAnswerNext');
  check(await page.locator('.q').first().evaluate((node) => node.classList.contains('reveal-answer')), 'ปุ่มเฉลยถัดไปต้องเปิดทีละข้อ');
  check(Math.abs((await page.locator('.sheet').first().evaluate((node) => node.getBoundingClientRect().height)) - sheetHeight) < 0.5, 'เปิดเฉลยแล้วขนาด A4 ต้องไม่เปลี่ยน');
  await page.keyboard.press('ArrowLeft');
  check(await page.locator('.q.reveal-answer').count() === 0, 'ปุ่มลูกศรซ้ายต้องย้อนเฉลยได้');

  await page.selectOption('#selUseMode', 'exit');
  await page.waitForFunction(() => document.querySelectorAll('#pages .q').length === 5);
  check(await page.locator('.questions.count-5').count() === 1, 'โหมดตรวจเร็วต้องใช้ 5 ข้อ');

  await page.emulateMedia({ media: 'print' });
  const fit = await page.locator('#pages > .sheet').evaluateAll((sheets) => sheets.every((sheet) =>
    sheet.scrollHeight <= sheet.clientHeight + 1 && sheet.scrollWidth <= sheet.clientWidth + 1 &&
    Array.from(sheet.querySelectorAll('.q')).every((q) => q.getBoundingClientRect().bottom <= sheet.getBoundingClientRect().bottom + 1)
  ));
  check(fit, 'ทุกหน้าและทุกข้อในโหมด 5 ต้องอยู่ใน A4');
  check(pageErrors.length === 0, `browser page errors: ${pageErrors.join(' | ')}`);

  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }]) {
    await page.emulateMedia({ media: 'screen' });
    await page.setViewportSize(viewport);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const screenFit = await page.evaluate(() => ({
      documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      cardsFit: Array.from(document.querySelectorAll('.q')).every((card) => card.scrollWidth <= card.clientWidth + 1 && card.scrollHeight <= card.clientHeight + 1),
    }));
    check(screenFit.documentFits, `${viewport.width}px: หน้าจอต้องไม่ล้นในแนวนอน`);
    check(screenFit.cardsFit, `${viewport.width}px: กระดานโจทย์ต้องไม่ล้น`);
  }

  const mediaPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const mediaErrors = [];
  mediaPage.on('pageerror', (error) => mediaErrors.push(error.message));
  await mediaPage.goto(`http://127.0.0.1:${port}/games/math/short-division-thinking-media.html`, { waitUntil: 'networkidle' });
  await mediaPage.fill('#dividend', '963260');
  await mediaPage.fill('#divisor', '73');
  await mediaPage.click('#btnReveal');
  for (let index = 0; index < 20 && !(await mediaPage.locator('#btnNext').isDisabled()); index += 1) {
    await mediaPage.click('#btnNext');
  }
  const mediaFit = await mediaPage.evaluate(() => ({
    documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    boardFits: document.querySelector('.math-grid').scrollWidth <= document.querySelector('.math-grid').clientWidth + 1,
    remainder: document.querySelector('.remainder-summary')?.textContent || '',
  }));
  check(mediaFit.documentFits && mediaFit.boardFits, 'สื่อสอน 6 หลัก ÷ 2 หลักต้องไม่ล้นบนมือถือ');
  check(mediaFit.remainder.startsWith('เศษ '), 'ขั้นสรุปต้องแสดงเศษแยกจากหลักผลหาร');

  const presentationViewports = [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
  ];
  for (const viewport of presentationViewports) {
    await mediaPage.setViewportSize(viewport);
    await mediaPage.evaluate(() => window.ShortDivisionMedia.setPresentationMode(true));
    await mediaPage.waitForTimeout(80);
    const expectedScale = Math.max(1, Math.min(3, viewport.width / 1200, viewport.height / 650));
    const presentationFit = await mediaPage.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const board = rect('.board-card');
      const grid = rect('.math-grid');
      const explanation = rect('.explain-card');
      return {
        scale: window.ShortDivisionMedia.getPresentationScale(),
        active: document.body.classList.contains('presentation-mode'),
        hiddenChrome: getComputedStyle(document.querySelector('.sidebar')).display === 'none' &&
          getComputedStyle(document.querySelector('.intro-banner')).display === 'none' &&
          getComputedStyle(document.querySelector('.footer')).display === 'none',
        documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 &&
          document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1,
        boardFits: grid.left >= board.left - 1 && grid.right <= board.right + 1 && grid.top >= board.top - 1 && grid.bottom <= board.bottom + 1,
        explanationFits: explanation.right <= innerWidth + 1 && explanation.bottom <= innerHeight + 1,
        controlFont: parseFloat(getComputedStyle(document.querySelector('#btnNext')).fontSize),
        controlVar: getComputedStyle(document.body).getPropertyValue('--p-font-base').trim(),
      };
    });
    check(presentationFit.active && presentationFit.hiddenChrome, `${viewport.width}x${viewport.height}: โหมดจอใหญ่ต้องซ่อนแผงตั้งค่าและ footer`);
    check(Math.abs(presentationFit.scale - expectedScale) < 0.02, `${viewport.width}x${viewport.height}: scale ต้องพอดีจอและไม่เกิน 3x`);
    check(presentationFit.documentFits && presentationFit.boardFits && presentationFit.explanationFits, `${viewport.width}x${viewport.height}: กระดานและคำอธิบายต้องไม่ถูกตัด`);
    check(presentationFit.controlFont >= 14.5 * expectedScale, `${viewport.width}x${viewport.height}: ปุ่มควบคุมต้องขยายตามโหมดนำเสนอ (ได้ ${presentationFit.controlFont}px, var ${presentationFit.controlVar}, scale ${expectedScale.toFixed(2)})`);
  }
  check(Math.abs((await mediaPage.evaluate(() => window.ShortDivisionMedia.getPresentationScale())) - 3) < 0.02, 'จอ 4K ต้องขยายได้ถึง 3x');
  await mediaPage.keyboard.press('Escape');
  check(!(await mediaPage.evaluate(() => window.ShortDivisionMedia.isPresentationMode())), 'Escape ต้องออกจากโหมดจอใหญ่เมื่อไม่ได้ใช้ Fullscreen API');
  await mediaPage.setViewportSize({ width: 1280, height: 720 });
  await mediaPage.click('#btnPresentation');
  await mediaPage.waitForTimeout(80);
  check(await mediaPage.evaluate(() => window.ShortDivisionMedia.isPresentationMode()), 'ปุ่มจอใหญ่ต้องเปิดโหมดนำเสนอได้');
  const counterBefore = await mediaPage.locator('#stepCounter').textContent();
  await mediaPage.click('#btnPrev');
  check((await mediaPage.locator('#stepCounter').textContent()) !== counterBefore, 'ปุ่มย้อนกลับต้องทำงานในโหมดจอใหญ่');
  await mediaPage.click('#btnSpeakStage');
  await mediaPage.evaluate(() => window.ShortDivisionMedia.setPresentationMode(false));
  check(mediaErrors.length === 0, `media browser errors: ${mediaErrors.join(' | ')}`);
  await mediaPage.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (errors.length) {
  console.error(`Short-division worksheet verification failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Short-division worksheet verified: math, seeds, responsive 8/6/5 layouts, 1x-3x presentation media, reveal, and A4 fit');

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const reqPath = (req.url || '/').split('?')[0];
  const relPath = reqPath.endsWith('/') ? `${reqPath}index.html` : reqPath;
  const filePath = path.join(publicDir, relPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();
const baseUrl = `http://localhost:${port}`;

const browser = await chromium.launch();
const pageErrors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // 1. Test multiplication-worksheet.html (custom engine shown in user screenshot)
  await page.goto(`${baseUrl}/games/math/multiplication-worksheet.html`, { waitUntil: 'networkidle' });
  const multOpts = await page.$$eval('#selPageCount option', (opts) => opts.map((o) => o.value));
  assert.deepEqual(multOpts, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);

  for (const targetCount of ['4', '7', '10']) {
    await page.selectOption('#selPageCount', targetCount);
    const sheetCount = await page.$$eval('#pages > .sheet', (els) => els.length);
    assert.equal(sheetCount, Number(targetCount), `multiplication should render ${targetCount} sheets`);
  }

  // Test A-B-C mode lock & restore of 7 pages
  await page.selectOption('#selPageCount', '7');
  await page.selectOption('#selUseMode', 'differentiated');
  assert.equal(await page.$eval('#selPageCount', (el) => el.value), '3');
  assert.equal(await page.$eval('#selPageCount', (el) => el.disabled), true);
  await page.selectOption('#selUseMode', 'standard');
  assert.equal(await page.$eval('#selPageCount', (el) => el.value), '7');
  assert.equal(await page.$eval('#selPageCount', (el) => el.disabled), false);
  assert.equal(await page.$$eval('#pages > .sheet', (els) => els.length), 7);

  // 2. Test topic worksheet (clock-worksheet.html using worksheet-topic.js)
  await page.goto(`${baseUrl}/games/math/clock-worksheet.html`, { waitUntil: 'networkidle' });
  const clockOpts = await page.$$eval('#selPageCount option', (opts) => opts.map((o) => o.value));
  assert.deepEqual(clockOpts, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  await page.selectOption('#selPageCount', '6');
  assert.equal(await page.$$eval('#pages > .sheet', (els) => els.length), 6);

  // 3. Test rect-area-worksheet.html preserves special option 11 + default 11 + adds 1..10
  await page.goto(`${baseUrl}/games/math/rect-area-worksheet.html`, { waitUntil: 'networkidle' });
  const rectOpts = await page.$$eval('#selPageCount option', (opts) => opts.map((o) => o.value));
  assert.deepEqual(rectOpts, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
  assert.equal(await page.$eval('#selPageCount', (el) => el.value), '11');
  await page.selectOption('#selPageCount', '8');
  assert.equal(await page.$$eval('#pages > .sheet', (els) => els.length), 8);

  // 4. Test color-fill-pack.js stays fixed at 3 pages
  await page.goto(`${baseUrl}/games/english/weather-seasons-worksheet.html`, { waitUntil: 'networkidle' });
  const cfOpts = await page.$$eval('#selPageCount option', (opts) => opts.map((o) => o.value));
  assert.deepEqual(cfOpts, ['3']);

  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join('; ')}`);
  console.log('✅ All worksheet 1-10 sequential page count tests passed!');
} finally {
  await browser.close();
  server.close();
}

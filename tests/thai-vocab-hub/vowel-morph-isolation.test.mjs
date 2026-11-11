import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../public');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
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

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server listening on port ${port}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://localhost:${port}/games/thai/thai-vocab-hub/index.html`);
  await page.waitForLoadState('networkidle');

  // 1. Check that hub grid displays 17 categories
  const catCards = await page.locator('.hub-card').count();
  assert.equal(catCards, 17, `Hub grid must display 17 category cards, got ${catCards}`);

  // 2. Select a regular category (e.g. misspelled or idioms) and verify NO .badge-morph-trigger exists
  await page.evaluate(() => {
    window.selectCategory('misspelled');
  });
  await page.waitForTimeout(300);

  const morphBadgesInMisspelled = await page.locator('.badge-morph-trigger').count();
  assert.equal(morphBadgesInMisspelled, 0, `There must be 0 morph badges in 'misspelled' category, got ${morphBadgesInMisspelled}`);

  // Check another category (e.g. lesson)
  await page.evaluate(() => {
    window.returnToHub();
    window.selectCategory('lesson');
  });
  await page.waitForTimeout(300);
  const morphBadgesInLesson = await page.locator('.badge-morph-trigger').count();
  assert.equal(morphBadgesInLesson, 0, `There must be 0 morph badges in 'lesson' category, got ${morphBadgesInLesson}`);

  // 3. Select 'vowel-morph' category
  await page.evaluate(() => {
    window.returnToHub();
    window.selectCategory('vowel-morph');
  });
  await page.waitForTimeout(300);

  // In vowel-morph category:
  // a) Hero banner must be visible
  const heroBannerVisible = await page.locator('#vowel-morph-hero-banner').isVisible();
  assert.ok(heroBannerVisible, 'Hero banner #vowel-morph-hero-banner must be visible in vowel-morph category');

  // b) Word cards in grid should have morph triggers
  const morphBadgesInVowelMorph = await page.locator('.badge-morph-trigger').count();
  assert.ok(morphBadgesInVowelMorph > 0, `Must have morph badges in vowel-morph category, got ${morphBadgesInVowelMorph}`);

  console.log('✅ Task 2 Isolation and UI test passed!');

  await browser.close();
  server.close();
});

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const repoRoot = path.resolve('.');
const port = 64755;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(repoRoot, 'public', urlPath);
  if (urlPath === '/') filePath = path.join(repoRoot, 'public', 'games', 'english', 'alphabet-phonics-media.html');

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, async () => {
  console.log(`Testing ABC Phonics Media at http://127.0.0.1:${port}/games/english/alphabet-phonics-media.html`);
  const browser = await chromium.launch();
  let passed = true;

  try {
    for (const vp of [{ name: 'mobile', width: 360, height: 800 }, { name: 'desktop', width: 1280, height: 720 }]) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/games/english/alphabet-phonics-media.html`, { waitUntil: 'networkidle' });

      // 1. Check overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`Horizontal overflow: ${overflow ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
      if (overflow) passed = false;

      // 2. Check interactive touch target sizes
      const smallTargets = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a, select, [role="button"]'));
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 43 || rect.height < 43);
        }).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          text: (el.textContent || '').trim().substring(0, 20),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height)
        }));
      });
      console.log(`Touch targets < 44px: ${smallTargets.length > 0 ? `❌ ${smallTargets.length} small elements` : '✅ 0 small controls (PASS)'}`);
      if (smallTargets.length > 0) {
        console.log('Small targets:', smallTargets.slice(0, 5));
        passed = false;
      }

      // 3. Check image load
      const imgLoaded = await page.evaluate(() => {
        const img = document.getElementById('cardImg');
        return img && img.naturalWidth > 0;
      });
      console.log(`Flashcard Image loaded: ${imgLoaded ? '✅ YES' : '❌ NO'}`);
      if (!imgLoaded) passed = false;

      // 4. Test Mode Grid
      await page.click('#tabModeGrid');
      await page.waitForTimeout(300);
      const gridCount = await page.evaluate(() => document.querySelectorAll('.grid-card').length);
      console.log(`Grid cards rendered: ${gridCount === 26 ? '✅ 26 cards (PASS)' : `❌ ${gridCount} cards (FAIL)`}`);
      if (gridCount !== 26) passed = false;

      // 5. Test Mode Practice (Quiz)
      await page.click('#tabModePractice');
      await page.waitForTimeout(300);
      const choicesCount = await page.evaluate(() => document.querySelectorAll('.quiz-choice').length);
      console.log(`Quiz choices rendered: ${choicesCount === 3 ? '✅ 3 choices (PASS)' : `❌ ${choicesCount} choices (FAIL)`}`);
      if (choicesCount !== 3) passed = false;

      await context.close();
    }
  } catch (err) {
    console.error('Test execution error:', err);
    passed = false;
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nOverall Result: ${passed ? '🎉 ALL CHECKS PASSED PERFECTLY!' : '❌ SOME CHECKS FAILED'}`);
  process.exit(passed ? 0 : 1);
});

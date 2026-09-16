#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const targetPath = join(publicRoot, 'games/english/phonics-media.html');
const outputDir = resolve(repoRoot, 'output/phonics-media-check');
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
      'Access-Control-Allow-Origin': '*'
    });
    createReadStream(filePath).pipe(res);
  });
}

const server = createStaticServer();
await new Promise((res) => server.listen(0, '127.0.0.1', res));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/games/english/phonics-media.html`;

console.log(`Testing Phonics Media at ${baseUrl}`);
const browser = await chromium.launch({ headless: true });

const viewports = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1280, height: 720 },
];

let allPassed = true;

for (const vp of viewports) {
  console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Check 1: Horizontal Overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });
  console.log(`Horizontal overflow: ${overflow ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
  if (overflow) allPassed = false;

  // Check 2: Controls touch target size >= 44x44
  const smallControls = await page.evaluate(() => {
    return [...document.querySelectorAll('button, [role="button"], a')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map((el) => ({
        label: el.id || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 25),
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height),
      }));
  });
  console.log(`Touch targets < 44px: ${smallControls.length === 0 ? '✅ 0 small controls (PASS)' : '❌ Found ' + smallControls.length}`);
  if (smallControls.length > 0) {
    console.error('Small controls details:', JSON.stringify(smallControls));
    allPassed = false;
  }

  // Check 3: State & Content Verification
  const state = await page.evaluate(() => window.__getState?.());
  console.log(`Active state: Group=${state?.group}, TotalGroups=${state?.totalGroups}, CurWord=${state?.curWord}, WordsInGroup=${state?.totalWordsInGroup}`);
  if (!state || state.totalWordsInGroup < 10) {
    console.error('❌ Expected at least 10 words in group! Got:', state?.totalWordsInGroup);
    allPassed = false;
  } else {
    console.log(`✅ Word count requirement satisfied: ${state.totalWordsInGroup} words >= 10`);
  }

  // Check 4: Test Studio Card Image and Blending
  const imgLoaded = await page.evaluate(() => {
    const img = document.getElementById('cardImg');
    return img && img.complete && img.naturalWidth > 0;
  });
  console.log(`Focus Card Image loaded: ${imgLoaded ? '✅ YES' : '❌ NO'}`);
  if (!imgLoaded) allPassed = false;

  // Take Screenshot of Studio View
  await page.screenshot({ path: join(outputDir, `phonics-studio-${vp.name}.png`), fullPage: true });

  // Check 5: Switch to Gallery View and capture screenshot
  await page.click('#tabModeGallery');
  await page.waitForTimeout(300);
  const galleryCount = await page.evaluate(() => document.querySelectorAll('#galleryGrid .gallery-card').length);
  console.log(`Gallery cards rendered: ${galleryCount >= 10 ? '✅ ' + galleryCount + ' cards (PASS)' : '❌ ' + galleryCount}`);
  if (galleryCount < 10) allPassed = false;
  await page.screenshot({ path: join(outputDir, `phonics-gallery-${vp.name}.png`), fullPage: true });

  // Check 6: Switch to Practice Quiz View and capture screenshot
  await page.click('#tabModePractice');
  await page.waitForTimeout(300);
  const quizChoicesCount = await page.evaluate(() => document.querySelectorAll('#quizChoicesGrid .choice-card').length);
  console.log(`Quiz choices rendered: ${quizChoicesCount >= 3 ? '✅ ' + quizChoicesCount + ' choices (PASS)' : '❌ ' + quizChoicesCount}`);
  if (quizChoicesCount < 3) allPassed = false;
  await page.screenshot({ path: join(outputDir, `phonics-quiz-${vp.name}.png`), fullPage: true });

  // Check 7: Switch groups (e.g. Blends & Digraphs)
  await page.click('#tabModeLearn');
  await page.waitForTimeout(200);
  const blendTab = page.locator('.unit-btn').filter({ hasText: 'Blends' });
  await blendTab.click();
  await page.waitForTimeout(300);
  const blendWord = await page.evaluate(() => window.__getState?.()?.curWord);
  console.log(`Switched to Blends group, first word: ${blendWord} (Expected chair)`);
  if (blendWord !== 'chair') allPassed = false;

  await page.close();
}

await browser.close();
server.close();

console.log(`\nOverall Verification Result: ${allPassed ? '🎉 ALL CHECKS PASSED PERFECTLY!' : '❌ SOME CHECKS FAILED'}`);
process.exit(allPassed ? 0 : 1);
